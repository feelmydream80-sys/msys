

window.ApiKeyMngrUI = window.ApiKeyMngrUI || {};




window.ApiKeyMngrUI.currentFilter = 'all';
window.ApiKeyMngrUI.riskMailFilter = 'all';
window.ApiKeyMngrUI.currentPage = 1;
window.ApiKeyMngrUI.itemsPerPage = 10;
window.ApiKeyMngrUI.mailSendHistoryPage = 1;
window.ApiKeyMngrUI.mailSendHistoryPageSize = 50;
window.ApiKeyMngrUI.mailSendHistoryFilters = {};
window.ApiKeyMngrUI.previewSampleData = null;






window.ApiKeyMngrUI.getPageSize = function() {
    const select = document.getElementById('page-size-select');
    return select ? parseInt(select.value) : 10;
};


window.ApiKeyMngrUI.getRiskPageSize = function() {
    const select = document.getElementById('risk-page-size-select');
    return select ? parseInt(select.value) : 10;
};


window.ApiKeyMngrUI.formatDate = function(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


window.ApiKeyMngrUI.showLoading = function(show) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        if (show) {
            loadingElement.classList.remove('hidden');
        } else {
            loadingElement.classList.add('hidden');
        }
    }
};


window.ApiKeyMngrUI.hideLoading = function() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.classList.add('hidden');
    }
};


window.ApiKeyMngrUI.showSuccessMessage = function(message) {
    alert(message);
};


window.ApiKeyMngrUI.showErrorMessage = function(message) {
    alert(message);
};


window.ApiKeyMngrUI.getParticle = function(word, particle) {
    if (!word) return '';
    const lastChar = word.charCodeAt(word.length - 1);
    const hasJongseong = (lastChar - 0xAC00) % 28 !== 0;
    if (particle === 'iga') {
        return hasJongseong ? '이' : '가';
    }
    return '';
};






window.ApiKeyMngrUI.setupTabNavigation = function() {
    const tabs = document.querySelectorAll('#api_key_mngr_page .tab-button');
    const tabContents = document.querySelectorAll('#api_key_mngr_page .tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = tab.dataset.tab;


            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));


            tab.classList.add('active');
            const contentId = `content${tabId}`;
            const content = document.getElementById(contentId);
            if (content) {
                content.classList.add('active');
            }


            if (tabId === '0') {

                window.ApiKeyMngrUI.handlePageLoad();
            } else if (tabId === '1') {

                window.ApiKeyMngrUI.loadApiKeyExpiryInfo();
            } else if (tabId === '2') {


                window.ApiKeyMngrUI.riskMailFilter = 'all';
                document.querySelectorAll('.risk-mail-filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.filter === 'all') {
                        btn.classList.add('active');
                    }
                });

                window.ApiKeyMngrUI.loadRiskGroupData();
            } else if (tabId === '3') {

                window.ApiKeyMngrUI.loadMailSettings();
                window.ApiKeyMngrUI.loadEventLog();
                window.ApiKeyMngrUI.loadScheduleSettings();
            }
        });
    });
};


window.ApiKeyMngrUI.setupApiTabNavigation = function() {
    const apiTabs = document.querySelectorAll('.api-tab-btn');
    const normalContainer = document.getElementById('normal-api-table-container');
    const abnormalContainer = document.getElementById('abnormal-api-table-container');

    apiTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const apiTab = tab.dataset.apiTab;


            apiTabs.forEach(t => {
                t.classList.remove('active');
            });


            tab.classList.add('active');


            if (apiTab === 'normal') {
                normalContainer.classList.remove('hidden');
                abnormalContainer.classList.add('hidden');
                window.ApiKeyMngrUI.renderApiKeyMngrTable();
            } else if (apiTab === 'abnormal') {
                normalContainer.classList.add('hidden');
                abnormalContainer.classList.remove('hidden');
                window.ApiKeyMngrUI.renderAbnormalApiKeyMngrTable();
            }
        });
    });
};


window.ApiKeyMngrUI.setupSettingTabNavigation = function() {
    const settingTabs = document.querySelectorAll('.setting-tab-btn');
    const settingContents = document.querySelectorAll('.setting-tab-content');

    settingTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const settingTabId = tab.dataset.settingTab;


            settingTabs.forEach(t => {
                t.classList.remove('active');
                t.classList.remove('border-blue-600', 'text-blue-600');
                t.classList.add('border-transparent', 'text-gray-500');
            });


            settingContents.forEach(c => c.classList.add('hidden'));


            tab.classList.add('active');
            tab.classList.add('border-blue-600', 'text-blue-600');
            tab.classList.remove('border-transparent', 'text-gray-500');


            const contentId = `setting-${settingTabId}`;
            const content = document.getElementById(contentId);
            if (content) {
                content.classList.remove('hidden');
            }


            if (settingTabId === 'schedule') {
                window.ApiKeyMngrUI.loadScheduleSettings();
                window.ApiKeyMngrUI.loadMailSendHistory();
            }
        });
    });
};






window.ApiKeyMngrUI.setupPageSizeSelect = function() {
    const pageSizeSelect = document.getElementById('page-size-select');
    const riskPageSizeSelect = document.getElementById('risk-page-size-select');

    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', () => {
            window.ApiKeyMngrUI.renderApiKeyMngrTable();
            window.ApiKeyMngrUI.renderAbnormalApiKeyMngrTable();
        });
    }

    if (riskPageSizeSelect) {
        riskPageSizeSelect.addEventListener('change', () => {
            window.ApiKeyMngrUI.renderRiskApiKeyMngrTable();
        });
    }
};


window.ApiKeyMngrUI.setupUpdateCdButton = function() {
    const updateCdButton = document.getElementById('update-cd-button');
    if (updateCdButton) {
        updateCdButton.addEventListener('click', async () => {
            window.ApiKeyMngrUI.showLoading(true);
            try {

                const response = await fetch('/api/mngr_sett/settings/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                
                if (typeof showToast === 'function') {
                    showToast(result.message, 'success');
                } else {
                    alert(result.message);
                }
                

                await window.ApiKeyMngrUI.handlePageLoad();
            } catch (error) {

                if (typeof showToast === 'function') {
                    showToast('설정 동기화 실패: ' + error.message, 'error');
                } else {
                    alert('설정 동기화 중 오류가 발생했습니다.');
                }
            } finally {
                window.ApiKeyMngrUI.hideLoading();
            }
        });
    }
};


window.ApiKeyMngrUI.setupScheduleInfoUpdate = function() {

    const schd30Cycle = document.getElementById('schd_30_cycle');
    const schd30Hour = document.getElementById('schd_30_hour');
    if (schd30Cycle && schd30Hour) {
        schd30Cycle.addEventListener('change', () => window.ApiKeyMngrUI.updateScheduleInfo('30'));
        schd30Hour.addEventListener('change', () => window.ApiKeyMngrUI.updateScheduleInfo('30'));
    }


    const schd7Cycle = document.getElementById('schd_7_cycle');
    const schd7Hour = document.getElementById('schd_7_hour');
    if (schd7Cycle && schd7Hour) {
        schd7Cycle.addEventListener('change', () => window.ApiKeyMngrUI.updateScheduleInfo('7'));
        schd7Hour.addEventListener('change', () => window.ApiKeyMngrUI.updateScheduleInfo('7'));
    }


    const schd0Cycle = document.getElementById('schd_0_cycle');
    const schd0Hour = document.getElementById('schd_0_hour');
    if (schd0Cycle && schd0Hour) {
        schd0Cycle.addEventListener('change', () => window.ApiKeyMngrUI.updateScheduleInfo('0'));
        schd0Hour.addEventListener('change', () => window.ApiKeyMngrUI.updateScheduleInfo('0'));
    }
};


window.ApiKeyMngrUI.setupGanttEventListeners = function() {
    document.addEventListener('mousemove', e => {
        const tip = document.getElementById('tooltip');
        if (tip && tip.style.display !== 'none') {
            window.ApiKeyMngrUI.moveTip(e);
        }
    });
};






window.ApiKeyMngrUI.handlePageLoad = async function() {
    window.ApiKeyMngrUI.showLoading(true);
    try {
        const success = await ApiKeyMngrData.loadApiKeyMngrData();
        if (success) {
            window.ApiKeyMngrUI.renderApiKeyMngrTable();
            window.ApiKeyMngrUI.renderAbnormalApiKeyMngrTable();
            window.ApiKeyMngrUI.renderApiKeyExpiryChart();
        } else {
            alert('API 키 관리 데이터 로드에 실패했습니다.');
        }
    } catch (error) {

        alert('API 키 관리 데이터 로드 중 오류가 발생했습니다.');
    } finally {
        window.ApiKeyMngrUI.hideLoading();
    }
};


window.ApiKeyMngrUI.handlePageLoadPaged = async function(page = 1, pageSize = 100) {
    window.ApiKeyMngrUI.showLoading(true);
    try {
        const result = await ApiKeyMngrData.loadApiKeyMngrDataPaged(page, pageSize);
        if (result.success) {
            window.ApiKeyMngrUI.renderApiKeyMngrTable();
            window.ApiKeyMngrUI.renderAbnormalApiKeyMngrTable();
            window.ApiKeyMngrUI.renderApiKeyExpiryChart();

        } else {
            alert('API 키 관리 데이터 로드에 실패했습니다.');
        }
    } catch (error) {

        alert('API 키 관리 데이터 로드 중 오류가 발생했습니다.');
    } finally {
        window.ApiKeyMngrUI.hideLoading();
    }
};


window.ApiKeyMngrUI.loadApiKeyExpiryInfo = async function() {
    window.ApiKeyMngrUI.showLoading(true);
    try {

        const success = await ApiKeyMngrData.loadApiKeyMngrData();
        if (success) {

            window.ApiKeyMngrUI.renderGanttChart();
        } else {
            window.ApiKeyMngrUI.showErrorMessage('API 키 유통기한 정보를 불러오는 데 실패했습니다.');
        }
    } catch (error) {

        window.ApiKeyMngrUI.showErrorMessage('API 키 유통기한 정보를 불러오는 데 실패했습니다.');
    } finally {
        window.ApiKeyMngrUI.hideLoading();
    }
};


window.ApiKeyMngrUI.loadRiskGroupData = async function() {
    window.ApiKeyMngrUI.showLoading(true);
    try {

        const success = await ApiKeyMngrData.loadApiKeyMngrData();
        if (success) {

            window.ApiKeyMngrUI.renderRiskApiKeyMngrTable();
        } else {
            window.ApiKeyMngrUI.showErrorMessage('위험군 정보를 불러오는 데 실패했습니다.');
        }
    } catch (error) {

        window.ApiKeyMngrUI.showErrorMessage('위험군 정보를 불러오는 데 실패했습니다.');
    } finally {
        window.ApiKeyMngrUI.hideLoading();
    }
};


window.ApiKeyMngrUI.updateScheduleInfo = function(type) {
    const cycle = document.getElementById(`schd_${type}_cycle`)?.value || '1';
    const hour = document.getElementById(`schd_${type}_hour`)?.value || '0';
    const infoEl = document.getElementById(`schd_${type}_info`);
    
    if (infoEl) {
        const hourStr = hour.padStart(2, '0');
        infoEl.textContent = `[${cycle}]일 [${hourStr}]시`;
    }
};


window.ApiKeyMngrUI.setupSearchEvent = function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                window.ApiKeyMngrUI.handleSearchWithBackend();
            }, 300);
        });


        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                clearTimeout(debounceTimer);
                window.ApiKeyMngrUI.handleSearchWithBackend();
            }
        });
    }
};


window.ApiKeyMngrUI.init = function() {

    window.ApiKeyMngrUI.handlePageLoad();


    window.ApiKeyMngrUI.setupTabNavigation();


    window.ApiKeyMngrUI.setupApiTabNavigation();


    window.ApiKeyMngrUI.setupSettingTabNavigation();


    window.ApiKeyMngrUI.setupUpdateCdButton();


    window.ApiKeyMngrUI.setupPageSizeSelect();


    window.ApiKeyMngrUI.setupScheduleInfoUpdate();


    window.ApiKeyMngrUI.setupSearchEvent();
};
