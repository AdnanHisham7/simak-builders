import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "@/services/portfolioService";
import {
  Edit3,
  Trash2,
  Plus,
  X,
  Upload,
  Calendar,
  Filter,
  Search,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface Project {
  id: string;
  title: string;
  imagePath: string;
  category: string;
  description: string;
  createdAt: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: { duration: 0.2 },
  },
};

const CompanyPortfolio = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    projectId: string | null;
  }>({
    open: false,
    projectId: null,
  });
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [displayCount, setDisplayCount] = useState<number>(9);

  const userType = useSelector((state: RootState) => state.auth.userType);
  const categories = ["Residential", "Commercial", "Industrial"];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getProjects();
        setProjects(
          data.map((project: any) => ({ ...project, id: project._id }))
        );
      } catch (err) {
        setError("Failed to fetch projects");
      } finally {
        setIsFetching(false);
      }
    };
    fetchProjects();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files[0]) {
      setSelectedFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userType !== "admin") return;

    if (!isEditMode && !selectedFile) {
      setError("Image file is required for new projects");
      return;
    }

    try {
      setLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("description", formData.description);
      if (selectedFile) {
        formDataToSend.append("image", selectedFile);
      }

      if (isEditMode && currentProject) {
        await updateProject(currentProject.id, formDataToSend);
      } else {
        await createProject(formDataToSend);
      }

      const data = await getProjects();
      setProjects(
        data.map((project: any) => ({ ...project, id: project._id }))
      );
      setSuccess(
        isEditMode
          ? "Project updated successfully!"
          : "Project created successfully!"
      );
      setIsModalOpen(false);
      setFormData({ title: "", category: "", description: "" });
      setSelectedFile(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Operation failed");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (userType !== "admin") return;
    try {
      setLoading(true);
      await deleteProject(id);
      const data = await getProjects();
      setProjects(
        data.map((project: any) => ({ ...project, id: project._id }))
      );
      setSuccess("Project deleted successfully!");
      setDeleteConfirmation({ open: false, projectId: null });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete project");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirmation = (projectId: string) => {
    setDeleteConfirmation({ open: true, projectId });
  };

  const filteredProjects = projects.filter((project) => {
    const matchesFilter =
      activeFilter === "All" || project.category === activeFilter;
    const matchesSearch =
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const displayedProjects = filteredProjects.slice(0, displayCount);

  const handleLoadMore = () => {
    setDisplayCount((prevCount) => prevCount + 9);
  };

  if (isFetching)
    return <div className="text-center py-12">Loading projects...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AnimatePresence>
        {(success || error) && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-4 right-4 z-50"
          >
            <div
              className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg backdrop-blur-sm ${
                success
                  ? "bg-green-500/90 text-white"
                  : "bg-red-500/90 text-white"
              }`}
            >
              {success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
              <span className="font-medium">{success || error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto py-12 px-4 sm:px-8 md:px-16 lg:px-36"
      >
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Our Portfolio
              </h1>
              <p className="text-gray-600">
                Showcasing our finest architectural achievements
              </p>
            </div>
            {userType === "admin" && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsEditMode(false);
                  setFormData({ title: "", category: "", description: "" });
                  setSelectedFile(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                Add Project
              </motion.button>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 flex flex-col md:flex-row gap-4 items-center justify-between"
          >
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/70 backdrop-blur-sm"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500 mr-2" />
              {["All", ...categories].map((category) => (
                <motion.button
                  key={category}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveFilter(category)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeFilter === category
                      ? "bg-yellow-800 text-white shadow-lg"
                      : "bg-white/70 text-gray-700 hover:bg-white border border-gray-200 backdrop-blur-sm"
                  }`}
                >
                  {category}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>

        {displayedProjects.length > 0 ? (
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {displayedProjects.map((project) => (
              <motion.div
                key={project.id}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl_blob-blur-sm"
              >
                {userType === "admin" && (
                  <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setIsEditMode(true);
                        setCurrentProject(project);
                        setFormData({
                          title: project.title,
                          category: project.category,
                          description: project.description,
                        });
                        setSelectedFile(null);
                        setIsModalOpen(true);
                      }}
                      className="p-3 bg-blue-600/90 text-white rounded-lg backdrop-blur-sm hover:bg-blue-700 transition-all duration-300 shadow-lg"
                    >
                      <Edit3 className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openDeleteConfirmation(project.id)}
                      className="p-3 bg-red-600/90 text-white rounded-lg backdrop-blur-sm hover:bg-red-700 transition-all duration-300 shadow-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                )}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={`${import.meta.env.VITE_API_URL}/${project.imagePath}`}
                    alt={project.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-yellow-800 transition-colors duration-300">
                      {project.title}
                    </h3>
                    <span className="bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 text-xs px-3 py-1 rounded-full font-medium">
                      {project.category}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {project.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <p className="text-gray-600 text-lg">
              {projects.length === 0
                ? "No projects available"
                : "No projects match your search"}
            </p>
          </motion.div>
        )}

        {displayCount < filteredProjects.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 text-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLoadMore}
              className="px-8 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-300 font-medium text-gray-700 backdrop-blur-sm"
            >
              Load More Projects
            </motion.button>
          </motion.div>
        )}
      </motion.section>

      <AnimatePresence>
        {isModalOpen && userType === "admin" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto scrollbar-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEditMode ? "Edit Project" : "Add New Project"}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </motion.button>
              </div>
              <div className="p-6 space-y-6">
                <div onSubmit={handleFormSubmit}>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Project Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter project title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Project Image
                    </label>
                    {isEditMode && currentProject && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-600 mb-2">
                          Current Image:
                        </p>
                        <img
                          src={`${import.meta.env.VITE_API_URL}/${
                            currentProject.imagePath
                          }`}
                          alt="Current project image"
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${
                        dragActive
                          ? "border-blue-400 bg-blue-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Drag & drop your image here, or click to browse
                      </p>
                      <input
                        type="file"
                        onChange={(e) =>
                          setSelectedFile(e.target.files?.[0] || null)
                        }
                        className="hidden"
                        accept="image/*"
                        required={!isEditMode}
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors duration-200"
                      >
                        Choose File
                      </label>
                      {selectedFile && (
                        <p className="text-sm text-green-600 mt-2">
                          Selected: {selectedFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
                      placeholder="Describe your project..."
                      required
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-300"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleFormSubmit}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading
                        ? "Processing..."
                        : isEditMode
                        ? "Update Project"
                        : "Create Project"}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirmation.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4"
            onClick={() =>
              setDeleteConfirmation({ open: false, projectId: null })
            }
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Delete Project
                    </h3>
                    <p className="text-gray-600">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete this project? All data
                  associated with this project will be permanently removed.
                </p>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      setDeleteConfirmation({ open: false, projectId: null })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-300"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      deleteConfirmation.projectId &&
                      handleDelete(deleteConfirmation.projectId)
                    }
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Deleting..." : "Delete"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompanyPortfolio;
