import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { resetDb, testPrisma, validDefectInput } from "./helpers";

beforeEach(async () => {
  await resetDb();
});

describe("POST /api/defects — validation", () => {
  it("rejects empty body with field-level errors", async () => {
    const res = await request(app).post("/api/defects").send({});
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
    expect(res.body.fields).toBeDefined();
    expect(res.body.fields.title).toBeDefined();
    expect(res.body.fields.module).toBeDefined();
    expect(res.body.fields.severity).toBeDefined();
  });

  it("rejects invalid severity value", async () => {
    const res = await request(app)
      .post("/api/defects")
      .send(validDefectInput({ severity: "Extreme" }));
    expect(res.status).toBe(400);
    expect(res.body.fields.severity).toBeDefined();
  });

  it("rejects invalid environment value", async () => {
    const res = await request(app)
      .post("/api/defects")
      .send(validDefectInput({ environment: "LOCAL" }));
    expect(res.status).toBe(400);
    expect(res.body.fields.environment).toBeDefined();
  });

  it("rejects blank required string fields", async () => {
    const res = await request(app)
      .post("/api/defects")
      .send(validDefectInput({ title: "   ", actualResult: "" }));
    expect(res.status).toBe(400);
    expect(res.body.fields.title).toBeDefined();
    expect(res.body.fields.actualResult).toBeDefined();
  });

  it("creates defect with valid input", async () => {
    const res = await request(app).post("/api/defects").send(validDefectInput());
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe("Test defect title");
    expect(res.body.status).toBe("Open");
  });
});

describe("GET /api/defects/:id — not found", () => {
  it("returns 404 for non-existent defect", async () => {
    const res = await request(app).get("/api/defects/nonexistent-id-123");
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
    expect(res.body.error).toBe("Defect not found");
  });
});

describe("PATCH /api/defects/:id — not found", () => {
  it("returns 404 for non-existent defect", async () => {
    const res = await request(app)
      .patch("/api/defects/nonexistent-id-123")
      .send({ status: "Closed" });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });
});

describe("DELETE /api/defects/:id — not found", () => {
  it("returns 404 for non-existent defect", async () => {
    const res = await request(app).delete("/api/defects/nonexistent-id-123");
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });
});

describe("POST /api/defects/:id/analyze — not found", () => {
  it("returns 404 for non-existent defect", async () => {
    const res = await request(app).post("/api/defects/nonexistent-id-123/analyze");
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });
});

describe("Unknown API endpoint", () => {
  it("returns 404 for unknown routes under /api", async () => {
    const res = await request(app).get("/api/unknown");
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });
});
