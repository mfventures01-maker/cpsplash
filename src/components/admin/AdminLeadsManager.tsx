import React, { useState, useEffect } from 'react';
import { SalesLead, SalesFunnelSummary, LeadStatus, SalesTerritory } from '../../types/database.types';
import { salesService } from '../../services/salesService';
import { 
  Users, 
  MessageCircle, 
  Filter, 
  Loader2, 
  RefreshCw, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  TrendingUp, 
  Check, 
  AlertCircle,
  Clock,
  Phone,
  Mail,
  ChevronDown
} from 'lucide-react';

export function AdminLeadsManager() {
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [funnelSummaries, setFunnelSummaries] = useState<SalesFunnelSummary[]>([]);
  const [territories, setTerritories] = useState<SalesTerritory[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedTerritoryId, selectedStatus]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tList, sumList, leadList] = await Promise.all([
        salesService.getAllTerritories(),
        salesService.getFunnelSummary(),
        salesService.getLeads({
          territoryId: selectedTerritoryId !== 'all' ? selectedTerritoryId : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          limit: 100
        })
      ]);
      setTerritories(tList);
      setFunnelSummaries(sumList);
      setLeads(leadList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load leads';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    setUpdatingId(leadId);
    try {
      const updated = await salesService.updateLeadStatus(leadId, newStatus);
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: updated.status } : l));
      // Refresh summaries
      const updatedSummaries = await salesService.getFunnelSummary();
      setFunnelSummaries(updatedSummaries);
    } catch (err: unknown) {
      alert('Failed to update lead status: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUpdatingId(null);
    }
  };

  // Compute metrics
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'new').length;
  const qualifiedLeads = leads.filter(l => l.status === 'qualified' || l.status === 'quoted').length;
  const wonLeads = leads.filter(l => l.status === 'won').length;

  const statusColors: Record<LeadStatus, string> = {
    new: 'bg-rose-50 text-rose-700 border-rose-200',
    contacted: 'bg-blue-50 text-blue-700 border-blue-200',
    qualified: 'bg-purple-50 text-purple-700 border-purple-200',
    quoted: 'bg-amber-50 text-amber-700 border-amber-200',
    won: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    lost: 'bg-stone-100 text-stone-600 border-stone-200',
    closed: 'bg-stone-200 text-stone-700 border-stone-300'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Commercial Lead Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
            Authoritative Sales Leads
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Deterministic sequence IDs (e.g. CPL-000001), qualification answers, and conversion tracking.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200 text-stone-700 font-bold text-xs shadow-sm hover:bg-stone-50 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Leads</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Funnel Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-1">
          <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">Total Pipeline Leads</span>
          <div className="text-2xl font-black text-stone-900">{totalLeads}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-1">
          <span className="text-[10px] font-mono text-rose-600 uppercase tracking-wider">New Inbound</span>
          <div className="text-2xl font-black text-rose-600">{newLeads}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-1">
          <span className="text-[10px] font-mono text-purple-600 uppercase tracking-wider">Qualified / Quoted</span>
          <div className="text-2xl font-black text-purple-600">{qualifiedLeads}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-1">
          <span className="text-[10px] font-mono text-emerald-600 uppercase tracking-wider">Won / Converted</span>
          <div className="text-2xl font-black text-emerald-600">{wonLeads}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-600">
            <Filter className="w-4 h-4" />
            <span>Filter:</span>
          </div>

          <select
            value={selectedTerritoryId}
            onChange={e => setSelectedTerritoryId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-medium"
          >
            <option value="all">All Commercial Territories</option>
            {territories.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="quoted">Quoted</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <span className="text-xs font-mono text-stone-400">
          Showing {leads.length} recorded leads
        </span>
      </div>

      {/* Leads Table */}
      {loading ? (
        <div className="py-20 text-center space-y-2 bg-white rounded-2xl border border-stone-200">
          <Loader2 className="w-8 h-8 text-rose-600 animate-spin mx-auto" />
          <p className="text-xs text-stone-500 font-mono">Loading leads from Supabase...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 space-y-2">
          <Users className="w-8 h-8 text-stone-300 mx-auto" />
          <p className="text-sm font-bold text-stone-900">Zero Inbound Leads Recorded</p>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Leads generated through the public commercial funnels will populate here in real-time with sequence IDs.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 font-mono uppercase text-stone-500">
              <tr>
                <th className="p-3">Lead Ref</th>
                <th className="p-3">Created</th>
                <th className="p-3">Territory</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Location & Qty</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {leads.map(lead => {
                const isExpanded = expandedLeadId === lead.id;
                const whatsappClean = lead.phone ? lead.phone.replace(/\D/g, '') : null;
                const whatsappUrl = whatsappClean 
                  ? `https://wa.me/${whatsappClean}?text=${encodeURIComponent(`Hello ${lead.contact_name || ''}, regarding your CP Splash inquiry (${lead.lead_number})...`)}`
                  : null;

                return (
                  <React.Fragment key={lead.id}>
                    <tr className="hover:bg-stone-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-rose-700">
                        {lead.lead_number}
                      </td>
                      <td className="p-3 font-mono text-stone-500">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 font-semibold text-stone-800">
                          {lead.territory?.name || 'Territory'}
                        </span>
                      </td>
                      <td className="p-3 space-y-0.5">
                        <div className="font-bold text-stone-900">{lead.contact_name || 'Anonymous Buyer'}</div>
                        {lead.phone && (
                          <div className="text-[11px] font-mono text-stone-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 space-y-0.5">
                        {lead.location && (
                          <div className="text-[11px] text-stone-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-stone-400" />
                            <span>{lead.location}</span>
                          </div>
                        )}
                        {lead.quantity && (
                          <div className="text-[11px] font-mono text-rose-700 font-semibold">
                            {lead.quantity} units
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <select
                          value={lead.status}
                          disabled={updatingId === lead.id}
                          onChange={e => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border cursor-pointer ${statusColors[lead.status] || 'bg-stone-100 text-stone-600'}`}
                        >
                          <option value="new">NEW</option>
                          <option value="contacted">CONTACTED</option>
                          <option value="qualified">QUALIFIED</option>
                          <option value="quoted">QUOTED</option>
                          <option value="won">WON</option>
                          <option value="lost">LOST</option>
                          <option value="closed">CLOSED</option>
                        </select>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {whatsappUrl && (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                            title="Chat with lead on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                        <button
                          onClick={() => setExpandedLeadId(isExpanded ? null : lead.id)}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-[11px]"
                        >
                          {isExpanded ? 'Hide' : 'Details'}
                        </button>
                      </td>
                    </tr>

                    {/* EXPANDED LEAD ANSWERS DETAILS */}
                    {isExpanded && (
                      <tr className="bg-stone-50/50">
                        <td colSpan={7} className="p-4 border-t border-stone-100">
                          <div className="bg-white rounded-xl p-4 border border-stone-200 space-y-3">
                            <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider font-mono">
                              Qualification Answers & Attribution Data
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                              {Object.entries(lead.answers || {}).map(([key, val]) => (
                                <div key={key} className="p-2.5 rounded-lg bg-stone-50 border border-stone-100">
                                  <span className="font-mono text-[10px] text-stone-400 uppercase block">{key}</span>
                                  <span className="font-semibold text-stone-800 break-words">{String(val)}</span>
                                </div>
                              ))}
                              {lead.buyer_type && (
                                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-100">
                                  <span className="font-mono text-[10px] text-stone-400 uppercase block">Buyer Type</span>
                                  <span className="font-semibold text-stone-800">{lead.buyer_type}</span>
                                </div>
                              )}
                              {lead.event_date && (
                                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-100">
                                  <span className="font-mono text-[10px] text-stone-400 uppercase block">Event Date</span>
                                  <span className="font-semibold text-stone-800">{lead.event_date}</span>
                                </div>
                              )}
                              {lead.source && (
                                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-100">
                                  <span className="font-mono text-[10px] text-stone-400 uppercase block">Source</span>
                                  <span className="font-semibold text-stone-800">{lead.source}</span>
                                </div>
                              )}
                            </div>

                            {lead.notes && (
                              <div className="pt-2 text-xs">
                                <strong className="text-stone-700 block mb-0.5">Staff Notes:</strong>
                                <p className="text-stone-600 bg-stone-50 p-2 rounded-lg border border-stone-100">{lead.notes}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
