import React, { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Image,
  Tag,
  FileText,
  Calendar,
} from "lucide-react";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "@/services/portfolioService";

interface Project {
  id: string;
  title: string;
  imagePath: string;
  category: string;
  description: string;
  createdAt: string;
}

interface ProjectFormData {
  title: string;
  imagePath: string;
  category: string;
  description: string;
}

const Portfolio: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    imagePath: "",
    category: "",
    description: "",
  });
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getProjects();
        setProjects(
          data.map((project: any) => ({ ...project, id: project._id }))
        );
      } catch (err) {
        setError("Failed to fetch projects");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    setIsEditMode(false);
    setFormData({ title: "", imagePath: "", category: "", description: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setIsEditMode(true);
    setCurrentProject(project);
    setFormData({
      title: project.title,
      imagePath: project.imagePath,
      category: project.category,
      description: project.description,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentProject(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode && currentProject) {
        await updateProject(currentProject.id, formData);
      } else {
        await createProject(formData);
      }
      closeModal();
      const data = await getProjects();
      setProjects(
        data.map((project: any) => ({ ...project, id: project._id }))
      );
    } catch (err) {
      setError("Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteProject(id);
        const data = await getProjects();
        setProjects(
          data.map((project: any) => ({ ...project, id: project._id }))
        );
      } catch (err) {
        setError("Failed to delete project");
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Project Portfolio</h1>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-500 text-white rounded flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Project
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="bg-white p-4 rounded shadow">
            <img
              src={project.imagePath}
              alt={project.title}
              className="w-full h-48 object-cover mb-4"
            />
            <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
            <p className="text-gray-600 mb-2">{project.category}</p>
            <p className="text-gray-700 mb-4">{project.description}</p>
            <div className="flex justify-between">
              <button
                onClick={() => openEditModal(project)}
                className="text-blue-500"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(project.id)}
                className="text-red-500"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {isEditMode ? "Edit Project" : "Add New Project"}
            </h2>
            <form onSubmit={handleFormSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="mt-1 p-2 border rounded w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Image Path
                </label>
                <input
                  type="text"
                  name="imagePath"
                  value={formData.imagePath}
                  onChange={handleInputChange}
                  className="mt-1 p-2 border rounded w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="mt-1 p-2 border rounded w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1 p-2 border rounded w-full"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  {isEditMode ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
