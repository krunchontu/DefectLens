import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiClientError } from "../api";
import type { DefectInput, Environment, Severity, Status } from "../types";

const environments: Environment[] = ["DEV", "SIT", "UAT", "Staging", "Production"];
const severities: Severity[] = ["Low", "Medium", "High", "Critical"];
const statuses: Status[] = ["Open", "In Analysis", "Prevention Planned", "Closed"];

const initialForm: DefectInput = {
  title: "",
  module: "",
  environment: "UAT",
  severity: "Medium",
  status: "Open",
  expectedResult: "",
  actualResult: "",
  stepsToReproduce: "",
  affectedCaseIds: "",
  notes: ""
};

const requiredFields: Array<keyof DefectInput> = [
  "title",
  "module",
  "expectedResult",
  "actualResult",
  "stepsToReproduce",
  "affectedCaseIds"
];

export default function CreateDefectPage() {
  const [form, setForm] = useState<DefectInput>(initialForm);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const update = <K extends keyof DefectInput>(key: K, value: DefectInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFields((current) => ({ ...current, [key]: "" }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    requiredFields.forEach((field) => {
      if (!String(form[field] ?? "").trim()) {
        next[field] = "Required";
      }
    });
    setFields(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      const defect = await api.createDefect(form);
      navigate(`/defects/${defect.id}`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFields(err.fields ?? {});
      }
      setError(err instanceof Error ? err.message : "Could not create defect");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="stack narrow">
      <div className="section-heading">
        <div>
          <p className="eyebrow">New prevention signal</p>
          <h2>Create Defect</h2>
        </div>
      </div>

      <form className="form-panel" onSubmit={submit}>
        {error ? <div className="form-error">{error}</div> : null}

        <label>
          Title
          <input value={form.title} onChange={(event) => update("title", event.target.value)} />
          {fields.title ? <span className="field-error">{fields.title}</span> : null}
        </label>

        <div className="form-grid">
          <label>
            Module
            <input value={form.module} onChange={(event) => update("module", event.target.value)} />
            {fields.module ? <span className="field-error">{fields.module}</span> : null}
          </label>
          <label>
            Environment
            <select value={form.environment} onChange={(event) => update("environment", event.target.value as Environment)}>
              {environments.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Severity
            <select value={form.severity} onChange={(event) => update("severity", event.target.value as Severity)}>
              {severities.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={form.status} onChange={(event) => update("status", event.target.value as Status)}>
              {statuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Expected Result
          <textarea value={form.expectedResult} onChange={(event) => update("expectedResult", event.target.value)} rows={4} />
          {fields.expectedResult ? <span className="field-error">{fields.expectedResult}</span> : null}
        </label>
        <label>
          Actual Result
          <textarea value={form.actualResult} onChange={(event) => update("actualResult", event.target.value)} rows={4} />
          {fields.actualResult ? <span className="field-error">{fields.actualResult}</span> : null}
        </label>
        <label>
          Steps to Reproduce
          <textarea value={form.stepsToReproduce} onChange={(event) => update("stepsToReproduce", event.target.value)} rows={4} />
          {fields.stepsToReproduce ? <span className="field-error">{fields.stepsToReproduce}</span> : null}
        </label>
        <label>
          Affected Case IDs
          <input value={form.affectedCaseIds} onChange={(event) => update("affectedCaseIds", event.target.value)} placeholder="CASE-2026-0001, CASE-2026-0002" />
          {fields.affectedCaseIds ? <span className="field-error">{fields.affectedCaseIds}</span> : null}
        </label>
        <label>
          Notes
          <textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} rows={3} />
        </label>

        <div className="button-row">
          <button type="button" className="secondary-button" onClick={() => navigate("/defects")}>
            Cancel
          </button>
          <button className="primary-button" disabled={saving}>
            {saving ? "Creating..." : "Create Defect"}
          </button>
        </div>
      </form>
    </section>
  );
}
