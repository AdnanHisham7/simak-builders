// import LogoutButton from "../components/auth/LogoutButton";
// import { useSelector } from "react-redux";
// import { RootState } from "../store/store";
import { useState, useEffect } from "react";
import {
  Menu,
  X,
  ChevronDown,
  Star,
  Building,
  CheckCircle,
  ArrowRight,
  Calendar,
  MessageSquare,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";

const HomePage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [counters, setCounters] = useState({
    projects: 0,
    companies: 0,
    clients: 0,
    satisfaction: 0,
  });

  // Animate counters on scroll
  useEffect(() => {
    const handleScroll = () => {
      const statsSection = document.getElementById("stats-section");
      if (!statsSection) return;

      const rect = statsSection.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        // Animate counters when section is visible
        const interval = setInterval(() => {
          setCounters((prev) => ({
            projects: prev.projects >= 1250 ? 1250 : prev.projects + 25,
            companies: prev.companies >= 450 ? 450 : prev.companies + 9,
            clients: prev.clients >= 3200 ? 3200 : prev.clients + 64,
            satisfaction: prev.satisfaction >= 98 ? 98 : prev.satisfaction + 2,
          }));
        }, 50);

        return () => clearInterval(interval);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const navigate = useNavigate();

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Homeowner",
      company: "Residential Client",
      rating: 5,
      text: "Finding the right contractor for our home renovation was effortless with this platform. The CRM system kept us updated throughout the entire project!",
    },
    {
      name: "Michael Chen",
      role: "Project Manager",
      company: "Chen Construction Inc.",
      rating: 5,
      text: "As a construction company, the leads we get through this platform are high-quality. The built-in CRM has streamlined our client communication tremendously.",
    },
    {
      name: "Rachel Torres",
      role: "Developer",
      company: "Urban Development Group",
      rating: 4,
      text: "The platform has connected us with reliable contractors for our commercial projects. The project tracking features save us hours every week.",
    },
  ];

  const categories = [
    { name: "Residential", icon: <Building size={32} />, count: 245 },
    { name: "Commercial", icon: <Building size={32} />, count: 189 },
    { name: "Remodeling", icon: <Building size={32} />, count: 312 },
    { name: "Architecture", icon: <Building size={32} />, count: 167 },
  ];

  const featuredCompanies = [
    {
      name: "Elite Construction Group",
      specialty: "Luxury Residential",
      rating: 4.9,
      projects: 128,
      image: "/api/placeholder/400/300",
    },
    {
      name: "BuildRight Solutions",
      specialty: "Commercial Development",
      rating: 4.8,
      projects: 95,
      image: "/api/placeholder/400/300",
    },
    {
      name: "Modern Designs & Build",
      specialty: "Contemporary Architecture",
      rating: 4.7,
      projects: 87,
      image: "/api/placeholder/400/300",
    },
  ];

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

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navbar></Navbar>

      {/* Hero Section */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Find Trusted Construction Companies
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Connect with verified builders for your home construction,
              renovation, or repair projects
            </p>

            <div className="mt-8 max-w-2xl mx-auto">
              <div className="flex rounded-md shadow-md bg-white overflow-hidden">
                <input
                  type="text"
                  placeholder="What type of construction project do you need?"
                  className="flex-grow px-4 py-3 focus:outline-none"
                />
                <button className="bg-blue-600 text-white px-6 py-3 flex items-center">
                  <Search size={20} className="mr-2" />
                  Search
                </button>
              </div>
            </div>

            <div className="mt-10 pt-6 flex flex-wrap justify-center gap-8">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-full">
                  <CheckCircle size={20} className="text-blue-600" />
                </div>
                <span className="ml-2 text-gray-700">Verified Companies</span>
              </div>

              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Star size={20} className="text-blue-600" />
                </div>
                <span className="ml-2 text-gray-700">Rated By Clients</span>
              </div>

              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Calendar size={20} className="text-blue-600" />
                </div>
                <span className="ml-2 text-gray-700">Quick Responses</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats-section" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {counters.projects}+
              </div>
              <div className="text-gray-600 mt-2">Projects Completed</div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {counters.companies}+
              </div>
              <div className="text-gray-600 mt-2">Verified Companies</div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {counters.clients}+
              </div>
              <div className="text-gray-600 mt-2">Satisfied Clients</div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {counters.satisfaction}%
              </div>
              <div className="text-gray-600 mt-2">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Browse by Category */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Browse by Category
            </h2>
            <p className="text-xl text-gray-600 mt-4">
              Find the right construction expertise for your specific needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="bg-blue-100 p-4 rounded-full text-blue-600 mb-4">
                    {category.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {category.name}
                  </h3>
                  <p className="text-gray-600 mt-2">
                    {category.count} Companies
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Companies */}
      <section id="companies" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Featured Construction Companies
            </h2>
            <p className="text-xl text-gray-600 mt-4">
              Top-rated professionals ready to tackle your project
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCompanies.map((company, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <img
                  src={company.image}
                  alt={company.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {company.name}
                  </h3>
                  <p className="text-gray-600 mt-1">{company.specialty}</p>

                  <div className="flex items-center mt-4">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          fill={
                            i < Math.floor(company.rating)
                              ? "currentColor"
                              : "none"
                          }
                        />
                      ))}
                    </div>
                    <span className="text-gray-600 ml-2">{company.rating}</span>
                  </div>

                  <div className="flex items-center mt-4 text-gray-600">
                    <CheckCircle size={16} className="mr-2" />
                    <span>{company.projects} Projects Completed</span>
                  </div>

                  <button className="mt-6 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button className="bg-transparent border border-blue-600 text-blue-600 px-6 py-3 rounded-md hover:bg-blue-50 transition-colors inline-flex items-center">
              View All Companies <ArrowRight size={16} className="ml-2" />
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="text-xl text-gray-600 mt-4">
              Simple steps to your successful construction project
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="bg-blue-100 p-4 rounded-full text-blue-600 inline-block mb-4">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 mt-2">{step.description}</p>
                </div>

                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                    <ArrowRight size={24} className="text-blue-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 mt-4">
              Hear from clients and construction companies using our platform
            </p>
          </div>

          <div className="relative bg-gray-50 rounded-xl p-8 shadow-md overflow-hidden">
            <div className="max-w-3xl mx-auto">
              <div className="relative h-64">
                {testimonials.map((testimonial, index) => (
                  <div
                    key={index}
                    className={`absolute top-0 left-0 w-full transition-opacity duration-500 ${
                      index === activeTestimonial ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <div className="flex justify-center mb-6">
                      <div className="flex text-yellow-400">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} size={24} fill="currentColor" />
                        ))}
                      </div>
                    </div>

                    <p className="text-lg text-gray-700 text-center italic">
                      "{testimonial.text}"
                    </p>

                    <div className="text-center mt-6">
                      <p className="font-semibold text-gray-900">
                        {testimonial.name}
                      </p>
                      <p className="text-gray-600">
                        {testimonial.role}, {testimonial.company}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center mt-6 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full ${
                    index === activeTestimonial ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partners/Sponsors */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Trusted by Industry Leaders
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center opacity-70">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="flex justify-center">
                <img
                  src={`/api/placeholder/120/60`}
                  alt={`Partner logo ${index + 1}`}
                  className="h-12"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 mt-4">
              Get answers to common questions about our platform
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                question: "How do you verify construction companies?",
                answer:
                  "We conduct a thorough verification process that includes checking business licenses, insurance coverage, reviewing past projects, and collecting client reviews. Only companies that meet our quality standards are listed on our platform.",
              },
              {
                question: "What does the CRM system include?",
                answer:
                  "Our built-in CRM system includes project tracking, file sharing, milestone management, payment processing, communication tools, and automated notifications to keep everyone on the same page throughout the project lifecycle.",
              },
              {
                question: "How much does it cost to use the platform?",
                answer:
                  "Clients can post projects and browse companies for free. Construction companies have several subscription tiers available, starting with a basic free tier and scaling up to premium packages with advanced features and better visibility.",
              },
              {
                question:
                  "Can I use the platform for small residential projects?",
                answer:
                  "Absolutely! Our platform caters to projects of all sizes, from small residential renovations to large commercial developments. You'll find professionals specializing in projects just like yours.",
              },
            ].map((item, index) => (
              <div key={index} className="border-b border-gray-200 pb-6">
                <button
                  className="flex justify-between items-center w-full text-left focus:outline-none"
                  onClick={() => {
                    // Accordion functionality would be implemented here
                  }}
                >
                  <span className="text-lg font-medium text-gray-900">
                    {item.question}
                  </span>
                  <ChevronDown size={20} className="text-gray-500" />
                </button>
                <div className="mt-3">
                  <p className="text-gray-600">{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to Start Your Construction Project?
          </h2>
          <p className="text-xl text-blue-100 mt-4 mb-8">
            Join thousands of satisfied clients who found the perfect
            construction partner through our platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-md text-lg font-medium hover:bg-blue-50 transition-colors">
              Post a Project
            </button>
            <button className="bg-transparent border border-white text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-blue-500 transition-colors">
              Browse Companies
            </button>
          </div>
        </div>
      </section>

      {/* Blog Preview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Construction Insights
            </h2>
            <p className="text-xl text-gray-600 mt-4">
              Latest tips, trends, and news from the construction industry
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "5 Questions to Ask Before Hiring a Contractor",
                category: "Hiring Tips",
                image: "/api/placeholder/400/250",
              },
              {
                title: "Sustainable Building Materials Trending in 2025",
                category: "Industry Trends",
                image: "/api/placeholder/400/250",
              },
              {
                title: "How to Create an Accurate Construction Budget",
                category: "Project Planning",
                image: "/api/placeholder/400/250",
              },
            ].map((post, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md"
              >
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="text-sm text-blue-600 font-medium mb-2">
                    {post.category}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {post.title}
                  </h3>
                  <div className="mt-4">
                    <a
                      href="#"
                      className="text-blue-600 inline-flex items-center"
                    >
                      Read More <ArrowRight size={16} className="ml-2" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div>
              <div className="text-2xl font-bold text-white mb-4">
                BuildConnect
              </div>
              <p className="text-gray-400 mb-4">
                Connecting quality construction companies with clients for
                successful projects.
              </p>
              <div className="flex space-x-4">
                {/* Social media icons would go here */}
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <span className="sr-only">Facebook</span>
                  <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <span className="sr-only">Twitter</span>
                  <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <span className="sr-only">LinkedIn</span>
                  <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <span className="sr-only">Instagram</span>
                  <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="#features"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="#companies"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Companies
                  </a>
                </li>
                <li>
                  <a
                    href="#testimonials"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Testimonials
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">For Companies</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Join as a Contractor
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Pricing Plans
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Success Stories
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Resources
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <ul className="space-y-2 text-gray-400">
                <li>123 Construction Way</li>
                <li>Building City, BC 12345</li>
                <li>info@buildconnect.com</li>
                <li>(555) 123-4567</li>
              </ul>

              <div className="mt-6">
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                  Contact Support
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400">
                © 2025 BuildConnect. All rights reserved.
              </div>
              <div className="flex space-x-4 mt-4 md:mt-0">
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Terms of Service
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
