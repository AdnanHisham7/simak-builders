import { useEffect, useState } from "react";
import { CompanyProfile, getCompanyProfile } from "@/services/companyService";

const STORAGE_KEY = "simak_cached_company_profile";

let cachedProfile: CompanyProfile | null = (() => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

let inflightRequest: Promise<CompanyProfile | null> | null = null;

const fetchCompanyProfile = (): Promise<CompanyProfile | null> => {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return Promise.resolve(cachedProfile);
  }
  if (cachedProfile) return Promise.resolve(cachedProfile);
  if (!inflightRequest) {
    inflightRequest = getCompanyProfile()
      .then((data) => {
        cachedProfile = data;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch {
          // ignore
        }
        return data;
      })
      .catch(() => cachedProfile)
      .finally(() => {
        inflightRequest = null;
      });
  }
  return inflightRequest;
};

export const invalidateCompanyProfileCache = (nextProfile?: CompanyProfile) => {
  cachedProfile = nextProfile ?? null;
  if (nextProfile) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
    } catch {
      // ignore
    }
  }
  inflightRequest = null;
};

export const useCompanyProfile = () => {
  const [profile, setProfile] = useState<CompanyProfile | null>(cachedProfile);
  const [loading, setLoading] = useState(!cachedProfile);

  useEffect(() => {
    if (cachedProfile) {
      setProfile(cachedProfile);
      setLoading(false);
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        return;
      }
    }
    let isMounted = true;
    fetchCompanyProfile()
      .then((data) => {
        if (isMounted && data) setProfile(data);
      })
      .catch(() => {
        // Non-fatal: sidebar/footer fall back to default branding.
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
