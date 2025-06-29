import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { MutableRefObject } from "react";
import {
  AdjustmentsVerticalIcon,
  ChevronDownIcon,
  FunnelIcon,
  XMarkIcon,
} from "@/assets/icons";
import CompanyCard from "../company/CompanyCard";
import { ICompany } from "@/store/types/company";
import useScrollAnimation from "@/hooks/auth/useScrollAnimation";

// Sample data for companies
const companiesData = [
  {
    id: 1,
    name: "TechCraft Industries",
    verified: true,
    location: "San Francisco, CA",
    description:
      "Leading provider of custom manufacturing solutions for technology companies with focus on precision engineering.",
    categories: ["Manufacturing", "Technology", "Engineering"],
    rating: 4.8,
    reviewCount: 237,
    logoColor: "bg-blue-500",
    initials: "TC",
    image: "",
  },
  {
    id: 2,
    name: "GlobalFab Solutions",
    verified: true,
    location: "Austin, TX",
    description:
      "Specialized in industrial production with state-of-the-art machinery for high-volume manufacturing needs.",
    categories: ["Industrial", "Fabrication", "Mass Production"],
    rating: 4.5,
    reviewCount: 182,
    logoColor: "bg-green-600",
    initials: "GF",
    image: "",
  },
  {
    id: 3,
    name: "MetalWorks Pro",
    verified: false,
    location: "Detroit, MI",
    description:
      "Expert metalworking and precision components for automotive, aerospace, and consumer electronics.",
    categories: ["Metalworking", "Automotive", "Aerospace"],
    rating: 4.2,
    reviewCount: 94,
    logoColor: "bg-gray-700",
    initials: "MW",
    image: "",
  },
  {
    id: 4,
    name: "PrecisionTech Manufacturing",
    verified: true,
    location: "Boston, MA",
    description:
      "Innovative manufacturing techniques with focus on high-precision components for medical and scientific devices.",
    categories: ["Medical", "Precision", "Scientific"],
    rating: 4.9,
    reviewCount: 156,
    logoColor: "bg-purple-600",
    initials: "PT",
    image: "",
  },
  {
    id: 5,
    name: "EcoFabric Solutions",
    verified: true,
    location: "Portland, OR",
    description:
      "Sustainable manufacturing practices and environmentally conscious production processes for modern businesses.",
    categories: ["Sustainable", "Eco-friendly", "Green Manufacturing"],
    rating: 4.7,
    reviewCount: 128,
    logoColor: "bg-green-500",
    initials: "EF",
    image: "",
  },
  {
    id: 6,
    name: "RapidBuild Systems",
    verified: false,
    location: "Chicago, IL",
    description:
      "Rapid prototyping and small-batch production for startups and innovative product development teams.",
    categories: ["Prototyping", "Small-batch", "Innovation"],
    rating: 4.3,
    reviewCount: 76,
    logoColor: "bg-red-500",
    initials: "RB",
    image: "",
  },
  {
    id: 7,
    name: "IntegraTech Solutions",
    verified: true,
    location: "Seattle, WA",
    description:
      "Full-service manufacturing and integration systems with advanced IoT capabilities for smart factories.",
    categories: ["IoT", "Smart Manufacturing", "Automation"],
    rating: 4.6,
    reviewCount: 145,
    logoColor: "bg-indigo-600",
    initials: "IT",
    image: "",
  },
  {
    id: 8,
    name: "QualityFab Industries",
    verified: true,
    location: "Denver, CO",
    description:
      "Quality-focused manufacturing partner with stringent quality control processes and ISO certifications.",
    categories: ["Quality Control", "ISO Certified", "Precision"],
    rating: 4.8,
    reviewCount: 203,
    logoColor: "bg-yellow-600",
    initials: "QF",
    image: "",
  },
];

// Available filters
const filterCategories = [
  {
    name: "Industry",
    options: [
      "Manufacturing",
      "Technology",
      "Engineering",
      "Automotive",
      "Medical",
      "Aerospace",
      "Industrial",
    ],
  },
  {
    name: "Services",
    options: [
      "Custom Manufacturing",
      "Prototyping",
      "Mass Production",
      "Quality Control",
      "Design Services",
      "Consulting",
    ],
  },
  {
    name: "Location",
    options: [
      "San Francisco, CA",
      "Austin, TX",
      "Detroit, MI",
      "Boston, MA",
      "Portland, OR",
      "Chicago, IL",
      "Seattle, WA",
      "Denver, CO",
    ],
  },
  {
    name: "Rating",
    options: ["4.5+", "4.0+", "3.5+", "3.0+"],
  },
];

const BrowseCompanies = () => {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [openFilterCategory, setOpenFilterCategory] = useState<string | null>(
    null
  );
  const [filteredCompanies, setFilteredCompanies] =
    useState<ICompany[]>(companiesData);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const [ref, controls] = useScrollAnimation() as [
    MutableRefObject<HTMLElement | null>,
    any
  ];

  useEffect(() => {
    if (activeFilters.length === 0) {
      setFilteredCompanies(companiesData);
    } else {
      const newFilteredCompanies = companiesData.filter((company) => {
        return activeFilters.some((filter) => {
          if (company.categories.includes(filter)) return true;
          if (company.location === filter) return true;
          if (filter.includes("+")) {
            const minRating = parseFloat(filter.replace("+", ""));
            return company.rating >= minRating;
          }
          return false;
        });
      });
      setFilteredCompanies(newFilteredCompanies);
    }
  }, [activeFilters]);
  
  const toggleFavorite = (id: number) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((favId) => favId !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const toggleFilter = (filter: string) => {
    if (activeFilters.includes(filter)) {
      setActiveFilters(activeFilters.filter((f) => f !== filter));
    } else {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  const clearFilters = () => {
    setActiveFilters([]);
  };

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const renderFilterContent = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Filter Companies
        </h3>
        <button
          onClick={() => setShowFilters(false)}
          className="text-gray-500 hover:text-gray-800 lg:hidden"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="space-y-4">
        {filterCategories.map((category) => (
          <div key={category.name}>
            <div
              className="flex justify-between items-center cursor-pointer mb-2"
              onClick={() =>
                setOpenFilterCategory(
                  openFilterCategory === category.name ? null : category.name
                )
              }
            >
              <h4 className="font-medium text-gray-700">{category.name}</h4>
              <ChevronDownIcon
                className={`h-4 w-4 text-gray-500 transition-transform ${
                  openFilterCategory === category.name ? "rotate-180" : ""
                }`}
              />
            </div>

            <AnimatePresence>
              {openFilterCategory === category.name && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ml-2 space-y-2"
                >
                  {category.options.map((option) => (
                    <div key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        id={option}
                        checked={activeFilters.includes(option)}
                        onChange={() => toggleFilter(option)}
                        className="h-4 w-4 text-green-600 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={option}
                        className="ml-2 text-sm text-gray-600"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {activeFilters.length > 0 && (
        <button
          onClick={clearFilters}
          className="mt-6 text-sm text-green-600 hover:text-green-800"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <section className="py-12 px-6 md:px-12 lg:px-20">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
          Browse Construction Companies
        </h2>

        <div className="flex items-center">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 mr-4"
          >
            <FunnelIcon className="h-5 w-5 text-gray-500 mr-2" />
            <span>Filters</span>
            {activeFilters.length > 0 && (
              <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {activeFilters.length}
              </span>
            )}
          </button>

          <div className="flex space-x-2">
            <button className="bg-white border border-gray-200 p-2 rounded-lg shadow-sm hover:bg-gray-50">
              <AdjustmentsVerticalIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Filter Panel */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters (inline for desktop, slide for mobile) */}
        <AnimatePresence>
          {showFilters && (
            <>
              {/* Mobile Slide-in Filter */}
              <motion.div
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "-100%", opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed top-0 left-0 h-full w-full md:w-96 bg-white z-50 shadow-xl p-6 overflow-y-auto lg:hidden"
              >
                {renderFilterContent()}
              </motion.div>

              {/* Inline Filter (visible only on lg+) */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="hidden lg:block w-72 shrink-0 bg-white border border-gray-200 p-4 rounded-lg shadow-sm"
              >
                {renderFilterContent()}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Grid Section */}
        <div className="flex-1">
          {/* Active Filters Chips */}
          {activeFilters.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <span
                  key={filter}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                >
                  {filter}
                  <button
                    onClick={() => toggleFilter(filter)}
                    className="ml-1.5 inline-flex items-center justify-center"
                  >
                    <XMarkIcon className="h-3.5 w-3.5 text-green-700" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Company Cards */}
          <motion.section
            ref={ref}
            variants={containerVariants}
            initial="hidden"
            animate={controls}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredCompanies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                isFavorite={favorites.includes(company.id)}
                toggleFavorite={() => toggleFavorite(company.id)}
                variants={itemVariants}
              />
            ))}
          </motion.section>

          {/* Empty State */}
          {filteredCompanies.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium text-gray-700 mb-2">
                No companies match your filters
              </h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your filter criteria or search for something else.
              </p>
              <button
                onClick={clearFilters}
                className="text-green-600 font-medium hover:text-green-800"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default BrowseCompanies;
