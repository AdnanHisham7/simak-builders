import useScrollAnimation from "@/hooks/auth/useScrollAnimation";
import { motion } from "framer-motion";
import { MutableRefObject } from "react";

const CallToAction = () => {
  const [ref, controls] = useScrollAnimation() as [
    MutableRefObject<HTMLElement | null>,
    any
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 1, ease: "easeOut" },
    },
  };

  return (
    <motion.section
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={controls}
      className="py-20 px-6 md:px-20 bg-yellow-900 text-white text-center"
    >
      <h2 className="text-3xl md:text-4xl font-bold mb-6">
        From Idea to Production in Days
      </h2>

      <p className="max-w-2xl mx-auto text-yellow-100 mb-10">
        Accelerate your production with our technology. Reduce downtime and
        optimize costs. Get a special offer now!
      </p>

      <button className="bg-yellow-100 text-yellow-800 px-8 py-3 rounded-full hover:bg-yellow-200 transition font-medium">
        Work With Us
      </button>
    </motion.section>
  );
};

export default CallToAction;
