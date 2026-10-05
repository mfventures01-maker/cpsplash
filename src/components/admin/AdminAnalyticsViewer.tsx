import React, { useEffect, useState } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { AnalyticsEvent } from '../../types/database.types';
import { BarChart3, MessageCircle, Eye, ShoppingCart, RefreshCw, Activity, ArrowUpRight } from 'lucide-react';

export function AdminAnalyticsViewer() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [summary, setSummary] = useState<{
    counts: Record<string, number>;
    conversionRate: string;
    sourceBreakdown: Record<string, number>;
    totalEvents: number;
  }>({
    counts: {},
    conversionRate: '0.0',
    sourceBreakdown: {},
    totalEvents: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    const [evList, stats] = await Promise.all([
      analyticsService.getEvents(50),
      analyticsService.getMetricsSummary(),
    ]);
    setEvents(evList);
    setSummary(stats);
    setLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono font-bold uppercase text-emerald-600 tracking-wider">
            Supabase analytics_events Table
          </span>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">
            Live Analytics Pipeline
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Real event stream logging: Visitor → Content → Product → WhatsApp → Order
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="p-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-600"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase">Product Views</span>
            <Eye className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-3xl font-black text-stone-900">
            {summary.counts.product_view || 0}
          </span>
          <span className="text-[10px] text-stone-400 block font-mono">Logged from catalog/pages</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase">WhatsApp Orders</span>
            <MessageCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-3xl font-black text-stone-900">
            {summary.counts.order_started || 0}
          </span>
          <span className="text-[10px] text-emerald-700 block font-semibold">To 08127700724</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase">Conversion</span>
            <ArrowUpRight className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-3xl font-black text-stone-900">
            {summary.conversionRate}%
          </span>
          <span className="text-[10px] text-stone-400 block font-mono">Orders / Views</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase">Total Events</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-3xl font-black text-stone-900">
            {summary.totalEvents}
          </span>
          <span className="text-[10px] text-stone-400 block font-mono">Real-time pipeline</span>
        </div>
      </div>

      {/* Real-time Event Stream Table */}
      <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-stone-900">
          Recent Event Stream (Latest 50 events)
        </h3>

        {events.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400">
            No events logged yet. Browse products or click WhatsApp buttons to generate live events.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase">
                <tr>
                  <th className="py-2.5 px-4 font-bold">Event</th>
                  <th className="py-2.5 px-4 font-bold">Route</th>
                  <th className="py-2.5 px-4 font-bold">Source</th>
                  <th className="py-2.5 px-4 font-bold">Campaign</th>
                  <th className="py-2.5 px-4 font-bold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {events.map((ev, idx) => (
                  <tr key={ev.id || idx} className="hover:bg-stone-50 text-[11px]">
                    <td className="py-2 px-4 font-bold text-stone-900">
                      <span className={`px-2 py-0.5 rounded ${
                        ev.event_name === 'order_started' || ev.event_name === 'whatsapp_click'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ev.event_name === 'product_view'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}>
                        {ev.event_name}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-stone-600 truncate max-w-xs">
                      {ev.page_path || '/'}
                    </td>
                    <td className="py-2 px-4 text-stone-600">
                      {ev.source || 'direct'}
                    </td>
                    <td className="py-2 px-4 text-stone-600">
                      {ev.campaign || 'none'}
                    </td>
                    <td className="py-2 px-4 text-right text-stone-400">
                      {ev.created_at ? new Date(ev.created_at).toLocaleTimeString() : 'now'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
