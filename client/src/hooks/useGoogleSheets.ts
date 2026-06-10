/**
 * useGoogleSheets.ts — بلوفيا ترافل
 * يجلب جميع أوراق الشيت مع تحمّل الأوراق الغائبة
 * Master Sheet: 1z45VV-sxITCAXNzhQrimHoj47KUhEEaUKPHEfH9sFwA
 */

import { useState, useEffect, useCallback } from "react";

// ─── أنواع البيانات ──────────────────────────────────────────────────────────

export interface Lead {
  lead_id: string;
  phone: string;
  name: string;
  email: string;
  source: string;
  platform: string;
  destination: string;          // tunisia | turkey
  service_type: string;         // flight | hotel | package | b2b
  travel_group: string;         // solo | couple | family | group
  pax_hint: number;
  stars_preference: number;
  budget_signal: string;
  message: string;
  profile_url: string;
  post_url: string;
  category: "hot" | "warm" | "cool" | "cold";
  status: string;
  final_score: number;
  radar_intent: string;
  radar_urgency: string;
  final_contact_channel: string;
  has_phone: boolean;
  consent: boolean;
  created_at: string;
  flow_origin: string;
  is_demo: boolean;
}

export interface SalesTask {
  task_id: string;
  lead_id: string;
  name: string;
  phone: string;
  score: number;
  category: string;
  destination: string;
  service_type: string;
  priority: string;
  action_required: string;
  next_action: string;
  sla_minutes: number;
  task_status: "open" | "escalated" | "closed";
  assigned_to: string;
  created_at: string;
}

export interface Delivery {
  delivery_id: string;
  lead_id: string;
  phone: string;
  channel: string;
  status: "delivered" | "failed";
  template_id: string;
  sent_at: string;
  delivered_at: string;
  error_reason: string;
  action_type: string;
}

export interface Article {
  article_id: string;
  title_ar: string;
  category: string;
  destination: string;
  status: "idea" | "ready" | "published" | "failed";
  slug: string;
  excerpt_ar: string;
  meta_title: string;
  keyword_main: string;
  seo_score: number;
  page_url: string;
  published_at: string;
  featured_image_url: string;
}

export interface JourneyEvent {
  event_id: string;
  lead_id: string;
  name: string;
  journey_step: string;
  channel: string;
  event_type: string;
  created_at: string;
}

export interface DailyReport {
  report_id: string;
  date: string;
  total_leads: number;
  hot_leads: number;
  warm_leads: number;
  cold_leads: number;
  avg_score: number;
  from_radar: number;
  from_whatsapp: number;
  from_form: number;
  delivery_rate: number;
  open_tasks: number;
  closed_tasks: number;
  escalated: number;
  bookings: number;
  week_conv_rate: number;
  overall_rating: string;
  notes: string;
}

export interface SheetsData {
  leads: Lead[];
  salesTasks: SalesTask[];
  deliveries: Delivery[];
  articles: Article[];
  journeyEvents: JourneyEvent[];
  dailyReports: DailyReport[];
  lastUpdated: string | null;
}

export interface SheetsState {
  data: SheetsData;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// ─── ثوابت ───────────────────────────────────────────────────────────────────

const SHEETS_ID =
  (import.meta.env.VITE_SHEETS_ID as string) ||
  "1z45VV-sxITCAXNzhQrimHoj47KUhEEaUKPHEfH9sFwA";

const SHEET_NAMES = {
  leads:         "leads",
  salesTasks:    "sales_handoff",
  deliveries:    "delivery_log",
  articles:      "articles",
  journeyEvents: "journey_log",
  dailyReports:  "daily_reports",
} as const;

const EMPTY: SheetsData = {
  leads: [], salesTasks: [], deliveries: [],
  articles: [], journeyEvents: [], dailyReports: [],
  lastUpdated: null,
};

// ─── مساعدات ─────────────────────────────────────────────────────────────────

function rowsToObjects(rows: string[][]): Record<string, string>[] {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = row[i] ?? ""; });
    return obj;
  });
}

const toBool = (v: string) => v === "TRUE" || v === "true" || v === "1";
const toNum  = (v: string) => parseFloat(v) || 0;

// ─── parsers ─────────────────────────────────────────────────────────────────

function parseLeads(rows: string[][]): Lead[] {
  return rowsToObjects(rows).map((r) => ({
    lead_id:               r.lead_id ?? "",
    phone:                 r.phone ?? "",
    name:                  r.name ?? "",
    email:                 r.email ?? "",
    source:                r.source ?? "",
    platform:              r.platform ?? "",
    destination:           r.destination ?? "",
    service_type:          r.service_type ?? "",
    travel_group:          r.travel_group ?? "",
    pax_hint:              toNum(r.pax_hint),
    stars_preference:      toNum(r.stars_preference),
    budget_signal:         r.budget_signal ?? "",
    message:               r.message ?? "",
    profile_url:           r.profile_url ?? "",
    post_url:              r.post_url ?? "",
    category:              (r.category?.toLowerCase() as Lead["category"]) ?? "cold",
    status:                r.status ?? "",
    final_score:           toNum(r.final_score),
    radar_intent:          r.radar_intent ?? r.intent ?? "",
    radar_urgency:         r.radar_urgency ?? r.urgency ?? "",
    final_contact_channel: r.final_contact_channel ?? "",
    has_phone:             toBool(r.has_phone),
    consent:               toBool(r.consent),
    created_at:            r.created_at ?? "",
    flow_origin:           r.flow_origin ?? "",
    is_demo:               toBool(r.is_demo),
  }));
}

function parseSalesTasks(rows: string[][]): SalesTask[] {
  return rowsToObjects(rows).map((r) => ({
    task_id:         r.task_id ?? "",
    lead_id:         r.lead_id ?? "",
    name:            r.name ?? "",
    phone:           r.phone ?? "",
    score:           toNum(r.score ?? r.final_score),
    category:        r.category ?? "",
    destination:     r.destination ?? "",
    service_type:    r.service_type ?? "",
    priority:        r.priority ?? "",
    action_required: r.action_required ?? r.next_action ?? "",
    next_action:     r.next_action ?? "",
    sla_minutes:     toNum(r.sla_minutes),
    task_status:     (r.task_status ?? r.status ?? "open") as SalesTask["task_status"],
    assigned_to:     r.assigned_to ?? "",
    created_at:      r.created_at ?? "",
  }));
}

function parseDeliveries(rows: string[][]): Delivery[] {
  return rowsToObjects(rows).map((r) => ({
    delivery_id:  r.delivery_id ?? "",
    lead_id:      r.lead_id ?? "",
    phone:        r.phone ?? "",
    channel:      r.channel ?? "",
    status:       (r.status ?? "failed") as Delivery["status"],
    template_id:  r.template_id ?? "",
    sent_at:      r.sent_at ?? "",
    delivered_at: r.delivered_at ?? "",
    error_reason: r.error_reason ?? "",
    action_type:  r.action_type ?? "",
  }));
}

function parseArticles(rows: string[][]): Article[] {
  return rowsToObjects(rows).map((r) => ({
    article_id:          r.article_id ?? "",
    title_ar:            r.title_ar ?? r.title ?? "",
    category:            r.category ?? "",
    destination:         r.destination ?? "",
    status:              (r.status ?? "idea") as Article["status"],
    slug:                r.slug ?? "",
    excerpt_ar:          r.excerpt_ar ?? "",
    meta_title:          r.meta_title ?? "",
    keyword_main:        r.keyword_main ?? "",
    seo_score:           toNum(r.seo_score),
    page_url:            r.page_url ?? "",
    published_at:        r.published_at ?? "",
    featured_image_url:  r.featured_image_url ?? "",
  }));
}

function parseJourneyEvents(rows: string[][]): JourneyEvent[] {
  return rowsToObjects(rows).map((r) => ({
    event_id:     r.event_id ?? "",
    lead_id:      r.lead_id ?? "",
    name:         r.name ?? "",
    journey_step: r.journey_step ?? "",
    channel:      r.channel ?? "",
    event_type:   r.event_type ?? "",
    created_at:   r.created_at ?? "",
  }));
}

function parseDailyReports(rows: string[][]): DailyReport[] {
  return rowsToObjects(rows).map((r) => ({
    report_id:      r.report_id ?? "",
    date:           r.date ?? "",
    total_leads:    toNum(r.total_leads),
    hot_leads:      toNum(r.hot_leads),
    warm_leads:     toNum(r.warm_leads),
    cold_leads:     toNum(r.cold_leads),
    avg_score:      toNum(r.avg_score),
    from_radar:     toNum(r.from_radar),
    from_whatsapp:  toNum(r.from_whatsapp),
    from_form:      toNum(r.from_form),
    delivery_rate:  toNum(r.delivery_rate),
    open_tasks:     toNum(r.open_tasks),
    closed_tasks:   toNum(r.closed_tasks),
    escalated:      toNum(r.escalated),
    bookings:       toNum(r.bookings),
    week_conv_rate: toNum(r.week_conv_rate),
    overall_rating: r.overall_rating ?? "",
    notes:          r.notes ?? "",
  }));
}

// ─── fetchSheetSafe ──────────────────────────────────────────────────────────

async function fetchSheetSafe(sheetName: string): Promise<string[][]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEETS_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const csv = await res.text();
    if (!csv.trim() || csv.startsWith("<!")) return [];
    const rows: string[][] = [];
    for (const line of csv.split("\n")) {
      if (!line.trim()) continue;
      const cols: string[] = [];
      let cur = ""; let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQ && line[i+1] === '"') { cur += '"'; i++; }
          else inQ = !inQ;
        } else if (ch === "," && !inQ) { cols.push(cur.trim()); cur = ""; }
        else cur += ch;
      }
      cols.push(cur.trim());
      rows.push(cols);
    }
    return rows;
  } catch { return []; }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useGoogleSheets(
  options: { autoRefresh?: boolean; intervalMs?: number } = {}
): SheetsState {
  const { autoRefresh = false, intervalMs = 120_000 } = options;
  const [data, setData]       = useState<SheetsData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!SHEETS_ID) { setError("VITE_SHEETS_ID غير مضبوط"); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const [lR, stR, dR, aR, jR, drR] = await Promise.all([
        fetchSheetSafe(SHEET_NAMES.leads),
        fetchSheetSafe(SHEET_NAMES.salesTasks),
        fetchSheetSafe(SHEET_NAMES.deliveries),
        fetchSheetSafe(SHEET_NAMES.articles),
        fetchSheetSafe(SHEET_NAMES.journeyEvents),
        fetchSheetSafe(SHEET_NAMES.dailyReports),
      ]);
      setData({
        leads:         parseLeads(lR),
        salesTasks:    parseSalesTasks(stR),
        deliveries:    parseDeliveries(dR),
        articles:      parseArticles(aR),
        journeyEvents: parseJourneyEvents(jR),
        dailyReports:  parseDailyReports(drR),
        lastUpdated:   new Date().toISOString(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ غير معروف");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchAll, intervalMs);
    return () => clearInterval(id);
  }, [autoRefresh, intervalMs, fetchAll]);

  return { data, loading, error, refetch: fetchAll };
}

// ─── computeSummary ──────────────────────────────────────────────────────────

export function computeSummary(data: SheetsData) {
  const real    = data.leads.filter((l) => !l.is_demo);
  const hot     = real.filter((l) => l.category === "hot");
  const warm    = real.filter((l) => l.category === "warm");
  const cool    = real.filter((l) => l.category === "cool");
  const cold    = real.filter((l) => l.category === "cold");

  const tunisia = real.filter((l) => l.destination === "tunisia");
  const turkey  = real.filter((l) => l.destination === "turkey");

  const delivered    = data.deliveries.filter((d) => d.status === "delivered").length;
  const deliveryRate = data.deliveries.length
    ? Math.round((delivered / data.deliveries.length) * 100) : 0;

  const openTasks      = data.salesTasks.filter((t) => t.task_status === "open").length;
  const escalatedTasks = data.salesTasks.filter((t) => t.task_status === "escalated").length;
  const avgScore       = real.length
    ? Math.round(real.reduce((s, l) => s + l.final_score, 0) / real.length) : 0;

  const publishedArticles = data.articles.filter((a) => a.status === "published").length;
  const readyArticles     = data.articles.filter((a) => a.status === "ready").length;
  const avgSeo = data.articles.length
    ? Math.round(data.articles.filter((a) => a.seo_score > 0).reduce((s, a) => s + a.seo_score, 0)
      / (data.articles.filter((a) => a.seo_score > 0).length || 1)) : 0;

  const totalBookings  = data.dailyReports.reduce((s, r) => s + r.bookings, 0);
  const latestRating   = data.dailyReports[data.dailyReports.length - 1]?.overall_rating ?? "";

  return {
    totalLeads: real.length,
    hotLeads: hot.length, warmLeads: warm.length,
    coolLeads: cool.length, coldLeads: cold.length,
    tunisiaLeads: tunisia.length, turkeyLeads: turkey.length,
    deliveryRate, openTasks, escalatedTasks, avgScore,
    publishedArticles, readyArticles, avgSeo,
    totalBookings, latestRating,
  };
}
