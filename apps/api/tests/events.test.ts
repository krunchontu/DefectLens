import request from "supertest";
import { app } from "../src/app";
import { resetDb, testPrisma, validDefectInput } from "./helpers";

beforeEach(async () => {
  await resetDb();
});

describe("Audit trail events", () => {
  describe("Event recording on create", () => {
    it("records a CREATED event when a defect is created", async () => {
      const res = await request(app).post("/api/defects").send(validDefectInput());
      expect(res.status).toBe(201);

      const events = await testPrisma.defectEvent.findMany({
        where: { defectId: res.body.id }
      });
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("CREATED");
      expect(events[0].summary).toContain("Defect created");
    });
  });

  describe("Event recording on status change", () => {
    it("records a STATUS_CHANGED event when status is updated", async () => {
      const createRes = await request(app).post("/api/defects").send(validDefectInput());
      const defectId = createRes.body.id;

      await request(app)
        .patch(`/api/defects/${defectId}`)
        .send({ status: "In Analysis" })
        .expect(200);

      const events = await testPrisma.defectEvent.findMany({
        where: { defectId, type: "STATUS_CHANGED" }
      });
      expect(events).toHaveLength(1);
      expect(events[0].summary).toContain("Open");
      expect(events[0].summary).toContain("In Analysis");

      const detail = JSON.parse(events[0].detail!);
      expect(detail.from).toBe("Open");
      expect(detail.to).toBe("In Analysis");
    });

    it("does not record a STATUS_CHANGED event when status is not changed", async () => {
      const createRes = await request(app).post("/api/defects").send(validDefectInput());
      const defectId = createRes.body.id;

      await request(app)
        .patch(`/api/defects/${defectId}`)
        .send({ title: "Updated title" })
        .expect(200);

      const events = await testPrisma.defectEvent.findMany({
        where: { defectId, type: "STATUS_CHANGED" }
      });
      expect(events).toHaveLength(0);
    });
  });

  describe("Event recording on analyze", () => {
    it("records an ANALYSIS_GENERATED event after analysis", async () => {
      const createRes = await request(app).post("/api/defects").send(validDefectInput());
      const defectId = createRes.body.id;

      await request(app).post(`/api/defects/${defectId}/analyze`).expect(200);

      const events = await testPrisma.defectEvent.findMany({
        where: { defectId, type: "ANALYSIS_GENERATED" }
      });
      expect(events).toHaveLength(1);
      expect(events[0].summary).toContain("Analysis generated");
    });
  });

  describe("Event recording on prevention update", () => {
    it("records a PREVENTION_UPDATED event when prevention action is toggled", async () => {
      const createRes = await request(app).post("/api/defects").send(validDefectInput());
      const defectId = createRes.body.id;

      await request(app)
        .patch(`/api/defects/${defectId}/prevention`)
        .send({ action: "Add unit tests", done: true })
        .expect(200);

      const events = await testPrisma.defectEvent.findMany({
        where: { defectId, type: "PREVENTION_UPDATED" }
      });
      expect(events).toHaveLength(1);
      expect(events[0].summary).toContain("Add unit tests");
      expect(events[0].summary).toContain("done");
    });
  });

  describe("Event recording on delete", () => {
    it("cascade deletes events when defect is deleted", async () => {
      const createRes = await request(app).post("/api/defects").send(validDefectInput());
      const defectId = createRes.body.id;

      // Change status to produce another event
      await request(app)
        .patch(`/api/defects/${defectId}`)
        .send({ status: "Closed" })
        .expect(200);

      // Verify events exist
      const eventsBefore = await testPrisma.defectEvent.findMany({ where: { defectId } });
      expect(eventsBefore.length).toBeGreaterThan(0);

      // Delete the defect
      await request(app).delete(`/api/defects/${defectId}`).expect(200);

      // Events should be cascade-deleted
      const eventsAfter = await testPrisma.defectEvent.findMany({ where: { defectId } });
      expect(eventsAfter).toHaveLength(0);
    });
  });

  describe("GET /api/defects/:id/events", () => {
    it("returns events newest-first", async () => {
      const createRes = await request(app).post("/api/defects").send(validDefectInput());
      const defectId = createRes.body.id;

      // Generate multiple events
      await request(app)
        .patch(`/api/defects/${defectId}`)
        .send({ status: "In Analysis" });
      await request(app)
        .patch(`/api/defects/${defectId}`)
        .send({ status: "Prevention Planned" });

      const res = await request(app).get(`/api/defects/${defectId}/events`).expect(200);

      expect(res.body.length).toBeGreaterThanOrEqual(3); // CREATED + 2 STATUS_CHANGED
      // Check newest-first ordering
      for (let i = 0; i < res.body.length - 1; i++) {
        const current = new Date(res.body[i].createdAt).getTime();
        const next = new Date(res.body[i + 1].createdAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it("returns 404 for a non-existent defect", async () => {
      await request(app).get("/api/defects/nonexistent/events").expect(404);
    });

    it("returns parsed detail as JSON object", async () => {
      const createRes = await request(app).post("/api/defects").send(validDefectInput());
      const defectId = createRes.body.id;

      await request(app)
        .patch(`/api/defects/${defectId}`)
        .send({ status: "In Analysis" });

      const res = await request(app).get(`/api/defects/${defectId}/events`).expect(200);

      const statusEvent = res.body.find((e: { type: string }) => e.type === "STATUS_CHANGED");
      expect(statusEvent.detail).toEqual({ from: "Open", to: "In Analysis" });
    });
  });
});
