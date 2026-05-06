import { getRandomColorForAdmin } from '../mngr_sett/adminUtils.js';
import { showConfirm } from '../common/utils.js';
import { showToast } from '../../utils/toast.js';
import { saveIconApi } from '../common/api/mngr_sett.js';
import { getIcons, refreshIconsData } from '../mngr_sett/data.js';








let eventHandlers = {};


export function initUI(handlers) {
    eventHandlers = handlers;
}


export function setupTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(item => item.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            tab.classList.add('active');
            const targetTab = document.getElementById(tab.dataset.tab);
            if (targetTab) {
                targetTab.classList.add('active');
            }


            if (tab.dataset.tab === 'statistics') {

            }


            if (tab.dataset.tab === 'userAccessInfo' && window.userAccessInfo) {
                window.userAccessInfo.updateMonthHeaders();
                window.userAccessInfo.updateThresholdInputs();
                window.userAccessInfo.refresh(1, null, null, true);
            }
        });
    });
}



window._mngrSettState = {
    settingsCurrentPage: 1,
    chartSettingsCurrentPage: 1,
    iconsCurrentPage: 1,
    settingsItemsPerPage: 10,
    chartSettingsItemsPerPage: 10,
    iconsItemsPerPage: 10,
    settingsSearchTerm: null,
    settingsTotalCount: 0,
    settingsTotalPages: 0
};

const itemsPerPageOptions = [5, 10, 20, 50, 100];


let settingsCurrentPage = window._mngrSettState.settingsCurrentPage;
let chartSettingsCurrentPage = window._mngrSettState.chartSettingsCurrentPage;
let iconsCurrentPage = window._mngrSettState.iconsCurrentPage;
let settingsItemsPerPage = window._mngrSettState.settingsItemsPerPage;
let chartSettingsItemsPerPage = window._mngrSettState.chartSettingsItemsPerPage;
let iconsItemsPerPage = window._mngrSettState.iconsItemsPerPage;
let settingsSearchTerm = window._mngrSettState.settingsSearchTerm;
let settingsTotalCount = window._mngrSettState.settingsTotalCount;
let settingsTotalPages = window._mngrSettState.settingsTotalPages;


function updateSearchResultInfo() {
    const container = document.getElementById('mngr_sett_page');
    if (!container) return;
    

    const settingsTotalCountSpan = container.querySelector('#settingsTotalCount');
    if (settingsTotalCountSpan) {
        settingsTotalCountSpan.textContent = `(전체 ${settingsTotalCount}건)`;
    }
    
    const searchResultInfo = container.querySelector('#searchResultInfo');
    const searchResultText = container.querySelector('#searchResultText');
    if (!searchResultInfo || !searchResultText) return;
    
    if (settingsSearchTerm) {
        searchResultText.textContent = `'${settingsSearchTerm}' 검색 결과: ${settingsTotalCount}건`;
        searchResultInfo.style.display = 'block';
    } else {
        searchResultInfo.style.display = 'none';
    }
}


function renderServerSidePagination() {
    const container = document.getElementById('mngr_sett_page');
    if (!container) return;
    
    const settingsTable = container.querySelector('#settingsTable');
    if (!settingsTable) return;
    

    const existingPagination = document.getElementById('settingsPagination');
    if (existingPagination) {
        existingPagination.remove();
    }
    

    if (settingsTotalPages <= 1) return;
    
    const paginationContainer = document.createElement('div');
    paginationContainer.id = 'settingsPagination';
    paginationContainer.style.cssText = 'margin-top: 15px; display: flex; gap: 5px; justify-content: center; align-items: center;';
    

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '이전';
    prevBtn.className = 'btn';
    prevBtn.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;';
    prevBtn.disabled = settingsCurrentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (settingsCurrentPage > 1) {
            settingsCurrentPage--;
            window._mngrSettState.settingsCurrentPage = settingsCurrentPage;
            loadPageDataWithPagination();
        }
    });
    

    const pageNumbersContainer = document.createElement('div');
    pageNumbersContainer.style.cssText = 'display: flex; gap: 5px;';
    

    let startPage = Math.max(1, settingsCurrentPage - 2);
    let endPage = Math.min(settingsTotalPages, startPage + 4);
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = `btn ${i === settingsCurrentPage ? 'btn-primary' : ''}`;
        pageBtn.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;';
        if (i === settingsCurrentPage) {
            pageBtn.style.backgroundColor = '#007bff';
            pageBtn.style.color = 'white';
            pageBtn.style.borderColor = '#007bff';
        }
        pageBtn.addEventListener('click', () => {
            settingsCurrentPage = i;
            window._mngrSettState.settingsCurrentPage = settingsCurrentPage;
            loadPageDataWithPagination();
        });
        pageNumbersContainer.appendChild(pageBtn);
    }
    

    const nextBtn = document.createElement('button');
    nextBtn.textContent = '다음';
    nextBtn.className = 'btn';
    nextBtn.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;';
    nextBtn.disabled = settingsCurrentPage === settingsTotalPages;
    nextBtn.addEventListener('click', () => {
        if (settingsCurrentPage < settingsTotalPages) {
            settingsCurrentPage++;
            window._mngrSettState.settingsCurrentPage = settingsCurrentPage;
            loadPageDataWithPagination();
        }
    });
    

    const itemsPerPageSelect = document.createElement('select');
    itemsPerPageSelect.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; margin-right: 15px;';
    itemsPerPageOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = `${option} 건`;
        if (option === settingsItemsPerPage) {
            optionElement.selected = true;
        }
        itemsPerPageSelect.appendChild(optionElement);
    });
    itemsPerPageSelect.addEventListener('change', (e) => {
        settingsItemsPerPage = parseInt(e.target.value);
        settingsCurrentPage = 1;
        window._mngrSettState.settingsItemsPerPage = settingsItemsPerPage;
        window._mngrSettState.settingsCurrentPage = settingsCurrentPage;
        loadPageDataWithPagination();
    });
    
    paginationContainer.appendChild(itemsPerPageSelect);
    paginationContainer.appendChild(prevBtn);
    paginationContainer.appendChild(pageNumbersContainer);
    paginationContainer.appendChild(nextBtn);
    settingsTable.parentNode.appendChild(paginationContainer);
}


function loadPageDataWithPagination() {

    const scrollPosition = window.scrollY || document.documentElement.scrollTop || 0;
    
    if (typeof window.loadPageData === 'function') {
        window.loadPageData({
            page: settingsCurrentPage,
            perPage: settingsItemsPerPage,
            searchTerm: settingsSearchTerm
        }).then(() => {


            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    window.scrollTo(0, scrollPosition);
                });
            });
        }).catch(() => {

            window.scrollTo(0, scrollPosition);
        });
    }
}


function setupIconsItemsPerPageListener() {
    const select = document.getElementById('iconsItemsPerPage');
    if (select) {
        select.addEventListener('change', (e) => {
            iconsItemsPerPage = parseInt(e.target.value);
            iconsCurrentPage = 1;

            if (typeof window.loadPageData === 'function') {
                window.loadPageData();
            }
        });
    }
}


function setupSettingsItemsPerPageListener() {
    const select = document.getElementById('settingsItemsPerPage');
    if (select) {
        select.addEventListener('change', (e) => {
            settingsItemsPerPage = parseInt(e.target.value);
            settingsCurrentPage = 1;


            if (typeof window.loadPageData === 'function') {
                window.loadPageData();
            }
        });
    }
}


function setupChartSettingsItemsPerPageListener() {
    const select = document.getElementById('chartSettingsItemsPerPage');
    if (select) {
        select.addEventListener('change', (e) => {
            chartSettingsItemsPerPage = parseInt(e.target.value);
            chartSettingsCurrentPage = 1;

            if (typeof window.loadPageData === 'function') {
                window.loadPageData();
            }
        });
    }
}


export function initSettingsPagination() {
    setupSettingsItemsPerPageListener();
    setupChartSettingsItemsPerPageListener();
    setupIconsItemsPerPageListener();
}


export function renderSettingsTable(allMngrSett, allIcons, paginationInfo = null) {
    
    const container = document.getElementById('mngr_sett_page');
    if (!container) return;
    const settingsTableBody = container.querySelector('#settingsTableBody');
    if (!settingsTableBody) return;

    settingsTableBody.innerHTML = '';


    const isServerPaging = paginationInfo !== null;
    

    if (isServerPaging) {
        settingsTotalCount = paginationInfo.total || 0;
        settingsTotalPages = paginationInfo.total_pages || 0;
    }

    if (!allMngrSett || allMngrSett.length === 0) {
        const emptyMessage = isServerPaging && settingsSearchTerm 
            ? `'${settingsSearchTerm}'에 대한 검색 결과가 없습니다.`
            : '표시할 Job ID가 없습니다. (tb_con_hist에 이력이 있는 Job ID만 표시됩니다.)';
        settingsTableBody.innerHTML = `<tr><td colspan="20" class="text-center py-4">${emptyMessage}</td></tr>`;
        renderChartSettingsTable([]);
        updateSearchResultInfo();
        return;
    }


    let displayData = allMngrSett;
    let sortedMngrSett = allMngrSett;
    if (!isServerPaging) {

        sortedMngrSett = allMngrSett.slice().sort((a, b) => {
            const aNum = parseInt(a.cd.replace('CD', ''));
            const bNum = parseInt(b.cd.replace('CD', ''));
            return aNum - bNum;
        });
        renderChartSettingsTable(sortedMngrSett);


        const startIndex = (settingsCurrentPage - 1) * settingsItemsPerPage;
        const endIndex = startIndex + settingsItemsPerPage;
        displayData = sortedMngrSett.slice(startIndex, endIndex);
    } else {

        renderChartSettingsTable(allMngrSett);
    }


    if (isServerPaging) {
        updateSearchResultInfo();
        renderServerSidePagination();
    }


    displayData.forEach(setting => {
        const row = settingsTableBody.insertRow();
        row.dataset.cd = String(setting.cd);

        const cfFailIconId = setting.cnn_failr_icon_id !== undefined && setting.cnn_failr_icon_id !== null ? parseInt(setting.cnn_failr_icon_id) : null;
        const cfWarningIconId = setting.cnn_warn_icon_id !== undefined && setting.cnn_warn_icon_id !== null ? parseInt(setting.cnn_warn_icon_id) : null;
        const cfSuccessIconId = setting.cnn_sucs_icon_id !== undefined && setting.cnn_sucs_icon_id !== null ? parseInt(setting.cnn_sucs_icon_id) : null;
        const srSuccessIconId = setting.sucs_rt_sucs_icon_id !== undefined && setting.sucs_rt_sucs_icon_id !== null ? parseInt(setting.sucs_rt_sucs_icon_id) : null;
        const srWarningIconId = setting.sucs_rt_warn_icon_id !== undefined && setting.sucs_rt_warn_icon_id !== null ? parseInt(setting.sucs_rt_warn_icon_id) : null;

        row.innerHTML = `
            <td class="job-id-cell">${setting.cd}</td>
            <td><input type="text" value="${setting.cd_nm || setting.cd}" data-field="cd_nm" placeholder="Job 이름" readonly disabled></td>
            <td><input type="text" value="${setting.cd_desc || ''}" data-field="cd_desc" placeholder="Job 설명" readonly disabled></td>
            <td><input type="text" value="${setting.item5 || ''}" data-field="item5" placeholder="비고" readonly disabled></td>
            <td><input type="number" value="${setting.cnn_failr_thrs_val || 0}" data-field="cnn_failr_thrs_val"></td>
            <td>
                <select data-field="cnn_failr_icon_id" class="icon-select">
                    <option value="">선택 안 함</option>
                    ${allIcons.filter(icon => icon.icon_dsp_yn === true).map(icon => {
                        const isSelected = icon.icon_id === cfFailIconId;
                        return `<option value="${String(icon.icon_id)}" ${isSelected ? 'selected' : ''}>${icon.icon_cd}</option>`;
                    }).join('')}
                </select>
            </td>
            <td><input type="color" value="${setting.cnn_failr_wrd_colr || '#FF0000'}" data-field="cnn_failr_wrd_colr"></td>
            <td><input type="number" value="${setting.cnn_warn_thrs_val || 0}" data-field="cnn_warn_thrs_val"></td>
            <td>
                <select data-field="cnn_warn_icon_id" class="icon-select">
                    <option value="">선택 안 함</option>
                    ${allIcons.filter(icon => icon.icon_dsp_yn === true).map(icon => `<option value="${String(icon.icon_id)}" ${icon.icon_id === cfWarningIconId ? 'selected' : ''}>${icon.icon_cd}</option>`).join('')}
                </select>
            </td>
            <td><input type="color" value="${setting.cnn_warn_wrd_colr || '#FFA500'}" data-field="cnn_warn_wrd_colr"></td>
            <td>
                <select data-field="cnn_sucs_icon_id" class="icon-select">
                    <option value="">선택 안 함</option>
                    ${allIcons.filter(icon => icon.icon_dsp_yn === true).map(icon => `<option value="${String(icon.icon_id)}" ${icon.icon_id === cfSuccessIconId ? 'selected' : ''}>${icon.icon_cd}</option>`).join('')}
                </select>
            </td>
            <td><input type="color" value="${setting.cnn_sucs_wrd_colr || '#008000'}" data-field="cnn_sucs_wrd_colr"></td>
            <td><input type="number" step="0.01" value="${setting.dly_sucs_rt_thrs_val || 0}" data-field="dly_sucs_rt_thrs_val"></td>
            <td><input type="number" step="0.01" value="${setting.dd7_sucs_rt_thrs_val || 0}" data-field="dd7_sucs_rt_thrs_val"></td>
            <td><input type="number" step="0.01" value="${setting.mthl_sucs_rt_thrs_val || 0}" data-field="mthl_sucs_rt_thrs_val"></td>
            <td><input type="number" step="0.01" value="${setting.mc6_sucs_rt_thrs_val || 0}" data-field="mc6_sucs_rt_thrs_val"></td>
            <td><input type="number" step="0.01" value="${setting.yy1_sucs_rt_thrs_val || 0}" data-field="yy1_sucs_rt_thrs_val"></td>
            <td>
                <select data-field="sucs_rt_sucs_icon_id" class="icon-select">
                    <option value="">선택 안 함</option>
                    ${allIcons.filter(icon => icon.icon_dsp_yn === true).map(icon => `<option value="${String(icon.icon_id)}" ${icon.icon_id === srSuccessIconId ? 'selected' : ''}>${icon.icon_cd}</option>`).join('')}
                </select>
            </td>
            <td><input type="color" value="${setting.sucs_rt_sucs_wrd_colr || '#008000'}" data-field="sucs_rt_sucs_wrd_colr"></td>
            <td>
                <select data-field="sucs_rt_warn_icon_id" class="icon-select">
                    <option value="">선택 안 함</option>
                    ${allIcons.filter(icon => icon.icon_dsp_yn === true).map(icon => `<option value="${String(icon.icon_id)}" ${icon.icon_id === srWarningIconId ? 'selected' : ''}>${icon.icon_cd}</option>`).join('')}
                </select>
            </td>
            <td><input type="color" value="${setting.sucs_rt_warn_wrd_colr || '#FFA500'}" data-field="sucs_rt_warn_wrd_colr"></td>
            <td><input type="checkbox" ${setting.chrt_dsp_yn === true ? 'checked' : ''} data-field="chrt_dsp_yn"></td>
        `;


        const colorInputs = row.querySelectorAll('input[type="color"]');
        colorInputs.forEach(input => {
            input.addEventListener('focus', (e) => {
                if (window.setActiveColorInput) {
                    window.setActiveColorInput(e.target);
                }
            });
        });
    });


    const settingsTable = document.querySelector('#settingsTable');
    if (settingsTable && sortedMngrSett.length > settingsItemsPerPage) {

        const existingPagination = document.getElementById('settingsPagination');
        if (existingPagination) {
            existingPagination.remove();
        }
        
        const paginationContainer = document.createElement('div');
        paginationContainer.id = 'settingsPagination';
        paginationContainer.style.cssText = 'margin-top: 15px; display: flex; gap: 5px; justify-content: center;';
        
        const totalPages = Math.ceil(sortedMngrSett.length / settingsItemsPerPage);
        

        const prevBtn = document.createElement('button');
        prevBtn.textContent = '이전';
        prevBtn.className = 'btn';
        prevBtn.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;';
        prevBtn.disabled = settingsCurrentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (settingsCurrentPage > 1) {
                settingsCurrentPage--;
                renderSettingsTable(allMngrSett, allIcons);
            }
        });
        

        const pageNumbersContainer = document.createElement('div');
        pageNumbersContainer.style.cssText = 'display: flex; gap: 5px;';
        
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = `btn ${i === settingsCurrentPage ? 'btn-primary' : ''}`;
            pageBtn.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;';
            if (i === settingsCurrentPage) {
                pageBtn.style.backgroundColor = '#007bff';
                pageBtn.style.color = 'white';
                pageBtn.style.borderColor = '#007bff';
            }
            pageBtn.addEventListener('click', () => {
                settingsCurrentPage = i;
                renderSettingsTable(allMngrSett, allIcons);
            });
            pageNumbersContainer.appendChild(pageBtn);
        }
        

        const nextBtn = document.createElement('button');
        nextBtn.textContent = '다음';
        nextBtn.className = 'btn';
        nextBtn.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;';
        nextBtn.disabled = settingsCurrentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (settingsCurrentPage < totalPages) {
                settingsCurrentPage++;
                renderSettingsTable(allMngrSett, allIcons);
            }
        });
        

        const itemsPerPageSelect = document.createElement('select');
        itemsPerPageSelect.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; margin-right: 15px;';
        itemsPerPageOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = `${option} 건`;
            if (option === settingsItemsPerPage) {
                optionElement.selected = true;
            }
            itemsPerPageSelect.appendChild(optionElement);
        });
        itemsPerPageSelect.addEventListener('change', (e) => {
            settingsItemsPerPage = parseInt(e.target.value);
            settingsCurrentPage = 1;
            renderSettingsTable(allMngrSett, allIcons);
        });
        
        paginationContainer.appendChild(itemsPerPageSelect);
        paginationContainer.appendChild(prevBtn);
        paginationContainer.appendChild(pageNumbersContainer);
        paginationContainer.appendChild(nextBtn);
        settingsTable.parentNode.appendChild(paginationContainer);
    }
}


export function renderChartSettingsTable(allMngrSett) {
    const container = document.getElementById('mngr_sett_page');
    if (!container) return;
    const chartSettingsTableBody = container.querySelector('#chartSettingsTableBody');
    if (!chartSettingsTableBody) return;

    chartSettingsTableBody.innerHTML = '';

    if (allMngrSett.length === 0) {
        chartSettingsTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">표시할 Job ID가 없습니다.</td></tr>';
        return;
    }


    const startIndex = (chartSettingsCurrentPage - 1) * chartSettingsItemsPerPage;
    const endIndex = startIndex + chartSettingsItemsPerPage;
    const pagedData = allMngrSett.slice(startIndex, endIndex);

    pagedData.forEach(setting => {
        const row = chartSettingsTableBody.insertRow();
        row.dataset.cd = String(setting.cd);


        const chartColor = setting.chrt_colr || getRandomColorForAdmin();

        row.innerHTML = `
            <td class="job-id-cell">${setting.cd}</td>
            <td><input type="text" value="${setting.cd_nm || setting.cd}" data-field="cd_nm" readonly disabled></td>
            <td><input type="color" value="${chartColor}" data-field="chrt_colr"></td>
            <td><input type="color" value="${setting.grass_chrt_min_colr || '#9be9a8'}" data-field="grass_chrt_min_colr"></td>
            <td><input type="color" value="${setting.grass_chrt_max_colr || '#216e39'}" data-field="grass_chrt_max_colr"></td>
        `;


        const colorInputs = row.querySelectorAll('input[type="color"]');
        colorInputs.forEach(input => {
            input.addEventListener('focus', (e) => {
                if (window.setActiveColorInput) {
                    window.setActiveColorInput(e.target);
                }
            });
        });
    });


    const chartSettingsTable = document.querySelector('#chartSettingsTable');
    if (chartSettingsTable && allMngrSett.length > chartSettingsItemsPerPage) {

        const existingPagination = document.getElementById('chartSettingsPagination');
        if (existingPagination) {
            existingPagination.remove();
        }
        
        const paginationContainer = document.createElement('div');
        paginationContainer.id = 'chartSettingsPagination';
        paginationContainer.style.cssText = 'margin-top: 15px; display: flex; gap: 5px; justify-content: center;';
        
        const totalPages = Math.ceil(allMngrSett.length / chartSettingsItemsPerPage);
        

        const prevBtn = document.createElement('button');
        prevBtn.textContent = '이전';
        prevBtn.className = 'btn';
        prevBtn.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;';
        prevBtn.disabled = chartSettingsCurrentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (chartSettingsCurrentPage > 1) {
                chartSettingsCurrentPage--;
                renderChartSettingsTable(allMngrSett);
            }
        });
        

        const pageNumbersContainer = document.createElement('div');
        pageNumbersContainer.style.cssText = 'display: flex; gap: 5px;';
        
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = `btn ${i === chartSettingsCurrentPage ? 'btn-primary' : ''}`;
            pageBtn.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;';
            if (i === chartSettingsCurrentPage) {
                pageBtn.style.backgroundColor = '#007bff';
                pageBtn.style.color = 'white';
                pageBtn.style.borderColor = '#007bff';
            }
            pageBtn.addEventListener('click', () => {
                chartSettingsCurrentPage = i;
                renderChartSettingsTable(allMngrSett);
            });
            pageNumbersContainer.appendChild(pageBtn);
        }
        

        const nextBtn = document.createElement('button');
        nextBtn.textContent = '다음';
        nextBtn.className = 'btn';
        nextBtn.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;';
        nextBtn.disabled = chartSettingsCurrentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (chartSettingsCurrentPage < totalPages) {
                chartSettingsCurrentPage++;
                renderChartSettingsTable(allMngrSett);
            }
        });
        

        const itemsPerPageSelect = document.createElement('select');
        itemsPerPageSelect.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; margin-right: 15px;';
        itemsPerPageOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = `${option} 건`;
            if (option === chartSettingsItemsPerPage) {
                optionElement.selected = true;
            }
            itemsPerPageSelect.appendChild(optionElement);
        });
        itemsPerPageSelect.addEventListener('change', (e) => {
            chartSettingsItemsPerPage = parseInt(e.target.value);
            chartSettingsCurrentPage = 1;
            renderChartSettingsTable(allMngrSett);
        });
        
        paginationContainer.appendChild(itemsPerPageSelect);
        paginationContainer.appendChild(prevBtn);
        paginationContainer.appendChild(pageNumbersContainer);
        paginationContainer.appendChild(nextBtn);
        chartSettingsTable.parentNode.appendChild(paginationContainer);
    }
}


export function populateIconSelects(allIcons) {
    const iconSelects = document.querySelectorAll('.icon-select');
    iconSelects.forEach(select => {
        const currentSelectedValue = select.value;
        select.innerHTML = '<option value="">선택 안 함</option>';

        allIcons.filter(icon => icon.icon_dsp_yn === true).forEach(icon => {
            const option = document.createElement('option');
            option.value = String(icon.icon_id);
            option.innerHTML = `${icon.icon_cd}`;
            select.appendChild(option);
        });

        if (currentSelectedValue) {
            const parsedCurrentValue = parseInt(currentSelectedValue);

            const targetOption = Array.from(select.options).find(option => parseInt(option.value) === parsedCurrentValue);
            if (targetOption) {
                select.value = targetOption.value;
            } else {
                select.value = "";
            }
        }
    });
}


export function renderIconTable(allIcons) {
    const container = document.getElementById('mngr_sett_page');
    if (!container) return;
    const iconTableBody = container.querySelector('#iconTableBody');
    if (!iconTableBody) return;

    iconTableBody.innerHTML = '';

    if (allIcons.length === 0) {
        iconTableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">등록된 아이콘이 없습니다.</td></tr>';
        return;
    }


    const startIndex = (iconsCurrentPage - 1) * iconsItemsPerPage;
    const endIndex = startIndex + iconsItemsPerPage;
    const pagedData = allIcons.slice(startIndex, endIndex);

    pagedData.forEach(icon => {
        const row = iconTableBody.insertRow();
        row.dataset.iconId = icon.icon_id;
        row.innerHTML = `
            <td class="px-4 py-2 border-b">${icon.icon_id}</td>
            <td class="px-4 py-2 border-b icon-cd-cell">${icon.icon_cd}</td>
            <td class="px-4 py-2 border-b icon-nm-cell">${icon.icon_nm}</td>
            <td class="px-4 py-2 border-b icon-expl-cell">${icon.icon_expl || ''}</td>
            <td class="px-4 py-2 border-b">
                <input type="checkbox" class="toggle-display-yn" data-icon-id="${icon.icon_id}" ${icon.icon_dsp_yn === true ? 'checked' : ''}>
            </td>
            <td class="px-4 py-2 border-b action-buttons">
                <button class="edit-icon-btn bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-24 rounded-md mr-2" data-icon-id="${icon.icon_id}" style="height:28px; font-size:0.85em; display:inline-flex; align-items:center; justify-content:center;">수정</button>
                <button class="delete-icon-btn bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-24 rounded-md" data-icon-id="${icon.icon_id}" style="height:28px; font-size:0.85em; display:inline-flex; align-items:center; justify-content:center;">삭제</button>
                <button class="save-icon-btn bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-24 rounded-md mr-2" data-icon-id="${icon.icon_id}" style="height:28px; font-size:0.85em; display:inline-flex; align-items:center; justify-content:center; display:none;">저장</button>
                <button class="cancel-edit-btn bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-24 rounded-md" data-icon-id="${icon.icon_id}" style="height:28px; font-size:0.85em; display:inline-flex; align-items:center; justify-content:center; display:none;">취소</button>
            </td>
        `;
    });

    iconTableBody.querySelectorAll('.toggle-display-yn').forEach(checkbox => {
        checkbox.addEventListener('change', eventHandlers.toggleIconDisplayStatus);
    });
    iconTableBody.querySelectorAll('.edit-icon-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const iconId = parseInt(event.currentTarget.dataset.iconId);
            const row = event.currentTarget.closest('tr');
            enterEditMode(row, allIcons);
        });
    });
    iconTableBody.querySelectorAll('.delete-icon-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const iconId = parseInt(event.currentTarget.dataset.iconId);
            if (eventHandlers.confirmAndDeleteIcon) {
                eventHandlers.confirmAndDeleteIcon(iconId);
            }
        });
    });
    iconTableBody.querySelectorAll('.save-icon-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const iconId = parseInt(event.currentTarget.dataset.iconId);
            const row = event.currentTarget.closest('tr');
            saveEdit(row, allIcons);
        });
    });
    iconTableBody.querySelectorAll('.cancel-edit-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const iconId = parseInt(event.currentTarget.dataset.iconId);
            const row = event.currentTarget.closest('tr');
            exitEditMode(row, allIcons);
        });
    });


    const iconsPaginationContainer = document.getElementById('iconsPagination');
    if (iconsPaginationContainer && allIcons.length > iconsItemsPerPage) {

        iconsPaginationContainer.innerHTML = '';
        
        const totalPages = Math.ceil(allIcons.length / iconsItemsPerPage);
        

        const prevBtn = document.createElement('button');
        prevBtn.textContent = '이전';
        prevBtn.className = 'btn';
        prevBtn.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;';
        prevBtn.disabled = iconsCurrentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (iconsCurrentPage > 1) {
                iconsCurrentPage--;
                renderIconTable(allIcons);
            }
        });
        

        const pageNumbersContainer = document.createElement('div');
        pageNumbersContainer.style.cssText = 'display: flex; gap: 5px;';
        
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = `btn ${i === iconsCurrentPage ? 'btn-primary' : ''}`;
            pageBtn.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;';
            if (i === iconsCurrentPage) {
                pageBtn.style.backgroundColor = '#007bff';
                pageBtn.style.color = 'white';
                pageBtn.style.borderColor = '#007bff';
            }
            pageBtn.addEventListener('click', () => {
                iconsCurrentPage = i;
                renderIconTable(allIcons);
            });
            pageNumbersContainer.appendChild(pageBtn);
        }
        

        const nextBtn = document.createElement('button');
        nextBtn.textContent = '다음';
        nextBtn.className = 'btn';
        nextBtn.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;';
        nextBtn.disabled = iconsCurrentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (iconsCurrentPage < totalPages) {
                iconsCurrentPage++;
                renderIconTable(allIcons);
            }
        });
        

        const itemsPerPageSelect = document.createElement('select');
        itemsPerPageSelect.style.cssText = 'padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px; margin-right: 15px;';
        itemsPerPageOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = `${option} 건`;
            if (option === iconsItemsPerPage) {
                optionElement.selected = true;
            }
            itemsPerPageSelect.appendChild(optionElement);
        });
        itemsPerPageSelect.addEventListener('change', (e) => {
            iconsItemsPerPage = parseInt(e.target.value);
            iconsCurrentPage = 1;
            renderIconTable(allIcons);
        });
        
        iconsPaginationContainer.appendChild(itemsPerPageSelect);
        iconsPaginationContainer.appendChild(prevBtn);
        iconsPaginationContainer.appendChild(pageNumbersContainer);
        iconsPaginationContainer.appendChild(nextBtn);
    } else if (iconsPaginationContainer) {

        iconsPaginationContainer.innerHTML = '';
    }
}


function enterEditMode(row, allIcons) {
    const iconId = parseInt(row.dataset.iconId);
    const icon = allIcons.find(i => i.icon_id === iconId);


    const iconCdCell = row.querySelector('.icon-cd-cell');
    const iconNmCell = row.querySelector('.icon-nm-cell');
    const iconExplCell = row.querySelector('.icon-expl-cell');

    iconCdCell.innerHTML = `<input type="text" value="${icon.icon_cd}" class="edit-input w-full text-center" style="border: 1px dashed #666; padding: 4px;">`;
    iconNmCell.innerHTML = `<input type="text" value="${icon.icon_nm}" class="edit-input w-full text-center" style="border: 1px dashed #666; padding: 4px;">`;
    iconExplCell.innerHTML = `<input type="text" value="${icon.icon_expl || ''}" class="edit-input w-full text-center" style="border: 1px dashed #666; padding: 4px;">`;


    row.querySelector('.edit-icon-btn').style.display = 'none';
    row.querySelector('.delete-icon-btn').style.display = 'none';
    row.querySelector('.save-icon-btn').style.display = 'inline-block';
    row.querySelector('.cancel-edit-btn').style.display = 'inline-block';
}


function exitEditMode(row, allIcons) {
    const iconId = parseInt(row.dataset.iconId);
    const icon = allIcons.find(i => i.icon_id === iconId);


    const iconCdCell = row.querySelector('.icon-cd-cell');
    const iconNmCell = row.querySelector('.icon-nm-cell');
    const iconExplCell = row.querySelector('.icon-expl-cell');

    iconCdCell.textContent = icon.icon_cd;
    iconNmCell.textContent = icon.icon_nm;
    iconExplCell.textContent = icon.icon_expl || '';


    row.querySelector('.edit-icon-btn').style.display = 'inline-flex';
    row.querySelector('.delete-icon-btn').style.display = 'inline-flex';
    row.querySelector('.save-icon-btn').style.display = 'none';
    row.querySelector('.cancel-edit-btn').style.display = 'none';
}


function saveEdit(row, allIcons) {
    const iconId = parseInt(row.dataset.iconId);
    const icon = allIcons.find(i => i.icon_id === iconId);


    const iconCdInput = row.querySelector('.icon-cd-cell input');
    const iconNmInput = row.querySelector('.icon-nm-cell input');
    const iconExplInput = row.querySelector('.icon-expl-cell input');


    const updatedIcon = {
        ICON_ID: icon.icon_id,
        ICON_CD: iconCdInput.value,
        ICON_NM: iconNmInput.value,
        ICON_EXPL: iconExplInput.value,
        ICON_DSP_YN: icon.icon_dsp_yn
    };


    saveIconApi(updatedIcon)
        .then(() => {
            showToast('아이콘 정보가 성공적으로 업데이트되었습니다.', 'success');

            refreshIconsData()
                .then(updatedIcons => {
                    exitEditMode(row, updatedIcons);

                    renderIconTable(updatedIcons);

                    populateIconSelects(updatedIcons);
                })
                .catch(error => {
                    exitEditMode(row, allIcons);
                    renderIconTable(allIcons);
                    populateIconSelects(allIcons);
                });
        })
        .catch(error => {
            showToast('아이콘 정보 업데이트 실패: ' + error.message, 'error');
        });
}


export function displayIconForm(iconId, allIcons) {
    const container = document.getElementById('mngr_sett_page');
    if (!container) return;
    const iconFormContainer = container.querySelector('#iconFormContainer');
    const iconFormTitle = container.querySelector('#iconFormTitle');
    const iconIdField = container.querySelector('#iconId');
    const iconCodeField = container.querySelector('#iconCode');
    const iconNameField = container.querySelector('#iconName');
    const iconDescriptionField = container.querySelector('#iconDescription');
    const iconDisplayYnField = container.querySelector('#iconDisplayYn');
    const saveIconButton = container.querySelector('#saveIconBtn');
    const cancelEditIconButton = container.querySelector('#cancelIconEditBtn');

    if (iconId) {
        iconFormTitle.textContent = '아이콘 수정';
        const icon = allIcons.find(i => i.icon_id === iconId);
        if (icon) {
            iconIdField.value = icon.icon_id;
            iconCodeField.value = icon.icon_cd || '';
            iconNameField.value = icon.icon_nm || '';
            iconDescriptionField.value = icon.icon_expl || '';
            iconDisplayYnField.value = icon.icon_dsp_yn === true ? 'Y' : 'N';
        }
    } else {
        iconFormTitle.textContent = '새 아이콘 추가';
        iconIdField.value = '';
        iconCodeField.value = '';
        iconNameField.value = '';
        iconDescriptionField.value = '';
        iconDisplayYnField.value = 'Y';
    }
    iconFormContainer.classList.remove('hidden');
    saveIconButton.textContent = iconId ? '아이콘 업데이트' : '아이콘 추가';
    cancelEditIconButton.style.display = 'inline-block';
}


export function hideIconForm() {
    const container = document.getElementById('mngr_sett_page');
    if (!container) return;
    const iconFormContainer = container.querySelector('#iconFormContainer');
    const iconIdInput = container.querySelector('#iconId');
    const iconCodeInput = container.querySelector('#iconCode');
    const iconNameInput = container.querySelector('#iconName');
    const iconDescriptionInput = container.querySelector('#iconDescription');
    const iconDisplayYn = container.querySelector('#iconDisplayYn');
    const saveIconButton = container.querySelector('#saveIconBtn');
    const cancelEditIconButton = container.querySelector('#cancelIconEditBtn');

    if (iconFormContainer) iconFormContainer.classList.add('hidden');
    if (iconIdInput) iconIdInput.value = '';
    if (iconCodeInput) iconCodeInput.value = '';
    if (iconNameInput) iconNameInput.value = '';
    if (iconDescriptionInput) iconDescriptionInput.value = '';
    if (iconDisplayYn) iconDisplayYn.value = 'Y';
    if (saveIconButton) saveIconButton.textContent = '아이콘 추가';
    if (cancelEditIconButton) cancelEditIconButton.style.display = 'none';
}
