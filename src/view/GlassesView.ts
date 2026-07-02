/**
 * The one glasses surface: a single full-screen text container, updated
 * in place with textContainerUpgrade (flicker-free). It owns isEventCapture
 * so all touchpad gestures reach the app through it.
 */
import {
    waitForEvenAppBridge,
    EvenAppBridge,
    CreateStartUpPageContainer,
    TextContainerProperty,
    RebuildPageContainer,
    TextContainerUpgrade,
    StartUpPageCreateResult,
} from '@evenrealities/even_hub_sdk';

import { DISPLAY_WIDTH, DISPLAY_HEIGHT } from '../config';

const CONTAINER_ID = 1;
const CONTAINER_NAME = 'nosnews';

let bridge: EvenAppBridge | null = null;
let isPageCreated = false;
let isUpdating = false;
// `null` means "unknown — force a send on the next call" (after create/rebuild).
let lastSentContent: string | null = null;
// If a render comes in while an update is in flight, remember it and send after.
let pendingContent: string | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
    return Promise.race([
        promise.catch(() => fallback),
        new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms)),
    ]);
}

function buildConfig(content: string) {
    return {
        containerTotalNum: 1,
        textObject: [
            new TextContainerProperty({
                xPosition: 0,
                yPosition: 0,
                width: DISPLAY_WIDTH,
                height: DISPLAY_HEIGHT,
                borderWidth: 0,
                borderRadius: 0,
                paddingLength: 4,
                containerID: CONTAINER_ID,
                containerName: CONTAINER_NAME,
                isEventCapture: 1, // required so touchpad taps/slides reach the app
                content,
            }),
        ],
    };
}

/** Push a full screen of text to the glasses; only transmits on change. */
export async function updateGlasses(content: string): Promise<void> {
    if (isUpdating) { pendingContent = content; return; }
    if (content === lastSentContent) return;

    isUpdating = true;
    try {
        if (!bridge) {
            // The native Even App injects `flutter_inappwebview`; without it we
            // are in a plain browser and the bridge will never appear.
            const inEvenApp = !!(window as any).flutter_inappwebview;
            bridge = inEvenApp ? await withTimeout(waitForEvenAppBridge(), 3000, null) : null;
            if (!bridge) {
                // Plain-browser testing: show what the glasses would display.
                console.log('[GlassesView] (no bridge) would display:\n' + content);
                lastSentContent = content;
                return;
            }
        }

        const config = buildConfig(content);

        if (!isPageCreated) {
            const result = await withTimeout(
                bridge.createStartUpPageContainer(new CreateStartUpPageContainer(config)),
                5000,
                StartUpPageCreateResult.invalid,
            );
            console.log('[GlassesView] createStartUpPageContainer:', result);

            if (result === StartUpPageCreateResult.success) {
                isPageCreated = true;
                lastSentContent = content;
            } else if (result === StartUpPageCreateResult.invalid) {
                // A page already exists (e.g. app relaunched). Treat as ready but
                // force a text upgrade next call so the content is in sync.
                isPageCreated = true;
                lastSentContent = null;
            } else {
                console.error('[GlassesView] Fatal container error:', result);
            }
            return;
        }

        const ok = await withTimeout(
            bridge.textContainerUpgrade(new TextContainerUpgrade({
                containerID: CONTAINER_ID,
                containerName: CONTAINER_NAME,
                content,
            })),
            2000,
            false,
        );

        if (ok) {
            lastSentContent = content;
            return;
        }

        // Text upgrade failed — full rebuild so the container is in a known state.
        console.warn('[GlassesView] textContainerUpgrade failed, rebuilding...');
        const rebuilt = await withTimeout(
            bridge.rebuildPageContainer(new RebuildPageContainer(config)),
            5000,
            false,
        );
        if (rebuilt) {
            lastSentContent = content;
            await new Promise(r => setTimeout(r, 200));
        }
    } catch (e) {
        console.error('[GlassesView] update error:', e);
    } finally {
        isUpdating = false;
        if (pendingContent !== null && pendingContent !== lastSentContent) {
            const next = pendingContent;
            pendingContent = null;
            // Fire-and-forget; it guards itself.
            updateGlasses(next);
        } else {
            pendingContent = null;
        }
    }
}
