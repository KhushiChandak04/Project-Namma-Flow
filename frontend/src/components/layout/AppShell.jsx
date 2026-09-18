/**
 * Owner: Janhavi
 * Current version: skeleton only.
 * Replace/expand the layout without changing the mode contract in App.jsx.
 */
export default function AppShell({ toggle, children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Namma Flow</h1>
            <p className="text-xs text-slate-400">Active urban load-balancing for Bangalore</p>
          </div>
          {toggle}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}
