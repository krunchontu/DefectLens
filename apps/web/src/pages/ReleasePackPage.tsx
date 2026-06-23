import { useEffect, useState } from "react";
import { api } from "../api";
import type { ReleasePack } from "../types";

export default function ReleasePackPage() {
  const [pack, setPack] = useState<ReleasePack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getReleasePack()
      .then(setPack)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="state-card">Loading release pack...</div>;
  }

  if (error) {
    return <div className="state-card error">Release pack could not load: {error}</div>;
  }

  if (!pack) {
    return <div className="state-card">No data available.</div>;
  }

  const hasDefects = pack.defects.length > 0;

  return (
    <section className="stack release-pack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">CAB Export</p>
          <h2>Release Readiness Pack</h2>
        </div>
        <button className="primary-button print-hide" onClick={() => window.print()}>
          Print / Export
        </button>
      </div>

      <p className="release-pack-generated">
        Generated: {new Date(pack.generatedAt).toLocaleString()}
      </p>

      <div className="metric-grid release-pack-metrics">
        <article className="metric-card">
          <span>Total Defects</span>
          <strong>{pack.summary.totalDefects}</strong>
        </article>
        <article className="metric-card">
          <span>Open Defects</span>
          <strong>{pack.summary.openDefects}</strong>
        </article>
        <article className="metric-card">
          <span>Qualifying (High/Critical Risk)</span>
          <strong>{pack.summary.qualifyingDefects}</strong>
        </article>
        <article className="metric-card accent">
          <span>Analysis Coverage</span>
          <strong>{pack.summary.analysisCoverage.percent}%</strong>
          <small>
            {pack.summary.analysisCoverage.analysed}/{pack.summary.analysisCoverage.total} analysed
          </small>
        </article>
      </div>

      {pack.summary.riskDistribution.length > 0 && (
        <section className="panel">
          <h3>Risk Distribution</h3>
          <div className="bar-list">
            {pack.summary.riskDistribution.map((item) => (
              <div className="bar-row" key={item.risk}>
                <div className="bar-label">
                  <span>{item.risk}</span>
                  <strong>{item.count}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!hasDefects ? (
        <div className="state-card">
          No qualifying defects. All open defects have Low or Medium release risk, or there are no open defects.
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Module</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Root Cause</th>
                <th>Release Risk</th>
                <th>Prevention</th>
                <th>CAB Summary</th>
                <th>Rollback</th>
              </tr>
            </thead>
            <tbody>
              {pack.defects.map((defect) => (
                <tr key={defect.id}>
                  <td>{defect.title}</td>
                  <td>{defect.module}</td>
                  <td>
                    <span className={`badge severity-${defect.severity.toLowerCase()}`}>
                      {defect.severity}
                    </span>
                  </td>
                  <td>
                    <span className="badge neutral">{defect.status}</span>
                  </td>
                  <td>{defect.rootCauseCategory ?? "—"}</td>
                  <td>
                    <span className={`badge severity-${(defect.releaseRisk ?? "").toLowerCase()}`}>
                      {defect.releaseRisk ?? "—"}
                    </span>
                  </td>
                  <td>
                    {defect.preventionProgress.completed}/{defect.preventionProgress.total}
                  </td>
                  <td>{defect.cabSummary ?? "—"}</td>
                  <td>{defect.rollbackConsideration ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
