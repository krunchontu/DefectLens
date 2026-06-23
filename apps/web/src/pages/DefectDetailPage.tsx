import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useNotify } from "../NotificationContext";
import type { Defect, DefectEvent, Status } from "../types";

function InfoBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="info-block">
      <span>{label}</span>
      <p>{children || "Not provided"}</p>
    </div>
  );
}

export default function DefectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useNotify();
  const [defect, setDefect] = useState<Defect | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [events, setEvents] = useState<DefectEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const load = () => {
    if (!id) {
      return;
    }
    setLoading(true);
    api
      .getDefect(id)
      .then((d) => {
        setDefect(d);
        loadEvents();
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const loadEvents = () => {
    if (!id) return;
    setEventsLoading(true);
    api
      .getDefectEvents(id)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setEventsLoading(false));
  };

  useEffect(load, [id]);

  const analyze = async () => {
    if (!id) {
      return;
    }
    setActionLoading("analysis");
    try {
      setDefect(await api.analyzeDefect(id));
      notify("success", "AI analysis generated successfully");
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setActionLoading(null);
    }
  };

  const updateStatus = async (status: Status) => {
    if (!id) {
      return;
    }
    setActionLoading("status");
    try {
      setDefect(await api.updateDefect(id, { status }));
      notify("success", `Defect status changed to ${status}`);
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Status update failed");
    } finally {
      setActionLoading(null);
    }
  };

  const remove = async () => {
    if (!id || !window.confirm("Delete this defect? This cannot be undone.")) {
      return;
    }
    setActionLoading("delete");
    try {
      await api.deleteDefect(id);
      notify("success", "Defect deleted");
      navigate("/defects");
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Delete failed");
      setActionLoading(null);
    }
  };

  const copyCabSummary = async () => {
    if (!defect?.cabSummary) {
      return;
    }
    await navigator.clipboard.writeText(defect.cabSummary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const togglePrevention = async (action: string, done: boolean) => {
    if (!id || !defect) {
      return;
    }
    // Optimistic update
    setDefect({
      ...defect,
      preventionProgress: {
        ...defect.preventionProgress,
        [action]: { done, updatedAt: new Date().toISOString() }
      },
      preventionSummary: {
        ...defect.preventionSummary,
        completed: defect.preventionSummary.completed + (done ? 1 : -1)
      }
    });
    try {
      const updated = await api.togglePrevention(id, action, done);
      setDefect(updated);
    } catch {
      notify("error", "Failed to update prevention progress");
      // Revert on failure by reloading
      load();
    }
  };

  if (loading) {
    return <div className="state-card">Loading defect...</div>;
  }

  if (error) {
    return <div className="state-card error">Defect could not load: {error}</div>;
  }

  if (!defect) {
    return <div className="state-card">Defect not found.</div>;
  }

  const analysed = Boolean(defect.rootCauseCategory);

  return (
    <section className="stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Defect {defect.id.slice(-6).toUpperCase()}</p>
          <h2>{defect.title}</h2>
        </div>
        <div className="button-row">
          <button
            className="secondary-button"
            disabled={actionLoading === "status"}
            onClick={() => updateStatus(defect.status === "Closed" ? "Open" : "Closed")}
          >
            {defect.status === "Closed" ? "Reopen" : "Close"}
          </button>
          <button className="danger-button" disabled={actionLoading === "delete"} onClick={remove}>
            Delete
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <section className="panel">
          <div className="panel-title-row">
            <h3>Original Defect</h3>
            <span className="badge neutral">{defect.status}</span>
          </div>
          <div className="meta-grid">
            <InfoBlock label="Module">{defect.module}</InfoBlock>
            <InfoBlock label="Environment">{defect.environment}</InfoBlock>
            <InfoBlock label="Severity">
              <span className={`badge severity-${defect.severity.toLowerCase()}`}>{defect.severity}</span>
            </InfoBlock>
            <InfoBlock label="Affected Case IDs">{defect.affectedCaseIds}</InfoBlock>
          </div>
          <InfoBlock label="Expected Result">{defect.expectedResult}</InfoBlock>
          <InfoBlock label="Actual Result">{defect.actualResult}</InfoBlock>
          <InfoBlock label="Steps to Reproduce">{defect.stepsToReproduce}</InfoBlock>
          <InfoBlock label="Notes">{defect.notes}</InfoBlock>
          <div className="meta-grid">
            <InfoBlock label="Created">{new Date(defect.createdAt).toLocaleString()}</InfoBlock>
            <InfoBlock label="Updated">{new Date(defect.updatedAt).toLocaleString()}</InfoBlock>
          </div>
        </section>

        <section className="panel analysis-panel">
          <div className="panel-title-row">
            <h3>AI Analysis</h3>
            <button className="primary-button" disabled={actionLoading === "analysis"} onClick={analyze}>
              {analysed ? "Regenerate" : "Generate AI Analysis"}
            </button>
          </div>

          {actionLoading === "analysis" ? (
            <div className="analysis-loading">
              <span className="spinner" />
              <p>Analysing defect...</p>
            </div>
          ) : !analysed ? (
            <div className="state-card compact">Not yet analysed.</div>
          ) : (
            <div className="analysis-stack">
              <section>
                <h4>Root Cause</h4>
                <span className="badge root">{defect.rootCauseCategory}</span>
                <p>{defect.rootCauseExplanation}</p>
              </section>

              <section>
                <h4>Similar Risk Areas</h4>
                <ul>
                  {defect.similarRiskAreas.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h4>Missing UAT Scenarios</h4>
                <div className="scenario-list">
                  {defect.uatScenarios.map((scenario) => (
                    <article className="scenario-card" key={scenario.id}>
                      <strong>
                        {scenario.id}: {scenario.scenario}
                      </strong>
                      <p>
                        <b>Given</b> {scenario.given}
                      </p>
                      <p>
                        <b>When</b> {scenario.when}
                      </p>
                      <p>
                        <b>Then</b> {scenario.then}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <section>
                <div className="panel-title-row compact-row">
                  <h4>Prevention Checklist</h4>
                  <span className="badge neutral">
                    {defect.preventionSummary.completed}/{defect.preventionSummary.total} complete
                  </span>
                </div>
                <div className="checklist">
                  {defect.preventionActions.map((item) => (
                    <label key={item}>
                      <input
                        type="checkbox"
                        checked={defect.preventionProgress[item]?.done ?? false}
                        onChange={(e) => togglePrevention(item, e.target.checked)}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <div className="panel-title-row compact-row">
                  <h4>CAB Summary</h4>
                  <button className="secondary-button" onClick={copyCabSummary}>
                    {copied ? "Copied" : "Copy CAB Summary"}
                  </button>
                </div>
                <p>{defect.cabSummary}</p>
              </section>

              <section>
                <h4>Release Risk</h4>
                <span className={`badge severity-${defect.releaseRisk?.toLowerCase() ?? "medium"}`}>{defect.releaseRisk}</span>
              </section>

              <section>
                <h4>Rollback Consideration</h4>
                <p>{defect.rollbackConsideration}</p>
              </section>
            </div>
          )}
        </section>
      </div>

      <section className="panel timeline-panel">
        <h3>Audit Timeline</h3>
        {eventsLoading ? (
          <p className="empty-inline">Loading events...</p>
        ) : events.length === 0 ? (
          <p className="empty-inline">No events recorded yet.</p>
        ) : (
          <ol className="timeline">
            {events.map((event) => (
              <li key={event.id} className="timeline-item">
                <span className={`timeline-icon timeline-icon--${event.type.toLowerCase()}`} aria-hidden="true" />
                <div className="timeline-content">
                  <p className="timeline-summary">{event.summary}</p>
                  <time className="timeline-date" dateTime={event.createdAt}>
                    {new Date(event.createdAt).toLocaleString()}
                  </time>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </section>
  );
}
