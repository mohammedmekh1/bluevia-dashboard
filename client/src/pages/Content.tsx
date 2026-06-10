import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useSheets } from "@/contexts/SheetsContext";
import { Loader2 } from "lucide-react";

const DEST_LABELS: Record<string,string> = { tunisia:"🇹🇳 تونس", turkey:"🇹🇷 تركيا" };
const STATUS_STYLES: Record<string,string> = {
  published: "bg-green-100 text-green-700",
  ready:     "bg-blue-100 text-blue-700",
  idea:      "bg-yellow-100 text-yellow-700",
  failed:    "bg-red-100 text-red-700",
};
const STATUS_LABELS: Record<string,string> = {
  published:"منشورة", ready:"جاهزة", idea:"فكرة", failed:"فشلت"
};

export default function Content() {
  const { data, loading } = useSheets();
  if (loading) return <DashboardLayout><div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin size-8" style={{ color:"#1A4B8C" }}/></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-5 md:p-7 max-w-[1200px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black" style={{ color:"#1A4B8C" }}>مقالات SEO</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{data.articles.length} مقالة إجمالاً</p>
        </div>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-secondary/40">
                    {["العنوان","الوجهة","الفئة","الحالة","SEO","تاريخ النشر"].map((h) => (
                      <th key={h} className="text-right py-2.5 px-4 text-xs font-bold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.articles.map((a) => (
                    <tr key={a.article_id} className="border-b border-border/40 hover:bg-secondary/30">
                      <td className="py-2.5 px-4 font-medium max-w-[200px] truncate">
                        {a.page_url ? (
                          <a href={a.page_url} target="_blank" rel="noreferrer"
                             className="hover:underline" style={{ color:"#1A4B8C" }}>
                            {a.title_ar || a.meta_title || "—"}
                          </a>
                        ) : (a.title_ar || a.meta_title || "—")}
                      </td>
                      <td className="py-2.5 px-4 text-xs">{DEST_LABELS[a.destination] || a.destination || "—"}</td>
                      <td className="py-2.5 px-4 text-xs text-muted-foreground">{a.category || "—"}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_STYLES[a.status] || "bg-gray-100 text-gray-600"}`}>
                          {STATUS_LABELS[a.status] || a.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                          a.seo_score >= 85 ? "bg-green-100 text-green-700" :
                          a.seo_score >= 70 ? "bg-yellow-100 text-yellow-700" :
                          a.seo_score > 0   ? "bg-red-100 text-red-700" :
                          "text-muted-foreground"
                        }`}>
                          {a.seo_score > 0 ? a.seo_score : "—"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-xs text-muted-foreground">
                        {a.published_at ? new Date(a.published_at).toLocaleDateString("ar-SA") : "—"}
                      </td>
                    </tr>
                  ))}
                  {data.articles.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد مقالات بعد</td></tr>
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
