import { parseCronExpression, debounce } from '../common/utils.js';
import { initPagination } from '../ui_components/pagination.js';


let allJobData = [];
let currentJobInfoPageSize = 5;



export function initJobInfo(data, pageSize = 5) {
    allJobData = data;
    currentJobInfoPageSize = pageSize;


    setupJobInfoSearchListener();
    
    initPagination({
        fullData: allJobData,
        pageSize: currentJobInfoPageSize,
        renderTableCallback: renderJobInfoTableContent,
        paginationId: 'jobInfoPagination',
        pageSizeId: 'jobInfoPageSize',
    });
}


let isSearchListenerSetup = false;

function setupJobInfoSearchListener() {
    if (isSearchListenerSetup) return;

    const searchInput = document.getElementById('jobInfoSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            const searchTerm = searchInput.value.toLowerCase();
            const filteredData = allJobData.filter(job => {

                return (job.job_id && job.job_id.toLowerCase().includes(searchTerm)) ||
                       (job.cd_nm && job.cd_nm.toLowerCase().includes(searchTerm)) ||
                       (job.cron && job.cron.toLowerCase().includes(searchTerm)) ||
                       (job.description && job.description.toLowerCase().includes(searchTerm));
            });

            initPagination({
                fullData: filteredData,
                pageSize: currentJobInfoPageSize,
                renderTableCallback: renderJobInfoTableContent,
                paginationId: 'jobInfoPagination',
                pageSizeId: 'jobInfoPageSize',
            });
        }, 300));
        isSearchListenerSetup = true;
    }
}

export function updateJobInfoSearch(term) {

}

export function updateJobInfoPageSize(size) {

}

export function renderPagedJobInfo() {

}

function renderJobInfoTableContent(pageData) {
    const table = document.getElementById('jobInfoTable');
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    pageData.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-4 py-2 border-b text-center">${item.job_id || 'N/A'}</td>
            <td class="px-4 py-2 border-b text-center">${item.cd_nm || 'N/A'}</td>
            <td class="px-4 py-2 border-b text-center">
                <div>${item.cron || 'N/A'}</div>
                <div class="text-xs text-gray-500 mt-1">${parseCronExpression(item.cron)}</div>
            </td>
            <td class="px-4 py-2 border-b text-center">${item.description || 'N/A'}</td>
        `;
        tbody.appendChild(tr);
    });
}
