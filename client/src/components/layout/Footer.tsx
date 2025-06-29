import logoHorizontal from "@/assets/logo-horizontal-light.svg";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-6 px-6 md:px-20">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="md:col-span-1">
          {/* Logo */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() => navigate("/")}
          >
            <img
              src={logoHorizontal}
              alt="Simak Constructions Logo"
              className="h-10"
            />
          </div>

          <p className="text-gray-400 my-6">
            Building trust, one project at a time.
          </p>

          <div className="flex space-x-4">
            <a
              href="#"
              className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition"
            >
              <svg
                className="h-5 w-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
            <a
              target="_"
              href="https://www.instagram.com/simakbuilders"
              className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition"
            >
              <svg
                className="h-5 w-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a
              href="#"
              className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition"
            >
              <svg
                className="h-5 w-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
              </svg>
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
          <ul className="space-y-3 text-gray-400">
            <li>
              <a href="#" onClick={()=> navigate('/')} className="hover:text-white transition">
                Home
              </a>
            </li>
            <li>
              <a href="#" onClick={()=> navigate('/portfolio')} className="hover:text-white transition">
                Our Portfolio
              </a>
            </li>
            <li>
              <a href="#" onClick={()=> navigate('/contact')} className="hover:text-white transition">
                Contact
              </a>
            </li>
            <li>
              <a href="#" onClick={()=> navigate('/about')} className="hover:text-white transition">
                About Us
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-6">Resources</h3>
          <ul className="space-y-3 text-gray-400">
            <li>
              <a href="#" className="hover:text-white transition">
                Construction Guide
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition">
                Industry Reports
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition">
                Company Verification
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition">
                Supplier Directory
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-6">Get In Touch</h3>
          <ul className="space-y-3 text-gray-400">
            <li>support@simakbuilders.com</li>
            <li>+91 97472 16052</li>
            <li>
              Simak Builders
              <br />
              Nediyiruppu, Kerala, India
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center">
        <p className="text-gray-500 mb-4 md:mb-0">
          © 2025 Simak. All rights reserved
        </p>
        <div className="flex space-x-6">
          <a
            href="#"
            onClick={()=> navigate('/policy')}
            className="text-gray-400 hover:text-white transition text-sm"
          >
            Privacy Policy
          </a>
          {/* <a
            href="#"
            className="text-gray-400 hover:text-white transition text-sm"
          >
            Terms of Service
          </a>
          <a
            href="#"
            className="text-gray-400 hover:text-white transition text-sm"
          >
            Cookie Policy
          </a> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
