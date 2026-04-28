import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PersonalPointsEntry, PointsDashboardData, TeamPointsEntry } from "@/lib/contracts";
import { getPointsDashboardData } from "@/lib/points-dashboard-data";
import { formatDateTimeLabel, formatNumber } from "@/lib/utils";

export default async function HomePage() {
  const result = await getPointsDashboardData();

  return (
    <main className="dashboard-shell min-h-screen px-4 py-6 text-slate-950 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {result.status === "ready" ? (
          <ReadyDashboard data={result.data} />
        ) : (
          <ErrorDashboard message={result.error.message} detail={result.error.detail} />
        )}
      </div>
    </main>
  );
}

function ReadyDashboard({ data }: { data: PointsDashboardData }) {
  const hasTeamDelta = data.teamLeaderboard.some((entry) => entry.monthlyDelta !== null);
  const hasPersonalDelta = data.personalLeaderboard.some((entry) => entry.monthlyDelta !== null);
  const highestAverageTeam = data.teamLeaderboard
    .slice()
    .sort((left, right) => right.averagePoints - left.averagePoints)[0];
  const visibleTeams = data.teamLeaderboard.slice(0, 8);
  const visiblePeople = data.personalLeaderboard.slice(0, 12);

  return (
    <>
      <section className="panel overflow-hidden">
        <div className="flex flex-col gap-8 px-6 py-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="max-w-4xl">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-white uppercase">
                Airtable Points
              </span>
              <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                Base / {data.baseName}
              </span>
              <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                Tables / {data.sourceTableName}
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              团队与个人积分看板
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
              当前页面通过平台运行时直接读取 Airtable，并优先识别 `point_user + point_ledger` 模型；如果没有这组表，再回退到单表积分排行识别。
            </p>
          </div>

          <div className="rounded-[28px] bg-slate-950 p-5 text-white lg:max-w-sm">
            <div className="text-xs uppercase tracking-[0.18em] text-white/55">当前领先组合</div>
            <div className="mt-3 text-3xl font-semibold tracking-tight">{data.summary.topTeamName}</div>
            <div className="mt-2 text-sm text-white/72">
              团队总分 {formatNumber(data.summary.topTeamPoints)}，个人第一名 {data.summary.topPerformerName}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MetricMini label="个人最高分" value={`${formatNumber(data.summary.topPerformerPoints)} 分`} />
              <MetricMini
                label="最快增长团队"
                value={
                  data.summary.fastestGrowingTeamName && data.summary.fastestGrowingTeamDelta !== null
                    ? `${data.summary.fastestGrowingTeamName} ${formatSignedNumber(data.summary.fastestGrowingTeamDelta)}`
                    : "未提供"
                }
              />
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-slate-200/70 md:grid-cols-4">
          <MetricTile
            label="团队数"
            value={formatNumber(data.summary.teamCount)}
            helper="参与积分榜单的团队数量"
          />
          <MetricTile
            label="个人数"
            value={formatNumber(data.summary.memberCount)}
            helper="已识别并去重后的成员数量"
          />
          <MetricTile
            label="积分总量"
            value={formatNumber(data.summary.totalPoints)}
            helper="当前 Airtable 个人积分累计值"
          />
          <MetricTile
            label="人均积分"
            value={formatNumber(data.summary.averagePoints)}
            helper={`高于均线 ${formatNumber(data.summary.membersAboveAverage)} 人`}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="panel">
          <CardHeader className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>团队积分排行</CardTitle>
              <CardDescription>按团队累计积分聚合，展示总分、人均和团队内最高分成员。</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="accent">Top {visibleTeams.length}</Badge>
              <Badge tone="neutral">{hasTeamDelta ? "含月增量" : "无月增量字段"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {visibleTeams.map((entry) => (
              <TeamLeaderboardRow key={entry.id} entry={entry} hasMonthlyDelta={hasTeamDelta} />
            ))}
          </CardContent>
        </Card>

        <Card className="panel">
          <CardHeader className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>个人积分排行</CardTitle>
              <CardDescription>按个人累计积分排序，补充团队归属与本月变化。</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="accent">Top {visiblePeople.length}</Badge>
              <Badge tone="neutral">{hasPersonalDelta ? "显示本月新增" : "未识别月增量"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {visiblePeople.map((entry) => (
              <PersonalLeaderboardRow key={entry.id} entry={entry} hasMonthlyDelta={hasPersonalDelta} />
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="panel">
          <CardHeader>
            <CardTitle>组织洞察</CardTitle>
            <CardDescription>从当前积分榜单中抽取团队领先面和个人密度指标。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <InsightPanel
              title="领先团队"
              value={data.summary.topTeamName}
              description={`累计 ${formatNumber(data.summary.topTeamPoints)} 分，当前组织总榜第 1。`}
              tone="accent"
            />
            <InsightPanel
              title="最高人均"
              value={highestAverageTeam?.teamName ?? "暂无"}
              description={
                highestAverageTeam
                  ? `人均 ${formatNumber(highestAverageTeam.averagePoints)} 分，共 ${formatNumber(highestAverageTeam.memberCount)} 人。`
                  : "暂无可计算的人均积分。"
              }
              tone="success"
            />
            <InsightPanel
              title="高于均线"
              value={`${formatNumber(data.summary.membersAboveAverage)} / ${formatNumber(data.summary.memberCount)}`}
              description={`按当前人均积分 ${formatNumber(data.summary.averagePoints)} 分作为对比基线。`}
              tone="warning"
            />
          </CardContent>
        </Card>

        <Card className="panel">
          <CardHeader className="border-b border-slate-200/80 pb-5">
            <CardTitle>数据源状态</CardTitle>
            <CardDescription>记录当前 Airtable 基础信息、自动识别结果和需要处理的字段提醒。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-3 md:grid-cols-2">
              <SourceInfoCard label="Base 名称" value={data.baseName} />
              <SourceInfoCard label="积分源表" value={data.sourceTableName} />
              <SourceInfoCard label="Base ID" value={data.baseId} />
              <SourceInfoCard
                label="最近同步"
                value={data.lastSyncedAt ? formatDateTimeLabel(data.lastSyncedAt) : "Airtable 未提供时间字段"}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="accent">自动扫描可访问 base</Badge>
                <Badge tone="neutral">
                  {data.sourceMode === "normalized-ledger" ? "ledger 聚合模式" : "单表识别模式"}
                </Badge>
                <Badge tone="neutral">团队榜由成员积分聚合</Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                当前应用不会写死 `AIRTABLE_BASE_ID`，也不会假设固定表名。它会先扫描当前 token 可见的
                Airtable bases，再优先识别 `point_user + point_ledger`，最后才回退到单表积分榜结构。
              </p>
            </div>

            <div className="space-y-3">
              {data.warnings.length ? (
                data.warnings.map((warning, index) => (
                  <div
                    key={`${warning}-${index}`}
                    className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 text-sm leading-6 text-amber-900"
                  >
                    {warning}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm leading-6 text-emerald-900">
                  当前已成功识别可用的团队和个人积分字段，没有额外的数据质量警告。
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function ErrorDashboard({ message, detail }: { message: string; detail?: string }) {
  return (
    <>
      <section className="panel overflow-hidden">
        <div className="flex flex-col gap-8 px-6 py-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="max-w-4xl">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-white uppercase">
                Airtable Points
              </span>
              <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                Base / Airtable Runtime Discovery
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              团队与个人积分看板
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
              页面已经切换为 Airtable 运行时读取模式，但当前还没有成功识别出可用于积分看板的数据结构。
            </p>
          </div>

          <div className="rounded-[28px] bg-slate-950 p-5 text-white lg:max-w-sm">
            <div className="text-xs uppercase tracking-[0.18em] text-white/55">当前状态</div>
            <div className="mt-3 text-2xl font-semibold tracking-tight">{message}</div>
            {detail ? <div className="mt-3 text-sm leading-6 text-white/72">{detail}</div> : null}
          </div>
        </div>

        <div className="grid gap-px bg-slate-200/70 md:grid-cols-3">
          <MetricTile label="扫描范围" value="当前 token 可见 bases" helper="按平台运行时接口自动枚举" />
          <MetricTile label="数据来源" value="Airtable" helper="必须经平台运行时读取，不直接访问 Airtable API" />
          <MetricTile label="当前输出" value="团队榜 + 个人榜" helper="优先识别 point_user + point_ledger" />
        </div>
      </section>

      <Card className="panel">
        <CardHeader>
          <CardTitle>接入检查项</CardTitle>
          <CardDescription>按下面几项确认后，页面会自动切回真实 Airtable 数据。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InstructionCard
            title="1. 配置平台 Airtable 凭证"
            description="在运行时环境中提供 `AIRTABLE_TOKEN`，不要在这个应用代码里写死 token 或 base id。"
          />
          <InstructionCard
            title="2. 确认平台 API 可访问"
            description="本地或分离部署环境下请配置 `TANKA_PLATFORM_API_URL`，确保应用能访问 `/api/apps/dashboard-demo/...` 运行时接口。"
          />
          <InstructionCard
            title="3. 准备积分数据结构"
            description="优先使用 `point_user` + `point_ledger`；如果没有，也至少需要一张表能识别出成员姓名、团队名称和累计积分字段。"
          />
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
            <div className="text-sm font-semibold text-slate-950">运行时接口约定</div>
            <div className="mt-3 grid gap-2 text-sm text-slate-600">
              <code>/api/apps/dashboard-demo/data-sources/airtable/bases</code>
              <code>/api/apps/dashboard-demo/data-sources/airtable/bases/{`{baseId}`}/tables</code>
              <code>/api/apps/dashboard-demo/query/airtable?baseId={`{baseId}`}&amp;table={`{tableName}`}</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function TeamLeaderboardRow({
  entry,
  hasMonthlyDelta,
}: {
  entry: TeamPointsEntry;
  hasMonthlyDelta: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
            #{entry.rank}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-950">{entry.teamName}</h3>
              <Badge tone={entry.rank === 1 ? "accent" : "neutral"}>{entry.shareOfTotal}% 占比</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {entry.memberCount} 人参与，团队最高分 {entry.topPerformerName}
            </p>
          </div>
        </div>

        <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
          <InfoPair label="累计积分" value={`${formatNumber(entry.totalPoints)} 分`} />
          <InfoPair label="人均积分" value={`${formatNumber(entry.averagePoints)} 分`} />
          <InfoPair
            label={hasMonthlyDelta ? "本月新增" : "团队成员"}
            value={hasMonthlyDelta ? formatSignedNumber(entry.monthlyDelta) : `${formatNumber(entry.memberCount)} 人`}
          />
        </div>
      </div>

      <div className="mt-4 h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-teal-500"
          style={{ width: `${Math.max(8, Math.min(entry.shareOfTotal, 100))}%` }}
        />
      </div>
    </div>
  );
}

function PersonalLeaderboardRow({
  entry,
  hasMonthlyDelta,
}: {
  entry: PersonalPointsEntry;
  hasMonthlyDelta: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
            #{entry.rank}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-950">{entry.userName}</h3>
              <Badge tone="neutral">{entry.teamName}</Badge>
              {entry.role ? <Badge tone="accent">{entry.role}</Badge> : null}
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {hasMonthlyDelta && entry.monthlyDelta !== null
                ? `本月变化 ${formatSignedNumber(entry.monthlyDelta)}`
                : "当前展示累计积分表现"}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-semibold text-slate-950">{formatNumber(entry.totalPoints)} 分</div>
          <div className={`mt-1 text-sm ${entry.monthlyDelta !== null && entry.monthlyDelta >= 0 ? "text-emerald-600" : "text-slate-500"}`}>
            {hasMonthlyDelta ? formatSignedNumber(entry.monthlyDelta) : "累计积分"}
          </div>
        </div>
      </div>
    </div>
  );
}

function InstructionCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
      <div className="text-sm font-semibold text-slate-950">{title}</div>
      <div className="mt-2 text-sm leading-6 text-slate-600">{description}</div>
    </div>
  );
}

function InsightPanel({
  title,
  value,
  description,
  tone,
}: {
  title: string;
  value: string;
  description: string;
  tone: "accent" | "success" | "warning";
}) {
  const toneClasses = {
    accent: "border-teal-100 bg-teal-50/70",
    success: "border-emerald-100 bg-emerald-50/70",
    warning: "border-amber-100 bg-amber-50/80",
  } as const;

  return (
    <div className={`rounded-2xl border p-4 ${toneClasses[tone]}`}>
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{title}</div>
      <div className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{value}</div>
      <div className="mt-2 text-sm leading-6 text-slate-600">{description}</div>
    </div>
  );
}

function SourceInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="bg-white/90 px-6 py-5 lg:px-8">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
      <div className="mt-2 text-sm leading-6 text-slate-600">{helper}</div>
    </div>
  );
}

function MetricMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-white/55">{label}</div>
      <div className="mt-2 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-1 font-medium text-slate-700">{value}</div>
    </div>
  );
}

function formatSignedNumber(value: number | null) {
  if (value === null) {
    return "未提供";
  }

  return `${value > 0 ? "+" : ""}${formatNumber(value)}`;
}
