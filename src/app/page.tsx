import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-indigo-600">Q</span>Forms
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/signin"
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Now in public beta
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
            Build Forms That
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {" "}
              Actually Convert
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Create beautiful, high-converting forms in minutes. Drag-and-drop
            builder, smart analytics, and seamless integrations — no coding
            required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-all hover:shadow-lg hover:shadow-indigo-500/25"
            >
              Start Building for Free
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold px-8 py-3.5 rounded-xl text-base transition-all"
            >
              See How It Works
            </Link>
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Free to start
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              No credit card
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Cancel anytime
            </div>
          </div>
        </div>
      </main>

      {/* Features preview */}
      <section
        id="features"
        className="py-24 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800"
      >
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Everything you need
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-xl mx-auto mb-16">
            Powerful features to help you build, deploy, and optimize your forms.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Drag & Drop Builder",
                desc: "Intuitive builder with 30+ field types. Build complex forms in minutes.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                  />
                ),
              },
              {
                title: "Smart Analytics",
                desc: "Track conversions, drop-off rates, and field-level analytics in real time.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                ),
              },
              {
                title: "Seamless Integrations",
                desc: "Connect to Slack, Zapier, Webhooks, and 100+ tools out of the box.",
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-9.86a4.5 4.5 0 00-6.364 0l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                  />
                ),
              },
            ].map((feature) => (
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

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>&copy; {new Date().getFullYear()} QForms. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
