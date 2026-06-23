export type Severity = "Low" | "Medium" | "High" | "Critical";
export type Status = "Open" | "In Analysis" | "Prevention Planned" | "Closed";
export type Environment = "DEV" | "SIT" | "UAT" | "Staging" | "Production";

export type UatScenario = {
  id: string;
  scenario: string;
  given: string;
  when: string;
  then: string;
};

export type DefectSummary = {
  id: string;
  title: string;
  module: string;
  environment: Environment;
  severity: Severity;
  status: Status;
  affectedCaseIds: string;
  rootCauseCategory: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PreventionProgressEntry = {
  done: boolean;
  updatedAt: string;
};

export type PreventionProgress = Record<string, PreventionProgressEntry>;

export type PreventionSummary = {
  completed: number;
  total: number;
};

export type Defect = DefectSummary & {
  expectedResult: string;
  actualResult: string;
  stepsToReproduce: string;
  notes?: string | null;
  rootCauseExplanation?: string | null;
  similarRiskAreas: string[];
  preventionActions: string[];
  preventionProgress: PreventionProgress;
  preventionSummary: PreventionSummary;
  uatScenarios: UatScenario[];
  cabSummary?: string | null;
  releaseRisk?: Severity | null;
  rollbackConsideration?: string | null;
};

export type DefectInput = {
  title: string;
  module: string;
  environment: Environment;
  severity: Severity;
  status: Status;
  expectedResult: string;
  actualResult: string;
  stepsToReproduce: string;
  affectedCaseIds: string;
  notes?: string;
};

export type WeekBucket = {
  weekStart: string;
  count: number;
};

export type RootCauseBucket = {
  category: string;
  count: number;
};

export type Dashboard = {
  totalDefects: number;
  analysisCoverage: { analysed: number; total: number; percent: number };
  byStatus: Array<{ status: Status; count: number }>;
  bySeverity: Array<{ severity: Severity; count: number }>;
  byRootCause: Array<{ category: string; count: number }>;
  highRiskModules: Array<{ module: string; count: number }>;
  recentDefects: Array<{ id: string; title: string; severity: Severity; status: Status; createdAt: string }>;
  createdPerWeek: WeekBucket[];
  closedPerWeek: WeekBucket[];
  openByRootCause: RootCauseBucket[];
};

export type DefectListQuery = {
  status?: Status;
  severity?: Severity;
  module?: string;
  environment?: Environment;
  q?: string;
  page?: number;
  pageSize?: number;
};

export type PagedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type DefectEventType =
  | "CREATED"
  | "STATUS_CHANGED"
  | "ANALYSIS_GENERATED"
  | "PREVENTION_UPDATED"
  | "DELETED";

export type DefectEvent = {
  id: string;
  defectId: string;
  type: DefectEventType;
  summary: string;
  detail: Record<string, unknown> | null;
  createdAt: string;
};

export type ReleasePackDefect = {
  id: string;
  title: string;
  module: string;
  severity: Severity;
  status: Status;
  rootCauseCategory: string | null;
  releaseRisk: string | null;
  preventionProgress: { completed: number; total: number };
  cabSummary: string | null;
  rollbackConsideration: string | null;
};

export type ReleasePack = {
  generatedAt: string;
  summary: {
    totalDefects: number;
    openDefects: number;
    qualifyingDefects: number;
    analysisCoverage: { analysed: number; total: number; percent: number };
    riskDistribution: Array<{ risk: string; count: number }>;
  };
  defects: ReleasePackDefect[];
};

export type ApiError = {
  error: string;
  code?: string;
  fields?: Record<string, string>;
};
