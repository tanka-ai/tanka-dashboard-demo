import { cn } from "@/lib/utils";

const toneClasses = {
  neutral: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  accent: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  danger: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
} as const;

export function Badge({
  className,
  tone = "neutral",
  children,
}: {
  className?: string;
  tone?: keyof typeof toneClasses;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
