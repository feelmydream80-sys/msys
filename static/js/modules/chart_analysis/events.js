import { fetchAnalyticsSuccessRateTrend, fetchAnalyticsTroubleByCode } from '../common/api/analytics.js';
import { showMessage } from '../common/utils.js';
import { renderSuccessRateChart, renderTroublePieChart } from './ui.js';
import { allMngrSettings } from './data.js';
import { downloadExcelTemplate } from '../../utils/excelDownload.js';
import { showLoading, hideLoading } from '../../components/loading.js';


export async function loadAnalyticsPageData() {
    showLoading();

    const startDate = document.getElementById('startDate')?.value || '';
    const endDate = document.getElementById('endDate')?.value || '';
    const selectedJobIds = Array.from(document.querySelectorAll('.job-checkbox:checked'))
                                .map(checkbox => checkbox.value)
                                .filter(Boolean);

    const successChartType = document.querySelector('input[name="successChartType"]:checked')?.value || 'line';
    const troubleChartType = document.querySelector('input[name="troubleChartType"]:checked')?.value || 'doughnut';
    const labelDisplayType = document.querySelector('input[name="labelDisplayType"]:checked')?.value || 'name';

    if (selectedJobIds.length === 0) {
        renderSuccessRateChart([], successChartType, allMngrSettings, labelDisplayType);
        renderTroublePieChart([], troubleChartType, startDate, endDate, allMngrSettings, labelDisplayType);
        hideLoading();
        return;
    }

    try {
        const [successRateData, troubleCodeData] = await Promise.all([
            fetchAnalyticsSuccessRateTrend(startDate, endDate, selectedJobIds),
            fetchAnalyticsTroubleByCode(startDate, endDate, selectedJobIds)
        ]);

        renderSuccessRateChart(successRateData, successChartType, allMngrSettings, labelDisplayType);
        renderTroublePieChart(troubleCodeData, troubleChartType, startDate, endDate, allMngrSettings, labelDisplayType);
        
        showMessage('분석 차트 업데이트 완료.', 'success');
    } catch (error) {

        showMessage('분석 차트 로딩 중 오류 발생: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}


export function selectAllJobs(reloadChartsCallback) {
    document.querySelectorAll('.job-checkbox').forEach(checkbox => {
        checkbox.checked = true;
    });
    if (reloadChartsCallback) reloadChartsCallback();
};


export function deselectAllJobs(reloadChartsCallback) {
    document.querySelectorAll('.job-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    if (reloadChartsCallback) reloadChartsCallback();
};