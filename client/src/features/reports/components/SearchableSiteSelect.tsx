import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, X, Building2, MapPin, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

export interface ReportSiteItem {
  _id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  client?: { name: string };
  supervisionPercentage?: number;
}

interface SearchableSiteSelectProps {
  sites: ReportSiteItem[];
  value: string;
  onChange: (siteId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const SearchableSiteSelect: React.FC<SearchableSiteSelectProps> = ({
  sites,
  value,
  onChange,
  placeholder = "Select site",
  className = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedSite = useMemo(
    () => sites.find((s) => s._id === value),
    [sites, value]
  );

  // Filter sites by name, client name, city, and address
  const filteredSites = useMemo(() => {
    if (!searchQuery.trim()) return sites;
    const query = searchQuery.toLowerCase().trim();
    return sites.filter((site) => {
      const nameMatch = site.name?.toLowerCase().includes(query);
      const clientMatch = site.client?.name?.toLowerCase().includes(query);
      const cityMatch = site.city?.toLowerCase().includes(query);
      const addressMatch = site.address?.toLowerCase().includes(query);
      return nameMatch || clientMatch || cityMatch || addressMatch;
    });
  }, [sites, searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(-1);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredSites.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredSites.length - 1
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      const siteToSelect = filteredSites[highlightedIndex];
      if (siteToSelect) {
        onChange(siteToSelect._id);
        setIsOpen(false);
      }
    }
  };

  // Keep highlighted item in view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-site-item="true"]');
      const target = items[highlightedIndex] as HTMLElement;
      if (target) {
        target.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  const handleSelectSite = (siteId: string) => {
    onChange(siteId);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "group flex w-full items-center justify-between rounded-lg border bg-white px-3.5 py-2.5 text-left text-sm transition-all duration-150 focus:outline-none",
          isOpen
            ? "border-brand-500 ring-2 ring-brand-100 shadow-sm"
            : "border-console-border hover:border-slate-300",
          disabled && "cursor-not-allowed bg-slate-50 opacity-60"
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
          <Building2
            size={16}
            className={cn(
              "shrink-0 transition-colors",
              selectedSite ? "text-brand-600" : "text-console-muted group-hover:text-slate-500"
            )}
          />
          <div className="min-w-0 flex-1 truncate">
            {selectedSite ? (
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-medium text-console-text truncate">
                  {selectedSite.name}
                </span>
                {selectedSite.client?.name && (
                  <span className="text-xs text-console-muted shrink-0 hidden sm:inline">
                    ({selectedSite.client.name})
                  </span>
                )}
              </div>
            ) : (
              <span className="text-console-muted">{placeholder}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedSite && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  onChange("");
                }
              }}
              title="Clear selection"
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={16}
            className={cn(
              "text-console-muted transition-transform duration-200",
              isOpen && "rotate-180 text-brand-600"
            )}
          />
        </div>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-80 overflow-hidden rounded-xl border border-console-border bg-white shadow-xl ring-1 ring-black/5"
          >
            {/* Search Input Box */}
            <div className="sticky top-0 z-10 border-b border-console-border/80 bg-slate-50/90 p-2.5 backdrop-blur-sm">
              <div className="relative">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-console-muted"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  placeholder="Search site, client, location..."
                  className="w-full rounded-lg border border-console-border bg-white py-2 pl-9 pr-8 text-xs text-console-text placeholder-console-muted shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-console-muted">
                <span>
                  {filteredSites.length}{" "}
                  {filteredSites.length === 1 ? "site" : "sites"} found
                </span>
                {value && (
                  <button
                    type="button"
                    onClick={() => handleSelectSite("")}
                    className="text-brand-600 hover:underline hover:text-brand-700"
                  >
                    Reset selection
                  </button>
                )}
              </div>
            </div>

            {/* Sites List */}
            <div
              ref={listRef}
              className="max-h-60 overflow-y-auto p-1 divide-y divide-slate-100/80"
              role="listbox"
            >
              {filteredSites.length === 0 ? (
                <div className="py-6 px-4 text-center">
                  <Building2 size={24} className="mx-auto text-slate-300 mb-1.5" />
                  <p className="text-xs font-medium text-console-text">
                    No sites found
                  </p>
                  <p className="text-[11px] text-console-muted mt-0.5">
                    No sites match "{searchQuery}"
                  </p>
                </div>
              ) : (
                filteredSites.map((site, index) => {
                  const isSelected = site._id === value;
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <button
                      type="button"
                      key={site._id}
                      data-site-item="true"
                      onClick={() => handleSelectSite(site._id)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={cn(
                        "group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors",
                        isSelected
                          ? "bg-brand-50/70 text-brand-950 font-medium"
                          : isHighlighted
                          ? "bg-slate-100/80 text-console-text"
                          : "text-console-text hover:bg-slate-50"
                      )}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "truncate font-semibold",
                              isSelected ? "text-brand-700" : "text-slate-800"
                            )}
                          >
                            {site.name}
                          </span>
                          {site.supervisionPercentage !== undefined && (
                            <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                              {site.supervisionPercentage}% sup.
                            </span>
                          )}
                        </div>

                        {/* Secondary metadata: Client and/or City */}
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-console-muted">
                          {site.client?.name && (
                            <span className="inline-flex items-center gap-1">
                              <User size={11} className="text-slate-400" />
                              <span className="truncate">{site.client.name}</span>
                            </span>
                          )}
                          {(site.city || site.state) && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={11} className="text-slate-400" />
                              <span className="truncate">
                                {[site.city, site.state].filter(Boolean).join(", ")}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                          <Check size={12} strokeWidth={2.5} />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchableSiteSelect;
