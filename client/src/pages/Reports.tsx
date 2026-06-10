import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSheets } from "@/contexts/SheetsContext";
import { RefreshCw, Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, Legend,
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

  const chartData = reports.reverse().map((r) => ({
    date:     r.date.slice(5),
    leads:    r.total_leads,
    hot:      r.hot_leads,
    delivery: r.delivery_rate,
    bookings: r.bookings,
  }));

  return (
    <DashboardLayout>
      <div className="p-5 md:p-7 max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black" style={{ color:"#1A4B8C" }}>التقارير اليومية</h1>
            <p className="text-sm text-muted-foreground mt-0.5">آخر {reports.length} تقرير</p>
          </div>
          <Button onClick={refetch} variant="outline" size="sm" className="gap-1.5">
            <RefreshCw size={14}/> تحديث
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">العملاء والساخنون يومياً</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DDE4EF"/>
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11}/>
                  <YAxis stroke="#9CA3AF" fontSize={11}/>
                  <Tooltip contentStyle={{ borderRadius:8, fontFamily:"Cairo", fontSize:12 }}/>
                  <Legend wrapperStyle={{ fontFamily:"Cairo", fontSize:12 }}/>
                  <Bar dataKey="leads" fill="#1A4B8C" radius={[4,4,0,0]} name="إجمالي"/>
                  <Bar dataKey="hot"   fill="#D4380D" radius={[4,4,0,0]} name="ساخنون"/>
                </BarChart>
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

        {/* جدول التقارير */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">سجل التقارير</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-secondary/40">
                    {["التاريخ","العملاء","ساخنون","معدل التسليم","المهام المفتوحة","الحجوزات","التقييم"].map((h) => (
                      <th key={h} className="text-right py-2.5 px-4 text-xs font-bold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.dailyReports.slice().reverse().map((r) => (
                    <tr key={r.report_id} className="border-b border-border/40 hover:bg-secondary/30">
                      <td className="py-2.5 px-4 font-medium">{r.date}</td>
                      <td className="py-2.5 px-4 font-num">{r.total_leads}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold">{r.hot_leads}</span>
                      </td>
                      <td className="py-2.5 px-4 font-num">{r.delivery_rate}%</td>
                      <td className="py-2.5 px-4 font-num">{r.open_tasks}</td>
                      <td className="py-2.5 px-4 font-num">{r.bookings}</td>
                      <td className="py-2.5 px-4 text-xs">{r.overall_rating || "—"}</td>
                    </tr>
                  ))}
                  {data.dailyReports.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد تقارير بعد</td></tr>
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
