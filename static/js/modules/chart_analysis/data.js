// @DOC_FILE: data.js (chart_analysis)
// @DOC_DESC: 이 파일은 분석 페이지에 필요한 모든 서버 데이터를 가져오고 관리하는 역할을 합니다.
// API 호출을 통해 Job ID 목록, 관리자 설정, 최소/최대 날짜 등을 가져와 캐싱합니다.

import { fetchAllMstList } from '../common/api/mst.js';
import { fetchMinMaxDates } from '../common/api/dashboard.js';
import { fetchAllMngrSett } from '../common/api/mngr_sett.js';
import { showMessage } from '../common/utils.js';

/**
 * @description 모든 Job 마스터 목록을 저장하는 전역 변수 배열입니다.
 * @type {Array<Object>}
 */
export let allJobMstList = [];

/**
 * @description 모든 관리자 설정 데이터를 저장하는 전역 변수 배열입니다.
 * @type {Array<Object>}
 */
export let allMngrSettings = [];

/**
 * @DOC: 서버에서 모든 Job 마스터 목록을 비동기적으로 가져와 `allJobMstList` 변수에 캐싱합니다.
 * @returns {Promise<Array<Object>>} 성공 시 Job 마스터 목록 데이터 배열을, 실패 시 에러를 반환합니다.
 */
export async function loadAllMstList() {
    try {
        allJobMstList = await fetchAllMstList();
        return allJobMstList;
    } catch (error) {
        console.error("Failed to load MST list for analytics:", error);
        showMessage('Job ID 목록 로드 실패: ' + error.message, 'error');
        throw error;
    }
}

/**
 * @DOC: 서버에서 모든 관리자 설정 데이터를 비동기적으로 가져와 `allAdminSettings` 변수에 캐싱합니다.
 * 이 데이터는 차트 색상 등 UI 커스터마이징에 사용됩니다.
 * @returns {Promise<Array<Object>>} 성공 시 관리자 설정 데이터 배열을, 실패 시 에러를 반환합니다.
 */
export async function loadMngrSettings() {
    // 데이터 분석 페이지처럼 컨테이너의 data-is-admin 속성을 사용
    const chartAnalysisContainer = document.querySelector('.container.mx-auto.p-4');
    const isAdmin = chartAnalysisContainer?.dataset?.isAdmin === 'True';

    if (isAdmin) {
        try {
            allMngrSettings = await fetchAllMngrSett();
            return allMngrSettings;
        } catch (error) {
            console.error("Failed to load manager settings for analytics:", error);
            showMessage('관리자 설정 로드 실패: ' + error.message, 'error');
            // 관리자이지만 API 호출에 실패한 경우에도 빈 배열로 초기화하여 오류 방지
            allMngrSettings = [];
            return allMngrSettings;
        }
    } else {
        // 관리자가 아니면 API를 호출하지 않고 빈 배열로 설정
        allMngrSettings = [];
        return allMngrSettings;
    }
}

/**
 * @DOC: tb_con_hist 테이블에서 중복 없는 Job ID 목록을 가져오는 API를 호출합니다.
 * @returns {Promise<Array<Object>>} 성공 시 Job ID 목록 배열을, 실패 시 에러를 반환합니다.
 */
export async function fetchJobIdsFromHist() {
    const res = await fetch('/api/analytics/job_ids');
    if (!res.ok) throw new Error('Job ID 목록 조회 실패');
    return await res.json();
}

/**
 * @DOC: 데이터의 최소/최대 날짜를 서버에서 가져와 지정된 HTML 요소에 표시합니다.
 * @param {HTMLElement} minDateDisplayElement - 최소 날짜를 표시할 HTML 요소.
 * @param {HTMLElement} maxDateDisplayElement - 최대 날짜를 표시할 HTML 요소.
 */
export async function fetchAndDisplayMinMaxDatesAnalytics(minDateDisplayElement, maxDateDisplayElement) {
    try {
        const dates = await fetchMinMaxDates();
        if (minDateDisplayElement && maxDateDisplayElement && dates) {
            minDateDisplayElement.textContent = dates.min_date || 'N/A';
            maxDateDisplayElement.textContent = dates.max_date || 'N/A';
        } else {
            console.error("minDateDisplay or maxDateDisplay element not found, or dates data is null.");
            if(minDateDisplayElement) minDateDisplayElement.textContent = 'Error';
            if(maxDateDisplayElement) maxDateDisplayElement.textContent = 'Error';
        }
    } catch (error) {
        console.error("Failed to fetch min/max dates for analytics:", error);
        if(minDateDisplayElement) minDateDisplayElement.textContent = 'Error';
        if(maxDateDisplayElement) maxDateDisplayElement.textContent = 'Error';
        showMessage('최소/최대 날짜 로드 실패: ' + error.message, 'error');
        throw error;
    }
}
