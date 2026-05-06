



import { initializeDashboard } from '../modules/dashboard/events.js';


export function init() {


    const dashboardElement = document.getElementById('dashboard-main-grid');
    if (dashboardElement && !window.isDashboardInitialized) {
        window.isDashboardInitialized = true;

        if (window.resetDashboardPagination) {
            window.resetDashboardPagination();
        }
        initializeDashboard().then(() => {
        });
    }
}




window.isDashboardInitialized = false;


init();
