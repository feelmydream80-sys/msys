
import { showToast } from '../../utils/toast.js';
import { showConfirm } from '../common/utils.js';
import { saveAllSettingsApi, saveIconApi, deleteIconApi, toggleIconDisplayApi, exportSettingsApi, importSettingsApi, exportIconsApi, importIconsApi, syncSettingsApi } from '../common/api/mngr_sett.js';
import { getAdminSettings, getIcons, refreshIconsData, refreshAdminSettingsData } from './data.js';
import { renderSettingsTable, renderIconTable, populateIconSelects, hideIconForm, displayIconForm } from './ui.js';


export async function syncSettings() {
    showToast('설정 동기화 중...', 'info');
    try {
        const result = await syncSettingsApi();
        showToast(result.message, 'success');

        const [allMngrSettResult, allIcons] = await Promise.all([refreshAdminSettingsData(), refreshIconsData()]);
        const allMngrSett = Array.isArray(allMngrSettResult) ? allMngrSettResult : (allMngrSettResult.data || []);
        renderSettingsTable(allMngrSett, allIcons);
        populateIconSelects(allIcons);
    } catch (error) {
        showToast('설정 동기화 실패: ' + error.message, 'error');
    }
}






export async function saveBasicSettings() {
    const container = document.getElementById('mngr_sett_page');
    if (!container) return;
    const settingsTableBody = container.querySelector('#settingsTableBody');

    const settingsMap = new Map();
    if (settingsTableBody) {
        settingsTableBody.querySelectorAll('tr').forEach(row => {
        const cd = row.dataset.cd;
        if (!cd) {

            return;
        }
        const setting = { cd: cd };
        row.querySelectorAll('[data-field]').forEach(input => {
            const field = input.dataset.field;
            if (input.type === 'checkbox') {
                setting[field] = input.checked ? 'Y' : 'N';
            } else if (input.type === 'number') {
                setting[field] = parseFloat(input.value) || 0;
            } else if (input.tagName === 'SELECT' && field.includes('icon')) {
                setting[field] = input.value ? parseInt(input.value) : null;
            } else {
                setting[field] = input.value;
            }
        });
        settingsMap.set(cd, setting);
        });
    }

    const settingsToSave = Array.from(settingsMap.values());
    const payload = { mngr_settings: settingsToSave };

    try {
        if (settingsToSave.some(s => !s.cd)) {
            throw new Error("Job ID(cd)가 비어있는 항목이 있어 저장할 수 없습니다.");
        }
        await saveAllSettingsApi(payload);
        showToast('기본 설정이 성공적으로 저장되었습니다.', 'success');
    } catch (error) {
        showToast('기본 설정 저장 실패: ' + error.message, 'error');
    }
}


export async function saveChartSettings() {
    const container = document.getElementById('mngr_sett_page');
    if (!container) return;
    const chartSettingsTableBody = container.querySelector('#chartSettingsTableBody');

    const settingsMap = new Map();
    if (chartSettingsTableBody) {
        chartSettingsTableBody.querySelectorAll('tr').forEach(row => {
        const cd = row.dataset.cd;
        if (!cd) return;
        const setting = { cd: cd };
        row.querySelectorAll('[data-field]').forEach(input => {
            const field = input.dataset.field;
            if (field !== 'cd_nm') {
                setting[field] = input.value;
            }
        });
        settingsMap.set(cd, setting);
        });
    }

    const settingsToSave = Array.from(settingsMap.values());
    const payload = { mngr_settings: settingsToSave };

    try {
        if (settingsToSave.some(s => !s.cd)) {
            throw new Error("Job ID(cd)가 비어있는 항목이 있어 저장할 수 없습니다.");
        }
        await saveAllSettingsApi(payload);
        showToast('차트 설정이 성공적으로 저장되었습니다.', 'success');
    } catch (error) {
        showToast('차트 설정 저장 실패: ' + error.message, 'error');
    }
}


export async function exportSettings() {
    try {
        await exportSettingsApi();
        showToast('설정을 성공적으로 내보냈습니다.', 'success');
    } catch (error) {

        showToast('설정 내보내기 실패: ' + error.message, 'error');
    }
};


export async function importSettings() {
    const container = document.getElementById('mngr_sett_page');
    if (!container) return;
    const importFileInput = container.querySelector('#importFile');

    const file = importFileInput ? importFileInput.files[0] : null;
    if (!file) {
        showToast('가져올 JSON 파일을 선택해주세요.', 'warning');
        return;
    }

    try {
        await importSettingsApi(file);
        showToast('설정이 성공적으로 가져오기되었습니다.', 'success');
        const [allMngrSettResult, allIcons] = await Promise.all([getAdminSettings(), getIcons()]);

        const allMngrSett = Array.isArray(allMngrSettResult) ? allMngrSettResult : (allMngrSettResult.data || []);
        renderSettingsTable(allMngrSett, allIcons);
        populateIconSelects(allIcons);
        if (typeof window.renderJobCheckboxes === 'function') {
            window.renderJobCheckboxes();
        }
    } catch (error) {
        showToast('설정 가져오기 실패: ' + error.message, 'error');
    }
};


export function initializeIconManagementUI() {
    const container = document.getElementById('mngr_sett_page');
    if (!container) return;
    container.querySelector('#addIconBtn')?.addEventListener('click', () => displayIconForm());
    container.querySelector('#saveIconBtn')?.addEventListener('click', saveIcon);
    container.querySelector('#cancelIconEditBtn')?.addEventListener('click', hideIconForm);
}


export async function saveIcon() {
    const container = document.getElementById('mngr_sett_page');
    if (!container) return;

    const iconData = {
        ICON_ID: container.querySelector('#iconId').value ? parseInt(container.querySelector('#iconId').value) : null,
        ICON_CD: container.querySelector('#iconCode').value,
        ICON_NM: container.querySelector('#iconName').value,
        ICON_EXPL: container.querySelector('#iconDescription').value,
        ICON_DSP_YN: container.querySelector('#iconDisplayYn').value === 'Y' ? true : false
    };

    if (!iconData.ICON_CD || !iconData.ICON_NM) {
        showToast('아이콘 코드와 이름은 필수 항목입니다.', 'warning');
        return;
    }

    try {
        await saveIconApi(iconData);
        showToast('아이콘이 성공적으로 저장되었습니다.', 'success');
        hideIconForm();
        const allIcons = await refreshIconsData();
        renderIconTable(allIcons);
        populateIconSelects(allIcons);
    } catch (error) {
        showToast('아이콘 저장 실패: ' + error.message, 'error');
    }
}


export async function confirmAndDeleteIcon(iconId) {
    const container = document.getElementById('mngr_sett_page');
    if (!container) return;

    showConfirm('정말로 이 아이콘을 삭제하시겠습니까?', async () => {
        try {
            await deleteIconApi(iconId);
            showToast('아이콘이 성공적으로 삭제되었습니다.', 'success');
            const allIcons = await refreshIconsData();
            renderIconTable(allIcons);
            populateIconSelects(allIcons);
        } catch (error) {
            showToast('아이콘 삭제 실팴: ' + error.message, 'error');
        }
    });
}


export async function toggleIconDisplayStatus(event) {
    const iconId = parseInt(event.target.dataset.iconId);
    const displayYn = event.target.checked ? true : false;
    try {
        await toggleIconDisplayApi(iconId, displayYn);
        showToast('아이콘 표시 여부가 업데이트되었습니다.', 'success');
        const allIcons = await refreshIconsData();
        populateIconSelects(allIcons);
    } catch (error) {

        showToast('아이콘 표시 여부 업데이트 실패: ' + error.message, 'error');
        event.target.checked = !displayYn;
    }
}


export async function exportIcons() {
    try {
        await exportIconsApi();
        showToast('아이콘을 성공적으로 내보냈습니다.', 'success');
    } catch (error) {

        showToast('아이콘 내보내기 실패: ' + error.message, 'error');
    }
};


export async function importIcons() {
    const container = document.getElementById('mngr_sett_page');
    if (!container) return;
    const importIconsFile = container.querySelector('#importIconsFile');

    const file = importIconsFile ? importIconsFile.files[0] : null;
    if (!file) {
        showToast('가져올 CSV 파일을 선택해주세요.', 'warning');
        return;
    }

    try {
        await importIconsApi(file);
        showToast('아이콘이 성공적으로 가져오기되었습니다.', 'success');
        const allIcons = await refreshIconsData();
        renderIconTable(allIcons);
        populateIconSelects(allIcons);
    } catch (error) {
        showToast('아이콘 가져오기 실패: ' + error.message, 'error');
    }
};


async function loadAllMngrSettAndIcons() {
    const allMngrSett = await getAdminSettings();
    const allIcons = await getIcons();
    return { allMngrSett, allIcons };
}
