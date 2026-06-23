import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { DefectListQuery, DefectSummary, Environment, Severity, Status } from "../types";

const statuses: Array<"" | Status> = ["", "Open", "In Analysis", "Prevention Planned", "Closed"];
const severities: Array<"" | Severity> = ["", "Low", "Medium", "High", "Critical"];
const environments: Array<"" | Environment> = ["", "DEV", "SIT", "UAT", "Staging", "Production"];

export default function DefectListPage() {
  const navigate = useNavigate();

  const [defects, setDefects] = useState<DefectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter state
  const [status, setStatus] = useState<"" | Status>("");
  const [severity, setSeverity] = useState<"" | Severity>("");
  const [environment, setEnvironment] = useState<"" | Environment>("");
  const [module, setModule] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const pageSize = 20;

  const load = useCallback(() => {
    setLoading(true);
    setError(null);

    const params: DefectListQuery = { page, pageSize };
    if (status) params.status = status;
    if (severity) params.severity = severity;
    if (environment) params.environment = environment;
    if (module.trim()) params.module = module.trim();
    if (query.trim()) params.q = query.trim();

    api
      .listDefects(params)
      .then((res) => {
        setDefects(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [status, severity, environment, module, query, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to page 1 when filters change
  const updateFilter = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const clearAll = () => {
    setStatus("");
    setSeverity("");
    setEnvironment("");
    setModule("");
    setQuery("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(status || severity || environment || module.trim() || query.trim());

  if (error) {
    return <div className="state-card error">Defects could not load: {error}</div>;
  }

  return (
    <section className="stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Triage queue</p>
          <h2>Defects {!loading && <small>({total})</small>}</h2>
        </div>
        <button className="primary-button" onClick={() => navigate("/defects/new")}>
          Create Defect
        </button>
      </div>

      <div className="filters">
        <label>
          Search
          <input
            value={query}
            onChange={(e) => updateFilter(setQuery)(e.target.value)}
            placeholder="Title, module, or case ID"
          />
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => updateFilter(setStatus)(e.target.value as "" | Status)}>
            <option value="">All</option>
            {statuses.filter(Boolean).map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Severity
          <select value={severity} onChange={(e) => updateFilter(setSeverity)(e.target.value as "" | Severity)}>
            <option value="">All</option>
            {severities.filter(Boolean).map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Environment
          <select value={environment} onChange={(e) => updateFilter(setEnvironment)(e.target.value as "" | Environment)}>
            <option value="">All</option>
            {environments.filter(Boolean).map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Module
          <input
            value={module}
            onChange={(e) => updateFilter(setModule)(e.target.value)}
            placeholder="Filter by module"
          />
        </label>
        {hasActiveFilters && (
          <button className="secondary-button" onClick={clearAll}>
            Clear all
          </button>
        )}
      </div>

      {loading ? (
        <div className="state-card">Loading defects...</div>
      ) : defects.length === 0 ? (
        <div className="state-card">No defects match the current filters.</div>
      ) : (
        <>
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
                {defects.map((defect) => (
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

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Defect list pagination">
              <button
                className="secondary-button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                className="secondary-button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
