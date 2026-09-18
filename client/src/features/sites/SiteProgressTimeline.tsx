import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  BarChart3,
  RotateCcw,
  Check,
  Eye,
} from "lucide-react";
import { usePreferences } from "@/hooks/usePreferences";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Tooltip from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";

export interface TimelinePhase {
  id: string;
  name: string;
  status: "not started" | "pending" | "completed";
  completionDate?: string;
  requestedBy?: string;
}

interface SiteProgressTimelineProps {
  phases: TimelinePhase[];
  siteCreatedAt?: string;
  siteName?: string;
  userType?: string;
  onUpdateStatus?: (
    phaseId: string,
    newStatus: "not started" | "pending" | "completed",
  ) => Promise<void>;
  onResetPhases?: () => void;
  readOnly?: boolean;
  className?: string;
  defaultView?: "timeline" | "gantt";
  title?: string;
  subtitle?: string;
}

type ViewMode = "timeline" | "gantt";

interface ComputedGanttBar {
  phase: TimelinePhase;
  index: number;
  startDate: Date;
  endDate: Date;
  durationDays: number;
  leftPercent: number;
  widthPercent: number;
  isCompleted: boolean;
  isPending: boolean;
  isProjected: boolean;
}

export const SiteProgressTimeline: React.FC<SiteProgressTimelineProps> = ({
  phases,
  siteCreatedAt,
  siteName,
  userType = "client",
  onUpdateStatus,
  onResetPhases,
  readOnly = false,
  className,
  defaultView = "timeline",
  title = "Project overview",
  subtitle = "Track construction milestones, timeline progress, and schedule phases",
}) => {
  const { formatDate } = usePreferences();
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);
  const [updatingPhaseId, setUpdatingPhaseId] = useState<string | null>(null);

  const totalPhases = phases.length;
  const completedCount = useMemo(
    () => phases.filter((p) => p.status === "completed").length,
    [phases],
  );
  const pendingCount = useMemo(
    () => phases.filter((p) => p.status === "pending").length,
    [phases],
  );
  const notStartedCount = useMemo(
    () => phases.filter((p) => p.status === "not started").length,
    [phases],
  );
  const progressPercentage =
    totalPhases > 0 ? Math.round((completedCount / totalPhases) * 100) : 0;

  // Gantt calculations
  const { ganttBars, ganttStartDate, ganttEndDate, todayPercent, timeMarkers } = useMemo(() => {
    if (phases.length === 0) {
      const now = new Date();
      return {
        ganttBars: [],
        ganttStartDate: now,
        ganttEndDate: now,
        todayPercent: 50,
        timeMarkers: [],
      };
    }

    const now = new Date();
    let baseStart = siteCreatedAt ? new Date(siteCreatedAt) : null;
    if (!baseStart || isNaN(baseStart.getTime())) {
      const firstCompleted = phases.find((p) => p.completionDate)?.completionDate;
      if (firstCompleted) {
        baseStart = new Date(new Date(firstCompleted).getTime() - 14 * 86400000);
      } else {
        baseStart = new Date(now.getTime() - 30 * 86400000);
      }
    }

    let rollingDate = new Date(baseStart.getTime());
    const rawBars: Array<{
      phase: TimelinePhase;
      index: number;
      startDate: Date;
      endDate: Date;
      durationDays: number;
      isCompleted: boolean;
      isPending: boolean;
      isProjected: boolean;
    }> = [];

    phases.forEach((phase, idx) => {
      let start: Date;
      let end: Date;
      const isCompleted = phase.status === "completed";
      const isPending = phase.status === "pending";
      const isProjected = phase.status === "not started";

      if (isCompleted) {
        start = new Date(rollingDate.getTime());
        if (phase.completionDate && !isNaN(new Date(phase.completionDate).getTime())) {
          end = new Date(phase.completionDate);
          if (end.getTime() < start.getTime()) {
            start = new Date(end.getTime() - 7 * 86400000);
          }
        } else {
          end = new Date(start.getTime() + 7 * 86400000);
        }
        rollingDate = new Date(Math.max(rollingDate.getTime(), end.getTime()));
      } else if (isPending) {
        start = new Date(rollingDate.getTime());
        end = new Date(Math.max(now.getTime(), start.getTime() + 5 * 86400000));
        rollingDate = new Date(end.getTime());
      } else {
        start = new Date(rollingDate.getTime());
        end = new Date(start.getTime() + 10 * 86400000);
        rollingDate = new Date(end.getTime());
      }

      const durationDays = Math.max(
        1,
        Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
      );

      rawBars.push({
        phase,
        index: idx,
        startDate: start,
        endDate: end,
        durationDays,
        isCompleted,
        isPending,
        isProjected,
      });
    });

    const minTime = Math.min(...rawBars.map((b) => b.startDate.getTime()), baseStart.getTime());
    const maxTime = Math.max(
      ...rawBars.map((b) => b.endDate.getTime()),
      now.getTime() + 7 * 86400000,
    );
    const totalTimeSpan = Math.max(86400000 * 7, maxTime - minTime);

    const computedBars: ComputedGanttBar[] = rawBars.map((bar) => {
      const leftPercent = Math.max(0, ((bar.startDate.getTime() - minTime) / totalTimeSpan) * 100);
      const widthPercent = Math.max(
        3,
        ((bar.endDate.getTime() - bar.startDate.getTime()) / totalTimeSpan) * 100,
      );
      return {
        ...bar,
        leftPercent,
        widthPercent,
      };
    });

    const todayPct = Math.min(100, Math.max(0, ((now.getTime() - minTime) / totalTimeSpan) * 100));

    const markerCount = 4;
    const markers: Array<{ label: string; percent: number }> = [];
    for (let i = 0; i <= markerCount; i++) {
      const markerTime = minTime + (totalTimeSpan * i) / markerCount;
      const markerDate = new Date(markerTime);
      markers.push({
        label: formatDate(markerDate.toISOString()),
        percent: (i / markerCount) * 100,
      });
    }

    return {
      ganttBars: computedBars,
      ganttStartDate: new Date(minTime),
      ganttEndDate: new Date(maxTime),
      todayPercent: todayPct,
      timeMarkers: markers,
    };
  }, [phases, siteCreatedAt, formatDate]);

  const activePhaseIndex = useMemo(() => {
    // 1. Pending review gets top priority
    const pendingIdx = phases.findIndex((p) => p.status === "pending");
    if (pendingIdx !== -1) return pendingIdx;
    // 2. First not started phase
    const notStartedIdx = phases.findIndex((p) => p.status === "not started");
    if (notStartedIdx !== -1) return notStartedIdx;
    // 3. If all completed, last one
    return Math.max(0, phases.length - 1);
  }, [phases]);

  const midIndex = Math.ceil(phases.length / 2);
  const firstHalfPhases = useMemo(() => phases.slice(0, midIndex), [phases, midIndex]);
  const secondHalfPhases = useMemo(() => phases.slice(midIndex), [phases, midIndex]);

  const handleStatusClick = async (
    phaseId: string,
    newStatus: "not started" | "pending" | "completed",
  ) => {
    if (!onUpdateStatus || updatingPhaseId) return;
    try {
      setUpdatingPhaseId(phaseId);
      await onUpdateStatus(phaseId, newStatus);
    } finally {
      setUpdatingPhaseId(null);
    }
  };

  const renderPipelineCard = (
    phase: TimelinePhase,
    globalIdx: number,
    isLastInCol: boolean,
  ) => {
    const isCompleted = phase.status === "completed";
    const isPending = phase.status === "pending";
    const isActive = globalIdx === activePhaseIndex && !isCompleted;

    return (
      <div
        key={phase.id}
        id={`milestone-phase-${phase.id}`}
        className="relative pl-9 pb-3 last:pb-0"
      >
        {/* Continuous Connecting Vertical Track Spine */}
        {!isLastInCol && (
          <div
            className={cn(
              "absolute left-3.5 top-6 bottom-0 w-0.5 -translate-x-1/2 transition-colors",
              isCompleted ? "bg-success-500" : "bg-slate-200",
            )}
          />
        )}

        {/* Step Node Circle on track */}
        <div
          className={cn(
            "absolute left-0 top-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all shadow-2xs z-10",
            isCompleted
              ? "bg-success-600 text-white"
              : isPending
                ? "bg-warning-500 text-white ring-4 ring-warning-100"
                : isActive
                  ? "bg-brand-600 text-white ring-4 ring-brand-100 animate-pulse"
                  : "bg-white text-slate-500 border border-slate-300",
          )}
        >
          {isCompleted ? (
            <Check size={13} strokeWidth={3} />
          ) : isPending ? (
            <Clock size={12} strokeWidth={2.5} />
          ) : (
            <span>{globalIdx + 1}</span>
          )}
        </div>

        {/* Step Card Body */}
        <div
          className={cn(
            "group flex items-center justify-between gap-3 rounded-xl border p-3 transition-all",
            isCompleted
              ? "border-success-200/90 bg-success-50/20 hover:border-success-300"
              : isPending
                ? "border-warning-300 bg-warning-50/30 hover:border-warning-400"
                : isActive
                  ? "border-brand-300 bg-brand-50/25 ring-1 ring-brand-200 hover:border-brand-400"
                  : "border-console-border bg-white hover:border-slate-300 hover:bg-slate-50/50",
          )}
        >
          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-semibold text-console-text truncate">
                {phase.name}
              </h4>
              <Badge
                variant={
                  isCompleted
                    ? "success"
                    : isPending
                      ? "warning"
                      : isActive
                        ? "brand"
                        : "neutral"
                }
              >
                {isCompleted
                  ? "Completed"
                  : isPending
                    ? "Review Needed"
                    : isActive
                      ? "Current Stage"
                      : "Queued"}
              </Badge>
            </div>

            <div className="mt-1 flex items-center gap-2 text-[11px] text-console-muted">
              {phase.completionDate ? (
                <span className="text-success-700 font-medium flex items-center gap-1">
                  <Calendar size={11} /> {formatDate(phase.completionDate)}
                </span>
              ) : isPending ? (
                <span className="text-warning-700 font-medium flex items-center gap-1">
                  <Clock size={11} /> Awaiting manager review
                </span>
              ) : isActive ? (
                <span className="text-brand-700 font-medium">In active construction</span>
              ) : (
                <span>Step {globalIdx + 1} of {totalPhases}</span>
              )}
            </div>
          </div>

          {/* Direct Action Buttons */}
          {!readOnly && onUpdateStatus && (
            <div className="shrink-0">
              {userType === "siteManager" && phase.status === "not started" && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-xs py-1 px-2.5"
                  disabled={updatingPhaseId === phase.id}
                  onClick={() => handleStatusClick(phase.id, "pending")}
                >
                  Request
                </Button>
              )}

              {userType === "admin" && phase.status === "pending" && (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="primary"
                    className="text-xs py-1 px-2.5 bg-success-600 hover:bg-success-700"
                    disabled={updatingPhaseId === phase.id}
                    onClick={() => handleStatusClick(phase.id, "completed")}
                  >
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs py-1 px-2 text-danger-600 hover:bg-danger-50"
                    disabled={updatingPhaseId === phase.id}
                    onClick={() => handleStatusClick(phase.id, "not started")}
                  >
                    Reject
                  </Button>
                </div>
              )}

              {userType === "admin" && phase.status === "not started" && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-xs py-1 px-2.5"
                  disabled={updatingPhaseId === phase.id}
                  onClick={() => handleStatusClick(phase.id, "completed")}
                >
                  Complete
                </Button>
              )}

              {userType === "admin" && phase.status === "completed" && (
                <button
                  type="button"
                  className="text-[11px] text-console-muted hover:text-danger-600 font-medium transition-colors"
                  onClick={() => handleStatusClick(phase.id, "not started")}
                  title="Revert phase to not started"
                >
                  Revert
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "rounded-console border border-console-border bg-white shadow-xs",
        className,
      )}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-console-border p-4 sm:p-6 bg-white">
        <div>
          <h2 className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-base font-semibold text-console-text">
            <Eye size={20} className="text-brand-600 shrink-0" />
            <span>{title}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-800 border border-brand-100">
              <span>{completedCount}/{totalPhases} Completed</span>
              <span className="text-brand-500">•</span>
              <span>{progressPercentage}%</span>
            </span>
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-console-muted">
            {subtitle}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-console-border bg-console-bg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === "timeline"
                  ? "bg-white text-brand-700 font-semibold shadow-xs"
                  : "text-console-muted hover:text-console-text",
              )}
            >
              <Layers size={13} />
              <span>Milestones</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("gantt")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === "gantt"
                  ? "bg-white text-brand-700 font-semibold shadow-xs"
                  : "text-console-muted hover:text-console-text",
              )}
            >
              <BarChart3 size={13} />
              <span>Gantt View</span>
            </button>
          </div>

          {!readOnly && userType === "admin" && onResetPhases && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onResetPhases}
              className="text-xs text-danger-600 hover:text-danger-700 hover:bg-danger-50 hover:border-danger-200"
              title="Reset all phases to default"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* VIEW 1: CONNECTED MILESTONE PIPELINE TRACKS */}
      {viewMode === "timeline" && (
        <div className="p-3.5 sm:p-6">
          {/* Chronological Process Pipeline Tracks (Balanced 2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {/* Column 1: Phases 1 to Mid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1 pb-1 border-b border-console-border/40 text-xs font-semibold text-console-muted">
                <span>Phase 1 — {firstHalfPhases.length}</span>
                <span className="text-[11px] font-normal text-slate-400">Civil &amp; Structural</span>
              </div>
              <div className="relative">
                {firstHalfPhases.map((phase, colIdx) => {
                  const globalIdx = colIdx;
                  return renderPipelineCard(phase, globalIdx, colIdx === firstHalfPhases.length - 1);
                })}
              </div>
            </div>

            {/* Column 2: Phases Mid+1 to End */}
            {secondHalfPhases.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1 pb-1 border-b border-console-border/40 text-xs font-semibold text-console-muted">
                  <span>Phase {firstHalfPhases.length + 1} — {phases.length}</span>
                  <span className="text-[11px] font-normal text-slate-400">MEP &amp; Finishing</span>
                </div>
                <div className="relative">
                  {secondHalfPhases.map((phase, colIdx) => {
                    const globalIdx = firstHalfPhases.length + colIdx;
                    return renderPipelineCard(phase, globalIdx, colIdx === secondHalfPhases.length - 1);
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: COMPACT GANTT SCHEDULE VIEW */}
      {viewMode === "gantt" && (
        <div className="p-3.5 sm:p-6">
          <div className="overflow-hidden rounded-lg border border-console-border">
            {/* Legend strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-console-border bg-slate-50 px-3 sm:px-4 py-2 text-xs text-console-muted">
              <span className="font-medium text-console-text">
                Horizon: {formatDate(ganttStartDate.toISOString())} – {formatDate(ganttEndDate.toISOString())}
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-xs bg-success-600" /> Done
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-xs bg-warning-500" /> Review
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-xs bg-slate-300" /> Planned
                </span>
              </div>
            </div>

            <div className="max-h-[320px] overflow-y-auto overflow-x-auto no-scrollbar">
              <div className="min-w-[620px] p-3">
                {/* Timeline Header Axis */}
                <div className="grid grid-cols-[200px_1fr] items-center border-b border-console-border pb-2 text-xs font-semibold text-console-muted">
                  <div>Phase</div>
                  <div className="relative h-4 flex items-center justify-between text-[11px] text-console-muted px-1">
                    {timeMarkers.map((marker, idx) => (
                      <span
                        key={idx}
                        className="absolute transform -translate-x-1/2 whitespace-nowrap"
                        style={{ left: `${marker.percent}%` }}
                      >
                        {marker.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rows */}
                <div className="relative divide-y divide-console-border/40">
                  {/* Today line */}
                  <div
                    className="pointer-events-none absolute bottom-0 top-0 z-10 w-px border-l border-dashed border-danger-500"
                    style={{ left: `calc(200px + (100% - 200px) * ${todayPercent / 100})` }}
                  >
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded bg-danger-600 px-1 py-0.2 text-[8px] font-bold text-white">
                      Today
                    </span>
                  </div>

                  {ganttBars.map((bar) => (
                    <div
                      key={bar.phase.id}
                      className="grid grid-cols-[200px_1fr] items-center py-2 hover:bg-slate-50/70"
                    >
                      <div className="pr-3 truncate">
                        <Tooltip label={bar.phase.name}>
                          <span className="text-xs font-medium text-console-text truncate block cursor-default">
                            {bar.index + 1}. {bar.phase.name}
                          </span>
                        </Tooltip>
                      </div>

                      <div className="relative h-6 w-full flex items-center px-1">
                        <div
                          className={cn(
                            "relative z-0 flex h-5 items-center justify-between rounded px-1.5 text-[10px] font-semibold transition-all shadow-2xs",
                            bar.isCompleted
                              ? "bg-success-600 text-white"
                              : bar.isPending
                                ? "bg-warning-500 text-white"
                                : "bg-slate-200 text-slate-700",
                          )}
                          style={{
                            left: `${bar.leftPercent}%`,
                            width: `${Math.max(bar.widthPercent, 3.5)}%`,
                          }}
                        >
                          <span className="truncate">
                            {bar.isCompleted && bar.phase.completionDate
                              ? formatDate(bar.phase.completionDate)
                              : `${bar.durationDays}d`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteProgressTimeline;
