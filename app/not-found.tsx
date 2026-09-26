export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-7xl font-bold text-white/10">404</p>
      <h1 className="mt-4 font-serif text-2xl font-bold text-white">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-white/50">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <a
        href="/"
        className="mt-6 rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-white/80 transition-all hover:bg-white/10 hover:text-white"
      >
        ← Back to dashboard
      </a>
    </main>
  );
}
