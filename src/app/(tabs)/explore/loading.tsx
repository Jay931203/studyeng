export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--text-secondary)]/30 border-t-[var(--accent)]" />
    </div>
  )
}
