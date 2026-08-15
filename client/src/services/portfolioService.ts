import { privateClient, publicClient } from "@/api";

export interface ProjectGalleryImage {
  url: string;
  publicId?: string;
}

export interface Project {
  id: string;
  _id: string;
  title: string;
  imagePath: string;
  imagePublicId?: string;
  gallery: ProjectGalleryImage[];
  category: string;
  description: string;
  location: string;
  completionYear?: number;
  status: "ongoing" | "completed";
  progressPercentage: number;
  highlights: string[];
  clientTestimonial?: string;
  sourceSite?: { _id: string; name: string; city: string; state: string; status: string } | string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

const normalizeProject = (raw: any): Project => ({ ...raw, id: raw._id });

export const getPublishedProjects = async (): Promise<Project[]> => {
  const response = await publicClient.get("/projects");
  return response.data.map(normalizeProject);
};

export const getAllProjects = async (): Promise<Project[]> => {
  const response = await privateClient.get("/projects", {
    params: { includeDrafts: "true" },
  });
  return response.data.map(normalizeProject);
};

export const getProjectById = async (id: string): Promise<Project> => {
  const response = await privateClient.get(`/projects/${id}`);
  return normalizeProject(response.data);
};

export const getProjectBySiteId = async (
  siteId: string,
): Promise<Project | null> => {
  const response = await privateClient.get(`/projects/site/${siteId}`);
  return response.data ? normalizeProject(response.data) : null;
};

export interface ProjectFormPayload {
  title: string;
  category: string;
  description: string;
  location?: string;
  completionYear?: number;
  status?: "ongoing" | "completed";
  progressPercentage?: number;
  highlights?: string[];
  clientTestimonial?: string;
  isPublished?: boolean;
  sourceSite?: string;
  coverImageFile?: File | null;
  existingImagePath?: string;
  existingImagePublicId?: string;
  galleryFiles?: File[];
  existingGallery?: ProjectGalleryImage[];
}

const buildProjectFormData = (payload: ProjectFormPayload): FormData => {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("category", payload.category);
  formData.append("description", payload.description);
  if (payload.location !== undefined) formData.append("location", payload.location);
  if (payload.completionYear !== undefined) {
    formData.append("completionYear", String(payload.completionYear));
  }
  if (payload.status) formData.append("status", payload.status);
  if (payload.progressPercentage !== undefined) {
    formData.append("progressPercentage", String(payload.progressPercentage));
  }
  if (payload.highlights) {
    formData.append("highlights", JSON.stringify(payload.highlights));
  }
  if (payload.clientTestimonial !== undefined) {
    formData.append("clientTestimonial", payload.clientTestimonial);
  }
  if (payload.isPublished !== undefined) {
    formData.append("isPublished", String(payload.isPublished));
  }
  if (payload.sourceSite) formData.append("sourceSite", payload.sourceSite);

  if (payload.coverImageFile) {
    formData.append("image", payload.coverImageFile);
  } else if (payload.existingImagePath) {
    formData.append("existingImagePath", payload.existingImagePath);
    if (payload.existingImagePublicId) {
      formData.append("existingImagePublicId", payload.existingImagePublicId);
    }
  }

  if (payload.galleryFiles?.length) {
    payload.galleryFiles.forEach((file) => formData.append("gallery", file));
  }
  if (payload.existingGallery) {
    formData.append("existingGallery", JSON.stringify(payload.existingGallery));
  }

  return formData;
};

export const createProject = async (
  payload: ProjectFormPayload,
): Promise<Project> => {
  const formData = buildProjectFormData(payload);
  const response = await privateClient.post("/projects", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return normalizeProject(response.data);
};

export interface ProjectUpdatePayload extends ProjectFormPayload {
  retainedGallery?: ProjectGalleryImage[];
}

export const updateProject = async (
  id: string,
  payload: ProjectUpdatePayload,
): Promise<Project> => {
  const formData = buildProjectFormData({
    ...payload,
    existingGallery: payload.retainedGallery ?? payload.existingGallery,
  });
  const response = await privateClient.put(`/projects/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return normalizeProject(response.data);
};

export const setProjectPublishStatus = async (
  id: string,
  isPublished: boolean,
): Promise<Project> => {
  const response = await privateClient.patch(`/projects/${id}/publish`, {
    isPublished,
  });
  return normalizeProject(response.data);
};

export const deleteProject = async (id: string): Promise<void> => {
  await privateClient.delete(`/projects/${id}`);
};
