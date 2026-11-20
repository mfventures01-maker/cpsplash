import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SafeMarkdown } from '../src/components/content/SafeMarkdown';

const html = renderToStaticMarkup(
  <SafeMarkdown content={`# Product story

Discover **CP Splash Beetroot Mix**.

### Why customers choose it

- Convenient 500ml bottle
- Made in *Sapele*
- Serve chilled

1. Keep refrigerated
2. Serve cold

<script>alert('x')</script>`} />
);

assert.match(html, /<h2/);
assert.match(html, /<h3/);
assert.match(html, /<strong>CP Splash Beetroot Mix<\/strong>/);
assert.match(html, /<em>Sapele<\/em>/);
assert.match(html, /<ul/);
assert.match(html, /<ol/);
assert.match(html, /&lt;script&gt;/);
assert.doesNotMatch(html, /<script>/);
console.log('PASS: product Markdown renders safe headings, paragraphs, lists and emphasis.');
