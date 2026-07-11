export function FullScreenLoader() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-surface-dark">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        <p className="text-sm text-gray-400">Loading ChatiHive…</p>
      </div>
    </div>
  );
}
