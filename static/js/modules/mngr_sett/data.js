import { getAdminSettings as fetchAdminSettings, getIcons as fetchIcons, refreshAdminSettings, refreshIcons } from '../common/dataManager.js';






export function getAdminSettings(options = {}) {

    return fetchAdminSettings(options);
}


export function getIcons() {

    return fetchIcons();
}


export function refreshAdminSettingsData() {
    return refreshAdminSettings();
}


export function refreshIconsData() {
    return refreshIcons();
}