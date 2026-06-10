import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useSheets } from "@/contexts/SheetsContext";
import { Loader2, ExternalLink } from "lucide-react";
import { useState } from "react";

const CAT_STYLES: Record<string,string> = {
  hot:  "bg-red-100 text-red-700",
  warm: "bg-yellow-100 text-yellow-700",
  cool: "bg-blue-100 text-blue-700",
  cold: "bg-gray-100 text-gray-600",
};
const CAT_LABELS: Record<string,string> = { hot:"ساخن",warm:"دافئ",cool:"بارد",cold:"بارد جداً" };
const DEST_LABELS: Record<string,string> = { tunisia:"🇹🇳 تونس", turkey:"🇹🇷 تركيا" };

export default function Leads() {
  const { data, loading } = useSheets();
  const [filter, setFilter] = useState<"all"|"hot"|"warm"|"cool"|"cold">("all");
  const [dest, setDest]     = useState<"all"|"tunisia"|"turkey">("all");

  if (loading) return <DashboardLayout><div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin size-8" style={{ color:"#1A4B8C" }}/></div></DashboardLayout>;

  const leads = data.leads.filter((l) => !l.is_demo)
    .filter((l) => filter === "all" || l.category === filter)
    .filter((l) => dest   === "all" || l.destination === dest);

  return (
    <DashboardLayout>
      <div className="p-5 md:p-7 max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black" style={{ color:"#1A4B8C" }}>العملاء المحتملون</h1>
            <p className="text-sm text-muted-foreground">{leads.length} عميل</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all","hot","warm","cool","cold"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                      style={filter===f ? {background:"#1A4B8C",color:"#fff"} : {background:"var(--secondary)",color:"var(--foreground)"}}>
                {f==="all"?"الكل":CAT_LABELS[f]}
              </button>
            ))}
            <div className="w-px bg-border"/>
            {(["all","tunisia","turkey"] as const).map((d) => (
              <button key={d} onClick={() => setDest(d)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                      style={dest===d ? {background:"#D4A843",color:"#fff"} : {background:"var(--secondary)",color:"var(--foreground)"}}>
                {d==="all"?"الوجهتان":DEST_LABELS[d]}
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
                    {["الاسم","الوجهة","الخدمة","التصنيف","الدرجة","القناة","التاريخ","روابط"].map((h) => (
                      <th key={h} className="text-right py-2.5 px-3 text-xs font-bold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.lead_id} className="border-b border-border/40 hover:bg-secondary/30">
                      <td className="py-2.5 px-3">
                        <p className="font-semibold">{l.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{l.phone || l.email || "—"}</p>
                      </td>
                      <td className="py-2.5 px-3 text-xs">{DEST_LABELS[l.destination] || "—"}</td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground">{l.service_type || "—"}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${CAT_STYLES[l.category] || "bg-gray-100"}`}>
                          {CAT_LABELS[l.category] || l.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-xs font-bold text-white"
                              style={{ background:"#1A4B8C" }}>{l.final_score}</span>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground">{l.platform || l.source || "—"}</td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground">
                        {l.created_at ? new Date(l.created_at).toLocaleDateString("ar-SA") : "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex gap-1">
                          {l.profile_url && (
                            <a href={l.profile_url} target="_blank" rel="noreferrer"
                               className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-primary transition-colors">
                              <ExternalLink size={13}/>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">لا توجد عملاء</td></tr>
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
