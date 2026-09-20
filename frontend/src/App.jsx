import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const navigate = useNavigate();
  
  const [theme, setTheme] = useState(
    () => window.localStorage.getItem("namma-flow-theme") || "light",
  );

  useEffect(() => {
    if (location.pathname === "/" && mode !== MODES.GRID) {
      setMode(MODES.GRID);
    }
  }, [location.pathname]);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === MODES.GRID) {
      navigate("/", { replace: true });
    }
  };

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
          <ModeSwitch mode={mode} onChange={handleModeChange} />
        </div>
      }
    >
      {mode === MODES.GRID ? <GridPage /> : <CompassPage />}
    </AppShell>
  );
}
