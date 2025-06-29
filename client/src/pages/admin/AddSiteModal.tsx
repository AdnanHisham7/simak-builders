import { useState } from "react";
import {
  MapPin,
  Building,
  DollarSign,
  Users,
  HardHat,
  Briefcase,
  X,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Check,
} from "lucide-react";

interface AddSiteModalProps {
  onClose: () => void;
  onSubmit: (siteData: any) => Promise<void>;
  clients: { id: string; name: string }[];
  siteManagers: { id: string; name: string }[];
  architects: { id: string; name: string }[];
}

const AddSiteModal: React.FC<AddSiteModalProps> = ({
  onClose,
  onSubmit,
  clients,
  siteManagers,
  architects,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [newSite, setNewSite] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    budget: 0,
    status: "",
    clientId: "",
    siteManagerIds: [] as string[],
    architectIds: [] as string[],
  });
  const [inputErrors, setInputErrors] = useState({
    name: false,
    address: false,
    city: false,
    state: false,
    zip: false,
    budget: false,
    clientId: false,
  });
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const parsedValue = name === "budget" ? parseFloat(value) || 0 : value;
    setNewSite((prev) => ({ ...prev, [name]: parsedValue }));
    if (inputErrors[name as keyof typeof inputErrors]) {
      setInputErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewSite((prev) => ({ ...prev, [name]: value }));
    if (inputErrors[name as keyof typeof inputErrors]) {
      setInputErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, options } = e.target;
    const selectedValues = Array.from(options)
      .filter((option) => option.selected)
      .map((option) => option.value);
    setNewSite((prev) => ({ ...prev, [name]: selectedValues }));
  };

  const validateStep = (step: number) => {
    if (step === 0) {
      const newErrors = {
        name: !newSite.name.trim(),
        address: !newSite.address.trim(),
        city: !newSite.city.trim(),
        state: !newSite.state.trim(),
        zip: !newSite.zip.trim(),
      };
      setInputErrors((prev) => ({ ...prev, ...newErrors }));
      return !Object.values(newErrors).some(Boolean);
    } else {
      const newErrors = {
        budget: newSite.budget <= 0,
        clientId: !newSite.clientId,
      };
      setInputErrors((prev) => ({ ...prev, ...newErrors }));
      return !Object.values(newErrors).some(Boolean);
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(1);
    }
  };

  const handleBack = () => {
    setActiveStep(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(activeStep)) {
      setSubmissionError(null);
      try {
        await onSubmit(newSite);
        // Parent will close the modal on success
      } catch (err) {
        console.error("Error submitting form:", err);
        setSubmissionError("Failed to create site. Please try again.");
      }
    }
  };

  const handleReset = () => {
    onClose();
    setNewSite({
      name: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      budget: 0,
      status: "",
      clientId: "",
      siteManagerIds: [],
      architectIds: [],
    });
    setInputErrors({
      name: false,
      address: false,
      city: false,
      state: false,
      zip: false,
      budget: false,
      clientId: false,
    });
    setActiveStep(0);
    setSubmissionError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white h-[90vh] rounded-xl shadow-2xl w-full max-w-3xl flex flex-col">
        <div className="relative bg-blue-600 rounded-t-xl text-white p-6 flex-shrink-0">
          <button
            onClick={handleReset}
            className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
          <h2 className="text-2xl font-bold mb-2">Add New Site</h2>
          <p className="text-blue-100 mb-4">
            {activeStep === 0
              ? "Enter site details"
              : "Project specifics & team members"}
          </p>
          <div className="flex items-center mt-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-blue-600 font-bold">
              {activeStep === 0 ? <Check size={16} /> : "1"}
            </div>
            <div
              className={`h-1 w-16 mx-2 ${
                activeStep === 1 ? "bg-white" : "bg-blue-400"
              }`}
            ></div>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                activeStep === 1
                  ? "bg-white text-blue-600"
                  : "bg-blue-400 text-white"
              } font-bold`}
            >
              2
            </div>
          </div>
        </div>

        {submissionError && (
          <div className="p-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <AlertCircle className="text-red-500 mr-2" size={20} />
              <p className="text-red-600">{submissionError}</p>
            </div>
          </div>
        )}

        {/* <div className=""> */}
        <div className="flex-1 overflow-y-auto px-6">
          {activeStep === 0 && (
            <div className="w-full p-6 transition-all duration-300 ease-in-out">
              <div className="space-y-5">
                <div>
                  <label className="flex items-center text-gray-700 font-medium mb-1.5">
                    <Building size={18} className="mr-2 text-blue-600" />
                    Site Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newSite.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border ${
                      inputErrors.name
                        ? "border-red-400 bg-red-50"
                        : "border-gray-300"
                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                    placeholder="Enter site name"
                  />
                  {inputErrors.name && (
                    <p className="flex items-center text-red-500 text-xs mt-1.5">
                      <AlertCircle size={12} className="mr-1" /> Site name is
                      required
                    </p>
                  )}
                </div>
                <div>
                  <label className="flex items-center text-gray-700 font-medium mb-1.5">
                    <MapPin size={18} className="mr-2 text-blue-600" />
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={newSite.address}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border ${
                      inputErrors.address
                        ? "border-red-400 bg-red-50"
                        : "border-gray-300"
                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                    placeholder="Street address"
                  />
                  {inputErrors.address && (
                    <p className="flex items-center text-red-500 text-xs mt-1.5">
                      <AlertCircle size={12} className="mr-1" /> Address is
                      required
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={newSite.city}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border ${
                        inputErrors.city
                          ? "border-red-400 bg-red-50"
                          : "border-gray-300"
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                      placeholder="City"
                    />
                    {inputErrors.city && (
                      <p className="flex items-center text-red-500 text-xs mt-1.5">
                        <AlertCircle size={12} className="mr-1" /> Required
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1.5">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={newSite.state}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border ${
                        inputErrors.state
                          ? "border-red-400 bg-red-50"
                          : "border-gray-300"
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                      placeholder="State"
                    />
                    {inputErrors.state && (
                      <p className="flex items-center text-red-500 text-xs mt-1.5">
                        <AlertCircle size={12} className="mr-1" /> Required
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="flex items-center text-gray-700 font-medium mb-1.5">
                    <MapPin size={18} className="mr-2 text-blue-600" />
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="zip"
                    value={newSite.zip}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border ${
                      inputErrors.zip
                        ? "border-red-400 bg-red-50"
                        : "border-gray-300"
                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                    placeholder="ZIP code"
                  />
                  {inputErrors.zip && (
                    <p className="flex items-center text-red-500 text-xs mt-1.5">
                      <AlertCircle size={12} className="mr-1" /> ZIP code is
                      required
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div className="w-full p-6 transition-all duration-300 ease-in-out">
              <div className="space-y-5">
                <div>
                  <label className="flex items-center text-gray-700 font-medium mb-1.5">
                    <DollarSign size={18} className="mr-2 text-blue-600" />
                    Project Budget
                  </label>
                  <input
                    type="number"
                    name="budget"
                    value={newSite.budget}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border ${
                      inputErrors.budget
                        ? "border-red-400 bg-red-50"
                        : "border-gray-300"
                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                    placeholder="Enter total budget"
                    min="0"
                  />
                  {inputErrors.budget && (
                    <p className="flex items-center text-red-500 text-xs mt-1.5">
                      <AlertCircle size={12} className="mr-1" /> Valid budget is
                      required
                    </p>
                  )}
                </div>
                <div>
                  <label className="flex items-center text-gray-700 font-medium mb-1.5">
                    <Building size={18} className="mr-2 text-blue-600" />
                    Client
                  </label>
                  <select
                    name="clientId"
                    value={newSite.clientId}
                    onChange={handleSelectChange}
                    className={`w-full px-4 py-2.5 border ${
                      inputErrors.clientId
                        ? "border-red-400 bg-red-50"
                        : "border-gray-300"
                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>

                  {inputErrors.clientId && (
                    <p className="flex items-center text-red-500 text-xs mt-1.5">
                      <AlertCircle size={12} className="mr-1" /> Client
                      selection is required
                    </p>
                  )}
                </div>
                <div>
                  <label className="flex items-center text-gray-700 font-medium mb-1.5">
                    <Users size={18} className="mr-2 text-blue-600" />
                    Site Managers
                  </label>
                  <select
                    multiple
                    name="siteManagerIds"
                    value={newSite.siteManagerIds}
                    onChange={handleMultiSelectChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {siteManagers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center text-gray-700 font-medium mb-1.5">
                    <HardHat size={18} className="mr-2 text-blue-600" />
                    Architects
                  </label>
                  <select
                    multiple
                    name="architectIds"
                    value={newSite.architectIds}
                    onChange={handleMultiSelectChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {architects.map((architect) => (
                      <option key={architect.id} value={architect.id}>
                        {architect.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center text-gray-700 font-medium mb-1.5">
                    <Briefcase size={18} className="mr-2 text-blue-600" />
                    Project Status
                  </label>
                  <select
                    name="status"
                    value={newSite.status}
                    onChange={handleSelectChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option disabled selected value="InProgress">
                      In Progress
                    </option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t rounded-b-xl p-6 bg-gray-50 flex-shrink-0">
          <div className="flex justify-between">
            {activeStep === 0 ? (
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                <ChevronLeft size={16} className="mr-2 inline-block" />
                Back
              </button>
            )}
            <button
              type="button"
              onClick={activeStep === 0 ? handleNext : handleSubmit}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              {activeStep === 0 ? "Continue" : "Create Site"}
              <ChevronRight size={16} className="ml-2 inline-block" />
            </button>
          </div>
        </div>
        {/* </div> */}
      </div>
    </div>
  );
};

export default AddSiteModal;
