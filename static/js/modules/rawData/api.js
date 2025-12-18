/**
 * @module api
 * @description 서버 API 호출을 담당하는 모듈
 */

/**
 * tb_con_hist 테이블에 존재하는 모든 Job ID 목록을 가져옵니다.
 * @returns {Promise<Array<Object>>} Job ID 목록 Promise 객체
 * 
 * @example
 * // 사용 예시
 * import { fetchJobIds } from './api.js';
 * 
 * async function initialize() {
 *   const jobIds = await fetchJobIds();
 *   jobIds; // [{job_id: 'JOB001'}, {job_id: 'JOB002'}]
 * }
 */
export async function fetchJobIds() {
    const response = await fetch('/api/analytics/job_ids');
    if (!response.ok) {
        console.error('Failed to fetch job IDs');
        return [];
    }
    return await response.json();
}

/**
 * 모든 상세 데이터를 가져옵니다.
 * @param {string} startDate - 시작 날짜
 * @param {string} endDate - 종료 날짜
 * @param {Array<string>} jobIds - Job ID 배열 (선택사항, 지정하지 않으면 사용자의 모든 허용된 Job 데이터 반환)
 * @returns {Promise<Array<Object>>} 상세 데이터 목록 Promise 객체
 *
 * @example
 * // 사용 예시
 * import { fetchAllData } from './api.js';
 *
 * async function initialize() {
 *   // 특정 Job만 조회
 *   const jobData = await fetchAllData('2024-01-01', '2024-01-31', ['CD101', 'CD102']);
 *
 *   // 사용자의 모든 허용된 Job 데이터 조회 (기존 동작)
 *   const allData = await fetchAllData('2024-01-01', '2024-01-31');
 * }
 */
export async function fetchAllData(startDate, endDate, jobIds = null) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (jobIds && jobIds.length > 0) params.append('job_ids', jobIds.join(','));

    const url = `/api/raw_data?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
        console.error('Failed to fetch raw data');
        return [];
    }
    return await response.json();
}

/**
 * 에러 코드와 한글명 매핑 정보를 가져옵니다.
 * @returns {Promise<Object>} 에러 코드 맵 Promise 객체
 * 
 * @example
 * // 사용 예시
 * import { fetchErrorCodeMap } from './api.js';
 * 
 * async function initialize() {
 *   const errorCodeMap = await fetchErrorCodeMap();
 *   errorCodeMap; // { 'CD901': '성공', 'CD902': '실패' }
 * }
 */
export async function fetchErrorCodeMap() {
    const response = await fetch('/api/analytics/error_code_map');
    if (!response.ok) {
        console.error('Failed to fetch error code map');
        return {};
    }
    return await response.json();
}

/**
 * tb_con_hist 테이블의 min, max 날짜를 가져옵니다.
 * @returns {Promise<Object>} min, max 날짜를 포함하는 Promise 객체
 */
export async function fetchMinMaxDates() {
    const response = await fetch('/api/min-max-dates');
    if (!response.ok) {
        console.error('Failed to fetch min/max dates');
        return { min_date: null, max_date: null };
    }
    return await response.json();
}
