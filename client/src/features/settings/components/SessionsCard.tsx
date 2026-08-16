import { useCallback, useEffect, useState } from "react";
import { Laptop, LogOut, Monitor, Smartphone, Tablet } from "lucide-react";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Skeleton from "@/components/ui/Skeleton";
import {
  UserSession,
  getSessions,
  logoutOtherSessions,
  revokeSession,
} from "@/services/authService";
import { clearUser } from "@/store/slices/authSlice";
import { usePreferences } from "@/hooks/usePreferences";

const deviceIcon = (device: string) => {
  const normalized = device.toLowerCase();
  if (normalized.includes("mobile")) return Smartphone;
  if (normalized.includes("tablet")) return Tablet;
  if (normalized.includes("desktop")) return Monitor;
  return Laptop;
};

const SessionsCard: React.FC = () => {
  const { formatDateTime } = usePreferences();
  const dispatch = useDispatch();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [confirmLogoutOthers, setConfirmLogoutOthers] = useState(false);
  const [loggingOutOthers, setLoggingOutOthers] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (err) {
      toast.error("Failed to load active sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRevoke = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      const result = await revokeSession(sessionId);
      if (result.loggedOutCurrent) {
        toast.success("You have been logged out");
        dispatch(clearUser());
        window.location.href = "/login";
        return;
      }
      toast.success("Session revoked");
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      toast.error("Failed to revoke session");
    } finally {
      setRevokingId(null);
      setConfirmRevokeId(null);
    }
  };

  const handleLogoutOthers = async () => {
    setLoggingOutOthers(true);
    try {
      await logoutOtherSessions();
      toast.success("Logged out of all other devices");
      await loadSessions();
    } catch (err) {
      toast.error("Failed to log out other devices");
    } finally {
      setLoggingOutOthers(false);
      setConfirmLogoutOthers(false);
    }
  };

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <Card>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-console-text">Active sessions</h3>
          <p className="text-xs text-console-muted">
            Devices currently signed in to your account.
          </p>
        </div>
        {otherSessionsCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmLogoutOthers(true)}
          >
            <LogOut size={14} /> Log out other devices
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-console-muted">No active sessions found.</p>
      ) : (
        <ul className="divide-y divide-console-border">
          {sessions.map((session) => {
            const Icon = deviceIcon(session.device);
            return (
              <li
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-console-bg text-console-muted">
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-console-text">
                      {session.browser} on {session.os}
                      {session.isCurrent && (
                        <span className="rounded-full bg-success-50 px-2 py-0.5 text-[11px] font-medium text-success-700">
                          This device
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-console-muted">
                      {session.ip} &middot; Last active {formatDateTime(session.lastUsedAt)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmRevokeId(session.id)}
                  disabled={revokingId === session.id}
                  className="text-sm font-medium text-danger-600 transition-colors hover:text-danger-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {session.isCurrent ? "Log out" : "Revoke"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmModal
        isOpen={!!confirmRevokeId}
        onClose={() => setConfirmRevokeId(null)}
        onConfirm={() => confirmRevokeId && handleRevoke(confirmRevokeId)}
        title="Revoke this session?"
        message="This device will be signed out immediately and will need to log in again."
        variant="danger"
        confirmText="Revoke"
        isLoading={!!revokingId}
      />

      <ConfirmModal
        isOpen={confirmLogoutOthers}
        onClose={() => setConfirmLogoutOthers(false)}
        onConfirm={handleLogoutOthers}
        title="Log out other devices?"
        message="All sessions other than this one will be signed out immediately."
        variant="warning"
        confirmText="Log out others"
        isLoading={loggingOutOthers}
      />
    </Card>
  );
};

export default SessionsCard;
