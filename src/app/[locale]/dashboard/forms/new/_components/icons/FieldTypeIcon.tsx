import type { FieldType } from "@/lib/types";

type Props = {
  type: FieldType;
  className?: string;
};

export function FieldTypeIcon({ type, className = "w-3.5 h-3.5" }: Props) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    strokeWidth: 1.8,
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (type) {
    case "text":
      return (
        <svg {...common}>
          <path d="M4 7h16M6 7v10m12-10v10M9 17h6" />
        </svg>
      );
    case "textarea":
      return (
        <svg {...common}>
          <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
          <path d="M7 10h10M7 14h6" />
        </svg>
      );
    case "email":
      return (
        <svg {...common}>
          <rect x="3" y="5.5" width="18" height="13" rx="2" />
          <path d="m4 7 8 6 8-6" />
        </svg>
      );
    case "number":
      return (
        <svg {...common}>
          <path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16" />
        </svg>
      );
    case "select":
      return (
        <svg {...common}>
          <rect x="3.5" y="6" width="17" height="12" rx="2" />
          <path d="m9 11 3 3 3-3" />
        </svg>
      );
    case "radio":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      );
    case "checkbox":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="m8 12 3 3 5-6" />
        </svg>
      );
    case "date":
      return (
        <svg {...common}>
          <rect x="3.5" y="5.5" width="17" height="14" rx="2" />
          <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
        </svg>
      );
    case "file":
      return (
        <svg {...common}>
          <path d="M14 3.5H7a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5L14 3.5Z" />
          <path d="M14 3.5V9h5" />
        </svg>
      );
    case "rating":
      return (
        <svg {...common}>
          <path d="m12 4 2.4 5 5.6.8-4 3.9.9 5.3L12 16.5 7.1 19l.9-5.3-4-3.9L9.6 9 12 4Z" />
        </svg>
      );
    case "scale":
      return (
        <svg {...common}>
          <path d="M4 10h16M4 14h16M8 7v10M16 7v10" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}
