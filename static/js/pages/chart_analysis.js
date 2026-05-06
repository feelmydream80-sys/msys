




import { setDataFlowStatus } from '../modules/common/api/client.js';
import { getAuthStatus } from '../modules/common/api/auth.js';
import { showMessage } from '../modules/common/utils.js';
import { loadMngrSettings, loadAllMstList } from '../modules/chart_analysis/data.js';
import { renderJobCheckboxes, initializeDatePickers, initializeChartTypeRadios, initializeLabelDisplayRadios, successRateChart, troublePieChart } from '../modules/chart_analysis/ui.js';
import { displayMinMaxDates } from '../modules/dashboard/ui.js';
import { loadAnalyticsPageData, selectAllJobs, deselectAllJobs } from '../modules/chart_analysis/events.js';
import { initCollapsibleFeatures } from '../modules/ui_components/collapsible.js';




if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
} else {

}



export async function init() {
    initCollapsibleFeatures();


    document.addEventListener('cardToggled', (e) => {
        const { card, isCollapsed } = e.detail;
        if (!isCollapsed) {
            const content = card.querySelector('.card-content');
            if (content) {
                content.addEventListener('transitionend', function resizeChart() {
                    const successRateCanvas = card.querySelector('#successRateChart');
                    const troublePieCanvas = card.querySelector('#troublePieChart');

                    if (successRateCanvas && successRateChart) {
                        successRateChart.update('none');
                    }
                    if (troublePieCanvas && troublePieChart) {
                        troublePieChart.update('none');
                    }
                    

                    content.removeEventListener('transitionend', resizeChart);
                }, { once: true });
            }
        }
    });

    const dataFlowStatus = { overallStatus: "loading" };
    setDataFlowStatus(dataFlowStatus);

    try {
        displayMinMaxDates('dashboardSummary', 'chart-min-date', 'chart-max-date');
        
        const [authStatus, jobIdListResult, mngrSettingsResult] = await Promise.all([
            getAuthStatus(),
            loadAllMstList(),
            loadMngrSettings()
        ]);
        
        const dataPermissions = authStatus.user?.data_permissions || [];
        

        


        if (!jobIdListResult || !Array.isArray(jobIdListResult)) {

            throw new Error('Job ID 목록을 가져오는데 실패했습니다.');
        }


        const savedLabelDisplayType = localStorage.getItem('chartLabelDisplayType') || 'name';
        const radioToSelect = document.querySelector(`input[name="labelDisplayType"][value="${savedLabelDisplayType}"]`);
        if (radioToSelect) {
            radioToSelect.checked = true;
        } else {
        }

        renderJobCheckboxes(savedLabelDisplayType, dataPermissions);
        initializeDatePickers();
        initializeChartTypeRadios();
        initializeLabelDisplayRadios(dataPermissions);
       
        await loadAnalyticsPageData();


        const downloadExcelTemplateBtn = document.getElementById('downloadExcelTemplateBtn');
        if (downloadExcelTemplateBtn) {
            downloadExcelTemplateBtn.addEventListener('click', () => {
                import('../utils/excelDownload.js').then(module => module.downloadExcelTemplate());
            });
        }

        dataFlowStatus.overallStatus = "success";
        showMessage('분석 페이지 로드 완료.', 'success');

    } catch (error) {
        dataFlowStatus.overallStatus = "error";


        showMessage('분석 페이지 초기화 중 심각한 오류 발생: ' + error.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', init);



const reloadCharts = () => {
    loadAnalyticsPageData();
};

window.selectAllJobs = () => selectAllJobs(reloadCharts);
window.deselectAllJobs = () => deselectAllJobs(reloadCharts);
