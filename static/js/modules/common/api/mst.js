
import { showMessage } from '../utils.js';
import { updateApiStatus } from './client.js';

const BASE_URL = '';


export async function fetchAllMstList() {
    const apiName = "mstListFetch";
    updateApiStatus(apiName, "apiCallAttempted", true);
    updateApiStatus(apiName, "apiCallSuccess", false);
    updateApiStatus(apiName, "apiResponseCount", 0);
    updateApiStatus(apiName, "error", null);

    try {
        const url = `${BASE_URL}/api/mst_list`;
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const data = await response.json();
        showMessage('마스터 목록 데이터 로드 성공.', 'success');
        updateApiStatus(apiName, "apiCallSuccess", true);
        updateApiStatus(apiName, "apiResponseCount", data.length);
        return data;
    } catch (error) {

        showMessage('마스터 목록 데이터 로드 실패: ' + error.message, 'error');
        updateApiStatus(apiName, "error", error.message);
        throw error;
    }
}

export async function fetchJobMstInfo(jobIds) {

    const params = new URLSearchParams();
    if (jobIds && jobIds.length > 0) {
        params.append('job_ids', jobIds.join(','));
    }
    const res = await fetch(`/api/job_mst_info?${params.toString()}`);
    if (!res.ok) throw new Error('Job 상세정보 조회 실패');
    return await res.json();
}
