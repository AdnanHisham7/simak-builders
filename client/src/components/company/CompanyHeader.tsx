import { motion, Variants } from "framer-motion";
import { MutableRefObject } from "react";
import { MapPinIcon, CheckBadgeIcon, StarIcon } from "@/assets/icons";
import useScrollAnimation from "@/hooks/auth/useScrollAnimation";

interface CompanyHeaderProps {
  companyName: string;
  location?: string;
  rating?: number;
  reviewsCount?: number;
  sinceYear?: number;
  projectsCount?: number;
}

const CompanyHeader: React.FC<CompanyHeaderProps> = ({
  companyName,
  location = "Malappuram",
  rating = 4.5,
  reviewsCount = 36,
  sinceYear = "2021",
  projectsCount = 564,
}) => {
  const [ref, controls] = useScrollAnimation() as [
    MutableRefObject<HTMLElement | null>,
    any
  ];

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.2 },
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

  return (
    <motion.section
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={controls}
      className="flex flex-col md:flex-row justify-between items-start md:items-center mt-14 mb-8"
    >
      <motion.div variants={itemVariants} className="mb-6 md:mb-0">
        <div className="flex items-center mb-2">
          <h1 className="text-3xl font-bold text-gray-800">{companyName}</h1>
          <span className="ml-2 flex items-center text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
            <CheckBadgeIcon className="h-4 w-4 mr-1" />
            Verified
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 text-gray-600">
          <div className="flex items-center mb-2 sm:mb-0">
            <MapPinIcon className="h-4 w-4 mr-1" />
            <span>{location}</span>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
              <span className="font-semibold">{rating.toFixed(1)}</span>
              <span className="ml-1 text-sm text-gray-500">
                ({reviewsCount} reviews)
              </span>
            </div>

            {sinceYear && (
              <div className="hidden md:block text-sm">Since {sinceYear}</div>
            )}

            {projectsCount && (
              <div className="hidden md:block text-sm font-medium">
                {projectsCount}+ Projects
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="flex space-x-4">
        <button className="px-6 py-2 border border-gray-200 rounded-full hover:bg-gray-50 transition">
          Contact
        </button>
        <button className="px-6 py-2 bg-green-800 text-white rounded-full hover:bg-green-700 transition">
          Request Quote
        </button>
      </motion.div>
    </motion.section>
  );
};

export default CompanyHeader;
