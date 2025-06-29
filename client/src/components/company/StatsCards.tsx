import { motion } from "framer-motion";
import { MutableRefObject } from "react";
import buildingImg from "@/assets/building-1.jpg";
import anotherImage from "@/assets/building-2.jpg";
import useScrollAnimation from "@/hooks/auth/useScrollAnimation";
import { CubeIcon } from "@/assets/icons";

const StatsCards = () => {
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
    hidden: { opacity: 0, y: 30 },
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
      className="pb-20 px-6 md:px-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 items-end bg-00 relative" // <-- notice grid-cols-1 for mobile
    >
      {/* 1st Card */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl shadow-lg overflow-hidden h-[250px] md:h-[400px]" // <-- h-[250px] mobile, md:h-[400px] desktop
      >
        <img
          src={buildingImg}
          alt="Building"
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* 2nd Card */}
      <motion.div
        variants={itemVariants}
        className="bg-yellow-900 text-white p-6 rounded-xl flex flex-col items-center justify-center text-center h-[250px] md:h-[300px]"
      >
        <h3 className="text-4xl font-bold mb-2">100+</h3>
        <p className="text-yellow-100">Our Esteemed Clients and Partners</p>
      </motion.div>

      {/* 3rd Card */}
      <div className="relative flex flex-col items-center justify-center h-[250px] md:h-[220px]">
        {/* Stars */}
        <motion.div
          variants={itemVariants}
          className="absolute hidden md:flex -top-36  flex-col items-center" // <-- adjust top for mobile too
        >
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((_, index) => (
              <svg
                key={index}
                className="w-5 h-5 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-2 text-lg font-bold">5.0</span>
          </div>
          <p className="text-gray-500 mt-1">from 80+ reviews</p>
        </motion.div>

        {/* Actual Card Content */}
        <motion.div
          variants={itemVariants}
          className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center text-center w-full h-full"
        >
          <div className="mb-4 bg-yellow-100 rounded-lg p-2">
            <CubeIcon className="h-6 w-6 text-yellow-700" />
          </div>
          <h3 className="text-4xl font-bold mb-2">1951+</h3>
          <p className="text-gray-500">Total Projects</p>
          <span className="mt-2 text-sm text-yellow-600">
            Increase of 126 this month
          </span>
        </motion.div>
      </div>

      {/* 4th Card */}
      <motion.div
        variants={itemVariants}
        className="bg-yellow-100 p-6 rounded-xl flex flex-col items-center justify-center text-center h-[250px] md:h-[300px]"
      >
        <h3 className="text-4xl font-bold mb-2">6+</h3>
        <p className="text-gray-700">Years of Dedicated Service</p>
      </motion.div>

      {/* 5th Card */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl shadow-lg overflow-hidden h-[250px] md:h-[400px]"
      >
        <img
          src={anotherImage}
          alt="Another Image"
          className="w-full h-full object-cover"
        />
      </motion.div>
    </motion.section>
  );
};

export default StatsCards;
