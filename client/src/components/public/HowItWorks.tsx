import { motion } from "framer-motion";
import { ArrowRight, Calendar, CheckCircle, MessageSquare, Star } from "lucide-react";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const steps = [
  {
    title: "Post Your Project",
    description:
      "Describe your construction needs in detail with our guided form process.",
    icon: <Calendar size={32} />,
  },
  {
    title: "Match with Companies",
    description:
      "Our algorithm connects you with the best-suited construction professionals.",
    icon: <CheckCircle size={32} />,
  },
  {
    title: "Review & Select",
    description:
      "Compare proposals, portfolios, and reviews before making your choice.",
    icon: <Star size={32} />,
  },
  {
    title: "Manage Your Project",
    description:
      "Use our built-in CRM to track progress and maintain communication.",
    icon: <MessageSquare size={32} />,
  },
];

const Steps = () => {
  return (
    <motion.section
      id="how-it-works"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
      className="py-16 bg-yellow-50" // <-- yellowish background
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={itemVariants} className="text-center mb-12">
          <h2 className="text-3xl font-bold text-yellow-900">How It Works</h2>{" "}
          {/* <-- yellow text */}
          <p className="text-xl text-yellow-700 mt-4">
            Simple steps to your successful construction project
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="relative"
            >
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="bg-yellow-100 p-4 rounded-full text-yellow-600 inline-block mb-4">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold text-yellow-900">
                  {step.title}
                </h3>
                <p className="text-yellow-700 mt-2">{step.description}</p>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                  <ArrowRight size={24} className="text-yellow-300" />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
};

export default Steps;
