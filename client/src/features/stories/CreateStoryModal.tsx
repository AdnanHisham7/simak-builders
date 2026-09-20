import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Upload, Film, Image as ImageIcon, CheckCircle, AlertCircle, Building2 } from "lucide-react";
import { createStory } from "../../services/storyService";
import { getSites } from "../../services/siteService";
import type { Site } from "../../entities/site";

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: () => void;
  initialSiteId?: string;
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  onStoryCreated,
  initialSiteId,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [caption, setCaption] = useState("");
  const [siteId, setSiteId] = useState<string>(initialSiteId || "");
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSiteId(initialSiteId || "");
      getSites()
        .then((data) => setSites(data))
        .catch(() => {});
    } else {
      resetForm();
    }
  }, [isOpen, initialSiteId]);

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

  const resetForm = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setCaption("");
    setSiteId(initialSiteId || "");
    setError(null);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const isVideo = selected.type.startsWith("video/");
    const isImage = selected.type.startsWith("image/");

    if (!isVideo && !isImage) {
      setError("Please select a valid image or video file (JPG, PNG, WEBP, MP4, MOV, WEBM).");
      return;
    }

    if (selected.size > 50 * 1024 * 1024) {
      setError("File size exceeds 50MB limit.");
      return;
    }

    setFile(selected);
    setMediaType(isVideo ? "video" : "image");
    setError(null);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a photo or video to post as a story.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);
      if (siteId) formData.append("siteId", siteId);
      if (caption.trim()) formData.append("caption", caption.trim());

      await createStory(formData);
      onStoryCreated();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Failed to post story. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="create-story-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto"
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
            className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-8"
          >
            {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Create New Story</h2>
            <span className="rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50 px-2 py-0.5 text-xs font-semibold">
              24h Expiry
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 p-3.5 text-sm text-rose-600 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Media Upload / Preview Area */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Media (Photo or Video)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime,video/x-matroska"
              onChange={handleFileChange}
              className="hidden"
            />

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 p-8 text-center cursor-pointer hover:border-brand-500/70 hover:bg-brand-50/20 dark:hover:bg-brand-950/10 transition-all duration-200"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 group-hover:scale-105 transition-transform">
                  <Upload className="h-6 w-6 text-brand-500" />
                </div>
                <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-200">
                  Click to upload media
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Supports JPG, PNG, WEBP, MP4, MOV, WEBM (Max 50MB)
                </p>
                <div className="mt-4 flex items-center gap-3 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5" /> Photos
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Film className="h-3.5 w-3.5" /> Videos
                  </span>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/12] max-h-80 w-full flex items-center justify-center group shadow-inner">
                {mediaType === "video" ? (
                  <video
                    src={previewUrl}
                    controls
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-full w-full object-contain"
                  />
                )}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-medium text-white hover:bg-black/80 transition-colors"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }}
                    className="rounded-full bg-rose-600/80 p-1 text-white hover:bg-rose-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Site Tagging (Optional) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Associate with Site <span className="text-zinc-400 font-normal lowercase">(optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Building2 className="h-4 w-4" />
              </div>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
              >
                <option value="">None (General Company Story)</option>
                {sites.map((site) => {
                  const sId = (site as any).id || site._id;
                  const sCity = site.city || (site as any).location?.city || "";
                  return (
                    <option key={sId} value={sId}>
                      {site.name} {sCity ? `(${sCity})` : ""}
                    </option>
                  );
                })}
              </select>
            </div>
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              Tagged stories will also be permanently archived under the site's <strong className="font-semibold text-zinc-700 dark:text-zinc-300">Media Tab</strong>.
            </p>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Caption / Update Note <span className="text-zinc-400 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's happening on site today? (e.g., Foundation concrete pouring completed)"
              maxLength={200}
              className="w-full resize-none rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 p-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
            />
            <div className="flex justify-end text-[11px] text-zinc-400 mt-1">
              {caption.length}/200
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 via-amber-500 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-500/20 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Posting Story...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Share Story</span>
                </>
              )}
            </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>,
  document.body
);
};
