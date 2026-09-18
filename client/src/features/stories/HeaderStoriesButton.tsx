import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { Film, Sparkles, Plus } from "lucide-react";
import type { RootState } from "@/store/store";
import { getActiveStories } from "@/services/storyService";
import type { StoryGroup } from "@/services/storyService";
import { StoryViewerModal } from "./StoryViewerModal";
import { CreateStoryModal } from "./CreateStoryModal";
import Tooltip from "@/components/ui/Tooltip";

export const HeaderStoriesButton: React.FC = () => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const currentUserId = (currentUser as any)?._id || (currentUser as any)?.id || "";
  const currentUserRole = useSelector((state: RootState) => state.auth.userType) || "";

  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [sessionSeenStoryIds, setSessionSeenStoryIds] = useState<Set<string>>(new Set());
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    initialGroupIndex: number;
    initialStoryIndex: number;
  }>({
    isOpen: false,
    initialGroupIndex: 0,
    initialStoryIndex: 0,
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Fetch stories
  const fetchStories = async () => {
    try {
      const res = await getActiveStories();
      const groups = Array.isArray(res) ? res : (res as any)?.groups || [];
      setStoryGroups(groups);
    } catch {
      setStoryGroups([]);
    }
  };

  useEffect(() => {
    fetchStories();
    const interval = setInterval(fetchStories, 60000);
    return () => clearInterval(interval);
  }, []);

  // Reset session seen tracking on user switch
  useEffect(() => {
    setSessionSeenStoryIds(new Set());
  }, [currentUserId]);

  const handleStoryViewed = useCallback((storyId: string) => {
    setSessionSeenStoryIds((prev) => {
      if (prev.has(storyId)) return prev;
      const nextSet = new Set(prev);
      nextSet.add(storyId);
      return nextSet;
    });
  }, []);

  const safeGroups = Array.isArray(storyGroups) ? storyGroups : [];

  // Check if a group has any unseen stories
  const isGroupUnseen = useCallback(
    (group: StoryGroup): boolean => {
      if (!group?.stories || group.stories.length === 0) return false;
      return group.stories.some((s) => !s.hasViewed && !sessionSeenStoryIds.has(s._id));
    },
    [sessionSeenStoryIds]
  );

  // Find first unseen story index:
  // 1. Check other users' unseen stories first
  // 2. Check current user's own unseen stories if any
  // 3. Fall back to group 0, story 0 if all stories are seen
  const getFirstUnseenIndices = useCallback(
    (groups: StoryGroup[]): { groupIdx: number; storyIdx: number } => {
      // 1. Other users' unseen stories first
      for (let gIdx = 0; gIdx < groups.length; gIdx++) {
        const group = groups[gIdx];
        const isMe = String((group.user as any)?._id || (group.user as any)?.id) === String(currentUserId);
        if (!isMe && group.stories && group.stories.length > 0) {
          const sIdx = group.stories.findIndex(
            (s) => !s.hasViewed && !sessionSeenStoryIds.has(s._id)
          );
          if (sIdx !== -1) {
            return { groupIdx: gIdx, storyIdx: sIdx };
          }
        }
      }

      // 2. Own unseen stories
      for (let gIdx = 0; gIdx < groups.length; gIdx++) {
        const group = groups[gIdx];
        const isMe = String((group.user as any)?._id || (group.user as any)?.id) === String(currentUserId);
        if (isMe && group.stories && group.stories.length > 0) {
          const sIdx = group.stories.findIndex(
            (s) => !s.hasViewed && !sessionSeenStoryIds.has(s._id)
          );
          if (sIdx !== -1) {
            return { groupIdx: gIdx, storyIdx: sIdx };
          }
        }
      }

      // 3. All stories already seen -> start from beginning
      return { groupIdx: 0, storyIdx: 0 };
    },
    [currentUserId, sessionSeenStoryIds]
  );

  const hasUnseenStories = safeGroups.some((g) => isGroupUnseen(g));
  const totalActiveStories = safeGroups.reduce((acc, g) => acc + (g.stories?.length || 0), 0);

  const handleClick = () => {
    if (totalActiveStories === 0) {
      // If no active stories exist, allow posting a new story directly
      setIsCreateOpen(true);
      return;
    }

    const { groupIdx, storyIdx } = getFirstUnseenIndices(safeGroups);

    setViewerState({
      isOpen: true,
      initialGroupIndex: groupIdx,
      initialStoryIndex: storyIdx,
    });
  };

  return (
    <>
      <Tooltip label={hasUnseenStories ? "New stories available" : totalActiveStories > 0 ? "Watch stories" : "Share a story"}>
        <button
          type="button"
          onClick={handleClick}
          className={`relative flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all duration-200 active:scale-95 ${
            hasUnseenStories
              ? "bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 text-rose-500 dark:text-rose-400 border border-rose-400/40 hover:border-rose-500 shadow-sm"
              : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/70 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80"
          }`}
          aria-label="Stories"
        >
          {/* Circular gradient ring or subtle ring */}
          <div
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full p-[1.5px] ${
              hasUnseenStories
                ? "bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 animate-gradient-x"
                : "border border-zinc-400/60 dark:border-zinc-500"
            }`}
          >
            <div className="flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-zinc-900">
              {hasUnseenStories ? (
                <Sparkles size={10} className="text-rose-500 fill-rose-500" />
              ) : totalActiveStories > 0 ? (
                <Film size={10} className="text-zinc-600 dark:text-zinc-400" />
              ) : (
                <Plus size={10} className="text-zinc-500 dark:text-zinc-400" />
              )}
            </div>
          </div>

          <span className="hidden sm:inline font-medium tracking-tight">
            Stories
          </span>

          {hasUnseenStories && (
            <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>
      </Tooltip>

      {/* Story Viewer Modal when opened from header */}
      {viewerState.isOpen && (
        <StoryViewerModal
          isOpen={viewerState.isOpen}
          onClose={() =>
            setViewerState((prev) => ({
              ...prev,
              isOpen: false,
              initialStoryIndex: 0,
            }))
          }
          groups={safeGroups}
          initialGroupIndex={viewerState.initialGroupIndex}
          initialStoryIndex={viewerState.initialStoryIndex}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onStoryViewed={handleStoryViewed}
          onStoriesUpdated={fetchStories}
        />
      )}

      {/* Create Story Modal if launched from header */}
      <CreateStoryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onStoryCreated={fetchStories}
      />
    </>
  );
};

export default HeaderStoriesButton;
