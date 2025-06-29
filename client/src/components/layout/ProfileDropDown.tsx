import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import {
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useDispatch } from "react-redux";
import { clearUser } from "@/store/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { logout } from "@/services/authService";

const ProfileDropdown = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    dispatch(clearUser());
    navigate("/login");
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="flex items-center space-x-2 focus:outline-none">
          <UserCircleIcon className="h-8 w-8 text-gray-700" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => navigate("/profile")}
                  className={`${
                    active ? "bg-gray-100" : ""
                  } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                >
                  <UserCircleIcon className="h-5 w-5 mr-2" />
                  View Profile
                </button>
              )}
            </Menu.Item>

            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => navigate("/settings")}
                  className={`${
                    active ? "bg-gray-100" : ""
                  } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                >
                  <Cog6ToothIcon className="h-5 w-5 mr-2" />
                  Settings
                </button>
              )}
            </Menu.Item>

            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={()=> handleLogout()}
                  className={`${
                    active ? "bg-gray-100" : ""
                  } flex items-center w-full px-4 py-2 text-sm text-red-600`}
                >
                  <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
                  Logout
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default ProfileDropdown;
