import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CoverBanner from "@/components/company/CoverBanner";
import CompanyHeader from "@/components/company/CompanyHeader";
import TabNavigationWithContent from "@/components/ui/TabNavigationWithContent";
import CompanyOverview from "@/components/company/CompanyOverview";
import CompanyPortfolio from "@/components/company/CompanyPortfolio";
import Reviews from "@/components/company/Reviews";
import ContactCard from "@/components/company/ContactCard";
import Navbar from "@/components/layout/Navbar";

const CompanyProfile = ({ companyName = "Simak Constructions" }) => {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "portfolio", label: "Portfolio" },
    { id: "reviews", label: "Reviews" },
    { id: "contact", label: "Contact" },
  ];

  const tabComponents = {
    overview: <CompanyOverview companyName={companyName} />,
    portfolio: <CompanyPortfolio />,
    reviews: <Reviews />,
    contact: <ContactCard />,
  };

  return (
    <>
      <Navbar></Navbar>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-6 md:px-12 py-8">
          <Breadcrumbs
            items={[
              { label: "Home", path: "/" },
              { label: "Companies", path: "/companies" },
              { label: companyName },
            ]}
          />

          <CoverBanner companyName="Simak Construction" />
          <CompanyHeader companyName={companyName} />
          <TabNavigationWithContent tabs={tabs} tabComponents={tabComponents} />
        </div>
      </div>
    </>
  );
};

export default CompanyProfile;
