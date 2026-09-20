import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Plus, Bookmark, ChevronLeft, ChevronRight } from "lucide-react";
import { getActiveStories } from "../../services/storyService";
import type { StoryGroup, StoryItem } from "../../services/storyService";
import { getCurrentUser } from "../../services/userService";
import { updateUserFields } from "../../store/slices/authSlice";
import type { RootState } from "../../store/store";
import { StoryViewerModal } from "./StoryViewerModal";
import { CreateStoryModal } from "./CreateStoryModal";
import { WatchLaterModal } from "./WatchLaterModal";

interface StoryTrayProps {
  className?: string;
}

export const StoryTray: React.FC<StoryTrayProps> = ({ className = "" }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [fetchedProfileImage, setFetchedProfileImage] = useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isWatchLaterOpen, setIsWatchLaterOpen] = useState(false);
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

  const currentUserId = (currentUser as any)?._id || (currentUser as any)?.id || "";
  const currentUserRole = useSelector((state: RootState) => state.auth.userType) || "";

  // Session-scoped seen story tracking for instant border disappearance and reordering during active session
  const [sessionSeenStoryIds, setSessionSeenStoryIds] = useState<Set<string>>(new Set());

  // Clean up any stale cross-user localStorage item from previous tests and reset session state on user switch
  useEffect(() => {
    setSessionSeenStoryIds(new Set());
    try {
      localStorage.removeItem("simak_seen_stories");
    } catch {
      // Ignore
    }
  }, [currentUserId]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Guarantee current user profile image is fetched if missing from session
  useEffect(() => {
    let isMounted = true;
    const fetchUserAvatar = async () => {
      try {
        const userRes = await getCurrentUser();
        if (isMounted && userRes?.profileImage) {
          setFetchedProfileImage(userRes.profileImage);
          dispatch(updateUserFields({ profileImage: userRes.profileImage }));
        }
      } catch {
        // Silently continue if cannot fetch user details
      }
    };

    if (!currentUser?.profileImage) {
      fetchUserAvatar();
    }
    return () => {
      isMounted = false;
    };
  }, [currentUser?.profileImage, dispatch]);

  const handleStoryViewed = useCallback((storyId: string) => {
    setSessionSeenStoryIds((prev) => {
      if (prev.has(storyId)) return prev;
      const nextSet = new Set(prev);
      nextSet.add(storyId);
      return nextSet;
    });
  }, []);

  const fetchStories = async () => {
    try {
      const res = await getActiveStories();
      const groups = Array.isArray(res) ? res : (res as any)?.groups || [];
      setStoryGroups(groups);
    } catch (err) {
      console.error("Failed to fetch active stories:", err);
      setStoryGroups([]);
    }
  };

  useEffect(() => {
    fetchStories();
    // Poll every 60 seconds for fresh stories
    const interval = setInterval(fetchStories, 60000);
    return () => clearInterval(interval);
  }, []);

  // Helper to check if a group has any unseen stories
  const isGroupUnseen = useCallback(
    (group: StoryGroup | null | undefined): boolean => {
      if (!group || !Array.isArray(group.stories) || group.stories.length === 0) {
        return false;
      }
      // Unseen if server says !s.hasViewed AND not viewed yet in this active session
      return group.stories.some((s) => !s.hasViewed && !sessionSeenStoryIds.has(s._id));
    },
    [sessionSeenStoryIds]
  );

  // Update scroll buttons state
  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [storyGroups]);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = direction === "left" ? -240 : 240;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  // Identify current user's group
  const safeGroups = Array.isArray(storyGroups) ? storyGroups : [];
  const currentUserGroup =
    safeGroups.find((g) => g?.user?._id && String(g.user._id) === String(currentUserId)) || null;

  const currentUserImage =
    currentUser?.profileImage ||
    fetchedProfileImage ||
    (currentUser as any)?.avatar ||
    currentUserGroup?.user?.profileImage;

  // Check if current user has any unseen stories (for own border indicator)
  const currentUserHasUnseen = currentUserGroup ? isGroupUnseen(currentUserGroup) : false;

  // Separate other users' groups into unseen (front) and seen (end), sorted by newest upload
  const getGroupLatestTime = (group: StoryGroup) => {
    if (!group.stories || group.stories.length === 0) return 0;
    return Math.max(...group.stories.map((s) => new Date(s.createdAt).getTime()));
  };

  const otherGroups = safeGroups.filter(
    (g) => g?.user?._id && String(g.user._id) !== String(currentUserId)
  );

  const unseenOtherGroups = otherGroups
    .filter((g) => isGroupUnseen(g))
    .sort((a, b) => getGroupLatestTime(b) - getGroupLatestTime(a));

  const seenOtherGroups = otherGroups
    .filter((g) => !isGroupUnseen(g))
    .sort((a, b) => getGroupLatestTime(b) - getGroupLatestTime(a));

  const sortedOtherGroups = [...unseenOtherGroups, ...seenOtherGroups];

  const allDisplayGroups = useMemo(() => {
    return [
      ...(currentUserGroup ? [currentUserGroup] : []),
      ...sortedOtherGroups,
    ];
  }, [currentUserGroup, sortedOtherGroups]);

  const handleOpenGroup = (targetGroup: StoryGroup) => {
    const groupIdx = allDisplayGroups.findIndex(
      (g) => g?.user?._id && String(g.user._id) === String(targetGroup.user._id)
    );
    if (groupIdx === -1) return;

    let startStoryIndex = 0;
    if (targetGroup && Array.isArray(targetGroup.stories)) {
      const firstUnseenIdx = targetGroup.stories.findIndex(
        (s) => !s.hasViewed && !sessionSeenStoryIds.has(s._id)
      );
      if (firstUnseenIdx !== -1) {
        startStoryIndex = firstUnseenIdx;
      }
    }

    setViewerState({
      isOpen: true,
      initialGroupIndex: groupIdx,
      initialStoryIndex: startStoryIndex,
      customGroups: allDisplayGroups,
    });
  };

  const handlePlaySavedStory = (
    story: StoryItem,
    allSaved: StoryItem[],
    groupTitle: string = "Saved Stories"
  ) => {
    // Form a single virtual group from saved/archived stories
    const virtualGroup: StoryGroup = {
      user: {
        _id: "saved-archive",
        name: groupTitle,
        role: "Stories Archive",
      },
      stories: allSaved,
      hasUnseen: false,
      latestCreatedAt: story.createdAt,
      storyCount: allSaved.length,
    } as StoryGroup;

    const targetIdx = allSaved.findIndex((s) => s._id === story._id);

    setIsWatchLaterOpen(false);
    setViewerState({
      isOpen: true,
      initialGroupIndex: 0,
      initialStoryIndex: Math.max(0, targetIdx),
      customGroups: [virtualGroup],
    });
  };

  return (
    <div className={`relative w-full rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 shadow-sm ${className}`}>
      {/* Scroll Controls (Desktop) */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll("left")}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-white/95 dark:bg-zinc-800/95 border border-zinc-200 dark:border-zinc-700 shadow-md text-zinc-700 dark:text-zinc-200 hover:scale-105 transition-transform"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll("right")}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-white/95 dark:bg-zinc-800/95 border border-zinc-200 dark:border-zinc-700 shadow-md text-zinc-700 dark:text-zinc-200 hover:scale-105 transition-transform"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Stories Carousel */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="flex items-center gap-4 overflow-x-auto no-scrollbar scroll-smooth px-1 py-1"
      >
        {/* Item 1: Your Story / Add Story */}
        <div className="flex flex-col items-center gap-1.5 shrink-0 select-none">
          <div className="relative">
            {currentUserGroup ? (
              // User already has stories - clicking avatar opens them, clicking plus adds more
              <button
                type="button"
                onClick={() => handleOpenGroup(currentUserGroup)}
                className={`relative flex h-16 w-16 items-center justify-center rounded-full p-[2.5px] transition-transform active:scale-95 ${
                  currentUserHasUnseen
                    ? "bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-md shadow-rose-500/20 animate-gradient-x"
                    : "border-2 border-zinc-300 dark:border-zinc-700"
                }`}
              >
                <div className="h-full w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border-2 border-white dark:border-zinc-900 flex items-center justify-center text-sm font-bold text-zinc-800 dark:text-zinc-100 uppercase">
                  {currentUserImage ? (
                    <img src={currentUserImage} alt="You" className="h-full w-full object-cover" />
                  ) : (
                    <span>{currentUser?.name?.charAt(0) || "Y"}</span>
                  )}
                </div>
              </button>
            ) : (
              // User has no active stories yet - clicking opens create modal
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-brand-500 dark:hover:border-brand-500 bg-zinc-50 dark:bg-zinc-800/60 p-[2px] transition-transform active:scale-95 group"
              >
                <div className="h-full w-full rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-brand-500 transition-colors overflow-hidden">
                  {currentUserImage ? (
                    <img src={currentUserImage} alt="You" className="h-full w-full object-cover rounded-full" />
                  ) : (
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
                      {currentUser?.name?.charAt(0) || "Y"}
                    </span>
                  )}
                </div>
              </button>
            )}

            {/* Plus Badge */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsCreateOpen(true);
              }}
              title="Add New Story"
              className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm border-2 border-white dark:border-zinc-900 hover:bg-brand-600 active:scale-90 transition-transform"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
            </button>
          </div>
          <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 max-w-[68px] truncate">
            {currentUserGroup ? "Your Story" : "Add Story"}
          </span>
        </div>

        {/* Item 2: Saved & Archive Button */}
        <div className="flex flex-col items-center gap-1.5 shrink-0 select-none">
          <button
            type="button"
            onClick={() => setIsWatchLaterOpen(true)}
            className="group relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-300/80 dark:border-amber-600/50 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 p-[2px] transition-transform active:scale-95"
            title="Saved & Stories Archive"
          >
            <div className="flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-amber-500 shadow-inner">
              <Bookmark className="h-6 w-6 fill-amber-500 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
          </button>
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 max-w-[76px] truncate text-center">
            Saved & Archive
          </span>
        </div>

        {/* Divider */}
        {sortedOtherGroups.length > 0 && (
          <div className="h-10 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0 mx-0.5" />
        )}

        {/* User Story Bubbles: Unseen first (newest to oldest), then seen at the end (newest to oldest) */}
        {sortedOtherGroups.map((group) => {
          if (!group?.user?._id) return null;

          const hasUnseen = isGroupUnseen(group);
          const userName = group.user.name || "User";
          const firstChar = userName.charAt(0) || "U";
          const firstName = userName.split(" ")[0] || userName;
          const userImage = group.user?.profileImage || (group.user as any)?.avatar;

          return (
            <div
              key={group.user._id}
              onClick={() => handleOpenGroup(group)}
              className="flex flex-col items-center gap-1.5 shrink-0 select-none cursor-pointer group"
            >
              <div className="relative">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full p-[2.5px] transition-all group-hover:scale-105 active:scale-95 ${
                    hasUnseen
                      ? "bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-md shadow-rose-500/20 animate-gradient-x"
                      : "border-2 border-zinc-300 dark:border-zinc-700 bg-transparent"
                  }`}
                >
                  <div className="h-full w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border-2 border-white dark:border-zinc-900 flex items-center justify-center text-sm font-bold text-zinc-800 dark:text-zinc-100 uppercase">
                    {userImage ? (
                      <img
                        src={userImage}
                        alt={userName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{firstChar}</span>
                    )}
                  </div>
                </div>
              </div>

              <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 max-w-[68px] truncate text-center">
                {firstName}
              </span>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <CreateStoryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onStoryCreated={() => {
          fetchStories();
        }}
      />

      <WatchLaterModal
        isOpen={isWatchLaterOpen}
        onClose={() => setIsWatchLaterOpen(false)}
        onPlayStory={handlePlaySavedStory}
      />

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
          groups={viewerState.customGroups || allDisplayGroups}
          initialGroupIndex={viewerState.initialGroupIndex}
          initialStoryIndex={viewerState.initialStoryIndex}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onStoryViewed={handleStoryViewed}
          onStoriesUpdated={fetchStories}
        />
      )}
    </div>
  );
};

export default StoryTray;
