import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CompanyPortfolio from "@/components/company/CompanyPortfolio";

const Portfolio = () => {
  return (
    <div className="min-h-screen bg-gray-50">
     <Navbar />
      <main className="flex-grow">
        <CompanyPortfolio />
      </main>
      <Footer />
    </div>
  );
};

export default Portfolio;
