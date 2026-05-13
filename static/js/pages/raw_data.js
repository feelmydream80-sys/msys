

import { fetchJobIds, fetchAllData, fetchErrorCodeMap } from '../modules/rawData/api.js';
import { RawDataUI } from '../modules/rawData/ui.js';
import { setupEventListeners } from '../modules/rawData/events.js';
import { filterData } from '../modules/rawData/utils.js';
import { initCollapsibleFeatures } from '../modules/ui_components/collapsible.js';
import { updateDateRangeDisplay } from '../modules/common/ui.js';
import { fetchMinMaxDates } from '../modules/common/api/dashboard.js';
import { setDataFlowStatus } from '../modules/common/api/client.js';
import { showMessage } from '../modules/common/utils.js';
import { downloadExcelTemplate } from '../utils/excelDownload.js';
import { showLoading, hideLoading } from '../components/loading.js';


const state = {
    allData: [],
    errorCodeMap: {},
    searchTerm: '',
};

let ui;
let userAllowedJobIds = [];


async function rerender() {
    const filtered = filterData(state);
    ui.filteredData = filtered;
    ui.initializePagination(state, filtered);
}


export async function init() {
    showLoading();
    try {
        setDataFlowStatus({
            minMaxDatesFetch_rawData: { apiCallAttempted: false, apiCallSuccess: false, apiResponseCount: 0, error: null },
            fetchAllData_rawData: { apiCallAttempted: false, apiCallSuccess: false, apiResponseCount: 0, error: null }
        });

        initCollapsibleFeatures();
        loadSheetJS();

        ui = new RawDataUI();


        const dateRange = await fetchMinMaxDates('rawData');
        if (dateRange && dateRange.min_date && dateRange.max_date) {
            const maxDate = new Date(dateRange.max_date);
            const oneYearAgo = new Date(maxDate);
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            const minDate = new Date(dateRange.min_date);

            const startDate = minDate > oneYearAgo ? dateRange.min_date : oneYearAgo.toISOString().split('T')[0];
            const endDate = dateRange.max_date;

            document.getElementById('selectedDateDisplay').textContent = `${startDate} ~ ${endDate}`;
            document.getElementById('start-date').value = startDate;
            document.getElementById('end-date').value = endDate;
        }

        const [jobList, errorCodeMap] = await Promise.all([
            fetchJobIds(),
            fetchErrorCodeMap()
        ]);

        state.errorCodeMap = errorCodeMap;

        userAllowedJobIds = jobList.map(item => item.job_id);
        ui.populateJobIdSelect(jobList);
        

        const reloadData = async () => {
            showLoading();
            try {
                const startDate = document.getElementById('start-date').value;
                const endDate = document.getElementById('end-date').value;
                const jobIdSelect = document.getElementById('job-id-select');
                const selectedJobId = jobIdSelect ? jobIdSelect.value : null;

                let jobIds = null;
                if (selectedJobId && selectedJobId !== '') {
                    if (selectedJobId === 'all') {

                        jobIds = userAllowedJobIds.length > 0 ? userAllowedJobIds : null;
                    } else {
                        jobIds = [selectedJobId];
                    }
                }

                state.allData = await fetchAllData(startDate, endDate, jobIds);
                rerender();
            } finally {
                hideLoading();
            }
        };
        setupEventListeners(state, rerender, reloadData);
        

        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;

        const initialJobIds = userAllowedJobIds.length > 0 ? userAllowedJobIds : null;
        state.allData = await fetchAllData(startDate, endDate, initialJobIds);
        

        rerender();


        const downloadExcelTemplateBtn = document.getElementById('downloadExcelTemplateBtn');
        if (downloadExcelTemplateBtn) {
            downloadExcelTemplateBtn.addEventListener('click', async () => {
                try {
                    await downloadExcelTemplate();
                    showMessage('수집 요청서 양식 다운로드가 시작되었습니다.', 'success');
                } catch (error) {
                    showMessage(error.message, 'error');
                }
            });
        }


        const downloadRawDataBtn = document.getElementById('downloadRawDataBtn');
        if (downloadRawDataBtn) {
            downloadRawDataBtn.addEventListener('click', () => {
                try {

                    const table = document.getElementById('detail-table-body');
                    if (!table || !window.XLSX) {
                        showMessage('엑셀 다운로드 기능을 사용할 수 없습니다.', 'error');
                        return;
                    }


                    const rows = table.querySelectorAll('tr');
                    const data = [];


                    data.push(['수집일자', '코드명', '성공/총수량 (%)', '성공여부']);


                    rows.forEach(row => {
                        const cells = row.querySelectorAll('td');
                        if (cells.length >= 4) {
                            const rowData = [
                                cells[0].textContent.trim(),
                                cells[1].textContent.trim(),
                                cells[2].textContent.trim(),
                                cells[3].textContent.trim()
                            ];
                            data.push(rowData);
                        }
                    });

                    if (data.length <= 1) {
                        showMessage('다운로드할 데이터가 없습니다.', 'warning');
                        return;
                    }


                    const ws = window.XLSX.utils.aoa_to_sheet(data);


                    const wb = window.XLSX.utils.book_new();
                    window.XLSX.utils.book_append_sheet(wb, ws, '원천데이터');


                    const fileName = `원천데이터_${new Date().toISOString().split('T')[0]}.xlsx`;
                    window.XLSX.writeFile(wb, fileName);

                    showMessage('원천 데이터 엑셀 다운로드가 시작되었습니다.', 'success');

                } catch (error) {

                    showMessage('엑셀 다운로드 중 오류가 발생했습니다.', 'error');
                }
            });
        }
    } finally {
        hideLoading();
    }
}


function loadSheetJS() {





}


document.addEventListener('DOMContentLoaded', init);
