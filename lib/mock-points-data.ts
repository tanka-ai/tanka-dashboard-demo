import type { PointLedgerEntry, PointsBreakdownItem, UserPointsProfile } from "@/lib/contracts";

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
