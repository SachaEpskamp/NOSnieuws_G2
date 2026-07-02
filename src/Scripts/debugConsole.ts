/**
 * On-phone console overlay: mirrors console.log/error into a fixed div so
 * problems are visible on-device (there is no remote console in the Even app).
 * Hidden by default; toggled from the phone UI.
 */
let consoleDiv: HTMLDivElement | null = null;

export function enableMobileConsole() {
    if (consoleDiv) return;
    consoleDiv = document.createElement('div');
    consoleDiv.style.position = 'fixed';
    consoleDiv.style.bottom = '0';
    consoleDiv.style.left = '0';
    consoleDiv.style.width = '100%';
    consoleDiv.style.height = '40vh';
    consoleDiv.style.backgroundColor = 'rgba(0,0,0,0.75)';
    consoleDiv.style.color = '#0f0';
    consoleDiv.style.overflowY = 'scroll';
    consoleDiv.style.fontFamily = 'monospace';
    consoleDiv.style.fontSize = '12px';
    consoleDiv.style.zIndex = '9999';
    consoleDiv.style.padding = '5px';
    consoleDiv.style.pointerEvents = 'none'; // click through
    consoleDiv.style.display = 'none';
    document.body.appendChild(consoleDiv);

    const logToScreen = (message: any, color: string = '#0f0') => {
        if (!consoleDiv) return;
        if (String(message).includes('Flutter Bridge')) return;
        const line = document.createElement('div');
        line.style.color = color;
        line.style.borderBottom = '1px solid #333';
        if (message instanceof Error) {
            line.textContent = `${message.name}: ${message.message}\n${message.stack || ''}`;
        } else if (typeof message === 'object') {
            try { line.textContent = JSON.stringify(message); } catch { line.textContent = String(message); }
        } else {
            line.textContent = String(message);
        }
        consoleDiv.appendChild(line);
        // Keep the overlay bounded.
        while (consoleDiv.childNodes.length > 300) consoleDiv.removeChild(consoleDiv.firstChild!);
        consoleDiv.scrollTop = consoleDiv.scrollHeight;
    };

    const originalLog = console.log;
    console.log = (...args) => { originalLog(...args); args.forEach(a => logToScreen(a)); };
    const originalWarn = console.warn;
    console.warn = (...args) => { originalWarn(...args); args.forEach(a => logToScreen(a, '#ff0')); };
    const originalError = console.error;
    console.error = (...args) => { originalError(...args); args.forEach(a => logToScreen(a, '#f00')); };

    console.log('Mobile console enabled.');
}

export function toggleMobileConsole(): boolean {
    enableMobileConsole();
    if (!consoleDiv) return false;
    const visible = consoleDiv.style.display !== 'none';
    consoleDiv.style.display = visible ? 'none' : 'block';
    return !visible;
}
