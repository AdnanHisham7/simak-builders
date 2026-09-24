import React, { useState, useEffect } from "react";
import {
  Camera,
  Plus,
  Film,
  Image as ImageIcon,
  Calendar,
  User,
  Clock,
  Download,
  Trash2,
  Play,
  Eye,
  Filter,
  Sparkles,
} from "lucide-react";
import { getSiteMedia, deleteStory } from "../../services/storyService";
import type { StoryItem, StoryGroup } from "../../services/storyService";
import { CreateStoryModal } from "../stories/CreateStoryModal";
import { StoryViewerModal } from "../stories/StoryViewerModal";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import { toast } from "sonner";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface SiteMediaTabProps {
  siteId: string;
  siteName: string;
  userType?: string | null;
}

export const SiteMediaTab: React.FC<SiteMediaTabProps> = ({
  siteId,
  siteName,
  userType,
}) => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const currentUserId = String(currentUser?._id || (currentUser as any)?.id || "");
  const [activeStories, setActiveStories] = useState<StoryItem[]>([]);
  const [allMedia, setAllMedia] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "image" | "video">("all");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    initialGroupIndex: number;
    initialStoryIndex: number;
    customGroups?: StoryGroup[];
  }>({
    isOpen: false,
    initialGroupIndex: 0,
    initialStoryIndex: 0,
  });

  const [previewMedia, setPreviewMedia] = useState<StoryItem | null>(null);
  const [mediaToDelete, setMediaToDelete] = useState<string | null>(null);
  const [isDeletingMedia, setIsDeletingMedia] = useState(false);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const data = await getSiteMedia(siteId);
      setActiveStories(data?.activeStories || []);
      setAllMedia(data?.mediaArchive || (data as any)?.allMedia || []);
    } catch (err) {
      console.error("Failed to load site media:", err);
      toast.error("Failed to load site media.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [siteId]);

  const handleDelete = (e: React.MouseEvent, storyId: string) => {
    e.stopPropagation();
    setMediaToDelete(storyId);
  };

  const handleConfirmDelete = async () => {
    if (!mediaToDelete) return;
    setIsDeletingMedia(true);
    try {
      await deleteStory(mediaToDelete);
      toast.success("Media deleted successfully");
      fetchMedia();
      if (previewMedia?._id === mediaToDelete) setPreviewMedia(null);
      setMediaToDelete(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete media.");
    } finally {
      setIsDeletingMedia(false);
    }
  };

  const handlePlayArchiveMedia = (index: number) => {
    if (filteredMedia.length === 0) return;
    const virtualGroup: StoryGroup = {
      user: {
        _id: `site-${siteId}`,
        name: siteName,
        role: "Permanent Media Archive",
      },
      stories: filteredMedia,
      hasUnseen: false,
      storyCount: filteredMedia.length,
      latestCreatedAt: filteredMedia[0]?.createdAt || "",
    };

    setViewerState({
      isOpen: true,
      initialGroupIndex: 0,
      initialStoryIndex: index,
      customGroups: [virtualGroup],
    });
  };

  const filteredMedia = allMedia.filter((item) => {
    if (filterType === "all") return true;
    return item.mediaType === filterType;
  });

  const canDeleteMedia = (item: StoryItem) => {
    if (userType === "admin") return true;
    const currentUserId = (currentUser as any)?.id || (currentUser as any)?._id;
    return item.createdBy?._id === currentUserId;
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="rounded-2xl border border-console-border bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                <Camera className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-console-text dark:text-zinc-100">
                Site Media & Daily Updates
              </h2>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-console-muted dark:text-zinc-400">
              Permanent visual archive and field updates for {siteName}.
            </p>
          </div>

          {userType !== "client" && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 via-amber-500 to-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-500/20 hover:opacity-95 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Post Site Story / Media</span>
            </button>
          )}
        </div>
      </div>

      {/* Permanent Media Archive Section (Styled with Rich Story Cards) */}
      <div className="rounded-2xl border border-console-border bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Permanent Media Archive
              </h3>
              <span className="rounded-full bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900 text-brand-700 dark:text-brand-300 px-2.5 py-0.5 text-xs font-semibold">
                {allMedia.length} {allMedia.length === 1 ? "item" : "items"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Every photo and video ever uploaded to this site with complete uploader attribution, timestamps, and full-screen story playback.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                filterType === "all"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              All ({allMedia.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("image")}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                filterType === "image"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <ImageIcon className="h-3 w-3" /> Photos
            </button>
            <button
              type="button"
              onClick={() => setFilterType("video")}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                filterType === "video"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Film className="h-3 w-3" /> Videos
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-zinc-400">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 text-center">
            <Camera className="h-10 w-10 text-zinc-400 mb-2" />
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              No media found in the archive
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
              Photos and videos uploaded for this site are permanently stored here.
            </p>
            {userType !== "client" && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Post First Media
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {filteredMedia.map((item, idx) => {
              const uploader = (item.user as any) || (item as any).createdBy;
              const uploaderImage = uploader?.profileImage || uploader?.avatar;
              const uploaderName = uploader?.name || "User";

              return (
                <div
                  key={item._id}
                  onClick={() => handlePlayArchiveMedia(idx)}
                  className="group relative rounded-2xl overflow-hidden aspect-[9/14] bg-zinc-950 cursor-pointer shadow-md hover:shadow-xl transition-all border border-zinc-200 dark:border-zinc-800 hover:border-brand-500 dark:hover:border-brand-500 hover:scale-[1.02]"
                >
                  {/* Media background */}
                  {item.mediaType === "video" ? (
                    <video
                      src={item.mediaUrl}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <img
                      src={item.mediaUrl}
                      alt={item.caption || "Site media"}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}

                  {/* Gradient overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60" />

                  {/* Top: Uploader info & Type badge */}
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="h-6 w-6 rounded-full bg-brand-600 border border-white flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0 overflow-hidden">
                        {uploaderImage ? (
                          <img src={uploaderImage} alt={uploaderName} className="h-full w-full object-cover" />
                        ) : (
                          <span>{uploaderName.charAt(0)}</span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-white truncate drop-shadow">
                        {uploaderName.split(" ")[0]}
                      </span>
                    </div>

                    <span className="rounded-full bg-black/60 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-semibold text-white/90 flex items-center gap-0.5 border border-white/10">
                      {item.mediaType === "video" ? (
                        <>
                          <Film className="h-2.5 w-2.5 text-amber-400" /> Video
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-2.5 w-2.5 text-brand-400" /> Photo
                        </>
                      )}
                    </span>
                  </div>

                  {/* Center Play Button for Video or Preview indicator */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {item.mediaType === "video" ? (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white group-hover:scale-110 group-hover:bg-brand-500 transition-all border border-white/20">
                        <Play className="h-5 w-5 fill-white ml-0.5" />
                      </div>
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all border border-white/20">
                        <Eye className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  {/* Bottom: Caption & Details & Actions */}
                  <div className="absolute bottom-2.5 inset-x-2.5 z-10 text-white">
                    {item.caption && (
                      <p className="text-xs font-normal line-clamp-2 text-zinc-100 mb-1.5 drop-shadow leading-snug">
                        {item.caption}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-zinc-300 pt-1 border-t border-white/10">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={item.mediaUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Download"
                          className="p-1 rounded-full text-zinc-300 hover:text-white hover:bg-white/20 transition-colors"
                        >
                          <Download className="h-3 w-3" />
                        </a>
                        {canDeleteMedia(item) && (
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, item._id)}
                            title="Delete"
                            className="p-1 rounded-full text-rose-300 hover:text-rose-100 hover:bg-rose-500/40 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fullscreen Preview Modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            {/* Header info */}
            <div className="w-full flex items-center justify-between text-white pb-3">
              {(() => {
                const uploader = (previewMedia.user as any) || (previewMedia as any).createdBy;
                const uploaderImage = uploader?.profileImage || uploader?.avatar;
                const uploaderName = uploader?.name || "User";
                return (
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-brand-500 flex items-center justify-center font-bold text-white text-xs uppercase overflow-hidden">
                      {uploaderImage ? (
                        <img src={uploaderImage} alt={uploaderName} className="h-full w-full object-cover" />
                      ) : (
                        <span>{uploaderName.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{uploaderName}</p>
                      <p className="text-xs text-zinc-400">
                        Uploaded on {new Date(previewMedia.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center gap-2">
                <a
                  href={previewMedia.mediaUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 flex items-center gap-1"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewMedia(null)}
                  className="rounded-full bg-zinc-800 p-2 text-zinc-200 hover:bg-zinc-700"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Media content */}
            <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden rounded-2xl bg-zinc-950 max-h-[70vh]">
              {previewMedia.mediaType === "video" ? (
                <video
                  src={previewMedia.mediaUrl}
                  controls
                  autoPlay
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <img
                  src={previewMedia.mediaUrl}
                  alt={previewMedia.caption || "Site preview"}
                  className="max-h-full max-w-full object-contain"
                />
              )}
            </div>

            {previewMedia.caption && (
              <div className="w-full mt-3 p-3 rounded-xl bg-zinc-900/80 text-zinc-200 text-sm text-center">
                {previewMedia.caption}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {userType !== "client" && (
        <CreateStoryModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          initialSiteId={siteId}
          onStoryCreated={() => {
            toast.success("Site story posted!");
            fetchMedia();
          }}
        />
      )}

      {viewerState.isOpen && (
        <StoryViewerModal
          isOpen={viewerState.isOpen}
          onClose={() =>
            setViewerState((prev) => ({
              ...prev,
              isOpen: false,
              initialStoryIndex: 0,
              customGroups: undefined,
            }))
          }
          groups={viewerState.customGroups || []}
          initialGroupIndex={viewerState.initialGroupIndex}
          initialStoryIndex={viewerState.initialStoryIndex}
          currentUserId={(currentUser as any)?._id || (currentUser as any)?.id || ""}
          currentUserRole={userType || ""}
          onStoriesUpdated={fetchMedia}
        />
      )}

      <ConfirmationModal
        isOpen={!!mediaToDelete}
        onClose={() => setMediaToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Media Item"
        description="Are you sure you want to delete this media item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        theme="danger"
        isLoading={isDeletingMedia}
      />
    </div>
  );
};
