import { z } from "zod";

export const severityValues = ["Low", "Medium", "High", "Critical"] as const;
export const statusValues = ["Open", "In Analysis", "Prevention Planned", "Closed"] as const;
export const environmentValues = ["DEV", "SIT", "UAT", "Staging", "Production"] as const;
export const rootCauseValues = [
  "Requirements Gap",
  "Design Gap",
  "Development Bug",
  "Configuration Issue",
  "Data Issue",
  "Regression Issue",
  "Integration/API Issue",
  "Batch Job Issue",
  "Test Coverage Gap",
  "User Misunderstanding",
  "Release/Deployment Issue"
] as const;

const requiredString = z.string().trim().min(1, "Required");

export const createDefectSchema = z.object({
  title: requiredString,
  module: requiredString,
  environment: z.enum(environmentValues),
  severity: z.enum(severityValues),
  status: z.enum(statusValues),
  expectedResult: requiredString,
  actualResult: requiredString,
  stepsToReproduce: requiredString,
  affectedCaseIds: requiredString,
  notes: z.string().trim().optional()
});

export const updateDefectSchema = createDefectSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required" }
);

export const uatScenarioSchema = z.object({
  id: requiredString,
  scenario: requiredString,
  given: requiredString,
  when: requiredString,
  then: requiredString
});

export const analysisSchema = z.object({
  rootCauseCategory: z.enum(rootCauseValues),
  rootCauseExplanation: requiredString,
  similarRiskAreas: z.array(requiredString).min(1),
  preventionActions: z.array(requiredString).min(1),
  uatScenarios: z.array(uatScenarioSchema).min(1),
  cabSummary: requiredString,
  releaseRisk: z.enum(severityValues),
  rollbackConsideration: requiredString
});

export type CreateDefectInput = z.infer<typeof createDefectSchema>;
export type UpdateDefectInput = z.infer<typeof updateDefectSchema>;
