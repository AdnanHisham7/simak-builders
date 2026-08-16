import { useEffect, useMemo, useState } from "react";
import { History, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { LoginActivityEntry, getLoginActivity } from "@/services/authService";
import { usePreferences } from "@/hooks/usePreferences";
import { cn } from "@/lib/cn";

const ITEMS_PER_PAGE = 5;

const LoginActivityCard: React.FC = () => {
  const { formatDateTime } = usePreferences();
  const [logins, setLogins] = useState<LoginActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getLoginActivity(20);
        if (isMounted) setLogins(data);
      } catch (err) {
        if (isMounted) toast.error("Failed to load login activity");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalPages = Math.max(Math.ceil(logins.length / ITEMS_PER_PAGE), 1);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const paginatedLogins = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return logins.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [logins, currentPage]);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <Card>
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <History size={16} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-console-text">Login activity</h3>
          <p className="text-xs text-console-muted">Your most recent sign-ins.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : logins.length === 0 ? (
        <p className="text-sm text-console-muted">No login activity recorded yet.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-console-border text-xs uppercase tracking-wide text-console-muted">
                  <th className="py-2 pr-4 font-medium">Date &amp; time</th>
                  <th className="py-2 pr-4 font-medium">Device</th>
                  <th className="py-2 pr-4 font-medium">IP address</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogins.map((entry) => (
                  <tr key={entry.id} className="border-b border-console-border last:border-b-0">
                    <td className="py-2.5 pr-4 text-console-text">
                      {formatDateTime(entry.timestamp)}
                    </td>
                    <td className="py-2.5 pr-4 text-console-text">{entry.device}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-console-muted">
                      {entry.ip}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-xs text-console-muted">
                Page <span className="font-semibold text-console-text">{currentPage}</span> of{" "}
                <span className="font-semibold text-console-text">{totalPages}</span>
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-lg p-2 text-console-muted transition-colors hover:bg-console-bg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        type="button"
                        key={pageNum}
                        onClick={() => paginate(pageNum)}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors",
                          currentPage === pageNum
                            ? "bg-brand-700 text-white"
                            : "text-console-muted hover:bg-console-bg",
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return (
                      <span key={pageNum} className="px-1 text-console-muted">
                        …
                      </span>
                    );
                  }
                  return null;
                })}
                <button
                  type="button"
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-lg p-2 text-console-muted transition-colors hover:bg-console-bg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default LoginActivityCard;
