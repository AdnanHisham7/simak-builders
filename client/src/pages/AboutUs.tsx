import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import useScrollAnimation from "@/hooks/auth/useScrollAnimation";
import { MutableRefObject } from "react";
import { SparklesIcon, ShieldCheckIcon, CubeIcon } from "@/assets/icons";
import { useNavigate } from "react-router-dom";

// Animation variants
const fadeInUp = {
  hidden: {
    opacity: 0,
    y: 60,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const fadeInLeft = {
  hidden: {
    opacity: 0,
    x: -60,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const fadeInRight = {
  hidden: {
    opacity: 0,
    x: 60,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const fadeIn = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
    },
  },
};

const scaleIn = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const slideInFromBottom = {
  hidden: {
    opacity: 0,
    y: 100,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

const AboutUs = () => {
  const [ref, controls] = useScrollAnimation() as [
    MutableRefObject<HTMLElement | null>,
    any
  ];

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section with Mission & Vision */}
      <motion.section
        ref={ref}
        initial="hidden"
        animate={controls}
        className="py-10 px-6 md:px-20 text-center"
      >
        <motion.h1
          variants={fadeInUp}
          className="text-4xl md:text-6xl font-bold text-gray-800 mb-4"
        >
          About <span className="text-yellow-800">Us</span>
        </motion.h1>
        <motion.p
          variants={fadeInUp}
          className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto"
        >
          Building tomorrow's infrastructure with today's innovation
        </motion.p>

        {/* Mission & Vision Cards */}
        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <motion.div
            variants={fadeInLeft}
            whileHover={{ y: -10, transition: { duration: 0.3 } }}
            className="bg-white p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center mb-4">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="p-2 bg-yellow-100 rounded-lg mr-4"
              >
                <SparklesIcon className="h-6 w-6 text-yellow-700" />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-800">
                Our Mission
              </h3>
            </div>
            <p className="text-gray-600">
              To provide superior construction services that exceed client
              expectations while maintaining the highest standards of quality,
              safety, and sustainability.
            </p>
          </motion.div>
          <motion.div
            variants={fadeInRight}
            whileHover={{ y: -10, transition: { duration: 0.3 } }}
            className="bg-white p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center mb-4">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="p-2 bg-yellow-100 rounded-lg mr-4"
              >
                <CubeIcon className="h-6 w-6 text-yellow-700" />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-800">
                Our Vision
              </h3>
            </div>
            <p className="text-gray-600">
              To be a leading construction company recognized for innovation,
              reliability, and excellence in every project we undertake.
            </p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Story Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="py-10 px-6 md:px-20 bg-white"
      >
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Our Story
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Founded with a vision to integrate smart technology into
            construction, we've grown into a trusted partner for residential,
            commercial, and industrial projects. Our journey has been marked by
            continuous innovation and an unwavering commitment to quality.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <motion.div
            variants={scaleIn}
            whileHover={{ scale: 1.05 }}
            className="text-center"
          >
            <motion.h3
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="text-4xl font-bold text-yellow-800 mb-2"
            >
              2017
            </motion.h3>
            <p className="text-gray-600">Founded</p>
          </motion.div>
          <motion.div
            variants={scaleIn}
            whileHover={{ scale: 1.05 }}
            className="text-center"
          >
            <motion.h3
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
              className="text-4xl font-bold text-yellow-800 mb-2"
            >
              1951+
            </motion.h3>
            <p className="text-gray-600">Projects Completed</p>
          </motion.div>
          <motion.div
            variants={scaleIn}
            whileHover={{ scale: 1.05 }}
            className="text-center"
          >
            <motion.h3
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.6 }}
              className="text-4xl font-bold text-yellow-800 mb-2"
            >
              6
            </motion.h3>
            <p className="text-gray-600">Years of Excellence</p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Values Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="py-10 px-6 md:px-20 bg-gray-50"
      >
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Our Values
          </h2>
        </motion.div>

        <div className="space-y-12">
          {/* Integrity */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="flex flex-col md:flex-row items-center gap-8"
          >
            <motion.div variants={fadeInLeft} className="md:w-1/2">
              <div className="flex items-center mb-4">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="p-2 bg-yellow-100 rounded-lg mr-4"
                >
                  <SparklesIcon className="h-6 w-6 text-yellow-700" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-800">
                  Integrity
                </h3>
              </div>
              <p className="text-gray-600">
                We uphold the highest ethical standards in all we do, building
                trust through transparency and honest communication with every
                client and partner.
              </p>
            </motion.div>
            <motion.div
              variants={fadeInRight}
              whileHover={{ scale: 1.02 }}
              className="md:w-1/2"
            >
              <div className="h-48 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-xl"></div>
            </motion.div>
          </motion.div>

          {/* Quality */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="flex flex-col md:flex-row-reverse items-center gap-8"
          >
            <motion.div variants={fadeInRight} className="md:w-1/2">
              <div className="flex items-center mb-4">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="p-2 bg-yellow-100 rounded-lg mr-4"
                >
                  <ShieldCheckIcon className="h-6 w-6 text-yellow-700" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-800">Quality</h3>
              </div>
              <p className="text-gray-600">
                We deliver exceptional results in every project, ensuring
                excellence through meticulous attention to detail and rigorous
                quality control processes.
              </p>
            </motion.div>
            <motion.div
              variants={fadeInLeft}
              whileHover={{ scale: 1.02 }}
              className="md:w-1/2"
            >
              <div className="h-48 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-xl"></div>
            </motion.div>
          </motion.div>

          {/* Innovation */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="flex flex-col md:flex-row items-center gap-8"
          >
            <motion.div variants={fadeInLeft} className="md:w-1/2">
              <div className="flex items-center mb-4">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="p-2 bg-yellow-100 rounded-lg mr-4"
                >
                  <CubeIcon className="h-6 w-6 text-yellow-700" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-800">
                  Innovation
                </h3>
              </div>
              <p className="text-gray-600">
                We embrace cutting-edge technology and creative solutions to
                enhance our services, continuously pushing boundaries to exceed
                expectations.
              </p>
            </motion.div>
            <motion.div
              variants={fadeInRight}
              whileHover={{ scale: 1.02 }}
              className="md:w-1/2"
            >
              <div className="h-48 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-xl"></div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="py-16 px-6 md:px-20 text-center"
      >
        <motion.h2
          variants={fadeInUp}
          className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
        >
          Ready to Build with <span className="text-yellow-800">Us?</span>
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto"
        >
          Let's discuss your vision and create something extraordinary together.
          Contact us today to start your journey.
        </motion.p>
        <motion.div variants={scaleIn}>
          <motion.button
            onClick={() => navigate("/contact")}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 10px 25px rgba(180, 83, 9, 0.3)",
            }}
            whileTap={{ scale: 0.95 }}
            className="bg-yellow-800 text-white px-8 py-3 rounded-full hover:bg-yellow-700 transition"
          >
            Get in Touch
          </motion.button>
        </motion.div>
      </motion.section>

      <Footer />
    </div>
  );
};

export default AboutUs;
