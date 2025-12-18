// static/js/modules/data_analysis/data.js

/**
 * @module data
 * @description 데이터 분석 페이지의 데이터 fetching 및 상태 관리를 담당합니다.
 * - API를 통해 요약, 추이, 원천 데이터를 가져옵니다.
 * - Job ID, 장애코드, 차트 색상 등 메타데이터를 로드하고 관리합니다.
 * 
 * @example
 * import { initializeData, getJobMstInfoMap, fetchAllData } from './data.js';
 * 
 * // 페이지 초기화 시
 * await initializeData();
 * 
 * // 필터 변경 시
 * const { summary, trend, raw } = await fetchAllData(filters);
 */

import { fetchJobMstInfo } from '../common/api/mst.js';

// 상태 변수
let jobMstInfoMap = {};
let errorCodeMap = {};
let chartColorMap = {};
let rawData = [];
let jobInfoData = [];

/**
 * @description 요약 데이터를 API로부터 가져옵니다.
 * @param {string} start - 시작일
 * @param {string} end - 종료일
 * @param {Array<string>} jobIds - Job ID 배열
 * @param {boolean} allData - 전체 데이터 조회 여부
 * @returns {Promise<Object>} 요약 데이터
 */
export async function fetchSummaryData(start, end, jobIds, allData = false) {
    const params = new URLSearchParams({ start_date: start, end_date: end });
    if (jobIds && jobIds.length > 0) params.append('job_ids', jobIds.join(','));
    if (allData) params.append('all_data', 'true');
    const res = await fetch(`/api/analytics/summary?${params.toString()}`);
    if (!res.ok) throw new Error('요약 데이터 조회 실패');
    return await res.json();
}

/**
 * @description 추이 데이터를 API로부터 가져옵니다.
 * @param {string} start - 시작일
 * @param {string} end - 종료일
 * @param {Array<string>} jobIds - Job ID 배열
 * @param {boolean} allData - 전체 데이터 조회 여부
 * @returns {Promise<Object>} 추이 데이터
 */
export async function fetchTrendData(start, end, jobIds, allData = false) {
    const params = new URLSearchParams({ start_date: start, end_date: end });
    if (jobIds && jobIds.length > 0) params.append('job_ids', jobIds.join(','));
    if (allData) params.append('all_data', 'true');
    const res = await fetch(`/api/analytics/trend?${params.toString()}`);
    if (!res.ok) throw new Error('추이 데이터 조회 실패');
    return await res.json();
}

/**
 * @description 원천 데이터를 API로부터 가져옵니다.
 * @param {string} start - 시작일
 * @param {string} end - 종료일
 * @param {Array<string>} jobIds - Job ID 배열
 * @param {boolean} allData - 전체 데이터 조회 여부
 * @returns {Promise<Array>} 원천 데이터 배열
 */
export async function fetchRawData(start, end, jobIds, allData = false) {
    const params = new URLSearchParams({ start_date: start, end_date: end });
    if (jobIds && jobIds.length > 0) params.append('job_ids', jobIds.join(','));
    if (allData) params.append('all_data', 'true');
    const res = await fetch(`/api/analytics/raw_data?${params.toString()}`);
    if (!res.ok) throw new Error('원천 데이터 조회 실패');
    return await res.json();
}

/**
 * @description Job ID 선택 옵션을 로드하여 select 엘리먼트에 채웁니다.
 * @param {HTMLElement} jobIdSelect - Job ID select 엘리먼트
 */
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

/**
 * @description 장애코드 맵을 로드합니다.
 */
async function loadErrorCodeMap() {
    const res = await fetch('/api/analytics/error_code_map');
    if (res.ok) errorCodeMap = await res.json();
}

/**
 * @description 장애코드 선택 옵션을 로드하여 select 엘리먼트에 채웁니다.
 * @param {HTMLElement} errorCodeSelect - 장애코드 select 엘리먼트
 */
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

/**
 * @description 관리자 설정에서 차트 색상 정보를 로드합니다.
 */
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
        console.error('차트 색상 로드 중 오류:', error);
    }
}

/**
 * @description Job ID 배열에 대한 상세 정보를 가져와 맵을 업데이트합니다.
 * @param {Array<string>} jobIds - Job ID 배열
 */
export async function updateJobMstInfoMap(jobIds) {
    if (jobIds.length > 0) {
        jobMstInfoMap = await fetchJobMstInfo(jobIds);
    } else {
        jobMstInfoMap = {};
    }
}

/**
 * @description 저장된 Job Master 정보 맵을 반환합니다.
 * @returns {Object} jobMstInfoMap
 */
export function getJobMstInfoMap() {
    return jobMstInfoMap;
}

/**
 * @description 저장된 장애코드 맵을 반환합니다.
 * @returns {Object} errorCodeMap
 */
export function getErrorCodeMap() {
    return errorCodeMap;
}

/**
 * @description 저장된 차트 색상 맵을 반환합니다.
 * @returns {Object} chartColorMap
 */
export function getChartColorMap() {
    return chartColorMap;
}

/**
 * @description 데이터 분석 페이지에 필요한 모든 초기 메타데이터를 로드합니다.
 * @param {HTMLElement} jobIdSelect 
 * @param {HTMLElement} errorCodeSelect 
 */
export async function initializeData(jobIdSelect, errorCodeSelect) {
    const dataAnalysisContainer = document.getElementById('data-analysis-container');
    const isAdmin = dataAnalysisContainer.dataset.isAdmin === 'True';
    await loadChartColorMap(isAdmin);
    await loadJobOptions(jobIdSelect);
    await loadErrorCodeOptions(errorCodeSelect);
}

// --- 원본 데이터 Getter/Setter ---

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
