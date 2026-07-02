/**
 * Key/value storage that prefers the Even App bridge (values persist inside
 * the Even app, shared across sessions by package id) but transparently falls
 * back to the browser's localStorage — and never throws or hangs.
 */
import { EvenAppBridge } from '@evenrealities/even_hub_sdk';

const BRIDGE_TIMEOUT_MS = 1200;

// The native Even App injects `flutter_inappwebview`. If it's missing we're in
// a plain browser, so skip the bridge entirely and just use localStorage.
let bridgeUsable =
    typeof window !== 'undefined' && !!(window as any).flutter_inappwebview;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
        p,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('bridge timeout')), ms)),
    ]);
}

function localSet(key: string, value: string) {
    try { window.localStorage.setItem(key, value); } catch { /* storage disabled */ }
}
function localGet(key: string): string | null {
    try { return window.localStorage.getItem(key); } catch { return null; }
}

export const storage = {
    setItem: async (key: string, value: string): Promise<void> => {
        // Always mirror to localStorage so a value is never lost.
        localSet(key, value);
        if (!bridgeUsable) return;
        try {
            const bridge = EvenAppBridge.getInstance();
            await withTimeout(Promise.resolve(bridge.setLocalStorage(key, value)), BRIDGE_TIMEOUT_MS);
        } catch (e) {
            bridgeUsable = false;
            console.warn(`[storage] bridge unavailable, using localStorage for "${key}"`, e);
        }
    },

    getItem: async (key: string): Promise<string | null> => {
        if (bridgeUsable) {
            try {
                const bridge = EvenAppBridge.getInstance();
                const v = await withTimeout(Promise.resolve(bridge.getLocalStorage(key)), BRIDGE_TIMEOUT_MS);
                if (v !== undefined && v !== null && v !== '') return v;
            } catch (e) {
                bridgeUsable = false;
                console.warn(`[storage] bridge unavailable, using localStorage for "${key}"`, e);
            }
        }
        return localGet(key);
    },
};
