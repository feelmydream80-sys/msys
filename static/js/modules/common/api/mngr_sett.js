
import { showMessage } from '../utils.js';
import { updateApiStatus } from './client.js';

const BASE_URL = '';


export async function fetchAllMngrSett(options = {}) {
    const { page = 1, perPage = 10, searchTerm = null } = options;

    const apiName = "mngrSettFetch";
    updateApiStatus(apiName, "apiCallAttempted", true);
    updateApiStatus(apiName, "apiCallSuccess", false);
    updateApiStatus(apiName, "apiResponseCount", 0);
    updateApiStatus(apiName, "error", null);

    try {

        const params = new URLSearchParams();
        params.append('page', page);
        params.append('per_page', perPage);
        if (searchTerm) {
            params.append('search_term', searchTerm);
        }
        
        const url = `${BASE_URL}/api/mngr_sett/settings/all?${params.toString()}`;

        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const data = await response.json();

        showMessage('관리자 설정 데이터 로드 성공.', 'success');
        updateApiStatus(apiName, "apiCallSuccess", true);
        

        if (data.data && Array.isArray(data.data)) {
            updateApiStatus(apiName, "apiResponseCount", data.data.length);
            return data;
        } else {

            updateApiStatus(apiName, "apiResponseCount", data.length);
            return { data, total: data.length, page: 1, per_page: data.length, total_pages: 1 };
        }
    } catch (error) {

        showMessage('관리자 설정 데이터 로드 실패: ' + error.message, 'error');
        updateApiStatus(apiName, "error", error.message);
        throw error;
    }
}


export async function fetchAllIcons() {

    const apiName = "iconsFetch";
    updateApiStatus(apiName, "apiCallAttempted", true);
    updateApiStatus(apiName, "apiCallSuccess", false);
    updateApiStatus(apiName, "apiResponseCount", 0);
    updateApiStatus(apiName, "error", null);

    try {
        const url = `${BASE_URL}/api/mngr_sett/icons/all`;

        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const data = await response.json();

        showMessage('아이콘 데이터 로드 성공.', 'success');
        updateApiStatus(apiName, "apiCallSuccess", true);
        updateApiStatus(apiName, "apiResponseCount", data.length);
        return data;
    } catch (error) {

        showMessage('아이콘 데이터 로드 실패: ' + error.message, 'error');
        updateApiStatus(apiName, "error", error.message);
        throw error;
    }
}


export async function saveAllSettingsApi(settingsData) {
    const apiName = "adminSettingsUpdate";
    updateApiStatus(apiName, "apiCallInitiated", true);
    updateApiStatus(apiName, "apiCallSuccess", false);
    updateApiStatus(apiName, "error", null);
    try {
        const response = await fetch(`${BASE_URL}/api/mngr_sett/settings/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settingsData),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const result = await response.json();
        showMessage('관리자 설정 저장 성공.', 'success');
        updateApiStatus(apiName, "apiCallSuccess", true);
        return result;
    } catch (error) {

        showMessage(`관리자 설정 저장 실패: ${error.message}`, 'error');
        updateApiStatus(apiName, "error", error.message);
        throw error;
    }
}


export async function saveIconApi(iconData) {
    const apiName = "iconUpdate";
    updateApiStatus(apiName, "apiCallInitiated", true);
    updateApiStatus(apiName, "apiCallSuccess", false);
    updateApiStatus(apiName, "error", null);
    try {
        const response = await fetch(`${BASE_URL}/api/mngr_sett/icons/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(iconData),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const result = await response.json();
        showMessage('아이콘 저장 성공.', 'success');
        updateApiStatus(apiName, "apiCallSuccess", true);
        return result;
    } catch (error) {

        showMessage(`아이콘 저장 실패: ${error.message}`, 'error');
        updateApiStatus(apiName, "error", error.message);
        throw error;
    }
}


export async function deleteIconApi(iconId) {
    const apiName = "iconDelete";
    updateApiStatus(apiName, "apiCallInitiated", true);
    updateApiStatus(apiName, "apiCallSuccess", false);
    updateApiStatus(apiName, "error", null);
    try {
        const response = await fetch(`${BASE_URL}/api/mngr_sett/icons/delete/${iconId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const result = await response.json();
        showMessage('아이콘 삭제 성공.', 'success');
        updateApiStatus(apiName, "apiCallSuccess", true);
        return result;
    } catch (error) {

        showMessage(`아이콘 삭제 실패: ${error.message}`, 'error');
        updateApiStatus(apiName, "error", error.message);
        throw error;
    }
}


export async function toggleIconDisplayApi(iconId, displayYn) {
    const apiName = "iconToggleDisplay";
    updateApiStatus(apiName, "apiCallInitiated", true);
    updateApiStatus(apiName, "apiCallSuccess", false);
    updateApiStatus(apiName, "error", null);
    try {
        const response = await fetch(`${BASE_URL}/api/mngr_sett/icons/toggle-display`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ icon_id: iconId, display_yn: displayYn }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const result = await response.json();
        showMessage('아이콘 표시 여부 업데이트 성공.', 'success');
        updateApiStatus(apiName, "apiCallSuccess", true);
        return result;
    } catch (error) {

        showMessage(`아이콘 표시 여부 업데이트 실패: ${error.message}`, 'error');
        updateApiStatus(apiName, "error", error.message);
        throw error;
    }
}


export async function exportSettingsApi() {
    try {
        const response = await fetch(`${BASE_URL}/api/mngr_sett/settings/export`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'admin_settings.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showMessage('설정 내보내기 성공.', 'success');
    } catch (error) {

        showMessage(`설정 내보내기 실패: ${error.message}`, 'error');
        throw error;
    }
}


export async function importSettingsApi(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${BASE_URL}/api/mngr_sett/settings/import`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const result = await response.json();
        showMessage('설정 가져오기 성공.', 'success');
        return result;
    } catch (error) {

        showMessage(`설정 가져오기 실패: ${error.message}`, 'error');
        throw error;
    }
}


export async function exportIconsApi() {
    try {
        const response = await fetch(`${BASE_URL}/api/mngr_sett/icons/export`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'icons.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showMessage('아이콘 내보내기 성공.', 'success');
    } catch (error) {

        showMessage(`아이콘 내보내기 실패: ${error.message}`, 'error');
        throw error;
    }
}


export async function importIconsApi(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${BASE_URL}/api/mngr_sett/icons/import`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const result = await response.json();
        showMessage('아이콘 가져오기 성공.', 'success');
        return result;
    } catch (error) {

        showMessage(`아이콘 가져오기 실패: ${error.message}`, 'error');
        throw error;
    }
}


export async function syncSettingsApi() {
    const apiName = "settingsSync";
    updateApiStatus(apiName, "apiCallInitiated", true);
    updateApiStatus(apiName, "apiCallSuccess", false);
    updateApiStatus(apiName, "error", null);
    try {
        const response = await fetch(`${BASE_URL}/api/mngr_sett/settings/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const result = await response.json();
        showMessage(result.message, 'success');
        updateApiStatus(apiName, "apiCallSuccess", true);
        return result;
    } catch (error) {

        showMessage(`설정 동기화 실패: ${error.message}`, 'error');
        updateApiStatus(apiName, "error", error.message);
        throw error;
    }
}
