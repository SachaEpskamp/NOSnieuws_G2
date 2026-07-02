/**
 * Fetches and merges the selected NOS RSS feeds.
 *
 * CORS: feeds.nos.nl sends no Access-Control-Allow-Origin header, so a direct
 * fetch from the WebView may be blocked. We try direct first (cheapest, and
 * some WebView configurations allow it), then fall back through public CORS
 * proxies. The first strategy that works is remembered (persisted) and tried
 * first next time.
 */
import { feedById, feedUrl } from '../feeds';
import { storage } from '../utils/storage';
import { FETCH_TIMEOUT_MS, MAX_ARTICLES, STORAGE_FETCH_STRATEGY } from '../config';

export interface Article {
    id: string;        // the <link>, unique per article
    title: string;
    link: string;
    feedId: string;
    feedLabel: string; // short label for the glasses
    pubDate: Date;
    bodyHtml: string;  // full article HTML from <description>
}

interface FetchStrategy {
    id: string;
    wrap: (url: string) => string;
}

const STRATEGIES: FetchStrategy[] = [
    { id: 'direct',     wrap: u => u },
    { id: 'corsproxy',  wrap: u => `https://corsproxy.io/?url=${encodeURIComponent(u)}` },
    { id: 'allorigins', wrap: u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}` },
    { id: 'codetabs',   wrap: u => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}` },
];

let preferredStrategy: string | null = null;

export async function loadPreferredStrategy(): Promise<void> {
    preferredStrategy = await storage.getItem(STORAGE_FETCH_STRATEGY);
}

function orderedStrategies(): FetchStrategy[] {
    if (!preferredStrategy) return STRATEGIES;
    const pref = STRATEGIES.find(s => s.id === preferredStrategy);
    if (!pref) return STRATEGIES;
    return [pref, ...STRATEGIES.filter(s => s !== pref)];
}

async function fetchWithTimeout(url: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
    } finally {
        clearTimeout(timer);
    }
}

/** Fetch one feed's raw XML, walking the strategy chain until one yields RSS. */
async function fetchFeedXml(id: string): Promise<string> {
    const url = feedUrl(id);
    let lastError: unknown = null;

    for (const strategy of orderedStrategies()) {
        try {
            const text = await fetchWithTimeout(strategy.wrap(url));
            // Sanity check — proxies sometimes return an HTML error page with 200.
            if (!text.includes('<rss') && !text.includes('<item')) {
                throw new Error('response is not RSS');
            }
            if (preferredStrategy !== strategy.id) {
                preferredStrategy = strategy.id;
                storage.setItem(STORAGE_FETCH_STRATEGY, strategy.id).catch(() => {});
            }
            console.log(`[news] ${id}: ok via ${strategy.id}`);
            return text;
        } catch (e) {
            lastError = e;
            console.warn(`[news] ${id}: ${strategy.id} failed:`, e instanceof Error ? e.message : e);
        }
    }
    throw lastError ?? new Error('all fetch strategies failed');
}

function parseFeed(xml: string, feedId: string): Article[] {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    if (doc.querySelector('parsererror')) {
        throw new Error('XML parse error');
    }
    const feedDef = feedById(feedId);
    const articles: Article[] = [];

    doc.querySelectorAll('item').forEach(item => {
        const title = item.querySelector('title')?.textContent?.trim() ?? '';
        const link = item.querySelector('link')?.textContent?.trim() ?? '';
        const description = item.querySelector('description')?.textContent ?? '';
        const pubDateText = item.querySelector('pubDate')?.textContent ?? '';
        const pubDate = new Date(pubDateText);
        if (!title || !link) return;
        articles.push({
            id: link,
            title,
            link,
            feedId,
            feedLabel: feedDef?.shortLabel ?? feedId,
            pubDate: isNaN(pubDate.getTime()) ? new Date(0) : pubDate,
            bodyHtml: description,
        });
    });
    return articles;
}

export interface RefreshResult {
    articles: Article[];
    okFeeds: string[];
    failedFeeds: string[];
    strategy: string | null;
}

/** Fetch all selected feeds in parallel, merge, dedupe by link, newest first. */
export async function refreshNews(selectedFeedIds: string[]): Promise<RefreshResult> {
    const results = await Promise.allSettled(
        selectedFeedIds.map(async id => ({ id, articles: parseFeed(await fetchFeedXml(id), id) })),
    );

    const byLink = new Map<string, Article>();
    const okFeeds: string[] = [];
    const failedFeeds: string[] = [];

    results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
            okFeeds.push(r.value.id);
            for (const a of r.value.articles) {
                // Same article can appear in multiple feeds (e.g. algemeen + binnenland).
                if (!byLink.has(a.id)) byLink.set(a.id, a);
            }
        } else {
            failedFeeds.push(selectedFeedIds[i]);
        }
    });

    const merged = [...byLink.values()]
        .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
        .slice(0, MAX_ARTICLES);

    return { articles: merged, okFeeds, failedFeeds, strategy: preferredStrategy };
}
