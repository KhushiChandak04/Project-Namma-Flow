import FlowCanvas from "../common/FlowCanvas.jsx";

/**
 * Owner: Janhavi
 * Current version: skeleton only.
 * Replace/expand the layout without changing the mode contract in App.jsx.
 */
export default function AppShell({
  mode = "grid",
  theme = "light",
  toggle,
  children,
}) {
  return (
    <div
      className={`app-shell min-h-screen bg-cream text-ink ${theme === "dark" ? "theme-dark" : "theme-light"} ${mode === "compass" ? "compass-mode" : "grid-mode"}`}
    >
      <FlowCanvas mode={mode} />
      <header className="border-b-2 border-ink bg-cream/95">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-5 sm:px-8 lg:px-10">
          <div className="animate-rise">
            <div className="flex items-center gap-3">
              <span className="brand-mark" aria-hidden="true">
                N
              </span>
              <div>
                <h1 className="font-brand text-2xl font-black tracking-tight sm:text-3xl">
                  Namma Flow
                </h1>
                <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-muted">
                  Bangalore, in motion
                </p>
              </div>
            </div>
          </div>
          {toggle}
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 lg:px-10 lg:py-12 flex-grow">
        {children}
      </main>
      <footer className="border-t-2 border-ink bg-cream/95 py-4 text-center">
        <p className="text-xs font-bold text-muted">
          Data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline hover:text-ink">OpenStreetMap contributors</a>
        </p>
      </footer>
    </div>
  );
}
