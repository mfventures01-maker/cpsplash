import React, { useState, useEffect } from 'react';
import { 
  SalesTerritory, 
  SalesJourney, 
  SalesOffer, 
  SalesQuestion 
} from '../../types/database.types';
import { salesService } from '../../services/salesService';
import { 
  Layers, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Loader2, 
  HelpCircle, 
  Sparkles,
  ArrowRight,
  Compass,
  Tag,
  AlertCircle
} from 'lucide-react';

type BrainSubTab = 'territories' | 'journeys' | 'offers' | 'questions';

export function AdminCommercialBrain() {
  const [subTab, setSubTab] = useState<BrainSubTab>('territories');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Entities
  const [territories, setTerritories] = useState<SalesTerritory[]>([]);
  const [journeys, setJourneys] = useState<SalesJourney[]>([]);
  const [offers, setOffers] = useState<SalesOffer[]>([]);
  const [questions, setQuestions] = useState<SalesQuestion[]>([]);

  // Modals
  const [editingTerritory, setEditingTerritory] = useState<Partial<SalesTerritory> | null>(null);
  const [editingJourney, setEditingJourney] = useState<Partial<SalesJourney> | null>(null);
  const [editingOffer, setEditingOffer] = useState<Partial<SalesOffer> | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Partial<SalesQuestion> | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tList, jList, oList, qList] = await Promise.all([
        salesService.getAllTerritories(),
        salesService.getAllJourneys(),
        salesService.getAllOffers(),
        salesService.getAllQuestions()
      ]);
      setTerritories(tList);
      setJourneys(jList);
      setOffers(oList);
      setQuestions(qList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading commercial entities';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Territory handlers
  const handleSaveTerritory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTerritory?.name || !editingTerritory?.slug) return;
    try {
      await salesService.saveTerritory(editingTerritory);
      setEditingTerritory(null);
      showSuccess('Commercial territory saved successfully.');
      loadAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save territory');
    }
  };

  const handleDeleteTerritory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this commercial territory?')) return;
    try {
      await salesService.deleteTerritory(id);
      showSuccess('Territory deleted.');
      loadAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete territory');
    }
  };

  // Journey handlers
  const handleSaveJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJourney?.name || !editingJourney?.territory_id || !editingJourney?.slug) return;
    try {
      await salesService.saveJourney(editingJourney);
      setEditingJourney(null);
      showSuccess('Sales journey saved successfully.');
      loadAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save journey');
    }
  };

  const handleDeleteJourney = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sales journey?')) return;
    try {
      await salesService.deleteJourney(id);
      showSuccess('Journey deleted.');
      loadAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete journey');
    }
  };

  // Offer handlers
  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffer?.name || !editingOffer?.territory_id || !editingOffer?.slug) return;
    try {
      await salesService.saveOffer(editingOffer);
      setEditingOffer(null);
      showSuccess('Commercial offer saved successfully.');
      loadAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save offer');
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    try {
      await salesService.deleteOffer(id);
      showSuccess('Offer deleted.');
      loadAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete offer');
    }
  };

  // Question handlers
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion?.journey_id || !editingQuestion?.field_key || !editingQuestion?.label) return;
    try {
      let optionsArray: string[] | { label: string; value: string }[] | Record<string, unknown>[] = [];
      if (typeof editingQuestion.options === 'string') {
        const strVal = String(editingQuestion.options);
        try {
          optionsArray = JSON.parse(strVal);
        } catch {
          optionsArray = strVal.split(',').map(s => s.trim()).filter(Boolean);
        }
      } else if (Array.isArray(editingQuestion.options)) {
        optionsArray = editingQuestion.options;
      }
      await salesService.saveQuestion({
        ...editingQuestion,
        options: optionsArray
      });
      setEditingQuestion(null);
      showSuccess('Dynamic qualification question saved.');
      loadAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save question');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this qualification question?')) return;
    try {
      await salesService.deleteQuestion(id);
      showSuccess('Question deleted.');
      loadAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Commercial Brain Control Plane</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-1">
            Funnels, Journeys & Qualification
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Governs the 5 commercial territories, sales journeys, qualification questions, and contextual routing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {subTab === 'territories' && (
            <button
              onClick={() => setEditingTerritory({ active: true, sort_order: territories.length + 1, cta_label: 'Get Price' })}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Territory</span>
            </button>
          )}
          {subTab === 'journeys' && (
            <button
              onClick={() => setEditingJourney({ active: true, journey_type: 'quote', destination: 'whatsapp', cta_label: 'Continue on WhatsApp', territory_id: territories[0]?.id || '' })}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Journey</span>
            </button>
          )}
          {subTab === 'offers' && (
            <button
              onClick={() => setEditingOffer({ active: true, offer_type: 'standard', territory_id: territories[0]?.id || '' })}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Offer</span>
            </button>
          )}
          {subTab === 'questions' && (
            <button
              onClick={() => setEditingQuestion({ active: true, question_type: 'text', required: true, sort_order: questions.length + 1, journey_id: journeys[0]?.id || '' })}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Question</span>
            </button>
          )}
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Sub-navigation tabs */}
      <div className="flex border-b border-stone-200 gap-2">
        <button
          onClick={() => setSubTab('territories')}
          className={`px-4 py-2.5 font-bold text-xs flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
            subTab === 'territories' ? 'border-rose-600 text-rose-700' : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Territories ({territories.length})</span>
        </button>

        <button
          onClick={() => setSubTab('journeys')}
          className={`px-4 py-2.5 font-bold text-xs flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
            subTab === 'journeys' ? 'border-rose-600 text-rose-700' : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Journeys ({journeys.length})</span>
        </button>

        <button
          onClick={() => setSubTab('offers')}
          className={`px-4 py-2.5 font-bold text-xs flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
            subTab === 'offers' ? 'border-rose-600 text-rose-700' : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Offers ({offers.length})</span>
        </button>

        <button
          onClick={() => setSubTab('questions')}
          className={`px-4 py-2.5 font-bold text-xs flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
            subTab === 'questions' ? 'border-rose-600 text-rose-700' : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Qualification Questions ({questions.length})</span>
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-20 text-center space-y-2">
          <Loader2 className="w-8 h-8 text-rose-600 animate-spin mx-auto" />
          <p className="text-xs text-stone-500 font-mono">Syncing commercial brain from Supabase...</p>
        </div>
      ) : (
        <div>
          {/* TAB 1: TERRITORIES */}
          {subTab === 'territories' && (
            <div className="space-y-4">
              {territories.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 space-y-3">
                  <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                  <p className="text-sm font-bold text-stone-900">Zero Commercial Territories Configured</p>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    Create the five primary territories: Sports, Parties & Events, Hotels & Hospitality, Schools, and Individuals.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 font-mono uppercase text-stone-500">
                      <tr>
                        <th className="p-3">Order</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Slug</th>
                        <th className="p-3">CTA Label</th>
                        <th className="p-3">Landing Path</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {territories.map(t => (
                        <tr key={t.id} className="hover:bg-stone-50">
                          <td className="p-3 font-mono">{t.sort_order}</td>
                          <td className="p-3 font-bold text-stone-900">{t.name}</td>
                          <td className="p-3 font-mono text-rose-600">{t.slug}</td>
                          <td className="p-3">{t.cta_label}</td>
                          <td className="p-3 font-mono text-stone-500">{t.landing_path || `/${t.slug}`}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${t.active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                              {t.active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => setEditingTerritory(t)}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-stone-100"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTerritory(t.id)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-stone-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: JOURNEYS */}
          {subTab === 'journeys' && (
            <div className="space-y-4">
              {journeys.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-stone-200">
                  <p className="text-sm font-bold text-stone-900">Zero Sales Journeys Configured</p>
                  <p className="text-xs text-stone-500 mt-1">Configure conversion journeys linked to your commercial territories.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 font-mono uppercase text-stone-500">
                      <tr>
                        <th className="p-3">Journey Name</th>
                        <th className="p-3">Territory</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Destination</th>
                        <th className="p-3">WhatsApp Number</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {journeys.map(j => {
                        const terr = territories.find(t => t.id === j.territory_id);
                        return (
                          <tr key={j.id} className="hover:bg-stone-50">
                            <td className="p-3 font-bold text-stone-900">{j.name}</td>
                            <td className="p-3 font-semibold text-rose-700">{terr?.name || j.territory_id}</td>
                            <td className="p-3 font-mono">{j.journey_type}</td>
                            <td className="p-3 font-mono">{j.destination}</td>
                            <td className="p-3 font-mono text-stone-600">{j.whatsapp_number || 'Default (08127700724)'}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${j.active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                                {j.active ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <button onClick={() => setEditingJourney(j)} className="p-1.5 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-stone-100">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteJourney(j.id)} className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-stone-100">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OFFERS */}
          {subTab === 'offers' && (
            <div className="space-y-4">
              {offers.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-stone-200">
                  <p className="text-sm font-bold text-stone-900">Zero Commercial Offers Configured</p>
                  <p className="text-xs text-stone-500 mt-1">Create offers like "Sports Bulk Pack", "Event Quote", or "Hotel Wholesale".</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 font-mono uppercase text-stone-500">
                      <tr>
                        <th className="p-3">Offer Name</th>
                        <th className="p-3">Territory</th>
                        <th className="p-3">Slug</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {offers.map(o => {
                        const terr = territories.find(t => t.id === o.territory_id);
                        return (
                          <tr key={o.id} className="hover:bg-stone-50">
                            <td className="p-3 font-bold text-stone-900">{o.name}</td>
                            <td className="p-3 font-semibold text-rose-700">{terr?.name || o.territory_id}</td>
                            <td className="p-3 font-mono text-stone-500">{o.slug}</td>
                            <td className="p-3 font-mono">{o.offer_type}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${o.active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                                {o.active ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <button onClick={() => setEditingOffer(o)} className="p-1.5 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-stone-100">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteOffer(o.id)} className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-stone-100">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: QUESTIONS */}
          {subTab === 'questions' && (
            <div className="space-y-4">
              {questions.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-stone-200">
                  <p className="text-sm font-bold text-stone-900">Zero Qualification Questions Configured</p>
                  <p className="text-xs text-stone-500 mt-1">Configure questions like "Buyer Type", "Guest Count", "Quantity", or "Location".</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 border-b border-stone-200 font-mono uppercase text-stone-500">
                      <tr>
                        <th className="p-3">Order</th>
                        <th className="p-3">Field Key</th>
                        <th className="p-3">Label</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Journey</th>
                        <th className="p-3">Required</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {questions.map(q => {
                        const j = journeys.find(x => x.id === q.journey_id);
                        return (
                          <tr key={q.id} className="hover:bg-stone-50">
                            <td className="p-3 font-mono">{q.sort_order}</td>
                            <td className="p-3 font-mono font-bold text-rose-700">{q.field_key}</td>
                            <td className="p-3 font-semibold text-stone-900">{q.label}</td>
                            <td className="p-3 font-mono">{q.question_type}</td>
                            <td className="p-3 text-stone-600">{j?.name || q.journey_id}</td>
                            <td className="p-3">{q.required ? <span className="text-rose-600 font-bold">YES</span> : 'Optional'}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${q.active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                                {q.active ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-2">
                              <button onClick={() => setEditingQuestion(q)} className="p-1.5 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-stone-100">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteQuestion(q.id)} className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-stone-100">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: EDIT/CREATE TERRITORY */}
      {editingTerritory && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <h3 className="font-bold text-base text-stone-900">
                {editingTerritory.id ? 'Edit Commercial Territory' : 'New Commercial Territory'}
              </h3>
              <button onClick={() => setEditingTerritory(null)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTerritory} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Territory Name *</label>
                  <input
                    type="text"
                    required
                    value={editingTerritory.name || ''}
                    onChange={e => setEditingTerritory({ ...editingTerritory, name: e.target.value })}
                    placeholder="e.g. Sports"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Slug *</label>
                  <input
                    type="text"
                    required
                    value={editingTerritory.slug || ''}
                    onChange={e => setEditingTerritory({ ...editingTerritory, slug: e.target.value })}
                    placeholder="e.g. sports"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Headline</label>
                <input
                  type="text"
                  value={editingTerritory.headline || ''}
                  onChange={e => setEditingTerritory({ ...editingTerritory, headline: e.target.value })}
                  placeholder="e.g. Fueling Athletes, Football Clubs & Fitness Communities"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingTerritory.description || ''}
                  onChange={e => setEditingTerritory({ ...editingTerritory, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">CTA Label *</label>
                  <input
                    type="text"
                    required
                    value={editingTerritory.cta_label || ''}
                    onChange={e => setEditingTerritory({ ...editingTerritory, cta_label: e.target.value })}
                    placeholder="e.g. Get Sports Pack Price"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Landing Path</label>
                  <input
                    type="text"
                    value={editingTerritory.landing_path || ''}
                    onChange={e => setEditingTerritory({ ...editingTerritory, landing_path: e.target.value })}
                    placeholder="e.g. /sports"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={editingTerritory.sort_order ?? 0}
                    onChange={e => setEditingTerritory({ ...editingTerritory, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="t_active"
                    checked={editingTerritory.active ?? true}
                    onChange={e => setEditingTerritory({ ...editingTerritory, active: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded"
                  />
                  <label htmlFor="t_active" className="font-bold text-stone-700 cursor-pointer">Active / Published</label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingTerritory(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold"
                >
                  Save Territory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT/CREATE JOURNEY */}
      {editingJourney && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <h3 className="font-bold text-base text-stone-900">
                {editingJourney.id ? 'Edit Sales Journey' : 'New Sales Journey'}
              </h3>
              <button onClick={() => setEditingJourney(null)}><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveJourney} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Parent Territory *</label>
                <select
                  required
                  value={editingJourney.territory_id || ''}
                  onChange={e => setEditingJourney({ ...editingJourney, territory_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white"
                >
                  <option value="">-- Select Territory --</option>
                  {territories.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.slug})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Journey Name *</label>
                  <input
                    type="text"
                    required
                    value={editingJourney.name || ''}
                    onChange={e => setEditingJourney({ ...editingJourney, name: e.target.value })}
                    placeholder="e.g. Sports Quote Flow"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Slug *</label>
                  <input
                    type="text"
                    required
                    value={editingJourney.slug || ''}
                    onChange={e => setEditingJourney({ ...editingJourney, slug: e.target.value })}
                    placeholder="e.g. sports-quote"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Destination</label>
                  <select
                    value={editingJourney.destination || 'whatsapp'}
                    onChange={e => setEditingJourney({ ...editingJourney, destination: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white"
                  >
                    <option value="whatsapp">WhatsApp Conversion</option>
                    <option value="checkout">Online Checkout</option>
                    <option value="portal">Customer Portal</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">WhatsApp Hotline</label>
                  <input
                    type="text"
                    value={editingJourney.whatsapp_number || ''}
                    onChange={e => setEditingJourney({ ...editingJourney, whatsapp_number: e.target.value })}
                    placeholder="e.g. 2348127700724"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">CTA Label</label>
                <input
                  type="text"
                  value={editingJourney.cta_label || ''}
                  onChange={e => setEditingJourney({ ...editingJourney, cta_label: e.target.value })}
                  placeholder="e.g. Finalize on WhatsApp"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="j_active"
                  checked={editingJourney.active ?? true}
                  onChange={e => setEditingJourney({ ...editingJourney, active: e.target.checked })}
                  className="w-4 h-4 text-rose-600 rounded"
                />
                <label htmlFor="j_active" className="font-bold text-stone-700 cursor-pointer">Active</label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
                <button type="button" onClick={() => setEditingJourney(null)} className="px-4 py-2 rounded-xl border font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold">Save Journey</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT/CREATE OFFER */}
      {editingOffer && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <h3 className="font-bold text-base text-stone-900">
                {editingOffer.id ? 'Edit Commercial Offer' : 'New Commercial Offer'}
              </h3>
              <button onClick={() => setEditingOffer(null)}><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Territory *</label>
                <select
                  required
                  value={editingOffer.territory_id || ''}
                  onChange={e => setEditingOffer({ ...editingOffer, territory_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white"
                >
                  <option value="">-- Select Territory --</option>
                  {territories.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Offer Name *</label>
                  <input
                    type="text"
                    required
                    value={editingOffer.name || ''}
                    onChange={e => setEditingOffer({ ...editingOffer, name: e.target.value })}
                    placeholder="e.g. Sports Bulk Pack"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Slug *</label>
                  <input
                    type="text"
                    required
                    value={editingOffer.slug || ''}
                    onChange={e => setEditingOffer({ ...editingOffer, slug: e.target.value })}
                    placeholder="e.g. sports-bulk-pack"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingOffer.description || ''}
                  onChange={e => setEditingOffer({ ...editingOffer, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="o_active"
                  checked={editingOffer.active ?? true}
                  onChange={e => setEditingOffer({ ...editingOffer, active: e.target.checked })}
                  className="w-4 h-4 text-rose-600 rounded"
                />
                <label htmlFor="o_active" className="font-bold text-stone-700 cursor-pointer">Active</label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
                <button type="button" onClick={() => setEditingOffer(null)} className="px-4 py-2 rounded-xl border font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold">Save Offer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT/CREATE QUESTION */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <h3 className="font-bold text-base text-stone-900">
                {editingQuestion.id ? 'Edit Qualification Question' : 'New Qualification Question'}
              </h3>
              <button onClick={() => setEditingQuestion(null)}><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Parent Journey *</label>
                <select
                  required
                  value={editingQuestion.journey_id || ''}
                  onChange={e => setEditingQuestion({ ...editingQuestion, journey_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white"
                >
                  <option value="">-- Select Journey --</option>
                  {journeys.map(j => {
                    const t = territories.find(x => x.id === j.territory_id);
                    return <option key={j.id} value={j.id}>{j.name} ({t?.name || 'Territory'})</option>;
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Field Key *</label>
                  <input
                    type="text"
                    required
                    value={editingQuestion.field_key || ''}
                    onChange={e => setEditingQuestion({ ...editingQuestion, field_key: e.target.value })}
                    placeholder="e.g. buyer_type, quantity, event_date"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono"
                  />
                  <span className="text-[10px] text-stone-400">Standard keys: buyer_type, quantity, event_date, location, product_interest</span>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Question Type</label>
                  <select
                    value={editingQuestion.question_type || 'text'}
                    onChange={e => setEditingQuestion({ ...editingQuestion, question_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white"
                  >
                    <option value="text">Text Input</option>
                    <option value="select">Dropdown Select</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="tel">Phone / WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="textarea">Textarea (Long Text)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Label (Question text shown to user) *</label>
                <input
                  type="text"
                  required
                  value={editingQuestion.label || ''}
                  onChange={e => setEditingQuestion({ ...editingQuestion, label: e.target.value })}
                  placeholder="e.g. What type of team or organization are you?"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Placeholder</label>
                <input
                  type="text"
                  value={editingQuestion.placeholder || ''}
                  onChange={e => setEditingQuestion({ ...editingQuestion, placeholder: e.target.value })}
                  placeholder="e.g. Football team, Gym, Tournament"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              {editingQuestion.question_type === 'select' && (
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Select Options (comma-separated or JSON)</label>
                  <input
                    type="text"
                    value={typeof editingQuestion.options === 'string' ? editingQuestion.options : JSON.stringify(editingQuestion.options || [])}
                    onChange={e => setEditingQuestion({ ...editingQuestion, options: e.target.value as unknown as Record<string, unknown>[] })}
                    placeholder='["Football Club", "Gym / Fitness Center", "School Sports", "Tournament"]'
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono text-xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={editingQuestion.sort_order ?? 0}
                    onChange={e => setEditingQuestion({ ...editingQuestion, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200"
                  />
                </div>
                <div className="space-y-1 pt-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="q_req"
                      checked={editingQuestion.required ?? false}
                      onChange={e => setEditingQuestion({ ...editingQuestion, required: e.target.checked })}
                      className="w-4 h-4 text-rose-600 rounded"
                    />
                    <label htmlFor="q_req" className="font-bold text-stone-700 cursor-pointer">Required field</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="q_act"
                      checked={editingQuestion.active ?? true}
                      onChange={e => setEditingQuestion({ ...editingQuestion, active: e.target.checked })}
                      className="w-4 h-4 text-rose-600 rounded"
                    />
                    <label htmlFor="q_act" className="font-bold text-stone-700 cursor-pointer">Active</label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
                <button type="button" onClick={() => setEditingQuestion(null)} className="px-4 py-2 rounded-xl border font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold">Save Question</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
