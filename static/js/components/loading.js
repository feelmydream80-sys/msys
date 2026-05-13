let currentController = null;

let overlay = null;
let messageEl = null;

function getElements() {
    if (!overlay) overlay = document.getElementById('global-loading');
    if (!messageEl) messageEl = document.getElementById('loading-message');
    return { overlay, messageEl };
}

export function showLoading(message) {
    const els = getElements();
    if (!els.overlay) return;
    currentController = new AbortController();
    if (els.messageEl) els.messageEl.textContent = message || '데이터 로딩 중...';
    els.overlay.classList.remove('hidden');
}

export function hideLoading() {
    const els = getElements();
    if (!els.overlay) return;
    els.overlay.classList.add('hidden');
    currentController = null;
}

export function getAbortSignal() {
    return currentController ? currentController.signal : null;
}

export function withLoading(promise, message) {
    showLoading(message);
    return promise.finally(() => hideLoading());
}

export function abortAll() {
    if (currentController) {
        currentController.abort();
        currentController = null;
    }
}

export function dispose() {
    abortAll();
    hideLoading();
}

export default { showLoading, hideLoading, getAbortSignal, withLoading, abortAll, dispose };
