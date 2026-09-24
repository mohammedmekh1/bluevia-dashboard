import { Bell, Search, UserCircle } from "lucide-react";
import { Sidebar, MobileSidebar } from "./Sidebar";

interface DashboardLayoutProps { children: React.ReactNode; }
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return <div className="flex min-h-screen bg-background" dir="rtl"><Sidebar /><MobileSidebar /><div className="flex-1 flex flex-col min-w-0"><header className="topbar"><div className="search-shell"><Search size={16} /><input placeholder="ابحث في منظومة بلوفيا..." aria-label="بحث" /></div><div className="topbar-meta"><span className="today-label">اليوم · منظومة السياحة والرحلات</span><button className="icon-button" aria-label="الإشعارات"><Bell size={18} /><i /></button><div className="profile"><div><b>حمزة الزراق</b><span>Tourism Director</span></div><UserCircle size={34} /></div></div></header><main className="flex-1 p-4 md:p-8 overflow-x-hidden"><div className="max-w-[1440px] mx-auto">{children}</div></main></div></div>;
}
export default DashboardLayout;
