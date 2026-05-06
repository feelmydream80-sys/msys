

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


window.ApiKeyMngrUI.showBatchEditModal = function() {
    const selectedCds = Array.from(window.ApiKeyMngrUI.selectedCds);
    if (selectedCds.length === 0) {
        alert('수정할 항목을 선택해주세요.');
        return;
    }

    const modal = document.getElementById('batchEditModal');
    const cdsContainer = document.getElementById('batchEditSelectedCds');

    const displayText = selectedCds.length <= 10
        ? selectedCds.join(', ')
        : selectedCds.slice(0, 10).join(', ') + ` 외 ${selectedCds.length - 10}개 (총 ${selectedCds.length}개)`;
    cdsContainer.textContent = displayText;

    document.getElementById('batchEditApiKey').value = '';

    // 기본값 설정: 등록일은 오늘, 기간은 1년
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('batchEditStartDt').value = today;
    document.getElementById('batchEditDue').value = '1';

    // 이메일 select 옵션 구성
    const allData = ApiKeyMngrData.apiKeyMngrData || [];
    const selectedEmails = [...new Set(
        allData
            .filter(item => selectedCds.includes(item.cd))
            .map(item => item.api_ownr_email_addr)
            .filter(email => email && email.trim())
    )];

    const emailSelect = document.getElementById('batchEditEmailSelect');
    const emailInput = document.getElementById('batchEditEmailInput');
    const emailNoData = document.getElementById('batchEditEmailNoData');

    emailSelect.innerHTML = '<option value="">선택해주세요</option>';

    if (selectedEmails.length === 0) {
        // 이메일이 없는 경우: "새로 입력"만 추가하고 자동 선택
        emailSelect.innerHTML += '<option value="__new__" selected>새로 입력</option>';
        emailSelect.disabled = true;
        emailInput.classList.remove('hidden');
        emailInput.disabled = false;
        emailInput.value = '';
        emailNoData.classList.remove('hidden');
    } else {
        // 이메일이 있는 경우: 목록 추가 + "새로 입력" 옵션
        selectedEmails.forEach(email => {
            emailSelect.innerHTML += `<option value="${email}">${email}</option>`;
        });
        emailSelect.innerHTML += '<option value="__new__">새로 입력</option>';
        emailSelect.disabled = false;
        emailInput.classList.add('hidden');
        emailInput.disabled = true;
        emailInput.value = '';
        emailNoData.classList.add('hidden');
    }

    ['email', 'due', 'startDt'].forEach(field => {
        const checkbox = document.getElementById(`batchEditCheck${field.charAt(0).toUpperCase() + field.slice(1)}`);
        if (checkbox) {
            checkbox.checked = false;
            window.ApiKeyMngrUI.toggleBatchField(field);
        }
    });

    modal.classList.remove('hidden');
};


window.ApiKeyMngrUI.hideBatchEditModal = function() {
    const modal = document.getElementById('batchEditModal');
    if (modal) {
        modal.classList.add('hidden');
    }
};


window.ApiKeyMngrUI.toggleBatchField = function(field) {
    const checkboxMap = {
        'email': 'batchEditCheckEmail',
        'due': 'batchEditCheckDue',
        'startDt': 'batchEditCheckStartDt'
    };

    const checkbox = document.getElementById(checkboxMap[field]);
    if (field === 'email') {
        const emailSelect = document.getElementById('batchEditEmailSelect');
        const emailInput = document.getElementById('batchEditEmailInput');
        if (checkbox) {
            const isChecked = checkbox.checked;
            emailSelect.disabled = !isChecked;
            if (isChecked) {
                emailSelect.classList.remove('bg-gray-100');
                // "새로 입력"이 선택된 경우 input도 활성화
                if (emailSelect.value === '__new__') {
                    emailInput.classList.remove('hidden');
                    emailInput.disabled = false;
                    emailInput.classList.remove('bg-gray-100');
                }
            } else {
                emailSelect.classList.add('bg-gray-100');
                emailInput.classList.add('hidden');
                emailInput.disabled = true;
                emailInput.classList.add('bg-gray-100');
            }
        }
    } else {
        const inputMap = {
            'due': 'batchEditDue',
            'startDt': 'batchEditStartDt'
        };
        const input = document.getElementById(inputMap[field]);
        if (checkbox && input) {
            input.disabled = !checkbox.checked;
            if (checkbox.checked) {
                input.classList.remove('bg-gray-100');
            } else {
                input.classList.add('bg-gray-100');
            }
        }
    }
};

window.ApiKeyMngrUI.handleBatchEmailChange = function() {
    const emailSelect = document.getElementById('batchEditEmailSelect');
    const emailInput = document.getElementById('batchEditEmailInput');
    const isNew = emailSelect.value === '__new__';
    if (isNew) {
        emailInput.classList.remove('hidden');
        emailInput.disabled = false;
        emailInput.classList.remove('bg-gray-100');
        emailInput.focus();
    } else {
        emailInput.classList.add('hidden');
        emailInput.disabled = true;
        emailInput.value = '';
    }
};


window.ApiKeyMngrUI.handleBatchUpdate = async function() {
    const apiKey = document.getElementById('batchEditApiKey').value.trim();
    if (!apiKey) {
        alert('API 값은 필수 입력 항목입니다.');
        return;
    }

    const selectedCds = Array.from(window.ApiKeyMngrUI.selectedCds);
    if (selectedCds.length === 0) {
        alert('선택된 항목이 없습니다.');
        return;
    }

    const fields = {
        api_key: apiKey
    };

    if (document.getElementById('batchEditCheckEmail').checked) {
        const emailSelect = document.getElementById('batchEditEmailSelect');
        let email = '';
        if (emailSelect.value === '__new__') {
            email = document.getElementById('batchEditEmailInput').value.trim();
        } else {
            email = emailSelect.value;
        }
        if (email) fields.api_ownr_email_addr = email;
    }
    if (document.getElementById('batchEditCheckDue').checked) {
        const due = parseInt(document.getElementById('batchEditDue').value);
        if (due && due > 0) fields.due = due;
    }
    if (document.getElementById('batchEditCheckStartDt').checked) {
        const startDt = document.getElementById('batchEditStartDt').value;
        if (startDt) fields.start_dt = startDt;
    }

    window.ApiKeyMngrUI.showLoading(true);
    try {
        const result = await ApiKeyMngrData.batchUpdateApiKeyMngr(selectedCds, fields);
        if (result.success) {
            window.ApiKeyMngrUI.hideBatchEditModal();

            const successCount = result.results?.success?.length || 0;
            const failedCount = result.results?.failed?.length || 0;
            let msg = `일괄 수정 완료\n• 성공: ${successCount}개`;
            if (failedCount > 0) {
                msg += `\n• 실패: ${failedCount}개`;
                result.results.failed.forEach(f => {
                    msg += `\n  - ${f.cd}: ${f.reason}`;
                });
            }
            alert(msg);

            window.ApiKeyMngrUI.selectedCds.clear();
            window.ApiKeyMngrUI.updateBatchEditButtons();

            await ApiKeyMngrData.loadApiKeyMngrData();
            window.ApiKeyMngrUI.renderApiKeyMngrTable();
            window.ApiKeyMngrUI.renderAbnormalApiKeyMngrTable();
            window.ApiKeyMngrUI.renderGanttChart();
            window.ApiKeyMngrUI.renderRiskApiKeyMngrTable();
        } else {
            alert('일괄 수정에 실패했습니다: ' + (result.message || '알 수 없는 오류'));
        }
    } catch (error) {
        alert('일괄 수정 중 오류가 발생했습니다.');
    } finally {
        window.ApiKeyMngrUI.hideLoading();
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
