import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Bookmark,
  Eye,
  Trash2,
  MapPin,
  Clock,
  Send,
  User as UserIcon,
  Heart,
  ThumbsUp,
  Flame,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  StoryItem,
  StoryUserGroup,
  StoryReactionItem,
  markStoryViewed,
  toggleSaveStory,
  deleteStory,
  reactToStory,
} from "@/services/storyService";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface StoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups?: StoryUserGroup[];
  storyGroups?: StoryUserGroup[];
  initialGroupIndex?: number;
  initialStoryIndex?: number;
  currentUserId?: string;
  currentUserRole?: string;
  onStoryViewed?: (storyId: string) => void;
  onStoryUpdated?: () => void;
  onStoriesUpdated?: () => void;
}

interface ReactionOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  activeColor: string;
  hoverColor: string;
}

const REACTION_OPTIONS: ReactionOption[] = [
  {
    id: "heart",
    label: "Love",
    icon: Heart,
    activeColor: "fill-rose-500 text-rose-500",
    hoverColor: "group-hover:text-rose-400",
  },
  {
    id: "like",
    label: "Like",
    icon: ThumbsUp,
    activeColor: "fill-blue-500 text-blue-500",
    hoverColor: "group-hover:text-blue-400",
  },
  {
    id: "fire",
    label: "Fire",
    icon: Flame,
    activeColor: "fill-amber-500 text-amber-500",
    hoverColor: "group-hover:text-amber-400",
  },
  {
    id: "sparkles",
    label: "Awesome",
    icon: Sparkles,
    activeColor: "fill-purple-400 text-purple-400",
    hoverColor: "group-hover:text-purple-300",
  },
];

const getUserId = (userObjOrId: any): string => {
  if (!userObjOrId) return "";
  if (typeof userObjOrId === "string") return userObjOrId;
  return String(userObjOrId._id || userObjOrId.id || "");
};

const normalizeReactionId = (val?: string): string => {
  if (!val) return "";
  if (val === "❤️" || val === "heart") return "heart";
  if (val === "👍" || val === "like") return "like";
  if (val === "🔥" || val === "fire") return "fire";
  if (val === "👏" || val === "sparkles") return "sparkles";
  return val;
};

const DEFAULT_IMAGE_DURATION_MS = 5000; // 5 seconds per image

const groupTransitionVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0.85,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      x: { type: "spring", stiffness: 360, damping: 36 },
      opacity: { duration: 0.2 },
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0.85,
    transition: {
      x: { type: "spring", stiffness: 360, damping: 36 },
      opacity: { duration: 0.2 },
    },
  }),
};

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  isOpen,
  onClose,
  groups,
  storyGroups,
  initialGroupIndex = 0,
  initialStoryIndex = 0,
  currentUserId = "",
  currentUserRole = "",
  onStoryViewed,
  onStoryUpdated,
  onStoriesUpdated,
}) => {
  const effectiveGroups = groups || storyGroups || [];
  const navigate = useNavigate();
  const getInitialStoryIdx = useCallback(
    (targetGroup?: StoryUserGroup, targetStoryIdx = 0) => {
      if (
        targetStoryIdx === 0 &&
        targetGroup &&
        Array.isArray(targetGroup.stories)
      ) {
        const firstUnseen = targetGroup.stories.findIndex((s) => !s.hasViewed);
        if (firstUnseen !== -1) {
          return firstUnseen;
        }
      }
      return targetStoryIdx;
    },
    []
  );

  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [groupDirection, setGroupDirection] = useState<number>(1);
  const [storyIndex, setStoryIndex] = useState(() =>
    getInitialStoryIdx(effectiveGroups[initialGroupIndex], initialStoryIndex)
  );
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [localSaved, setLocalSaved] = useState<Record<string, boolean>>({});
  const [localViewCount, setLocalViewCount] = useState<Record<string, number>>({});
  const [localReactions, setLocalReactions] = useState<
    Record<string, { userReaction: string | null; reactions: StoryReactionItem[] }>
  >({});
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [centerToast, setCenterToast] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const pausedAtRef = useRef<number>(0);
  const viewedStoriesRef = useRef<Set<string>>(new Set());
  const startedWithUnseenRef = useRef<boolean>(false);
  const centerToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prevSyncRef = useRef({
    isOpen: false,
    initialGroupIndex,
    initialStoryIndex,
  });

  // Track if we need to sync state synchronously during render to eliminate any stale flash
  const needsSync =
    isOpen &&
    (!prevSyncRef.current.isOpen ||
      prevSyncRef.current.initialGroupIndex !== initialGroupIndex ||
      prevSyncRef.current.initialStoryIndex !== initialStoryIndex);

  let activeGroupIndex = groupIndex;
  let activeStoryIndex = storyIndex;

  if (needsSync) {
    prevSyncRef.current = {
      isOpen: true,
      initialGroupIndex,
      initialStoryIndex,
    };

    const targetGroup = effectiveGroups[initialGroupIndex];
    const targetHasUnseen =
      targetGroup?.stories?.some((s) => !s.hasViewed) || false;
    const openedOnUnseen =
      initialStoryIndex >= 0 &&
      targetGroup?.stories?.[initialStoryIndex] &&
      !targetGroup.stories[initialStoryIndex].hasViewed;

    startedWithUnseenRef.current = targetHasUnseen || !!openedOnUnseen;

    const startIdx = getInitialStoryIdx(targetGroup, initialStoryIndex);

    activeGroupIndex = initialGroupIndex;
    activeStoryIndex = startIdx;

    setGroupIndex(initialGroupIndex);
    setStoryIndex(startIdx);
    setGroupDirection(1);
    setProgress(0);
    setIsPaused(false);
    setShowViewersSheet(false);
    setShowDeleteConfirm(false);
    startTimeRef.current = Date.now();
  } else if (!isOpen && prevSyncRef.current.isOpen) {
    prevSyncRef.current.isOpen = false;
  }

  const showCenterToast = (message: string) => {
    if (centerToastTimeoutRef.current) {
      clearTimeout(centerToastTimeoutRef.current);
    }
    setCenterToast(message);
    centerToastTimeoutRef.current = setTimeout(() => {
      setCenterToast(null);
    }, 1700);
  };

  useEffect(() => {
    return () => {
      if (centerToastTimeoutRef.current) {
        clearTimeout(centerToastTimeoutRef.current);
      }
    };
  }, []);

  const currentGroup = effectiveGroups[activeGroupIndex];
  const currentStory: StoryItem | undefined = currentGroup?.stories?.[activeStoryIndex];

  // Reset and synchronize side-effects whenever modal opens or target indices change
  useEffect(() => {
    if (isOpen) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    } else {
      setProgress(0);
      setIsPaused(false);
      setShowViewersSheet(false);
      setShowDeleteConfirm(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  }, [isOpen]);

  // Restart slide timer and video position whenever current story changes
  useEffect(() => {
    if (!isOpen) return;
    setProgress(0);
    startTimeRef.current = Date.now();
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      if (!isPaused) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isOpen, groupIndex, storyIndex]);

  // Mark story as viewed (both for own stories and other users' stories)
  useEffect(() => {
    if (!currentStory || !isOpen) return;

    // Immediately notify tray of seen state so border and ordering update instantly
    onStoryViewed?.(currentStory._id);

    if (!viewedStoriesRef.current.has(currentStory._id) && !currentStory.hasViewed) {
      viewedStoriesRef.current.add(currentStory._id);
      markStoryViewed(currentStory._id)
        .then((res) => {
          if (res?.viewCount !== undefined) {
            setLocalViewCount((prev) => ({
              ...prev,
              [currentStory._id]: res.viewCount,
            }));
          }
          onStoryUpdated?.();
          onStoriesUpdated?.();
        })
        .catch(() => {});
    }
  }, [currentStory?._id, isOpen, onStoryViewed, onStoryUpdated, onStoriesUpdated]);

  const isUnseenStory = useCallback(
    (s: StoryItem) => !s.hasViewed && !viewedStoriesRef.current.has(s._id),
    []
  );

  const isGroupUnseen = useCallback(
    (g: StoryGroup) => g.stories?.some(isUnseenStory) || false,
    [isUnseenStory]
  );

  // Find next group that has unseen stories
  const findNextUnseenGroupIndex = useCallback(
    (fromIdx: number): number => {
      // 1. Search ahead of current group
      for (let i = fromIdx + 1; i < effectiveGroups.length; i++) {
        if (isGroupUnseen(effectiveGroups[i])) return i;
      }
      // 2. Wrap around to search earlier groups
      for (let i = 0; i < fromIdx; i++) {
        if (isGroupUnseen(effectiveGroups[i])) return i;
      }
      return -1;
    },
    [effectiveGroups, isGroupUnseen]
  );

  const handleNextGroup = useCallback(() => {
    setGroupDirection(1);
    if (startedWithUnseenRef.current) {
      const nextUnseenGroupIdx = findNextUnseenGroupIndex(groupIndex);
      if (nextUnseenGroupIdx !== -1) {
        const nextGroup = effectiveGroups[nextUnseenGroupIdx];
        const firstUnseenIdx = nextGroup.stories?.findIndex(isUnseenStory) ?? 0;
        setGroupIndex(nextUnseenGroupIdx);
        setStoryIndex(firstUnseenIdx !== -1 ? firstUnseenIdx : 0);
        setProgress(0);
        startTimeRef.current = Date.now();
      } else {
        // All unseen stories across all profiles are over -> close automatically
        setProgress(0);
        onClose();
      }
    } else {
      if (groupIndex < effectiveGroups.length - 1) {
        setGroupIndex((prev) => prev + 1);
        setStoryIndex(0);
        setProgress(0);
        startTimeRef.current = Date.now();
      } else {
        setProgress(0);
        onClose();
      }
    }
  }, [
    groupIndex,
    effectiveGroups,
    findNextUnseenGroupIndex,
    isUnseenStory,
    onClose,
  ]);

  const handleNextStory = useCallback(() => {
    if (!currentGroup) return;

    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex((prev) => prev + 1);
      setProgress(0);
      startTimeRef.current = Date.now();
    } else {
      handleNextGroup();
    }
  }, [currentGroup, storyIndex, handleNextGroup]);

  const handlePrevStory = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
      setProgress(0);
      startTimeRef.current = Date.now();
    } else if (groupIndex > 0) {
      setGroupDirection(-1);
      const prevGroup = effectiveGroups[groupIndex - 1];
      setGroupIndex((prev) => prev - 1);
      setStoryIndex(prevGroup ? prevGroup.stories.length - 1 : 0);
      setProgress(0);
      startTimeRef.current = Date.now();
    }
  }, [storyIndex, groupIndex, effectiveGroups]);

  // Timer & progress handling
  useEffect(() => {
    if (!isOpen || !currentStory || isPaused || showViewersSheet || showDeleteConfirm) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (videoRef.current && isPaused) {
        videoRef.current.pause();
      }
      return;
    }

    if (currentStory.mediaType === "video") {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
      return;
    }

    // Image timer progress: always reset if progress is already complete
    const duration = DEFAULT_IMAGE_DURATION_MS;
    const startOffset = progress < 100 ? (progress / 100) * duration : 0;
    startTimeRef.current = Date.now() - startOffset;

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentPct = Math.min((elapsed / duration) * 100, 100);
      setProgress(currentPct);

      if (currentPct >= 100) {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        handleNextStory();
      }
    }, 50);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isOpen, currentStory?._id, isPaused, showViewersSheet, showDeleteConfirm, handleNextStory]);

  // Handle video time updates for progress
  const handleVideoTimeUpdate = () => {
    if (!videoRef.current || isPaused) return;
    const duration = videoRef.current.duration;
    const currentTime = videoRef.current.currentTime;
    if (duration > 0) {
      setProgress((currentTime / duration) * 100);
    }
  };

  const handleVideoEnded = () => {
    handleNextStory();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        handleNextStory();
      } else if (e.key === "ArrowLeft") {
        handlePrevStory();
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleNextStory, handlePrevStory, onClose]);

  // Bookmark toggle
  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentStory) return;
    const currentStatus = localSaved[currentStory._id] ?? currentStory.isSaved;
    setLocalSaved((prev) => ({ ...prev, [currentStory._id]: !currentStatus }));

    try {
      const res = await toggleSaveStory(currentStory._id);
      setLocalSaved((prev) => ({ ...prev, [currentStory._id]: res.isSaved }));
      showCenterToast(res.message);
      onStoryUpdated?.();
    } catch {
      setLocalSaved((prev) => ({ ...prev, [currentStory._id]: currentStatus }));
      showCenterToast("Failed to update Watch Later");
    }
  };

  const currentReactions: StoryReactionItem[] =
    localReactions[currentStory?._id || ""]?.reactions || currentStory?.reactions || [];

  // Deduplicated unique reactions (at most 1 reaction per user)
  const uniqueReactions = useMemo(() => {
    const map = new Map<string, StoryReactionItem>();
    for (const r of currentReactions) {
      const rId = getUserId(r.user);
      if (rId) {
        map.set(rId, r);
      }
    }
    return Array.from(map.values());
  }, [currentReactions]);

  const currentUserReaction: string | null =
    localReactions[currentStory?._id || ""]?.userReaction !== undefined
      ? localReactions[currentStory?._id || ""]?.userReaction
      : normalizeReactionId(
          uniqueReactions.find(
            (r) => getUserId(r.user) === String(currentUserId)
          )?.emoji
        ) || null;

  // Reaction toggle / switch with outlined / filled states
  const handleReaction = async (reactionId: string) => {
    if (!currentStory) return;
    const isCurrentlyActive = currentUserReaction === reactionId;
    const nextUserReaction = isCurrentlyActive ? null : reactionId;

    // Optimistic update: filter out any previous reaction by current user so count never increments on switch
    const updatedReactions = currentReactions.filter(
      (r) => getUserId(r.user) !== String(currentUserId)
    );

    if (!isCurrentlyActive) {
      updatedReactions.push({
        user: {
          _id: currentUserId,
          name: "You",
        },
        emoji: reactionId,
        createdAt: new Date().toISOString(),
      });
    }

    setLocalReactions((prev) => ({
      ...prev,
      [currentStory._id]: {
        userReaction: nextUserReaction,
        reactions: updatedReactions,
      },
    }));

    const reactionLabel = REACTION_OPTIONS.find((r) => r.id === reactionId)?.label || "Reaction";
    showCenterToast(isCurrentlyActive ? "Reaction removed" : `Reacted with ${reactionLabel}`);

    try {
      const res = await reactToStory(currentStory._id, reactionId);
      if (res?.reactions) {
        setLocalReactions((prev) => ({
          ...prev,
          [currentStory._id]: {
            userReaction:
              res.userReaction !== undefined
                ? normalizeReactionId(res.userReaction || "") || null
                : nextUserReaction,
            reactions: res.reactions,
          },
        }));
      }
      onStoryUpdated?.();
      onStoriesUpdated?.();
    } catch {
      showCenterToast("Failed to update reaction");
    }
  };

  // Delete story handlers
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentStory || deleting) return;
    setIsPaused(true);
    setShowDeleteConfirm(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setIsPaused(false);
  };

  const handleConfirmDelete = async () => {
    if (!currentStory || deleting) return;
    setDeleting(true);
    try {
      await deleteStory(currentStory._id);
      setShowDeleteConfirm(false);
      showCenterToast("Story deleted");
      onStoryUpdated?.();
      onStoriesUpdated?.();
      handleNextStory();
    } catch {
      showCenterToast("Failed to delete story");
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
      setIsPaused(false);
    }
  };

  const uploaderId = String(currentGroup?.user?._id || (currentGroup?.user as any)?.id || "");
  const isOwner = Boolean(currentUserId && uploaderId === String(currentUserId));
  const canManage = isOwner || currentUserRole === "admin";

  // Filter out the uploader/own user from viewers list so own name is never listed
  const filteredViewers = useMemo(() => {
    if (!currentStory?.viewers) return [];
    return currentStory.viewers.filter((v) => {
      const vId = getUserId(v.user);
      return vId !== currentUserId && vId !== uploaderId;
    });
  }, [currentStory?.viewers, currentUserId, uploaderId]);

  // Map reactions by user ID
  const reactionByUser = useMemo(() => {
    const map = new Map<string, StoryReactionItem>();
    for (const r of uniqueReactions) {
      const rUserId = getUserId(r.user);
      if (rUserId) {
        map.set(rUserId, r);
      }
    }
    return map;
  }, [uniqueReactions]);

  // Combine viewers and reactors: REACTORS ALWAYS GO TO TOP OF LIST
  const combinedViewerList = useMemo(() => {
    const list: Array<{
      user: { _id: string; name: string; role?: string; profileImage?: string };
      viewedAt: string;
      reaction?: StoryReactionItem;
    }> = [];

    const seenUserIds = new Set<string>();

    for (const v of filteredViewers) {
      const vUserId = getUserId(v.user);
      seenUserIds.add(vUserId);
      const reaction = reactionByUser.get(vUserId);
      list.push({
        user: v.user as any,
        viewedAt: v.viewedAt,
        reaction,
      });
    }

    // Include any reactor who might not be in viewers list
    for (const r of uniqueReactions) {
      const rUserId = getUserId(r.user);
      if (rUserId && !seenUserIds.has(rUserId) && rUserId !== uploaderId && rUserId !== currentUserId) {
        list.push({
          user: r.user as any,
          viewedAt: r.createdAt,
          reaction: r,
        });
      }
    }

    // Sort: Reactors first at the top!
    list.sort((a, b) => {
      const aHasReaction = Boolean(a.reaction);
      const bHasReaction = Boolean(b.reaction);
      if (aHasReaction && !bHasReaction) return -1;
      if (!aHasReaction && bHasReaction) return 1;

      const timeA = new Date(a.reaction ? a.reaction.createdAt : a.viewedAt).getTime();
      const timeB = new Date(b.reaction ? b.reaction.createdAt : b.viewedAt).getTime();
      return timeB - timeA;
    });

    return list;
  }, [filteredViewers, reactionByUser, uniqueReactions, uploaderId, currentUserId]);

  const renderReactionBadge = (reactionEmoji?: string) => {
    if (!reactionEmoji) return null;
    const norm = normalizeReactionId(reactionEmoji);
    const opt = REACTION_OPTIONS.find((r) => r.id === norm);
    if (opt) {
      const IconComp = opt.icon;
      return (
        <div className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-white border border-white/15">
          <IconComp size={13} className={opt.activeColor} />
          <span className="text-[10px] text-zinc-300 capitalize">{opt.label}</span>
        </div>
      );
    }
    return (
      <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/10">{reactionEmoji}</span>
    );
  };

  const formatRelativeTime = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (!isOpen || !currentStory || !currentGroup) return null;

  const isSavedState = localSaved[currentStory._id] ?? currentStory.isSaved;
  const viewCount = localViewCount[currentStory._id] ?? (isOwner ? (currentStory.viewers ? filteredViewers.length : currentStory.viewCount ?? 0) : 0);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md select-none"
      onClick={onClose}
    >
      {/* Previous Group Navigation Arrow */}
      {groupIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setGroupDirection(-1);
            setGroupIndex((prev) => prev - 1);
            setStoryIndex(0);
            setProgress(0);
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-all hover:bg-white/30"
          title="Previous user"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Next Group Navigation Arrow */}
      {groupIndex < effectiveGroups.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNextGroup();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-all hover:bg-white/30"
          title="Next user"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Story Player Container */}
      <div
        className="relative flex h-full w-full max-w-[420px] max-h-[860px] md:h-[92vh] flex-col overflow-hidden bg-zinc-950 md:rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <AnimatePresence custom={groupDirection} mode="popLayout" initial={false}>
          <motion.div
            key={currentGroup.user?._id || `group-${groupIndex}`}
            custom={groupDirection}
            variants={groupTransitionVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="relative flex h-full w-full flex-col overflow-hidden"
          >
            {/* Progress Bars Segmented Header */}
            <div className="absolute top-0 inset-x-0 z-30 p-3 pt-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-1.5 mb-3">
            {currentGroup.stories.map((s, idx) => {
              let fillPct = 0;
              if (idx < storyIndex) fillPct = 100;
              else if (idx === storyIndex) fillPct = progress;

              return (
                <div
                  key={s._id}
                  className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/30"
                >
                  <div
                    className="h-full bg-white transition-all duration-75 ease-linear"
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Story Header: Uploader Info & Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {currentGroup.user?.profileImage || (currentGroup.user as any)?.avatar ? (
                <img
                  src={currentGroup.user?.profileImage || (currentGroup.user as any)?.avatar}
                  alt={currentGroup.user.name || "User"}
                  className="h-9 w-9 rounded-full object-cover border border-white/40"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 font-bold text-xs text-white border border-white/40">
                  {(currentGroup.user?.name || "User").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-white drop-shadow-sm">
                    {currentGroup.user?.name || "User"}
                  </span>
                  <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-medium text-white/90 uppercase tracking-wider">
                    {currentGroup.user?.role || "Member"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-white/75">
                  <Clock size={11} />
                  <span>{formatRelativeTime(currentStory.createdAt)}</span>
                  {currentStory.site && (
                    <>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose();
                          navigate(
                            currentUserRole === "client"
                              ? `/client/site-progress?siteId=${currentStory.site?._id}`
                              : currentUserRole === "sitemanager"
                                ? `/siteManager/sites/${currentStory.site?._id}?tab=media`
                                : `/admin/sites/${currentStory.site?._id}?tab=media`
                          );
                        }}
                        className="inline-flex items-center gap-0.5 font-medium text-amber-300 hover:text-amber-200 hover:underline"
                        title="View Site"
                      >
                        <MapPin size={10} />
                        <span className="truncate max-w-[120px]">
                          {currentStory.site.name}
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-2">
              {currentStory.mediaType === "video" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  className="p-1.5 text-white/90 hover:text-white transition-colors"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-white/90 hover:text-white transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Media Container */}
        <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden">
          {currentStory.mediaType === "video" ? (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              muted={isMuted}
              playsInline
              autoPlay
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleVideoEnded}
              className="h-full w-full object-contain"
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt={currentStory.caption || "Story"}
              className="h-full w-full object-contain"
            />
          )}

          {/* Left & Right Tap Zones for Quick Navigation */}
          <div
            className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevStory();
            }}
          />
          <div
            className="absolute inset-y-0 right-0 w-1/3 z-10 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleNextStory();
            }}
          />
        </div>

        {/* Bottom Overlay: Caption, Watch Later, Views & Reactions */}
        <div className="absolute bottom-0 inset-x-0 z-30 p-4 pt-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          {/* Caption */}
          {currentStory.caption && (
            <div className="mb-3 text-left">
              <p className="text-sm font-normal text-white/95 drop-shadow-sm leading-relaxed whitespace-pre-wrap">
                {currentStory.caption}
              </p>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between gap-2 border-t border-white/15 pt-2.5">
            {/* Left: Viewers Count (ONLY visible for own stories) */}
            <div>
              {isOwner ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowViewersSheet(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/25 transition-colors"
                  title="View seen tracking details"
                >
                  <Eye size={14} />
                  <span>{viewCount}</span>
                </button>
              ) : null}
            </div>

            {/* Middle: Outlined Reactions (Only for other users' stories, not own stories) */}
            {!isOwner && (
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-1 rounded-full border border-white/15">
                {REACTION_OPTIONS.map((item) => {
                  const isSelected = currentUserReaction === item.id;
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReaction(item.id);
                      }}
                      className={cn(
                        "group p-1 rounded-full transition-all duration-150 active:scale-90",
                        isSelected
                          ? "bg-white/20 scale-110 shadow-sm"
                          : "hover:bg-white/10 hover:scale-105"
                      )}
                      title={isSelected ? `Remove ${item.label}` : item.label}
                    >
                      <IconComp
                        size={18}
                        className={cn(
                          "transition-colors duration-150 stroke-[2]",
                          isSelected
                            ? item.activeColor
                            : `text-white/80 ${item.hoverColor}`
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Right: Watch Later & Delete */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleSave}
                className={cn(
                  "p-1.5 rounded-full transition-colors",
                  isSavedState
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-white/15 text-white hover:bg-white/25"
                )}
                title={isSavedState ? "Saved in Watch Later" : "Save to Watch Later"}
              >
                <Bookmark size={16} className={isSavedState ? "fill-white" : ""} />
              </button>

              {canManage && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={deleting}
                  className="p-1.5 rounded-full bg-white/15 text-rose-300 hover:bg-rose-500 hover:text-white transition-colors"
                  title="Delete Story"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>

        {/* Seen Tracking Bottom Sheet (Viewers Modal) - Only for own stories */}
        {showViewersSheet && isOwner && (
          <div
            className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col justify-end"
            onClick={() => setShowViewersSheet(false)}
          >
            <div
              className="bg-zinc-900 border-t border-zinc-800 rounded-t-2xl p-4 max-h-[60%] flex flex-col text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-brand-400" />
                  <h4 className="text-sm font-semibold text-white">
                    Story Seen By ({combinedViewerList.length})
                  </h4>
                  {uniqueReactions.length > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[11px] font-semibold text-rose-300 border border-rose-500/30">
                      <Heart size={11} className="fill-rose-400 text-rose-400" />
                      {uniqueReactions.length} {uniqueReactions.length === 1 ? "reaction" : "reactions"}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowViewersSheet(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto space-y-2 flex-1 pr-1">
                {combinedViewerList.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">
                    No one has viewed this story yet.
                  </p>
                ) : (
                  combinedViewerList.map((v, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center justify-between gap-3 p-2 rounded-lg transition-colors",
                        v.reaction
                          ? "bg-zinc-800/90 border border-zinc-700/60"
                          : "bg-zinc-800/40"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        {v.user?.profileImage || (v.user as any)?.avatar ? (
                          <img
                            src={v.user?.profileImage || (v.user as any)?.avatar}
                            alt={v.user.name}
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-bold text-white">
                            {v.user?.name ? v.user.name.slice(0, 2).toUpperCase() : <UserIcon size={12} />}
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-semibold text-white">
                            {v.user?.name || "Unknown User"}
                          </div>
                          <div className="text-[10px] text-zinc-400 uppercase">
                            {v.user?.role || "Staff"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {v.reaction && renderReactionBadge(v.reaction.emoji)}
                        <span className="text-[10px] text-zinc-400">
                          {formatRelativeTime(v.viewedAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Custom Centered In-Story Toast (Simple non-colored, transparent dark bg, white text, smooth fade in/out) */}
        <AnimatePresence>
          {centerToast && (
            <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.88, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="rounded-2xl bg-black/70 backdrop-blur-md px-5 py-2.5 text-center text-sm font-semibold text-white shadow-2xl border border-white/15 max-w-[80%] break-words select-none"
              >
                {centerToast}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Custom Story Delete Confirmation Dialog (Transparent dark bg, white text, sleek centered UI) */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <div
              className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleCancelDelete();
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -4 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[280px] rounded-2xl bg-black/80 backdrop-blur-md p-5 text-center text-white shadow-2xl border border-white/20 select-none"
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <Trash2 size={18} />
                </div>
                <h4 className="text-sm font-bold tracking-tight text-white">
                  Delete Story?
                </h4>
                <p className="mt-1.5 text-xs text-white/70">
                  This story update will be permanently removed.
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelDelete}
                    disabled={deleting}
                    className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/20 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={deleting}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-600 active:scale-95 transition-all shadow-md shadow-rose-500/30 disabled:opacity-50"
                  >
                    {deleting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>,
    document.body
  );
};

export default StoryViewerModal;
