// static/js/modules/popup/popupStorage.js

/**
 * 팝업 숨김 상태 관리를 위한 localStorage 클래스
 * Manages popup hidden states using localStorage
 */
export class PopupStorage {
    constructor() {
        this.storageKey = 'msys_popup_hidden';
    }

    /**
     * 숨겨진 팝업 목록을 가져옵니다.
     * @returns {Array<{popupId: string, hiddenUntil: number}>} 숨겨진 팝업 ID와 만료 타임스탬프 목록
     */
    getHiddenPopups() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) return [];
            
            const parsed = JSON.parse(stored);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('PopupStorage: Failed to parse hidden popups', error);
            return [];
        }
    }

    /**
     * 특정 팝업을 숨김 상태로 표시합니다.
     * @param {string} popupId - 팝업 ID
     * @param {number} hours - 숨길 시간(시간 단위)
     */
    setPopupHidden(popupId, hours) {
        if (!popupId || typeof hours !== 'number' || hours <= 0) {
            console.warn('PopupStorage: Invalid parameters for setPopupHidden');
            return;
        }

        const hiddenPopups = this.getHiddenPopups();
        const hiddenUntil = Date.now() + (hours * 60 * 60 * 1000);
        
        // 기존 항목이 있으면 업데이트, 없으면 추가
        const existingIndex = hiddenPopups.findIndex(item => item.popupId === popupId);
        
        if (existingIndex >= 0) {
            hiddenPopups[existingIndex].hiddenUntil = hiddenUntil;
        } else {
            hiddenPopups.push({ popupId, hiddenUntil });
        }

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(hiddenPopups));
        } catch (error) {
            console.error('PopupStorage: Failed to save hidden popup', error);
        }
    }

    /**
     * 팝업이 숨겨져야 하는지 확인합니다.
     * @param {string} popupId - 팝업 ID
     * @returns {boolean} 숨겨져 있으면 true
     */
    isPopupHidden(popupId) {
        if (!popupId) return false;

        const hiddenPopups = this.getHiddenPopups();
        const now = Date.now();
        
        const item = hiddenPopups.find(h => h.popupId === popupId);
        
        if (!item) return false;
        
        // 만료 시간이 지났으면 false 반환
        if (item.hiddenUntil <= now) {
            return false;
        }
        
        return true;
    }

    /**
     * 만료된 숨김 상태 항목을 정리합니다.
     * @returns {number} 정리된 항목 수
     */
    clearExpiredHidden() {
        const hiddenPopups = this.getHiddenPopups();
        const now = Date.now();
        
        const validPopups = hiddenPopups.filter(item => item.hiddenUntil > now);
        const removedCount = hiddenPopups.length - validPopups.length;
        
        if (removedCount > 0) {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(validPopups));
            } catch (error) {
                console.error('PopupStorage: Failed to clear expired hidden popups', error);
            }
        }
        
        return removedCount;
    }

    /**
     * 모든 숨김 상태 데이터를 삭제합니다.
     */
    clearAllHidden() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            console.error('PopupStorage: Failed to clear all hidden popups', error);
        }
    }

    /**
     * 특정 팝업의 숨김 상태를 해제합니다.
     * @param {string} popupId - 팝업 ID
     */
    removeHiddenPopup(popupId) {
        if (!popupId) return;

        const hiddenPopups = this.getHiddenPopups();
        const filtered = hiddenPopups.filter(item => item.popupId !== popupId);
        
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(filtered));
        } catch (error) {
            console.error('PopupStorage: Failed to remove hidden popup', error);
        }
    }
}

// 싱글톤 인스턴스 제공
export const popupStorage = new PopupStorage();

// 전역 접근을 위한 window 객체 등록 (기존 코드 패턴 유지)
if (typeof window !== 'undefined') {
    window.PopupStorage = PopupStorage;
    window.popupStorage = popupStorage;
}
