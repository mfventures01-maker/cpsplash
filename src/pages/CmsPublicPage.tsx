import React, { useEffect, useState } from 'react';
import { cmsPagesService } from '../services/cmsPagesService';

type PageRecord = {
  id: string;
  title: string;
  path: string;
  content?: Record<string, unknown> | null;
  seo_title?: string | null;
  seo_description?: string | null;
  sections?: Array<{
    id: string;
    section_key: string;
    section_type: string;
    sort_order: number;
    enabled: boolean;
    content: Record<string, unknown>;
  }>;
};

interface CmsPublicPageProps {
  path: string;
  fallback: React.ReactNode;
}

const readText = (value: unknown) => typeof value === 'string' ? value : '';

export function CmsPublicPage({ path, fallback }: CmsPublicPageProps) {
  const [page, setPage] = useState<PageRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    cmsPagesService.getPublishedPageByPath(path).then(result => {
      if (!active) return;
      setPage(result.data as PageRecord | null);
      setLoading(false);
    }).catch(() => {
      if (active) {
        setPage(null);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [path]);

  useEffect(() => {
    if (!page) return;
    document.title = page.seo_title || page.title;
    const description = page.seo_description || '';
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', 'description');
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', description);
  }, [page]);

  if (loading) {
    return <div className="mx-auto max-w-5xl px-6 py-24 text-center text-sm text-stone-500">Loading page…</div>;
  }
  if (!page) return <>{fallback}</>;

  const sections = [...(page.sections || [])]
    .filter(section => section.enabled)
    .sort((a, b) => a.sort_order - b.sort_order);

  const content = page.content || {};
  const contentSections = Array.isArray(content.sections) ? content.sections as Record<string, unknown>[] : [];
  const blocks: Array<Record<string, unknown>> = sections.length
    ? sections.map(section => ({ ...section.content, key: section.section_key, type: section.section_type }))
    : contentSections.map((section, index) => ({ ...section, key: String(section.key || index) }));

  return (
    <article className="mx-auto max-w-6xl space-y-8 px-5 py-12 sm:px-8 sm:py-16">
      <header className="max-w-3xl space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-700">{readText(content.eyebrow)}</p>
        <h1 className="text-4xl font-black tracking-tight text-stone-950 sm:text-6xl">{page.title}</h1>
        {readText(content.description) && <p className="text-lg leading-relaxed text-stone-600">{readText(content.description)}</p>}
      </header>
      <div className="space-y-8">
        {blocks.map((block, index) => {
          const heading = readText(block.heading || block.title);
          const body = readText(block.body || block.text || block.description);
          const imageUrl = readText(block.image_url || block.imageUrl);
          const ctaLabel = readText(block.cta_label || block.button_label);
          const ctaUrl = readText(block.cta_url || block.button_url);
          return (
            <section key={String(block.key || index)} className="grid gap-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:grid-cols-2 md:items-center">
              <div className="space-y-4">
                {heading && <h2 className="text-2xl font-bold text-stone-900">{heading}</h2>}
                {body && <p className="whitespace-pre-wrap leading-relaxed text-stone-600">{body}</p>}
                {ctaLabel && ctaUrl && <a href={ctaUrl} className="inline-flex rounded-xl bg-rose-700 px-5 py-3 text-sm font-bold text-white">{ctaLabel}</a>}
              </div>
              {imageUrl && <img src={imageUrl} alt={readText(block.alt_text) || heading || page.title} loading="lazy" className="max-h-[440px] w-full rounded-2xl object-cover"/>}
            </section>
          );
        })}
      </div>
    </article>
  );
}
