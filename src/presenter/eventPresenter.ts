import { waitForEvenAppBridge, OsEventTypeList } from '@evenrealities/even_hub_sdk';
import displayPresenter from './displayPresenter';

// Touchpad gestures reach the app only through the container that has
// isEventCapture:1 (our full-screen text container). Depending on
// device/simulator they arrive in different buckets — sysEvent (simulator) or
// textEvent/listEvent (hardware) — so we read whichever is present.
//
//   single tap → CLICK_EVENT (0, often normalized to undefined) → open/back
//   slide      → SCROLL_TOP_EVENT (1) / SCROLL_BOTTOM_EVENT (2)  → cursor/page
//   double tap → DOUBLE_CLICK_EVENT (3)                          → close the app
export async function eventHandler() {
    const bridge = await waitForEvenAppBridge();

    const unsubscribe = bridge.onEvenHubEvent(async (event) => {
        const bucket = event.sysEvent ?? event.textEvent ?? event.listEvent;
        if (!bucket) return;
        const type = bucket.eventType;

        switch (type) {
            case OsEventTypeList.DOUBLE_CLICK_EVENT:
                console.log('[event] double-tap → closing app');
                await bridge.shutDownPageContainer(1);
                break;
            case OsEventTypeList.SCROLL_TOP_EVENT:
                displayPresenter.onScroll('up');
                break;
            case OsEventTypeList.SCROLL_BOTTOM_EVENT:
                displayPresenter.onScroll('down');
                break;
            case OsEventTypeList.CLICK_EVENT:
            case undefined: // a click is frequently reported as an undefined eventType
                displayPresenter.onTap();
                break;
            default:
                // foreground enter/exit, IMU reports, etc. — ignore
                break;
        }
    });

    return unsubscribe;
}
