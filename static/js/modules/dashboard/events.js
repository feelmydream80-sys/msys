



import { fetchDashboardSummary } from '../common/api/dashboard.js';
import { showMessage } from '../common/utils.js';
import { initPagination, updatePaginationData } from '../ui_components/pagination.js';
import { initCollapsibleFeatures } from '../ui_components/collapsible.js';
import { renderDashboardSummaryTable } from './dashboardTable.js';
import { initializeDashboardData, getAllAdminSettings, getDataFlowStatus, setDashboardSummaryData, getDashboardSummaryData } from './data.js';
import { initializeDatePickers, updateSummaryCards, renderDashboardChartText, fetchAndDisplayMinMaxDatesDashboard } from './ui.js';
import { initEventLog } from './eventLog.js';
import { downloadExcelTemplate } from '../../utils/excelDownload.js';


let isPaginationInitialized = false;


window.resetDashboardPagination = function() {
    isPaginationInitialized = false;
};


async function loadDashboardSummary(initialLoad = false) {
    const dataFlowStatus = getDataFlowStatus();
    dataFlowStatus.overallStatus = "loading";


    const isEvent = arguments.length > 0 && typeof arguments[0] === 'object' && arguments[0].target;
    if (isEvent) {
        initialLoad = false;
    }

    const startDate = document.getElementById('startDate')?.value || '';
    const endDate = document.getElementById('endDate')?.value || '';
    const allData = initialLoad || document.getElementById('allDataCheckbox')?.checked || false;

    try {
        const summaryData = await fetchDashboardSummary(startDate, endDate, allData);
        

        summaryData.sort((a, b) => {
            const numA = parseInt(a.job_id.replace('CD', ''), 10);
            const numB = parseInt(b.job_id.replace('CD', ''), 10);
            return numA - numB;
        });
        
        setDashboardSummaryData(summaryData);
        dataFlowStatus.dashboardSummaryFetch.apiResponseCount = summaryData.length;

        if (!summaryData || summaryData.length === 0) {
            showMessage('대시보드 요약 데이터가 없습니다.', 'info');
            updateSummaryCards([]);
            renderDashboardChartText([]);
            if (isPaginationInitialized) {
                updatePaginationData('detailTablePagination', []);
            } else {
                initPaginationWithData([]);
            }
            return;
        }


        updateSummaryCards(summaryData);


        if (isPaginationInitialized) {
            updatePaginationData('detailTablePagination', summaryData);
        } else {
            initPaginationWithData(summaryData);
        }

        dataFlowStatus.dashboardSummaryFetch.dataProcessedCount = summaryData.length;
        dataFlowStatus.dashboardSummaryFetch.apiCallSuccess = true;
        dataFlowStatus.dashboardSummaryFetch.chartRendered = true;
        showMessage('대시보드 요약 업데이트 완료.', 'success');

    } catch (error) {
        dataFlowStatus.overallStatus = "error";
        dataFlowStatus.dashboardSummaryFetch.error = error.message;
        showMessage('대시보드 요약 업데이트 중 오류 발생: ' + error.message, 'error');
    }
}


function initPaginationWithData(summaryData) {

    initPagination({
        fullData: summaryData,
        pageSize: 5,
        renderTableCallback: (paginatedData) => {

            renderDashboardSummaryTable(paginatedData);
        },
        paginationId: 'detailTablePagination',
        pageSizeId: 'detailTablePageSize',
        searchId: 'detailTableSearch',
    });
    isPaginationInitialized = true;
}


export async function initializeDashboard() {


    initCollapsibleFeatures();

    const dataFlowStatus = getDataFlowStatus();
    dataFlowStatus.overallStatus = "loading";
    
    try {

        await initializeDashboardData();
        fetchAndDisplayMinMaxDatesDashboard();


        window.loadDashboardSummary = loadDashboardSummary;

        initializeDatePickers(window.loadDashboardSummary);
        window.loadDashboardSummary(true);
        
        const allAdminSettings = getAllAdminSettings();
        initEventLog(allAdminSettings);


        const searchInput = document.getElementById('detailTableSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (event) => {
                const searchTerm = event.target.value.toLowerCase();
                const allData = getDashboardSummaryData();
                
                const filteredData = allData.filter(item => {
                    const jobId = item.job_id ? item.job_id.toLowerCase() : '';
                    const cdNm = item.cd_nm ? item.cd_nm.toLowerCase() : '';
                    const frequency = item.frequency ? item.frequency.toLowerCase() : '';
                    
                    return jobId.includes(searchTerm) || 
                           cdNm.includes(searchTerm) || 
                           frequency.includes(searchTerm);
                });
                
                updatePaginationData('detailTablePagination', filteredData);
            });
        }


        const downloadExcelTemplateBtn = document.getElementById('downloadExcelTemplateBtn');
        if (downloadExcelTemplateBtn) {
            downloadExcelTemplateBtn.addEventListener('click', downloadExcelTemplate);
        }



        dataFlowStatus.overallStatus = "success";
        showMessage('대시보드 페이지 로드 완료.', 'success');

    } catch (error) {
        dataFlowStatus.overallStatus = "error";
        showMessage('대시보드 페이지 초기화 중 오류 발생: ' + error.message, 'error');
    }
}
