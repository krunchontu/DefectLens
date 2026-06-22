import type { Defect } from "@prisma/client";
import type { UatScenario } from "./types";

function parseJsonArray<T>(value: string | null): T[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function serializeDefect(defect: Defect) {
  return {
    ...defect,
    similarRiskAreas: parseJsonArray<string>(defect.similarRiskAreas),
    preventionActions: parseJsonArray<string>(defect.preventionActions),
    uatScenarios: parseJsonArray<UatScenario>(defect.uatScenarios),
    createdAt: defect.createdAt.toISOString(),
    updatedAt: defect.updatedAt.toISOString()
  };
}

export function serializeDefectSummary(defect: Pick<Defect, "id" | "title" | "module" | "environment" | "severity" | "status" | "affectedCaseIds" | "rootCauseCategory" | "createdAt" | "updatedAt">) {
  return {
    id: defect.id,
    title: defect.title,
    module: defect.module,
    environment: defect.environment,
    severity: defect.severity,
    status: defect.status,
    affectedCaseIds: defect.affectedCaseIds,
    rootCauseCategory: defect.rootCauseCategory,
    createdAt: defect.createdAt.toISOString(),
    updatedAt: defect.updatedAt.toISOString()
  };
}
