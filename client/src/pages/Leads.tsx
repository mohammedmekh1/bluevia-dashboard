import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSheets } from "@/contexts/SheetsContext";
import { Loader2, ExternalLink, Users, Zap, Search, Download } from "lucide-react";
import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const CAT_STYLES: Record<string,string> = {
  hot:  "bg-red-100 text-red-700",
  warm: "bg-yellow-100 text-yellow-700",
  cool: "bg-blue-100 text-blue-700",
  cold: "bg-gray-100 text-gray-600",
};
const CAT_LABELS: Record<string,string> = { hot:"ساخن",warm:"دافئ",cool:"بارد",cold:"بارد جداً" };
const CAT_COLORS: Record<string,string> = { hot:"#D4380D",warm:"#D4A843",cool:"#1A4B8C",cold:"#9CA3AF" };
const DEST_LABELS: Record<string,string> = { tunisia:"\u{1F1F9}\u{1F1F3} تونس", turkey:"\u{1F1F9}\u{1F1F7} تركيا" };

export default function Leads() {
  const { data, loading } = useSheets();
  const [filter, setFilter] = useState<"all"|"hot"|"warm"|"cool"|"cold">("all");
  const [dest, setDest]     = useState<"all"|"tunisia"|"turkey">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"score"|"date">("date");

  if (loading) return <DashboardLayout><div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin size-8" style={{ color:"#1A4B8C" }}/></div></DashboardLayout>;

  const allLeads = data.leads.filter((l) => !l.is_demo);

  const leads = useMemo(() => {
    let filtered = allLeads
      .filter((l) => filter === "all" || l.category === filter)
      .filter((l) => dest   === "all" || l.destination === dest);

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((l) =>
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.email.toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) =>
      sortBy === "score"
        ? b.final_score - a.final_score
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [allLeads, filter, dest, search, sortBy]);

  const catDistribution = (["hot","warm","cool","cold"] as const).map((c) => ({
    name: CAT_LABELS[c],
    value: allLeads.filter((l) => l.category === c).length,
    fill: CAT_COLORS[c],
  })).filter((d) => d.value > 0);

  const hasPhone = allLeads.filter((l) => l.has_phone).length;
  const hasConsent = allLeads.filter((l) => l.consent).length;

  return (
    <DashboardLayout>
      <div className="p-5 md:p-7 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black" style={{ color:"#1A4B8C" }}>العملاء المحتملون</h1>
            <p className="text-sm text-muted-foreground">{leads.length} عميل من أصل {allLeads.length}</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-5">
          <div className="p-3 rounded-xl border border-border/60 text-center">
            <p className="text-xl font-black font-num" style={{ color:"#1A4B8C" }}>{allLeads.length}</p>
            <p className="text-xs text-muted-foreground">إجمالي</p>
          </div>
          <div className="p-3 rounded-xl border border-border/60 text-center">
            <p className="text-xl font-black font-num" style={{ color:"#D4380D" }}>{allLeads.filter((l) => l.category === "hot").length}</p>
            <p className="text-xs text-muted-foreground">ساخن</p>
          </div>
          <div className="p-3 rounded-xl border border-border/60 text-center">
            <p className="text-xl font-black font-num" style={{ color:"#D4A843" }}>{allLeads.filter((l) => l.category === "warm").length}</p>
            <p className="text-xs text-muted-foreground">دافئ</p>
          </div>
          <div className="p-3 rounded-xl border border-border/60 text-center">
            <p className="text-xl font-black font-num" style={{ color:"#15803D" }}>{hasPhone}</p>
            <p className="text-xs text-muted-foreground">لديهم هاتف</p>
          </div>
          <div className="p-3 rounded-xl border border-border/60 text-center">
            <p className="text-xl font-black font-num" style={{ color:"#1A4B8C" }}>{hasConsent}</p>
            <p className="text-xs text-muted-foreground">موافقة</p>
          </div>
          <div className="p-3 rounded-xl border border-border/60 text-center">
            <p className="text-xl font-black font-num" style={{ color:"#D4A843" }}>
              {allLeads.length ? Math.round(allLeads.reduce((s,l) => s + l.final_score, 0) / allLeads.length) : 0}
            </p>
            <p className="text-xs text-muted-foreground">متوسط الدرجة</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <input
              type="text"
              placeholder="بحث بالاسم أو الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-9 pl-3 py-2 rounded-lg border border-border/60 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {(["all","hot","warm","cool","cold"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
                    className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={filter===f ? {background:"#1A4B8C",color:"#fff"} : {background:"var(--secondary)",color:"var(--foreground)"}}>
              {f==="all"?"الكل":CAT_LABELS[f]}
            </button>
          ))}
          <div className="w-px bg-border"/>
          {(["all","tunisia","turkey"] as const).map((d) => (
            <button key={d} onClick={() => setDest(d)}
                    className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={dest===d ? {background:"#D4A843",color:"#fff"} : {background:"var(--secondary)",color:"var(--foreground)"}}>
              {d==="all"?"الوجهتان":DEST_LABELS[d]}
            </button>
          ))}
          <div className="w-px bg-border"/>
          <button onClick={() => setSortBy(sortBy === "score" ? "date" : "score")}
                  className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{ background:"var(--secondary)", color:"var(--foreground)" }}>
            ترتيب: {sortBy === "score" ? "الدرجة" : "التاريخ"}
          </button>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-secondary/40">
                    {["الاسم","الوجهة","الخدمة","المجموعة","التصنيف","الدرجة","القناة","التاريخ","روابط"].map((h) => (
                      <th key={h} className="text-right py-2.5 px-3 text-xs font-bold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.slice(0, 100).map((l) => (
                    <tr key={l.lead_id} className="border-b border-border/40 hover:bg-secondary/30">
                      <td className="py-2.5 px-3">
                        <p className="font-semibold">{l.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{l.phone || l.email || "—"}</p>
                      </td>
                      <td className="py-2.5 px-3 text-xs">{DEST_LABELS[l.destination] || "—"}</td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground">{l.service_type || "—"}</td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground">{l.travel_group || "—"}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${CAT_STYLES[l.category] || "bg-gray-100"}`}>
                          {CAT_LABELS[l.category] || l.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-xs font-bold text-white"
                              style={{ background: l.final_score >= 70 ? "#15803D" : l.final_score >= 40 ? "#D4A843" : "#9CA3AF" }}>
                          {l.final_score}
                        </span>
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
                    <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">لا توجد عملاء</td></tr>
                  )}
                </tbody>
              </table>
              {leads.length > 100 && (
                <p className="text-center text-xs text-muted-foreground py-3">
                  عرض أول 100 من {leads.length} عميل
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
