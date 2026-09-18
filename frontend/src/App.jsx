import { useState } from "react";
import AppShell from "./components/layout/AppShell.jsx";
import ModeSwitch from "./components/common/ModeSwitch.jsx";
import ThemeToggle from "./components/common/ThemeToggle.jsx";
import GridPage from "./pages/GridPage.jsx";
import CompassPage from "./pages/CompassPage.jsx";

const MODES = {
  GRID: "grid",
  COMPASS: "compass",
};

export default function App() {
  const [mode, setMode] = useState(MODES.GRID);
  const [theme, setTheme] = useState(
    () => window.localStorage.getItem("namma-flow-theme") || "light",
  );

  function changeTheme(nextTheme) {
    setTheme(nextTheme);
    window.localStorage.setItem("namma-flow-theme", nextTheme);
  }

  return (
    <AppShell
      mode={mode}
      theme={theme}
      toggle={
        <div className="flex items-center gap-3">
          <ThemeToggle theme={theme} onChange={changeTheme} />
          <ModeSwitch mode={mode} onChange={setMode} />
        </div>
      }
    >
      {mode === MODES.GRID ? <GridPage /> : <CompassPage />}
    </AppShell>
  );
}
