import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import ConfirmModal from "@/components/ui/ConfirmModal";
import EmptyState from "@/components/ui/EmptyState";
import {
  Project,
  getAllProjects,
  setProjectPublishStatus,
  deleteProject,
} from "@/services/portfolioService";
import { getSites, Site } from "@/services/siteService";
import ConvertToPortfolioModal from "@/features/sites/ConvertToPortfolioModal";
import ProjectFormModal from "./components/ProjectFormModal";
import SitePickerModal from "./components/SitePickerModal";

const Portfolio: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [highlightedProjectId, setHighlightedProjectId] = useState<string | null>(null);
  const projectCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [isSitePickerOpen, setIsSitePickerOpen] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [convertingSite, setConvertingSite] = useState<Site | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await getAllProjects();
      setProjects(data);
    } catch (err) {
      toast.error("Failed to load portfolio projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    const targetProjectId = searchParams.get("projectId");
    if (!targetProjectId) return;
    setStatusFilter("all");
    setSearchTerm("");
  }, [searchParams]);

  useEffect(() => {
    const targetProjectId = searchParams.get("projectId");
    if (!targetProjectId || loading) return;

    const projectExists = projects.some((project) => project.id === targetProjectId);
    if (!projectExists) return;

    const frame = requestAnimationFrame(() => {
      const cardEl = projectCardRefs.current[targetProjectId];
      if (!cardEl) return;
      cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedProjectId(targetProjectId);
    });

    return () => cancelAnimationFrame(frame);
  }, [searchParams, loading, projects, statusFilter, searchTerm]);

  useEffect(() => {
    if (!highlightedProjectId) return;

    const timer = setTimeout(() => {
      setHighlightedProjectId(null);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("projectId");
          return next;
        },
        { replace: true },
      );
    }, 2600);

    return () => clearTimeout(timer);
  }, [highlightedProjectId, setSearchParams]);

  const convertedSiteIds = useMemo(
    () =>
      new Set(
        projects
          .map((project) => {
            const source = project.sourceSite;
            if (!source) return undefined;
            return typeof source === "string" ? source : source._id;
          })
          .filter((id): id is string => !!id),
      ),
    [projects],
  );

  const openSitePicker = async () => {
    setIsSitePickerOpen(true);
    setSitesLoading(true);
    try {
      const data = await getSites();
      setSites(data);
    } catch (err) {
      toast.error("Failed to load sites");
    } finally {
      setSitesLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" ? project.isPublished : !project.isPublished);
    const matchesSearch =
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleTogglePublish = async (project: Project) => {
    setTogglingId(project.id);
    try {
      const updated = await setProjectPublishStatus(project.id, !project.isPublished);
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success(updated.isPublished ? "Project published" : "Project unpublished");
    } catch (err) {
      toast.error("Failed to update publish status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success("Project deleted");
    } catch (err) {
      toast.error("Failed to delete project");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-console-text">Portfolio</h1>
          <p className="mt-0.5 text-sm text-console-muted">
            Manage the projects shown on the public portfolio page
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openSitePicker}>
            <Layers size={15} /> Convert a site
          </Button>
          <Button
            onClick={() => {
              setEditingProject(null);
              setIsFormModalOpen(true);
            }}
          >
            <Plus size={15} /> New project
          </Button>
        </div>
      </div>

      <Card>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-console-muted" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-console-border py-2.5 pl-9 pr-3.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="flex gap-1.5 rounded-lg border border-console-border p-1">
            {(["all", "published", "draft"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  statusFilter === status
                    ? "bg-brand-700 text-white"
                    : "text-console-muted hover:text-console-text"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-64 w-full rounded-glass" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            title="No portfolio projects yet"
            description="Create a project manually, or convert an existing site into one."
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                ref={(el) => {
                  projectCardRefs.current[project.id] = el;
                }}
                className={`overflow-hidden rounded-glass border bg-console-surface ${
                  highlightedProjectId === project.id
                    ? "border-brand-400 animate-highlight-fade"
                    : "border-console-border"
                }`}
              >
                <div className="relative aspect-video">
                  <img
                    src={project.imagePath}
                    alt={project.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute left-2 top-2 flex gap-1.5">
                    <Badge variant={project.isPublished ? "success" : "neutral"}>
                      {project.isPublished ? "Published" : "Draft"}
                    </Badge>
                    {project.sourceSite && (
                      <Badge variant="info">
                        <Layers size={11} /> From site
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold text-console-text">
                      {project.title}
                    </h3>
                    <span className="shrink-0 text-xs text-console-muted">
                      {project.category}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-console-muted">
                    {project.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-console-border pt-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProject(project);
                          setIsFormModalOpen(true);
                        }}
                        className="rounded-lg p-1.5 text-console-muted hover:bg-console-bg hover:text-console-text"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(project)}
                        className="rounded-lg p-1.5 text-console-muted hover:bg-danger-50 hover:text-danger-600"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(project)}
                      disabled={togglingId === project.id}
                      className="flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:text-brand-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {project.isPublished ? (
                        <>
                          <EyeOff size={13} /> Unpublish
                        </>
                      ) : (
                        <>
                          <Eye size={13} /> Publish
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {isFormModalOpen && (
        <ProjectFormModal
          isOpen={isFormModalOpen}
          project={editingProject}
          onClose={() => setIsFormModalOpen(false)}
          onSaved={() => {
            setIsFormModalOpen(false);
            loadProjects();
          }}
        />
      )}

      {isSitePickerOpen && (
        <SitePickerModal
          isOpen={isSitePickerOpen}
          sites={sites}
          loading={sitesLoading}
          convertedSiteIds={convertedSiteIds}
          onClose={() => setIsSitePickerOpen(false)}
          onSelect={(site) => {
            setIsSitePickerOpen(false);
            setConvertingSite(site);
          }}
        />
      )}

      {convertingSite && (
        <ConvertToPortfolioModal
          isOpen={!!convertingSite}
          site={convertingSite}
          onClose={() => setConvertingSite(null)}
          onConverted={() => {
            setConvertingSite(null);
            loadProjects();
          }}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this project?"
        message={`"${deleteTarget?.title}" will be permanently removed from the portfolio.`}
        variant="danger"
        confirmText="Delete"
        isLoading={deleting}
      />
    </div>
  );
};

export default Portfolio;
