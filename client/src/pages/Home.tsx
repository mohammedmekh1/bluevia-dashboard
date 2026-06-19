import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Users, TrendingUp, Send, CheckSquare,
  RefreshCw, Zap, FileText, AlertCircle,
  CheckCircle, Clock, Loader2, ChevronUp,
  MapPin, Star, Activity, DollarSign,
  AlertTriangle, Wifi, WifiOff, UserCheck,
  Target, BarChart3, Globe,
} from "lucide-react";
import { useSheets } from "@/contexts/SheetsContext";
import DashboardLayout from "@/components/DashboardLayout";
import type { Lead, SalesTask, Article } from "@/hooks/useGoogleSheets";

const DEST_LABELS: Record<string, string> = {
  tunisia: "\u{1F1F9}\u{1F1F3} تونس",
  turkey:  "\u{1F1F9}\u{1F1F7} تركيا",
};

const SERVICE_LABELS: Record<string, string> = {
  flight:  "رحلة طيران",
  hotel:   "فندق",
  package: "باقة سياحية",
  b2b:     "شركات",
};

const CAT_COLORS: Record<string, string> = {
  hot:  "#D4380D",
  warm: "#D4A843",
  cool: "#1A4B8C",
  cold: "#9CA3AF",
};

const CAT_LABELS: Record<string, string> = {
  hot: "ساخن", warm: "دافئ", cool: "بارد", cold: "بارد جداً",
};

const WORKFLOW_STATUS: { name: string; id: string; active: boolean; critical: boolean }[] = [
  { name: "F1: رادار مكة الذكي", id: "n3RDcP2kLQxcPtjP", active: false, critical: true },
  { name: "F2: التقاط العملاء", id: "2opXMMBpcbnzs7xr", active: false, critical: true },
  { name: "F3: تسجيل النقاط", id: "36qkqwFGolnSq3qY", active: false, critical: true },
  { name: "F4: رحلات التسويق", id: "4RO3J5x10uykTcE0", active: false, critical: true },
  { name: "F5: محرك التسليم", id: "5uwRt8r1qyopTX8P", active: false, critical: true },
  { name: "F6: تسليم المبيعات", id: "HgGKdZacfwotrSja", active: false, critical: false },
  { name: "F7: مصنع المحتوى", id: "ZQI3F9Kq5pRgUF07", active: false, critical: false },
  { name: "F8: الناشر الذكي", id: "sxy3yMXokDuKbIsO", active: false, critical: false },
  { name: "F9: لوحة الأداء", id: "pRoADNda9kwKlS47", active: false, critical: false },
  { name: "F10: WordPress", id: "VJKRPuloRtSd0EJG", active: false, critical: false },
  { name: "F11: Barq Radar", id: "DjVfiMqmzXsZQnyJ", active: false, critical: false },
];

const fmtTime = (iso: string) => {
  try { return new Date(iso).toLocaleTimeString("ar-SA", { hour:"2-digit", minute:"2-digit" }); }
  catch { return ""; }
};
const fmtDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString("ar-SA", { month:"short", day:"numeric" }); }
  catch { return iso || "—"; }
};

function KPI({ icon, title, value, sub, color="#1A4B8C", trend }: {
  icon: React.ReactNode; title: string;
  value: string | number; sub?: string; color?: string;
  trend?: { direction: "up" | "down" | "neutral"; label: string };
}) {
  return (
    <Card className="border-border/60 shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl shrink-0" style={{ background: color + "18" }}>
            <div style={{ color }}>{icon}</div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-semibold truncate">{title}</p>
            <p className="text-2xl font-black leading-none mt-1 font-num" style={{ color }}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p>}
            {trend && (
              <p className={`text-xs mt-1 font-semibold ${
                trend.direction === "up" ? "text-green-600" :
                trend.direction === "down" ? "text-red-600" : "text-muted-foreground"
              }`}>
                {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "↔"} {trend.label}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DestCard({ flag, name, count, pct, color }: {
  flag: string; name: string; count: number; pct: number; color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50">
      <span className="text-2xl">{flag}</span>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-bold">{name}</span>
          <span className="text-sm font-black font-num" style={{ color }}>{count}</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all"
               style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}

function WorkflowStatusPanel() {
  const activeCount = WORKFLOW_STATUS.filter((w) => w.active).length;
  const criticalDown = WORKFLOW_STATUS.filter((w) => w.critical && !w.active).length;

  return (
    <Card className="border-border/60 shadow-sm" style={criticalDown > 0 ? { borderRight: "4px solid #D4380D" } : {}}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} />
            حالة الووركفلوز ({activeCount}/{WORKFLOW_STATUS.length})
          </div>
          {criticalDown > 0 && (
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 flex items-center gap-1">
              <AlertTriangle size={12} /> {criticalDown} حرجة متوقفة
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {WORKFLOW_STATUS.map((w) => (
            <div key={w.id}
                 className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                   w.active ? "bg-green-50" : w.critical ? "bg-red-50" : "bg-yellow-50"
                 }`}>
              {w.active
                ? <Wifi size={12} className="text-green-600 shrink-0" />
                : <WifiOff size={12} className={w.critical ? "text-red-600 shrink-0" : "text-yellow-600 shrink-0"} />
              }
              <span className={`font-semibold truncate ${
                w.active ? "text-green-700" : w.critical ? "text-red-700" : "text-yellow-700"
              }`}>
                {w.name}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BudgetPanel({ dailyReports }: { dailyReports: { bookings: number; total_leads: number }[] }) {
  const dailyBudget = 2.0;
  const estimatedCostPerExec = 0.003;
  const totalExecs = dailyReports.length > 0
    ? dailyReports[dailyReports.length - 1].total_leads * 5
    : 0;
  const estimatedDailyCost = totalExecs * estimatedCostPerExec;
  const budgetUsage = Math.min(100, Math.round((estimatedDailyCost / dailyBudget) * 100));
  const remaining = Math.max(0, dailyBudget - estimatedDailyCost).toFixed(2);

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <DollarSign size={16} />
          ميزانية التشغيل اليومية
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center p-3 rounded-xl bg-blue-50">
            <p className="text-xl font-black font-num text-blue-700">${dailyBudget}</p>
            <p className="text-xs text-blue-600 font-semibold mt-0.5">الميزانية</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-orange-50">
            <p className="text-xl font-black font-num text-orange-700">${estimatedDailyCost.toFixed(2)}</p>
            <p className="text-xs text-orange-600 font-semibold mt-0.5">المُستهلك (تقديري)</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-green-50">
            <p className="text-xl font-black font-num text-green-700">${remaining}</p>
            <p className="text-xs text-green-600 font-semibold mt-0.5">المتبقي</p>
          </div>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all"
               style={{
                 width: `${budgetUsage}%`,
                 background: budgetUsage > 80 ? "#D4380D" : budgetUsage > 50 ? "#D4A843" : "#15803D"
               }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">{budgetUsage}% من الميزانية اليومية</p>
      </CardContent>
    </Card>
  );
}

function ConversionFunnel({ leads, tasks, deliveries }: {
  leads: number; tasks: number; deliveries: number;
}) {
  const steps = [
    { label: "عملاء محتملون", value: leads, color: "#1A4B8C" },
    { label: "مهام مبيعات", value: tasks, color: "#D4A843" },
    { label: "تم التسليم", value: deliveries, color: "#15803D" },
  ];

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Target size={16} /> قمع التحويل
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step, i) => {
            const pct = leads > 0 ? Math.round((step.value / leads) * 100) : 0;
            return (
              <div key={step.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-semibold">{step.label}</span>
                  <span className="text-xs font-black font-num" style={{ color: step.color }}>
                    {step.value} ({pct}%)
                  </span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                       style={{ width: `${pct}%`, background: step.color }} />
                </div>
                {i < steps.length - 1 && (
                  <div className="text-center text-muted-foreground text-xs mt-1">↓</div>
                )}
              </div>
            );
          })}
        </div>
        {leads > 0 && (
          <div className="mt-3 p-2.5 bg-secondary/50 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">
              معدل التحويل الإجمالي: <span className="font-black text-foreground">
                {Math.round((deliveries / leads) * 100)}%
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Loading() {
  return (
    <DashboardLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin size-10" style={{ color: "#1A4B8C" }} />
          <p className="text-muted-foreground">جاري تحميل بيانات بلوفيا...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ErrorView({ msg, retry }: { msg: string; retry: () => void }) {
  return (
    <DashboardLayout>
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-destructive/30">
          <CardContent className="p-8 flex flex-col items-center gap-4 text-center">
            <AlertCircle className="size-12 text-destructive" />
            <p className="font-bold text-lg">تعذّر تحميل البيانات</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{msg}</p>
            <Button onClick={retry} variant="outline" className="gap-2">
              <RefreshCw size={15} /> إعادة المحاولة
            </Button>
            <p className="text-xs text-muted-foreground">
              تأكّد أن الشيت مشارك (Anyone with link &rarr; Viewer)
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function Home() {
  const [filter, setFilter] = useState<"today"|"week"|"month"|"all">("all");
  const { data, summary, loading, error, refetch } = useSheets();

  if (loading) return <Loading />;
  if (error)   return <ErrorView msg={error} retry={refetch} />;

  const now = new Date();
  const filterDate = (iso: string) => {
    if (filter === "all" || !iso) return true;
    const d = new Date(iso);
    if (filter === "today") return d.toDateString() === now.toDateString();
    if (filter === "week")  return (now.getTime() - d.getTime()) < 7  * 86400000;
    if (filter === "month") return (now.getTime() - d.getTime()) < 30 * 86400000;
    return true;
  };

  const fLeads = data.leads.filter((l) => !l.is_demo && filterDate(l.created_at));
  const totalFL = fLeads.length || 1;

  const tunCount = fLeads.filter((l) => l.destination === "tunisia").length;
  const turCount = fLeads.filter((l) => l.destination === "turkey").length;

  const catData = (["hot","warm","cool","cold"] as const)
    .map((c) => ({ name: CAT_LABELS[c], value: fLeads.filter((l) => l.category === c).length, fill: CAT_COLORS[c] }))
    .filter((d) => d.value > 0);

  const svcCount: Record<string,number> = {};
  fLeads.forEach((l) => {
    const s = SERVICE_LABELS[l.service_type] || l.service_type || "غير محدد";
    svcCount[s] = (svcCount[s] || 0) + 1;
  });
  const svcData = Object.entries(svcCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a,b) => b.value - a.value);

  const timeData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString("ar-SA", { weekday: "short" });
    const leads = data.leads.filter((l) => !l.is_demo &&
      new Date(l.created_at).toDateString() === d.toDateString()).length;
    const tasks = data.salesTasks.filter((t) =>
      new Date(t.created_at).toDateString() === d.toDateString()).length;
    return { date: label, leads, tasks };
  });

  const srcCount: Record<string,number> = {};
  fLeads.forEach((l) => {
    const s = l.platform || l.source || "غير معروف";
    srcCount[s] = (srcCount[s] || 0) + 1;
  });
  const srcData = Object.entries(srcCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a,b) => b.value - a.value).slice(0, 8);

  const budgetCount: Record<string,number> = {};
  fLeads.forEach((l) => {
    if (!l.budget_signal) return;
    budgetCount[l.budget_signal] = (budgetCount[l.budget_signal] || 0) + 1;
  });
  const budgetData = Object.entries(budgetCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a,b) => b.value - a.value);

  const todayReport = data.dailyReports[data.dailyReports.length - 1];
  const yesterdayReport = data.dailyReports.length >= 2
    ? data.dailyReports[data.dailyReports.length - 2] : null;

  const leadsTrend = yesterdayReport
    ? { direction: (summary.totalLeads > yesterdayReport.total_leads ? "up" : summary.totalLeads < yesterdayReport.total_leads ? "down" : "neutral") as "up"|"down"|"neutral",
        label: `${Math.abs(summary.totalLeads - yesterdayReport.total_leads)} عن أمس` }
    : undefined;

  const deliveredCount = data.deliveries.filter((d) => d.status === "delivered").length;

  const travelGroupCount: Record<string,number> = {};
  fLeads.forEach((l) => {
    const g = l.travel_group || "غير محدد";
    travelGroupCount[g] = (travelGroupCount[g] || 0) + 1;
  });
  const groupData = Object.entries(travelGroupCount)
    .map(([name, value]) => ({ name: name === "solo" ? "فردي" : name === "couple" ? "زوجين" : name === "family" ? "عائلة" : name === "group" ? "مجموعة" : name, value }))
    .sort((a,b) => b.value - a.value);

  return (
    <DashboardLayout>
      <div className="p-5 md:p-7 max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">
          <div>
            <h1 className="text-2xl md:text-3xl font-black" style={{ color: "#1A4B8C" }}>
              بلوفيا ترافل
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              لوحة الإدارة الشاملة — تونس وتركيا
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["today","week","month","all"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                      className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                      style={filter === f
                        ? { background: "#1A4B8C", color: "#fff" }
                        : { background: "var(--secondary)", color: "var(--foreground)" }
                      }>
                {{today:"اليوم",week:"أسبوع",month:"شهر",all:"الكل"}[f]}
              </button>
            ))}
            <Button onClick={refetch} variant="outline" size="sm" className="gap-1.5">
              <RefreshCw size={14}/> تحديث
            </Button>
            {data.lastUpdated && (
              <span className="text-xs text-muted-foreground hidden lg:block">
                {fmtTime(data.lastUpdated)}
              </span>
            )}
          </div>
        </div>

        {/* System Alert */}
        {WORKFLOW_STATUS.filter((w) => w.critical && !w.active).length > 0 && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertTriangle className="text-red-600 shrink-0" size={20} />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-700">تنبيه: ووركفلوز حرجة متوقفة</p>
              <p className="text-xs text-red-600">
                {WORKFLOW_STATUS.filter((w) => w.critical && !w.active).map((w) => w.name).join("، ")} — يُرجى تفعيلها من n8n
              </p>
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
          <KPI icon={<Users size={18}/>}       title="إجمالي العملاء"    value={summary.totalLeads}         sub={`${summary.hotLeads} ساخن · ${summary.warmLeads} دافئ`} color="#1A4B8C" trend={leadsTrend}/>
          <KPI icon={<Zap size={18}/>}         title="عملاء ساخنون"     value={summary.hotLeads}           sub="أولوية قصوى"                       color="#D4380D"/>
          <KPI icon={<MapPin size={18}/>}      title="رحلات تونس"       value={summary.tunisiaLeads}       sub={`${summary.totalLeads ? Math.round(summary.tunisiaLeads/summary.totalLeads*100) : 0}% من الإجمالي`} color="#D4A843"/>
          <KPI icon={<MapPin size={18}/>}      title="رحلات تركيا"      value={summary.turkeyLeads}        sub={`${summary.totalLeads ? Math.round(summary.turkeyLeads/summary.totalLeads*100) : 0}% من الإجمالي`} color="#1A4B8C"/>
          <KPI icon={<Send size={18}/>}        title="معدل التسليم"     value={`${summary.deliveryRate}%`} sub={`${deliveredCount} ناجح`}          color="#15803D"/>
          <KPI icon={<CheckSquare size={18}/>} title="مهام مفتوحة"      value={summary.openTasks}          sub={`${summary.escalatedTasks} عاجلة`} color="#D97706"/>
          <KPI icon={<Star size={18}/>}        title="متوسط الدرجة"     value={summary.avgScore}           sub="من 100"                            color="#D4A843"/>
          <KPI icon={<FileText size={18}/>}    title="مقالات منشورة"    value={summary.publishedArticles}  sub={`${summary.readyArticles} جاهزة`}  color="#1A4B8C"/>
          <KPI icon={<TrendingUp size={18}/>}  title="إجمالي الحجوزات"  value={summary.totalBookings}      sub="من التقارير"                       color="#15803D"/>
          <KPI icon={<UserCheck size={18}/>}   title="معدل التحويل"     value={`${summary.totalLeads > 0 ? Math.round(deliveredCount / summary.totalLeads * 100) : 0}%`}
               sub="عميل → تسليم" color="#1A4B8C"/>
        </div>

        {/* Workflow Status + Budget */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <WorkflowStatusPanel />
          <BudgetPanel dailyReports={data.dailyReports} />
        </div>

        {/* Destinations + 7-day chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-muted-foreground">توزيع الوجهات</h3>
            <DestCard flag="\u{1F1F9}\u{1F1F3}" name="تونس"  count={tunCount}
                      pct={Math.round(tunCount/totalFL*100)} color="#D4A843"/>
            <DestCard flag="\u{1F1F9}\u{1F1F7}" name="تركيا" count={turCount}
                      pct={Math.round(turCount/totalFL*100)} color="#1A4B8C"/>
            <div className="p-3 rounded-xl border border-border/50 bg-secondary/50">
              <p className="text-xs text-muted-foreground">غير محدد</p>
              <p className="text-xl font-black font-num">
                {fLeads.filter((l) => !l.destination).length}
              </p>
            </div>
            <ConversionFunnel
              leads={summary.totalLeads}
              tasks={data.salesTasks.length}
              deliveries={deliveredCount}
            />
          </div>

          <Card className="lg:col-span-2 border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">العملاء والمهام — آخر 7 أيام</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={timeData}>
                  <defs>
                    <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1A4B8C" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1A4B8C" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4A843" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#D4A843" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DDE4EF"/>
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11}/>
                  <YAxis stroke="#9CA3AF" fontSize={11} allowDecimals={false}/>
                  <Tooltip contentStyle={{ borderRadius:8, fontFamily:"Cairo", fontSize:12 }}/>
                  <Legend wrapperStyle={{ fontFamily:"Cairo", fontSize:12 }}/>
                  <Area type="monotone" dataKey="leads" stroke="#1A4B8C" fill="url(#gL)" strokeWidth={2} name="عملاء"/>
                  <Area type="monotone" dataKey="tasks" stroke="#D4A843" fill="url(#gT)" strokeWidth={2} name="مهام"/>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mb-5">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">توزيع التصنيفات</CardTitle>
            </CardHeader>
            <CardContent>
              {catData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={catData} cx="50%" cy="50%" innerRadius={50} outerRadius={78}
                           paddingAngle={3} dataKey="value">
                        {catData.map((e,i) => <Cell key={i} fill={e.fill}/>)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius:8, fontFamily:"Cairo", fontSize:12 }}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {catData.map((d) => (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }}/>
                        <span className="text-muted-foreground">{d.name}: <span className="font-bold text-foreground">{d.value}</span></span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">أنواع الخدمات</CardTitle>
            </CardHeader>
            <CardContent>
              {svcData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={svcData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#DDE4EF"/>
                    <XAxis type="number" stroke="#9CA3AF" fontSize={11} allowDecimals={false}/>
                    <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={90} fontSize={11}/>
                    <Tooltip contentStyle={{ borderRadius:8, fontFamily:"Cairo", fontSize:12 }}/>
                    <Bar dataKey="value" fill="#1A4B8C" radius={[0,6,6,0]} name="العملاء"/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">نوع المسافرين</CardTitle>
            </CardHeader>
            <CardContent>
              {groupData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={groupData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DDE4EF"/>
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11}/>
                    <YAxis stroke="#9CA3AF" fontSize={11} allowDecimals={false}/>
                    <Tooltip contentStyle={{ borderRadius:8, fontFamily:"Cairo", fontSize:12 }}/>
                    <Bar dataKey="value" fill="#15803D" radius={[6,6,0,0]} name="العملاء"/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">إشارات الميزانية</CardTitle>
            </CardHeader>
            <CardContent>
              {budgetData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={budgetData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DDE4EF"/>
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11}/>
                    <YAxis stroke="#9CA3AF" fontSize={11} allowDecimals={false}/>
                    <Tooltip contentStyle={{ borderRadius:8, fontFamily:"Cairo", fontSize:12 }}/>
                    <Bar dataKey="value" fill="#D4A843" radius={[6,6,0,0]} name="العملاء"/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
                آخر العملاء الساخنين
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fLeads.filter((l) => l.category === "hot").length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">لا يوجد عملاء ساخنون</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60">
                        {["الاسم","الوجهة","الخدمة","الدرجة","القناة"].map((h) => (
                          <th key={h} className="text-right py-2 px-2 text-xs font-bold text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {fLeads.filter((l: Lead) => l.category === "hot").slice(0, 8).map((l: Lead) => (
                        <tr key={l.lead_id} className="border-b border-border/40 hover:bg-secondary/30 transition-colors">
                          <td className="py-2 px-2 font-semibold">{l.name || "—"}</td>
                          <td className="py-2 px-2 text-xs">{DEST_LABELS[l.destination] || l.destination || "—"}</td>
                          <td className="py-2 px-2 text-xs text-muted-foreground">{SERVICE_LABELS[l.service_type] || l.service_type || "—"}</td>
                          <td className="py-2 px-2">
                            <span className="px-2 py-0.5 rounded text-xs font-bold text-white"
                                  style={{ background: "#1A4B8C" }}>{l.final_score}</span>
                          </td>
                          <td className="py-2 px-2 text-xs text-muted-foreground">{l.platform || l.source || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">المهام العاجلة</CardTitle>
            </CardHeader>
            <CardContent>
              {data.salesTasks.filter((t) => t.task_status !== "closed").length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8">
                  <CheckCircle className="size-8 text-green-500"/>
                  <p className="text-muted-foreground text-sm">لا توجد مهام مفتوحة</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {data.salesTasks.filter((t: SalesTask) => t.task_status !== "closed").slice(0, 6).map((t: SalesTask) => (
                    <div key={t.task_id} className="p-3 border border-border/60 rounded-xl hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{t.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {DEST_LABELS[t.destination] || t.destination || "—"} · {t.action_required}
                          </p>
                          {t.sla_minutes > 0 && (
                            <p className="text-xs text-orange-600 flex items-center gap-1 mt-0.5">
                              <Clock size={10}/> SLA: {t.sla_minutes} دقيقة
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold text-white shrink-0 ${
                          t.task_status === "escalated" ? "bg-red-600" : "bg-orange-500"
                        }`}>
                          {t.task_status === "escalated" ? "عاجل" : "مفتوح"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sources + Articles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Globe size={16}/> مصادر العملاء
              </CardTitle>
            </CardHeader>
            <CardContent>
              {srcData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={srcData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DDE4EF"/>
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10}/>
                    <YAxis stroke="#9CA3AF" fontSize={11} allowDecimals={false}/>
                    <Tooltip contentStyle={{ borderRadius:8, fontFamily:"Cairo", fontSize:12 }}/>
                    <Bar dataKey="value" fill="#1A4B8C" radius={[6,6,0,0]} name="العملاء"/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText size={16}/> آخر مقالات SEO
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label:"منشورة", val:summary.publishedArticles, cls:"bg-green-50 text-green-700" },
                  { label:"جاهزة",  val:summary.readyArticles,     cls:"bg-blue-50 text-blue-700" },
                  { label:"متوسط SEO", val:summary.avgSeo,         cls:"bg-yellow-50 text-yellow-700" },
                ].map((s) => (
                  <div key={s.label} className={`text-center p-2.5 rounded-xl ${s.cls}`}>
                    <p className="text-xl font-black font-num">{s.val}</p>
                    <p className="text-xs mt-0.5 font-semibold">{s.label}</p>
                  </div>
                ))}
              </div>
              {data.articles.filter((a) => a.status === "published").length > 0 ? (
                <div className="space-y-2">
                  {data.articles.filter((a: Article) => a.status === "published").slice(0, 4).map((a: Article) => (
                    <div key={a.article_id} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0">
                      <div className="flex-1 min-w-0 pl-3">
                        <p className="text-sm font-medium truncate">{a.title_ar || a.meta_title}</p>
                        <p className="text-xs text-muted-foreground">{DEST_LABELS[a.destination] || a.destination || "—"}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                          a.seo_score >= 85 ? "bg-green-100 text-green-700" :
                          a.seo_score >= 70 ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>SEO {a.seo_score}</span>
                        <span className="text-xs text-muted-foreground">{fmtDate(a.published_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground text-sm py-4">لا توجد مقالات منشورة بعد</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Daily Report */}
        {todayReport && (
          <Card className="border-border/60 shadow-sm mb-5" style={{ borderRight: "4px solid #1A4B8C" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span>آخر تقرير يومي</span>
                <span className="text-sm font-normal text-muted-foreground">{fmtDate(todayReport.date)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  { label:"إجمالي العملاء", val:todayReport.total_leads },
                  { label:"ساخنون",         val:todayReport.hot_leads },
                  { label:"دافئون",         val:todayReport.warm_leads },
                  { label:"معدل التسليم",   val:`${todayReport.delivery_rate}%` },
                  { label:"المهام المفتوحة", val:todayReport.open_tasks },
                  { label:"المغلقة",        val:todayReport.closed_tasks },
                  { label:"الحجوزات",       val:todayReport.bookings },
                ].map((s) => (
                  <div key={s.label} className="p-3 bg-secondary/60 rounded-xl text-center">
                    <p className="text-lg font-black font-num" style={{ color:"#1A4B8C" }}>{s.val}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              {todayReport.notes && (
                <p className="text-xs text-muted-foreground mt-3 p-2.5 bg-secondary/40 rounded-lg">
                  {todayReport.notes}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground py-4">
          بلوفيا ترافل · تونس وتركيا · بيانات من Google Sheets
          {data.lastUpdated ? ` · آخر تحديث ${fmtTime(data.lastUpdated)}` : ""}
        </p>
      </div>
    </DashboardLayout>
  );
}
