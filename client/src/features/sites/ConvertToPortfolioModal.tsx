import { useMemo, useState } from "react";
import { ImagePlus, Info, X } from "lucide-react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Document as SiteDocument } from "@/services/siteService";
import { createProject, ProjectGalleryImage } from "@/services/portfolioService";

const PROJECT_CATEGORIES = ["Residential", "Commercial", "Industrial"];

export interface ConvertibleSite {
  id: string;
  name: string;
  city: string;
  state: string;
  status: string;
  updatedAt: string;
  phases: Array<{ status: "not started" | "pending" | "completed" }>;
  documents: SiteDocument[];
}

interface ConvertToPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: ConvertibleSite;
  onConverted: () => void;
}

const isImageDocument = (doc: SiteDocument) => doc.type.startsWith("image/");

const computeProgressPercentage = (site: ConvertibleSite): number => {
  if (!site.phases || site.phases.length === 0) return site.status === "Completed" ? 100 : 0;
  const completed = site.phases.filter((phase) => phase.status === "completed").length;
  return Math.round((completed / site.phases.length) * 100);
};

const ConvertToPortfolioModal: React.FC<ConvertToPortfolioModalProps> = ({
  isOpen,
  onClose,
  site,
  onConverted,
}) => {
  const eligibleImages = useMemo(
    () => (site.documents || []).filter((doc) => doc.category === "site" && isImageDocument(doc)),
    [site.documents],
  );

  const [title, setTitle] = useState(site.name);
  const [category, setCategory] = useState(PROJECT_CATEGORIES[0]);
  const [location, setLocation] = useState(`${site.city}, ${site.state}`);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"ongoing" | "completed">(
    site.status === "Completed" ? "completed" : "ongoing",
  );
  const [completionYear, setCompletionYear] = useState(
    String(new Date(site.status === "Completed" ? site.updatedAt : Date.now()).getFullYear()),
  );
  const [progressPercentage, setProgressPercentage] = useState(computeProgressPercentage(site));
  const [coverDocumentUrl, setCoverDocumentUrl] = useState<string>(
    eligibleImages[0]?.url || "",
  );
  const [selectedGalleryUrls, setSelectedGalleryUrls] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleGalleryImage = (url: string) => {
    setSelectedGalleryUrls((prev) =>
      prev.includes(url) ? prev.filter((item) => item !== url) : [...prev, url],
    );
  };

  const handleSubmit = async () => {
    if (!title.trim() || !category.trim() || !description.trim()) {
      toast.error("Title, category, and description are required");
      return;
    }
    if (!coverDocumentUrl) {
      toast.error("Please select a cover image from the site's photos");
      return;
    }

    const coverDoc = eligibleImages.find((doc) => doc.url === coverDocumentUrl);
    const galleryDocs = eligibleImages.filter((doc) =>
      selectedGalleryUrls.includes(doc.url),
    );
    const existingGallery: ProjectGalleryImage[] = galleryDocs.map((doc) => ({
      url: doc.url,
    }));

    setSubmitting(true);
    try {
      await createProject({
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        location: location.trim(),
        completionYear: completionYear ? Number(completionYear) : undefined,
        status,
        progressPercentage,
        isPublished,
        sourceSite: site.id,
        existingImagePath: coverDoc?.url,
        existingGallery,
      });
      toast.success("Site converted to a portfolio project");
      onConverted();
      onClose();
    } catch (err: any) {
      toast.error(
        err.response?.data?.error || "Failed to convert site to a portfolio project",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Convert to portfolio project"
      description="Create a client-facing showcase for this site. Financial and client details are never included."
      size="lg"
    >
      <div className="space-y-5">
        <div className="flex items-start gap-2.5 rounded-console border border-info-100 bg-info-50 p-3.5 text-sm text-info-800">
          <Info size={16} className="mt-0.5 shrink-0" />
          <p>
            Only photos tagged as site photos are available to choose from. Budget,
            expenses, and client identity are never carried over.
          </p>
        </div>

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
              placeholder="Describe this project for external visitors — scope, design highlights, notable features..."
              className="w-full rounded-lg border border-console-border px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-console-text">
            Cover image
          </label>
          {eligibleImages.length === 0 ? (
            <p className="rounded-console border border-console-border bg-console-bg p-4 text-sm text-console-muted">
              No site photos are available yet. Upload site photos to this site first,
              then convert it to a portfolio project.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {eligibleImages.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setCoverDocumentUrl(doc.url)}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                    coverDocumentUrl === doc.url
                      ? "border-brand-600"
                      : "border-transparent hover:border-console-border"
                  }`}
                >
                  <img src={doc.url} alt={doc.name} className="h-full w-full object-cover" />
                  {coverDocumentUrl === doc.url && (
                    <span className="absolute inset-x-0 bottom-0 bg-brand-700 py-0.5 text-center text-[11px] font-medium text-white">
                      Cover
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {eligibleImages.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-console-text">
              Gallery images (optional)
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {eligibleImages
                .filter((doc) => doc.url !== coverDocumentUrl)
                .map((doc) => {
                  const selected = selectedGalleryUrls.includes(doc.url);
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => toggleGalleryImage(doc.url)}
                      className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                        selected
                          ? "border-brand-600"
                          : "border-transparent hover:border-console-border"
                      }`}
                    >
                      <img
                        src={doc.url}
                        alt={doc.name}
                        className="h-full w-full object-cover"
                      />
                      {selected && (
                        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-700 text-white">
                          <ImagePlus size={11} />
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-console-text">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="h-4 w-4 rounded border-console-border text-brand-600 focus:ring-brand-500"
          />
          Publish immediately to the public portfolio page
        </label>

        <div className="flex justify-end gap-2 border-t border-console-border pt-4">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            <X size={15} /> Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting} disabled={submitting}>
            Convert to portfolio project
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConvertToPortfolioModal;
