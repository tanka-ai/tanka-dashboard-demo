export type CustomerStage = "线索初筛" | "方案沟通" | "商务谈判" | "签约推进" | "已签约";

export type RiskLevel = "low" | "medium" | "high";

export type FollowUpPriority = "normal" | "key" | "urgent";

export interface CustomerAccount {
  id: string;
  name: string;
  segment: "SMB" | "Mid-Market" | "Enterprise";
  industry: string;
  owner: string;
  contactName: string;
  role: string;
  arr: number;
  stage: CustomerStage;
  healthScore: number;
  lastContactAt: string;
  nextAction: string;
  priority: FollowUpPriority;
}

export interface FollowUpTask {
  id: string;
  title: string;
  type: "电话跟进" | "方案演示" | "商务复盘" | "续约沟通";
  accountId: string;
  accountName: string;
  owner: string;
  dueDate: string;
  priority: FollowUpPriority;
  riskLevel: RiskLevel;
  nextStep: string;
  notes: string;
}

export interface Opportunity {
  id: string;
  name: string;
  accountId: string;
  accountName: string;
  amount: number;
  owner: string;
  stage: CustomerStage;
  probability: number;
  expectedCloseDate: string;
}

export interface ActivityEntry {
  id: string;
  title: string;
  kind: "电话纪要" | "会议结论" | "商机更新" | "客户预警";
  accountId: string;
  accountName: string;
  owner: string;
  createdAt: string;
  summary: string;
}

export interface PipelineStageSummary {
  id: CustomerStage;
  name: CustomerStage;
  opportunityIds: string[];
  totalAmount: number;
  winRate: number;
}

export interface CrmMetrics {
  activeCustomers: number;
  todayFollowUps: number;
  openPipelineAmount: number;
  weightedForecastAmount: number;
  highRiskCustomers: number;
}
