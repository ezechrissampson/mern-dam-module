import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

/**
 * SVG files are XML and can carry embedded <script>, event handlers
 * (onload, onclick), and external references — a classic stored-XSS
 * vector for DAM systems. Every SVG upload is sanitized before it is
 * persisted to storage.
 */
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

export function sanitizeSvg(svgString) {
  return DOMPurify.sanitize(svgString, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'foreignObject'],
    FORBID_ATTR: ['onload', 'onclick', 'onerror', 'onmouseover'],
  });
}

export function sanitizeSvgBuffer(buffer) {
  const clean = sanitizeSvg(buffer.toString('utf-8'));
  return Buffer.from(clean, 'utf-8');
}

export default sanitizeSvg;
