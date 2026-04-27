import type {
  PointLedgerEntry,
  PointsBreakdownItem,
  PointsHighlight,
  PointsTask,
  RewardCatalogItem,
  TeamPointsLeaderboardEntry,
  UserPointsProfile,
} from "@/lib/contracts";

export const userPointsProfile: UserPointsProfile = {
  userId: "user-lynn",
  userName: "Lynn",
  team: "客户成功一组",
  role: "高级客户经理",
  tier: "金卡",
  currentPoints: 12480,
  currentTierFloor: 10000,
  nextTier: "黑金",
  nextTierThreshold: 15000,
  monthlyEarnedPoints: 1680,
  pendingPoints: 260,
  expiringSoonPoints: 420,
  rank: 3,
  streakDays: 17,
  redeemableReward: "季度客户洞察工作坊名额",
};

export const userPointsBreakdown: PointsBreakdownItem[] = [
  {
    id: "source-follow-up",
    label: "客户回访完成",
    points: 720,
    share: 43,
  },
  {
    id: "source-opportunity",
    label: "商机阶段推进",
    points: 540,
    share: 32,
  },
  {
    id: "source-check-in",
    label: "连续签到与协作",
    points: 420,
    share: 25,
  },
];

export const pointLedgerEntries: PointLedgerEntry[] = [
  {
    id: "ledger-001",
    title: "Aurora Retail 商务复盘按时完成",
    category: "客户回访",
    pointsDelta: 180,
    occurredAt: "2026-04-27",
    status: "已入账",
    relatedAccount: "Aurora Retail",
  },
  {
    id: "ledger-002",
    title: "Lattice Cloud 签约推进进入法务确认",
    category: "商机推进",
    pointsDelta: 260,
    occurredAt: "2026-04-26",
    status: "待结算",
    relatedAccount: "Lattice Cloud",
  },
  {
    id: "ledger-003",
    title: "连续签到第 17 天",
    category: "签到加分",
    pointsDelta: 40,
    occurredAt: "2026-04-26",
    status: "已入账",
  },
  {
    id: "ledger-004",
    title: "兑换季度客户洞察资料包",
    category: "权益兑换",
    pointsDelta: -120,
    occurredAt: "2026-04-24",
    status: "已入账",
  },
];

export const teamPointsLeaderboard: TeamPointsLeaderboardEntry[] = [
  {
    id: "leader-zoe",
    userName: "Zoe",
    team: "客户成功二组",
    tier: "黑金",
    rank: 1,
    totalPoints: 13820,
    monthlyDelta: 2140,
    completedTasks: 16,
  },
  {
    id: "leader-alec",
    userName: "Alec",
    team: "销售增长组",
    tier: "黑金",
    rank: 2,
    totalPoints: 12940,
    monthlyDelta: 1930,
    completedTasks: 14,
  },
  {
    id: "leader-lynn",
    userName: "Lynn",
    team: "客户成功一组",
    tier: "金卡",
    rank: 3,
    totalPoints: 12480,
    monthlyDelta: 1680,
    completedTasks: 12,
  },
  {
    id: "leader-mika",
    userName: "Mika",
    team: "客户成功一组",
    tier: "金卡",
    rank: 4,
    totalPoints: 11860,
    monthlyDelta: 1510,
    completedTasks: 11,
  },
];

export const pointEarningTasks: PointsTask[] = [
  {
    id: "task-growth-001",
    title: "完成 3 个重点客户复盘纪要",
    category: "成长任务",
    pointsReward: 240,
    dueDate: "2026-04-30",
    assignee: "Lynn",
    completionRate: 67,
    status: "进行中",
  },
  {
    id: "task-daily-002",
    title: "本周连续签到满 5 天",
    category: "日常任务",
    pointsReward: 80,
    dueDate: "2026-05-01",
    assignee: "Lynn",
    completionRate: 80,
    status: "进行中",
  },
  {
    id: "task-team-003",
    title: "提交季度积分玩法优化建议",
    category: "团队活动",
    pointsReward: 120,
    dueDate: "2026-05-03",
    assignee: "Lynn",
    completionRate: 0,
    status: "待开始",
  },
];

export const rewardCatalog: RewardCatalogItem[] = [
  {
    id: "reward-001",
    title: "季度客户洞察工作坊",
    category: "培训资源",
    pointsCost: 1200,
    stockStatus: "充足",
    description: "支持跨团队复盘，适合高价值客户经营前的集中准备。",
  },
  {
    id: "reward-002",
    title: "客户共创拜访名额",
    category: "客户权益",
    pointsCost: 900,
    stockStatus: "紧张",
    description: "可兑换一次由运营负责人陪同参与的关键客户拜访机会。",
  },
  {
    id: "reward-003",
    title: "团队庆功基金",
    category: "团队激励",
    pointsCost: 1500,
    stockStatus: "充足",
    description: "用于团队里程碑庆祝或专项冲刺后的内部激励。",
  },
];

export const pointDashboardHighlights: PointsHighlight[] = [
  {
    id: "highlight-tier",
    title: "升级窗口",
    description: "距离黑金等级还差 2,520 分，建议优先完成成长任务和客户经营类加分项。",
    tone: "accent",
    metricLabel: "目标等级",
    metricValue: "黑金 / 15,000",
  },
  {
    id: "highlight-expiring",
    title: "即将过期",
    description: "未来 14 天有 420 分到期，建议优先兑换培训资源或团队激励。",
    tone: "warning",
    metricLabel: "过期积分",
    metricValue: "420",
  },
  {
    id: "highlight-settlement",
    title: "待结算提醒",
    description: "有 260 分待结算，主要来自法务推进与周复盘任务，预计明日统一入账。",
    tone: "success",
    metricLabel: "待结算",
    metricValue: "260",
  },
];
