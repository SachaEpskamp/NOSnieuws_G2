/**
 * Phone-side UI: feed selection (checkboxes, persisted), a refresh button,
 * fetch status, and a preview of the merged headline list.
 */
import { FEED_CATALOG, FEED_GROUPS, defaultFeedIds, feedById } from '../feeds';
import { Article } from '../model/newsModel';
import { storage } from '../utils/storage';
import { STORAGE_SELECTED_FEEDS } from '../config';
import { toggleMobileConsole } from '../Scripts/debugConsole';

export type SelectionChangedHandler = (selected: string[]) => void;
export type RefreshRequestedHandler = () => void;

class PhoneView {
    private selected = new Set<string>(defaultFeedIds());
    private onSelectionChanged: SelectionChangedHandler = () => {};
    private onRefreshRequested: RefreshRequestedHandler = () => {};

    getSelected(): string[] {
        return [...this.selected];
    }

    /** Load the persisted selection (falls back to the NOS Nieuws defaults). */
    async loadSelection(): Promise<string[]> {
        try {
            const raw = await storage.getItem(STORAGE_SELECTED_FEEDS);
            if (raw) {
                const ids = JSON.parse(raw) as string[];
                const valid = ids.filter(id => feedById(id));
                if (valid.length > 0) this.selected = new Set(valid);
            }
        } catch (e) {
            console.warn('[phone] could not load feed selection:', e);
        }
        return this.getSelected();
    }

    private async saveSelection() {
        await storage.setItem(STORAGE_SELECTED_FEEDS, JSON.stringify(this.getSelected()));
    }

    init(onSelectionChanged: SelectionChangedHandler, onRefreshRequested: RefreshRequestedHandler) {
        this.onSelectionChanged = onSelectionChanged;
        this.onRefreshRequested = onRefreshRequested;

        this.renderFeedList();

        document.getElementById('refresh-button')?.addEventListener('click', () => {
            this.onRefreshRequested();
        });
        document.getElementById('toggle-console')?.addEventListener('click', () => {
            toggleMobileConsole();
        });
    }

    private renderFeedList() {
        const host = document.getElementById('feed-list');
        if (!host) return;
        host.innerHTML = '';

        for (const group of FEED_GROUPS) {
            const feeds = FEED_CATALOG.filter(f => f.group === group);
            if (feeds.length === 0) continue;

            const heading = document.createElement('h2');
            heading.className = 'feed-group';
            heading.textContent = group;
            host.appendChild(heading);

            for (const feed of feeds) {
                const row = document.createElement('label');
                row.className = 'feed-row';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = this.selected.has(feed.id);
                checkbox.addEventListener('change', async () => {
                    if (checkbox.checked) this.selected.add(feed.id);
                    else this.selected.delete(feed.id);
                    await this.saveSelection();
                    this.onSelectionChanged(this.getSelected());
                });

                const text = document.createElement('span');
                text.textContent = feed.label;

                row.appendChild(checkbox);
                row.appendChild(text);
                host.appendChild(row);
            }
        }
    }

    setStatus(message: string, isError = false) {
        const el = document.getElementById('fetch-status');
        if (!el) return;
        el.textContent = message;
        el.classList.toggle('status-error', isError);
    }

    setBusy(busy: boolean) {
        const btn = document.getElementById('refresh-button') as HTMLButtonElement | null;
        if (btn) {
            btn.disabled = busy;
            btn.textContent = busy ? 'Bezig met verversen…' : 'Ververs nieuws';
        }
    }

    showArticles(articles: Article[]) {
        const host = document.getElementById('article-list');
        if (!host) return;
        host.innerHTML = '';

        if (articles.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'article-empty';
            empty.textContent = 'Nog geen berichten geladen.';
            host.appendChild(empty);
            return;
        }

        for (const a of articles) {
            const row = document.createElement('div');
            row.className = 'article-row';

            const title = document.createElement('p');
            title.className = 'article-title';
            title.textContent = a.title;

            const meta = document.createElement('p');
            meta.className = 'article-meta';
            const hh = String(a.pubDate.getHours()).padStart(2, '0');
            const mm = String(a.pubDate.getMinutes()).padStart(2, '0');
            meta.textContent = `${a.feedLabel} · ${a.pubDate.toLocaleDateString('nl-NL')} ${hh}:${mm}`;

            row.appendChild(title);
            row.appendChild(meta);
            host.appendChild(row);
        }
    }
}

const phoneView = new PhoneView();
export default phoneView;
