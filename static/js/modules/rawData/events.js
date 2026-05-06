

import { filterData, downloadExcel } from './utils.js';


export function setupEventListeners(state, rerender, reloadData) {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const jobSelect = document.getElementById('job-id-select');
    const searchInput = document.getElementById('table-search');
    const pageSizeSelect = document.getElementById('pageSizeSelect');
    const excelBtn = document.getElementById('excel-download-btn');


    startDateInput.addEventListener('change', reloadData);
    endDateInput.addEventListener('change', reloadData);
    jobSelect.addEventListener('change', reloadData);


    if (searchInput) {
        searchInput.addEventListener('input', function() {
            state.searchTerm = this.value.trim();
            state.currentPage = 1;
            rerender();
        });
    }

    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', function() {
            state.pageSize = parseInt(this.value, 10);
            state.currentPage = 1;
            rerender();
        });
    }

    if (excelBtn) {
        excelBtn.addEventListener('click', function() {
            const filtered = filterData(state);
            downloadExcel(filtered);
        });
    }
}
