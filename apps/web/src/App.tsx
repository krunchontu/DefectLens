import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import DefectDetailPage from "./pages/DefectDetailPage";
import DefectListPage from "./pages/DefectListPage";
import CreateDefectPage from "./pages/CreateDefectPage";

export default function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">AI Defect Prevention Tracker</p>
          <h1>DefectLens</h1>
        </div>
        <nav className="nav-links" aria-label="Primary navigation">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/defects">Defects</NavLink>
          <NavLink to="/defects/new">Create Defect</NavLink>
        </nav>
      </header>
      <main className="page">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/defects" element={<DefectListPage />} />
          <Route path="/defects/new" element={<CreateDefectPage />} />
          <Route path="/defects/:id" element={<DefectDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}
