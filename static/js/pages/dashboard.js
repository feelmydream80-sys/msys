



import { initializeDashboard } from '../modules/dashboard/events.js?v=2';


export function init() {


    const dashboardElement = document.getElementById('dashboard-main-grid');
    if (dashboardElement) {

        if (window.resetDashboardPagination) {
            window.resetDashboardPagination();
        }
        initializeDashboard().then(() => {
        });
    }
}






init();
