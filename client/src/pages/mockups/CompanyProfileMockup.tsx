import React, { useEffect, useState } from "react";
import { Star, MapPin, BadgeCheck, Phone, Mail, Globe } from "lucide-react";
import Button from "@/components/ui/Button";
import Navbar from "@/components/layout/Navbar";

// Types
interface TabProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

interface SpecialityTagProps {
  text: string;
}

interface CompanyDetails {
  name: string;
  verified: boolean;
  address: string;
  rating: number;
  reviews: number;
  established: string;
  projectsCount: string;
  description: string;
  specialities: string[];
  serviceAreas: string[];
  certifications?: string[];
  contactInfo: {
    address: string;
    phone: string;
    email: string;
    website: string;
  };
}

// Reusable Components
const NavigationLink: React.FC<{ href: string; children: React.ReactNode }> = ({
  href,
  children,
}) => (
  <a
    href={href}
    className="px-4 py-2 text-gray-800 hover:text-blue-600 transition-colors duration-300"
  >
    {children}
  </a>
);

const Tab: React.FC<TabProps> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-8 py-3 text-center transition-all duration-300 ${
      active
        ? "bg-white shadow-sm text-blue-600 font-medium border-t-2 border-t-blue-500"
        : "text-gray-600 hover:text-gray-800"
    }`}
  >
    {label}
  </button>
);

const SpecialityTag: React.FC<SpecialityTagProps> = ({ text }) => (
  <span className="inline-block px-4 py-1 bg-gray-100 text-gray-800 rounded-full text-sm mr-2 mb-2 hover:bg-gray-200 transition-colors duration-300">
    {text}
  </span>
);

const ContactItem: React.FC<{
  icon: React.ReactNode;
  text: string;
}> = ({ icon, text }) => (
  <div className="flex items-start mb-6 group">
    <div className="text-gray-500 mr-3 mt-1 group-hover:text-blue-500 transition-colors duration-300">
      {icon}
    </div>
    <span className="text-gray-700">{text}</span>
  </div>
);

const FadeIn = ({ delay = 0, children }: any) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className="transition-all duration-700"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
      }}
    >
      {children}
    </div>
  );
};

// Main Component
const CompanyProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "portfolio" | "reviews" | "contact"
  >("overview");
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  // Simulate image loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setImageLoaded(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Sample data
  const company: CompanyDetails = {
    name: "Simak Constructions",
    verified: true,
    address: "123 Builder St, New York, NY 10001",
    rating: 4.5,
    reviews: 67,
    established: "Since 2021",
    projectsCount: "350+ Projects",
    description:
      "Acme Construction is a full-service construction company specializing in residential and commercial projects. With over 20 years of experience, we deliver high-quality craftsmanship and exceptional customer service.",
    specialities: ["Residential", "Residential", "Residential"],
    serviceAreas: ["Malappuram", "Residential", "Residential"],
    certifications: [],
    contactInfo: {
      address: "123 Builder St, New York, NY 10001",
      phone: "123 Builder St, New York, NY 10001",
      email: "123 Builder St, New York, NY 10001",
      website: "123 Builder St, New York, NY 10001",
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header/Navigation */}
      <Navbar></Navbar>


      {/* Breadcrumb */}
      <FadeIn delay={100}>
        <div className="container mx-auto px-4 py-3 text-sm">
          <div className="flex items-center text-gray-500">
            <a
              href="/"
              className="hover:text-blue-600 transition-colors duration-300"
            >
              Home
            </a>
            <span className="mx-2">&gt;</span>
            <a
              href="/companies"
              className="hover:text-blue-600 transition-colors duration-300"
            >
              Companies
            </a>
            <span className="mx-2">&gt;</span>
            <span className="text-gray-700">{company.name}</span>
          </div>
        </div>
      </FadeIn>

      {/* Hero Image */}
      <FadeIn delay={300}>
        <div className="container mx-auto px-4 mb-8">
          <div className="relative bg-gray-200 h-64 md:h-80 rounded-lg overflow-visible pb-16">
            {/* Hero background image */}
            <div
              className={`absolute inset-0 bg-center bg-cover transition-opacity duration-1000 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              style={{ backgroundImage: `url('/api/placeholder/1200/400')` }}
              onLoad={() => setImageLoaded(true)}
            />

            {/* Overlay content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-gray-300 p-6 rounded-md">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7l-3 3.72L9 13l-3 4h12l-4-5z" />
                </svg>
              </div>
            </div>

            {/* Overlapping thumbnail */}
            <div
              className="absolute bottom-0 transform -translate-x-1/2 translate-y-1/2"
              style={{ left: "10%" }}
            >
              <div className="border-4 border-white bg-gray-200 w-24 h-24 rounded-md shadow-md overflow-hidden flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7l-3 3.72L9 13l-3 4h12l-4-5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Company Info */}
      <div className="container mx-auto px-4 pt-12">
        <FadeIn delay={300}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
            <div className="animate-fade-in-up">
              <div className="flex items-center mb-1">
                <h1 className="text-3xl font-bold mr-2">{company.name}</h1>
                {company.verified && (
                  <div className="flex items-center text-blue-600 bg-blue-50 rounded-full px-2 py-0.5 text-sm border border-blue-200">
                    <BadgeCheck size={16} className="mr-1" />
                    <span>Verified</span>
                  </div>
                )}
              </div>

              <div className="flex items-center text-gray-600 mb-4">
                <MapPin size={16} className="mr-1" />
                <span>{company.address}</span>
              </div>

              <div className="flex items-center flex-wrap gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center">
                  <Star
                    className="text-yellow-400 fill-yellow-400 mr-1"
                    size={18}
                  />
                  <span className="font-semibold mr-1">{company.rating}</span>
                  <span className="text-gray-500">
                    • {company.reviews} reviews
                  </span>
                </div>

                <div className="text-gray-600">{company.established}</div>
                <div className="text-gray-600">{company.projectsCount}</div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 md:mt-0">
              <Button variant="outline">Contact</Button>
              <Button variant="primary">Request Quote</Button>
            </div>
          </div>
        </FadeIn>

        {/* Tabs */}
        <FadeIn delay={400}>
          <div className="mb-6">
            <div className="flex overflow-x-auto">
              <Tab
                label="Overview"
                active={activeTab === "overview"}
                onClick={() => setActiveTab("overview")}
              />
              <Tab
                label="Portfolio"
                active={activeTab === "portfolio"}
                onClick={() => setActiveTab("portfolio")}
              />
              <Tab
                label="Reviews"
                active={activeTab === "reviews"}
                onClick={() => setActiveTab("reviews")}
              />
              <Tab
                label="Contact"
                active={activeTab === "contact"}
                onClick={() => setActiveTab("contact")}
              />
            </div>
          </div>
        </FadeIn>

        {/* Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Main Content */}
          <div className="md:col-span-2">
            <FadeIn delay={500}>
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6 transition-all duration-500 hover:shadow-md">
                <h2 className="text-xl font-bold mb-4">About {company.name}</h2>
                <p className="text-gray-700 mb-6">{company.description}</p>

                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Speacialities</h3>
                  <div className="flex flex-wrap">
                    {company.specialities.map((speciality, index) => (
                      <SpecialityTag key={`spec-${index}`} text={speciality} />
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Service Areas</h3>
                  <div className="flex flex-wrap">
                    {company.serviceAreas.map((area, index) => (
                      <SpecialityTag key={`area-${index}`} text={area} />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Certifications</h3>
                  {company.certifications &&
                  company.certifications.length > 0 ? (
                    <div className="flex flex-wrap">
                      {company.certifications.map((cert, index) => (
                        <SpecialityTag key={`cert-${index}`} text={cert} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">
                      No certifications listed
                    </p>
                  )}
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Contact Information */}
          <div className="md:col-span-1">
            <FadeIn delay={600}>
              <div className="bg-white rounded-lg shadow-sm p-6 transition-all duration-500 hover:shadow-md">
                <h2 className="text-xl font-bold mb-6">Contact Information</h2>

                <ContactItem
                  icon={<MapPin size={20} />}
                  text={company.contactInfo.address}
                />

                <ContactItem
                  icon={<Phone size={20} />}
                  text={company.contactInfo.phone}
                />

                <ContactItem
                  icon={<Mail size={20} />}
                  text={company.contactInfo.email}
                />

                <ContactItem
                  icon={<Globe size={20} />}
                  text={company.contactInfo.website}
                />
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfilePage;
