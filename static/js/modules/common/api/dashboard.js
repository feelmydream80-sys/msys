
import { showMessage } from '../utils.js';
import { updateApiStatus } from './client.js';

const BASE_URL = '';


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

        showMessage('최소/최대 날짜 로드 실패: ' + error.message, 'error');
        updateApiStatus(apiName, "error", error.message);
        throw error;
    }
}


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


        showMessage('대시보드 요약 데이터 로드 성공.', 'success');
        updateApiStatus(apiName, "apiCallSuccess", true);
        updateApiStatus(apiName, "apiResponseCount", data.length);
        return data;
    } catch (error) {

        showMessage('대시보드 요약 데이터 로드 실패: ' + error.message, 'error');
        updateApiStatus(apiName, "error", error.message);
        throw error;
    }
}
