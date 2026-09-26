"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-5xl font-bold text-rose-400/40">!</p>
      <h1 className="mt-4 font-serif text-xl font-bold text-white">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-sm text-white/50">{error.message}</p>
      <button
        onClick={reset}
        className="mt-6 rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-white/80 transition-all hover:bg-white/10 hover:text-white"
      >
        Try again
      </button>
    </main>
  );
}
