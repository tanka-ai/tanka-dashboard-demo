import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  PersonalPointsEntry,
  PointCompositionEntry,
  PointsDashboardData,
  RoleContributionEntry,
  TeamPointsEntry,
  WorkflowStageEntry,
} from "@/lib/contracts";
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
  const analytics = data.analytics;
  const visibleTeams = data.teamLeaderboard.slice(0, 6);
  const featuredTeams = visibleTeams.slice(0, 3);
  const remainingTeams = visibleTeams.slice(3);
  const visiblePeople = data.personalLeaderboard.slice(0, 10);
  const hasPersonalDelta = data.personalLeaderboard.some((entry) => entry.monthlyDelta !== null);
  const cycleLabel = formatCycleLabel(analytics?.ops.currentCycleLabel ?? null);
  const queueCount =
    (analytics?.ops.pendingEvaluationCount ?? 0) + (analytics?.ops.approvedEvaluationCount ?? 0);

  return (
    <>
      <section className="panel relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.16),transparent_28rem),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_24rem)]" />
        <div className="relative flex flex-col gap-8 px-6 py-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="max-w-4xl">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-white uppercase">
                Points Ops
              </span>
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                Base / {data.baseName}
              </span>
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                {analytics ? "流程链路已识别" : "排行榜模式"}
              </span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              积分运营 Dashboard
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
              先看组织积分热度，再看事项与评分流转，最后落到团队和成员表现。当前页面已经按这套积分模型自动聚合真实数据。
            </p>
          </div>

          <div className="panel-strong w-full max-w-md rounded-[30px] border border-white/80 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.10)]">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">本期焦点</div>
              <Badge tone="accent">{cycleLabel}</Badge>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-semibold tracking-tight text-slate-950">{data.summary.topTeamName}</div>
              <div className="mt-2 text-sm leading-6 text-slate-600">
                当前第一团队，总分 {formatNumber(data.summary.topTeamPoints)}，头部成员 {data.summary.topPerformerName}。
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MetricMini
                label="当前周期入账"
                value={
                  analytics?.ops.currentCyclePoints !== null && analytics?.ops.currentCyclePoints !== undefined
                    ? `${formatSignedNumber(analytics.ops.currentCyclePoints)} 分`
                    : `${formatNumber(data.summary.totalPoints)} 分`
                }
              />
              <MetricMini
                label="待处理评分"
                value={queueCount ? `${formatNumber(queueCount)} 条` : "当前顺畅"}
              />
              <MetricMini
                label="冠军团队占比"
                value={`${formatNumber(data.summary.topTeamSharePercent)}%`}
              />
              <MetricMini
                label="最高分成员"
                value={`${data.summary.topPerformerName} / ${formatNumber(data.summary.topPerformerPoints)}`}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-slate-200/70 md:grid-cols-2 xl:grid-cols-6">
          <MetricTile
            label="团队数"
            value={formatNumber(data.summary.teamCount)}
            helper={`头部团队贡献 ${formatNumber(data.summary.topTeamSharePercent)}%`}
          />
          <MetricTile
            label="成员数"
            value={formatNumber(data.summary.memberCount)}
            helper={`有积分成员 ${formatNumber(analytics?.ops.activeMemberCount ?? data.summary.memberCount)} 人`}
          />
          <MetricTile
            label="积分总量"
            value={formatNumber(data.summary.totalPoints)}
            helper="当前已入账的累计积分"
          />
          <MetricTile
            label={`${cycleLabel}入账`}
            value={
              analytics?.ops.currentCyclePoints !== null && analytics?.ops.currentCyclePoints !== undefined
                ? formatSignedNumber(analytics.ops.currentCyclePoints)
                : formatNumber(data.summary.averagePoints)
            }
            helper={analytics ? "以最近有记录的月份作为当前周期" : "当前显示组织人均积分"}
          />
          <MetricTile
            label="在途事项"
            value={
              analytics?.ops.openWorkItemCount !== null && analytics?.ops.openWorkItemCount !== undefined
                ? formatNumber(analytics.ops.openWorkItemCount)
                : formatNumber(data.summary.membersAboveAverage)
            }
            helper={analytics ? "未关闭事项数量" : "当前高于均线成员数"}
          />
          <MetricTile
            label="评分待处理"
            value={formatNumber(queueCount)}
            helper={
              analytics
                ? `待审核 ${formatNumber(analytics.ops.pendingEvaluationCount ?? 0)}，待生效 ${formatNumber(analytics.ops.approvedEvaluationCount ?? 0)}`
                : "当前模式不展示评分流转"
            }
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="panel">
          <CardHeader className="border-b border-slate-200/80 pb-5">
            <CardTitle>积分流转漏斗</CardTitle>
            <CardDescription>看事项推进、评分审批和当前事项类型分布，快速判断积分发放卡在哪一层。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <PipelineLane
              title="事项推进"
              items={analytics?.workItemStages ?? []}
              emptyText="当前没有可展示的事项流程数据。"
            />
            <PipelineLane
              title="评分状态"
              items={analytics?.evaluationStages ?? []}
              emptyText="当前没有可展示的评分流程数据。"
            />
            <PipelineLane
              title="事项类型"
              items={analytics?.taskTypeBreakdown ?? []}
              emptyText="当前没有可展示的事项分类数据。"
              compact
            />
          </CardContent>
        </Card>

        <Card className="panel">
          <CardHeader className="border-b border-slate-200/80 pb-5">
            <CardTitle>积分结构</CardTitle>
            <CardDescription>把当前积分拆成基础分、加分和扣分，方便判断激励是不是过于集中。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {analytics?.pointComposition.length ? (
              analytics.pointComposition.map((entry) => <CompositionRow key={entry.id} entry={entry} />)
            ) : (
              <EmptyState text="当前没有可展示的积分结构数据。" />
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <InsightPanel
                title="有效入账"
                value={`${formatNumber(analytics?.ops.effectiveLedgerCount ?? data.personalLeaderboard.length)} 笔`}
                description="已经进入积分统计口径的入账记录。"
                tone="accent"
              />
              <InsightPanel
                title="高于均线"
                value={`${formatNumber(data.summary.membersAboveAverage)} 人`}
                description={`当前组织人均积分 ${formatNumber(data.summary.averagePoints)}。`}
                tone="success"
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="panel">
          <CardHeader className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>团队对比</CardTitle>
              <CardDescription>先看头部团队，再看其他团队的总分占比、人均和团队带头人。</CardDescription>
            </div>
            <Badge tone="accent">Top {visibleTeams.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="grid gap-4 lg:grid-cols-3">
              {featuredTeams.map((entry) => (
                <TeamSpotlightCard key={entry.id} entry={entry} topScore={Math.max(data.summary.topTeamPoints, 1)} />
              ))}
            </div>

            {remainingTeams.length ? (
              <div className="space-y-3">
                {remainingTeams.map((entry) => (
                  <CompactTeamRow key={entry.id} entry={entry} topScore={Math.max(data.summary.topTeamPoints, 1)} />
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="panel">
          <CardHeader className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>成员排行</CardTitle>
              <CardDescription>展示当前积分头部成员，并补充所属团队和最近周期变化。</CardDescription>
            </div>
            <Badge tone="neutral">Top {visiblePeople.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {visiblePeople.map((entry) => (
              <PersonalLeaderboardRow
                key={entry.id}
                entry={entry}
                hasMonthlyDelta={hasPersonalDelta}
                topScore={Math.max(data.summary.topPerformerPoints, 1)}
              />
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="panel">
          <CardHeader className="border-b border-slate-200/80 pb-5">
            <CardTitle>角色贡献</CardTitle>
            <CardDescription>看不同角色的人数、总积分和人均表现，避免激励只落在单一角色上。</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {analytics?.roleBreakdown.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {analytics.roleBreakdown.map((entry) => (
                  <RoleContributionCard key={entry.id} entry={entry} />
                ))}
              </div>
            ) : (
              <EmptyState text="当前没有可展示的角色贡献数据。" />
            )}
          </CardContent>
        </Card>

        <Card className="panel">
          <CardHeader className="border-b border-slate-200/80 pb-5">
            <CardTitle>数据说明</CardTitle>
            <CardDescription>确认当前取数范围、同步时间以及需要关注的数据质量提醒。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-3 md:grid-cols-2">
              <SourceInfoCard label="当前 Base" value={data.baseName} />
              <SourceInfoCard label="识别模式" value={analytics ? "标准积分链路" : "排行榜识别"} />
              <SourceInfoCard
                label="最近同步"
                value={data.lastSyncedAt ? formatDateTimeLabel(data.lastSyncedAt) : "未提供时间字段"}
              />
              <SourceInfoCard
                label="数据覆盖"
                value={`${formatNumber(data.summary.teamCount)} 个团队 / ${formatNumber(data.summary.memberCount)} 位成员`}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="accent">自动发现数据源</Badge>
                <Badge tone="neutral">{analytics ? "成员 + 事项 + 评分 + 入账" : "基础榜单模式"}</Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                当前看板会优先把成员、事项、评分和入账串成完整链路；如果上游只提供榜单表，也会自动降级成可用的基础排行视图。
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
                  当前数据结构完整，可直接支撑组织总览、流程漏斗、团队对比和成员排行。
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
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-white uppercase">
                Points Ops
              </span>
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                实时数据暂未就绪
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              积分运营 Dashboard
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
              看板已经切到真实数据模式，但当前还没有拿到可直接展示的积分结构。
            </p>
          </div>

          <div className="rounded-[28px] bg-slate-950 p-5 text-white lg:max-w-sm">
            <div className="text-xs uppercase tracking-[0.18em] text-white/55">当前状态</div>
            <div className="mt-3 text-2xl font-semibold tracking-tight">{message}</div>
            {detail ? <div className="mt-3 text-sm leading-6 text-white/72">{detail}</div> : null}
          </div>
        </div>

        <div className="grid gap-px bg-slate-200/70 md:grid-cols-3">
          <MetricTile label="目标视图" value="组织总览 + 流程漏斗" helper="默认展示团队和成员积分表现" />
          <MetricTile label="取数方式" value="平台运行时" helper="不会在页面里直接暴露数据源凭据" />
          <MetricTile label="需要准备" value="可读积分结构" helper="优先使用完整积分链路，其次可降级到榜单表" />
        </div>
      </section>

      <Card className="panel">
        <CardHeader>
          <CardTitle>接入检查项</CardTitle>
          <CardDescription>把下面几项确认完，页面就会自动切回真实积分数据。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InstructionCard
            title="1. 确认运行时凭据"
            description="需要由运行时环境托管 Airtable 凭据，不要把凭据写进应用页面。"
          />
          <InstructionCard
            title="2. 确认运行时可访问"
            description="应用需要能访问平台侧的数据读取能力，才能自动发现可用的积分数据。"
          />
          <InstructionCard
            title="3. 确认积分结构完整"
            description="如果有成员、事项、评分和入账四层链路，页面会展示完整驾驶舱；否则会回退到基础积分榜。"
          />
        </CardContent>
      </Card>
    </>
  );
}

function PipelineLane({
  title,
  items,
  emptyText,
  compact = false,
}: {
  title: string;
  items: WorkflowStageEntry[];
  emptyText: string;
  compact?: boolean;
}) {
  if (!items.length) {
    return <EmptyState text={emptyText} />;
  }

  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div>
      <div className="mb-3 text-sm font-semibold text-slate-900">{title}</div>
      <div className={compact ? "grid gap-3 sm:grid-cols-2" : "grid gap-3 sm:grid-cols-2 xl:grid-cols-5"}>
        {items.map((item) => (
          <StageCard key={item.id} entry={item} total={total} compact={compact} />
        ))}
      </div>
    </div>
  );
}

function StageCard({
  entry,
  total,
  compact,
}: {
  entry: WorkflowStageEntry;
  total: number;
  compact: boolean;
}) {
  const toneClasses = {
    neutral: "border-slate-200 bg-slate-50/80",
    accent: "border-teal-100 bg-teal-50/80",
    success: "border-emerald-100 bg-emerald-50/80",
    warning: "border-amber-100 bg-amber-50/90",
  } as const;
  const width = total > 0 ? Math.max(12, Math.round((entry.count / total) * 100)) : 0;

  return (
    <div className={`rounded-2xl border p-4 ${toneClasses[entry.tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-medium text-slate-700">{entry.label}</div>
        <div className="text-lg font-semibold tracking-tight text-slate-950">{formatNumber(entry.count)}</div>
      </div>
      {!compact ? (
        <>
          <div className="mt-3 h-2 rounded-full bg-white/70">
            <div className="h-2 rounded-full bg-slate-950/75" style={{ width: `${width}%` }} />
          </div>
          <div className="mt-2 text-xs text-slate-500">{total > 0 ? `${Math.round((entry.count / total) * 100)}% 占比` : "无数据"}</div>
        </>
      ) : (
        <div className="mt-2 text-xs text-slate-500">{total > 0 ? `${Math.round((entry.count / total) * 100)}%` : "无数据"}</div>
      )}
    </div>
  );
}

function CompositionRow({ entry }: { entry: PointCompositionEntry }) {
  const toneClass =
    entry.points < 0
      ? "border-rose-100 bg-rose-50/80 text-rose-700"
      : entry.id === "bonus"
        ? "border-amber-100 bg-amber-50/80 text-amber-800"
        : "border-emerald-100 bg-emerald-50/80 text-emerald-800";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{entry.label}</div>
          <div className="mt-1 text-xs opacity-75">{formatNumber(entry.count)} 次评分动作</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">{formatSignedNumber(entry.points)}</div>
          <div className="mt-1 text-xs opacity-75">积分影响</div>
        </div>
      </div>
    </div>
  );
}

function TeamSpotlightCard({
  entry,
  topScore,
}: {
  entry: TeamPointsEntry;
  topScore: number;
}) {
  const width = Math.max(12, Math.round((entry.totalPoints / topScore) * 100));

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">#{entry.rank}</div>
          <div className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{entry.teamName}</div>
        </div>
        <Badge tone={entry.rank === 1 ? "accent" : "neutral"}>{entry.shareOfTotal}% 占比</Badge>
      </div>

      <div className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{formatNumber(entry.totalPoints)}</div>
      <div className="mt-1 text-sm text-slate-600">
        {formatNumber(entry.memberCount)} 人，人均 {formatNumber(entry.averagePoints)}，带头人 {entry.topPerformerName}
      </div>

      <div className="mt-4 h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-teal-500" style={{ width: `${width}%` }} />
      </div>

      <div className="mt-3 text-sm text-slate-600">
        最近周期 {entry.monthlyDelta !== null ? formatSignedNumber(entry.monthlyDelta) : "未提供月变化"}
      </div>
    </div>
  );
}

function CompactTeamRow({
  entry,
  topScore,
}: {
  entry: TeamPointsEntry;
  topScore: number;
}) {
  const width = Math.max(10, Math.round((entry.totalPoints / topScore) * 100));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-950">
              #{entry.rank} {entry.teamName}
            </h3>
            <Badge tone="neutral">{entry.memberCount} 人</Badge>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-slate-900" style={{ width: `${width}%` }} />
          </div>
        </div>

        <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
          <InfoPair label="总分" value={formatNumber(entry.totalPoints)} />
          <InfoPair label="人均" value={formatNumber(entry.averagePoints)} />
          <InfoPair
            label="最近周期"
            value={entry.monthlyDelta !== null ? formatSignedNumber(entry.monthlyDelta) : "未提供"}
          />
        </div>
      </div>
    </div>
  );
}

function PersonalLeaderboardRow({
  entry,
  hasMonthlyDelta,
  topScore,
}: {
  entry: PersonalPointsEntry;
  hasMonthlyDelta: boolean;
  topScore: number;
}) {
  const width = Math.max(10, Math.round((entry.totalPoints / topScore) * 100));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
            #{entry.rank}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-950">{entry.userName}</h3>
              <Badge tone="neutral">{entry.teamName}</Badge>
              {entry.role ? <Badge tone="accent">{entry.role}</Badge> : null}
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-slate-100">
              <div className="h-1.5 rounded-full bg-teal-500" style={{ width: `${width}%` }} />
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {hasMonthlyDelta && entry.monthlyDelta !== null
                ? `最近周期变化 ${formatSignedNumber(entry.monthlyDelta)}`
                : "当前显示累计积分表现"}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-semibold text-slate-950">{formatNumber(entry.totalPoints)} 分</div>
          <div
            className={`mt-1 text-sm ${
              entry.monthlyDelta !== null && entry.monthlyDelta >= 0 ? "text-emerald-600" : "text-slate-500"
            }`}
          >
            {hasMonthlyDelta ? formatSignedNumber(entry.monthlyDelta) : "累计积分"}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleContributionCard({ entry }: { entry: RoleContributionEntry }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-950">{entry.roleName}</div>
          <div className="mt-1 text-xs text-slate-500">{formatNumber(entry.memberCount)} 人</div>
        </div>
        <Badge tone="neutral">人均 {formatNumber(entry.averagePoints)}</Badge>
      </div>
      <div className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{formatNumber(entry.totalPoints)}</div>
      <div className="mt-1 text-sm text-slate-600">该角色当前累计积分</div>
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-semibold text-slate-950">{value}</div>
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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm leading-6 text-slate-500">
      {text}
    </div>
  );
}

function formatSignedNumber(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "未提供";
  }

  return `${value > 0 ? "+" : ""}${formatNumber(value)}`;
}

function formatCycleLabel(value: string | null) {
  if (!value) {
    return "最近周期";
  }

  const [year, month] = value.split("-");
  if (!year || !month) {
    return value;
  }

  return `${year}.${month}`;
}
