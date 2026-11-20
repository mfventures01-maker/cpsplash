import React from 'react';

type InlinePart = string | React.ReactElement;

function renderInline(source: string, keyPrefix: string): React.ReactNode[] {
  const tokenPattern = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\x60[^\x60]+\x60|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;
  const parts = source.split(tokenPattern).filter(Boolean);
  return parts.map((part, index): InlinePart => {
    const key = `${keyPrefix}-inline-${index}`;
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (link) {
      return <a key={key} href={link[2]} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{link[1]}</a>;
    }
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={key} className="px-1 py-0.5 rounded bg-stone-100 text-stone-800">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

/**
 * HOEOS reusable content primitive: safe Markdown renderer for ecommerce product copy.
 * Raw HTML is never interpreted. React escapes all text nodes.
 */
export function SafeMarkdown({ content, className = '' }: { content: string; className?: string }) {
  const lines = String(content || '').replace(/\r\n?/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let index = 0;
  let blockIndex = 0;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(' ').trim();
    if (text) {
      const paragraphKey = blockIndex++;
      blocks.push(<p key={`paragraph-${paragraphKey}`}>{renderInline(text, `p-${paragraphKey}`)}</p>);
    }
    paragraph = [];
  };

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      flushParagraph();
      index++;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      const level = heading[1].length <= 2 ? 2 : 3;
      const contentNodes = renderInline(heading[2], `heading-${index}`);
      blocks.push(level === 2
        ? <h2 key={`heading-${index}`} className="text-lg font-bold text-stone-900">{contentNodes}</h2>
        : <h3 key={`heading-${index}`} className="text-base font-bold text-stone-900">{contentNodes}</h3>);
      index++;
      continue;
    }

    const bullet = line.match(/^\s*[-*+]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (bullet || ordered) {
      flushParagraph();
      const isOrdered = Boolean(ordered);
      const items: React.ReactNode[] = [];
      while (index < lines.length) {
        const match = lines[index].match(isOrdered ? /^\s*\d+[.)]\s+(.+)$/ : /^\s*[-*+]\s+(.+)$/);
        if (!match) break;
        items.push(<li key={`list-${index}`}>{renderInline(match[1], `li-${index}`)}</li>);
        index++;
      }
      blocks.push(isOrdered
        ? <ol key={`ol-${index}`} className="list-decimal pl-6 space-y-1">{items}</ol>
        : <ul key={`ul-${index}`} className="list-disc pl-6 space-y-1">{items}</ul>);
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      flushParagraph();
      const quote: string[] = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) {
        quote.push(lines[index].replace(/^\s*>\s?/, '').trim());
        index++;
      }
      blocks.push(<blockquote key={`quote-${index}`} className="border-l-2 border-rose-300 pl-4 italic text-stone-600">{renderInline(quote.join(' '), `quote-${index}`)}</blockquote>);
      continue;
    }

    paragraph.push(line.trim());
    index++;
  }

  flushParagraph();
  return <div className={`safe-markdown space-y-3 ${className}`.trim()}>{blocks}</div>;
}
