
export async function init() {

    try {

        await import('../modules/api_key_mngr/data.js');
        await import('../modules/api_key_mngr/core.js');
        await import('../modules/api_key_mngr/table.js');
        await import('../modules/api_key_mngr/chart.js');
        await import('../modules/api_key_mngr/settings.js');
        await import('../modules/api_key_mngr/ui.js');
        

        if (typeof window.ApiKeyMngrUI !== 'undefined' && typeof window.ApiKeyMngrUI.init === 'function') {
            window.ApiKeyMngrUI.init();
        } else {

        }
    } catch (error) {

    }
}