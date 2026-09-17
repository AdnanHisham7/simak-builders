import React, { useRef, useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Document as SiteDocument, signDocument } from "@/services/siteService";
import { PenTool, Type, RotateCcw, CheckCircle2, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface SignDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  document: SiteDocument | null;
  defaultSignerName?: string;
  defaultSignerRole?: string;
  onSigned: () => void;
}

export const SignDocumentModal: React.FC<SignDocumentModalProps> = ({
  isOpen,
  onClose,
  siteId,
  document,
  defaultSignerName = "",
  defaultSignerRole = "client",
  onSigned,
}) => {
  const [signMode, setSignMode] = useState<"draw" | "type">("draw");
  const [signerName, setSignerName] = useState(defaultSignerName);
  const [signerRole, setSignerRole] = useState(defaultSignerRole);
  const [typedSignature, setTypedSignature] = useState(defaultSignerName);
  const [comments, setComments] = useState("");
  const [completePhase, setCompletePhase] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const hasDrawnRef = useRef(false);

  useEffect(() => {
    if (defaultSignerName) {
      setSignerName(defaultSignerName);
      setTypedSignature(defaultSignerName);
    }
    if (defaultSignerRole) {
      setSignerRole(defaultSignerRole);
    }
  }, [defaultSignerName, defaultSignerRole]);

  // Clear or initialize canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
  };

  useEffect(() => {
    if (isOpen && signMode === "draw") {
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          canvas.width = rect.width * 2;
          canvas.height = rect.height * 2;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.scale(2, 2);
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.strokeStyle = "#0f172a";
            ctx.lineWidth = 2.5;
          }
        }
      }, 100);
    }
  }, [isOpen, signMode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    isDrawingRef.current = true;
    hasDrawnRef.current = true;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const generateTypedSignatureDataUrl = (text: string): string => {
    const offscreen = window.document.createElement("canvas");
    offscreen.width = 600;
    offscreen.height = 180;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return "";

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);

    ctx.font = "italic bold 42px 'Brush Script MT', 'Dancing Script', 'Caveat', cursive, sans-serif";
    ctx.fillStyle = "#1e293b";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, offscreen.width / 2, offscreen.height / 2);

    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 140);
    ctx.lineTo(550, 140);
    ctx.stroke();

    return offscreen.toDataURL("image/png");
  };

  const handleSignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document) return;

    if (!signerName.trim()) {
      toast.error("Please enter the signer's full name");
      return;
    }

    if (!agreedToTerms) {
      toast.error("Please acknowledge the legal e-signature declaration");
      return;
    }

    let signatureDataUrl = "";
    if (signMode === "draw") {
      if (!hasDrawnRef.current || !canvasRef.current) {
        toast.error("Please draw your signature in the pad provided");
        return;
      }
      signatureDataUrl = canvasRef.current.toDataURL("image/png");
    } else {
      if (!typedSignature.trim()) {
        toast.error("Please type your signature text");
        return;
      }
      signatureDataUrl = generateTypedSignatureDataUrl(typedSignature.trim());
    }

    try {
      setIsSubmitting(true);
      const docId = document.id || document._id;
      if (!docId) throw new Error("Missing document ID");

      await signDocument(siteId, docId, {
        signerName: signerName.trim(),
        signerRole: signerRole.trim(),
        signatureDataUrl,
        comments: comments.trim(),
        completePhase: Boolean(document.phaseId && completePhase),
      });

      toast.success("Document signed and approved successfully!");
      onSigned();
      onClose();
    } catch (err: any) {
      console.error("Signature submission failed:", err);
      toast.error(err.response?.data?.message || "Failed to submit signature.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!document) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Electronic Document Sign-Off"
      description="Provide an electronic signature to approve this document"
      size="lg"
    >
      <form onSubmit={handleSignSubmit} className="space-y-5">
        {/* Document Info Banner */}
        <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-sm text-slate-900 truncate">
                {document.name}
              </span>
              <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                v{document.version || 1}
              </span>
            </div>
            {document.phaseName && (
              <p className="mt-1 text-xs text-brand-700 font-medium">
                Linked to Phase: <span className="font-semibold">{document.phaseName}</span>
              </p>
            )}
            <p className="mt-0.5 text-xs text-slate-500">
              Uploaded: {new Date(document.uploadDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Signer Details Inputs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Signer Full Name *
            </label>
            <input
              type="text"
              required
              value={signerName}
              onChange={(e) => {
                setSignerName(e.target.value);
                if (signMode === "type" && !typedSignature) {
                  setTypedSignature(e.target.value);
                }
              }}
              placeholder="e.g. John Doe"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Signer Role / Title
            </label>
            <input
              type="text"
              value={signerRole}
              onChange={(e) => setSignerRole(e.target.value)}
              placeholder="e.g. Client, Project Director"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Signature Mode Toggle */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-700">Signature Method</label>
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setSignMode("draw")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  signMode === "draw"
                    ? "bg-white text-brand-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <PenTool size={13} />
                Draw
              </button>
              <button
                type="button"
                onClick={() => setSignMode("type")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  signMode === "type"
                    ? "bg-white text-brand-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Type size={13} />
                Type
              </button>
            </div>
          </div>

          {signMode === "draw" ? (
            <div className="space-y-1.5">
              <div className="relative rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-1">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="h-36 w-full touch-none cursor-crosshair rounded-lg bg-white"
                />
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 shadow-xs hover:bg-slate-200 transition-colors"
                >
                  <RotateCcw size={12} />
                  Clear
                </button>
              </div>
              <p className="text-[11px] text-slate-500 text-center">
                Use your mouse, trackpad, or finger to draw your signature above
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                placeholder="Type your name to generate signature"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <div className="flex h-24 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-center">
                <span className="font-serif italic text-2xl text-slate-800">
                  {typedSignature || "Signature Preview"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Phase completion option if linked to a phase */}
        {document.phaseId && (
          <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={completePhase}
                onChange={(e) => setCompletePhase(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-xs text-brand-900 leading-relaxed">
                <strong>Sign-off on Phase Completion:</strong> Automatically update the status of{" "}
                <span className="underline decoration-brand-400">{document.phaseName || "linked phase"}</span> to{" "}
                <span className="font-semibold text-emerald-800">"Completed"</span> upon signature.
              </span>
            </label>
          </div>
        )}

        {/* Remarks / Comments */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Sign-off Remarks or Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="e.g. Approved following site inspection on..."
            className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Consent Checkbox */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-xs text-slate-600 leading-relaxed">
              I understand that applying this electronic signature constitutes a formal, legally binding acceptance and sign-off on this document and any associated project milestones.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !agreedToTerms}>
            {isSubmitting ? "Signing..." : "Sign & Approve"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SignDocumentModal;
