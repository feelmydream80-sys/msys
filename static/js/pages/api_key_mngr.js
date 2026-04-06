// API 키 관리 페이지 초기화
export async function init() {
    console.log('API 키 관리 페이지 초기화');
    
    try {
        // 모듈 동적 import (순서대로 로드)
        await import('../modules/api_key_mngr/data.js');
        await import('../modules/api_key_mngr/core.js');
        await import('../modules/api_key_mngr/table.js');
        await import('../modules/api_key_mngr/chart.js');
        await import('../modules/api_key_mngr/settings.js');
        await import('../modules/api_key_mngr/ui.js');
        
        // 모든 모듈이 로드된 후 초기화
        if (typeof window.ApiKeyMngrUI !== 'undefined' && typeof window.ApiKeyMngrUI.init === 'function') {
            window.ApiKeyMngrUI.init();
        } else {
            console.error('ApiKeyMngrUI가 정의되지 않았거나 init 함수가 없습니다.');
        }
    } catch (error) {
        console.error('API 키 관리 모듈 로드 실패:', error);
    }
}