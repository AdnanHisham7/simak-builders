import useScrollAnimation from "@/hooks/auth/useScrollAnimation";
import { motion, Variants } from "framer-motion";
import { MutableRefObject } from "react";
import { useNavigate } from "react-router-dom";

export const LandingHero = () => {
  const [ref, controls] = useScrollAnimation() as [
    MutableRefObject<HTMLElement | null>,
    any
  ];

  const navigate = useNavigate();

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
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
      className="py-20 px-6 md:px-20 text-center"
    >
      <motion.h1
        variants={itemVariants}
        className="text-4xl md:text-6xl font-bold text-gray-800 mb-4"
      >
        The Future of Construction <br />
        <span className="text-yellow-800">with Smart Technology</span>
      </motion.h1>

      <motion.p
        variants={itemVariants}
        className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto"
      >
        Expert tools to elevate your projects. Let’s take your builds further
      </motion.p>

      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row justify-center gap-4"
      >
        <button
          className="bg-yellow-800 text-white px-8 py-3 rounded-full hover:bg-yellow-700 transition"
          onClick={() => navigate("/portfolio")} // or use a Link component in Next.js/React Router
        >
          View Portfolio
        </button>

        <button
          className="bg-white text-gray-800 px-8 py-3 rounded-full border border-gray-200 hover:bg-gray-50 transition"
          onClick={() => navigate("/contact")} // or trigger a modal/form instead
        >
          Send Enquiry  
        </button>
      </motion.div>
    </motion.section>
  );
};

export default LandingHero;
