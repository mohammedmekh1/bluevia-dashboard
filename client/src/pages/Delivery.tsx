import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useSheets } from "@/contexts/SheetsContext";
import { Loader2 } from "lucide-react";

export default function Delivery() {
  const { data, loading } = useSheets();
  if (loading) return <DashboardLayout><div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin size-8" style={{ color:"#1A4B8C" }}/></div></DashboardLayout>;

  const delivered = data.deliveries.filter((d) => d.status === "delivered").length;
  const rate = data.deliveries.length ? Math.round(delivered/data.deliveries.length*100) : 0;

  return (
    <DashboardLayout>
      <div className="p-5 md:p-7 max-w-[1200px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black" style={{ color:"#1A4B8C" }}>سجل التسليم</h1>
          <p className="text-sm text-muted-foreground">{data.deliveries.length} سجل · معدل النجاح {rate}%</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label:"إجمالي", val:data.deliveries.length, color:"#1A4B8C" },
            { label:"ناجح",   val:delivered,               color:"#15803D" },
            { label:"فاشل",   val:data.deliveries.length-delivered, color:"#C0392B" },
            { label:"معدل النجاح", val:`${rate}%`,          color:"#D4A843" },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl border border-border/60 bg-card text-center">
              <p className="text-2xl font-black font-num" style={{ color:s.color }}>{s.val}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-secondary/40">
                    {["الهاتف","القناة","نوع الرسالة","الحالة","الوقت"].map((h) => (
                      <th key={h} className="text-right py-2.5 px-3 text-xs font-bold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.deliveries.slice().reverse().slice(0, 50).map((d) => (
                    <tr key={d.delivery_id} className="border-b border-border/40 hover:bg-secondary/30">
                      <td className="py-2.5 px-3 font-num text-sm">{d.phone || "—"}</td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground">{d.channel || "—"}</td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground">{d.template_id || d.action_type || "—"}</td>
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
                    </tr>
                  ))}
                  {data.deliveries.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد سجلات</td></tr>
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
