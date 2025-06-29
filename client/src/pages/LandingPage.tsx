import Navbar from "@/components/layout/Navbar";
import LandingHero from "../components/public/LandingHero";
import StatsCards from "../components/company/StatsCards";
import ServiceCards from "../components/company/ServiceCards";
import BenefitsSection from "../components/public/BenefitsSection";
import IntegrationsSection from "../components/public/IntegrationsSection";
import CallToAction from "../components/public/CallToAction";
import Steps from "../components/public/HowItWorks";
import Footer from "@/components/layout/Footer";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <LandingHero />
      <StatsCards />
      <ServiceCards />
      <BenefitsSection />
      <IntegrationsSection />
      <CallToAction />
      {/* <Steps></Steps> */}
      <Footer />
    </div>
  );
};

export default LandingPage;
