export default function DeleteModal({ open, title, deleting, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-red-400 text-xl">delete</span>
          </div>
          <div>
            <h3 className="text-white font-semibold">Delete {title}</h3>
            <p className="text-zinc-400 text-sm mt-0.5">This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} disabled={deleting} className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting} className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
            {deleting && <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
