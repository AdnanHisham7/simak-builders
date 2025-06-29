import { motion, AnimatePresence } from "framer-motion";
import { MutableRefObject, useState } from "react";
import useScrollAnimation from "@/hooks/auth/useScrollAnimation";
import { createEnquiry } from "@/services/messageService";
import { CheckCircle, AlertTriangle } from "lucide-react";

const ContactCard = () => {
  const [ref, controls] = useScrollAnimation() as [
    MutableRefObject<HTMLElement | null>,
    any
  ];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEnquiry({ name, email, phone, subject, message });
      setSuccess("Enquiry sent successfully!");
      setTimeout(() => setSuccess(null), 3000);
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch (error) {
      setError("Failed to send enquiry.");
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <>
      <AnimatePresence>
        {(success || error) && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-4 right-4 z-50"
          >
            <div
              className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg backdrop-blur-sm ${
                success
                  ? "bg-green-500/90 text-white"
                  : "bg-red-500/90 text-white"
              }`}
            >
              {success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
              <span className="font-medium">{success || error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.section
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={controls}
        className="mx-auto px-4 sm:px-8 md:px-16 lg:px-36 pt-8 sm:pt-12 md:pt-16 pb-12 sm:pb-16 md:pb-36 grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        <motion.div variants={itemVariants}>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Get in Touch
          </h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-800 focus:border-transparent"
                  placeholder="Your Full Name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-800 focus:border-transparent"
                  placeholder="Your Email Address"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-800 focus:border-transparent"
                placeholder="+91 "
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-800 focus:border-transparent"
                placeholder="Project Inquiry"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-800 focus:border-transparent h-32"
                placeholder="Tell us about your project requirements..."
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-yellow-800 text-white py-3 rounded-lg hover:bg-yellow-700 transition"
            >
              Send Enquiry
            </button>
          </form>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="w-full h-full rounded-lg overflow-hidden shadow-lg min-h-[300px] sm:min-h-[400px] md:min-h-[500px]"
        >
          <iframe
            title="Company Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d978.7066306785382!2d75.98334198745918!3d11.12629449761867!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba64ec8503e8e9b%3A0xa0eec1c75c302dc9!2ssimak!5e0!3m2!1sen!2sin!4v1745398367825!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
          ></iframe>
        </motion.div>
      </motion.section>
    </>
  );
};

export default ContactCard;