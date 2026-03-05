import { notFound } from "next/navigation";

/**
 * Catch-all for unknown routes under [locale].
 * Ensures /en/signin/asas etc. render [locale]/not-found.tsx with correct locale and translations.
 */
export default function CatchAllPage() {
  notFound();
}
