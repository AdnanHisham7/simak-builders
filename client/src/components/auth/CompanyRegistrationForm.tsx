import { motion } from "framer-motion";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { validateCompanyEmail } from "@/services/authService";
import {
  EnvelopeIcon,
  LockClosedIcon,
  PhoneIcon,
  MapIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/solid";
import { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";

type CompanyRegistrationFormProps = {
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  website?: string;
  setWebsite: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  city: string;
  setCity: (value: string) => void;
  state: string;
  setState: (value: string) => void;
  zip: string;
  setZip: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  isLoading: boolean;
  handleSubmit: () => void;
  step: number; 
  setStep: (step: number) => void;
  navigate: NavigateFunction;
};

const CompanyRegistrationForm: React.FC<CompanyRegistrationFormProps> = ({
  step,
  setStep,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  phone,
  setPhone,
  website,
  setWebsite,
  address,
  setAddress,
  city,
  setCity,
  state,
  setState,
  zip,
  setZip,
  description,
  setDescription,
  isLoading,
  handleSubmit,
}) => {

    const handleNextStep = async () => {
      if (!name || !email || !password || !confirmPassword) {
        toast.warning("Please fill all fields");
        return;
      }
      if (password !== confirmPassword) {
        toast.warning("Passwords do not match");
        return;
      }
    
      try {
        // ✅ Call backend to validate email
        await validateCompanyEmail(email);
        // ✅ If validation passes, move to Step 2
        setStep(2);
      } catch (error: any) {
        console.error("Email failed:", error);
      }
    };
    

  return (
    <motion.div
      key={step}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {step === 1 && (
        <>
          {/* Step 1 fields */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Company Name
            </label>
            <Input
              name="name"
              type="text"
              placeholder="Company Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<MapIcon className="h-5 w-5 text-gray-400" />}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <Input
              name="email"
              type="email"
              placeholder="Company Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <Input
              name="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
              showToggle
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <Input
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
              showToggle
            />
          </div>

          {/* Continue Button */}
          <Button
            type="button"
            onClick={handleNextStep}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
          >
            Continue
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          {/* Step 2 fields */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <Input
              name="phone"
              type="text"
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              icon={<PhoneIcon className="h-5 w-5 text-gray-400" />}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Website (optional)
            </label>
            <Input
              name="website"
              type="text"
              placeholder="Website"
              value={website || ''}
              onChange={(e) => setWebsite(e.target.value)}
              icon={<GlobeAltIcon className="h-5 w-5 text-gray-400" />}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <Input
              name="address"
              type="text"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              City
            </label>
            <Input
              name="city"
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              State
            </label>
            <Input
              name="state"
              type="text"
              placeholder="State"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Zip
            </label>
            <Input
              name="zip"
              type="text"
              placeholder="ZIP Code"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Company Description
            </label>
            <textarea
              className="w-full border rounded-md p-2"
              placeholder="About your company..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="button"
            loading={isLoading}
            disabled={isLoading}
            onClick={handleSubmit}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
          >
            {isLoading ? "Registering..." : "Register Company"}
          </Button>
        </>
      )}
    </motion.div>
  );
};

export default CompanyRegistrationForm;
