
import { showMessage } from '../utils.js';
import { updateApiStatus } from './client.js';

const BASE_URL = '';


export async function fetchSuccessRateTrendByJob(startDate, endDate, jobIds) {
    const apiName = "successRateTrendFetch";
    updateApiStatus(apiName, "apiCallAttempted", true);
    updateApiStatus(apiName, "apiCallSuccess", false);
    updateApiStatus(apiName, "apiResponseCount", 0);
    updateApiStatus(apiName, "error", null);

    try {
        const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
        (jobIds || []).filter(id => id).forEach(id => params.append('job_ids', id));
        const url = `${BASE_URL}/api/success_rate_trend?${params.toString()}`;
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const data = await response.json();
        showMessage('수집 성공률 데이터 로드 성공.', 'success');
        updateApiStatus(apiName, "apiCallSuccess", true);
        updateApiStatus(apiName, "apiResponseCount", data.length);
        return data;
    } catch (error) {

        showMessage('수집 성공률 데이터 로드 실패: ' + error.message, 'error');
        updateApiStatus(apiName, "error", error.message);
        throw error;
    }
}


export async function fetchTroubleHourlyByStatusData(startDate, endDate, jobIds) {
    const apiName = "troubleDataFetch";
    updateApiStatus(apiName, "apiCallAttempted", true);
    updateApiStatus(apiName, "apiCallSuccess", false);
    updateApiStatus(apiName, "apiResponseCount", 0);
    updateApiStatus(apiName, "error", null);

    try {
        const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
        (jobIds || []).filter(id => id).forEach(id => params.append('job_ids', id));
        const url = `${BASE_URL}/api/trouble/hourly/by-status?${params.toString()}`;
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const data = await response.json();
        showMessage('장애 코드 데이터 로드 성공.', 'success');
        updateApiStatus(apiName, "apiCallSuccess", true);
        updateApiStatus(apiName, "apiResponseCount", data.length);
        return data;
    } catch (error) {

        showMessage('장애 코드 데이터 로드 실패: ' + error.message, 'error');
        updateApiStatus(apiName, "error", error.message);
        throw error;
    }
}


export async function fetchAnalyticsSuccessRateTrend(startDate, endDate, jobIds) {
    const apiName = "analyticsSuccessRateTrendFetch";
    updateApiStatus(apiName, "apiCallAttempted", true);
    updateApiStatus(apiName, "apiCallSuccess", false);
    updateApiStatus(apiName, "apiResponseCount", 0);
    updateApiStatus(apiName, "error", null);

    try {
        const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
        (jobIds || []).filter(id => id).forEach(id => params.append('job_ids', id));
        const url = `${BASE_URL}/api/analytics/success_rate_trend?${params.toString()}`;
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const data = await response.json();
        showMessage('분석 수집 성공률 데이터 로드 성공.', 'success');
        updateApiStatus(apiName, "apiCallSuccess", true);
        updateApiStatus(apiName, "apiResponseCount", data.length);
        return data;
    } catch (error) {

        showMessage('분석 수집 성공률 데이터 로드 실패: ' + error.message, 'error');
        updateApiStatus(apiName, "error", error.message);
        throw error;
    }
}


export async function fetchAnalyticsTroubleByCode(startDate, endDate, jobIds) {
    const apiName = "analyticsTroubleDataFetch";
    updateApiStatus(apiName, "apiCallAttempted", true);
    updateApiStatus(apiName, "apiCallSuccess", false);
    updateApiStatus(apiName, "apiResponseCount", 0);
    updateApiStatus(apiName, "error", null);

    try {
        const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
        (jobIds || []).filter(id => id).forEach(id => params.append('job_ids', id));
        const url = `${BASE_URL}/api/analytics/trouble_by_code?${params.toString()}`;
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const data = await response.json();
        showMessage('분석 장애 코드 데이터 로드 성공.', 'success');
        updateApiStatus(apiName, "apiCallSuccess", true);
        updateApiStatus(apiName, "apiResponseCount", data.length);
        return data;
    } catch (error) {

        showMessage('분석 장애 코드 데이터 로드 실패: ' + error.message, 'error');
        updateApiStatus(apiName, "error", error.message);
        throw error;
    }
}
