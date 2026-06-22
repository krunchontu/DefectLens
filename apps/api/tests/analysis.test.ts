import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { generateMockAnalysis } from "../src/aiService";
import { analysisSchema } from "../src/validation";
import { resetDb, validDefectInput } from "./helpers";

beforeEach(async () => {
  await resetDb();
});

describe("generateMockAnalysis — classification rules", () => {
  it("classifies 'blank' keyword as Data Issue", () => {
    const result = generateMockAnalysis({
      title: "Field is blank after save",
      module: "Payments",
      environment: "UAT",
      severity: "High",
      expectedResult: "Field shows value",
      actualResult: "Field is blank",
      stepsToReproduce: "Open and save",
      affectedCaseIds: "CASE-001",
      notes: null
    });
    expect(result.rootCauseCategory).toBe("Data Issue");
  });

  it("classifies 'api' keyword as Integration/API Issue", () => {
    const result = generateMockAnalysis({
      title: "API timeout on submission",
      module: "API Submission",
      environment: "SIT",
      severity: "Critical",
      expectedResult: "Submission completes",
      actualResult: "API timeout error",
      stepsToReproduce: "Submit via API",
      affectedCaseIds: "CASE-002",
      notes: null
    });
    expect(result.rootCauseCategory).toBe("Integration/API Issue");
  });

  it("classifies 'batch' keyword as Batch Job Issue", () => {
    const result = generateMockAnalysis({
      title: "Batch job missing records",
      module: "Batch Processing",
      environment: "SIT",
      severity: "High",
      expectedResult: "All records processed",
      actualResult: "Some records missing from batch output",
      stepsToReproduce: "Run batch job",
      affectedCaseIds: "CASE-003",
      notes: null
    });
    expect(result.rootCauseCategory).toBe("Batch Job Issue");
  });

  it("classifies 'mapping' keyword as Design Gap", () => {
    const result = generateMockAnalysis({
      title: "Incorrect mapping after update",
      module: "Letters",
      environment: "UAT",
      severity: "High",
      expectedResult: "Correct mapping displayed",
      actualResult: "Stale mapping value shown",
      stepsToReproduce: "Update mapping and view",
      affectedCaseIds: "CASE-004",
      notes: null
    });
    expect(result.rootCauseCategory).toBe("Design Gap");
  });

  it("classifies 'regression' keyword as Regression Issue", () => {
    const result = generateMockAnalysis({
      title: "Feature that previously worked now fails",
      module: "Approvals",
      environment: "UAT",
      severity: "Medium",
      expectedResult: "Feature works as before",
      actualResult: "Regression after latest release",
      stepsToReproduce: "Run existing scenario",
      affectedCaseIds: "CASE-005",
      notes: null
    });
    expect(result.rootCauseCategory).toBe("Regression Issue");
  });

  it("classifies 'deploy' keyword as Release/Deployment Issue", () => {
    const result = generateMockAnalysis({
      title: "Failed deploy caused outage",
      module: "Release Control",
      environment: "Staging",
      severity: "Critical",
      expectedResult: "Clean deploy",
      actualResult: "Deploy failed and caused downtime",
      stepsToReproduce: "Run deployment script",
      affectedCaseIds: "CASE-006",
      notes: null
    });
    expect(result.rootCauseCategory).toBe("Release/Deployment Issue");
  });

  it("defaults to Requirements Gap when no keyword matches", () => {
    const result = generateMockAnalysis({
      title: "Unexpected behavior in workflow",
      module: "Workflow Engine",
      environment: "UAT",
      severity: "Medium",
      expectedResult: "Workflow completes correctly",
      actualResult: "Workflow produces wrong outcome",
      stepsToReproduce: "Execute workflow",
      affectedCaseIds: "CASE-007",
      notes: null
    });
    expect(result.rootCauseCategory).toBe("Requirements Gap");
  });

  it("output matches analysisSchema", () => {
    const result = generateMockAnalysis({
      title: "Test defect for schema validation",
      module: "Payments",
      environment: "UAT",
      severity: "High",
      expectedResult: "Correct result",
      actualResult: "Wrong result",
      stepsToReproduce: "Steps here",
      affectedCaseIds: "CASE-008, CASE-009",
      notes: "Some notes"
    });

    // Should not throw
    const parsed = analysisSchema.parse(result);
    expect(parsed.rootCauseCategory).toBeDefined();
    expect(parsed.rootCauseExplanation.length).toBeGreaterThan(0);
    expect(parsed.similarRiskAreas.length).toBeGreaterThanOrEqual(1);
    expect(parsed.preventionActions.length).toBeGreaterThanOrEqual(1);
    expect(parsed.uatScenarios.length).toBeGreaterThanOrEqual(1);
    expect(parsed.cabSummary.length).toBeGreaterThan(0);
    expect(parsed.releaseRisk).toMatch(/^(Low|Medium|High|Critical)$/);
    expect(parsed.rollbackConsideration.length).toBeGreaterThan(0);
  });

  it("release risk is Critical when severity is Critical", () => {
    const result = generateMockAnalysis({
      title: "Normal defect title",
      module: "Payments",
      environment: "UAT",
      severity: "Critical",
      expectedResult: "Works",
      actualResult: "Broken",
      stepsToReproduce: "Do things",
      affectedCaseIds: "CASE-010",
      notes: null
    });
    expect(result.releaseRisk).toBe("Critical");
  });

  it("release risk is Low when severity is Low and category is not Critical-risk", () => {
    const result = generateMockAnalysis({
      title: "Minor unexpected behavior in workflow",
      module: "Workflow",
      environment: "DEV",
      severity: "Low",
      expectedResult: "Correct",
      actualResult: "Wrong",
      stepsToReproduce: "Steps",
      affectedCaseIds: "CASE-011",
      notes: null
    });
    expect(result.releaseRisk).toBe("Low");
  });
});

describe("POST /api/defects/:id/analyze — mock analysis", () => {
  it("generates analysis and persists it on the defect", async () => {
    // Create a defect first
    const createRes = await request(app).post("/api/defects").send(validDefectInput());
    const defectId = createRes.body.id;

    // Analyze it
    const res = await request(app).post(`/api/defects/${defectId}/analyze`);
    expect(res.status).toBe(200);
    expect(res.body.rootCauseCategory).toBeDefined();
    expect(res.body.similarRiskAreas).toBeInstanceOf(Array);
    expect(res.body.preventionActions).toBeInstanceOf(Array);
    expect(res.body.uatScenarios).toBeInstanceOf(Array);
    expect(res.body.cabSummary).toBeDefined();
    expect(res.body.releaseRisk).toBeDefined();
    expect(res.body.rollbackConsideration).toBeDefined();

    // Verify persistence by fetching again
    const getRes = await request(app).get(`/api/defects/${defectId}`);
    expect(getRes.body.rootCauseCategory).toBe(res.body.rootCauseCategory);
  });
});
