/**
 * Owns what appears on the glasses:
 *  - 'list':    a scrollable list of headlines with a cursor marker. When idle,
 *               a too-long selected headline auto-scrolls (marquee) so the full
 *               title can be read.
 *               slide = move cursor, tap = open article, double-tap = exit app.
 *  - 'article': the selected article as one column of lines (blank line between
 *               paragraphs) that scrolls a few lines per slide.
 *               slide = scroll text, tap = back to the list.
 *
 * Rendering is a single full-screen text container updated in place.
 */
import { Article } from '../model/newsModel';
import { updateGlasses } from '../view/GlassesView';
import { htmlToText, wrapText, wrapLine, truncate, compactTime } from '../utils/text';
import {
    LIST_ROWS,
    ARTICLE_VIEW_LINES,
    ARTICLE_SCROLL_LINES,
    TITLE_WRAP_WIDTH,
    WRAP_WIDTH,
    CURSOR_MARKER,
    LIST_INDENT,
    INVERT_SCROLL,
    SCROLL_DEBOUNCE_MS,
    MARQUEE_STEP,
    MARQUEE_EDGE_DWELL_TICKS,
} from '../config';

type Mode = 'list' | 'article';

class DisplayPresenter {
    private mode: Mode = 'list';
    private articles: Article[] = [];
    private statusLine = 'Laden...'; // shown while there are no articles yet

    // list state
    private cursor = 0;
    private windowStart = 0;

    // marquee state (selected headline in the list)
    private marqueeOffset = 0;
    private marqueeDwell = MARQUEE_EDGE_DWELL_TICKS;

    // article state
    private articleLines: string[] = [];
    private scrollOffset = 0;

    private lastScrollAt = 0;

    /** Replace the article set (after a refresh). Keeps the cursor sensible. */
    setArticles(articles: Article[]) {
        const previousId = this.articles[this.cursor]?.id;
        this.articles = articles;

        // Keep the cursor on the same article if it still exists.
        const idx = previousId ? articles.findIndex(a => a.id === previousId) : -1;
        this.cursor = idx >= 0 ? idx : 0;
        if (idx < 0) this.resetMarquee();
        this.windowStart = Math.min(this.windowStart, Math.max(0, this.cursor));
        this.ensureCursorVisible();

        // If the opened article is being read, keep reading — the reader works
        // from its own copy of the lines.
        this.render();
    }

    setStatus(status: string) {
        this.statusLine = status;
        if (this.articles.length === 0 || this.mode === 'list') this.render();
    }

    /** Push the current view to the glasses. */
    render() {
        let content = '';
        try {
            content = this.mode === 'article' ? this.buildArticleScreen() : this.buildListScreen();
        } catch (e) {
            console.error('[display] build error:', e);
            return;
        }
        updateGlasses(content);
    }

    // ---- list screen ----

    private buildListScreen(): string {
        const now = compactTime(new Date());
        if (this.articles.length === 0) {
            return `NOS Nieuws  ${now}\n\n${this.statusLine}`;
        }

        const header = `NOS Nieuws  ${now}  ${this.cursor + 1}/${this.articles.length}`;
        const rows: string[] = [header];

        for (let i = this.windowStart; i < this.windowStart + LIST_ROWS; i++) {
            if (i >= this.articles.length) break;
            const a = this.articles[i];
            if (i === this.cursor) {
                rows.push(CURSOR_MARKER + this.selectedTitleView(a.title));
            } else {
                rows.push(LIST_INDENT + truncate(a.title, TITLE_WRAP_WIDTH));
            }
        }
        return rows.join('\n');
    }

    /** The selected headline, shifted by the current marquee offset. */
    private selectedTitleView(title: string): string {
        if (title.length <= TITLE_WRAP_WIDTH) return title;
        if (this.marqueeOffset <= 0) return truncate(title, TITLE_WRAP_WIDTH);
        return title.slice(this.marqueeOffset, this.marqueeOffset + TITLE_WRAP_WIDTH);
    }

    /**
     * Idle marquee: advance the selected headline a few characters per tick so
     * the whole title can be read, dwelling briefly at the start and the end.
     * Called from the marquee loop in Main; renders only when something moved.
     */
    marqueeTick() {
        if (this.mode !== 'list') return;
        const title = this.articles[this.cursor]?.title;
        if (!title || title.length <= TITLE_WRAP_WIDTH) return;

        if (this.marqueeDwell > 0) {
            this.marqueeDwell--;
            return;
        }

        const maxOffset = title.length - TITLE_WRAP_WIDTH;
        if (this.marqueeOffset >= maxOffset) {
            // Finished a full pass — jump back to the start and dwell there.
            this.marqueeOffset = 0;
            this.marqueeDwell = MARQUEE_EDGE_DWELL_TICKS;
        } else {
            this.marqueeOffset = Math.min(this.marqueeOffset + MARQUEE_STEP, maxOffset);
            if (this.marqueeOffset >= maxOffset) this.marqueeDwell = MARQUEE_EDGE_DWELL_TICKS;
        }
        this.render();
    }

    private resetMarquee() {
        this.marqueeOffset = 0;
        this.marqueeDwell = MARQUEE_EDGE_DWELL_TICKS;
    }

    private ensureCursorVisible() {
        if (this.cursor < this.windowStart) this.windowStart = this.cursor;
        if (this.cursor >= this.windowStart + LIST_ROWS) this.windowStart = this.cursor - LIST_ROWS + 1;
        const maxStart = Math.max(0, this.articles.length - LIST_ROWS);
        if (this.windowStart > maxStart) this.windowStart = maxStart;
        if (this.windowStart < 0) this.windowStart = 0;
    }

    // ---- article screen ----

    private buildArticleLines(a: Article): string[] {
        const titleLines = wrapLine(a.title, WRAP_WIDTH);
        const meta = `${a.feedLabel} · ${compactTime(a.pubDate)}`;
        const bodyLines = wrapText(htmlToText(a.bodyHtml), WRAP_WIDTH);

        return [...titleLines, meta, '─────', ...(
            bodyLines.length > 0 ? bodyLines : ['(Geen tekst — bekijk dit bericht op nos.nl)']
        )];
    }

    private buildArticleScreen(): string {
        const total = this.articleLines.length;
        const visible = this.articleLines.slice(this.scrollOffset, this.scrollOffset + ARTICLE_VIEW_LINES);

        let footer: string;
        if (total > ARTICLE_VIEW_LINES) {
            const pct = Math.round(((this.scrollOffset + visible.length) / total) * 100);
            footer = `── ${pct}% · schuif: scroll · tik: terug`;
        } else {
            footer = '── tik: terug';
        }

        // Pad so the footer stays on the bottom row of the screen.
        while (visible.length < ARTICLE_VIEW_LINES) visible.push('');
        return [...visible, footer].join('\n');
    }

    // ---- gestures (called from eventPresenter) ----

    /** Tap: open the selected article, or return from the reader to the list. */
    onTap() {
        if (this.mode === 'list') {
            const a = this.articles[this.cursor];
            if (!a) return;
            this.articleLines = this.buildArticleLines(a);
            this.scrollOffset = 0;
            this.mode = 'article';
        } else {
            this.mode = 'list';
            this.articleLines = [];
            this.resetMarquee();
        }
        this.render();
    }

    /** Slide: move the list cursor, or scroll the article text. */
    onScroll(dir: 'up' | 'down') {
        const now = Date.now();
        if (now - this.lastScrollAt < SCROLL_DEBOUNCE_MS) return; // de-bounce twitchy touchpad
        this.lastScrollAt = now;

        let step = dir === 'up' ? -1 : 1;
        if (INVERT_SCROLL) step = -step;

        if (this.mode === 'list') {
            if (this.articles.length === 0) return;
            const next = this.clamp(this.cursor + step, 0, this.articles.length - 1);
            if (next === this.cursor) return;
            this.cursor = next;
            this.resetMarquee();
            this.ensureCursorVisible();
        } else {
            const maxOffset = Math.max(0, this.articleLines.length - ARTICLE_VIEW_LINES);
            const next = this.clamp(this.scrollOffset + step * ARTICLE_SCROLL_LINES, 0, maxOffset);
            if (next === this.scrollOffset) return;
            this.scrollOffset = next;
        }
        this.render();
    }

    private clamp(i: number, min: number, max: number): number {
        return i < min ? min : i > max ? max : i;
    }
}

const displayPresenter = new DisplayPresenter();
export default displayPresenter;
