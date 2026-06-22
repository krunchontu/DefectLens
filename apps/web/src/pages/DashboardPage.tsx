import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { Dashboard } from "../types";

function BarList({ items, labelKey }: { items: Array<Record<string, string | number>>; labelKey: string }) {
  const max = Math.max(1, ...items.map((item) => Number(item.count)));

  if (items.length === 0) {
    return <p className="empty-inline">No data yet.</p>;
  }

  return (
    <div className="bar-list">
      {items.map((item) => (
        <div className="bar-row" key={String(item[labelKey])}>
          <div className="bar-label">
            <span>{item[labelKey]}</span>
            <strong>{item.count}</strong>
          </div>
          <div className="bar-track" aria-hidden="true">
            <span style={{ width: `${(Number(item.count) / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .dashboard()
      .then(setDashboard)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const status = dashboard?.byStatus ?? [];
    const severity = dashboard?.bySeverity ?? [];
    return {
      open: status.find((item) => item.status === "Open")?.count ?? 0,
      closed: status.find((item) => item.status === "Closed")?.count ?? 0,
      critical: severity.find((item) => item.severity === "Critical")?.count ?? 0
    };
  }, [dashboard]);

  if (loading) {
    return <div className="state-card">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="state-card error">Dashboard could not load: {error}</div>;
  }

  if (!dashboard || dashboard.totalDefects === 0) {
    return <div className="state-card">No defects yet. Create a defect to start the prevention loop.</div>;
  }

  return (
    <section className="stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Release quality view</p>
          <h2>Dashboard</h2>
        </div>
      </div>

      <div className="metric-grid">
        <article className="metric-card">
          <span>Total Defects</span>
          <strong>{dashboard.totalDefects}</strong>
        </article>
        <article className="metric-card">
          <span>Open</span>
          <strong>{counts.open}</strong>
        </article>
        <article className="metric-card">
          <span>Critical</span>
          <strong>{counts.critical}</strong>
        </article>
        <article className="metric-card">
          <span>Closed</span>
          <strong>{counts.closed}</strong>
        </article>
        <article className="metric-card accent">
          <span>Analysis Coverage</span>
          <strong>{dashboard.analysisCoverage.percent}%</strong>
          <small>
            {dashboard.analysisCoverage.analysed}/{dashboard.analysisCoverage.total} analysed
          </small>
        </article>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <h3>Root Cause Mix</h3>
          <BarList items={dashboard.byRootCause} labelKey="category" />
        </section>
        <section className="panel">
          <h3>Severity</h3>
          <BarList items={dashboard.bySeverity} labelKey="severity" />
        </section>
        <section className="panel">
          <h3>High-Risk Modules</h3>
          <BarList items={dashboard.highRiskModules} labelKey="module" />
        </section>
        <section className="panel">
          <h3>Recent Defects</h3>
          <div className="recent-list">
            {dashboard.recentDefects.map((defect) => (
              <button className="recent-item" key={defect.id} onClick={() => navigate(`/defects/${defect.id}`)}>
                <span>{defect.title}</span>
                <span className="badge-row">
                  <span className={`badge severity-${defect.severity.toLowerCase()}`}>{defect.severity}</span>
                  <span className="badge neutral">{defect.status}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
