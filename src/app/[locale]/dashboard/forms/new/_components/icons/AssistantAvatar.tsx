import { SparkleIcon } from "@/components/icons/SparkleIcon";

export function AssistantAvatar() {
  return (
    <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-[var(--primary)] to-[#6d28d9] text-white flex items-center justify-center shadow-[0_6px_16px_-6px_rgba(124,58,237,0.55)] ring-1 ring-white/10">
      <SparkleIcon className="w-4 h-4" />
    </div>
  );
}
