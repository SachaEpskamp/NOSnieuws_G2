// ---- Glasses display (576 × 288 monochrome green, fixed proportional font) ----
export const DISPLAY_WIDTH = 576;
export const DISPLAY_HEIGHT = 288;

// The firmware font is proportional, so these are safe estimates, not exact.
// A full-width line fits roughly 45–50 chars; the screen roughly 10 lines.
export const WRAP_WIDTH = 46;        // article body word-wrap width
export const TITLE_WRAP_WIDTH = 44;  // headlines (leave room for the cursor marker)
export const SCREEN_LINES = 10;      // total rows we render per screen
export const LIST_ROWS = SCREEN_LINES - 1;       // header + 9 headline rows
export const ARTICLE_VIEW_LINES = SCREEN_LINES - 1; // 9 text rows + 1 footer row
export const ARTICLE_SCROLL_LINES = 3;           // lines moved per slide in the reader

// Idle marquee for the selected (too-long) headline in the list.
export const MARQUEE_TICK_MS = 600;       // how often the marquee advances
export const MARQUEE_STEP = 3;            // characters shifted per tick
export const MARQUEE_EDGE_DWELL_TICKS = 3; // pause at the start/end of the title

// ---- Input ----
// Which physical slide direction maps to SCROLL_TOP/BOTTOM is undocumented;
// flip this if scrolling feels inverted on your hardware.
export const INVERT_SCROLL = false;
export const SCROLL_DEBOUNCE_MS = 300;

// ---- Data ----
export const MAX_ARTICLES = 60;          // merged list cap across all feeds
export const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // background re-fetch
export const FETCH_TIMEOUT_MS = 12000;   // per fetch attempt (direct or proxy)

// ---- Storage keys ----
export const STORAGE_SELECTED_FEEDS = 'nos.selectedFeeds';
export const STORAGE_FETCH_STRATEGY = 'nos.fetchStrategy';

// Glyphs known to survive the firmware font.
export const CURSOR_MARKER = '▶ '; // ▶
export const LIST_INDENT = '   ';
