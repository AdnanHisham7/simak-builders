import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import {
  Project,
  ProjectGalleryImage,
  createProject,
  updateProject,
} from "@/services/portfolioService";

const PROJECT_CATEGORIES = ["Residential", "Commercial", "Industrial"];
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ProjectFormModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onSaved: () => void;
}

const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  project,
  onClose,
  onSaved,
}) => {
  const isEditMode = !!project;
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(project?.title || "");
  const [category, setCategory] = useState(project?.category || PROJECT_CATEGORIES[0]);
  const [location, setLocation] = useState(project?.location || "");
  const [description, setDescription] = useState(project?.description || "");
  const [status, setStatus] = useState<"ongoing" | "completed">(
    project?.status || "completed",
  );
  const [completionYear, setCompletionYear] = useState(
    project?.completionYear ? String(project.completionYear) : String(new Date().getFullYear()),
  );
  const [progressPercentage, setProgressPercentage] = useState(
    project?.progressPercentage ?? 100,
  );
  const [highlightsText, setHighlightsText] = useState(
    (project?.highlights || []).join("\n"),
  );
  const [clientTestimonial, setClientTestimonial] = useState(
    project?.clientTestimonial || "",
  );
  const [isPublished, setIsPublished] = useState(project?.isPublished || false);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [retainedGallery, setRetainedGallery] = useState<ProjectGalleryImage[]>(
    project?.gallery || [],
  );
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(coverFile);
    setCoverPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [coverFile]);

  const validateImageFile = (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Please select a JPEG, PNG, or WEBP image");
      return false;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error("Image must be smaller than 8MB");
      return false;
    }
    return true;
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !validateImageFile(file)) return;
    setCoverFile(file);
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const validFiles = files.filter(validateImageFile);
    setNewGalleryFiles((prev) => [...prev, ...validFiles].slice(0, 10));
  };

  const removeRetainedGalleryImage = (url: string) => {
    setRetainedGallery((prev) => prev.filter((image) => image.url !== url));
  };

  const removeNewGalleryFile = (index: number) => {
    setNewGalleryFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !category.trim() || !description.trim()) {
      toast.error("Title, category, and description are required");
      return;
    }
    if (!isEditMode && !coverFile) {
      toast.error("A cover image is required");
      return;
    }

    const highlights = highlightsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        location: location.trim(),
        completionYear: completionYear ? Number(completionYear) : undefined,
        status,
        progressPercentage,
        highlights,
        clientTestimonial: clientTestimonial.trim(),
        isPublished,
        coverImageFile: coverFile,
        galleryFiles: newGalleryFiles,
      };

      if (isEditMode && project) {
        await updateProject(project.id, {
          ...payload,
          retainedGallery,
        });
        toast.success("Project updated");
      } else {
        await createProject(payload);
        toast.success("Project created");
      }
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Edit project" : "New portfolio project"}
      size="lg"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-console-text">
              Project title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              {PROJECT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, State"
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "ongoing" | "completed")}
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">
              Completion year
            </label>
            <input
              type="number"
              value={completionYear}
              onChange={(e) => setCompletionYear(e.target.value)}
              min={2000}
              max={2100}
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-console-text">
              Progress ({progressPercentage}%)
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={progressPercentage}
              onChange={(e) => setProgressPercentage(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-console-text">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-console-text">
              Highlights (one per line, optional)
            </label>
            <textarea
              value={highlightsText}
              onChange={(e) => setHighlightsText(e.target.value)}
              rows={3}
              placeholder={"Modern open-plan design\nEnergy-efficient construction"}
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-console-text">
              Client testimonial (optional)
            </label>
            <textarea
              value={clientTestimonial}
              onChange={(e) => setClientTestimonial(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">
            Cover image
          </label>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-console-bg">
              {coverPreview || project?.imagePath ? (
                <img
                  src={coverPreview || project?.imagePath}
                  alt="Cover"
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImagePlus size={20} className="text-console-muted" />
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => coverInputRef.current?.click()}
            >
              {isEditMode ? "Replace image" : "Choose image"}
            </Button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleCoverSelect}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">
            Gallery images
          </label>
          <div className="flex flex-wrap gap-2">
            {retainedGallery.map((image) => (
              <div key={image.url} className="relative h-20 w-20 overflow-hidden rounded-lg">
                <img src={image.url} alt="Gallery" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeRetainedGalleryImage(image.url)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
            {newGalleryFiles.map((file, index) => (
              <div key={index} className="relative h-20 w-20 overflow-hidden rounded-lg">
                <img
                  src={URL.createObjectURL(file)}
                  alt="New gallery"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeNewGalleryFile(index)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-console-border text-console-muted hover:border-brand-400 hover:text-brand-600"
            >
              <ImagePlus size={18} />
            </button>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleGallerySelect}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-console-text">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="h-4 w-4 rounded border-console-border text-brand-600 focus:ring-brand-500"
          />
          Published (visible on the public portfolio page)
        </label>

        <div className="flex justify-end gap-2 border-t border-console-border pt-4">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting} disabled={submitting}>
            {isEditMode ? "Save changes" : "Create project"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProjectFormModal;
