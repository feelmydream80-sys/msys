// @DOC_FILE: events.js (chart_analysis)
// @DOC_DESC: 이 파일은 분석 페이지의 사용자 이벤트 처리와 데이터 로딩 흐름을 관리합니다.
// 필터 변경(날짜, Job ID), 차트 타입 변경 시 데이터를 다시 로드하고 차트를 새로 그리는 로직을 담당합니다.

import { fetchAnalyticsSuccessRateTrend, fetchAnalyticsTroubleByCode } from '../common/api/analytics.js';
import { showMessage } from '../common/utils.js';
import { renderSuccessRateChart, renderTroublePieChart } from './ui.js';
import { allMngrSettings } from './data.js';
import { downloadExcelTemplate } from '../../utils/excelDownload.js';

/**
 * @DOC: 분석 페이지의 모든 데이터를 로드하고 차트를 렌더링하는 메인 함수입니다.
 * 필터 조건이 변경될 때마다 호출되어 화면을 업데이트합니다.
 */
export async function loadAnalyticsPageData() {
    const analyticsLoadingOverlay = document.getElementById('analyticsLoadingOverlay');
    if (analyticsLoadingOverlay) {
        analyticsLoadingOverlay.classList.remove('hidden');
    }

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
        if (analyticsLoadingOverlay) analyticsLoadingOverlay.classList.add('hidden');
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
        console.error("분석 차트 로딩 중 오류 발생:", error);
        showMessage('분석 차트 로딩 중 오류 발생: ' + error.message, 'error');
    } finally {
        if (analyticsLoadingOverlay) {
            analyticsLoadingOverlay.classList.add('hidden');
        }
    }
}

/**
 * @DOC: '전체 선택' 버튼 클릭 시 호출됩니다. 모든 Job ID 체크박스를 선택하고 차트를 다시 로드합니다.
 */
export function selectAllJobs(reloadChartsCallback) {
    document.querySelectorAll('.job-checkbox').forEach(checkbox => {
        checkbox.checked = true;
    });
    if (reloadChartsCallback) reloadChartsCallback();
};

/**
 * @DOC: '전체 해제' 버튼 클릭 시 호출됩니다. 모든 Job ID 체크박스를 해제하고 차트를 다시 로드합니다.
 */
export function deselectAllJobs(reloadChartsCallback) {
    document.querySelectorAll('.job-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    if (reloadChartsCallback) reloadChartsCallback();
};
