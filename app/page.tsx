import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  pointDashboardHighlights,
  pointEarningTasks,
  pointLedgerEntries,
  rewardCatalog,
  teamPointsLeaderboard,
  userPointsBreakdown,
  userPointsProfile,
} from "@/lib/mock-points-data";
import { formatDateLabel, formatNumber } from "@/lib/utils";

export default function HomePage() {
  const pointsTierProgress =
    ((userPointsProfile.currentPoints - userPointsProfile.currentTierFloor) /
      (userPointsProfile.nextTierThreshold - userPointsProfile.currentTierFloor)) *
    100;
  const availableTaskPoints = pointEarningTasks
    .filter((task) => task.status !== "已完成")
    .reduce((sum, task) => sum + task.pointsReward, 0);
  const nextRankPointsGap =
    teamPointsLeaderboard.find((entry) => entry.rank === userPointsProfile.rank - 1)?.totalPoints ??
    userPointsProfile.currentPoints;
  const pointsToNextRank = Math.max(nextRankPointsGap - userPointsProfile.currentPoints, 0);

  return (
    <main className="dashboard-shell min-h-screen px-4 py-6 text-slate-950 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="panel overflow-hidden">
          <div className="flex flex-col gap-8 px-6 py-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-white uppercase">
                  Points Program
                </span>
                <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                  Tanka App Platform / dashboard-demo
                </span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                积分运营看板
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                用一个工作台统一查看积分余额、成长等级、团队排行、可赚任务和兑换权益。当前数据来自本地示例，
                后续可替换为 Airtable 或内部积分中心数据层。
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                配置积分数据源
              </button>
              <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
                新建积分活动
              </button>
            </div>
          </div>

          <div className="grid gap-px bg-slate-200/70 md:grid-cols-4">
            <MetricTile
              label="当前积分"
              value={formatNumber(userPointsProfile.currentPoints)}
              helper="当前用户可用积分余额"
            />
            <MetricTile
              label="本月新增"
              value={formatPointsDelta(userPointsProfile.monthlyEarnedPoints)}
              helper="最近 30 天累计获得积分"
            />
            <MetricTile
              label="本周可赚"
              value={formatNumber(availableTaskPoints)}
              helper="来自当前未完成任务的可获取积分"
            />
            <MetricTile
              label="即将过期"
              value={formatNumber(userPointsProfile.expiringSoonPoints)}
              helper="未来 14 天到期的积分"
            />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <Card className="panel">
            <CardHeader className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>成长总览</CardTitle>
                <CardDescription>聚合当前等级、成长进度、积分来源和运营提醒。</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="neutral">积分周期 2026 Q2</Badge>
                <Badge tone="neutral">团队赛季进行中</Badge>
                <Badge tone="accent">个人档案</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="rounded-3xl bg-slate-950 p-5 text-white">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-white/55">
                      {userPointsProfile.userName} / {userPointsProfile.team}
                    </div>
                    <div className="mt-3 text-4xl font-semibold tracking-tight">
                      {formatNumber(userPointsProfile.currentPoints)}
                    </div>
                    <div className="mt-2 text-sm text-white/72">{userPointsProfile.role}</div>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3 text-right">
                    <div className="text-xs text-white/55">团队排名</div>
                    <div className="mt-1 text-2xl font-semibold">#{userPointsProfile.rank}</div>
                  </div>
                </div>

                <div className="mt-5 h-2.5 rounded-full bg-white/10">
                  <div
                    className="h-2.5 rounded-full bg-teal-400"
                    style={{ width: `${Math.max(0, Math.min(pointsTierProgress, 100))}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/72">
                  <span>
                    距离 {userPointsProfile.nextTier} 还差{" "}
                    {formatNumber(userPointsProfile.nextTierThreshold - userPointsProfile.currentPoints)} 积分
                  </span>
                  <span>连续活跃 {userPointsProfile.streakDays} 天</span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <PointsStatCard label="本月新增" value={formatPointsDelta(userPointsProfile.monthlyEarnedPoints)} />
                <PointsStatCard label="待结算" value={formatNumber(userPointsProfile.pendingPoints)} />
                <PointsStatCard label="距上一名" value={formatNumber(pointsToNextRank)} />
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-950">积分来源</h3>
                    <span className="text-xs text-slate-500">最近 30 天</span>
                  </div>
                  <div className="space-y-3">
                    {userPointsBreakdown.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-medium text-slate-700">{item.label}</div>
                          <div className="text-sm font-semibold text-slate-950">
                            {formatNumber(item.points)} 分
                          </div>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-slate-100">
                          <div className="h-2 rounded-full bg-teal-500" style={{ width: `${item.share}%` }} />
                        </div>
                        <div className="mt-2 text-xs text-slate-500">占比 {item.share}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-950">运营提醒</h3>
                    <span className="text-xs text-slate-500">优先处理项</span>
                  </div>
                  <div className="space-y-3">
                    {pointDashboardHighlights.map((highlight) => (
                      <div
                        key={highlight.id}
                        className={highlightCardClasses[highlight.tone]}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-950">{highlight.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{highlight.description}</p>
                          </div>
                          <div className="shrink-0 rounded-2xl bg-white/80 px-3 py-2 text-right ring-1 ring-white/70">
                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                              {highlight.metricLabel}
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-950">{highlight.metricValue}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="panel overflow-hidden">
              <CardHeader className="border-b border-slate-200/80 pb-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>可赚任务</CardTitle>
                    <CardDescription>按优先顺序查看本周仍可获得的积分任务。</CardDescription>
                  </div>
                  <Badge tone="accent">{formatNumber(availableTaskPoints)} 分待领取</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {pointEarningTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="accent">{task.category}</Badge>
                          <Badge tone={task.status === "进行中" ? "warning" : "neutral"}>{task.status}</Badge>
                        </div>
                        <h3 className="mt-3 text-base font-semibold text-slate-950">{task.title}</h3>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>负责人 {task.assignee}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span>截止 {formatDateLabel(task.dueDate)}</span>
                        </div>
                      </div>
                      <div className="shrink-0 rounded-2xl bg-slate-950 px-3 py-2 text-right text-white">
                        <div className="text-xs text-white/60">可得积分</div>
                        <div className="mt-1 text-lg font-semibold">+{formatNumber(task.pointsReward)}</div>
                      </div>
                    </div>

                    <div className="mt-4 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-teal-500"
                        style={{ width: `${Math.max(0, Math.min(task.completionRate, 100))}%` }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-slate-500">完成度 {task.completionRate}%</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="panel">
              <CardHeader>
                <CardTitle>可兑换权益</CardTitle>
                <CardDescription>当前积分可覆盖的培训、客户权益和团队激励。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-teal-700">推荐兑换</div>
                  <div className="mt-2 text-base font-semibold text-slate-950">
                    {userPointsProfile.redeemableReward}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    当前积分余额足够兑换，用于支撑下一轮高价值客户经营动作。
                  </div>
                </div>

                {rewardCatalog.map((reward) => (
                  <div
                    key={reward.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-950">{reward.title}</h3>
                          <Badge tone="neutral">{reward.category}</Badge>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{reward.description}</p>
                      </div>
                      <Badge tone={reward.stockStatus === "充足" ? "success" : reward.stockStatus === "紧张" ? "warning" : "danger"}>
                        {reward.stockStatus}
                      </Badge>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-500">兑换成本</span>
                      <span className="font-semibold text-slate-950">{formatNumber(reward.pointsCost)} 分</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 2xl:grid-cols-[1.1fr_1fr]">
          <Card className="panel">
            <CardHeader className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>团队排行榜</CardTitle>
                <CardDescription>按累计积分查看本周期表现，帮助识别冲榜空间。</CardDescription>
              </div>
              <div className="rounded-2xl bg-slate-950 px-4 py-3 text-sm text-white">
                Lynn 距离第 2 名还差 {formatNumber(pointsToNextRank)} 分
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {teamPointsLeaderboard.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                        #{entry.rank}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-950">{entry.userName}</h3>
                          <Badge tone={entry.userName === userPointsProfile.userName ? "accent" : "neutral"}>
                            {entry.tier}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{entry.team}</p>
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                      <InfoPair label="累计积分" value={formatNumber(entry.totalPoints)} />
                      <InfoPair label="本月新增" value={formatPointsDelta(entry.monthlyDelta)} />
                      <InfoPair label="完成任务" value={`${entry.completedTasks} 项`} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="panel">
            <CardHeader>
              <CardTitle>最近流水</CardTitle>
              <CardDescription>展示最近入账、待结算和兑换支出明细。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pointLedgerEntries.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-950">{entry.title}</span>
                        <Badge tone={entry.status === "已入账" ? "success" : "warning"}>{entry.category}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{formatDateLabel(entry.occurredAt)}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>{entry.status}</span>
                        {entry.relatedAccount ? (
                          <>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span>{entry.relatedAccount}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div
                      className={`shrink-0 text-sm font-semibold ${
                        entry.pointsDelta >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {formatPointsDelta(entry.pointsDelta)}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
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

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-1 font-medium text-slate-700">{value}</div>
    </div>
  );
}

function PointsStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 text-lg font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function formatPointsDelta(value: number) {
  return `${value > 0 ? "+" : ""}${formatNumber(value)}`;
}

const highlightCardClasses = {
  accent: "rounded-2xl border border-teal-100 bg-teal-50/70 p-4",
  success: "rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4",
  warning: "rounded-2xl border border-amber-100 bg-amber-50/80 p-4",
} as const;
