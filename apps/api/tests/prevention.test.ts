import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { resetDb, validDefectInput } from "./helpers";

beforeEach(async () => {
  await resetDb();
});

describe("PATCH /api/defects/:id/prevention", () => {
  it("returns 404 for non-existent defect", async () => {
    const res = await request(app)
      .patch("/api/defects/nonexistent/prevention")
      .send({ action: "Do something", done: true });
    expect(res.status).toBe(404);
  });

  it("rejects missing action field", async () => {
    const createRes = await request(app).post("/api/defects").send(validDefectInput());
    const id = createRes.body.id;

    const res = await request(app)
      .patch(`/api/defects/${id}/prevention`)
      .send({ done: true });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("rejects missing done field", async () => {
    const createRes = await request(app).post("/api/defects").send(validDefectInput());
    const id = createRes.body.id;

    const res = await request(app)
      .patch(`/api/defects/${id}/prevention`)
      .send({ action: "Do something" });
    expect(res.status).toBe(400);
  });

  it("persists a prevention toggle and returns updated defect", async () => {
    const createRes = await request(app).post("/api/defects").send(validDefectInput());
    const id = createRes.body.id;

    const res = await request(app)
      .patch(`/api/defects/${id}/prevention`)
      .send({ action: "Add regression test", done: true });
    expect(res.status).toBe(200);
    expect(res.body.preventionProgress["Add regression test"].done).toBe(true);
    expect(res.body.preventionProgress["Add regression test"].updatedAt).toBeDefined();
  });

  it("persists multiple prevention toggles", async () => {
    const createRes = await request(app).post("/api/defects").send(validDefectInput());
    const id = createRes.body.id;

    await request(app)
      .patch(`/api/defects/${id}/prevention`)
      .send({ action: "Action A", done: true });
    const res = await request(app)
      .patch(`/api/defects/${id}/prevention`)
      .send({ action: "Action B", done: true });

    expect(res.body.preventionProgress["Action A"].done).toBe(true);
    expect(res.body.preventionProgress["Action B"].done).toBe(true);
  });

  it("allows toggling a prevention action back to false", async () => {
    const createRes = await request(app).post("/api/defects").send(validDefectInput());
    const id = createRes.body.id;

    await request(app)
      .patch(`/api/defects/${id}/prevention`)
      .send({ action: "Action A", done: true });
    const res = await request(app)
      .patch(`/api/defects/${id}/prevention`)
      .send({ action: "Action A", done: false });

    expect(res.body.preventionProgress["Action A"].done).toBe(false);
  });

  it("persists across requests (survives reload)", async () => {
    const createRes = await request(app).post("/api/defects").send(validDefectInput());
    const id = createRes.body.id;

    await request(app)
      .patch(`/api/defects/${id}/prevention`)
      .send({ action: "Persist test", done: true });

    // Simulate page reload — fetch the defect fresh
    const getRes = await request(app).get(`/api/defects/${id}`);
    expect(getRes.body.preventionProgress["Persist test"].done).toBe(true);
  });
});

describe("Prevention progress summary", () => {
  it("shows correct completed/total counts", async () => {
    const createRes = await request(app).post("/api/defects").send(validDefectInput());
    const id = createRes.body.id;

    // Analyze to generate prevention actions
    await request(app).post(`/api/defects/${id}/analyze`);

    // Get the defect to see what actions were generated
    let getRes = await request(app).get(`/api/defects/${id}`);
    const actions = getRes.body.preventionActions as string[];
    expect(actions.length).toBeGreaterThan(0);

    // Mark the first two as done
    await request(app)
      .patch(`/api/defects/${id}/prevention`)
      .send({ action: actions[0], done: true });
    await request(app)
      .patch(`/api/defects/${id}/prevention`)
      .send({ action: actions[1], done: true });

    getRes = await request(app).get(`/api/defects/${id}`);
    expect(getRes.body.preventionSummary.completed).toBe(2);
    expect(getRes.body.preventionSummary.total).toBe(actions.length);
  });
});

describe("Prevention progress reconciliation on re-analysis", () => {
  it("keeps progress for actions that still exist after re-analysis", async () => {
    const createRes = await request(app).post("/api/defects").send(validDefectInput());
    const id = createRes.body.id;

    // Analyze to generate prevention actions
    await request(app).post(`/api/defects/${id}/analyze`);
    let getRes = await request(app).get(`/api/defects/${id}`);
    const actions = getRes.body.preventionActions as string[];

    // Mark one as done
    await request(app)
      .patch(`/api/defects/${id}/prevention`)
      .send({ action: actions[0], done: true });

    // Re-analyze (mock generates same actions for same input)
    await request(app).post(`/api/defects/${id}/analyze`);

    getRes = await request(app).get(`/api/defects/${id}`);
    // Since mock produces same actions for same input, the completed entry should remain
    expect(getRes.body.preventionProgress[actions[0]].done).toBe(true);
  });

  it("drops progress for actions that no longer exist after re-analysis", async () => {
    const createRes = await request(app).post("/api/defects").send(validDefectInput());
    const id = createRes.body.id;

    // Manually set a prevention progress entry for a custom action name
    await request(app)
      .patch(`/api/defects/${id}/prevention`)
      .send({ action: "Old action that will not exist after analysis", done: true });

    // Analyze — new actions won't include "Old action..."
    await request(app).post(`/api/defects/${id}/analyze`);

    const getRes = await request(app).get(`/api/defects/${id}`);
    expect(getRes.body.preventionProgress["Old action that will not exist after analysis"]).toBeUndefined();
  });
});
