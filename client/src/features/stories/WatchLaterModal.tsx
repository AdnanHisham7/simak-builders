import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Bookmark,
  BookmarkX,
  Play,
  Building2,
  Calendar,
  Eye,
  Archive,
  Sparkles,
  User as UserIcon,
  Search,
} from "lucide-react";
import {
  getWatchLaterStories,
  toggleSaveStory,
  getStoryArchive,
} from "../../services/storyService";
import type { StoryItem } from "../../services/storyService";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";

export type SavedArchiveTab = "saved" | "my-archive" | "general-archive";

interface WatchLaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayStory: (
    story: StoryItem,
    allStories: StoryItem[],
    groupTitle: string
  ) => void;
  initialTab?: SavedArchiveTab;
}

export const WatchLaterModal: React.FC<WatchLaterModalProps> = ({
  isOpen,
  onClose,
  onPlayStory,
  initialTab = "saved",
}) => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const currentUserId = String(
    currentUser?._id || (currentUser as any)?.id || ""
  );

  const [activeTab, setActiveTab] = useState<SavedArchiveTab>(initialTab);
  const [savedStories, setSavedStories] = useState<StoryItem[]>([]);
  const [myArchiveStories, setMyArchiveStories] = useState<StoryItem[]>([]);
  const [generalArchiveStories, setGeneralArchiveStories] = useState<StoryItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTabStories = async (tab: SavedArchiveTab) => {
    try {
      setLoading(true);
      if (tab === "saved") {
        const data = await getWatchLaterStories();
        const list = Array.isArray(data) ? data : (data as any)?.stories || [];
        setSavedStories(list);
      } else if (tab === "my-archive") {
        const data = await getStoryArchive("my");
        const list = Array.isArray(data) ? data : (data as any)?.stories || [];
        setMyArchiveStories(list);
      } else if (tab === "general-archive") {
        const data = await getStoryArchive("general");
        const list = Array.isArray(data) ? data : (data as any)?.stories || [];
        setGeneralArchiveStories(list);
      }
    } catch (err) {
      console.error(`Failed to load stories for tab ${tab}:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTabStories(activeTab);
    }
  }, [isOpen, activeTab]);

  // Lock body scroll and listen for Escape key while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  const handleRemoveSaved = async (e: React.MouseEvent, storyId: string) => {
    e.stopPropagation();
    try {
      setRemovingId(storyId);
      await toggleSaveStory(storyId);
      setSavedStories((prev) => prev.filter((s) => s._id !== storyId));
    } catch (err) {
      console.error("Failed to remove story from saved:", err);
    } finally {
      setRemovingId(null);
    }
  };

  const currentStoriesList = useMemo(() => {
    if (activeTab === "saved") return savedStories;
    if (activeTab === "my-archive") return myArchiveStories;
    return generalArchiveStories;
  }, [activeTab, savedStories, myArchiveStories, generalArchiveStories]);

  const filteredStories = useMemo(() => {
    if (!searchQuery.trim()) return currentStoriesList;
    const q = searchQuery.toLowerCase();
    return currentStoriesList.filter((s) => {
      const captionMatch = s.caption && s.caption.toLowerCase().includes(q);
      const uploaderName =
        (s.user as any)?.name &&
        (s.user as any).name.toLowerCase().includes(q);
      const siteName =
        (s.site as any)?.name &&
        (s.site as any).name.toLowerCase().includes(q);
      return captionMatch || uploaderName || siteName;
    });
  }, [currentStoriesList, searchQuery]);

  const getTabTitle = (tab: SavedArchiveTab) => {
    if (tab === "saved") return "Saved Stories";
    if (tab === "my-archive") return "My Stories Archive";
    return "General Stories Archive";
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="saved-archive-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-8 flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-6 py-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <Bookmark className="h-5 w-5 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Saved & Stories Archive
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Your bookmarked stories, personal archive, and general company updates beyond 24 hours.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Tabs & Search Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/80 px-6 py-3 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
              {/* Tab Pills */}
              <div className="flex items-center rounded-xl bg-zinc-200/70 dark:bg-zinc-800 p-1 overflow-x-auto">
                {/* Tab 1: Saved (Watch Later) */}
                <button
                  type="button"
                  onClick={() => setActiveTab("saved")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === "saved"
                      ? "bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-300 shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Bookmark size={13} className={activeTab === "saved" ? "fill-amber-500 text-amber-500" : ""} />
                  <span>Saved</span>
                  {savedStories.length > 0 && (
                    <span className="ml-1 rounded-full bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.2 text-[10px] text-amber-700 dark:text-amber-300 font-bold">
                      {savedStories.length}
                    </span>
                  )}
                </button>

                {/* Tab 2: My Archive */}
                <button
                  type="button"
                  onClick={() => setActiveTab("my-archive")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === "my-archive"
                      ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <UserIcon size={13} />
                  <span>My Archive</span>
                  {myArchiveStories.length > 0 && (
                    <span className="ml-1 rounded-full bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.2 text-[10px] text-indigo-700 dark:text-indigo-300 font-bold">
                      {myArchiveStories.length}
                    </span>
                  )}
                </button>

                {/* Tab 3: General Archive */}
                <button
                  type="button"
                  onClick={() => setActiveTab("general-archive")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === "general-archive"
                      ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Sparkles size={13} />
                  <span>General Archive</span>
                  {generalArchiveStories.length > 0 && (
                    <span className="ml-1 rounded-full bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.2 text-[10px] text-indigo-700 dark:text-indigo-300 font-bold">
                      {generalArchiveStories.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Search Filter */}
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Filter stories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 pl-8 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                  <p className="text-sm">Loading stories...</p>
                </div>
              ) : filteredStories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-4">
                    {activeTab === "saved" ? (
                      <Bookmark className="h-8 w-8 text-zinc-400" />
                    ) : (
                      <Archive className="h-8 w-8 text-zinc-400" />
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {searchQuery
                      ? "No stories match your search"
                      : activeTab === "saved"
                      ? "No saved stories yet"
                      : activeTab === "my-archive"
                      ? "No stories in your archive yet"
                      : "No general updates archived"}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
                    {activeTab === "saved"
                      ? "Click the bookmark icon on any story while watching to save it here for later viewing."
                      : activeTab === "my-archive"
                      ? "Stories you upload are automatically saved here forever, even after 24 hours."
                      : "Stories not connected to any construction site appear here permanently for the whole team."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredStories.map((story) => {
                    const uploader =
                      (story.user as any) || (story as any).createdBy;
                    const uploaderName = uploader?.name || "User";
                    const uploaderImage =
                      uploader?.profileImage || uploader?.avatar;
                    const isOwnStory = Boolean(
                      currentUserId &&
                        String(uploader?._id || uploader?.id || uploader) ===
                          currentUserId
                    );

                    return (
                      <div
                        key={story._id}
                        onClick={() =>
                          onPlayStory(
                            story,
                            filteredStories,
                            getTabTitle(activeTab)
                          )
                        }
                        className="group relative flex flex-col rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-900 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer aspect-[9/13]"
                      >
                        {/* Media Thumbnail */}
                        <div className="relative h-full w-full bg-zinc-950 overflow-hidden">
                          {story.mediaType === "video" ? (
                            <video
                              src={story.mediaUrl}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              muted
                              playsInline
                              preload="metadata"
                            />
                          ) : (
                            <img
                              src={story.mediaUrl}
                              alt={story.caption || "Story"}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          )}

                          {/* Hover Play Button Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                              <Play className="h-5 w-5 fill-zinc-900 ml-0.5" />
                            </div>
                          </div>

                          {/* Top Badges */}
                          <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10">
                            <span className="rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-md uppercase tracking-wider">
                              {story.mediaType}
                            </span>

                            {/* Remove button for Saved tab */}
                            {activeTab === "saved" ? (
                              <button
                                type="button"
                                title="Remove from Saved"
                                onClick={(e) => handleRemoveSaved(e, story._id)}
                                disabled={removingId === story._id}
                                className="rounded-full bg-black/60 backdrop-blur-md p-1.5 text-zinc-300 hover:text-rose-400 hover:bg-black/80 transition-colors"
                              >
                                <BookmarkX className="h-3.5 w-3.5" />
                              </button>
                            ) : isOwnStory ? (
                              <span className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md">
                                <Eye size={11} className="text-zinc-300" />
                                <span>{story.viewCount || 0}</span>
                              </span>
                            ) : null}
                          </div>

                          {/* Bottom Gradient with Info */}
                          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end text-white pointer-events-none">
                            {/* Author Info for general or saved tabs */}
                            {activeTab !== "my-archive" && uploaderName && (
                              <div className="flex items-center gap-1.5 mb-1">
                                <div className="h-4 w-4 rounded-full overflow-hidden bg-zinc-700 shrink-0 border border-white/40">
                                  {uploaderImage ? (
                                    <img
                                      src={uploaderImage}
                                      alt={uploaderName}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center text-[8px] font-bold">
                                      {uploaderName.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <span className="text-[11px] font-medium truncate text-zinc-200">
                                  {uploaderName}
                                </span>
                              </div>
                            )}

                            {story.site && (
                              <div className="flex items-center gap-1 text-[10px] text-amber-300 font-medium mb-1 truncate">
                                <Building2 size={10} className="shrink-0" />
                                <span className="truncate">
                                  {(story.site as any).name || "Site"}
                                </span>
                              </div>
                            )}

                            {story.caption && (
                              <p className="text-xs font-medium text-white line-clamp-2 leading-tight mb-1">
                                {story.caption}
                              </p>
                            )}

                            <div className="flex items-center justify-between pt-0.5 text-[10px] text-zinc-400">
                              <span className="flex items-center gap-1">
                                <Calendar size={10} />
                                {formatDate(story.createdAt)}
                              </span>

                              {activeTab === "saved" && isOwnStory && (story.viewers?.length ?? 0) > 0 && (
                                <span className="flex items-center gap-0.5 text-zinc-300">
                                  <Eye size={10} /> {story.viewers?.length}
                                </span>
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

            {/* Footer */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 px-6 py-3.5 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
              <span>
                {filteredStories.length}{" "}
                {filteredStories.length === 1 ? "story" : "stories"} in{" "}
                {activeTab === "saved"
                  ? "Saved"
                  : activeTab === "my-archive"
                  ? "My Archive"
                  : "General Archive"}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="font-medium text-zinc-700 dark:text-zinc-300 hover:underline"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default WatchLaterModal;
