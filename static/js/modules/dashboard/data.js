



import { fetchAllMstList } from '../common/api/mst.js';
import { getAdminSettings, getIcons, getMstList } from '../common/dataManager.js';
import { setDataFlowStatus } from '../common/api/client.js';
import { showMessage, filterActiveMstData } from '../common/utils.js';


function getUser() {
    const userElement = document.body;
    if (userElement && userElement.dataset.user) {
        try {
            return JSON.parse(userElement.dataset.user);
        } catch (e) {
            return null;
        }
    }
    return null;
}


function isAdmin() {
    const user = getUser();
    return user && user.permissions && user.permissions.includes('admin');
}


let allJobSettings = {};
let iconMap = {};
let allAdminSettings = [];
let dashboardSummaryData = [];


let dataFlowStatus = {
    dashboardSummaryFetch: { apiCallInitiated: false, apiCallSuccess: false, apiResponseCount: 0, dataProcessedCount: 0, chartRendered: false, error: null },
    mstListFetch: { apiCallInitiated: false, apiCallSuccess: false, apiResponseCount: 0, dataProcessedCount: 0, error: null },
    adminSettingsFetch: { apiCallInitiated: false, apiCallSuccess: false, apiResponseCount: 0, dataProcessedCount: 0, error: null },
    iconsFetch: { apiCallInitiated: false, apiCallSuccess: false, apiResponseCount: 0, dataProcessedCount: 0, error: null },
    minMaxDatesFetch: { apiCallInitiated: false, apiCallSuccess: false, apiResponseCount: 0, dataProcessedCount: 0, error: null },
    overallStatus: "idle"
};


setDataFlowStatus(dataFlowStatus);


async function loadAllAdminSettings() {


    if (dataFlowStatus.adminSettingsFetch.apiCallInitiated) return;
    
    if (!isAdmin()) {
        return;
    }
    dataFlowStatus.adminSettingsFetch.apiCallInitiated = true;
    try {
        const settings = await getAdminSettings();
        allAdminSettings = settings;
        allJobSettings = {};
        settings.forEach(setting => {
            allJobSettings[setting.cd] = setting;
        });
        dataFlowStatus.adminSettingsFetch.apiCallSuccess = true;
        dataFlowStatus.adminSettingsFetch.apiResponseCount = settings.length;
        dataFlowStatus.adminSettingsFetch.dataProcessedCount = Object.keys(allJobSettings).length;
    } catch (error) {
        dataFlowStatus.adminSettingsFetch.error = error.message;
        showMessage('관리자 설정 로드 실패: ' + error.message, 'error');
        throw error;
    }
}


async function loadAllIcons() {


    if (dataFlowStatus.iconsFetch.apiCallInitiated) return;
    
    if (!isAdmin()) {
        return;
    }
    dataFlowStatus.iconsFetch.apiCallInitiated = true;
    try {
        const icons = await getIcons();
        iconMap = {};
        icons.forEach(icon => {
            iconMap[icon.icon_id] = icon.icon_code;
        });
        dataFlowStatus.iconsFetch.apiCallSuccess = true;
        dataFlowStatus.iconsFetch.apiResponseCount = icons.length;
        dataFlowStatus.iconsFetch.dataProcessedCount = Object.keys(iconMap).length;
    } catch (error) {
        dataFlowStatus.iconsFetch.error = error.message;
        showMessage('아이콘 로드 실패: ' + error.message, 'error');
        throw error;
    }
}


async function loadAllMstList() {
    dataFlowStatus.mstListFetch.apiCallInitiated = true;
    try {
        const mstList = await getMstList();

        const activeMstList = filterActiveMstData(mstList);
        
        dataFlowStatus.mstListFetch.apiCallSuccess = true;
        dataFlowStatus.mstListFetch.apiResponseCount = activeMstList.length;
        dataFlowStatus.mstListFetch.dataProcessedCount = activeMstList.length;
        
        return activeMstList;
    } catch (error) {
        dataFlowStatus.mstListFetch.error = error.message;
        showMessage('Job ID 목록 로드 실패: ' + error.message, 'error');
        throw error;
    }
}


export async function initializeDashboardData() {


    await Promise.all([
        loadAllMstList()
    ]);
}


export function getJobSettings() {
    return allJobSettings;
}


export function getIconMap() {
    return iconMap;
}


export function getAllAdminSettings() {
    return allAdminSettings;
}


export function setDashboardSummaryData(data) {
    dashboardSummaryData = data;
}


export function getDashboardSummaryData() {
    return dashboardSummaryData;
}


export function getDataFlowStatus() {
    return dataFlowStatus;
}
