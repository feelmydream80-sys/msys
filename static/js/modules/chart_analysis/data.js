



import { fetchAllMstList } from '../common/api/mst.js';
import { fetchMinMaxDates } from '../common/api/dashboard.js';
import { fetchAllMngrSett } from '../common/api/mngr_sett.js';
import { showMessage, filterActiveMstData, filterValidJobs } from '../common/utils.js';


export let allJobMstList = [];


export let allMngrSettings = [];


export async function loadAllMstList() {
    try {
        allJobMstList = await fetchAllMstList();

        allJobMstList = filterValidJobs(filterActiveMstData(allJobMstList));
        return allJobMstList;
    } catch (error) {

        showMessage('Job ID 목록 로드 실패: ' + error.message, 'error');
        throw error;
    }
}


export async function loadMngrSettings() {

    const chartAnalysisContainer = document.querySelector('.container.mx-auto.p-4');
    const isAdmin = chartAnalysisContainer?.dataset?.isAdmin === 'True';

    if (isAdmin) {
        try {
            allMngrSettings = await fetchAllMngrSett();
            return allMngrSettings;
        } catch (error) {

            showMessage('관리자 설정 로드 실패: ' + error.message, 'error');

            allMngrSettings = [];
            return allMngrSettings;
        }
    } else {

        allMngrSettings = [];
        return allMngrSettings;
    }
}


export async function fetchJobIdsFromHist() {
    const res = await fetch('/api/analytics/job_ids');
    if (!res.ok) throw new Error('Job ID 목록 조회 실패');
    return await res.json();
}


export async function fetchAndDisplayMinMaxDatesAnalytics(minDateDisplayElement, maxDateDisplayElement) {
    try {
        const dates = await fetchMinMaxDates();
        if (minDateDisplayElement && maxDateDisplayElement && dates) {
            minDateDisplayElement.textContent = dates.min_date || 'N/A';
            maxDateDisplayElement.textContent = dates.max_date || 'N/A';
        } else {

            if(minDateDisplayElement) minDateDisplayElement.textContent = 'Error';
            if(maxDateDisplayElement) maxDateDisplayElement.textContent = 'Error';
        }
    } catch (error) {

        if(minDateDisplayElement) minDateDisplayElement.textContent = 'Error';
        if(maxDateDisplayElement) maxDateDisplayElement.textContent = 'Error';
        showMessage('최소/최대 날짜 로드 실패: ' + error.message, 'error');
        throw error;
    }
}
