import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { generateMockAnalysis } from "../apps/api/src/aiService";

const prisma = new PrismaClient();

type SeedDefect = {
  title: string;
  module: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  environment: "DEV" | "SIT" | "UAT" | "Staging" | "Production";
  status: "Open" | "In Analysis" | "Prevention Planned" | "Closed";
  expectedResult: string;
  actualResult: string;
  stepsToReproduce: string;
  affectedCaseIds: string;
  notes?: string;
  analyse?: boolean;
};

const defects: SeedDefect[] = [
  {
    title: "Classification field not reset after occupational disease type change",
    module: "Assessment Type",
    severity: "High",
    environment: "UAT",
    status: "Open",
    expectedResult: "When OD type changes from OD-Others to NID, the OD-Others descriptor field should clear to blank.",
    actualResult: "OD-Others descriptor field retains previous value after assessment type is changed to NID.",
    stepsToReproduce: "Open a case with OD-Others selected, enter descriptor text, save, change assessment type to NID, save again, then reopen the case.",
    affectedCaseIds: "CASE-2026-0001, CASE-2026-0002",
    notes: "Dependent field clearing was missed in regression coverage.",
    analyse: true
  },
  {
    title: "Final outcome letter shows stale respondent name after ER-PO mapping update",
    module: "Letters",
    severity: "High",
    environment: "UAT",
    status: "Open",
    expectedResult: "Letter should reflect updated respondent name after ER-PO mapping is corrected.",
    actualResult: "Letter still shows old respondent value; mapping update is not reflected in letter generation.",
    stepsToReproduce: "Update ER-PO mapping, regenerate the final outcome letter, and compare respondent name against the latest case party mapping.",
    affectedCaseIds: "CASE-2026-0003",
    notes: "Letter generation may be reading from stale mapped data."
  },
  {
    title: "Online non-payment submission stuck in Pending Workbasket status",
    module: "Payment / Non-payment",
    severity: "Critical",
    environment: "SIT",
    status: "In Analysis",
    expectedResult: "Submission should transition to In-Review status after online non-payment form is submitted.",
    actualResult: "Submission remains in Pending Workbasket; no routing trigger fires.",
    stepsToReproduce: "Submit online non-payment form, check case status, verify workbasket assignment and routing audit trail.",
    affectedCaseIds: "CASE-2026-0004, CASE-2026-0005",
    notes: "Routing trigger and status transition need review.",
    analyse: true
  },
  {
    title: "API batch submission missing records in Pending Intervention state",
    module: "API Submission",
    severity: "High",
    environment: "SIT",
    status: "Open",
    expectedResult: "All records in Pending Intervention state should be included in batch API submission.",
    actualResult: "Records in Pending Intervention state are excluded from the batch; downstream system receives incomplete payload.",
    stepsToReproduce: "Prepare records across multiple statuses, run batch API submission, compare outbound payload against eligible case list.",
    affectedCaseIds: "CASE-2026-0006",
    notes: "Eligibility criteria may exclude valid intervention-state records."
  },
  {
    title: "Requeue action required to correct blank payment direction field",
    module: "Payment Direction",
    severity: "Medium",
    environment: "UAT",
    status: "Closed",
    expectedResult: "Payment direction field should auto-populate based on case type at submission.",
    actualResult: "Payment direction field is blank after submission; manual requeue is required as workaround.",
    stepsToReproduce: "Submit a payment case, inspect payment direction field, run requeue action, verify field is corrected after reprocessing.",
    affectedCaseIds: "CASE-2026-0007, CASE-2026-0008",
    notes: "Requeue workaround exists but prevention logic should be added.",
    analyse: true
  },
  {
    title: "Approval audit entry missing after delegated review",
    module: "Approvals",
    severity: "Medium",
    environment: "UAT",
    status: "Open",
    expectedResult: "Delegated review approval should write an audit entry with reviewer, timestamp, and decision.",
    actualResult: "Case reaches approved status, but the delegated reviewer audit entry is empty.",
    stepsToReproduce: "Create a case requiring delegated review, approve as delegate, then inspect the audit timeline.",
    affectedCaseIds: "CASE-2026-0009",
    notes: "Audit evidence is required for release governance."
  },
  {
    title: "Manual correspondence task remains open after letter generation",
    module: "Letters",
    severity: "Low",
    environment: "SIT",
    status: "Open",
    expectedResult: "Manual correspondence task should close automatically after the letter is generated successfully.",
    actualResult: "Letter is generated, but the manual correspondence task remains open and appears in the user queue.",
    stepsToReproduce: "Generate a manual correspondence letter, return to the assignment list, and refresh the case worklist.",
    affectedCaseIds: "CASE-2026-0010",
    notes: "Queue hygiene issue with potential operational noise."
  },
  {
    title: "Release cutover checklist does not include payment regression evidence",
    module: "Release Control",
    severity: "Medium",
    environment: "Staging",
    status: "Prevention Planned",
    expectedResult: "Cutover checklist should require evidence for payment submission, requeue, and downstream reconciliation.",
    actualResult: "Payment regression evidence is not listed in the release cutover checklist.",
    stepsToReproduce: "Open the staging release checklist, review mandatory evidence items, and compare against payment release scope.",
    affectedCaseIds: "CASE-2026-0011",
    notes: "Release control gap found during readiness review."
  }
];

async function main() {
  await prisma.defect.deleteMany();

  for (const defect of defects) {
    const analysis = defect.analyse ? generateMockAnalysis(defect) : null;
    await prisma.defect.create({
      data: {
        title: defect.title,
        module: defect.module,
        severity: defect.severity,
        environment: defect.environment,
        status: defect.status,
        expectedResult: defect.expectedResult,
        actualResult: defect.actualResult,
        stepsToReproduce: defect.stepsToReproduce,
        affectedCaseIds: defect.affectedCaseIds,
        notes: defect.notes,
        ...(analysis
          ? {
              rootCauseCategory: analysis.rootCauseCategory,
              rootCauseExplanation: analysis.rootCauseExplanation,
              similarRiskAreas: JSON.stringify(analysis.similarRiskAreas),
              preventionActions: JSON.stringify(analysis.preventionActions),
              uatScenarios: JSON.stringify(analysis.uatScenarios),
              cabSummary: analysis.cabSummary,
              releaseRisk: analysis.releaseRisk,
              rollbackConsideration: analysis.rollbackConsideration
            }
          : {})
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log(`Seeded ${defects.length} fictional defects.`);
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
