// static/js/modules/common/api/dashboard.js
import { showMessage } from '../utils.js';
import { updateApiStatus } from './client.js';

const BASE_URL = '';

/**
 * @AI_NOTE: 지정된 데이터 타입에 대한 DB에 저장된 최소/최대 날짜를 가져옵니다.
 * @param {string} dataType - 날짜를 조회할 데이터 타입 ('dashboardSummary' 또는 'eventLog')
 * @returns {Promise<Object>} 최소/최대 날짜 객체
 */
export async function fetchMinMaxDates(dataType = 'dashboardSummary') {
    const apiName = `minMaxDatesFetch_${dataType}`;
    updateApiStatus(apiName, "apiCallAttempted", true);
    updateApiStatus(apiName, "apiCallSuccess", false);
    updateApiStatus(apiName, "apiResponseCount", 0);
    updateApiStatus(apiName, "error", null);

    try {
        const url = `${BASE_URL}/api/dashboard/min-max-dates`;
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const data = await response.json();
        showMessage('최소/최대 날짜 로드 성공.', 'success');
        updateApiStatus(apiName, "apiCallSuccess", true);
        updateApiStatus(apiName, "apiResponseCount", data ? 1 : 0);
        return data;
    } catch (error) {
        console.error("최소/최대 날짜 로드 실패:", error);
        showMessage('최소/최대 날짜 로드 실패: ' + error.message, 'error');
        updateApiStatus(apiName, "error", error.message);
        throw error;
    }
}

/**
 * @AI_NOTE: 대시보드 요약 데이터를 가져옵니다.
 * @param {string} startDate - 조회 시작 날짜 (YYYY-MM-DD)
 * @param {string} endDate - 조회 종료 날짜 (YYYY-MM-DD)
 * @param {boolean} allData - 전체 데이터 조회 여부
 * @returns {Promise<Array<Object>>} 요약 데이터 배열
 */
export async function fetchDashboardSummary(startDate, endDate, allData) {
    const apiName = "dashboardSummaryFetch";
    updateApiStatus(apiName, "apiCallAttempted", true);
    updateApiStatus(apiName, "apiCallSuccess", false);
    updateApiStatus(apiName, "apiResponseCount", 0);
    updateApiStatus(apiName, "error", null);

    try {
        const params = new URLSearchParams({
            start_date: startDate,
            end_date: endDate,
            all_data: allData
        });
        const url = `${BASE_URL}/api/dashboard/summary?${params.toString()}`;
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const data = await response.json();
        console.log(`[PIPELINE-9] Frontend received data count: ${data.length}`);
        console.log(`[PIPELINE-9.1] Frontend received job_ids: ${data.map(item => item.job_id).join(', ')}`);
        showMessage('대시보드 요약 데이터 로드 성공.', 'success');
        updateApiStatus(apiName, "apiCallSuccess", true);
        updateApiStatus(apiName, "apiResponseCount", data.length);
        return data;
    } catch (error) {
        console.error("대시보드 요약 데이터 로드 실패:", error);
        showMessage('대시보드 요약 데이터 로드 실패: ' + error.message, 'error');
        updateApiStatus(apiName, "error", error.message);
        throw error;
    }
}
