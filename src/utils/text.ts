/**
 * Text helpers for the glasses display: HTML → plain text, word-wrapping for
 * the fixed proportional firmware font, and headline truncation.
 */

/**
 * Convert the HTML found in an RSS <description> to readable plain text.
 * Paragraphs and headings become separate lines; tags/entities are resolved
 * by the browser's HTML parser.
 */
export function htmlToText(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const blocks: string[] = [];
    const blockSelector = 'p, h1, h2, h3, h4, li, blockquote';
    const elements = doc.body.querySelectorAll(blockSelector);

    if (elements.length === 0) {
        // No block markup at all — take the body text as-is.
        const flat = normalizeSpace(doc.body.textContent ?? '');
        return flat;
    }

    elements.forEach(el => {
        // Skip nested blocks (e.g. a <p> inside a <blockquote>) — the parent
        // already contributes the text.
        if (el.parentElement && el.parentElement.closest(blockSelector) !== null) return;
        const text = normalizeSpace(el.textContent ?? '');
        if (text) blocks.push(text);
    });

    return blocks.join('\n');
}

function normalizeSpace(s: string): string {
    return s.replace(/\s+/g, ' ').trim();
}

/** Greedy word-wrap to a character budget (the font is proportional, so approximate). */
export function wrapLine(text: string, width: number): string[] {
    const words = text.split(' ').filter(w => w.length > 0);
    const lines: string[] = [];
    let current = '';

    for (let word of words) {
        // Hard-break words longer than a full line so they can't push a row wide.
        while (word.length > width) {
            if (current) { lines.push(current); current = ''; }
            lines.push(word.slice(0, width - 1) + '-');
            word = word.slice(width - 1);
        }
        if (!current) {
            current = word;
        } else if (current.length + 1 + word.length <= width) {
            current += ' ' + word;
        } else {
            lines.push(current);
            current = word;
        }
    }
    if (current) lines.push(current);
    return lines;
}

/**
 * Wrap a multi-paragraph text (newline-separated) into display lines,
 * with a blank line between paragraphs.
 */
export function wrapText(text: string, width: number): string[] {
    const out: string[] = [];
    for (const para of text.split('\n')) {
        const t = para.trim();
        if (!t) continue;
        if (out.length > 0) out.push('');
        out.push(...wrapLine(t, width));
    }
    return out;
}

/** One-line headline, ellipsized to fit the list. */
export function truncate(text: string, width: number): string {
    const t = normalizeSpace(text);
    if (t.length <= width) return t;
    return t.slice(0, width - 1).trimEnd() + '…';
}

/** "14:32" or "gisteren" style compact timestamp for the glasses. */
export function compactTime(d: Date): string {
    const now = new Date();
    const sameDay = d.getFullYear() === now.getFullYear()
        && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    if (sameDay) return `${hh}:${mm}`;
    const dd = String(d.getDate()).padStart(2, '0');
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}-${mo} ${hh}:${mm}`;
}
