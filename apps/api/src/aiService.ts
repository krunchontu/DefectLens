import OpenAI from "openai";
import type { Defect } from "@prisma/client";
import { analysisSchema } from "./validation";
import type { AnalysisOutput } from "./types";

const rootCauseRisk: Record<string, AnalysisOutput["releaseRisk"]> = {
  "Requirements Gap": "Medium",
  "Design Gap": "High",
  "Development Bug": "High",
  "Configuration Issue": "High",
  "Data Issue": "Medium",
  "Regression Issue": "High",
  "Integration/API Issue": "Critical",
  "Batch Job Issue": "High",
  "Test Coverage Gap": "Medium",
  "User Misunderstanding": "Low",
  "Release/Deployment Issue": "Critical"
};

function classifyMockRootCause(defect: Pick<Defect, "title" | "actualResult" | "module" | "expectedResult" | "stepsToReproduce">) {
  const text = [
    defect.title,
    defect.actualResult,
    defect.module,
    defect.expectedResult,
    defect.stepsToReproduce
  ]
    .join(" ")
    .toLowerCase();

  const rules: Array<[string[], AnalysisOutput["rootCauseCategory"]]> = [
    [["blank", "null", "empty", "not reset", "not cleared"], "Data Issue"],
    [["api", "integration", "sync", "isps", "iwork", "sedaap"], "Integration/API Issue"],
    [["batch", "job", "schedule", "queue"], "Batch Job Issue"],
    [["mapping", "stale", "incorrect value", "wrong value"], "Design Gap"],
    [["regression", "worked before", "previously worked"], "Regression Issue"],
    [["pending", "stuck", "status"], "Configuration Issue"],
    [["uat", "test", "scenario", "coverage"], "Test Coverage Gap"],
    [["deploy", "release", "cutover"], "Release/Deployment Issue"]
  ];

  return rules.find(([keywords]) => keywords.some((keyword) => text.includes(keyword)))?.[1] ?? "Requirements Gap";
}

function releaseRiskFor(category: string, severity: string): AnalysisOutput["releaseRisk"] {
  if (severity === "Critical") {
    return "Critical";
  }
  if (severity === "Low" && rootCauseRisk[category] !== "Critical") {
    return "Low";
  }
  return rootCauseRisk[category] ?? "Medium";
}

export function generateMockAnalysis(defect: Pick<Defect, "title" | "module" | "environment" | "severity" | "expectedResult" | "actualResult" | "stepsToReproduce" | "affectedCaseIds" | "notes">): AnalysisOutput {
  const category = classifyMockRootCause(defect);
  const releaseRisk = releaseRiskFor(category, defect.severity);
  const caseCount = defect.affectedCaseIds.split(",").map((caseId) => caseId.trim()).filter(Boolean).length;

  return analysisSchema.parse({
    rootCauseCategory: category,
    rootCauseExplanation: `(Mock analysis - connect OpenAI API key for AI-generated output) The defect pattern points to ${category.toLowerCase()} in the ${defect.module} flow. The observed behaviour differs from the expected result after the user follows the stated reproduction path, which suggests the requirement, configuration, data handling, or integration control was not fully covered before ${defect.environment} validation. This should be treated as a prevention signal because ${caseCount} affected case${caseCount === 1 ? "" : "s"} already show the same delivery risk.`,
    similarRiskAreas: [
      `${defect.module} validation rules and downstream hand-offs`,
      "Regression paths where existing case data is changed and saved again",
      "Release controls for cases moving between workbaskets, letters, payments, or external interfaces"
    ],
    preventionActions: [
      `Add an explicit acceptance criterion for ${defect.module} covering the expected system behaviour.`,
      "Create a regression checklist item for field reset, mapping refresh, routing, and downstream payload validation where relevant.",
      "Review configuration, mapping, and data dependencies with the developer before release approval.",
      "Add a UAT evidence checkpoint showing before-and-after case state, audit trail, and generated output.",
      "Include this defect pattern in release readiness notes if the affected module is in scope."
    ],
    uatScenarios: [
      {
        id: "UAT-001",
        scenario: `${defect.module} handles the primary happy path`,
        given: "Given a fictional case is ready for the affected business process",
        when: "When the tester completes the core user action and saves the case",
        then: "Then the case state and displayed values match the approved expected result"
      },
      {
        id: "UAT-002",
        scenario: `${defect.module} handles changed or corrected case data`,
        given: "Given a fictional case has previously saved values or mappings",
        when: "When the tester updates the relevant value and repeats the process",
        then: "Then stale, blank, or incorrectly retained data is not shown in the final outcome"
      },
      {
        id: "UAT-003",
        scenario: `${defect.module} supports release regression checks`,
        given: "Given cases exist across normal, exception, and reprocessed states",
        when: "When the tester runs the release regression path",
        then: "Then routing, output, audit, and downstream data remain consistent across all covered states"
      }
    ],
    cabSummary: `A ${defect.severity.toLowerCase()} severity defect was identified in ${defect.module} during ${defect.environment}. The issue affects fictional case IDs ${defect.affectedCaseIds} and is assessed as ${releaseRisk.toLowerCase()} release risk due to a likely ${category.toLowerCase()}. Recommended controls are to confirm the fix with targeted UAT scenarios, add regression evidence for changed or exception-state cases, and review release notes for any related module impact. CAB should consider approval only after prevention actions are accepted or an explicit business workaround is agreed.`,
    releaseRisk,
    rollbackConsideration: `If the fix introduces unexpected behaviour in ${defect.module}, revert the related configuration or code change and use the documented workaround for affected fictional cases while a corrected patch is prepared. Confirm rollback by retesting the original reproduction steps and one unaffected regression case.`
  });
}

function outputContract() {
  return {
    rootCauseCategory: "One of: Requirements Gap, Design Gap, Development Bug, Configuration Issue, Data Issue, Regression Issue, Integration/API Issue, Batch Job Issue, Test Coverage Gap, User Misunderstanding, Release/Deployment Issue",
    rootCauseExplanation: "string",
    similarRiskAreas: ["string"],
    preventionActions: ["string"],
    uatScenarios: [
      {
        id: "UAT-001",
        scenario: "Scenario title",
        given: "Given condition",
        when: "When action happens",
        then: "Then expected result"
      }
    ],
    cabSummary: "string",
    releaseRisk: "One of: Low, Medium, High, Critical",
    rollbackConsideration: "string"
  };
}

export async function analyzeDefect(defect: Defect): Promise<AnalysisOutput> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return generateMockAnalysis(defect);
  }

  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a senior Technical Business Analyst and Release Quality Lead working on enterprise case management systems. Analyse the defect and produce a structured JSON response. Be specific, practical, and suitable for enterprise delivery governance. Return ONLY valid JSON matching the exact schema provided. No markdown, no explanation."
      },
      {
        role: "user",
        content: JSON.stringify({
          defect: {
            title: defect.title,
            module: defect.module,
            environment: defect.environment,
            severity: defect.severity,
            expectedResult: defect.expectedResult,
            actualResult: defect.actualResult,
            stepsToReproduce: defect.stepsToReproduce,
            affectedCaseIds: defect.affectedCaseIds,
            notes: defect.notes
          },
          outputContract: outputContract()
        })
      }
    ]
  });

  const content = response.choices[0]?.message.content;
  if (!content) {
    throw new Error("AI response could not be parsed");
  }

  try {
    return analysisSchema.parse(JSON.parse(content));
  } catch {
    throw new Error("AI response could not be parsed");
  }
}
