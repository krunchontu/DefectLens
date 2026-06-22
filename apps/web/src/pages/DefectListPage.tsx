import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { DefectSummary, Severity, Status } from "../types";

const statuses: Array<"All" | Status> = ["All", "Open", "In Analysis", "Prevention Planned", "Closed"];
const severities: Array<"All" | Severity> = ["All", "Low", "Medium", "High", "Critical"];

export default function DefectListPage() {
  const [defects, setDefects] = useState<DefectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"All" | Status>("All");
  const [severity, setSeverity] = useState<"All" | Severity>("All");
  const [module, setModule] = useState("All");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api
      .listDefects()
      .then(setDefects)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const modules = useMemo(() => ["All", ...Array.from(new Set(defects.map((defect) => defect.module))).sort()], [defects]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return defects.filter((defect) => {
      const matchesStatus = status === "All" || defect.status === status;
      const matchesSeverity = severity === "All" || defect.severity === severity;
      const matchesModule = module === "All" || defect.module === module;
      const matchesSearch =
        !search ||
        defect.title.toLowerCase().includes(search) ||
        defect.affectedCaseIds.toLowerCase().includes(search);
      return matchesStatus && matchesSeverity && matchesModule && matchesSearch;
    });
  }, [defects, module, query, severity, status]);

  if (loading) {
    return <div className="state-card">Loading defects...</div>;
  }

  if (error) {
    return <div className="state-card error">Defects could not load: {error}</div>;
  }

  return (
    <section className="stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Triage queue</p>
          <h2>Defects</h2>
        </div>
        <button className="primary-button" onClick={() => navigate("/defects/new")}>
          Create Defect
        </button>
      </div>

      <div className="filters">
        <label>
          Search
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title or case ID" />
        </label>
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value as "All" | Status)}>
            {statuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Severity
          <select value={severity} onChange={(event) => setSeverity(event.target.value as "All" | Severity)}>
            {severities.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Module
          <select value={module} onChange={(event) => setModule(event.target.value)}>
            {modules.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="state-card">No defects match the current filters.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Module</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Root Cause</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((defect) => (
                <tr key={defect.id} onClick={() => navigate(`/defects/${defect.id}`)}>
                  <td>{defect.id.slice(-6).toUpperCase()}</td>
                  <td>{defect.title}</td>
                  <td>{defect.module}</td>
                  <td>
                    <span className={`badge severity-${defect.severity.toLowerCase()}`}>{defect.severity}</span>
                  </td>
                  <td>
                    <span className="badge neutral">{defect.status}</span>
                  </td>
                  <td>{defect.rootCauseCategory ?? "Not Analysed"}</td>
                  <td>{new Date(defect.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
