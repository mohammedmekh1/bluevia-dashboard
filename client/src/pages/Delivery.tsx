import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSheets } from "@/contexts/SheetsContext";
import { Loader2, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

export default function Delivery() {
  const { data, loading } = useSheets();
  const [statusFilter, setStatusFilter] = useState<"all"|"delivered"|"failed">("all");
  const [channelFilter, setChannelFilter] = useState<"all"|string>("all");

  if (loading) return <DashboardLayout><div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin size-8" style={{ color:"#1A4B8C" }}/></div></DashboardLayout>;

  const delivered = data.deliveries.filter((d) => d.status === "delivered").length;
  const failed = data.deliveries.length - delivered;
  const rate = data.deliveries.length ? Math.round(delivered/data.deliveries.length*100) : 0;

  const channels = useMemo(() => {
    const ch: Record<string, { total: number; success: number }> = {};
    data.deliveries.forEach((d) => {
      const c = d.channel || "غير محدد";
      if (!ch[c]) ch[c] = { total: 0, success: 0 };
      ch[c].total++;
      if (d.status === "delivered") ch[c].success++;
    });
    return Object.entries(ch).map(([name, v]) => ({
      name,
      total: v.total,
      success: v.success,
      rate: Math.round(v.success / v.total * 100),
    })).sort((a,b) => b.total - a.total);
  }, [data.deliveries]);

  const channelNames = useMemo(() => Array.from(new Set(data.deliveries.map((d) => d.channel || "غير محدد"))), [data.deliveries]);

  const filteredDeliveries = useMemo(() => {
    return data.deliveries
      .filter((d) => statusFilter === "all" || d.status === statusFilter)
      .filter((d) => channelFilter === "all" || (d.channel || "غير محدد") === channelFilter);
  }, [data.deliveries, statusFilter, channelFilter]);

  const pieData = [
    { name: "ناجح", value: delivered, fill: "#15803D" },
    { name: "فاشل", value: failed, fill: "#C0392B" },
  ].filter((d) => d.value > 0);

  const errorReasons: Record<string,number> = {};
  data.deliveries.filter((d) => d.status === "failed").forEach((d) => {
    const r = d.error_reason || "سبب غير محدد";
    errorReasons[r] = (errorReasons[r] || 0) + 1;
  });
  const errorData = Object.entries(errorReasons)
    .map(([name, value]) => ({ name: name.slice(0, 30), value }))
    .sort((a,b) => b.value - a.value)
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="p-5 md:p-7 max-w-[1400px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black" style={{ color:"#1A4B8C" }}>سجل التسليم</h1>
          <p className="text-sm text-muted-foreground">{data.deliveries.length} سجل · معدل النجاح {rate}%</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label:"إجمالي", val:data.deliveries.length, color:"#1A4B8C" },
            { label:"ناجح",   val:delivered,               color:"#15803D" },
            { label:"فاشل",   val:failed,                  color:"#C0392B" },
            { label:"معدل النجاح", val:`${rate}%`,          color:"#D4A843" },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl border border-border/60 bg-card text-center">
              <p className="text-2xl font-black font-num" style={{ color:s.color }}>{s.val}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">نسبة النجاح</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value">
                      {pieData.map((e,i) => <Cell key={i} fill={e.fill}/>)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius:8, fontFamily:"Cairo", fontSize:12 }}/>
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="flex justify-center gap-4 mt-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }}/>
                    <span className="text-muted-foreground">{d.name}: <span className="font-bold">{d.value}</span></span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">أداء القنوات</CardTitle>
            </CardHeader>
            <CardContent>
              {channels.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات</div>
              ) : (
                <div className="space-y-3">
                  {channels.map((ch) => (
                    <div key={ch.name}>
                      <div className="flex justify-between mb-1 text-xs">
                        <span className="font-semibold">{ch.name}</span>
                        <span className="text-muted-foreground">{ch.success}/{ch.total} ({ch.rate}%)</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                             style={{ width: `${ch.rate}%`, background: ch.rate >= 80 ? "#15803D" : ch.rate >= 50 ? "#D4A843" : "#C0392B" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">أسباب الفشل</CardTitle>
            </CardHeader>
            <CardContent>
              {errorData.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">لا توجد أخطاء</div>
              ) : (
                <div className="space-y-2">
                  {errorData.map((e) => (
                    <div key={e.name} className="flex items-center justify-between p-2 rounded-lg bg-red-50">
                      <span className="text-xs font-medium text-red-700 truncate flex-1">{e.name}</span>
                      <span className="text-xs font-black font-num text-red-800 mr-2">{e.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(["all","delivered","failed"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={statusFilter===s ? {background:"#1A4B8C",color:"#fff"} : {background:"var(--secondary)",color:"var(--foreground)"}}>
              {s==="all"?"الكل":s==="delivered"?"ناجح":"فاشل"}
            </button>
          ))}
          <div className="w-px bg-border"/>
          <button onClick={() => setChannelFilter("all")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={channelFilter==="all" ? {background:"#D4A843",color:"#fff"} : {background:"var(--secondary)",color:"var(--foreground)"}}>
            كل القنوات
          </button>
          {channelNames.map((ch) => (
            <button key={ch} onClick={() => setChannelFilter(ch)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={channelFilter===ch ? {background:"#D4A843",color:"#fff"} : {background:"var(--secondary)",color:"var(--foreground)"}}>
              {ch}
            </button>
          ))}
        </div>

        {/* Table */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-secondary/40">
                    {["الهاتف","القناة","نوع الرسالة","الإجراء","الحالة","الوقت","سبب الخطأ"].map((h) => (
                      <th key={h} className="text-right py-2.5 px-3 text-xs font-bold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredDeliveries.slice().reverse().slice(0, 50).map((d) => (
                    <tr key={d.delivery_id} className="border-b border-border/40 hover:bg-secondary/30">
                      <td className="py-2.5 px-3 font-num text-sm">{d.phone || "—"}</td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground">{d.channel || "—"}</td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground">{d.template_id || "—"}</td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground">{d.action_type || "—"}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${
                          d.status === "delivered" ? "bg-green-600" : "bg-red-600"
                        }`}>
                          {d.status === "delivered" ? "ناجح" : "فاشل"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground">
                        {d.sent_at ? new Date(d.sent_at).toLocaleString("ar-SA") : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-red-600 max-w-[150px] truncate">
                        {d.error_reason || "—"}
                      </td>
                    </tr>
                  ))}
                  {filteredDeliveries.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد سجلات</td></tr>
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
