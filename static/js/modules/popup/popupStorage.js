


export class PopupStorage {
    constructor() {
        this.storageKey = 'msys_popup_hidden';
    }

    
    getHiddenPopups() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) return [];
            
            const parsed = JSON.parse(stored);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {

            return [];
        }
    }

    
    setPopupHidden(popupId, hours) {
        if (!popupId || typeof hours !== 'number' || hours <= 0) {

            return;
        }

        const hiddenPopups = this.getHiddenPopups();
        const hiddenUntil = Date.now() + (hours * 60 * 60 * 1000);
        

        const existingIndex = hiddenPopups.findIndex(item => item.popupId === popupId);
        
        if (existingIndex >= 0) {
            hiddenPopups[existingIndex].hiddenUntil = hiddenUntil;
        } else {
            hiddenPopups.push({ popupId, hiddenUntil });
        }

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(hiddenPopups));
        } catch (error) {

        }
    }

    
    isPopupHidden(popupId) {
        if (!popupId) return false;

        const hiddenPopups = this.getHiddenPopups();
        const now = Date.now();
        
        const item = hiddenPopups.find(h => h.popupId === popupId);
        
        if (!item) return false;
        

        if (item.hiddenUntil <= now) {
            return false;
        }
        
        return true;
    }

    
    clearExpiredHidden() {
        const hiddenPopups = this.getHiddenPopups();
        const now = Date.now();
        
        const validPopups = hiddenPopups.filter(item => item.hiddenUntil > now);
        const removedCount = hiddenPopups.length - validPopups.length;
        
        if (removedCount > 0) {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(validPopups));
            } catch (error) {

            }
        }
        
        return removedCount;
    }

    
    clearAllHidden() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {

        }
    }

    
    removeHiddenPopup(popupId) {
        if (!popupId) return;

        const hiddenPopups = this.getHiddenPopups();
        const filtered = hiddenPopups.filter(item => item.popupId !== popupId);
        
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(filtered));
        } catch (error) {

        }
    }
}


export const popupStorage = new PopupStorage();


if (typeof window !== 'undefined') {
    window.PopupStorage = PopupStorage;
    window.popupStorage = popupStorage;
}
