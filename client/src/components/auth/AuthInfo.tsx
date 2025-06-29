import {
  CheckBadgeIcon,
  CheckIcon,
  FireIcon,
} from "../../assets/icons";
import { authContent } from "../../constants/auth";
import { motion } from "framer-motion";
import logoMark from "@/assets/logo-mark-light.svg";
import { useNavigate } from "react-router-dom";

type InfoProps = {
  role: "client" | "company";
  variant: "login" | "signup";
};

const AuthInfo: React.FC<InfoProps> = ({ role, variant }) => {
  const content = authContent[role][variant];
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative h-full flex flex-col justify-center px-8 md:px-12 lg:px-16"
    >
      <div className="mb-8">
        <div className="hover:cursor-pointer" onClick={() => navigate("/")}>
          <div className="inline-block p-3 bg-green-800 bg-opacity-20 rounded-xl mb-2">
            <img src={logoMark} className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Bizorago</h2>
        </div>
        <p className="text-lg text-green-100 mb-6">{content.subheading}</p>
        <div className="space-y-6">
          {content.features.map((feature, idx) => (
            <div key={idx} className="flex items-center">
              <div className="flex-shrink-0 p-1 bg-green-500 bg-opacity-30 rounded-full">
                <CheckIcon className="w-5 h-5 text-white" />
              </div>
              <span className="ml-3 text-green-100">{feature}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-green-700 bg-opacity-30 p-6 rounded-xl backdrop-blur-sm">
        <div className="flex items-center mb-4">
          <div className="h-10 w-10 rounded-full bg-green-400 flex items-center justify-center text-white font-bold">
            {content.testimonial.initials}
          </div>
          <div className="ml-3">
            <h4 className="text-white font-medium">
              {content.testimonial.name}
            </h4>
            <p className="text-green-200 text-sm">
              {content.testimonial.title}
            </p>
          </div>
        </div>
        <p className="text-green-100 italic">{content.testimonial.quote}</p>
      </div>
      <div className="absolute bottom-8 left-8 right-8">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <FireIcon className="h-5 w-5 text-green-300" />
            <span className="ml-1 text-sm text-green-200">
              Trusted by 5,000+ clients
            </span>
          </div>
          <div className="flex items-center">
            <CheckBadgeIcon className="h-5 w-5 text-green-300" />
            <span className="ml-1 text-sm text-green-200">
              Vetted professionals
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AuthInfo;
