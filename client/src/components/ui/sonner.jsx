import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[var(--color-base-bg)] group-[.toaster]:text-[var(--color-base-text)] group-[.toaster]:border-[var(--color-base-border)] group-[.toaster]:shadow-xl shadow-primary/5 rounded-[12px] font-medium text-[14px]",
          description: "group-[.toast]:text-[var(--color-base-muted)]",
          actionButton:
            "group-[.toast]:bg-[var(--color-base-primary)] group-[.toast]:text-[var(--color-base-primary-fg)]",
          cancelButton:
            "group-[.toast]:bg-[var(--color-base-hover)] group-[.toast]:text-[var(--color-base-muted)]",
          success: "group-[.toaster]:border-emerald-500/30 group-[.toaster]:text-emerald-500",
          error: "group-[.toaster]:border-red-500/30 group-[.toaster]:text-red-500",
          info: "group-[.toaster]:border-blue-500/30 group-[.toaster]:text-blue-500",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
