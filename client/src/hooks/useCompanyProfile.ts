import { useEffect, useState } from "react";
import { CompanyProfile, getCompanyProfile } from "@/services/companyService";

let cachedProfile: CompanyProfile | null = null;
let inflightRequest: Promise<CompanyProfile> | null = null;

const fetchCompanyProfile = (): Promise<CompanyProfile> => {
  if (cachedProfile) return Promise.resolve(cachedProfile);
  if (!inflightRequest) {
    inflightRequest = getCompanyProfile()
      .then((data) => {
        cachedProfile = data;
        return data;
      })
      .finally(() => {
        inflightRequest = null;
      });
  }
  return inflightRequest;
};

export const invalidateCompanyProfileCache = (nextProfile?: CompanyProfile) => {
  cachedProfile = nextProfile ?? null;
  inflightRequest = null;
};

export const useCompanyProfile = () => {
  const [profile, setProfile] = useState<CompanyProfile | null>(cachedProfile);
  const [loading, setLoading] = useState(!cachedProfile);

  useEffect(() => {
    if (cachedProfile) {
      setProfile(cachedProfile);
      setLoading(false);
      return;
    }
    let isMounted = true;
    fetchCompanyProfile()
      .then((data) => {
        if (isMounted) setProfile(data);
      })
      .catch(() => {
        // Non-fatal: sidebar/footer fall back to their default branding.
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return { profile, loading };
};
