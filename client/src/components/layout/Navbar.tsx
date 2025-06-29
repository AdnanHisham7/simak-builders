import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bars3Icon, XMarkIcon, UserCircleIcon } from "@/assets/icons/index";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import Button from "@/components/ui/Button";
import ProfileDropdown from "./ProfileDropDown";
import NotificationBell from "../ui/NotificationBell";
import logoHorizontal from "@/assets/logo-horizontal.svg";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Portfolio", path: "/portfolio" },
  { name: "Contact Us", path: "/contact" },
  { name: "About", path: "/about" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, userType } = useSelector(
    (state: RootState) => state.auth
  );

  return (
    <header className="bg-white border-b py-4 w-full z-50 transition-colors duration-300">
      <div className="px-6 md:px-12 flex items-center justify-between relative">
        {/* Logo */}
        <div
          className="flex items-center cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img src={logoHorizontal} alt="Bizorago Logo" className="h-10" />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center space-x-8">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;

            return (
              <a
                key={link.name}
                onClick={() => navigate(link.path)}
                className={`text-gray-700 hover:text-yellow-800 hover:cursor-pointer transition border-b-2 ${
                  isActive
                    ? "text-yellow-800 border-yellow-800"
                    : "border-transparent"
                }`}
              >
                {link.name}
              </a>
            );
          })}
        </nav>

        {/* Desktop Auth Actions */}
        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Button
                variant="outline"
                onClick={() => navigate(`/${userType}/dashboard`)}
              >
                My Console
              </Button>
              {/* <NotificationBell
                count={3}
                onClick={() => navigate("/notifications")}
              /> */}
              <ProfileDropdown />
            </>
          ) : (
            <>
              <Button onClick={() => navigate("/login")} variant="pill-primary">
                Login
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <div
        className={`md:hidden bg-white shadow-md space-y-4 overflow-hidden transition-[max-height,opacity,padding] duration-300 ease-in-out ${
          isOpen
            ? "opacity-100 max-h-[500px] px-4 py-4"
            : "opacity-0 max-h-0 px-4 py-0"
        }`}
      >
        {navLinks.map((link) => (
          <button
            key={link.name}
            onClick={() => {
              navigate(link.path);
              setIsOpen(false);
            }}
            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
          >
            {link.name}
          </button>
        ))}

        <div className="flex flex-col gap-2 pt-4">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => {
                  navigate(`/${userType}/dashboard`);
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 text-gray-700 px-3 py-2 hover:bg-gray-100 rounded-full w-full"
              >
                <span>My Console</span>
              </button>

              <button
                onClick={() => {
                  navigate("/notifications");
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 text-gray-700 px-3 py-2 hover:bg-gray-100 rounded-md w-full"
              >
                <NotificationBell count={3} />
                <span>Notifications</span>
              </button>

              <button
                onClick={() => {
                  navigate("/profile");
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 text-gray-700 px-3 py-2 hover:bg-gray-100 rounded-md w-full"
              >
                <UserCircleIcon className="h-6 w-6" />
                <span>Profile</span>
              </button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  navigate("/login");
                  setIsOpen(false);
                }}
                className="w-full"
              >
                Login
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  navigate("/signup");
                  setIsOpen(false);
                }}
                className="w-full"
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
