import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { resetDb, testPrisma, validDefectInput } from "./helpers";

describe("GET /api/release-pack", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("returns an empty pack when no defects exist", async () => {
    const res = await request(app).get("/api/release-pack");
    expect(res.status).toBe(200);
    expect(res.body.generatedAt).toBeDefined();
    expect(res.body.summary.totalDefects).toBe(0);
    expect(res.body.summary.openDefects).toBe(0);
    expect(res.body.summary.qualifyingDefects).toBe(0);
    expect(res.body.defects).toEqual([]);
  });

  it("returns an empty pack when defects exist but none qualify (no analysis)", async () => {
    await request(app).post("/api/defects").send(validDefectInput());
    const res = await request(app).get("/api/release-pack");
    expect(res.status).toBe(200);
    expect(res.body.summary.totalDefects).toBe(1);
    expect(res.body.summary.openDefects).toBe(1);
    expect(res.body.summary.qualifyingDefects).toBe(0);
    expect(res.body.defects).toEqual([]);
  });

  it("includes only open defects with High or Critical releaseRisk", async () => {
    // Create a qualifying defect: open + High risk
    const d1 = await testPrisma.defect.create({
      data: {
        ...validDefectInput({ status: "Open" }),
        rootCauseCategory: "Development Bug",
        rootCauseExplanation: "A bug",
        similarRiskAreas: JSON.stringify(["Area1"]),
        preventionActions: JSON.stringify(["Action 1", "Action 2"]),
        preventionProgress: JSON.stringify({ "Action 1": { done: true, updatedAt: "2024-01-01T00:00:00.000Z" } }),
        uatScenarios: JSON.stringify([]),
        cabSummary: "Cab summary for d1",
        releaseRisk: "High",
        rollbackConsideration: "Rollback plan for d1"
      }
    });

    // Create a qualifying defect: In Analysis + Critical risk
    const d2 = await testPrisma.defect.create({
      data: {
        ...validDefectInput({ status: "In Analysis" }),
        rootCauseCategory: "Requirements Gap",
        rootCauseExplanation: "Missing requirement",
        similarRiskAreas: JSON.stringify(["Area2"]),
        preventionActions: JSON.stringify(["Action A"]),
        preventionProgress: JSON.stringify({}),
        uatScenarios: JSON.stringify([]),
        cabSummary: "Cab summary for d2",
        releaseRisk: "Critical",
        rollbackConsideration: "Rollback plan for d2"
      }
    });

    // Create a NON-qualifying defect: open but Low risk
    await testPrisma.defect.create({
      data: {
        ...validDefectInput({ status: "Open" }),
        rootCauseCategory: "Data Issue",
        rootCauseExplanation: "Minor data issue",
        similarRiskAreas: JSON.stringify(["Area3"]),
        preventionActions: JSON.stringify([]),
        preventionProgress: JSON.stringify({}),
        uatScenarios: JSON.stringify([]),
        cabSummary: "Low risk cab",
        releaseRisk: "Low",
        rollbackConsideration: "No rollback needed"
      }
    });

    // Create a NON-qualifying defect: Closed + High risk
    await testPrisma.defect.create({
      data: {
        ...validDefectInput({ status: "Closed" }),
        rootCauseCategory: "Regression Issue",
        rootCauseExplanation: "Regression",
        similarRiskAreas: JSON.stringify(["Area4"]),
        preventionActions: JSON.stringify([]),
        preventionProgress: JSON.stringify({}),
        uatScenarios: JSON.stringify([]),
        cabSummary: "Closed cab",
        releaseRisk: "High",
        rollbackConsideration: "Was rolled back"
      }
    });

    const res = await request(app).get("/api/release-pack");
    expect(res.status).toBe(200);

    // Summary metrics
    expect(res.body.summary.totalDefects).toBe(4);
    expect(res.body.summary.openDefects).toBe(3); // Open, In Analysis, Open (Low) are all non-Closed
    expect(res.body.summary.qualifyingDefects).toBe(2);
    expect(res.body.summary.analysisCoverage.analysed).toBe(4);
    expect(res.body.summary.analysisCoverage.total).toBe(4);
    expect(res.body.summary.analysisCoverage.percent).toBe(100);

    // Only d1 and d2 should be included
    const ids = res.body.defects.map((d: { id: string }) => d.id);
    expect(ids).toContain(d1.id);
    expect(ids).toContain(d2.id);
    expect(ids).toHaveLength(2);
  });

  it("includes root cause, release risk, prevention progress, CAB summary, and rollback per defect", async () => {
    await testPrisma.defect.create({
      data: {
        ...validDefectInput({ status: "Prevention Planned" }),
        rootCauseCategory: "Integration/API Issue",
        rootCauseExplanation: "API timeout",
        similarRiskAreas: JSON.stringify(["Payments", "Billing"]),
        preventionActions: JSON.stringify(["Add retry logic", "Add circuit breaker", "Add monitoring"]),
        preventionProgress: JSON.stringify({
          "Add retry logic": { done: true, updatedAt: "2024-01-01T00:00:00.000Z" },
          "Add circuit breaker": { done: true, updatedAt: "2024-01-02T00:00:00.000Z" }
        }),
        uatScenarios: JSON.stringify([]),
        cabSummary: "Integration failure under load requires retry and circuit breaker patterns.",
        releaseRisk: "Critical",
        rollbackConsideration: "Revert to previous API version; traffic can be rerouted via feature flag."
      }
    });

    const res = await request(app).get("/api/release-pack");
    expect(res.status).toBe(200);
    expect(res.body.defects).toHaveLength(1);

    const defect = res.body.defects[0];
    expect(defect.rootCauseCategory).toBe("Integration/API Issue");
    expect(defect.releaseRisk).toBe("Critical");
    expect(defect.preventionProgress).toEqual({ completed: 2, total: 3 });
    expect(defect.cabSummary).toBe("Integration failure under load requires retry and circuit breaker patterns.");
    expect(defect.rollbackConsideration).toBe("Revert to previous API version; traffic can be rerouted via feature flag.");
  });

  it("returns correct risk distribution in summary", async () => {
    // Two open High risk defects
    for (let i = 0; i < 2; i++) {
      await testPrisma.defect.create({
        data: {
          ...validDefectInput({ status: "Open" }),
          releaseRisk: "High",
          rootCauseCategory: "Development Bug",
          rootCauseExplanation: "Bug",
          similarRiskAreas: JSON.stringify([]),
          preventionActions: JSON.stringify([]),
          cabSummary: "Summary",
          rollbackConsideration: "Rollback"
        }
      });
    }
    // One open Medium risk defect
    await testPrisma.defect.create({
      data: {
        ...validDefectInput({ status: "Open" }),
        releaseRisk: "Medium",
        rootCauseCategory: "Data Issue",
        rootCauseExplanation: "Data",
        similarRiskAreas: JSON.stringify([]),
        preventionActions: JSON.stringify([]),
        cabSummary: "Summary",
        rollbackConsideration: "Rollback"
      }
    });

    const res = await request(app).get("/api/release-pack");
    expect(res.status).toBe(200);

    const riskDist = res.body.summary.riskDistribution;
    const highEntry = riskDist.find((r: { risk: string }) => r.risk === "High");
    const mediumEntry = riskDist.find((r: { risk: string }) => r.risk === "Medium");
    expect(highEntry.count).toBe(2);
    expect(mediumEntry.count).toBe(1);
  });
});
