import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ContactCard from "@/components/company/ContactCard";

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow">
        <ContactCard />
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
