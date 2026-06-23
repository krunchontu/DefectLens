import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { NotificationProvider } from "./NotificationContext";
import DashboardPage from "./pages/DashboardPage";
import DefectDetailPage from "./pages/DefectDetailPage";
import DefectListPage from "./pages/DefectListPage";
import CreateDefectPage from "./pages/CreateDefectPage";
import ReleasePackPage from "./pages/ReleasePackPage";

export default function App() {
  return (
    <NotificationProvider>
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
            <NavLink to="/release-pack">Release Pack</NavLink>
          </nav>
        </header>
        <main className="page">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/defects" element={<DefectListPage />} />
            <Route path="/defects/new" element={<CreateDefectPage />} />
            <Route path="/defects/:id" element={<DefectDetailPage />} />
            <Route path="/release-pack" element={<ReleasePackPage />} />
          </Routes>
        </main>
      </div>
    </NotificationProvider>
  );
}
