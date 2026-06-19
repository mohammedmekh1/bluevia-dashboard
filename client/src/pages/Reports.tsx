import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSheets } from "@/contexts/SheetsContext";
import { RefreshCw, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, Legend,
  AreaChart, Area,
} from "recharts";

export default function Reports() {
  const { data, loading, refetch } = useSheets();

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin size-8" style={{ color:"#1A4B8C" }}/>
      </div>
    </DashboardLayout>
  );

  const reports = [...data.dailyReports].reverse().slice(0, 14);
  const chartData = [...reports].reverse().map((r) => ({
    date:     r.date.slice(5),
    leads:    r.total_leads,
    hot:      r.hot_leads,
    warm:     r.warm_leads,
    delivery: r.delivery_rate,
    bookings: r.bookings,
    openTasks: r.open_tasks,
    convRate: r.week_conv_rate,
  }));

  const latest = data.dailyReports[data.dailyReports.length - 1];
  const prev = data.dailyReports.length >= 2 ? data.dailyReports[data.dailyReports.length - 2] : null;

  const trends = latest && prev ? [
    { label: "العملاء", current: latest.total_leads, previous: prev.total_leads },
    { label: "ساخنون", current: latest.hot_leads, previous: prev.hot_leads },
    { label: "معدل التسليم", current: latest.delivery_rate, previous: prev.delivery_rate, suffix: "%" },
    { label: "الحجوزات", current: latest.bookings, previous: prev.bookings },
    { label: "مهام مفتوحة", current: latest.open_tasks, previous: prev.open_tasks, inverse: true },
    { label: "متوسط الدرجة", current: latest.avg_score, previous: prev.avg_score },
  ] : [];

  const sourceBreakdown = reports.length > 0 ? [
    { name: "الرادار", value: reports.reduce((s,r) => s + r.from_radar, 0) },
    { name: "واتساب", value: reports.reduce((s,r) => s + r.from_whatsapp, 0) },
    { name: "النموذج", value: reports.reduce((s,r) => s + r.from_form, 0) },
  ].filter((d) => d.value > 0) : [];

  return (
    <DashboardLayout>
      <div className="p-5 md:p-7 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black" style={{ color:"#1A4B8C" }}>التقارير والتحليلات</h1>
            <p className="text-sm text-muted-foreground mt-0.5">آخر {reports.length} تقرير يومي</p>
          </div>
          <Button onClick={refetch} variant="outline" size="sm" className="gap-1.5">
            <RefreshCw size={14}/> تحديث
          </Button>
        </div>

        {/* Trend Comparison */}
        {trends.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
            {trends.map((t) => {
              const diff = t.current - t.previous;
              const isGood = t.inverse ? diff <= 0 : diff >= 0;
              return (
                <div key={t.label} className="p-3 rounded-xl border border-border/60 text-center">
                  <p className="text-xl font-black font-num" style={{ color:"#1A4B8C" }}>
                    {t.current}{t.suffix || ""}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.label}</p>
                  <p className={`text-xs font-semibold mt-1 flex items-center justify-center gap-0.5 ${
                    diff === 0 ? "text-muted-foreground" : isGood ? "text-green-600" : "text-red-600"
                  }`}>
                    {diff > 0 ? <TrendingUp size={10}/> : diff < 0 ? <TrendingDown size={10}/> : <Minus size={10}/>}
                    {diff > 0 ? "+" : ""}{diff}{t.suffix || ""} عن أمس
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">العملاء يومياً</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1A4B8C" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1A4B8C" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gHot" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4380D" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#D4380D" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DDE4EF"/>
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11}/>
                  <YAxis stroke="#9CA3AF" fontSize={11}/>
                  <Tooltip contentStyle={{ borderRadius:8, fontFamily:"Cairo", fontSize:12 }}/>
                  <Legend wrapperStyle={{ fontFamily:"Cairo", fontSize:12 }}/>
                  <Area type="monotone" dataKey="leads" stroke="#1A4B8C" fill="url(#gLeads)" strokeWidth={2} name="إجمالي"/>
                  <Area type="monotone" dataKey="hot" stroke="#D4380D" fill="url(#gHot)" strokeWidth={2} name="ساخنون"/>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">معدل التسليم والحجوزات</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DDE4EF"/>
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11}/>
                  <YAxis stroke="#9CA3AF" fontSize={11}/>
                  <Tooltip contentStyle={{ borderRadius:8, fontFamily:"Cairo", fontSize:12 }}/>
                  <Legend wrapperStyle={{ fontFamily:"Cairo", fontSize:12 }}/>
                  <Line type="monotone" dataKey="delivery" stroke="#D4A843" strokeWidth={2} dot={false} name="التسليم %"/>
                  <Line type="monotone" dataKey="bookings" stroke="#15803D" strokeWidth={2} dot={false} name="الحجوزات"/>
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Source Breakdown */}
          {sourceBreakdown.length > 0 && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">مصادر العملاء (تجميعي)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sourceBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DDE4EF"/>
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11}/>
                    <YAxis stroke="#9CA3AF" fontSize={11}/>
                    <Tooltip contentStyle={{ borderRadius:8, fontFamily:"Cairo", fontSize:12 }}/>
                    <Bar dataKey="value" fill="#1A4B8C" radius={[6,6,0,0]} name="العملاء"/>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Tasks Trend */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">المهام المفتوحة يومياً</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DDE4EF"/>
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11}/>
                  <YAxis stroke="#9CA3AF" fontSize={11}/>
                  <Tooltip contentStyle={{ borderRadius:8, fontFamily:"Cairo", fontSize:12 }}/>
                  <Bar dataKey="openTasks" fill="#D97706" radius={[6,6,0,0]} name="مهام مفتوحة"/>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Reports Table */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">سجل التقارير اليومية</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-secondary/40">
                    {["التاريخ","العملاء","ساخنون","دافئون","متوسط الدرجة","معدل التسليم","المهام","المغلقة","الحجوزات","التقييم"].map((h) => (
                      <th key={h} className="text-right py-2.5 px-3 text-xs font-bold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.dailyReports.slice().reverse().map((r) => (
                    <tr key={r.report_id} className="border-b border-border/40 hover:bg-secondary/30">
                      <td className="py-2.5 px-3 font-medium">{r.date}</td>
                      <td className="py-2.5 px-3 font-num">{r.total_leads}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold">{r.hot_leads}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-bold">{r.warm_leads}</span>
                      </td>
                      <td className="py-2.5 px-3 font-num">{r.avg_score}</td>
                      <td className="py-2.5 px-3">
                        <span className={`font-num font-bold text-xs ${
                          r.delivery_rate >= 80 ? "text-green-700" : r.delivery_rate >= 50 ? "text-yellow-700" : "text-red-700"
                        }`}>{r.delivery_rate}%</span>
                      </td>
                      <td className="py-2.5 px-3 font-num">{r.open_tasks}</td>
                      <td className="py-2.5 px-3 font-num">{r.closed_tasks}</td>
                      <td className="py-2.5 px-3 font-num">{r.bookings}</td>
                      <td className="py-2.5 px-3 text-xs">{r.overall_rating || "—"}</td>
                    </tr>
                  ))}
                  {data.dailyReports.length === 0 && (
                    <tr><td colSpan={10} className="text-center py-8 text-muted-foreground">لا توجد تقارير بعد</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
