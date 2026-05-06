

window.ApiKeyMngrUI = window.ApiKeyMngrUI || {};




window.ApiKeyMngrUI.sortState = {
    normal: { column: 'days_remaining', direction: 'asc' },
    abnormal: { column: 'days_remaining', direction: 'asc' }
};


window.ApiKeyMngrUI.sortData = function(data, column, direction, tableType) {
    if (!column) return data;
    
    return [...data].sort((a, b) => {
        let valA = a[column];
        let valB = b[column];
        

        if (valA === null || valA === undefined) valA = '';
        if (valB === null || valB === undefined) valB = '';
        

        if (column === 'days_remaining' || column === 'due') {
            valA = Number(valA) || 0;
            valB = Number(valB) || 0;
            return direction === 'asc' ? valA - valB : valB - valA;
        }
        

        if (column === 'start_dt') {
            const dateA = new Date(valA);
            const dateB = new Date(valB);
            return direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        if (strA < strB) return direction === 'asc' ? -1 : 1;
        if (strA > strB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
};


window.ApiKeyMngrUI.handleSort = function(column, tableType) {
    const state = window.ApiKeyMngrUI.sortState[tableType];
    if (!state) return;
    

    if (state.column === column) {
        state.direction = state.direction === 'asc' ? 'desc' : 'asc';
    } else {
        state.column = column;
        state.direction = 'asc';
    }
    

    if (tableType === 'normal') {
        window.ApiKeyMngrUI.renderApiKeyMngrTable();
    } else if (tableType === 'abnormal') {
        window.ApiKeyMngrUI.renderAbnormalApiKeyMngrTable();
    }
};


window.ApiKeyMngrUI.getSortIcon = function(column, tableType) {
    const state = window.ApiKeyMngrUI.sortState[tableType];
    if (!state || state.column !== column) {
        return '<span class="ml-1 text-gray-400 text-xs">↕</span>';
    }
    return state.direction === 'asc' 
        ? '<span class="ml-1 text-blue-600 text-xs">↑</span>' 
        : '<span class="ml-1 text-blue-600 text-xs">↓</span>';
};


window.ApiKeyMngrUI.createSortableHeader = function(column, label, tableType) {
    const widths = {
        'cd': '10%', 'cd_nm': '12%', 'api_key': '18%',
        'api_ownr_email_addr': '18%', 'due': '7%',
        'start_dt': '10%', 'days_remaining': '8%'
    };
    const width = widths[column] || 'auto';
    const icon = window.ApiKeyMngrUI.getSortIcon(column, tableType);
    return `<th class="py-4 px-6 text-left font-medium text-gray-600 whitespace-nowrap cursor-pointer hover:bg-gray-200 select-none transition" 
                style="width: ${width};"
                onclick="ApiKeyMngrUI.handleSort('${column}', '${tableType}')">
                ${label}${icon}
            </th>`;
};






window.ApiKeyMngrUI.getFilteredApiKeyMngrData = function(data) {
    const q = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const today = new Date();


    const keys = data.map(k => {
        const endDate = new Date(k.start_dt);
        endDate.setFullYear(endDate.getFullYear() + k.due);
        const daysLeft = Math.ceil((endDate - today) / 86400000);
        let status = 'ok';
        if (daysLeft <= 30 && daysLeft > 0) status = 'expiring-30';
        if (daysLeft <= 7 && daysLeft > 0) status = 'expiring-7';
        if (daysLeft <= 0) status = 'err';

        return {
            ...k,
            status: status,
            daysLeft: daysLeft
        };
    });


    let filtered = keys.filter(k => {
        const matchQ = !q || k.cd.toLowerCase().includes(q) || (k.api_key && k.api_key.toLowerCase().includes(q));
        const matchS = window.ApiKeyMngrUI.currentFilter === 'all' || k.status === window.ApiKeyMngrUI.currentFilter;
        return matchQ && matchS;
    });

    return filtered;
};






window.ApiKeyMngrUI.renderApiKeyMngrTable = function(data) {
    const tableBody = document.getElementById('api-key-mngr-table-body');
    const paginationDiv = document.getElementById('api-key-mngr-pagination');
    const tableHead = document.querySelector('#normal-api-table-container thead tr');
    

    let normalData = ApiKeyMngrData.getNormalApiKeyMngrData();
    

    normalData = window.ApiKeyMngrUI.getFilteredApiKeyMngrData(normalData);
    

    const sortState = window.ApiKeyMngrUI.sortState.normal;
    normalData = window.ApiKeyMngrUI.sortData(normalData, sortState.column, sortState.direction, 'normal');
    

    if (tableHead) {
        tableHead.innerHTML = `
            ${window.ApiKeyMngrUI.createSortableHeader('cd', '코드명', 'normal')}
            ${window.ApiKeyMngrUI.createSortableHeader('cd_nm', '명칭', 'normal')}
            ${window.ApiKeyMngrUI.createSortableHeader('api_key', 'API값', 'normal')}
            ${window.ApiKeyMngrUI.createSortableHeader('api_ownr_email_addr', 'API책임자이메일', 'normal')}
            ${window.ApiKeyMngrUI.createSortableHeader('due', '기간', 'normal')}
            ${window.ApiKeyMngrUI.createSortableHeader('start_dt', '등록일', 'normal')}
            ${window.ApiKeyMngrUI.createSortableHeader('days_remaining', '남은 기간', 'normal')}
            <th class="py-4 px-6 text-left font-medium text-gray-600 whitespace-nowrap" style="width: 10%;">알림 메일 전송</th>
            <th class="py-4 px-6 text-left font-medium text-gray-600 whitespace-nowrap" style="width: 7%;">수정</th>
        `;
    }
    

    const itemsPerPage = window.ApiKeyMngrUI.getPageSize();
    const currentPage = parseInt(localStorage.getItem('apiKeyMngrPage')) || 1;
    const totalPages = Math.max(1, Math.ceil(normalData.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = normalData.slice(startIndex, endIndex);
    



    tableBody.innerHTML = '';
    if (paginatedData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="py-8 px-6 text-center text-gray-500">
                    정상 API 키 관리 데이터가 없습니다.
                </td>
            </tr>
        `;
    } else {
        paginatedData.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition';
            
            const remainingDays = item.days_remaining;

            let remainingDaysClass = 'text-gray-700';
            if (remainingDays <= 0) {
                remainingDaysClass = 'text-red-600 font-medium';
            } else if (remainingDays <= 7) {
                remainingDaysClass = 'text-orange-500 font-medium';
            } else if (remainingDays <= 30) {
                remainingDaysClass = 'text-yellow-600 font-medium';
            } else {
                remainingDaysClass = 'text-green-600 font-medium';
            }
            
            row.innerHTML = `
                <td class="py-4 px-6 font-medium text-gray-800">${item.cd}</td>
                <td class="py-4 px-6 text-gray-700">${item.cd_nm || '-'}</td>
                <td class="py-4 px-6 font-mono text-gray-700">${item.api_key}</td>
                <td class="py-4 px-6 text-gray-700">${item.api_ownr_email_addr || '-'}</td>
                <td class="py-4 px-6 text-gray-700">${item.due}년</td>
                <td class="py-4 px-6 text-gray-700">${window.ApiKeyMngrUI.formatDate(item.start_dt)}</td>
                <td class="py-4 px-6 ${remainingDaysClass}">${remainingDays}일</td>
                <td class="py-4 px-6">
                    <button class="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm" onclick="ApiKeyMngrUI.sendNotification('${item.cd}')">
                        보내기
                    </button>
                </td>
                <td class="py-4 px-6">
                    <button class="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm">
                        수정
                    </button>
                </td>
            `;
            

            const editButton = row.querySelector('td:last-child button');
            editButton.addEventListener('click', () => {
                window.ApiKeyMngrUI.showEditModal(item);
            });
            
            tableBody.appendChild(row);
        });
    }
    

    window.ApiKeyMngrUI.renderPagination(paginationDiv, currentPage, totalPages, () => window.ApiKeyMngrUI.renderApiKeyMngrTable(), 'apiKeyMngrPage');
};


window.ApiKeyMngrUI.renderAbnormalApiKeyMngrTable = function() {
    const tableBody = document.getElementById('abnormal-api-key-mngr-table-body');
    const paginationDiv = document.getElementById('abnormal-api-key-mngr-pagination');
    const tableHead = document.querySelector('#abnormal-api-table-container thead tr');
    

    let abnormalData = ApiKeyMngrData.getAbnormalApiKeyMngrData();


    const q = document.getElementById('searchInput')?.value.toLowerCase() || '';
    abnormalData = abnormalData.filter(item => {
        return !q || item.cd.toLowerCase().includes(q) || (item.api_key && item.api_key.toLowerCase().includes(q));
    });
    

    const sortState = window.ApiKeyMngrUI.sortState.abnormal;
    abnormalData = window.ApiKeyMngrUI.sortData(abnormalData, sortState.column, sortState.direction, 'abnormal');
    

    if (tableHead) {
        tableHead.innerHTML = `
            ${window.ApiKeyMngrUI.createSortableHeader('cd', '코드명', 'abnormal')}
            ${window.ApiKeyMngrUI.createSortableHeader('cd_nm', '명칭', 'abnormal')}
            ${window.ApiKeyMngrUI.createSortableHeader('api_key', 'API값', 'abnormal')}
            ${window.ApiKeyMngrUI.createSortableHeader('api_ownr_email_addr', 'API책임자이메일', 'abnormal')}
            ${window.ApiKeyMngrUI.createSortableHeader('due', '기간', 'abnormal')}
            ${window.ApiKeyMngrUI.createSortableHeader('start_dt', '등록일', 'abnormal')}
            ${window.ApiKeyMngrUI.createSortableHeader('days_remaining', '남은 기간', 'abnormal')}
            <th class="py-4 px-6 text-left font-medium text-gray-600 whitespace-nowrap" style="width: 10%;">알림 메일 전송</th>
            <th class="py-4 px-6 text-left font-medium text-gray-600 whitespace-nowrap" style="width: 7%;">수정</th>
        `;
    }
    

    const itemsPerPage = window.ApiKeyMngrUI.getPageSize();
    const currentPage = parseInt(localStorage.getItem('abnormalApiKeyMngrPage')) || 1;
    const totalPages = Math.ceil(abnormalData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = abnormalData.slice(startIndex, endIndex);
    

    tableBody.innerHTML = '';
    if (paginatedData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="py-8 px-6 text-center text-gray-500">
                    비정상 API 키 관리 데이터가 없습니다.
                </td>
            </tr>
        `;
    } else {
        paginatedData.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition';
            
            const remainingDays = item.days_remaining;

            let remainingDaysClass = 'text-gray-700';
            if (remainingDays <= 0) {
                remainingDaysClass = 'text-red-600 font-medium';
            } else if (remainingDays <= 7) {
                remainingDaysClass = 'text-orange-500 font-medium';
            } else if (remainingDays <= 30) {
                remainingDaysClass = 'text-yellow-600 font-medium';
            } else {
                remainingDaysClass = 'text-green-600 font-medium';
            }
            
            row.innerHTML = `
                <td class="py-4 px-6 font-medium text-gray-800">${item.cd}</td>
                <td class="py-4 px-6 text-gray-700">${item.cd_nm || '-'}</td>
                <td class="py-4 px-6 font-mono text-gray-500">${item.api_key || '없음'}</td>
                <td class="py-4 px-6 text-gray-700">${item.api_ownr_email_addr || '-'}</td>
                <td class="py-4 px-6 text-gray-700">${item.due}년</td>
                <td class="py-4 px-6 text-gray-700">${window.ApiKeyMngrUI.formatDate(item.start_dt)}</td>
                <td class="py-4 px-6 ${remainingDaysClass}">${remainingDays}일</td>
                <td class="py-4 px-6">
                    <button class="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm" onclick="ApiKeyMngrUI.sendNotification('${item.cd}')">
                        보내기
                    </button>
                </td>
                <td class="py-4 px-6">
                    <button class="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm">
                        수정
                    </button>
                </td>
            `;
            

            const editButton = row.querySelector('td:last-child button');
            editButton.addEventListener('click', () => {
                window.ApiKeyMngrUI.showEditModal(item);
            });
            
            tableBody.appendChild(row);
        });
    }
    

    window.ApiKeyMngrUI.renderPagination(paginationDiv, currentPage, totalPages, () => window.ApiKeyMngrUI.renderAbnormalApiKeyMngrTable(), 'abnormalApiKeyMngrPage');
};


window.ApiKeyMngrUI.renderRiskApiKeyMngrTable = async function() {
    const tableBody = document.getElementById('risk-api-key-mngr-table-body');
    const paginationDiv = document.getElementById('risk-api-key-mngr-pagination');
    const summaryDiv = document.getElementById('risk-mail-status-summary');
    

    const riskData = ApiKeyMngrData.getRiskApiKeyMngrData();
    

    const mailStatusMap = await ApiKeyMngrData.getMailStatusForRiskGroup();
    const scheduleInfo = await ApiKeyMngrData.getScheduleHourInfo();
    

    let successCount = 0;
    let failedCount = 0;
    let waitingCount = 0;
    
    riskData.forEach(item => {
        const status = window.ApiKeyMngrUI.getMailStatusText(item, mailStatusMap, scheduleInfo);
        if (status.type === 'success') successCount++;
        else if (status.type === 'failed') failedCount++;
        else waitingCount++;
    });
    

    if (summaryDiv) {
        summaryDiv.innerHTML = `
            <div class="flex items-center gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <span class="text-sm font-medium text-gray-700">📊 메일 전송 현황</span>
                <span class="text-sm text-green-600 font-medium">✅ 전송완료: ${successCount}건</span>
                <span class="text-sm text-red-600 font-medium">❌ 전송실패: ${failedCount}건</span>
                <span class="text-sm text-gray-500 font-medium">⏳ 대기중: ${waitingCount}건</span>
            </div>
        `;
    }
    

    const currentFilter = window.ApiKeyMngrUI.riskMailFilter || 'all';
    let filteredData = riskData.filter(item => {
        const status = window.ApiKeyMngrUI.getMailStatusText(item, mailStatusMap, scheduleInfo);
        if (currentFilter === 'all') return true;
        if (currentFilter === 'success') return status.type === 'success';
        if (currentFilter === 'failed') return status.type === 'failed';
        if (currentFilter === 'waiting') return status.type === 'waiting';
        return true;
    });
    

    const itemsPerPage = window.ApiKeyMngrUI.getRiskPageSize();
    const currentPage = parseInt(localStorage.getItem('riskApiKeyMngrPage')) || 1;
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    

    tableBody.innerHTML = '';
    if (paginatedData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="py-8 px-6 text-center text-gray-500">
                    ${riskData.length === 0 ? '위험군 API 키가 없습니다.' : '필터 조건에 맞는 데이터가 없습니다.'}
                </td>
            </tr>
        `;
    } else {
        paginatedData.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition';
            
            const remainingDays = item.days_remaining;
            const mailStatus = window.ApiKeyMngrUI.getMailStatusText(item, mailStatusMap, scheduleInfo);
            
            row.innerHTML = `
                <td class="py-4 px-4 font-medium text-gray-800 text-sm">${item.cd}</td>
                <td class="py-4 px-4 text-gray-700 text-sm">${item.cd_nm || '-'}</td>
                <td class="py-4 px-4 text-red-600 font-medium text-sm text-center">${remainingDays}일</td>
                <td class="py-4 px-4 text-sm">${mailStatus.html}</td>
                <td class="py-4 px-4 text-gray-700 text-sm">${item.api_ownr_email_addr || '-'}</td>
                <td class="py-4 px-4 text-gray-700 text-sm text-center">${item.due}년</td>
                <td class="py-4 px-4 text-gray-700 text-sm">${window.ApiKeyMngrUI.formatDate(item.start_dt)}</td>
                <td class="py-4 px-4">
                    <button class="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm edit-btn">
                        수정
                    </button>
                </td>
            `;
            

            const editButton = row.querySelector('.edit-btn');
            editButton.addEventListener('click', () => {
                window.ApiKeyMngrUI.showEditModal(item);
            });
            
            tableBody.appendChild(row);
        });
    }
    

    window.ApiKeyMngrUI.renderPagination(paginationDiv, currentPage, totalPages, () => window.ApiKeyMngrUI.renderRiskApiKeyMngrTable(), 'riskApiKeyMngrPage');
};






window.ApiKeyMngrUI.handleSearch = function() {
    const currentActiveTab = document.querySelector('.api-tab-btn.active');
    if (currentActiveTab && currentActiveTab.dataset.apiTab === 'normal') {
        window.ApiKeyMngrUI.renderApiKeyMngrTable();
    } else {
        window.ApiKeyMngrUI.renderAbnormalApiKeyMngrTable();
    }
};


window.ApiKeyMngrUI.handleSearchWithBackend = async function() {
    const searchInput = document.getElementById('searchInput');
    const searchQuery = searchInput ? searchInput.value.trim() : '';
    

    localStorage.setItem('apiKeyMngrPage', '1');
    localStorage.setItem('abnormalApiKeyMngrPage', '1');
    
    window.ApiKeyMngrUI.showLoading(true);
    try {

        const result = await ApiKeyMngrData.loadApiKeyMngrDataPagedWithSearch(1, 100, searchQuery);
        
        if (result.success) {

            window.ApiKeyMngrUI.renderApiKeyMngrTable();
            window.ApiKeyMngrUI.renderAbnormalApiKeyMngrTable();
            window.ApiKeyMngrUI.renderApiKeyExpiryChart();

        } else {
            alert('검색에 실패했습니다.');
        }
    } catch (error) {

        alert('검색 중 오류가 발생했습니다.');
    } finally {
        window.ApiKeyMngrUI.hideLoading();
    }
};


window.ApiKeyMngrUI.filterByStatus = function(status) {
    window.ApiKeyMngrUI.currentFilter = status;
    

    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
        const tabId = activeTab.dataset.tab;
        if (tabId === '1') {
            window.ApiKeyMngrUI.renderGanttChart();
        } else if (tabId === '0') {
            const currentActiveApiTab = document.querySelector('.api-tab-btn.active');
            if (currentActiveApiTab && currentActiveApiTab.dataset.apiTab === 'normal') {
                window.ApiKeyMngrUI.renderApiKeyMngrTable();
            } else {
                window.ApiKeyMngrUI.renderAbnormalApiKeyMngrTable();
            }
        }
    }
};


window.ApiKeyMngrUI.filterRiskByMailStatus = function(filter) {
    window.ApiKeyMngrUI.riskMailFilter = filter;
    localStorage.setItem('riskApiKeyMngrPage', '1');
    

    document.querySelectorAll('.risk-mail-filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    
    window.ApiKeyMngrUI.renderRiskApiKeyMngrTable();
};


window.ApiKeyMngrUI.getMailStatusText = function(item, mailStatusMap, scheduleInfo) {
    const cd = item.cd;
    const daysRemaining = item.days_remaining;
    const mailStatus = mailStatusMap[cd];
    

    if (mailStatus && mailStatus.success.length > 0) {

        const recentSuccess = mailStatus.success.slice(0, 5);
        const datesHtml = recentSuccess.map(s => {

            const date = new Date(s.sent_dt);
            const yymmdd = String(date.getFullYear()).slice(2) + 
                           String(date.getMonth() + 1).padStart(2, '0') + 
                           String(date.getDate()).padStart(2, '0');
            return yymmdd;
        }).join(' ');
        
        return {
            type: 'success',
            html: `<span class="text-green-600 font-medium">✅ ${datesHtml}</span>`
        };
    }
    

    if (mailStatus && mailStatus.failed.length > 0) {
        const recentFailed = mailStatus.failed.slice(0, 5);
        const datesHtml = recentFailed.map(f => {
            const date = new Date(f.sent_dt);
            const yymmdd = String(date.getFullYear()).slice(2) + 
                           String(date.getMonth() + 1).padStart(2, '0') + 
                           String(date.getDate()).padStart(2, '0');
            return yymmdd;
        }).join(' ');
        
        return {
            type: 'failed',
            html: `<span class="text-red-600 font-medium">❌ ${datesHtml}</span>`
        };
    }
    

    const scheduleHour = scheduleInfo['7일전']?.hour ?? 9;
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    

    if (daysRemaining >= 1 && daysRemaining <= 7) {
        if (currentHour >= scheduleHour) {
            return {
                type: 'waiting',
                html: `<span class="text-gray-500">⏳ 내일 ${String(scheduleHour).padStart(2, '0')}시 발송 예정</span>`
            };
        } else {
            return {
                type: 'waiting',
                html: `<span class="text-gray-500">⏳ 오늘 ${String(scheduleHour).padStart(2, '0')}시 발송 예정</span>`
            };
        }
    }
    

    if (daysRemaining === 30) {
        if (currentHour >= scheduleHour) {
            return {
                type: 'waiting',
                html: `<span class="text-gray-500">⏳ 발송 완료 (다음 스케줄 대기)</span>`
            };
        } else {
            return {
                type: 'waiting',
                html: `<span class="text-gray-500">⏳ 오늘 ${String(scheduleHour).padStart(2, '0')}시 발송 예정</span>`
            };
        }
    }
    

    if (daysRemaining === 0) {
        if (currentHour >= scheduleHour) {
            return {
                type: 'waiting',
                html: `<span class="text-gray-500">⏳ 발송 완료 (다음 스케줄 대기)</span>`
            };
        } else {
            return {
                type: 'waiting',
                html: `<span class="text-gray-500">⏳ 오늘 ${String(scheduleHour).padStart(2, '0')}시 발송 예정</span>`
            };
        }
    }
    

    let daysUntilSchedule = 0;
    if (daysRemaining > 30) {
        daysUntilSchedule = daysRemaining - 30;
    } else if (daysRemaining > 7) {
        daysUntilSchedule = daysRemaining - 7;
    }
    
    if (daysUntilSchedule > 0) {
        return {
            type: 'waiting',
            html: `<span class="text-gray-500">⏳ 전송 스케줄까지 ${daysUntilSchedule}일 남음</span>`
        };
    }
    
    return {
        type: 'waiting',
        html: `<span class="text-gray-500">⏳ 오늘 ${String(scheduleHour).padStart(2, '0')}시 발송 예정</span>`
    };
};






window.ApiKeyMngrUI.renderPagination = function(container, currentPage, totalPages, renderFunction, storageKey) {
    if (!storageKey) {
        storageKey = 'apiKeyMngrPage';
    }
    
    container.innerHTML = '';
    

    if (totalPages <= 1) {
        if (totalPages === 1) {
            const infoText = document.createElement('span');
            infoText.className = 'text-sm text-gray-500';
            infoText.textContent = '1 페이지';
            container.appendChild(infoText);
        }

        return;
    }


    const prevButton = document.createElement('button');
    const prevDisabled = currentPage === 1;
    prevButton.className = `px-3 py-1 rounded-lg text-sm font-medium transition ${prevDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`;
    prevButton.innerHTML = '이전';
    prevButton.disabled = prevDisabled;
    if (!prevDisabled) {
        prevButton.onclick = function() {
            localStorage.setItem(storageKey, currentPage - 1);
            renderFunction();
        };
    }
    container.appendChild(prevButton);
    

    const visiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(visiblePages / 2));
    let endPage = Math.min(totalPages, startPage + visiblePages - 1);
    
    if (endPage - startPage + 1 < visiblePages) {
        startPage = Math.max(1, endPage - visiblePages + 1);
    }
    

    if (startPage > 1) {
        const firstButton = document.createElement('button');
        firstButton.className = 'px-3 py-1 rounded-lg text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition';
        firstButton.textContent = '1';
        firstButton.onclick = function() {
            localStorage.setItem(storageKey, 1);
            renderFunction();
        };
        container.appendChild(firstButton);
        
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'px-2 text-gray-400';
            ellipsis.textContent = '...';
            container.appendChild(ellipsis);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        const isActive = i === currentPage;
        pageButton.className = `px-3 py-1 rounded-lg text-sm font-medium transition ${isActive ? 'bg-blue-600 text-white font-bold' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`;
        pageButton.textContent = i;
        pageButton.onclick = function() {
            localStorage.setItem(storageKey, i);
            renderFunction();
        };
        container.appendChild(pageButton);
    }
    

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'px-2 text-gray-400';
            ellipsis.textContent = '...';
            container.appendChild(ellipsis);
        }
        
        const lastButton = document.createElement('button');
        lastButton.className = 'px-3 py-1 rounded-lg text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition';
        lastButton.textContent = totalPages;
        lastButton.onclick = function() {
            localStorage.setItem(storageKey, totalPages);
            renderFunction();
        };
        container.appendChild(lastButton);
    }
    

    const nextButton = document.createElement('button');
    const nextDisabled = currentPage === totalPages;
    nextButton.className = `px-3 py-1 rounded-lg text-sm font-medium transition ${nextDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'}`;
    nextButton.innerHTML = '다음';
    nextButton.disabled = nextDisabled;
    if (!nextDisabled) {
        nextButton.onclick = function() {
            localStorage.setItem(storageKey, currentPage + 1);
            renderFunction();
        };
    }
    container.appendChild(nextButton);
    

    const pageInfo = document.createElement('span');
    pageInfo.className = 'ml-3 text-sm text-gray-500';
    pageInfo.textContent = `${currentPage} / ${totalPages} 페이지`;
    container.appendChild(pageInfo);
};






window.ApiKeyMngrUI.showEditModal = function(item) {

    const modal = document.createElement('div');
    modal.id = 'editModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-lg shadow-xl p-6 w-96';
    

    modalContent.innerHTML = `
        <h3 class="text-lg font-semibold mb-4">API 키 정보 수정</h3>
        <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">코드명 (CD)</label>
            <input type="text" id="editCd" disabled class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100">
        </div>
        <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">API 값</label>
            <input type="text" id="editApiKey" class="w-full px-3 py-2 border border-gray-300 rounded-md">
        </div>
        <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">API 책임자 이메일 (쉼표로 구분)</label>
            <textarea id="editApiOwnrEmail" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
            <div class="text-xs text-gray-500 mt-1">여러 이메일은 쉼표(,)로 구분해주세요.</div>
        </div>
        <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">기간 (년)</label>
            <input type="number" id="editDue" min="1" max="10" class="w-full px-3 py-2 border border-gray-300 rounded-md">
        </div>
        <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-1">등록일</label>
            <input type="date" id="editStartDt" class="w-full px-3 py-2 border border-gray-300 rounded-md">
        </div>
        <div class="flex justify-end gap-2">
            <button onclick="ApiKeyMngrUI.hideEditModal()" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">취소</button>
            <button onclick="ApiKeyMngrUI.handleUpdateApiKeyMngr('${item.cd}')" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">수정</button>
        </div>
    `;
    

    modalContent.querySelector('#editCd').value = item.cd;
    modalContent.querySelector('#editApiKey').value = item.api_key || '';
    modalContent.querySelector('#editApiOwnrEmail').value = item.api_ownr_email_addr || '';
    modalContent.querySelector('#editDue').value = item.due;
    modalContent.querySelector('#editStartDt').value = item.start_dt;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
};


window.ApiKeyMngrUI.hideEditModal = function() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.remove();
    }
};


window.ApiKeyMngrUI.handleUpdateApiKeyMngr = async function(cd) {
    const apiKey = document.getElementById('editApiKey').value;
    const apiOwnrEmail = document.getElementById('editApiOwnrEmail').value;
    const due = parseInt(document.getElementById('editDue').value);
    const startDt = document.getElementById('editStartDt').value;
    
    try {
        const success = await ApiKeyMngrData.updateApiKeyMngr(cd, due, startDt, apiOwnrEmail, apiKey);
        if (success) {
            window.ApiKeyMngrUI.hideEditModal();

            await ApiKeyMngrData.loadApiKeyMngrData();
            window.ApiKeyMngrUI.renderApiKeyMngrTable();
            window.ApiKeyMngrUI.renderAbnormalApiKeyMngrTable();
            window.ApiKeyMngrUI.renderGanttChart();
            window.ApiKeyMngrUI.renderRiskApiKeyMngrTable();
        } else {
            window.ApiKeyMngrUI.showErrorMessage('API 키 관리 데이터 업데이트에 실패했습니다.');
        }
    } catch (error) {

        window.ApiKeyMngrUI.showErrorMessage('API 키 관리 데이터 업데이트 중 오류가 발생했습니다.');
    }
};