import Navbar from "@/components/layout/Navbar";
import BrowsingHero from "@/components/public/BrowsingHero";
import BrowseCompanies from "@/components/public/BrowseCompanies";
import Footer from "@/components/layout/Footer";

const BrowsingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar></Navbar>
      <main>
        <BrowsingHero />
        <BrowseCompanies />
      </main>
      <Footer />
    </div>
  );
};

export default BrowsingPage;
