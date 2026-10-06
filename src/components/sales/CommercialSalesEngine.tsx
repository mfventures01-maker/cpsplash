import React, { useState, useEffect } from 'react';
import { 
  SalesTerritory, 
  SalesJourney, 
  SalesOffer, 
  SalesQuestion, 
  SalesLead 
} from '../../types/database.types';
import { salesService } from '../../services/salesService';
import { analyticsService } from '../../services/analyticsService';
import { 
  CheckCircle2, 
  MessageCircle, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react';

interface CommercialSalesEngineProps {
  territorySlug?: string;
  territoryId?: string;
  onClose?: () => void;
  onNavigate?: (path: string) => void;
  isInline?: boolean;
}

export function CommercialSalesEngine({
  territorySlug,
  territoryId,
  onClose,
  onNavigate,
  isInline = false
}: CommercialSalesEngineProps) {
  // Data states
  const [loading, setLoading] = useState(true);
  const [territories, setTerritories] = useState<SalesTerritory[]>([]);
  const [selectedTerritory, setSelectedTerritory] = useState<SalesTerritory | null>(null);
  const [journeys, setJourneys] = useState<SalesJourney[]>([]);
  const [selectedJourney, setSelectedJourney] = useState<SalesJourney | null>(null);
  const [offers, setOffers] = useState<SalesOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<SalesOffer | null>(null);
  const [questions, setQuestions] = useState<SalesQuestion[]>([]);

  // Form states
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdLead, setCreatedLead] = useState<SalesLead | null>(null);

  // Load initial territories
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const allTerritories = await salesService.getActiveTerritories();
        if (!mounted) return;
        setTerritories(allTerritories);

        // Pre-select if territorySlug or territoryId provided
        let target: SalesTerritory | undefined;
        if (territorySlug) {
          target = allTerritories.find(t => t.slug.toLowerCase() === territorySlug.toLowerCase());
        } else if (territoryId) {
          target = allTerritories.find(t => t.id === territoryId);
        }

        if (target) {
          setSelectedTerritory(target);
          await loadJourneyAndQuestions(target.id);
        }
      } catch (err) {
        console.error('[SalesEngine] Failed to load territories:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [territorySlug, territoryId]);

  // Load journeys, offers, and questions for a chosen territory
  const loadJourneyAndQuestions = async (tId: string) => {
    try {
      const [tJourneys, tOffers] = await Promise.all([
        salesService.getJourneysForTerritory(tId),
        salesService.getOffersForTerritory(tId)
      ]);

      setJourneys(tJourneys);
      setOffers(tOffers);
      if (tOffers.length > 0) {
        setSelectedOffer(tOffers[0]);
      }

      const activeJourney = tJourneys[0] || null;
      setSelectedJourney(activeJourney);

      if (activeJourney) {
        const tQuestions = await salesService.getQuestionsForJourney(activeJourney.id);
        setQuestions(tQuestions);

        analyticsService.trackEvent('sales_form_started', {
          territoryId: tId,
          journeyId: activeJourney.id,
          offerId: tOffers[0]?.id
        });
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error('[SalesEngine] Failed to load journey questions:', err);
    }
  };

  const handleSelectTerritory = async (territory: SalesTerritory) => {
    setSelectedTerritory(territory);
    setAnswers({});
    setSubmitError(null);
    setCreatedLead(null);
    analyticsService.trackEvent('territory_selected', {
      territoryId: territory.id,
      metadata: { slug: territory.slug, name: territory.name }
    });
    setLoading(true);
    await loadJourneyAndQuestions(territory.id);
    setLoading(false);
  };

  const handleAnswerChange = (fieldKey: string, value: unknown) => {
    setAnswers(prev => ({ ...prev, [fieldKey]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTerritory || !selectedJourney) return;

    // Validate required fields
    for (const q of questions) {
      if (q.required) {
        const val = answers[q.field_key];
        if (val === undefined || val === null || String(val).trim() === '') {
          setSubmitError(`Please answer "${q.label}" before continuing.`);
          return;
        }
      }
    }

    setSubmitting(true);
    setSubmitError(null);

    analyticsService.trackEvent('sales_form_completed', {
      territoryId: selectedTerritory.id,
      journeyId: selectedJourney.id,
      offerId: selectedOffer?.id
    });

    const { lead, error } = await salesService.createLead({
      territoryId: selectedTerritory.id,
      journeyId: selectedJourney.id,
      offerId: selectedOffer?.id || null,
      answers,
      source: 'commercial_sales_engine'
    });

    setSubmitting(false);

    if (error || !lead) {
      setSubmitError(error || 'Failed to submit qualification lead. Please try again.');
      return;
    }

    setCreatedLead(lead);

    analyticsService.trackEvent('lead_created', {
      leadId: lead.id,
      territoryId: selectedTerritory.id,
      journeyId: selectedJourney.id,
      offerId: selectedOffer?.id,
      metadata: { leadNumber: lead.lead_number }
    });
  };

  // Generate contextual WhatsApp Link
  const buildWhatsAppLink = (lead: SalesLead, journey: SalesJourney, territory: SalesTerritory) => {
    const rawPhone = journey.whatsapp_number || '2348127700724';
    const cleanPhone = rawPhone.replace(/\D/g, '');

    const buyerTypeVal = lead.buyer_type || (lead.answers?.buyer_type as string) || 'Commercial Buyer';
    const contactVal = lead.contact_name || (lead.answers?.team_name as string) || (lead.answers?.contact_name as string) || 'Primary Contact';
    const locationVal = lead.location || (lead.answers?.location as string) || 'Delta State';
    const qtyVal = lead.quantity !== null && lead.quantity !== undefined ? lead.quantity : ((lead.answers?.quantity as string) || 'Bulk Order');
    const productInterestVal = lead.product_interest || (lead.answers?.product_interest as string) || (selectedOffer?.name) || 'CP Splash Premium Range';
    const eventDateVal = lead.event_date || (lead.answers?.event_date as string) || 'Immediate / Ongoing Supply';

    const lines: string[] = [
      `*CP SPLASH COMMERCIAL INQUIRY*`,
      `*Lead Ref:* ${lead.lead_number}`,
      `*Territory:* ${territory.name}`,
      `*Buyer Type:* ${buyerTypeVal}`,
      `*Contact:* ${contactVal}`,
      `*Location:* ${locationVal}`,
      `*Required Qty:* ${qtyVal} bottles/packs`,
      `*Product Interest:* ${productInterestVal}`,
      `*Target Date:* ${eventDateVal}`,
      ``,
      `Hello CP Splash! I have completed qualification via the website and would like to finalize my order/quote.`
    ];

    const encoded = encodeURIComponent(lines.join('\n'));
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  };

  const handleWhatsAppClick = (lead: SalesLead, journey: SalesJourney, territory: SalesTerritory) => {
    analyticsService.trackEvent('whatsapp_started', {
      leadId: lead.id,
      territoryId: territory.id,
      journeyId: journey.id,
      metadata: { leadNumber: lead.lead_number }
    });
  };

  const content = (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden max-w-2xl w-full mx-auto">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white p-6 sm:p-8 relative">
        {onClose && !isInline && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Commercial Acquisition Engine</span>
        </div>

        <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          {selectedTerritory ? selectedTerritory.name : 'What are you buying for?'}
        </h3>

        <p className="text-stone-300 text-sm mt-1 max-w-lg leading-relaxed">
          {selectedTerritory
            ? (selectedTerritory.headline || selectedTerritory.description || 'Complete the brief qualification to receive wholesale rates.')
            : 'Select your commercial territory to access bespoke pricing, institutional supply, or direct checkout.'}
        </p>

        {selectedTerritory && (
          <div className="mt-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/30 text-rose-300 text-xs font-bold">
              {selectedTerritory.cta_label || 'Direct Commercial Channel'}
            </span>
            {!territorySlug && (
              <button
                onClick={() => {
                  setSelectedTerritory(null);
                  setCreatedLead(null);
                  setAnswers({});
                }}
                className="text-xs text-stone-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Change territory
              </button>
            )}
          </div>
        )}
      </div>

      {/* Body content */}
      <div className="p-6 sm:p-8">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-rose-600 animate-spin mx-auto" />
            <p className="text-sm font-medium text-stone-600">Connecting to commercial brain...</p>
          </div>
        ) : createdLead && selectedTerritory && selectedJourney ? (
          /* SUCCESS STATE: Deterministic Lead Identity confirmed */
          <div className="space-y-6 py-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-4 border-emerald-50">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Authoritative Lead Generated
              </span>
              <h4 className="text-2xl font-black text-stone-900">
                Reference: <span className="text-rose-700 font-mono">{createdLead.lead_number}</span>
              </h4>
              <p className="text-sm text-stone-600 max-w-md mx-auto">
                Your qualification has been registered in the CP Splash live commercial pipeline. Connect with our dedicated sales dispatch on WhatsApp to finalize your delivery.
              </p>
            </div>

            {/* Inbound Lead Summary Card */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-left text-xs font-mono space-y-1.5 max-w-md mx-auto">
              <div className="flex justify-between text-stone-500 pb-1 border-b border-stone-200">
                <span>TERRITORY</span>
                <span className="font-bold text-stone-900">{selectedTerritory.name}</span>
              </div>
              <div className="flex justify-between text-stone-500 pb-1 border-b border-stone-200">
                <span>DESTINATION</span>
                <span className="font-bold text-stone-900">{selectedJourney.destination.toUpperCase()}</span>
              </div>
              {createdLead.quantity && (
                <div className="flex justify-between text-stone-500 pb-1 border-b border-stone-200">
                  <span>QUANTITY</span>
                  <span className="font-bold text-stone-900">{createdLead.quantity}</span>
                </div>
              )}
              {createdLead.location && (
                <div className="flex justify-between text-stone-500">
                  <span>LOCATION</span>
                  <span className="font-bold text-stone-900">{createdLead.location}</span>
                </div>
              )}
            </div>

            {/* Direct Conversion CTA */}
            <div className="pt-2">
              <a
                href={buildWhatsAppLink(createdLead, selectedJourney, selectedTerritory)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleWhatsAppClick(createdLead, selectedJourney, selectedTerritory)}
                className="w-full inline-flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/20 transition-all cursor-pointer"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Connect via WhatsApp with Ref {createdLead.lead_number}</span>
              </a>
            </div>

            {onNavigate && (
              <button
                onClick={() => {
                  if (onClose) onClose();
                  onNavigate('/shop');
                }}
                className="text-xs font-bold text-stone-500 hover:text-stone-900 underline cursor-pointer"
              >
                Or browse consumer retail catalog
              </button>
            )}
          </div>
        ) : !selectedTerritory ? (
          /* STEP 1: Select Territory (If not pre-selected) */
          <div className="space-y-6">
            {territories.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                <h4 className="font-bold text-stone-900 text-base">No Commercial Territories Published Yet</h4>
                <p className="text-xs text-stone-600 max-w-sm mx-auto">
                  Commercial territories are controlled through the CMS Admin. Once published in the database, they will appear dynamically here.
                </p>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('/admin')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold cursor-pointer hover:bg-stone-800"
                  >
                    Open CMS Admin
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {territories.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTerritory(t)}
                    className="group text-left p-5 rounded-2xl border border-stone-200 hover:border-rose-600 bg-white hover:bg-rose-50/40 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                        {t.slug}
                      </span>
                      <h4 className="text-lg font-black text-stone-900 group-hover:text-rose-700 transition-colors">
                        {t.name}
                      </h4>
                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {t.headline || t.description || 'Exclusive commercial terms & bulk distribution.'}
                      </p>
                    </div>

                    <div className="pt-4 mt-2 flex items-center justify-between text-xs font-bold text-stone-500 group-hover:text-rose-700">
                      <span>{t.cta_label || 'Get Pricing'}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* STEP 2: Qualification Questions Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {questions.length === 0 ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  This territory currently has zero dynamic qualification questions configured. Enter your contact details below to receive a personalized commercial quote.
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Your Name / Organization *</label>
                    <input
                      type="text"
                      required
                      value={String(answers.contact_name || '')}
                      onChange={e => handleAnswerChange('contact_name', e.target.value)}
                      placeholder="e.g. Coach David / Sapele Athletic Club"
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Phone Number (WhatsApp) *</label>
                      <input
                        type="tel"
                        required
                        value={String(answers.phone || '')}
                        onChange={e => handleAnswerChange('phone', e.target.value)}
                        placeholder="08012345678"
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Estimated Quantity *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={String(answers.quantity || '')}
                        onChange={e => handleAnswerChange('quantity', e.target.value)}
                        placeholder="e.g. 50"
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Delivery Location (City/Town) *</label>
                    <input
                      type="text"
                      required
                      value={String(answers.location || '')}
                      onChange={e => handleAnswerChange('location', e.target.value)}
                      placeholder="e.g. Sapele, Delta State"
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-600"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* DYNAMIC QUESTIONS RENDERED FROM CMS */
              <div className="space-y-4">
                {questions.map(q => {
                  const currentValue = answers[q.field_key];
                  return (
                    <div key={q.id} className="space-y-1.5">
                      <label className="block text-xs font-bold text-stone-800">
                        {q.label} {q.required && <span className="text-rose-600">*</span>}
                      </label>

                      {q.question_type === 'select' ? (
                        <select
                          required={q.required}
                          value={String(currentValue || '')}
                          onChange={e => handleAnswerChange(q.field_key, e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:border-rose-600"
                        >
                          <option value="">{q.placeholder || '-- Select an option --'}</option>
                          {Array.isArray(q.options) && q.options.map((opt, idx) => {
                            const label = typeof opt === 'string' ? opt : (opt as { label?: string; value?: string }).label || String(opt);
                            const val = typeof opt === 'string' ? opt : (opt as { value?: string }).value || label;
                            return (
                              <option key={idx} value={val}>
                                {label}
                              </option>
                            );
                          })}
                        </select>
                      ) : q.question_type === 'textarea' ? (
                        <textarea
                          required={q.required}
                          rows={3}
                          value={String(currentValue || '')}
                          onChange={e => handleAnswerChange(q.field_key, e.target.value)}
                          placeholder={q.placeholder || ''}
                          className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-600"
                        />
                      ) : (
                        <input
                          type={q.question_type === 'number' ? 'number' : q.question_type === 'date' ? 'date' : q.question_type === 'email' ? 'email' : q.question_type === 'tel' ? 'tel' : 'text'}
                          required={q.required}
                          value={String(currentValue || '')}
                          onChange={e => handleAnswerChange(q.field_key, e.target.value)}
                          placeholder={q.placeholder || ''}
                          className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-600"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Standard contact fields fallback if not already asked in dynamic questions */}
            {!questions.some(q => q.field_key === 'contact_name') && (
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={String(answers.contact_name || '')}
                  onChange={e => handleAnswerChange('contact_name', e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-600"
                />
              </div>
            )}

            {!questions.some(q => q.field_key === 'phone') && (
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">WhatsApp Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={String(answers.phone || '')}
                  onChange={e => handleAnswerChange('phone', e.target.value)}
                  placeholder="e.g. 08127700724"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-600"
                />
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-6 rounded-2xl bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-rose-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying with database...</span>
                  </>
                ) : (
                  <>
                    <span>{selectedJourney?.cta_label || selectedTerritory.cta_label || 'Submit Qualification'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 text-[11px] text-stone-500 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Commercial RLS
              </span>
              <span>•</span>
              <span className="font-mono">
                Direct Supabase Sequence
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  if (isInline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="my-auto w-full max-w-2xl">
        {content}
      </div>
    </div>
  );
}
