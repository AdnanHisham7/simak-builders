import { CubeIcon } from "@/assets/icons";
import useScrollAnimation from "@/hooks/auth/useScrollAnimation";
import { motion } from "framer-motion";
import { MutableRefObject } from "react";

const BenefitsSection = () => {
  const [ref, controls] = useScrollAnimation() as [
    MutableRefObject<HTMLElement | null>,
    any
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, x: 30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  return (
    <motion.section
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={controls}
      className="py-16 px-6 md:px-20 bg-white"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <motion.div variants={imageVariants} className="order-2 md:order-1">
          <div className="bg-gray-100 p-6 rounded-xl">
            <div className="mb-6">
              <p className="text-gray-500">Total Projects</p>
              <h3 className="text-2xl font-bold">1475</h3>
              <span className="text-yellow-500 text-sm">↑ 34%</span>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Finished</span>
                  <span className="text-sm">10%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-blue-200 rounded-full w-[10%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">In Progress</span>
                  <span className="text-sm">13%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-blue-200 rounded-full w-[13%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Rejected</span>
                  <span className="text-sm">11%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-blue-200 rounded-full w-[11%]"></div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div className="bg-yellow-100 rounded-lg p-2">
                  <CubeIcon className="h-5 w-5 text-yellow-700" />
                </div>
                <div className="flex items-center text-xs">
                  <span className="bg-gray-800 w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] mr-1">
                    i
                  </span>
                  <span>8%</span>
                </div>
              </div>

              <h4 className="text-3xl font-bold mb-1">1951+</h4>
              <p className="text-yellow-500 text-sm">
                Increase of 126 this month
              </p>

              <div className="mt-4 flex items-end h-16">
                <div className="w-1/4 h-full bg-yellow-900 rounded"></div>
                <div className="w-1/4 h-3/4 bg-yellow-500 rounded mx-1"></div>
                <div className="w-1/4 h-2/3 bg-yellow-800 rounded"></div>
                <div className="w-1/4 h-5/6 bg-yellow-400 rounded ml-1"></div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="order-1 md:order-2">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Key Benefits of Our Platform for
            <br />
            Your Project Success
          </h2>
          <p className="text-gray-600 mb-8">
            Our platform enhances coordination, reduces delays, and improves
            outcomes.
          </p>

          <div className="space-y-8">
            <div className="flex">
              <div className="mr-4 text-yellow-800">
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Enhancing Quality with Smart Tools
                </h3>
                <p className="text-gray-600">
                  With advanced systems, we help you deliver top construction
                  quality. Discover how we support higher standards on every
                  build.
                </p>
              </div>
            </div>

            <div className="flex">
              <div className="mr-4 text-yellow-800">
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Optimizing Project Workflows
                </h3>
                <p className="text-gray-600">
                  Boost project efficiency and team productivity with our
                  integrated CRM. See how smart tracking helps you hit deadlines
                  faster.
                </p>
              </div>
            </div>

            <div className="flex">
              <div className="mr-4 text-yellow-800">
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  AI-Driven Project Insights
                </h3>
                <p className="text-gray-600">
                  Leverage AI to streamline planning, updates, and
                  communication— ensuring faster, smarter construction progress.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default BenefitsSection;
