
import { showMessage } from './utils.js';
import { fetchAllMngrSett, fetchAllIcons } from './api/mngr_sett.js';
import { fetchAllMstList } from './api/mst.js';




const dataCache = {
    adminSettings: null,
    icons: null,
    mstList: null
};


const loadingStatus = {
    adminSettings: false,
    icons: false,
    mstList: false
};


let loadingPromises = {
    adminSettings: null,
    icons: null,
    mstList: null
};


export async function getAdminSettings(options = {}) {
    const { page = 1, perPage = 10, searchTerm = null, bypassCache = false } = options;


    const shouldBypassCache = bypassCache || searchTerm !== null || page !== 1 || perPage !== 10;
    

    if (!shouldBypassCache && loadingPromises.adminSettings) {

        return loadingPromises.adminSettings;
    }
    

    if (!shouldBypassCache && dataCache.adminSettings) {


        return JSON.parse(JSON.stringify(dataCache.adminSettings));
    }
    

    loadingStatus.adminSettings = true;
    


    loadingPromises.adminSettings = fetchAllMngrSett({ page, perPage, searchTerm })
        .then(data => {



            if (!searchTerm) {
                dataCache.adminSettings = JSON.parse(JSON.stringify(data));
            }
            return JSON.parse(JSON.stringify(data));
        })
        .catch(error => {

            showMessage('관리자 설정 로드 실패: ' + error.message, 'error');
            throw error;
        })
        .finally(() => {
            loadingStatus.adminSettings = false;
            loadingPromises.adminSettings = null;
        });
    
    return loadingPromises.adminSettings;
}


export async function getIcons() {


    if (loadingPromises.icons) {

        return loadingPromises.icons;
    }
    

    if (dataCache.icons) {


        return JSON.parse(JSON.stringify(dataCache.icons));
    }
    

    loadingStatus.icons = true;
    


    loadingPromises.icons = fetchAllIcons()
        .then(data => {


            dataCache.icons = JSON.parse(JSON.stringify(data));
            return JSON.parse(JSON.stringify(dataCache.icons));
        })
        .catch(error => {

            showMessage('아이콘 목록 로드 실패: ' + error.message, 'error');
            throw error;
        })
        .finally(() => {
            loadingStatus.icons = false;
            loadingPromises.icons = null;
        });
    
    return loadingPromises.icons;
}


export async function getMstList() {

    if (loadingPromises.mstList) {
        return loadingPromises.mstList;
    }
    

    if (dataCache.mstList) {
        return JSON.parse(JSON.stringify(dataCache.mstList));
    }
    

    loadingStatus.mstList = true;
    

    loadingPromises.mstList = fetchAllMstList()
        .then(data => {
            dataCache.mstList = JSON.parse(JSON.stringify(data));
            return JSON.parse(JSON.stringify(dataCache.mstList));
        })
        .catch(error => {

            showMessage('MST 목록 로드 실패: ' + error.message, 'error');
            throw error;
        })
        .finally(() => {
            loadingStatus.mstList = false;
            loadingPromises.mstList = null;
        });
    
    return loadingPromises.mstList;
}


export async function loadCommonData(dataTypes = ['adminSettings', 'icons', 'mstList']) {
    const promises = [];
    const result = {};
    
    if (dataTypes.includes('adminSettings')) {
        promises.push(getAdminSettings().then(data => { result.adminSettings = data; }));
    }
    
    if (dataTypes.includes('icons')) {
        promises.push(getIcons().then(data => { result.icons = data; }));
    }
    
    if (dataTypes.includes('mstList')) {
        promises.push(getMstList().then(data => { result.mstList = data; }));
    }
    
    await Promise.all(promises);
    return result;
}


export async function refreshAdminSettings() {
    dataCache.adminSettings = null;
    return getAdminSettings();
}


export async function refreshIcons() {
    dataCache.icons = null;
    return getIcons();
}


export async function refreshMstList() {
    dataCache.mstList = null;
    return getMstList();
}


export async function refreshAllData() {
    dataCache.adminSettings = null;
    dataCache.icons = null;
    dataCache.mstList = null;
    
    return loadCommonData();
}


export function getLoadingStatus() {
    return { ...loadingStatus };
}


export function getCacheStatus() {
    return {
        adminSettings: !!dataCache.adminSettings,
        icons: !!dataCache.icons,
        mstList: !!dataCache.mstList
    };
}