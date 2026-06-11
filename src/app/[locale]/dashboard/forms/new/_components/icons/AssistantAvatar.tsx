import { SparkleIcon } from "@/components/icons/SparkleIcon";

export function AssistantAvatar() {
  return (
    <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white flex items-center justify-center shadow-[0_6px_16px_-6px_color-mix(in_srgb,var(--foreground)_14%,transparent)] ring-1 ring-white/10">
      <SparkleIcon className="w-4 h-4" />
    </div>
  );
}
