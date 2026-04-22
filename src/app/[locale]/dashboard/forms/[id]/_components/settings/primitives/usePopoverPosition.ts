"use client";

import { useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";

type Options = {
  estimatedHeight?: number;
  /** When true, popover `width` matches trigger. When false, uses `minWidth` + `width: max-content`. */
  matchTriggerWidth?: boolean;
  /** Used with `matchTriggerWidth: false` — calendar row needs at least this width. */
  minOuterWidth?: number;
  /** Used to clamp horizontal position when width is `max-content` (approximate outer width). */
  horizontalAnchorWidth?: number;
};

export function usePopoverPosition(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  options: Options = {},
): CSSProperties | null {
  const {
    estimatedHeight = 320,
    matchTriggerWidth = true,
    minOuterWidth = 280,
    horizontalAnchorWidth,
  } = options;
  const [style, setStyle] = useState<CSSProperties | null>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setStyle(null);
      return;
    }

    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const pad = 8;
      const clampW =
        horizontalAnchorWidth ??
        (matchTriggerWidth ? r.width : Math.max(r.width, minOuterWidth));

      let left = r.left;
      if (left + clampW > window.innerWidth - pad) {
        left = window.innerWidth - clampW - pad;
      }
      if (left < pad) left = pad;

      let top = r.bottom + 6;
      if (top + estimatedHeight > window.innerHeight - pad) {
        top = r.top - estimatedHeight - 6;
      }
      if (top < pad) top = pad;

      const base: CSSProperties = {
        position: "fixed",
        top,
        left,
        zIndex: 10000,
      };

      if (matchTriggerWidth) {
        setStyle({ ...base, width: r.width });
      } else {
        setStyle({
          ...base,
          minWidth: Math.max(r.width, minOuterWidth),
          width: "max-content",
        });
      }
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [
    open,
    estimatedHeight,
    matchTriggerWidth,
    minOuterWidth,
    horizontalAnchorWidth,
    triggerRef,
  ]);

  return style;
}
