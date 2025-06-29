import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmailSentMessage } from "./Signup";
import { motion } from "framer-motion";
import CompanyRegistrationForm from "@/components/auth/CompanyRegistrationForm.tsx";
import { useCompanySignup } from "@/hooks/auth/useCompanySignup";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Building, CheckCircle } from "lucide-react";

const CompanyRegistration: React.FC = () => {
  const navigate = useNavigate();

  // States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [description, setDescription] = useState("");
  const [step, setStep] = useState(1);
  const totalSteps = 2;

  const { isLoading, handleCompanySignup, isEmailSent } = useCompanySignup();

  const handleSubmit = () => {
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    handleCompanySignup({
      name,
      email,
      password,
      confirmPassword,
      phone,
      website,
      address,
      city,
      state,
      zip,
      description,
    });
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate(-1); // Go back to previous page if on first step
    }
  };

  // Progress percentage for the progress bar
  const progress = (step / totalSteps) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen flex items-center justify-center bg-gray-50 p-6"
    >
      <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-md">
        {!isEmailSent && (
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </button>
            <div className="text-sm font-medium text-gray-500">
              Step {step} of {totalSteps}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Building className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">
          Company Registration
        </h1>
        
        {!isEmailSent && (
          <p className="text-center text-gray-600 mb-6">
            {step === 1 
              ? "Create your company account to get started" 
              : "Tell us more about your business"}
          </p>
        )}

        {!isEmailSent && (
          <div className="mb-8">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-600 transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 px-1">
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  step >= 1 ? "bg-green-600 text-white" : "bg-gray-200"
                }`}>
                  {step > 1 ? <CheckCircle className="w-4 h-4" /> : "1"}
                </div>
                <span className="text-xs mt-1">Account</span>
              </div>
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  step >= 2 ? "bg-green-600 text-white" : "bg-gray-200"
                }`}>
                  {step > 2 ? <CheckCircle className="w-4 h-4" /> : "2"}
                </div>
                <span className="text-xs mt-1">Business Info</span>
              </div>
            </div>
          </div>
        )}

        {isEmailSent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <EmailSentMessage key="email-sent" />
          </motion.div>
        ) : (
          <motion.div
            key={`step-${step}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CompanyRegistrationForm
              name={name}
              setName={setName}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              phone={phone}
              setPhone={setPhone}
              website={website}
              setWebsite={setWebsite}
              address={address}
              setAddress={setAddress}
              city={city}
              setCity={setCity}
              state={state}
              setState={setState}
              zip={zip}
              setZip={setZip}
              description={description}
              setDescription={setDescription}
              isLoading={isLoading}
              handleSubmit={handleSubmit}
              step={step}
              setStep={setStep}
              navigate={navigate}
            />
          </motion.div>
        )}

        {!isEmailSent && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <button 
              onClick={() => navigate("/login")}
              className="text-green-600 hover:text-green-800 font-medium"
            >
              Sign in
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CompanyRegistration;