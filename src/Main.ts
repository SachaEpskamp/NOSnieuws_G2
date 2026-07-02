import { enableMobileConsole } from './Scripts/debugConsole';
import { loadPreferredStrategy, refreshNews } from './model/newsModel';
import displayPresenter from './presenter/displayPresenter';
import { eventHandler } from './presenter/eventPresenter';
import phoneView from './view/PhoneView';
import { MARQUEE_TICK_MS, REFRESH_INTERVAL_MS } from './config';
import { feedById } from './feeds';

let refreshInFlight = false;

async function doRefresh() {
    if (refreshInFlight) return;
    refreshInFlight = true;
    phoneView.setBusy(true);

    const selected = phoneView.getSelected();
    try {
        if (selected.length === 0) {
            displayPresenter.setArticles([]);
            displayPresenter.setStatus('Geen feeds geselecteerd.\nKies feeds in de telefoon-app.');
            phoneView.setStatus('Geen feeds geselecteerd — vink er minstens één aan.', true);
            phoneView.showArticles([]);
            return;
        }

        displayPresenter.setStatus('Laden...');
        const result = await refreshNews(selected);

        displayPresenter.setArticles(result.articles);
        phoneView.showArticles(result.articles);

        const time = new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
        if (result.failedFeeds.length === 0) {
            phoneView.setStatus(
                `${result.articles.length} berichten uit ${result.okFeeds.length} feeds · ${time}`
                + (result.strategy && result.strategy !== 'direct' ? ` · via ${result.strategy}` : ''),
            );
        } else {
            const names = result.failedFeeds.map(id => feedById(id)?.label ?? id).join(', ');
            phoneView.setStatus(
                `${result.articles.length} berichten geladen · mislukt: ${names} · ${time}`,
                result.okFeeds.length === 0,
            );
        }

        if (result.articles.length === 0) {
            displayPresenter.setStatus(
                result.okFeeds.length === 0
                    ? 'Nieuws ophalen mislukt.\nControleer de internetverbinding.'
                    : 'Geen berichten gevonden.',
            );
        }
    } catch (e) {
        console.error('[main] refresh failed:', e);
        phoneView.setStatus(`Verversen mislukt: ${e instanceof Error ? e.message : e}`, true);
        displayPresenter.setStatus('Nieuws ophalen mislukt.');
    } finally {
        refreshInFlight = false;
        phoneView.setBusy(false);
    }
}

function scheduleMarqueeTick() {
    // The loop must never die: reschedule in finally, whatever happens.
    setTimeout(() => {
        try {
            displayPresenter.marqueeTick();
        } catch (e) {
            console.error('[main] marquee tick error:', e);
        } finally {
            scheduleMarqueeTick();
        }
    }, MARQUEE_TICK_MS);
}

function scheduleBackgroundRefresh() {
    // The loop must never die: reschedule in finally, whatever happens.
    setTimeout(async () => {
        try {
            await doRefresh();
        } catch (e) {
            console.error('[main] background refresh error:', e);
        } finally {
            scheduleBackgroundRefresh();
        }
    }, REFRESH_INTERVAL_MS);
}

async function main() {
    enableMobileConsole(); // hidden overlay; toggled with the debug button

    // Surface any otherwise-invisible uncaught error/rejection.
    window.addEventListener('error', e => console.error('[uncaught]', e.message, e.error?.stack ?? ''));
    window.addEventListener('unhandledrejection', e => console.error('[unhandledrejection]', e.reason));

    console.log('NOS Nieuws app starting...');

    // Dev hook: lets the browser console / test tooling drive the glasses UI
    // (e.g. __nos.display.onTap()) since there is no touchpad in a browser.
    (window as any).__nos = { display: displayPresenter, refresh: doRefresh };

    // Show something on the glasses right away.
    displayPresenter.render();

    // Phone UI + persisted feed selection.
    await loadPreferredStrategy();
    await phoneView.loadSelection();
    phoneView.init(
        () => { doRefresh(); },  // selection changed
        () => { doRefresh(); },  // refresh button
    );

    // Touchpad gestures (tap / slide / double-tap-to-exit).
    eventHandler();

    // Auto-scroll long selected headlines while idle in the list.
    scheduleMarqueeTick();

    // Initial fetch + periodic background refresh.
    await doRefresh();
    scheduleBackgroundRefresh();
}

main();
