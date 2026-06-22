import type { Defect } from "@prisma/client";
import type { PreventionProgress, UatScenario } from "./types";

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

export function parsePreventionProgress(value: string | null): PreventionProgress {
  if (!value) {
    return {};
  }
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function preventionSummary(progress: PreventionProgress, totalActions: number) {
  const completed = Object.values(progress).filter((entry) => entry.done).length;
  return { completed, total: totalActions };
}

export function serializeDefect(defect: Defect) {
  const preventionActions = parseJsonArray<string>(defect.preventionActions);
  const preventionProgress = parsePreventionProgress(defect.preventionProgress);
  return {
    ...defect,
    similarRiskAreas: parseJsonArray<string>(defect.similarRiskAreas),
    preventionActions,
    preventionProgress,
    preventionSummary: preventionSummary(preventionProgress, preventionActions.length),
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
