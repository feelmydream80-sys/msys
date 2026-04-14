// @DOC_FILE: formatters.js
// @DOC_DESC: 데이터 포맷팅 함수 모음

/**
 * 숫자 포맷팅 함수
 * @param {number} number - 포맷팅할 숫자
 * @param {number} decimals - 소수점 자릿수
 * @returns {string} - 포맷팅된 숫자 문자열
 */
function formatNumber(number, decimals = 0) {
    if (typeof number !== 'number' || isNaN(number)) {
        return '0';
    }
    
    return number.toLocaleString('ko-KR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * 날짜 포맷팅 함수 (UTC → KST 변환 지원)
 * @param {string|Date} date - 포맷팅할 날짜
 * @param {string} format - 포맷 형식
 * @returns {string} - 포맷팅된 날짜 문자열
 */
function formatDate(date, format = 'YYYY-MM-DD') {
    // 문자열이 들어오면 시간대 감지
    if (typeof date === 'string') {
        // KST (+09:00) 포함 → 그대로 반환
        if (date.includes('+09:00')) {
            return date.replace('+09:00', '').trim();
        }
        // KST 형식 (YYYY-MM-DD HH:MM:SS) → 그대로 반환
        if (date.match(/\d{4}-\d{2}-\d{2}/)) {
            return date;
        }
        // GMT/UTC 포함 → UTC로 파싱
        if (date.includes('GMT') || date.includes('UTC')) {
            return formatDate(new Date(date), format);
        }
        // 시간대 정보 없으면 그대로 반환
        return date;
    }
    
    let d = new Date(date);
    
    if (isNaN(d.getTime())) {
        return 'Invalid Date';
    }
    
    // KST 시간을 그대로 사용 (변환 없음)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

/**
 * 백분율 포맷팅 함수
 * @param {number} value - 포맷팅할 값
 * @param {number} decimals - 소수점 자릿수
 * @returns {string} - 포맷팅된 백분율 문자열
 */
function formatPercentage(value, decimals = 2) {
    if (typeof value !== 'number' || isNaN(value)) {
        return '0%';
    }
    
    return (value * 100).toFixed(decimals) + '%';
}

/**
 * 파일 크기 포맷팅 함수
 * @param {number} bytes - 바이트 크기
 * @param {number} decimals - 소수점 자릿수
 * @returns {string} - 포맷팅된 파일 크기 문자열
 */
function formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export { 
    formatNumber, 
    formatDate, 
    formatPercentage, 
    formatFileSize 
};