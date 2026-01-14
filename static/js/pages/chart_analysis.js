// @DOC_FILE: chart_analysis.js
// @DOC_DESC: 분석 페이지의 메인 JavaScript 파일입니다.
// 페이지 초기화 로직을 담당하며, `data.js`, `ui.js`, `events.js` 모듈을 가져와
// 각 모듈의 함수를 호출하여 페이지를 구성하고 동적으로 만듭니다.

import { setDataFlowStatus } from '../modules/common/api/client.js';
import { getAuthStatus } from '../modules/common/api/auth.js';
import { showMessage } from '../modules/common/utils.js';
import { loadMngrSettings, loadAllMstList } from '../modules/chart_analysis/data.js';
import { renderJobCheckboxes, initializeDatePickers, initializeChartTypeRadios, initializeLabelDisplayRadios, successRateChart, troublePieChart } from '../modules/chart_analysis/ui.js';
import { displayMinMaxDates } from '../modules/dashboard/ui.js';
import { loadAnalyticsPageData, selectAllJobs, deselectAllJobs } from '../modules/chart_analysis/events.js';
import { initCollapsibleFeatures } from '../modules/ui_components/collapsible.js';

// @DOC: Chart.js의 datalabels 플러그인을 전역으로 등록합니다.
// 이 플러그인은 HTML에서 이미 로드되어 있어야 합니다.
// 장애 코드별 비율 차트에서만 datalabels를 사용하므로 등록합니다.
if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
} else {
    console.error("ChartDataLabels plugin not found. Ensure it's loaded before chart_analysis.js.");
}


/**
 * @DOC: DOMContentLoaded 이벤트 리스너는 페이지의 HTML이 완전히 로드되었을 때 실행됩니다.
 * 이 함수는 분석 페이지의 초기화 과정을 담당하는 메인 진입점입니다.
 */
export async function init() {
    initCollapsibleFeatures();

    // Add event listener for card toggling to resize charts using transitionend for accuracy
    document.addEventListener('cardToggled', (e) => {
        const { card, isCollapsed } = e.detail;
        if (!isCollapsed) {
            const content = card.querySelector('.card-content');
            if (content) {
                content.addEventListener('transitionend', function resizeChart() {
                    const successRateCanvas = card.querySelector('#successRateChart');
                    const troublePieCanvas = card.querySelector('#troublePieChart');

                    if (successRateCanvas && successRateChart) {
                        successRateChart.update('none'); // 카드 토글 시 애니메이션 없음
                    }
                    if (troublePieCanvas && troublePieChart) {
                        troublePieChart.update('none'); // 카드 토글 시 애니메이션 없음
                    }
                    
                    // Remove the event listener to prevent it from firing multiple times
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
        
        // 데이터 구조를 더 명확하게 보기 위해 JSON.stringify 사용
        
        // jobIdListResult는 API 응답에서 직접 반환된 배열이므로 .data 속성이 없습니다.
        // 배열 자체의 유효성을 검사하도록 수정합니다.
        if (!jobIdListResult || !Array.isArray(jobIdListResult)) {
            console.error('[DEBUG] CRITICAL: Job ID 목록 데이터가 유효하지 않습니다.', jobIdListResult);
            throw new Error('Job ID 목록을 가져오는데 실패했습니다.');
        }

        // localStorage에서 저장된 라벨 표시 유형을 불러오거나 기본값 'name'을 사용합니다.
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

        // 엑셀 템플릿 다운로드 버튼 이벤트 리스너
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
        // 에러 객체 전체를 출력하여 스택 트레이스까지 확인
        console.error("[DEBUG] CRITICAL: chart_analysis.js init()에서 심각한 오류 발생:", error);
        showMessage('분석 페이지 초기화 중 심각한 오류 발생: ' + error.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', init);

// @DOC: 모듈 스코프 내에 있는 함수들을 HTML에서 직접 접근할 수 있도록 `window` 전역 객체에 할당합니다.
// adminSettings를 loadAnalyticsPageData에 바인딩하여 전달합니다.
const reloadCharts = () => {
    loadAnalyticsPageData();
};

window.selectAllJobs = () => selectAllJobs(reloadCharts);
window.deselectAllJobs = () => deselectAllJobs(reloadCharts);
