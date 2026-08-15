import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, Search, Filter, Quote } from "lucide-react";
import { getPublishedProjects, Project } from "@/services/portfolioService";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const CompanyPortfolio = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [displayCount, setDisplayCount] = useState(9);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getPublishedProjects();
        setProjects(data);
      } catch (err) {
        setError("Failed to load our portfolio right now.");
      } finally {
        setIsFetching(false);
      }
    };
    fetchProjects();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(projects.map((project) => project.category))).sort(),
    [projects],
  );

  const filteredProjects = projects.filter((project) => {
    const matchesFilter = activeFilter === "All" || project.category === activeFilter;
    const matchesSearch =
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const displayedProjects = filteredProjects.slice(0, displayCount);

  if (isFetching) {
    return <div className="min-h-screen py-12 text-center">Loading our portfolio...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto px-4 py-12 sm:px-8 md:px-16 lg:px-36"
      >
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Our Portfolio</h1>
            <p className="text-gray-600">Showcasing our finest construction achievements</p>
          </motion.div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          {projects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 flex flex-col items-center justify-between gap-4 md:flex-row"
            >
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white/70 py-3 pl-10 pr-4 backdrop-blur-sm transition-all duration-300 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="mr-2 h-5 w-5 text-gray-500" />
                {["All", ...categories].map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveFilter(category)}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 ${
                      activeFilter === category
                        ? "bg-yellow-800 text-white shadow-lg"
                        : "border border-gray-200 bg-white/70 text-gray-700 backdrop-blur-sm hover:bg-white"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {displayedProjects.length > 0 ? (
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            {displayedProjects.map((project) => (
              <motion.div
                key={project.id}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                onClick={() => setSelectedProject(project)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white shadow-lg transition-shadow duration-300 hover:shadow-2xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={project.imagePath}
                    alt={project.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  {project.status === "ongoing" && (
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-blue-700 backdrop-blur-sm">
                      In progress &middot; {project.progressPercentage}%
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <div className="mb-3 flex items-start justify-between">
                    <h3 className="text-xl font-bold text-gray-900 transition-colors duration-300 group-hover:text-yellow-800">
                      {project.title}
                    </h3>
                    <span className="rounded-full bg-gradient-to-r from-yellow-100 to-yellow-200 px-3 py-1 text-xs font-medium text-yellow-800">
                      {project.category}
                    </span>
                  </div>
                  <p className="mb-4 line-clamp-2 text-gray-600">{project.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    {project.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" /> {project.location}
                      </span>
                    )}
                    {project.completionYear && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" /> {project.completionYear}
                      </span>
                    )}
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
            className="py-12 text-center"
          >
            <p className="text-lg text-gray-600">
              {projects.length === 0
                ? "No projects available yet — check back soon!"
                : "No projects match your search"}
            </p>
          </motion.div>
        )}

        {displayCount < filteredProjects.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <button
              onClick={() => setDisplayCount((prev) => prev + 9)}
              className="rounded-xl border-2 border-gray-300 px-8 py-3 font-medium text-gray-700 transition-all duration-300 hover:bg-gray-50"
            >
              Load More Projects
            </button>
          </motion.div>
        )}
      </motion.section>

      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedProject.imagePath}
              alt={selectedProject.title}
              className="h-72 w-full object-cover"
            />
            <div className="p-6">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedProject.title}</h2>
                  <p className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                    {selectedProject.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" /> {selectedProject.location}
                      </span>
                    )}
                    {selectedProject.completionYear && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" /> {selectedProject.completionYear}
                      </span>
                    )}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                  {selectedProject.category}
                </span>
              </div>
              <p className="whitespace-pre-line text-gray-700">{selectedProject.description}</p>

              {selectedProject.highlights.length > 0 && (
                <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {selectedProject.highlights.map((highlight, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-700" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              )}

              {selectedProject.gallery.length > 0 && (
                <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {selectedProject.gallery.map((image, index) => (
                    <img
                      key={index}
                      src={image.url}
                      alt={`${selectedProject.title} photo ${index + 1}`}
                      className="aspect-square rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}

              {selectedProject.clientTestimonial && (
                <blockquote className="mt-6 flex gap-3 rounded-xl bg-gray-50 p-5 text-gray-700">
                  <Quote className="h-5 w-5 shrink-0 text-yellow-700" />
                  <p className="italic">{selectedProject.clientTestimonial}</p>
                </blockquote>
              )}

              <button
                onClick={() => setSelectedProject(null)}
                className="mt-6 w-full rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyPortfolio;
