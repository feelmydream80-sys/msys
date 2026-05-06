



import { fetchJobMstInfo } from '../common/api/mst.js';
import { filterActiveMstData } from '../common/utils.js';


let jobMstInfoMap = {};
let errorCodeMap = {};
let chartColorMap = {};
let rawData = [];
let jobInfoData = [];


export async function fetchSummaryData(start, end, jobIds, allData = false) {
    const params = new URLSearchParams({ start_date: start, end_date: end });
    if (jobIds && jobIds.length > 0) params.append('job_ids', jobIds.join(','));
    if (allData) params.append('all_data', 'true');
    const res = await fetch(`/api/analytics/summary?${params.toString()}`);
    if (!res.ok) throw new Error('요약 데이터 조회 실패');
    return await res.json();
}


export async function fetchTrendData(start, end, jobIds, allData = false) {
    const params = new URLSearchParams({ start_date: start, end_date: end });
    if (jobIds && jobIds.length > 0) params.append('job_ids', jobIds.join(','));
    if (allData) params.append('all_data', 'true');
    const res = await fetch(`/api/analytics/trend?${params.toString()}`);
    if (!res.ok) throw new Error('추이 데이터 조회 실패');
    return await res.json();
}


export async function fetchRawData(start, end, jobIds, allData = false) {
    const params = new URLSearchParams({ start_date: start, end_date: end });
    if (jobIds && jobIds.length > 0) params.append('job_ids', jobIds.join(','));
    if (allData) params.append('all_data', 'true');
    const res = await fetch(`/api/analytics/raw_data?${params.toString()}`);
    if (!res.ok) throw new Error('원천 데이터 조회 실패');
    return await res.json();
}


export async function loadJobOptions(jobIdSelect) {
    const res = await fetch('/api/analytics/job_ids');
    if (!res.ok) throw new Error('Job ID 목록 조회 실패');
    const jobs = await res.json();
    jobIdSelect.innerHTML = '<option value="">전체</option>';
    jobs.forEach(job => {
        const option = document.createElement('option');
        if (job.job_id === '' || job.job_id === '전체') {
            option.value = '';
            option.textContent = '전체';
        } else {
            option.value = job.job_id;
            option.textContent = job.job_id;
        }
        jobIdSelect.appendChild(option);
    });
}


async function loadErrorCodeMap() {
    const res = await fetch('/api/analytics/error_code_map');
    if (res.ok) errorCodeMap = await res.json();
}


export async function loadErrorCodeOptions(errorCodeSelect) {
    await loadErrorCodeMap();
    const res = await fetch('/api/analytics/error_codes');
    if (!res.ok) throw new Error('장애코드 목록 조회 실패');
    const errorCodes = await res.json();
    if (errorCodeSelect) {
        errorCodeSelect.innerHTML = '<option value="">전체</option>';
        errorCodes.forEach(ec => {
            const label = errorCodeMap[ec.code] || ec.code;
            const option = document.createElement('option');
            option.value = ec.code;
            option.textContent = label;
            errorCodeSelect.appendChild(option);
        });
    }
}


export async function loadChartColorMap(isAdmin) {
    if (!isAdmin) {
        return;
    }
    try {
        const res = await fetch('/api/mngr_sett/settings/all');
        if (!res.ok) throw new Error('관리자 설정 조회 실패');
        const settings = await res.json();
        settings.forEach(item => {
            chartColorMap[item.cd] = item.chrt_colr;
        });
    } catch (error) {

    }
}


export async function updateJobMstInfoMap(jobIds) {
    if (jobIds.length > 0) {
        const rawJobInfo = await fetchJobMstInfo(jobIds);

        const jobInfoArray = Object.keys(rawJobInfo).map(jobId => ({
            job_id: jobId,
            ...rawJobInfo[jobId]
        }));
        const activeJobInfoArray = filterActiveMstData(jobInfoArray);
        jobMstInfoMap = activeJobInfoArray.reduce((map, jobInfo) => {
            map[jobInfo.job_id] = jobInfo;
            return map;
        }, {});
    } else {
        jobMstInfoMap = {};
    }
}


export function getJobMstInfoMap() {
    return jobMstInfoMap;
}


export function getErrorCodeMap() {
    return errorCodeMap;
}


export function getChartColorMap() {
    return chartColorMap;
}


export async function initializeData(jobIdSelect, errorCodeSelect) {
    const dataAnalysisContainer = document.getElementById('data-analysis-container');
    const isAdmin = dataAnalysisContainer.dataset.isAdmin === 'True';
    await loadChartColorMap(isAdmin);
    await loadJobOptions(jobIdSelect);
    await loadErrorCodeOptions(errorCodeSelect);
}



export function setRawData(data) {
    rawData = data;
}

export function getRawData() {
    return rawData;
}

export function setJobInfoData(data) {
    jobInfoData = data;
}

export function getJobInfoData() {
    return jobInfoData;
}
