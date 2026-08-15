import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { LoginActivityEntry, getLoginActivity } from "@/services/authService";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

const LoginActivityCard: React.FC = () => {
  const [logins, setLogins] = useState<LoginActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

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
              {logins.map((entry) => (
                <tr key={entry.id} className="border-b border-console-border last:border-b-0">
                  <td className="py-2.5 pr-4 text-console-text">
                    {formatDate(entry.timestamp)}
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
      )}
    </Card>
  );
};

export default LoginActivityCard;
