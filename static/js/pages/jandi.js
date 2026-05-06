import { debounce, showMessage, filterActiveMstData, filterValidJobs } from '../modules/common/utils.js';
import { drawContinuousHeatmap, drawHeatmapIfNeeded } from '../modules/data_analysis/heatmap.js';
import { initJobInfo } from '../modules/dashboard/jobInfo.js';
import { initCollapsibleFeatures, initSingleCollapsibleCard } from '../modules/ui_components/collapsible.js';
import { initPagination } from '../modules/ui_components/pagination.js';
import { setDefaultDates } from '../modules/common/dateUtils.js';
import { downloadExcelTemplate } from '../utils/excelDownload.js';

export function init() {
    const jandiPageContainer = document.getElementById('jandi-page-container');
    const isAdmin = jandiPageContainer.dataset.isAdmin === 'True';
    initCollapsibleFeatures();
    setDefaultDates();
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const allDataCheckbox = document.getElementById('allDataCheckbox');
    const filterButton = document.getElementById('filter-button');
    const heatmapContainer = document.getElementById('heatmap-container');
    const loadingIndicator = document.getElementById('loading');
    const jandiSearchInput = document.getElementById('jandiSearch');
    const jandiPageSizeSelect = document.getElementById('jandiPageSize');
    const jandiPagination = document.getElementById('jandiPagination');
    const sortAscButton = document.getElementById('sortAsc');
    const sortDescButton = document.getElementById('sortDesc');
    const jobInfoSearchInput = document.getElementById('jobInfoSearch');
    const jobInfoPageSizeSelect = document.getElementById('jobInfoPageSize');

    let jobMstInfoMap = {};
    let allJandiData = {};
    let allJobInfoData = [];
    let adminSettingsMap = {};
    let currentPage = 1;
    let pageSize = parseInt(jandiPageSizeSelect.value, 10);
    let searchTerm = '';
    let sortOrder = 'asc';


    async function fetchAllData() {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        const allData = allDataCheckbox.checked;

        if (!allData && (!startDate || !endDate)) {
            alert('전체 데이터 조회가 아닐 경우, 시작일과 종료일을 선택해주세요.');
            return;
        }

        loadingIndicator.style.display = 'block';
        heatmapContainer.innerHTML = '';

        try {

            if (isAdmin) {
                const adminSettingsResponse = await fetch('/api/mngr_sett/settings/all');
                if (!adminSettingsResponse.ok) throw new Error('관리자 설정 조회 실패');
                const adminSettingsResult = await adminSettingsResponse.json();
                adminSettingsMap = adminSettingsResult.reduce((acc, setting) => {
                    acc[setting.cd] = setting;
                    return acc;
                }, {});
            }


            const mstResponse = await fetch('/api/mst_list');
            if (!mstResponse.ok) throw new Error('마스터 목록 조회 실패');
            const mstResult = await mstResponse.json();
            

            const activeJobs = filterValidJobs(filterActiveMstData(mstResult));


            const jobIds = activeJobs.map(job => job.job_id);
            const jobMstInfoResponse = await fetch(`/api/job_mst_info?job_ids=${jobIds.join(',')}`);
            if (!jobMstInfoResponse.ok) throw new Error('Job 상세정보 조회 실패');
            const jobMstInfoResult = await jobMstInfoResponse.json();
            
            jobMstInfoMap = jobMstInfoResult;
            

            const jobsWithSchedule = activeJobs.filter(job => jobMstInfoMap[job.job_id]?.item6);


            allJandiData = {};
            for (const job of jobsWithSchedule) {
                const job_id = job.job_id;
                const jandiDataResponse = await fetch(`/api/jandi-data?job_id=${job_id}&start_date=${startDate}&end_date=${endDate}&allData=${allData}`);
                if (!jandiDataResponse.ok) {

                    continue;
                }
                const jandiDataResult = await jandiDataResponse.json();
                
                const jobDataMap = new Map();
                jandiDataResult.forEach(item => {
                    if (item.date) {
                        try {

                            const dateKey = new Date(item.date).toISOString().substring(0, 10);
                            jobDataMap.set(dateKey, item.count);
                        } catch (e) {

                        }
                    }
                });
                allJandiData[job_id] = jobDataMap;
            }


            allJobInfoData = jobsWithSchedule.map(job => ({
                job_id: job.job_id,
                cd_nm: jobMstInfoMap[job.job_id]?.cd_nm || '',
                cron: jobMstInfoMap[job.job_id]?.item6 || '',
                description: jobMstInfoMap[job.job_id]?.cd_desc || ''
            })).sort((a, b) => {
                const numA = parseInt(a.job_id.replace('CD', ''), 10);
                const numB = parseInt(b.job_id.replace('CD', ''), 10);
                return numA - numB;
            });
            initJobInfo(allJobInfoData, 5);

            renderPagedHeatmaps(true);

        } catch (error) {

            heatmapContainer.innerHTML = `<p class="text-red-500">${error.message}</p>`;
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    function renderPagedHeatmaps(isNewSearch = false) {
        heatmapContainer.innerHTML = '';


        let jobIds = Object.keys(allJandiData);
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            jobIds = jobIds.filter(id => 
                id.toLowerCase().includes(lowerCaseSearchTerm) || 
                (jobMstInfoMap[id].cd_nm && jobMstInfoMap[id].cd_nm.toLowerCase().includes(lowerCaseSearchTerm))
            );
        }
        jobIds.sort((a, b) => {
            const numA = parseInt(a.replace('CD', ''), 10);
            const numB = parseInt(b.replace('CD', ''), 10);
            return sortOrder === 'asc' ? numA - numB : numB - numA;
        });

        const totalItems = jobIds.length;
        const totalPages = Math.ceil(totalItems / pageSize);
        if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pagedJobIds = jobIds.slice(startIndex, endIndex);

        const renderCallback = (pagedIds) => {
            heatmapContainer.innerHTML = '';
            pagedIds.forEach(jobId => {
                renderJobHeatmap(jobId);
            });
        };

        initPagination({
            fullData: jobIds,
            pageSize: pageSize,
            renderTableCallback: renderCallback,
            paginationId: 'jandiPagination',
            pageSizeId: 'jandiPageSize',
            searchId: 'jandiSearch',
        });
    }
    
    function renderJobHeatmap(jobId) {
        const jobInfo = jobMstInfoMap[jobId];
        const jobName = jobInfo?.cd_nm || 'N/A';
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        const card = document.createElement('div');
        card.className = 'jandi-card collapsible-card';
        card.id = `jandi-card-${jobId}`;
        card.style.marginTop = '10px';
        
        card.innerHTML = `
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
                <h3 class="text-lg font-semibold mb-0">${jobId} (${jobName})</h3>
                <span class="transform transition-transform duration-300">▼</span>
            </div>
            <div class="card-content">
                <div class="graph" id="graph-${jobId}" style="min-height: 150px;"></div>
            </div>
        `;
        heatmapContainer.appendChild(card);
        initSingleCollapsibleCard(card);

        const graphDiv = card.querySelector('.graph');
        const dataMap = allJandiData[jobId] || new Map();
        
        const adminSetting = adminSettingsMap[jobId];
        const jandiColorMin = adminSetting?.jandi_color_min;
        const jandiColorMax = adminSetting?.jandi_color_max;

        drawContinuousHeatmap(graphDiv, dataMap, startDate, endDate, jandiColorMin, jandiColorMax);
    }


    filterButton.addEventListener('click', () => {
        currentPage = 1;
        fetchAllData();
    });
    
    jandiSearchInput.addEventListener('input', debounce(() => {
        searchTerm = jandiSearchInput.value;
        currentPage = 1;
        renderPagedHeatmaps(true);
    }, 300));

    jandiPageSizeSelect.addEventListener('change', () => {
        pageSize = parseInt(jandiPageSizeSelect.value, 10);
        currentPage = 1;
        renderPagedHeatmaps(true);
    });

    sortAscButton.addEventListener('click', () => {
        sortOrder = 'asc';
        currentPage = 1;
        renderPagedHeatmaps();
    });

    sortDescButton.addEventListener('click', () => {
        sortOrder = 'desc';
        currentPage = 1;
        renderPagedHeatmaps();
    });
    



    const downloadExcelTemplateBtn = document.getElementById('downloadExcelTemplateBtn');
    if (downloadExcelTemplateBtn) {
        downloadExcelTemplateBtn.addEventListener('click', downloadExcelTemplate);
    }



    fetchAllData();
}