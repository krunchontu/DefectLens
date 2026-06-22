export type UatScenario = {
  id: string;
  scenario: string;
  given: string;
  when: string;
  then: string;
};

export type AnalysisOutput = {
  rootCauseCategory: string;
  rootCauseExplanation: string;
  similarRiskAreas: string[];
  preventionActions: string[];
  uatScenarios: UatScenario[];
  cabSummary: string;
  releaseRisk: string;
  rollbackConsideration: string;
};
