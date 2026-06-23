import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { resetDb, validDefectInput } from "./helpers";

beforeEach(async () => {
  await resetDb();
});

describe("GET /api/defects — paged envelope", () => {
  it("returns paged envelope with defaults", async () => {
    await request(app).post("/api/defects").send(validDefectInput());
    const res = await request(app).get("/api/defects");
    expect(res.status).toBe(200);
    expect(res.body.items).toBeInstanceOf(Array);
    expect(res.body.items.length).toBe(1);
    expect(res.body.page).toBe(1);
    expect(res.body.pageSize).toBe(20);
    expect(res.body.total).toBe(1);
    expect(res.body.totalPages).toBe(1);
  });

  it("returns empty items when no defects exist", async () => {
    const res = await request(app).get("/api/defects");
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
    expect(res.body.totalPages).toBe(0);
  });
});

describe("GET /api/defects — filtering", () => {
  beforeEach(async () => {
    await request(app).post("/api/defects").send(validDefectInput({ title: "Defect A", status: "Open", severity: "Critical", module: "Payments", environment: "UAT" }));
    await request(app).post("/api/defects").send(validDefectInput({ title: "Defect B", status: "Closed", severity: "Low", module: "Letters", environment: "SIT" }));
    await request(app).post("/api/defects").send(validDefectInput({ title: "Defect C", status: "Open", severity: "High", module: "Payments", environment: "UAT" }));
  });

  it("filters by status", async () => {
    const res = await request(app).get("/api/defects?status=Open");
    expect(res.body.total).toBe(2);
    expect(res.body.items.every((d: { status: string }) => d.status === "Open")).toBe(true);
  });

  it("filters by severity", async () => {
    const res = await request(app).get("/api/defects?severity=Critical");
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].title).toBe("Defect A");
  });

  it("filters by module (contains match)", async () => {
    const res = await request(app).get("/api/defects?module=Payments");
    expect(res.body.total).toBe(2);
  });

  it("filters by environment", async () => {
    const res = await request(app).get("/api/defects?environment=SIT");
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].title).toBe("Defect B");
  });

  it("combines multiple filters", async () => {
    const res = await request(app).get("/api/defects?status=Open&module=Payments");
    expect(res.body.total).toBe(2);
  });

  it("returns empty when no defects match", async () => {
    const res = await request(app).get("/api/defects?status=Open&severity=Low");
    expect(res.body.total).toBe(0);
    expect(res.body.items).toEqual([]);
  });
});

describe("GET /api/defects — search (q)", () => {
  beforeEach(async () => {
    await request(app).post("/api/defects").send(validDefectInput({ title: "Payment field blank", module: "Payments", affectedCaseIds: "CASE-001" }));
    await request(app).post("/api/defects").send(validDefectInput({ title: "Letter generation fails", module: "Letters", affectedCaseIds: "CASE-002" }));
    await request(app).post("/api/defects").send(validDefectInput({ title: "Batch job timeout", module: "Batch", affectedCaseIds: "CASE-003, CASE-001" }));
  });

  it("searches by title", async () => {
    const res = await request(app).get("/api/defects?q=Payment");
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].title).toContain("Payment");
  });

  it("searches by module", async () => {
    const res = await request(app).get("/api/defects?q=Letters");
    expect(res.body.total).toBe(1);
  });

  it("searches by affected case IDs", async () => {
    const res = await request(app).get("/api/defects?q=CASE-001");
    expect(res.body.total).toBe(2); // matches first and third
  });

  it("search is case-insensitive", async () => {
    const res = await request(app).get("/api/defects?q=payment");
    expect(res.body.total).toBe(1);
  });

  it("combines search with filter", async () => {
    const res = await request(app).get("/api/defects?q=CASE-001&module=Batch");
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].title).toContain("Batch");
  });
});

describe("GET /api/defects — pagination", () => {
  beforeEach(async () => {
    // Create 5 defects
    for (let i = 0; i < 5; i++) {
      await request(app).post("/api/defects").send(validDefectInput({ title: `Defect ${i}` }));
    }
  });

  it("paginates with custom pageSize", async () => {
    const res = await request(app).get("/api/defects?pageSize=2");
    expect(res.body.items.length).toBe(2);
    expect(res.body.total).toBe(5);
    expect(res.body.totalPages).toBe(3);
    expect(res.body.page).toBe(1);
  });

  it("returns second page", async () => {
    const page1 = await request(app).get("/api/defects?pageSize=2&page=1");
    const page2 = await request(app).get("/api/defects?pageSize=2&page=2");
    expect(page2.body.items.length).toBe(2);
    expect(page2.body.page).toBe(2);
    // Items should be different
    expect(page2.body.items[0].id).not.toBe(page1.body.items[0].id);
  });

  it("returns partial last page", async () => {
    const res = await request(app).get("/api/defects?pageSize=3&page=2");
    expect(res.body.items.length).toBe(2); // 5 total, page 2 of size 3
    expect(res.body.totalPages).toBe(2);
  });

  it("returns empty for page beyond range", async () => {
    const res = await request(app).get("/api/defects?pageSize=2&page=10");
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(5);
  });

  it("applies pagination after filtering", async () => {
    // Only 5 defects, all same status. Add one different.
    await request(app).post("/api/defects").send(validDefectInput({ title: "Closed one", status: "Closed" }));
    const res = await request(app).get("/api/defects?status=Open&pageSize=3");
    expect(res.body.total).toBe(5);
    expect(res.body.items.length).toBe(3);
    expect(res.body.totalPages).toBe(2);
  });

  it("rejects page less than 1", async () => {
    const res = await request(app).get("/api/defects?page=0");
    expect(res.status).toBe(400);
  });

  it("rejects pageSize greater than max", async () => {
    const res = await request(app).get("/api/defects?pageSize=100");
    expect(res.status).toBe(400);
  });
});
