import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useSheets } from "@/contexts/SheetsContext";
import { Loader2 } from "lucide-react";
import { useState } from "react";

const DEST_LABELS: Record<string,string> = { tunisia:"🇹🇳 تونس", turkey:"🇹🇷 تركيا" };

export default function Tasks() {
  const { data, loading } = useSheets();
  const [status, setStatus] = useState<"all"|"open"|"escalated"|"closed">("all");
  if (loading) return <DashboardLayout><div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin size-8" style={{ color:"#1A4B8C" }}/></div></DashboardLayout>;

  const tasks = data.salesTasks.filter((t) => status === "all" || t.task_status === status);

  return (
    <DashboardLayout>
      <div className="p-5 md:p-7 max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black" style={{ color:"#1A4B8C" }}>مهام المبيعات</h1>
            <p className="text-sm text-muted-foreground">{tasks.length} مهمة</p>
          </div>
          <div className="flex gap-2">
            {(["all","open","escalated","closed"] as const).map((s) => (
              <button key={s} onClick={() => setStatus(s)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                      style={status===s ? {background:"#1A4B8C",color:"#fff"} : {background:"var(--secondary)",color:"var(--foreground)"}}>
                {s==="all"?"الكل":s==="open"?"مفتوحة":s==="escalated"?"عاجلة":"مغلقة"}
              </button>
            ))}
          </div>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-secondary/40">
                    {["العميل","الوجهة","الأولوية","الإجراء","SLA","الحالة","التاريخ"].map((h) => (
                      <th key={h} className="text-right py-2.5 px-3 text-xs font-bold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr key={t.task_id} className="border-b border-border/40 hover:bg-secondary/30">
                      <td className="py-2.5 px-3">
                        <p className="font-semibold">{t.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{t.phone || "—"}</p>
                      </td>
                      <td className="py-2.5 px-3 text-xs">{DEST_LABELS[t.destination] || t.destination || "—"}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          t.priority === "urgent" ? "bg-red-100 text-red-700" :
                          t.priority === "high"   ? "bg-orange-100 text-orange-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>{t.priority || "—"}</span>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground max-w-[160px] truncate">{t.action_required || "—"}</td>
                      <td className="py-2.5 px-3 text-xs font-num">{t.sla_minutes ? `${t.sla_minutes} د` : "—"}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${
                          t.task_status === "escalated" ? "bg-red-600" :
                          t.task_status === "open"      ? "bg-orange-500" : "bg-green-600"
                        }`}>
                          {t.task_status === "escalated" ? "عاجل" : t.task_status === "open" ? "مفتوح" : "مغلق"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground">
                        {t.created_at ? new Date(t.created_at).toLocaleDateString("ar-SA") : "—"}
                      </td>
                    </tr>
                  ))}
                  {tasks.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد مهام</td></tr>
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
