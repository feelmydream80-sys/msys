class StatusManager {
    constructor() {
        this.thresholds = {
            cd991: 30,
            cd992: 7,
            cd993: 90
        };
    }

    async loadThresholds() {
        try {
            const response = await fetch('/api/analytics/settings/thresholds');
            if (response.ok) {
                const data = await response.json();
                this.thresholds = {
                    cd991: data.cd991 ?? 30,
                    cd992: data.cd992 ?? 7,
                    cd993: data.cd993 ?? 90
                };
            }
        } catch (e) {
        }
    }

    async saveThresholds(newThresholds) {
        try {
            const response = await fetch('/api/analytics/settings/thresholds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newThresholds)
            });
            if (response.ok) {
                this.thresholds = { ...this.thresholds, ...newThresholds };
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }
}

const statusManager = new StatusManager();
export default statusManager;
