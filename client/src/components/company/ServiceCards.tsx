import { motion } from "framer-motion";
import { MutableRefObject } from "react";

import {
  SparklesIcon,
  ShieldCheckIcon,
  CubeIcon,
  TruckIcon,
  ChartPieIcon,
  WrenchIcon,
} from "@/assets/icons/index";
import useScrollAnimation from "@/hooks/auth/useScrollAnimation";

const ServiceCards = () => {
  const [ref, controls] = useScrollAnimation() as [
    MutableRefObject<HTMLElement | null>,
    any
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const services = [
    {
      icon: <SparklesIcon className="h-6 w-6 text-white" />,
      title: "Project Planning",
      description:
        "Comprehensive planning for project scope, timelines, and budgets.",
    },
    {
      icon: <CubeIcon className="h-6 w-6 text-white" />,
      title: "Custom Construction",
      description:
        "Personalized building solutions with flexible design options.",
    },
    {
      icon: <WrenchIcon className="h-6 w-6 text-white" />,
      title: "Site Supervision",
      description:
        "On-site management ensuring quality standards and site safety.",
    },
    {
      icon: <ShieldCheckIcon className="h-6 w-6 text-white" />,
      title: "Client Communication",
      description:
        "Real-time updates, clear client interaction, and task coordination.",
    },
    {
      icon: <TruckIcon className="h-6 w-6 text-white" />,
      title: "Materials & Logistics",
      description:
        "Efficient sourcing, delivery tracking, and material management.",
    },
    {
      icon: <ChartPieIcon className="h-6 w-6 text-white" />,
      title: "Project Insights",
      description:
        "Data-backed reports to support planning, costing, and execution.",
    },
  ];

  return (
    <motion.section
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={controls}
      className="py-16 px-6 md:px-20 bg-yellow-900 text-white"
    >
      <motion.div variants={itemVariants} className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Streamlined and Reliable
          <br />
          Construction Solutions
        </h2>
        <p className="max-w-3xl mx-auto text-yellow-100">
          Enhance your projects with our dependable, precision-driven services.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="bg-yellow-800 p-6 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="p-2 bg-yellow-700 rounded-lg">{service.icon}</div>
              <svg
                className="h-5 w-5 text-yellow-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
            <p className="text-yellow-100">{service.description}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default ServiceCards;
