import { MagnifyingGlassIcon } from "@/assets/icons";
import useScrollAnimation from "@/hooks/auth/useScrollAnimation";
import { motion } from "framer-motion";
import { MutableRefObject } from "react";

const BrowsingHero = () => {
  const [ref, controls] = useScrollAnimation() as [
    MutableRefObject<HTMLElement | null>,
    any
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <motion.section
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={controls}
      className="py-16 px-6 md:px-20 text-center bg-green-900 text-white"
    >
      <motion.h1
        variants={itemVariants}
        className="text-3xl md:text-5xl font-bold mb-4"
      >
        Find Top Construction Partners
      </motion.h1>

      <motion.p
        variants={itemVariants}
        className="text-lg text-green-100 mb-8 max-w-3xl mx-auto"
      >
        Browse and connect with verified construction companies that match your
        project needs.
      </motion.p>

      <motion.div variants={itemVariants} className="max-w-3xl mx-auto">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for construction companies, services, or projects..."
            className="w-full pl-12 pr-4 py-4 rounded-full text-gray-800 shadow-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-700 text-white px-6 py-2 rounded-full hover:bg-green-600 transition">
            Search
          </button>
        </div>
      </motion.div>
    </motion.section>
  );
};

export default BrowsingHero;
