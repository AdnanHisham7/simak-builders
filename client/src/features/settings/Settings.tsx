import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AnimatedTabs from "@/components/ui/AnimatedTabs";
import { RootState } from "@/store/store";
import { updateUserFields } from "@/store/slices/authSlice";
import { DeactivationRequest, UserPreferences } from "@/services/userService";
import ChangePasswordCard from "./components/ChangePasswordCard";
import SessionsCard from "./components/SessionsCard";
import LoginActivityCard from "./components/LoginActivityCard";
import PreferencesCard from "./components/PreferencesCard";
import CompanyProfileCard from "./components/CompanyProfileCard";
import DeactivateAccountCard from "./components/DeactivateAccountCard";
import DeactivationRequestsCard from "./components/DeactivationRequestsCard";

const TAB_ACCOUNT = "Account & Security";
const TAB_PREFERENCES = "Preferences";
const TAB_COMPANY = "Company";

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultLandingPage: "",
  dateFormat: "DD/MM/YYYY",
  numberFormat: "en-IN",
  timezone: "Asia/Kolkata",
};

const Settings: React.FC = () => {
  const dispatch = useDispatch();
  const { user, userType } = useSelector((state: RootState) => state.auth);
  const isAdmin = userType === "admin";

  const tabs = isAdmin
    ? [TAB_ACCOUNT, TAB_PREFERENCES, TAB_COMPANY]
    : [TAB_ACCOUNT, TAB_PREFERENCES];

  const [activeTab, setActiveTab] = useState(TAB_ACCOUNT);
  const [deactivationRequest, setDeactivationRequest] = useState<
    DeactivationRequest | undefined
  >(undefined);

  const handlePreferencesChange = (preferences: UserPreferences) => {
    dispatch(updateUserFields({ preferences }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-console-text">Settings</h1>
        <p className="mt-0.5 text-sm text-console-muted">
          Manage your account, security, and preferences
        </p>
      </div>

      <AnimatedTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === TAB_ACCOUNT && (
        <div className="space-y-6">
          {isAdmin && <DeactivationRequestsCard />}
          <ChangePasswordCard />
          <SessionsCard />
          <LoginActivityCard />
          {!isAdmin && (
            <DeactivateAccountCard
              deactivationRequest={deactivationRequest}
              onChange={setDeactivationRequest}
            />
          )}
        </div>
      )}

      {activeTab === TAB_PREFERENCES && userType && (
        <PreferencesCard
          role={userType}
          preferences={{ ...DEFAULT_PREFERENCES, ...(user?.preferences || {}) }}
          onChange={handlePreferencesChange}
        />
      )}

      {activeTab === TAB_COMPANY && isAdmin && <CompanyProfileCard />}
    </div>
  );
};

export default Settings;
