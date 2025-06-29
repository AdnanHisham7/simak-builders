import { Toaster } from "sonner";

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      richColors
      duration={4000}
    />
  );
}
