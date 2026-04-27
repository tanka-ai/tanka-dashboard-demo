import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  crmActivityFeed,
  crmCustomers,
  crmFollowUps,
  crmOpportunities,
  crmPipelineStages,
  getCrmMetrics,
} from "@/lib/mock-crm-data";
import { formatCompactCurrency, formatDateLabel } from "@/lib/utils";

const riskToneClasses = {
  low: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  medium: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  high: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
} as const;

const priorityToneClasses = {
  normal: "bg-slate-100 text-slate-700",
  key: "bg-sky-100 text-sky-700",
  urgent: "bg-rose-100 text-rose-700",
} as const;

export default function HomePage() {
  const metrics = getCrmMetrics();
  const focusAccounts = crmCustomers.filter((customer) => customer.priority !== "normal");

  return (
    <main className="crm-shell min-h-screen px-4 py-6 text-slate-950 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="panel overflow-hidden">
          <div className="flex flex-col gap-8 px-6 py-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-white uppercase">
                  Customer Follow-Up
                </span>
                <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                  Tanka App Platform / dashboard-demo
                </span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                客户跟进 CRM
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                用一个工作台管理今日跟进、商机推进、客户健康度和最近动态。当前数据来自本地示例，后续可替换为
                Airtable 或内部 CRM 数据层。
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                导入 Airtable 映射
              </button>
              <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
                新增跟进任务
              </button>
            </div>
          </div>

          <div className="grid gap-px bg-slate-200/70 md:grid-cols-4">
            <MetricTile
              label="活跃客户"
              value={String(metrics.activeCustomers)}
              helper="本周有互动或在推进中的客户"
            />
            <MetricTile
              label="今日待跟进"
              value={String(metrics.todayFollowUps)}
              helper="需要在今天完成的外呼、复盘或演示"
            />
            <MetricTile
              label="在手商机金额"
              value={formatCompactCurrency(metrics.openPipelineAmount)}
              helper="未签约但仍在推进的总金额"
            />
            <MetricTile
              label="高风险客户"
              value={String(metrics.highRiskCustomers)}
              helper="健康度偏低或超期未联系"
            />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <Card className="panel">
            <CardHeader className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>今日跟进队列</CardTitle>
                <CardDescription>按优先级整理销售和客户成功团队今日需要处理的动作。</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="neutral">全部负责人</Badge>
                <Badge tone="neutral">本周截止</Badge>
                <Badge tone="accent">重点客户优先</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {crmFollowUps.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="accent">{item.type}</Badge>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityToneClasses[item.priority]}`}
                        >
                          {item.priority === "urgent"
                            ? "紧急"
                            : item.priority === "key"
                              ? "重点"
                              : "常规"}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${riskToneClasses[item.riskLevel]}`}
                        >
                          {item.riskLevel === "high"
                            ? "高风险"
                            : item.riskLevel === "medium"
                              ? "中风险"
                              : "低风险"}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{item.notes}</p>
                      </div>
                    </div>

                    <div className="grid min-w-[220px] gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-1">
                      <InfoPair label="客户" value={item.accountName} />
                      <InfoPair label="负责人" value={item.owner} />
                      <InfoPair label="截止时间" value={formatDateLabel(item.dueDate)} />
                      <InfoPair label="下个目标" value={item.nextStep} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="panel">
              <CardHeader>
                <CardTitle>重点客户健康度</CardTitle>
                <CardDescription>优先盯住正在谈判或有流失风险的客户。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {focusAccounts.map((customer) => (
                  <div
                    key={customer.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-950">{customer.name}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {customer.segment} / 所有者 {customer.owner}
                        </p>
                      </div>
                      <Badge tone={customer.healthScore >= 80 ? "success" : customer.healthScore >= 60 ? "warning" : "danger"}>
                        健康度 {customer.healthScore}
                      </Badge>
                    </div>

                    <div className="mt-4 h-2.5 rounded-full bg-slate-100">
                      <div
                        className={`h-2.5 rounded-full ${
                          customer.healthScore >= 80
                            ? "bg-emerald-500"
                            : customer.healthScore >= 60
                              ? "bg-amber-500"
                              : "bg-rose-500"
                        }`}
                        style={{ width: `${customer.healthScore}%` }}
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>上次联系 {formatDateLabel(customer.lastContactAt)}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span>下一动作 {customer.nextAction}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="panel">
              <CardHeader>
                <CardTitle>近期活动</CardTitle>
                <CardDescription>团队最近 72 小时的关键触点。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {crmActivityFeed.map((activity) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                      {activity.owner.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-950">{activity.title}</span>
                        <Badge tone="neutral">{activity.kind}</Badge>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{activity.summary}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{activity.accountName}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>{activity.owner}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>{formatDateLabel(activity.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 2xl:grid-cols-[1.45fr_1fr]">
          <Card className="panel">
            <CardHeader className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>商机推进看板</CardTitle>
                <CardDescription>按阶段查看当前在手项目和金额分布。</CardDescription>
              </div>
              <div className="rounded-2xl bg-slate-950 px-4 py-3 text-sm text-white">
                成交预测 {formatCompactCurrency(metrics.weightedForecastAmount)}
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 pt-6 xl:grid-cols-4">
              {crmPipelineStages.map((stage) => (
                <div key={stage.id} className="rounded-3xl bg-slate-50 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-950">{stage.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {stage.opportunityIds.length} 个商机 / {formatCompactCurrency(stage.totalAmount)}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                      {stage.winRate}% Win
                    </span>
                  </div>

                  <div className="space-y-3">
                    {crmOpportunities
                      .filter((opportunity) => stage.opportunityIds.includes(opportunity.id))
                      .map((opportunity) => (
                        <div
                          key={opportunity.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="font-medium text-slate-950">{opportunity.name}</h4>
                              <p className="mt-1 text-sm text-slate-500">{opportunity.accountName}</p>
                            </div>
                            <Badge tone="neutral">{opportunity.owner}</Badge>
                          </div>
                          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>{formatCompactCurrency(opportunity.amount)}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span>预计 {formatDateLabel(opportunity.expectedCloseDate)}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span>{opportunity.probability}% 概率</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="panel">
            <CardHeader>
              <CardTitle>账户概览</CardTitle>
              <CardDescription>按客户关系状态快速扫描需要升级处理的账户。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {crmCustomers.map((customer) => (
                <div key={customer.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-950">{customer.name}</h3>
                        <Badge tone="neutral">{customer.stage}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {customer.contactName} / {customer.role}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-950">{formatCompactCurrency(customer.arr)}</div>
                      <div className="text-xs text-slate-500">年度价值</div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <InfoPair label="负责人" value={customer.owner} />
                    <InfoPair label="最近联系" value={formatDateLabel(customer.lastContactAt)} />
                    <InfoPair label="下个动作" value={customer.nextAction} />
                    <InfoPair label="所在行业" value={customer.industry} />
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
