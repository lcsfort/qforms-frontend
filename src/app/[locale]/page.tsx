import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LandingNav } from "@/components/LandingNav";

export default function Home() {
  const t = useTranslations();

  const features = [
    {
      title: t("features.aiGeneration.title"),
      desc: t("features.aiGeneration.desc"),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
        />
      ),
    },
    {
      title: t("features.smartFields.title"),
      desc: t("features.smartFields.desc"),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
        />
      ),
    },
    {
      title: t("features.shareEmbed.title"),
      desc: t("features.shareEmbed.desc"),
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
        />
      ),
    },
  ];

  const checkIcon = (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  );

  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />

      <main className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            {t("hero.badge")}
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
            {t("hero.titleLine1")}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {" "}
              {t("hero.titleLine2")}
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("hero.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-all hover:shadow-lg hover:shadow-indigo-500/25"
            >
              {t("hero.cta")}
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold px-8 py-3.5 rounded-xl text-base transition-all text-center"
            >
              {t("hero.ctaSecondary")}
            </a>
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
            {[t("hero.freeToStart"), t("hero.noCreditCard"), t("hero.cancelAnytime")].map(
              (label) => (
                <div key={label} className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    {checkIcon}
                  </svg>
                  {label}
                </div>
              )
            )}
          </div>
        </div>
      </main>

      <section
        id="features"
        className="py-24 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800"
      >
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            {t("features.heading")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-xl mx-auto mb-16">
            {t("features.subheading")}
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center mb-5">
                  <svg
                    className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            &copy; {new Date().getFullYear()} QForms. {t("footer.rights")}
          </span>
          <div className="flex gap-6">
            <a
              href="#"
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {t("footer.privacy")}
            </a>
            <a
              href="#"
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {t("footer.terms")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
