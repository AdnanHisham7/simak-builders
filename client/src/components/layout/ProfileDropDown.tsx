import { useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { UserCircle, Settings, LogOut } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "@/store/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { logout } from "@/services/authService";
import { RootState } from "@/store/store";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const ProfileDropdown = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, userType } = useSelector((state: RootState) => state.auth);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      dispatch(clearUser());
      setIsLogoutConfirmOpen(false);
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const rolePrefix = userType ? `/${userType}` : "";

  return (
    <>
      <Menu as="div" className="relative inline-block text-left">
        <MenuButton className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-console-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <UserCircle className="h-5 w-5" />
          </span>
          {user?.name && (
            <span className="hidden text-sm font-medium text-console-text sm:inline">
              {user.name}
            </span>
          )}
        </MenuButton>

        <MenuItems
          anchor={{ to: "bottom end", gap: 8, padding: 16 }}
          portal
          transition
          className="glass-panel z-[999999] w-52 origin-top-right rounded-glass-sm p-1.5 shadow-glass-lg transition duration-150 ease-out focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-150 data-[leave]:duration-100 data-[leave]:ease-in"
        >
          <MenuItem>
            {({ focus }) => (
              <button
                onClick={() => navigate(`${rolePrefix}/profile`)}
                className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-console-text ${
                  focus ? "bg-white/70" : ""
                }`}
              >
                <UserCircle className="h-4 w-4 text-console-muted" />
                View profile
              </button>
            )}
          </MenuItem>

          <MenuItem>
            {({ focus }) => (
              <button
                onClick={() => navigate(`${rolePrefix}/settings`)}
                className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-console-text ${
                  focus ? "bg-white/70" : ""
                }`}
              >
                <Settings className="h-4 w-4 text-console-muted" />
                Settings
              </button>
            )}
          </MenuItem>

          <div className="my-1 border-t border-console-border" />

          <MenuItem>
            {({ focus }) => (
              <button
                onClick={() => setIsLogoutConfirmOpen(true)}
                className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-danger-600 ${
                  focus ? "bg-danger-50" : ""
                }`}
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            )}
          </MenuItem>
        </MenuItems>
      </Menu>

      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
        title="Log out of Simak Builders?"
        message="You'll need to sign in again to access your console."
        isLoading={isLoggingOut}
        variant="warning"
        confirmText="Log out"
        cancelText="Stay signed in"
      />
    </>
  );
};

export default ProfileDropdown;
