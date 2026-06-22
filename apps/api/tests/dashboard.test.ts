import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { resetDb, testPrisma, validDefectInput } from "./helpers";

beforeEach(async () => {
  await resetDb();
});

describe("GET /api/dashboard", () => {
  it("returns zeros when no defects exist", async () => {
    const res = await request(app).get("/api/dashboard");
    expect(res.status).toBe(200);
    expect(res.body.totalDefects).toBe(0);
    expect(res.body.analysisCoverage).toEqual({ analysed: 0, total: 0, percent: 0 });
    expect(res.body.byStatus).toEqual([]);
    expect(res.body.bySeverity).toEqual([]);
    expect(res.body.byRootCause).toEqual([]);
    expect(res.body.highRiskModules).toEqual([]);
    expect(res.body.recentDefects).toEqual([]);
  });

  it("computes correct counts with seeded data", async () => {
    // Seed 3 defects with known properties
    await request(app).post("/api/defects").send(validDefectInput({ severity: "Critical", status: "Open", module: "Payments" }));
    await request(app).post("/api/defects").send(validDefectInput({ severity: "High", status: "Open", module: "Payments" }));
    await request(app).post("/api/defects").send(validDefectInput({ severity: "Low", status: "Closed", module: "Letters" }));

    const res = await request(app).get("/api/dashboard");
    expect(res.status).toBe(200);
    expect(res.body.totalDefects).toBe(3);

    // Status counts
    const openCount = res.body.byStatus.find((s: { status: string }) => s.status === "Open");
    const closedCount = res.body.byStatus.find((s: { status: string }) => s.status === "Closed");
    expect(openCount?.count).toBe(2);
    expect(closedCount?.count).toBe(1);

    // Severity counts
    const criticalCount = res.body.bySeverity.find((s: { severity: string }) => s.severity === "Critical");
    const highCount = res.body.bySeverity.find((s: { severity: string }) => s.severity === "High");
    const lowCount = res.body.bySeverity.find((s: { severity: string }) => s.severity === "Low");
    expect(criticalCount?.count).toBe(1);
    expect(highCount?.count).toBe(1);
    expect(lowCount?.count).toBe(1);

    // High risk modules sorted by count
    expect(res.body.highRiskModules[0].module).toBe("Payments");
    expect(res.body.highRiskModules[0].count).toBe(2);
  });

  it("computes analysis coverage percentage correctly", async () => {
    // Create 4 defects, analyze 2 of them
    const ids: string[] = [];
    for (let i = 0; i < 4; i++) {
      const res = await request(app).post("/api/defects").send(validDefectInput({ title: `Defect ${i}` }));
      ids.push(res.body.id);
    }
    await request(app).post(`/api/defects/${ids[0]}/analyze`);
    await request(app).post(`/api/defects/${ids[1]}/analyze`);

    const res = await request(app).get("/api/dashboard");
    expect(res.body.analysisCoverage.analysed).toBe(2);
    expect(res.body.analysisCoverage.total).toBe(4);
    expect(res.body.analysisCoverage.percent).toBe(50);
  });

  it("root cause distribution includes Not Analysed for unanalysed defects", async () => {
    await request(app).post("/api/defects").send(validDefectInput());
    const res = await request(app).get("/api/dashboard");
    const notAnalysed = res.body.byRootCause.find((r: { category: string }) => r.category === "Not Analysed");
    expect(notAnalysed?.count).toBe(1);
  });

  it("recent defects are limited to 5 and ordered newest first", async () => {
    for (let i = 0; i < 7; i++) {
      await request(app).post("/api/defects").send(validDefectInput({ title: `Defect ${i}` }));
    }
    const res = await request(app).get("/api/dashboard");
    expect(res.body.recentDefects.length).toBe(5);
    // Newest first
    const dates = res.body.recentDefects.map((d: { createdAt: string }) => new Date(d.createdAt).getTime());
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
    }
  });

  it("high-risk modules are limited to top 5", async () => {
    const modules = ["A", "B", "C", "D", "E", "F"];
    for (const mod of modules) {
      await request(app).post("/api/defects").send(validDefectInput({ module: mod }));
    }
    const res = await request(app).get("/api/dashboard");
    expect(res.body.highRiskModules.length).toBeLessThanOrEqual(5);
  });
});
