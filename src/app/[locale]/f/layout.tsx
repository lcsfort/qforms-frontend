// The public form routes render AI-generated RenderKit documents with the
// default component pack. Import its stylesheet here (a server-component segment
// layout) so it loads only on /f/* form pages, not across the dashboard.
import "@renderkit/ui-default/styles.css";

export default function PublicFormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
