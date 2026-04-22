import Image from "next/image";

type Props = {
  avatarUrl: string | null;
  initials: string;
};

export function UserAvatar({ avatarUrl, initials }: Props) {
  return (
    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--card)] flex items-center justify-center">
      {avatarUrl ? (
        <Image src={avatarUrl} alt="" fill className="object-cover" unoptimized />
      ) : (
        <span className="text-[11px] font-semibold text-[var(--foreground)]">
          {initials || "You"}
        </span>
      )}
    </div>
  );
}
