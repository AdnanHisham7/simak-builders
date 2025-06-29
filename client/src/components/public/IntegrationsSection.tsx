import { motion } from "framer-motion";
import { MutableRefObject } from "react";
import CircleIconVideo from "@/assets/CircleIconVideo.mp4";
import useScrollAnimation from "@/hooks/auth/useScrollAnimation";

const IntegrationsSection = () => {
  const [ref, controls] = useScrollAnimation() as [
    MutableRefObject<HTMLElement | null>,
    any
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const textVariants = {
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
      className="py-20 px-6 md:px-20 bg-white"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <motion.div variants={textVariants}>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Empowering Top Builders
            <br />
            with Seamless Collaboration
          </h2>

          <p className="text-gray-600 mb-8">
            Experience smooth coordination with our smart platform—designed to
            integrate with your workflows, improve communication, and drive
            every project to success.
          </p>

          <button className="bg-yellow-100 text-yellow-800 px-8 py-3 rounded-full hover:bg-yellow-200 transition font-medium">
            Work With Us
          </button>
        </motion.div>

        {/* Replace the CircularIconsLayout with a GIF */}
        <div className="flex justify-center items-center">
          {/* <img src="/path/to/your/animation.gif" alt="Collaboration Animation" className="w-80 h-80 object-cover" />
           */}
          <video
            src={CircleIconVideo}
            autoPlay
            loop
            muted
            className="w-full h-80 object-cover rounded-3xl"
          />
        </div>
      </div>
    </motion.section>
  );
};

export default IntegrationsSection;
