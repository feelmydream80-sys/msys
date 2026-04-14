/**
 * 상태 코드 색상 정보 API 클라이언트
 * TB_STS_CD_MST 테이블에서 색상 정보를 조회
 */

/**
 * 상태 코드별 색상 정보 조회
 * @returns {Promise<Object>} 상태 코드별 색상 정보
 * @example
 * {
 *   'CD901': { name: '성공', bgColor: '#dcfce7', txtColor: '#166534', ... },
 *   'CD902': { name: '실패', bgColor: '#fee2e2', txtColor: '#991b1b', ... }
 * }
 */
export async function fetchStsCdColors() {
    try {
        const response = await fetch('/api/sts_cd/colors');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        if (result.success) {
            return result.data;
        } else {
            console.error('Failed to fetch status colors:', result.error);
            return null;
        }
    } catch (error) {
        console.error('Error fetching status colors:', error);
        return null;
    }
}
