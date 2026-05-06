import { unstable_noStore as noStore } from "next/cache";
import { headers } from "next/headers";

import type {
  PersonalPointsEntry,
  PointsDashboardAnalytics,
  PointsDashboardData,
  PointsDashboardLoadResult,
  TeamPointsEntry,
} from "@/lib/contracts";

const APP_ID = "dashboard-demo";
const LIST_BASES_PATH = `/api/apps/${APP_ID}/data-sources/airtable/bases`;
const PLATFORM_ORIGIN_ENV_KEYS = ["TANKA_PLATFORM_API_URL", "APP_URL", "NEXT_PUBLIC_APP_URL"] as const;

const PERSON_NAME_FIELD_ALIASES = [
  "userName",
  "fullName",
  "name",
  "member",
  "memberName",
  "employee",
  "employeeName",
  "person",
  "personName",
  "owner",
  "ownerName",
  "assignee",
  "assigneeName",
  "成员",
  "姓名",
  "负责人",
] as const;

const TEAM_FIELD_ALIASES = [
  "team",
  "teamName",
  "department",
  "departmentName",
  "group",
  "groupName",
  "squad",
  "squadName",
  "组织",
  "团队",
  "小组",
  "部门",
] as const;

const ROLE_FIELD_ALIASES = ["role", "roleName", "title", "jobTitle", "position", "岗位", "角色", "职位"] as const;

const TOTAL_POINTS_FIELD_ALIASES = [
  "currentPoints",
  "totalPoints",
  "balancePoints",
  "availablePoints",
  "pointsTotal",
  "积分余额",
  "总积分",
  "当前积分",
  "可用积分",
  "积分",
] as const;

const MONTHLY_DELTA_FIELD_ALIASES = [
  "monthlyDelta",
  "monthlyPoints",
  "monthlyEarnedPoints",
  "monthEarned",
  "monthGain",
  "本月新增",
  "本月积分",
  "月增量",
  "月度积分",
  "增长积分",
] as const;

const UPDATED_AT_FIELD_ALIASES = [
  "updatedAt",
  "updated_at",
  "lastUpdated",
  "lastModified",
  "modifiedTime",
  "更新时间",
  "最后更新时间",
  "最后修改时间",
] as const;

const NORMALIZED_USER_TABLE_ALIASES = ["point_user", "points_user", "user_points", "member_points"] as const;
const NORMALIZED_LEDGER_TABLE_ALIASES = ["point_ledger", "points_ledger", "ledger_points", "score_ledger"] as const;
const NORMALIZED_WORK_ITEM_TABLE_ALIASES = [
  "point_work_item",
  "points_work_item",
  "work_item_points",
  "work_item",
] as const;
const NORMALIZED_EVALUATION_TABLE_ALIASES = [
  "point_evaluation",
  "points_evaluation",
  "evaluation_points",
  "score_evaluation",
] as const;
const USER_IDENTIFIER_FIELD_ALIASES = ["user_id", "userId", "member_id", "memberId", "employeeId"] as const;
const LEDGER_POINTS_FIELD_ALIASES = [
  "delta_score",
  "pointsDelta",
  "deltaPoints",
  "scoreDelta",
  "effective_score",
  "积分变动",
  "积分变化",
  "积分值",
] as const;
const LEDGER_USER_REFERENCE_FIELD_ALIASES = ["user_id", "userId", "memberId", "personId"] as const;
const LEDGER_DATE_FIELD_ALIASES = [
  "accounting_date",
  "accountingDate",
  "occurredAt",
  "earnedAt",
  "createdDate",
  "记账日期",
  "积分日期",
] as const;
const INACTIVE_LEDGER_STATUS_TOKENS = [
  "revoked",
  "rejected",
  "draft",
  "pending",
  "cancelled",
  "作废",
  "撤销",
  "驳回",
  "草稿",
  "待审核",
] as const;

const TOTAL_POINTS_EXCLUDED_TOKENS = [
  "delta",
  "change",
  "reward",
  "cost",
  "spent",
  "redeem",
  "pending",
  "earned",
  "新增",
  "增量",
  "奖励",
  "成本",
  "兑换",
  "待结算",
] as const;

const NEGATIVE_TABLE_HINTS = ["ledger", "transaction", "reward", "task", "activity", "log", "流水", "任务", "兑换"] as const;
const POSITIVE_TABLE_HINTS = [
  "point",
  "leaderboard",
  "member",
  "people",
  "personal",
  "user",
  "score",
  "积分",
  "排行",
  "成员",
] as const;

type JsonObject = Record<string, unknown>;

interface AirtableBaseMeta {
  id: string;
  name: string;
}

interface AirtableTableMeta {
  id: string;
  name: string;
}

interface DraftMemberRow {
  id: string;
  userName: string;
  teamName: string;
  role: string | null;
  totalPoints: number;
  monthlyDelta: number | null;
  updatedAt: string | null;
}

interface TableCandidate {
  sourceMode: "normalized-ledger" | "single-table";
  tableName: string;
  members: DraftMemberRow[];
  analytics: PointsDashboardAnalytics | null;
  score: number;
  hasMonthlyDelta: boolean;
  hasRole: boolean;
  fallbackTeamCount: number;
  duplicateCount: number;
  latestUpdatedAt: string | null;
}

interface NormalizedUserDirectoryRow {
  recordId: string;
  externalUserId: string | null;
  userName: string;
  teamName: string;
  role: string | null;
  updatedAt: string | null;
}

interface NormalizedLedgerRow {
  id: string;
  userReferenceIds: string[];
  deltaScore: number;
  occurredAt: string | null;
  status: string | null;
  createdTime: string | null;
}

interface NormalizedWorkItemRow {
  id: string;
  status: string | null;
  taskKind: string | null;
  sourceType: string | null;
}

interface NormalizedEvaluationRow {
  id: string;
  status: string | null;
  pointKind: string | null;
  effectiveScore: number;
}

export async function getPointsDashboardData(): Promise<PointsDashboardLoadResult> {
  noStore();

  try {
    const origin = await resolveRuntimeOrigin();
    const basesPayload = await fetchJson(origin, LIST_BASES_PATH, "读取 Airtable base 列表");
    const bases = parseBaseList(basesPayload);
    if (!bases.length) {
      return {
        status: "error",
        error: {
          code: "BASE_NOT_FOUND",
          message: "当前 Airtable token 下没有可读取的 base。",
          detail: "请确认平台运行时已配置正确的 Airtable Token，并且当前应用可访问至少一个 base。",
        },
      };
    }

    const inspectionResults = await Promise.allSettled(bases.map((base) => inspectBase(origin, base)));
    const warnings = inspectionResults.flatMap((result) =>
      result.status === "rejected" ? [getUnknownErrorMessage(result.reason)] : result.value.warnings,
    );

    let scannedTableCount = 0;
    const candidates = inspectionResults.flatMap((result) => {
      if (result.status !== "fulfilled") {
        return [];
      }

      scannedTableCount += result.value.tableCount;
      if (!result.value.candidate) {
        return [];
      }

      return [
        {
          base: result.value.base,
          candidate: result.value.candidate,
        },
      ];
    });

    if (!scannedTableCount) {
      return {
        status: "error",
        error: {
          code: "TABLES_NOT_FOUND",
          message: "当前可访问的 Airtable base 下没有可读取的数据表。",
          detail: "请确认当前 token 对目标 base 的表拥有读取权限。",
        },
      };
    }

    const bestCandidate = candidates.sort((left, right) => right.candidate.score - left.candidate.score)[0];

    if (!bestCandidate || !bestCandidate.candidate.members.length) {
      return {
        status: "error",
        error: {
          code: "POINTS_TABLE_NOT_FOUND",
          message: "没有识别出可用于积分看板的 Airtable 数据结构。",
          detail: `已扫描 ${bases.length} 个 base、${scannedTableCount} 张表。请优先提供 point_user + point_ledger，或至少提供包含成员、团队和累计积分字段的单表。`,
        },
      };
    }

    return {
      status: "ready",
      data: buildDashboardData(bestCandidate.base, bestCandidate.candidate, warnings),
    };
  } catch (error) {
    return {
      status: "error",
      error: {
        code: "RUNTIME_UNAVAILABLE",
        message: "当前无法从平台运行时读取 Airtable 数据。",
        detail: getUnknownErrorMessage(error),
      },
    };
  }
}

async function inspectBase(origin: string, base: AirtableBaseMeta) {
  const tablesPayload = await fetchJson(
    origin,
    `/api/apps/${APP_ID}/data-sources/airtable/bases/${encodeURIComponent(base.id)}/tables`,
    `读取 base ${base.name} 的表列表`,
  );
  const tables = parseTableList(tablesPayload);

  if (!tables.length) {
    return {
      base,
      tableCount: 0,
      candidate: null,
      warnings: [] as string[],
    };
  }

  const normalizedCandidate = await loadNormalizedPointsCandidate(origin, base, tables);
  if (normalizedCandidate.candidate) {
    return {
      base,
      tableCount: tables.length,
      candidate: normalizedCandidate.candidate,
      warnings: normalizedCandidate.warnings,
    };
  }

  const tableResults = await Promise.allSettled(tables.map((table) => loadTableCandidate(origin, base.id, table)));
  const warnings = [
    ...normalizedCandidate.warnings,
    ...tableResults.flatMap((result) =>
      result.status === "rejected"
        ? [`base “${base.name}” 读取表失败：${getUnknownErrorMessage(result.reason)}`]
        : result.value.warnings,
    ),
  ];

  const candidates = tableResults.flatMap((result) => {
    if (result.status !== "fulfilled" || !result.value.candidate) {
      return [];
    }

    return [result.value.candidate];
  });

  return {
    base,
    tableCount: tables.length,
    candidate: candidates.sort((left, right) => right.score - left.score)[0] ?? null,
    warnings,
  };
}

async function loadNormalizedPointsCandidate(
  origin: string,
  base: AirtableBaseMeta,
  tables: AirtableTableMeta[],
): Promise<{ candidate: TableCandidate | null; warnings: string[] }> {
  const userTable = findTableByAliases(tables, NORMALIZED_USER_TABLE_ALIASES);
  const ledgerTable = findTableByAliases(tables, NORMALIZED_LEDGER_TABLE_ALIASES);
  const workItemTable = findTableByAliases(tables, NORMALIZED_WORK_ITEM_TABLE_ALIASES);
  const evaluationTable = findTableByAliases(tables, NORMALIZED_EVALUATION_TABLE_ALIASES);

  if (!userTable || !ledgerTable) {
    return {
      candidate: null,
      warnings: [] as string[],
    };
  }

  const [userPayload, ledgerPayload, workItemPayload, evaluationPayload] = await Promise.all([
    fetchJson(
      origin,
      `/api/apps/${APP_ID}/query/airtable?baseId=${encodeURIComponent(base.id)}&table=${encodeURIComponent(userTable.name)}`,
      `读取表 ${userTable.name}`,
    ),
    fetchJson(
      origin,
      `/api/apps/${APP_ID}/query/airtable?baseId=${encodeURIComponent(base.id)}&table=${encodeURIComponent(ledgerTable.name)}`,
      `读取表 ${ledgerTable.name}`,
    ),
    workItemTable
      ? fetchJson(
          origin,
          `/api/apps/${APP_ID}/query/airtable?baseId=${encodeURIComponent(base.id)}&table=${encodeURIComponent(workItemTable.name)}`,
          `读取表 ${workItemTable.name}`,
        )
      : Promise.resolve(null),
    evaluationTable
      ? fetchJson(
          origin,
          `/api/apps/${APP_ID}/query/airtable?baseId=${encodeURIComponent(base.id)}&table=${encodeURIComponent(evaluationTable.name)}`,
          `读取表 ${evaluationTable.name}`,
        )
      : Promise.resolve(null),
  ]);

  const users = parseRecordList(userPayload).map(mapNormalizedUserRow).filter((row): row is NormalizedUserDirectoryRow => {
    return row !== null;
  });
  const ledgers = parseRecordList(ledgerPayload).map(mapNormalizedLedgerRow).filter((row): row is NormalizedLedgerRow => {
    return row !== null;
  });
  const workItems = workItemPayload
    ? parseRecordList(workItemPayload).map(mapNormalizedWorkItemRow).filter((row): row is NormalizedWorkItemRow => {
        return row !== null;
      })
    : [];
  const evaluations = evaluationPayload
    ? parseRecordList(evaluationPayload)
        .map(mapNormalizedEvaluationRow)
        .filter((row): row is NormalizedEvaluationRow => {
          return row !== null;
        })
    : [];

  if (!users.length || !ledgers.length) {
    return {
      candidate: null,
      warnings: [
        `base “${base.name}” 已识别到 ${userTable.name} / ${ledgerTable.name}，但可聚合的用户或积分流水为空。`,
      ],
    };
  }

  const aggregated = aggregateMembersFromLedger(users, ledgers);
  if (!aggregated.members.length) {
    return {
      candidate: null,
      warnings: aggregated.warnings,
    };
  }

  return {
    candidate: {
      sourceMode: "normalized-ledger",
      tableName: `${userTable.name} + ${ledgerTable.name}`,
      members: aggregated.members,
      analytics: buildNormalizedAnalytics(aggregated.members, aggregated.activeLedgers, workItems, evaluations),
      score: scoreNormalizedCandidate(userTable.name, ledgerTable.name, aggregated.members.length, ledgers.length),
      hasMonthlyDelta: aggregated.members.some((member) => member.monthlyDelta !== null),
      hasRole: aggregated.members.some((member) => member.role),
      fallbackTeamCount: aggregated.members.filter((member) => member.teamName === "未分组").length,
      duplicateCount: 0,
      latestUpdatedAt: aggregated.latestUpdatedAt,
    },
    warnings: aggregated.warnings,
  };
}

async function loadTableCandidate(
  origin: string,
  baseId: string,
  table: AirtableTableMeta,
): Promise<{ candidate: TableCandidate | null; warnings: string[] }> {
  const payload = await fetchJson(
    origin,
    `/api/apps/${APP_ID}/query/airtable?baseId=${encodeURIComponent(baseId)}&table=${encodeURIComponent(table.name)}`,
    `读取表 ${table.name}`,
  );
  const records = parseRecordList(payload);
  const mappedRows = records.map(mapMemberRow).filter((row): row is DraftMemberRow => row !== null);
  const members = consolidateMembers(mappedRows);

  if (!members.length) {
    return { candidate: null, warnings: [] as string[] };
  }

  const hasMonthlyDelta = members.some((member) => member.monthlyDelta !== null);
  const hasRole = members.some((member) => member.role);
  const fallbackTeamCount = members.filter((member) => member.teamName === "未分组").length;
  const duplicateCount = Math.max(mappedRows.length - members.length, 0);
  const latestUpdatedAt = members.reduce<string | null>((latest, member) => {
    if (!member.updatedAt) {
      return latest;
    }

    if (!latest || Date.parse(member.updatedAt) > Date.parse(latest)) {
      return member.updatedAt;
    }

    return latest;
  }, null);

  return {
    candidate: {
      sourceMode: "single-table",
      tableName: table.name,
      members,
      analytics: null,
      score: scoreTableCandidate(table.name, members, {
        hasMonthlyDelta,
        hasRole,
        fallbackTeamCount,
        duplicateCount,
      }),
      hasMonthlyDelta,
      hasRole,
      fallbackTeamCount,
      duplicateCount,
      latestUpdatedAt,
    },
    warnings: [] as string[],
  };
}

function aggregateMembersFromLedger(users: NormalizedUserDirectoryRow[], ledgers: NormalizedLedgerRow[]) {
  const warnings: string[] = [];
  const userDirectory = new Map<string, NormalizedUserDirectoryRow>();

  for (const user of users) {
    userDirectory.set(user.recordId, user);
    if (user.externalUserId) {
      userDirectory.set(normalizeToken(user.externalUserId), user);
    }
  }

  const activeLedgers = ledgers.filter((ledger) => shouldIncludeLedger(ledger.status));
  const skippedLedgerCount = ledgers.length - activeLedgers.length;
  if (skippedLedgerCount > 0) {
    warnings.push(`积分流水中有 ${skippedLedgerCount} 条非生效记录，已在看板统计中自动跳过。`);
  }

  const latestBusinessDate = activeLedgers.reduce<string | null>((latest, ledger) => {
    if (!ledger.occurredAt) {
      return latest;
    }

    if (!latest || Date.parse(ledger.occurredAt) > Date.parse(latest)) {
      return ledger.occurredAt;
    }

    return latest;
  }, null);
  const monthlyReference = latestBusinessDate ? latestBusinessDate.slice(0, 7) : null;

  const members = new Map<string, DraftMemberRow>();
  let unresolvedLedgerCount = 0;

  for (const ledger of activeLedgers) {
    const resolvedUsers = ledger.userReferenceIds
      .map((referenceId) => userDirectory.get(referenceId) ?? userDirectory.get(normalizeToken(referenceId)))
      .filter((user): user is NormalizedUserDirectoryRow => user !== undefined)
      .filter(deduplicateBy((user) => user.recordId));

    if (!resolvedUsers.length) {
      unresolvedLedgerCount += 1;
      continue;
    }

    for (const user of resolvedUsers) {
      const current = members.get(user.recordId) ?? {
        id: user.recordId,
        userName: user.userName,
        teamName: user.teamName,
        role: user.role,
        totalPoints: 0,
        monthlyDelta: monthlyReference ? 0 : null,
        updatedAt: user.updatedAt,
      };

      current.totalPoints += ledger.deltaScore;
      current.role = current.role ?? user.role;
      current.teamName = current.teamName || user.teamName || "未分组";

      if (monthlyReference && ledger.occurredAt?.startsWith(monthlyReference)) {
        current.monthlyDelta = (current.monthlyDelta ?? 0) + ledger.deltaScore;
      }

      current.updatedAt = pickLatestTimestamp(current.updatedAt, ledger.createdTime ?? ledger.occurredAt ?? null);
      members.set(user.recordId, current);
    }
  }

  if (unresolvedLedgerCount > 0) {
    warnings.push(`积分流水中有 ${unresolvedLedgerCount} 条记录未能关联到成员，已跳过这些数据。`);
  }

  for (const user of users) {
    if (members.has(user.recordId)) {
      continue;
    }

    members.set(user.recordId, {
      id: user.recordId,
      userName: user.userName,
      teamName: user.teamName,
      role: user.role,
      totalPoints: 0,
      monthlyDelta: monthlyReference ? 0 : null,
      updatedAt: user.updatedAt,
    });
  }

  const latestUpdatedAt = [...users.map((user) => user.updatedAt), ...activeLedgers.map((ledger) => ledger.createdTime)]
    .filter((value): value is string => Boolean(value))
    .reduce<string | null>((latest, value) => pickLatestTimestamp(latest, value), null);

  return {
    members: Array.from(members.values()),
    activeLedgers,
    latestUpdatedAt,
    warnings,
  };
}

function buildNormalizedAnalytics(
  members: DraftMemberRow[],
  activeLedgers: NormalizedLedgerRow[],
  workItems: NormalizedWorkItemRow[],
  evaluations: NormalizedEvaluationRow[],
): PointsDashboardAnalytics {
  const latestCycleDate = activeLedgers.reduce<string | null>((latest, ledger) => {
    if (!ledger.occurredAt) {
      return latest;
    }

    if (!latest || Date.parse(ledger.occurredAt) > Date.parse(latest)) {
      return ledger.occurredAt;
    }

    return latest;
  }, null);
  const currentCycleLabel = latestCycleDate ? latestCycleDate.slice(0, 7) : null;
  const currentCyclePoints = currentCycleLabel
    ? roundScore(
        activeLedgers
          .filter((ledger) => ledger.occurredAt?.startsWith(currentCycleLabel))
          .reduce((sum, ledger) => sum + ledger.deltaScore, 0),
      )
    : null;

  const roleBreakdown = Array.from(
    members.reduce((map, member) => {
      const roleName = member.role ?? "未标注角色";
      const current = map.get(roleName) ?? {
        id: `role-${normalizeToken(roleName)}`,
        roleName,
        memberCount: 0,
        totalPoints: 0,
        averagePoints: 0,
      };
      current.memberCount += 1;
      current.totalPoints += member.totalPoints;
      map.set(roleName, current);
      return map;
    }, new Map<string, { id: string; roleName: string; memberCount: number; totalPoints: number; averagePoints: number }>()),
  )
    .map(([, role]) => ({
      ...role,
      totalPoints: roundScore(role.totalPoints),
      averagePoints: role.memberCount ? roundScore(role.totalPoints / role.memberCount) : 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints);

  const workItemStages = summarizeStageCounts(
    workItems.map((item) => item.status),
    [
      ["DRAFT", "草稿", "neutral"],
      ["RUNNING", "进行中", "accent"],
      ["SUBMITTED", "已提交", "warning"],
      ["REVIEWING", "评审中", "accent"],
      ["CLOSED", "已关闭", "success"],
    ],
  );
  const evaluationStages = summarizeStageCounts(
    evaluations.map((item) => item.status),
    [
      ["PENDING", "待审核", "warning"],
      ["APPROVED", "待生效", "accent"],
      ["EFFECTIVE", "已生效", "success"],
      ["REJECTED", "已驳回", "neutral"],
    ],
  );
  const taskTypeBreakdown = summarizeStageCounts(
    workItems.map((item) => item.taskKind),
    [
      ["DAILY", "日常任务", "accent"],
      ["INNOVATION", "创新事项", "success"],
      ["MENTOR", "辅导赋能", "warning"],
      ["INCIDENT", "事故处理", "neutral"],
    ],
  );

  const pointComposition = Array.from(
    evaluations.reduce((map, evaluation) => {
      const pointKind = normalizeToken(evaluation.pointKind ?? "BASE").toUpperCase();
      const config = getPointKindConfig(pointKind);
      const current = map.get(config.id) ?? {
        id: config.id,
        label: config.label,
        count: 0,
        points: 0,
      };
      current.count += 1;
      current.points += config.sign * evaluation.effectiveScore;
      map.set(config.id, current);
      return map;
    }, new Map<string, { id: string; label: string; count: number; points: number }>()),
  )
    .map(([, item]) => ({
      ...item,
      points: roundScore(item.points),
    }))
    .sort((left, right) => Math.abs(right.points) - Math.abs(left.points));

  return {
    ops: {
      currentCycleLabel,
      currentCyclePoints,
      effectiveLedgerCount: activeLedgers.length,
      activeMemberCount: members.filter((member) => member.totalPoints > 0).length,
      zeroPointMemberCount: members.filter((member) => member.totalPoints <= 0).length,
      openWorkItemCount: workItems.length ? workItems.filter((item) => item.status !== "CLOSED").length : null,
      pendingEvaluationCount: evaluations.length
        ? evaluations.filter((item) => item.status === "PENDING").length
        : null,
      approvedEvaluationCount: evaluations.length
        ? evaluations.filter((item) => item.status === "APPROVED").length
        : null,
    },
    roleBreakdown,
    workItemStages,
    evaluationStages,
    taskTypeBreakdown,
    pointComposition,
  };
}

function buildDashboardData(
  base: AirtableBaseMeta,
  candidate: TableCandidate,
  inheritedWarnings: string[],
): PointsDashboardData {
  const personalLeaderboard: PersonalPointsEntry[] = candidate.members
    .slice()
    .sort((left, right) => {
      if (right.totalPoints !== left.totalPoints) {
        return right.totalPoints - left.totalPoints;
      }

      const rightDelta = right.monthlyDelta ?? Number.NEGATIVE_INFINITY;
      const leftDelta = left.monthlyDelta ?? Number.NEGATIVE_INFINITY;
      if (rightDelta !== leftDelta) {
        return rightDelta - leftDelta;
      }

      return left.userName.localeCompare(right.userName, "zh-CN");
    })
    .map((member, index) => ({
      id: member.id,
      rank: index + 1,
      userName: member.userName,
      teamName: member.teamName,
      role: member.role,
      totalPoints: member.totalPoints,
      monthlyDelta: member.monthlyDelta,
    }));

  const totalPoints = personalLeaderboard.reduce((sum, entry) => sum + entry.totalPoints, 0);
  const averagePoints = personalLeaderboard.length ? Math.round(totalPoints / personalLeaderboard.length) : 0;

  const teamMap = new Map<
    string,
    {
      teamName: string;
      totalPoints: number;
      monthlyDelta: number;
      hasMonthlyDelta: boolean;
      members: PersonalPointsEntry[];
    }
  >();

  for (const member of personalLeaderboard) {
    const current = teamMap.get(member.teamName) ?? {
      teamName: member.teamName,
      totalPoints: 0,
      monthlyDelta: 0,
      hasMonthlyDelta: false,
      members: [],
    };
    current.totalPoints += member.totalPoints;
    if (member.monthlyDelta !== null) {
      current.monthlyDelta += member.monthlyDelta;
      current.hasMonthlyDelta = true;
    }
    current.members.push(member);
    teamMap.set(member.teamName, current);
  }

  const teamLeaderboard: TeamPointsEntry[] = Array.from(teamMap.values())
    .sort((left, right) => {
      if (right.totalPoints !== left.totalPoints) {
        return right.totalPoints - left.totalPoints;
      }

      return left.teamName.localeCompare(right.teamName, "zh-CN");
    })
    .map((team, index) => {
      const topPerformer = team.members
        .slice()
        .sort((left, right) => right.totalPoints - left.totalPoints)[0];

      return {
        id: `team-${normalizeToken(team.teamName)}`,
        rank: index + 1,
        teamName: team.teamName,
        totalPoints: team.totalPoints,
        averagePoints: Math.round(team.totalPoints / team.members.length),
        memberCount: team.members.length,
        topPerformerName: topPerformer?.userName ?? "未识别",
        monthlyDelta: team.hasMonthlyDelta ? team.monthlyDelta : null,
        shareOfTotal: totalPoints > 0 ? Math.round((team.totalPoints / totalPoints) * 100) : 0,
      };
    });

  const fastestGrowingTeam = teamLeaderboard
    .filter((team) => team.monthlyDelta !== null)
    .slice()
    .sort((left, right) => (right.monthlyDelta ?? 0) - (left.monthlyDelta ?? 0))[0];

  const topTeam = teamLeaderboard[0];
  const topPerformer = personalLeaderboard[0];

  const warnings = [...inheritedWarnings];
  if (candidate.sourceMode === "single-table" && !candidate.hasMonthlyDelta) {
    warnings.push(`表 “${candidate.tableName}” 未识别到“本月新增”字段，增量指标已自动隐藏。`);
  }
  if (!candidate.hasRole) {
    warnings.push(`表 “${candidate.tableName}” 未识别到“角色/岗位”字段，个人榜单将不展示岗位信息。`);
  }
  if (candidate.fallbackTeamCount > 0) {
    warnings.push(`有 ${candidate.fallbackTeamCount} 条个人记录未识别团队字段，已归入“未分组”。`);
  }
  if (candidate.duplicateCount > 0) {
    warnings.push(`检测到重复成员快照，已按更新时间或更高积分自动去重 ${candidate.duplicateCount} 条记录。`);
  }

  return {
    baseId: base.id,
    baseName: base.name,
    sourceMode: candidate.sourceMode,
    sourceTableName: candidate.tableName,
    lastSyncedAt: candidate.latestUpdatedAt,
    warnings,
    personalLeaderboard,
    teamLeaderboard,
    analytics: candidate.analytics,
    summary: {
      teamCount: teamLeaderboard.length,
      memberCount: personalLeaderboard.length,
      totalPoints,
      averagePoints,
      membersAboveAverage: personalLeaderboard.filter((member) => member.totalPoints >= averagePoints).length,
      topTeamName: topTeam?.teamName ?? "暂无",
      topTeamPoints: topTeam?.totalPoints ?? 0,
      topTeamSharePercent: totalPoints > 0 && topTeam ? Math.round((topTeam.totalPoints / totalPoints) * 100) : 0,
      topPerformerName: topPerformer?.userName ?? "暂无",
      topPerformerPoints: topPerformer?.totalPoints ?? 0,
      fastestGrowingTeamName: fastestGrowingTeam?.teamName ?? null,
      fastestGrowingTeamDelta: fastestGrowingTeam?.monthlyDelta ?? null,
    },
  };
}

async function resolveRuntimeOrigin() {
  for (const envKey of PLATFORM_ORIGIN_ENV_KEYS) {
    const envValue = process.env[envKey];
    if (envValue) {
      return envValue.replace(/\/$/, "");
    }
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol =
    headerStore.get("x-forwarded-proto") ??
    (host?.includes("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https");

  if (host) {
    return `${protocol}://${host}`;
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  }

  throw new Error("无法推断平台运行时地址，请配置 TANKA_PLATFORM_API_URL，或确保当前请求包含可用的 host header。");
}

async function fetchJson(origin: string, path: string, actionLabel: string) {
  const response = await fetch(`${origin}${path}`, {
    cache: "no-store",
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`${actionLabel}失败，状态码 ${response.status}`);
  }

  return (await response.json()) as unknown;
}

function parseBaseList(payload: unknown) {
  return extractObjectArrays(payload)
    .flatMap((items) =>
      items
        .map((item) => {
          const id = pickStringValue(item, ["id", "baseId", "base_id"]);
          const name = pickStringValue(item, ["name", "baseName", "label", "title"]);
          return id && name ? { id, name } : null;
        })
        .filter((item): item is AirtableBaseMeta => item !== null),
    )
    .filter(deduplicateBy((base) => `${base.id}:${base.name}`));
}

function parseTableList(payload: unknown) {
  return extractObjectArrays(payload)
    .flatMap((items) =>
      items
        .map((item) => {
          const id = pickStringValue(item, ["id", "tableId", "table_id"]) ?? normalizeToken(JSON.stringify(item));
          const name = pickStringValue(item, ["name", "tableName", "label", "title"]);
          return name ? { id, name } : null;
        })
        .filter((item): item is AirtableTableMeta => item !== null),
    )
    .filter(deduplicateBy((table) => table.name));
}

function findTableByAliases(tables: AirtableTableMeta[], aliases: readonly string[]) {
  const normalizedAliases = aliases.map(normalizeToken);

  return (
    tables.find((table) => {
      const normalizedName = normalizeToken(table.name);
      return normalizedAliases.some((alias) => normalizedName === alias || normalizedName.includes(alias));
    }) ?? null
  );
}

function parseRecordList(payload: unknown) {
  return extractObjectArrays(payload).flatMap((items) => items);
}

function mapNormalizedUserRow(record: JsonObject): NormalizedUserDirectoryRow | null {
  const fields = getRecordFields(record);
  const userName = pickStringField(fields, PERSON_NAME_FIELD_ALIASES);

  if (!userName) {
    return null;
  }

  return {
    recordId: pickStringValue(record, ["id", "recordId"]) ?? `user-${normalizeToken(userName)}`,
    externalUserId: pickStringField(fields, USER_IDENTIFIER_FIELD_ALIASES),
    userName,
    teamName: pickStringField(fields, TEAM_FIELD_ALIASES) ?? "未分组",
    role: pickStringField(fields, ROLE_FIELD_ALIASES),
    updatedAt: pickDateValue(record, ["createdTime", "created_at"]) ?? pickDateField(fields, UPDATED_AT_FIELD_ALIASES),
  };
}

function mapNormalizedLedgerRow(record: JsonObject): NormalizedLedgerRow | null {
  const fields = getRecordFields(record);
  const deltaScore = pickNumberField(fields, LEDGER_POINTS_FIELD_ALIASES, []);
  const userReferenceIds = pickStringArrayField(fields, LEDGER_USER_REFERENCE_FIELD_ALIASES);

  if (deltaScore === null || !userReferenceIds.length) {
    return null;
  }

  return {
    id:
      pickStringValue(record, ["id", "recordId"]) ??
      pickStringField(fields, ["ledger_code", "ledgerId", "ledger_id"]) ??
      `ledger-${normalizeToken(JSON.stringify(userReferenceIds))}-${String(deltaScore)}`,
    userReferenceIds,
    deltaScore,
    occurredAt: pickDateField(fields, LEDGER_DATE_FIELD_ALIASES),
    status: pickStringField(fields, ["status"]),
    createdTime: pickDateValue(record, ["createdTime", "created_at"]),
  };
}

function mapNormalizedWorkItemRow(record: JsonObject): NormalizedWorkItemRow | null {
  const fields = getRecordFields(record);
  const title = pickStringField(fields, ["title", "name"]);

  if (!title) {
    return null;
  }

  return {
    id:
      pickStringValue(record, ["id", "recordId"]) ??
      pickStringField(fields, ["work_item_id", "workItemId"]) ??
      `work-item-${normalizeToken(title)}`,
    status: pickStringField(fields, ["status"]),
    taskKind: pickStringField(fields, ["task_kind", "taskKind", "category"]),
    sourceType: pickStringField(fields, ["source_type", "sourceType"]),
  };
}

function mapNormalizedEvaluationRow(record: JsonObject): NormalizedEvaluationRow | null {
  const fields = getRecordFields(record);
  const effectiveScore = pickNumberField(fields, ["effective_score", "effectiveScore", "score"], []);

  if (effectiveScore === null) {
    return null;
  }

  return {
    id:
      pickStringValue(record, ["id", "recordId"]) ??
      pickStringField(fields, ["evaluation_id", "evaluationId", "eval_code"]) ??
      `evaluation-${String(effectiveScore)}`,
    status: pickStringField(fields, ["status"]),
    pointKind: pickStringField(fields, ["point_kind", "pointKind", "eval_type"]),
    effectiveScore,
  };
}

function mapMemberRow(record: JsonObject): DraftMemberRow | null {
  const fields = getRecordFields(record);
  const userName = pickStringField(fields, PERSON_NAME_FIELD_ALIASES);
  const totalPoints = pickNumberField(fields, TOTAL_POINTS_FIELD_ALIASES, TOTAL_POINTS_EXCLUDED_TOKENS);

  if (!userName || totalPoints === null) {
    return null;
  }

  const teamName = pickStringField(fields, TEAM_FIELD_ALIASES) ?? "未分组";
  const recordId =
    pickStringValue(record, ["id", "recordId"]) ??
    `member-${normalizeToken(userName)}-${normalizeToken(teamName)}`;
  const role = pickStringField(fields, ROLE_FIELD_ALIASES);
  const monthlyDelta = pickNumberField(fields, MONTHLY_DELTA_FIELD_ALIASES, []);
  const updatedAt = pickDateField(fields, UPDATED_AT_FIELD_ALIASES);

  return {
    id: recordId,
    userName,
    teamName,
    role,
    totalPoints,
    monthlyDelta,
    updatedAt,
  };
}

function consolidateMembers(rows: DraftMemberRow[]) {
  const memberMap = new Map<string, DraftMemberRow>();

  for (const row of rows) {
    const key = `${normalizeToken(row.userName)}:${normalizeToken(row.teamName)}`;
    const existing = memberMap.get(key);

    if (!existing) {
      memberMap.set(key, row);
      continue;
    }

    memberMap.set(key, choosePreferredRow(existing, row));
  }

  return Array.from(memberMap.values());
}

function choosePreferredRow(left: DraftMemberRow, right: DraftMemberRow) {
  const leftTimestamp = left.updatedAt ? Date.parse(left.updatedAt) : Number.NaN;
  const rightTimestamp = right.updatedAt ? Date.parse(right.updatedAt) : Number.NaN;

  if (Number.isFinite(leftTimestamp) && Number.isFinite(rightTimestamp) && leftTimestamp !== rightTimestamp) {
    return rightTimestamp > leftTimestamp ? right : left;
  }

  if (Number.isFinite(rightTimestamp) && !Number.isFinite(leftTimestamp)) {
    return right;
  }

  if (Number.isFinite(leftTimestamp) && !Number.isFinite(rightTimestamp)) {
    return left;
  }

  if (right.totalPoints !== left.totalPoints) {
    return right.totalPoints > left.totalPoints ? right : left;
  }

  if ((right.monthlyDelta ?? Number.NEGATIVE_INFINITY) !== (left.monthlyDelta ?? Number.NEGATIVE_INFINITY)) {
    return (right.monthlyDelta ?? Number.NEGATIVE_INFINITY) > (left.monthlyDelta ?? Number.NEGATIVE_INFINITY)
      ? right
      : left;
  }

  return left;
}

function scoreTableCandidate(
  tableName: string,
  members: DraftMemberRow[],
  options: {
    hasMonthlyDelta: boolean;
    hasRole: boolean;
    fallbackTeamCount: number;
    duplicateCount: number;
  },
) {
  const normalizedTableName = normalizeToken(tableName);
  let score = members.length * 20;

  for (const token of POSITIVE_TABLE_HINTS) {
    if (normalizedTableName.includes(normalizeToken(token))) {
      score += 12;
    }
  }

  for (const token of NEGATIVE_TABLE_HINTS) {
    if (normalizedTableName.includes(normalizeToken(token))) {
      score -= 30;
    }
  }

  if (options.hasMonthlyDelta) {
    score += 18;
  }

  if (options.hasRole) {
    score += 8;
  }

  const teamCoverage = members.filter((member) => member.teamName !== "未分组").length;
  score += teamCoverage * 2;
  score -= options.fallbackTeamCount * 2;
  score -= options.duplicateCount * 4;

  return score;
}

function summarizeStageCounts(
  values: Array<string | null>,
  definitions: ReadonlyArray<readonly [string, string, "neutral" | "accent" | "success" | "warning"]>,
) {
  const counts = new Map<string, number>();

  for (const value of values) {
    const normalizedValue = normalizeToken(value ?? "").toUpperCase();
    if (!normalizedValue) {
      continue;
    }
    counts.set(normalizedValue, (counts.get(normalizedValue) ?? 0) + 1);
  }

  return definitions
    .map(([id, label, tone]) => ({
      id: normalizeToken(id),
      label,
      count: counts.get(id) ?? 0,
      tone,
    }))
    .filter((item) => item.count > 0);
}

function getPointKindConfig(pointKind: string) {
  const normalized = normalizeToken(pointKind).toUpperCase();

  if (normalized === "BONUS") {
    return { id: "bonus", label: "加分项", sign: 1 };
  }

  if (normalized === "PENALTY") {
    return { id: "penalty", label: "扣分项", sign: -1 };
  }

  if (normalized === "ADJUSTMENT") {
    return { id: "adjustment", label: "调整项", sign: 1 };
  }

  return { id: "base", label: "基础分", sign: 1 };
}

function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}

function extractObjectArrays(payload: unknown): JsonObject[][] {
  if (Array.isArray(payload)) {
    return [payload.filter(isJsonObject)];
  }

  if (!isJsonObject(payload)) {
    return [];
  }

  const directArrays = Object.values(payload)
    .filter(Array.isArray)
    .map((items) => items.filter(isJsonObject));

  return directArrays.length ? directArrays : [[payload]];
}

function getRecordFields(record: JsonObject) {
  const fieldCandidate = record.fields;
  return isJsonObject(fieldCandidate) ? fieldCandidate : record;
}

function pickStringField(fields: JsonObject, aliases: readonly string[]) {
  const exactMatch = findFieldByAliases(fields, aliases, false);
  return exactMatch ? coerceString(exactMatch.value) : null;
}

function pickStringArrayField(fields: JsonObject, aliases: readonly string[]) {
  const match = findFieldByAliases(fields, aliases, false) ?? findFieldByAliases(fields, aliases, true);
  if (!match) {
    return [];
  }

  return coerceStringArray(match.value);
}

function pickNumberField(fields: JsonObject, aliases: readonly string[], excludedTokens: readonly string[]) {
  const exactMatch = findFieldByAliases(fields, aliases, false, excludedTokens);
  if (exactMatch) {
    return coerceNumber(exactMatch.value);
  }

  const fuzzyMatch = findFieldByAliases(fields, aliases, true, excludedTokens);
  return fuzzyMatch ? coerceNumber(fuzzyMatch.value) : null;
}

function pickDateField(fields: JsonObject, aliases: readonly string[]) {
  const match = findFieldByAliases(fields, aliases, false) ?? findFieldByAliases(fields, aliases, true);
  if (!match) {
    return null;
  }

  const value = coerceString(match.value);
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
}

function findFieldByAliases(
  fields: JsonObject,
  aliases: readonly string[],
  allowPartialMatch: boolean,
  excludedTokens: readonly string[] = [],
) {
  const normalizedAliases = aliases.map(normalizeToken);
  const normalizedExcluded = excludedTokens.map(normalizeToken);

  for (const [key, value] of Object.entries(fields)) {
    const normalizedKey = normalizeToken(key);
    if (normalizedExcluded.some((token) => normalizedKey.includes(token))) {
      continue;
    }

    const matched = allowPartialMatch
      ? normalizedAliases.some((alias) => normalizedKey.includes(alias) || alias.includes(normalizedKey))
      : normalizedAliases.includes(normalizedKey);

    if (matched) {
      return { key, value };
    }
  }

  return null;
}

function pickStringValue(source: JsonObject, keys: readonly string[]) {
  const normalizedKeys = keys.map(normalizeToken);

  for (const [key, value] of Object.entries(source)) {
    if (!normalizedKeys.includes(normalizeToken(key))) {
      continue;
    }

    const text = coerceString(value);
    if (text) {
      return text;
    }
  }

  return null;
}

function pickDateValue(source: JsonObject, keys: readonly string[]) {
  const value = pickStringValue(source, keys);
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
}

function coerceString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    const firstText = value.map(coerceString).find((item): item is string => Boolean(item));
    return firstText ?? null;
  }

  if (isJsonObject(value)) {
    const preferred = pickStringValue(value, ["name", "label", "title", "value"]);
    return preferred ?? null;
  }

  return null;
}

function coerceStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    const single = coerceString(value);
    return single ? [single] : [];
  }

  return value.map(coerceString).filter((item): item is string => Boolean(item));
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const sanitized = value.replace(/,/g, "").trim();
    if (!sanitized) {
      return null;
    }

    const parsed = Number(sanitized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }

    const numericFragment = sanitized.match(/-?\d+(\.\d+)?/);
    if (numericFragment) {
      const extracted = Number(numericFragment[0]);
      return Number.isFinite(extracted) ? extracted : null;
    }
  }

  return null;
}

function shouldIncludeLedger(status: string | null) {
  if (!status) {
    return true;
  }

  const normalizedStatus = normalizeToken(status);
  return !INACTIVE_LEDGER_STATUS_TOKENS.some((token) => normalizedStatus.includes(normalizeToken(token)));
}

function scoreNormalizedCandidate(
  userTableName: string,
  ledgerTableName: string,
  memberCount: number,
  ledgerCount: number,
) {
  let score = 400;
  score += memberCount * 20;
  score += ledgerCount * 4;

  if (normalizeToken(userTableName).includes("pointuser")) {
    score += 40;
  }

  if (normalizeToken(ledgerTableName).includes("pointledger")) {
    score += 40;
  }

  return score;
}

function pickLatestTimestamp(left: string | null, right: string | null) {
  if (!left) {
    return right;
  }

  if (!right) {
    return left;
  }

  return Date.parse(right) > Date.parse(left) ? right : left;
}

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, "");
}

function deduplicateBy<T>(buildKey: (value: T) => string) {
  const seen = new Set<string>();

  return (value: T) => {
    const key = buildKey(value);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  };
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getUnknownErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
