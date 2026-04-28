import { unstable_noStore as noStore } from "next/cache";
import { headers } from "next/headers";

import type {
  PersonalPointsEntry,
  PointsDashboardData,
  PointsDashboardLoadResult,
  TeamPointsEntry,
} from "@/lib/contracts";

const APP_ID = "dashboard-demo";
const TARGET_BASE_NAME = "OpenUI Points Dashboard Demo";
const LIST_BASES_PATH = `/api/apps/${APP_ID}/data-sources/airtable/bases`;

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
  tableName: string;
  members: DraftMemberRow[];
  score: number;
  hasMonthlyDelta: boolean;
  hasRole: boolean;
  fallbackTeamCount: number;
  duplicateCount: number;
  latestUpdatedAt: string | null;
}

export async function getPointsDashboardData(): Promise<PointsDashboardLoadResult> {
  noStore();

  try {
    const origin = await resolveRuntimeOrigin();
    const basesPayload = await fetchJson(origin, LIST_BASES_PATH, "读取 Airtable base 列表");
    const bases = parseBaseList(basesPayload);
    const targetBase = selectTargetBase(bases);

    if (!targetBase) {
      return {
        status: "error",
        error: {
          code: "BASE_NOT_FOUND",
          message: `未找到名为 “${TARGET_BASE_NAME}” 的 Airtable base。`,
          detail: "请确认平台运行时已配置 Airtable Token，并且当前应用可访问这个 base。",
        },
      };
    }

    const tablesPayload = await fetchJson(
      origin,
      `/api/apps/${APP_ID}/data-sources/airtable/bases/${encodeURIComponent(targetBase.id)}/tables`,
      "读取 Airtable 表列表",
    );
    const tables = parseTableList(tablesPayload);

    if (!tables.length) {
      return {
        status: "error",
        error: {
          code: "TABLES_NOT_FOUND",
          message: `base “${targetBase.name}” 下没有可读取的数据表。`,
          detail: "请确认该 base 中已经创建了个人积分明细表，且平台运行时对这些表有读取权限。",
        },
      };
    }

    const tableResults = await Promise.allSettled(
      tables.map((table) => loadTableCandidate(origin, targetBase.id, table)),
    );

    const warnings = tableResults.flatMap((result) =>
      result.status === "rejected" ? [getUnknownErrorMessage(result.reason)] : result.value.warnings,
    );

    const candidates = tableResults
      .filter((result): result is PromiseFulfilledResult<{ candidate: TableCandidate | null; warnings: string[] }> => {
        return result.status === "fulfilled";
      })
      .map((result) => result.value.candidate)
      .filter((candidate): candidate is TableCandidate => candidate !== null);

    const bestCandidate = candidates.sort((left, right) => right.score - left.score)[0];

    if (!bestCandidate || !bestCandidate.members.length) {
      return {
        status: "error",
        error: {
          code: "POINTS_TABLE_NOT_FOUND",
          message: "没有识别出可用于团队/个人积分排行的 Airtable 表。",
          detail: "请确认至少有一张表包含成员姓名、团队名称和累计积分字段。",
        },
      };
    }

    return {
      status: "ready",
      data: buildDashboardData(targetBase, bestCandidate, warnings),
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

async function loadTableCandidate(origin: string, baseId: string, table: AirtableTableMeta) {
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
      tableName: table.name,
      members,
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
  if (!candidate.hasMonthlyDelta) {
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
    peopleTableName: candidate.tableName,
    lastSyncedAt: candidate.latestUpdatedAt,
    warnings,
    personalLeaderboard,
    teamLeaderboard,
    summary: {
      teamCount: teamLeaderboard.length,
      memberCount: personalLeaderboard.length,
      totalPoints,
      averagePoints,
      membersAboveAverage: personalLeaderboard.filter((member) => member.totalPoints >= averagePoints).length,
      topTeamName: topTeam?.teamName ?? "暂无",
      topTeamPoints: topTeam?.totalPoints ?? 0,
      topPerformerName: topPerformer?.userName ?? "暂无",
      topPerformerPoints: topPerformer?.totalPoints ?? 0,
      fastestGrowingTeamName: fastestGrowingTeam?.teamName ?? null,
      fastestGrowingTeamDelta: fastestGrowingTeam?.monthlyDelta ?? null,
    },
  };
}

async function resolveRuntimeOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol =
    headerStore.get("x-forwarded-proto") ??
    (host?.includes("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https");

  if (host) {
    return `${protocol}://${host}`;
  }

  const envOrigin = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;
  if (envOrigin) {
    return envOrigin.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  }

  throw new Error("无法推断当前应用运行时地址，缺少 host header 或可用的 APP_URL/VERCEL_URL。");
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

function parseRecordList(payload: unknown) {
  return extractObjectArrays(payload).flatMap((items) => items);
}

function selectTargetBase(bases: AirtableBaseMeta[]) {
  const exactMatch = bases.find((base) => normalizeToken(base.name) === normalizeToken(TARGET_BASE_NAME));
  if (exactMatch) {
    return exactMatch;
  }

  return bases.find((base) => normalizeToken(base.name).includes(normalizeToken(TARGET_BASE_NAME)));
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
