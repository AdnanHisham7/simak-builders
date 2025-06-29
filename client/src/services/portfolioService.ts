import { privateClient } from "@/api";

export const getProjects = async () => {
  const response = await privateClient.get("/projects");
  return response.data;
};

export const getProjectById = async (id: string) => {
  const response = await privateClient.get(`/projects/${id}`);
  return response.data;
};

export const createProject = async (projectData: any) => {
  const response = await privateClient.post("/projects", projectData);
  return response.data;
};

export const updateProject = async (id: string, projectData: any) => {
  const response = await privateClient.put(`/projects/${id}`, projectData);
  return response.data;
};

export const deleteProject = async (id: string) => {
  await privateClient.delete(`/projects/${id}`);
};