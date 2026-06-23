import { PrismaClient } from "@prisma/client";

export const testPrisma = new PrismaClient();

export async function resetDb() {
  await testPrisma.defectEvent.deleteMany();
  await testPrisma.defect.deleteMany();
}

export function validDefectInput(overrides: Record<string, unknown> = {}) {
  return {
    title: "Test defect title",
    module: "Payments",
    environment: "UAT",
    severity: "High",
    status: "Open",
    expectedResult: "System shows correct value",
    actualResult: "System shows blank",
    stepsToReproduce: "Open case, save, reopen",
    affectedCaseIds: "CASE-TEST-001",
    ...overrides
  };
}
