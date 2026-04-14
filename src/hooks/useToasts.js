import { toast as sonner } from "sonner";

export function useToasts() {
  return {
    add: (msg, type = "info") => {
      if (type === "success") sonner.success(msg);
      else if (type === "error") sonner.error(msg);
      else if (type === "warn") sonner.warning(msg);
      else sonner(msg);
    },
    toasts: [],
    rm: () => {},
  };
}
