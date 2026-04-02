/**
 * API 키 관리 페이지의 UI 모듈
 */

// 전역 스코프에 노출 (라우터에서 접근 가능하도록)
window.ApiKeyMngrUI = {
    /**
     * 페이지당 수량 가져오기
     */
    getPageSize: function() {
        const select = document.getElementById('page-size-select');
        return select ? parseInt(select.value) : 10;
    },

    /**
     * 위험군 페이지당 수량 가져오기
     */
    getRiskPageSize: function() {
        const select = document.getElementById('risk-page-size-select');
        return select ? parseInt(select.value) : 10;
    },

    /**
     * 필터링된 API 키 관리 데이터 가져오기
     */
    getFilteredApiKeyMngrData: function(data) {
        const q = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const today = new Date();
        
        // 데이터 변환 (기간 차트와 동일한 로직)
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

        // 검색 및 필터링
        let filtered = keys.filter(k => {
            const matchQ = !q || k.cd.toLowerCase().includes(q) || (k.api_key && k.api_key.toLowerCase().includes(q));
            const matchS = this.currentFilter === 'all' || k.status === this.currentFilter;
            return matchQ && matchS;
        });

        return filtered;
    },

    /**
     * API 키 관리 테이블 렌더링
     */
    renderApiKeyMngrTable: function(data) {
        const tableBody = document.getElementById('api-key-mngr-table-body');
        const paginationDiv = document.getElementById('api-key-mngr-pagination');
        
        // 정상 상태의 API 키 관리 데이터 가져오기
        let normalData = ApiKeyMngrData.getNormalApiKeyMngrData();
        
        // 필터 및 검색 적용
        normalData = this.getFilteredApiKeyMngrData(normalData);
        
        // 페이지네이션 설정
        const itemsPerPage = this.getPageSize();
        const currentPage = parseInt(localStorage.getItem('apiKeyMngrPage')) || 1;
        const totalPages = Math.ceil(normalData.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedData = normalData.slice(startIndex, endIndex);
        
        // 테이블 렌더링
        tableBody.innerHTML = '';
        if (paginatedData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="py-8 px-6 text-center text-gray-500">
                        정상 API 키 관리 데이터가 없습니다.
                    </td>
                </tr>
            `;
        } else {
            paginatedData.forEach(item => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50 transition';
                
                const remainingDays = item.days_remaining;
                const remainingDaysClass = remainingDays <= 30 ? 'text-red-600 font-medium' : 'text-gray-700';
                
                row.innerHTML = `
                    <td class="py-4 px-6 font-medium text-gray-800">${item.cd}</td>
                    <td class="py-4 px-6 font-mono text-gray-700">${item.api_key}</td>
                    <td class="py-4 px-6 text-gray-700">${item.api_ownr_email_addr || '-'}</td>
                    <td class="py-4 px-6 text-gray-700">${item.due}년</td>
                    <td class="py-4 px-6 text-gray-700">${this.formatDate(item.start_dt)}</td>
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
                
                // 수정 버튼 이벤트 리스너 추가
                const editButton = row.querySelector('td:last-child button');
                editButton.addEventListener('click', () => {
                    this.showEditModal(item);
                });
                
                tableBody.appendChild(row);
            });
        }
        
        // 페이지네이션 렌더링
        this.renderPagination(paginationDiv, currentPage, totalPages, () => this.renderApiKeyMngrTable(), 'apiKeyMngrPage');
    },

    /**
     * 비정상 API 키 관리 테이블 렌더링
     */
    renderAbnormalApiKeyMngrTable: function() {
        const tableBody = document.getElementById('abnormal-api-key-mngr-table-body');
        const paginationDiv = document.getElementById('abnormal-api-key-mngr-pagination');
        
        // 비정상 상태의 API 키 관리 데이터 가져오기
        let abnormalData = ApiKeyMngrData.getAbnormalApiKeyMngrData();
        
        // 검색 적용 (필터는 적용하지 않음)
        const q = document.getElementById('searchInput')?.value.toLowerCase() || '';
        abnormalData = abnormalData.filter(item => {
            return !q || item.cd.toLowerCase().includes(q) || (item.api_key && item.api_key.toLowerCase().includes(q));
        });
        
        // 페이지네이션 설정
        const itemsPerPage = this.getPageSize();
        const currentPage = parseInt(localStorage.getItem('abnormalApiKeyMngrPage')) || 1;
        const totalPages = Math.ceil(abnormalData.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedData = abnormalData.slice(startIndex, endIndex);
        
        // 테이블 렌더링
        tableBody.innerHTML = '';
        if (paginatedData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="py-8 px-6 text-center text-gray-500">
                        비정상 API 키 관리 데이터가 없습니다.
                    </td>
                </tr>
            `;
        } else {
            paginatedData.forEach(item => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50 transition';
                
                row.innerHTML = `
                    <td class="py-4 px-6 font-medium text-gray-800">${item.cd}</td>
                    <td class="py-4 px-6 font-mono text-gray-500">${item.api_key || '없음'}</td>
                    <td class="py-4 px-6 text-gray-700">${item.api_ownr_email_addr || '-'}</td>
                    <td class="py-4 px-6 text-gray-700">${item.due}년</td>
                    <td class="py-4 px-6 text-gray-700">${this.formatDate(item.start_dt)}</td>
                    <td class="py-4 px-6 text-red-600 font-medium">${item.days_remaining}일</td>
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
                
                // 수정 버튼 이벤트 리스너 추가
                const editButton = row.querySelector('td:last-child button');
                editButton.addEventListener('click', () => {
                    this.showEditModal(item);
                });
                
                tableBody.appendChild(row);
            });
        }
        
        // 페이지네이션 렌더링
        this.renderPagination(paginationDiv, currentPage, totalPages, () => this.renderAbnormalApiKeyMngrTable(), 'abnormalApiKeyMngrPage');
    },

    /**
     * 검색 처리
     */
    handleSearch: function() {
        const currentActiveTab = document.querySelector('.api-tab-btn.active');
        if (currentActiveTab && currentActiveTab.dataset.apiTab === 'normal') {
            this.renderApiKeyMngrTable();
        } else {
            this.renderAbnormalApiKeyMngrTable();
        }
    },

    /**
     * 통계 수량 업데이트 (모듈화 함수)
     */
    updateStatisticsCount: function(keys) {
        const all = keys.length;
        const ok = keys.filter(k => k.status === 'ok').length;
        const expiring30 = keys.filter(k => k.status === 'expiring-30').length;
        const expiring7 = keys.filter(k => k.status === 'expiring-7').length;
        const err = keys.filter(k => k.status === 'err').length;
        
        document.getElementById('totalCount').textContent = all + '개';
        document.getElementById('allCount').textContent = all;
        document.getElementById('okCount').textContent = ok;
        document.getElementById('expiring30Count').textContent = expiring30;
        document.getElementById('expiring7Count').textContent = expiring7;
        document.getElementById('errCount').textContent = err;
    },

    /**
     * 전체 API 키 관리 데이터 통계 업데이트
     */
    updateApiKeyMngrStatisticsCount: function() {
        const apiData = ApiKeyMngrData.getApiKeyMngrData();
        const today = new Date();
        const keys = apiData.map(k => {
            const endDate = new Date(k.start_dt);
            endDate.setFullYear(endDate.getFullYear() + k.due);
            const daysLeft = Math.ceil((endDate - today) / 86400000);
            let status = 'ok';
            if (daysLeft <= 30 && daysLeft > 0) status = 'expiring-30';
            if (daysLeft <= 7 && daysLeft > 0) status = 'expiring-7';
            if (daysLeft <= 0) status = 'err';
            
            return { 
                id: k.cd, 
                name: k.cd, 
                start: k.start_dt, 
                end: endDate.toISOString().split('T')[0],
                endDate: endDate,
                daysLeft: daysLeft,
                status: status,
                reason: daysLeft <= 0 ? '만료됨' : null
            };
        });

        this.updateStatisticsCount(keys);
    },

    /**
     * 위험군 API 키 관리 테이블 렌더링
     */
    renderRiskApiKeyMngrTable: function() {
        const tableBody = document.getElementById('risk-api-key-mngr-table-body');
        const paginationDiv = document.getElementById('risk-api-key-mngr-pagination');
        
        // 위험군 API 키 관리 데이터 가져오기 (1개월 이내 만료)
        const riskData = ApiKeyMngrData.getRiskApiKeyMngrData();
        
        // 페이지네이션 설정
        const itemsPerPage = this.getRiskPageSize();
        const currentPage = parseInt(localStorage.getItem('riskApiKeyMngrPage')) || 1;
        const totalPages = Math.ceil(riskData.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedData = riskData.slice(startIndex, endIndex);
        
        // 테이블 렌더링
        tableBody.innerHTML = '';
        if (paginatedData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="py-8 px-6 text-center text-gray-500">
                        위험군 API 키가 없습니다.
                    </td>
                </tr>
            `;
        } else {
            paginatedData.forEach(item => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50 transition';
                
                const remainingDays = item.days_remaining;
                
                row.innerHTML = `
                    <td class="py-4 px-6 font-medium text-gray-800">${item.cd}</td>
                    <td class="py-4 px-6 font-mono text-gray-700">${item.api_key}</td>
                    <td class="py-4 px-6 text-gray-700">${item.api_ownr_email_addr || '-'}</td>
                    <td class="py-4 px-6 text-gray-700">${item.due}년</td>
                    <td class="py-4 px-6 text-gray-700">${this.formatDate(item.start_dt)}</td>
                    <td class="py-4 px-6 text-red-600 font-medium">${remainingDays}일</td>
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
                
                // 수정 버튼 이벤트 리스너 추가
                const editButton = row.querySelector('td:last-child button');
                editButton.addEventListener('click', () => {
                    this.showEditModal(item);
                });
                
                tableBody.appendChild(row);
            });
        }
        
        // 페이지네이션 렌더링
        this.renderPagination(paginationDiv, currentPage, totalPages, () => this.renderRiskApiKeyMngrTable(), 'riskApiKeyMngrPage');
    },

    /**
     * Gantt 차트 렌더링
     */
    renderGanttChart: function() {
        const today = new Date();
        const VIEW_START = new Date(today.getFullYear() - 1, 9, 1); // 10월
        const VIEW_END = new Date(today.getFullYear() + 1, 0, 1); // 1월
        const TOTAL_MS = VIEW_END - VIEW_START;
        const TICKS = [
            `${today.getFullYear()-1}-10`,
            `${today.getFullYear()-1}-12`,
            `${today.getFullYear()}-02`,
            `${today.getFullYear()}-04`,
            `${today.getFullYear()}-06`,
            `${today.getFullYear()}-08`,
            `${today.getFullYear()}-10`,
            `${today.getFullYear()}-12`
        ];
        const EXPIRY_WARN_DAYS = 30;

        function d(s) { return new Date(s); }
        function pct(date) { return Math.max(0, Math.min(100, ((d(date)-VIEW_START)/TOTAL_MS)*100)); }

        // API 키 관리 데이터 가져오기
        const apiData = ApiKeyMngrData.getApiKeyMngrData();
        
        // 데이터 변환
        const keys = apiData.map(k => {
            const endDate = new Date(k.start_dt);
            endDate.setFullYear(endDate.getFullYear() + k.due);
            const daysLeft = Math.ceil((endDate - today) / 86400000);
            let status = 'ok';
            if (daysLeft <= 30 && daysLeft > 0) status = 'expiring-30';
            if (daysLeft <= 7 && daysLeft > 0) status = 'expiring-7';
            if (daysLeft <= 0) status = 'err';
            
            return { 
                id: k.cd, 
                name: k.cd, 
                start: k.start_dt, 
                end: endDate.toISOString().split('T')[0],
                endDate: endDate,
                daysLeft: daysLeft,
                status: status,
                reason: daysLeft <= 0 ? '만료됨' : null
            };
        });

        // 통계 수량 업데이트
        this.updateStatisticsCount(keys);

        // 검색 및 필터링
        const q = document.getElementById('searchInput')?.value?.toLowerCase() || '';
        const sortBy = 'expiry'; // 기본 정렬: 만료일 가까운 순

        let filtered = keys.filter(k => {
            const matchQ = !q || k.name.toLowerCase().includes(q) || k.id.toLowerCase().includes(q);
            const matchS = this.currentFilter === 'all' || k.status === this.currentFilter;
            return matchQ && matchS;
        });

        // 정렬 (만료일 가까운 순)
        filtered.sort((a, b) => {
            if (sortBy === 'expiry') return a.endDate - b.endDate;
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            return d(a.start) - d(b.start);
        });

        // Gantt 차트 렌더링
        this.buildGantt('API 키 유효기간', filtered, 'ganttChart');
    },

    /**
     * 필터 상태 설정
     */
    filterByStatus: function(status) {
        this.currentFilter = status;
        
        // 현재 활성 탭에 따라 렌더링
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab) {
            const tabId = activeTab.dataset.tab;
            if (tabId === '1') {
                this.renderGanttChart();
            } else if (tabId === '0') {
                const currentActiveApiTab = document.querySelector('.api-tab-btn.active');
                if (currentActiveApiTab && currentActiveApiTab.dataset.apiTab === 'normal') {
                    this.renderApiKeyMngrTable();
                } else {
                    this.renderAbnormalApiKeyMngrTable();
                }
            }
        }
    },

    /**
     * 현재 필터 상태 (기본: 전체)
     */
    currentFilter: 'all',

    /**
     * Gantt 차트 페이지네이션 관련 속성
     */
    currentPage: 1,
    itemsPerPage: 10,

    /**
     * Gantt 차트 페이지당 수량 변경 이벤트 처리
     */
    handlePageSizeChange: function() {
        const select = document.getElementById('gantt-page-size-select');
        this.itemsPerPage = parseInt(select.value);
        this.currentPage = 1;
        this.renderGanttChart();
    },

    /**
     * Gantt 차트 빌드
     */
    buildGantt: function(labelText, items, containerId) {
        if (!items.length) { 
            document.getElementById(containerId).innerHTML = '<div class="no-result">검색 결과가 없습니다.</div>'; 
            return; 
        }
        
        // 페이지네이션 적용
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedItems = items.slice(startIndex, endIndex);

        const today = new Date();
        const todayP = this.calculatePct(today);

        const rows = paginatedItems.map((k, idx) => {
            const left = this.calculatePct(k.start);
            const right = this.calculatePct(k.end);
            const w = Math.max(right - left, 0.3);
            const barCls = k.status === 'ok' ? 'bar-ok' : k.status === 'expiring-30' ? 'bar-warn' : k.status === 'expiring-7' ? 'bar-warn' : 'bar-err';
            const badgeCls = k.status === 'ok' ? 'badge-ok' : k.status === 'expiring-30' ? 'badge-warn' : k.status === 'expiring-7' ? 'badge-expiring-7' : 'badge-err';
            const badgeTxt = k.status === 'ok' ? '정상' : k.status === 'expiring-30' ? 'D-' + k.daysLeft : k.status === 'expiring-7' ? 'D-' + k.daysLeft : (k.reason || '비정상');
            
            return '<div class="gantt-row">' +
                '<div class="key-info">' +
                    '<div class="key-name" title="' + k.id + '">' + k.name + ' <span class="key-badge ' + badgeCls + '">' + badgeTxt + '</span></div>' +
                '</div>' +
                '<div class="bar-area" ' +
                    'data-id="' + k.id + '" data-start="' + k.start + '" data-end="' + k.end + '" ' +
                    'data-status="' + k.status + '" data-reason="' + (k.reason||'') + '" data-days="' + k.daysLeft + '" ' +
                    'onmouseenter="showTip(event,this)" onmouseleave="hideTip()">' +
                    '<div class="today-line" style="left:' + todayP + '%">' + (idx === 0 ? '<span class="today-text">today</span>' : '') + '</div>' +
                    '<div class="bar-track ' + barCls + '" style="left:' + left + '%;width:' + w + '%"></div>' +
                '</div>' +
            '</div>';
        }).join('');

        const ticksHtml = ['2025-10','2025-12','2026-02','2026-04','2026-06','2026-08','2026-10','2026-12'].map(t => '<div class="tick-label">' + t + '</div>').join('');
        
        // 페이지네이션 HTML 생성
        const totalPages = Math.ceil(items.length / this.itemsPerPage);
        let paginationHtml = '';
        if (totalPages > 1) {
            paginationHtml = '<div class="flex justify-center items-center gap-2 mt-4">';
            paginationHtml += `<button onclick="ApiKeyMngrUI.previousPage()" ${this.currentPage === 1 ? 'disabled' : ''} class="px-3 py-1 rounded-lg text-sm font-medium ${this.currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}">이전</button>`;
            
            const visiblePages = 5;
            let startPage = Math.max(1, this.currentPage - Math.floor(visiblePages / 2));
            let endPage = Math.min(totalPages, startPage + visiblePages - 1);
            
            if (endPage - startPage + 1 < visiblePages) {
                startPage = Math.max(1, endPage - visiblePages + 1);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                paginationHtml += `<button onclick="ApiKeyMngrUI.goToPage(${i})" class="px-3 py-1 rounded-lg text-sm font-medium ${i === this.currentPage ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}">${i}</button>`;
            }
            
            paginationHtml += `<button onclick="ApiKeyMngrUI.nextPage()" ${this.currentPage === totalPages ? 'disabled' : ''} class="px-3 py-1 rounded-lg text-sm font-medium ${this.currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}">다음</button>`;
            paginationHtml += '</div>';
        }
        
        document.getElementById(containerId).innerHTML = 
            '<div class="gantt-wrapper">' +
                '<div class="gantt-header">' +
                    '<div class="col-key">API 키</div>' +
                    '<div class="col-timeline">' + ticksHtml + '</div>' +
                '</div>' +
                rows +
            '</div>' +
            paginationHtml;
    },

    /**
     * 이전 페이지로 이동
     */
    previousPage: function() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderGanttChart();
        }
    },

    /**
     * 다음 페이지로 이동
     */
    nextPage: function() {
        const apiData = ApiKeyMngrData.getApiKeyMngrData();
        const today = new Date();
        const keys = apiData.map(k => {
            const endDate = new Date(k.start_dt);
            endDate.setFullYear(endDate.getFullYear() + k.due);
            const daysLeft = Math.ceil((endDate - today) / 86400000);
            let status = 'ok';
            if (daysLeft <= 30 && daysLeft > 0) status = 'expiring-30';
            if (daysLeft <= 7 && daysLeft > 0) status = 'expiring-7';
            if (daysLeft <= 0) status = 'err';
            return { 
                id: k.cd, 
                name: k.cd, 
                start: k.start_dt, 
                end: endDate.toISOString().split('T')[0],
                endDate: endDate,
                daysLeft: daysLeft,
                status: status,
                reason: daysLeft <= 0 ? '만료됨' : null
            };
        });

        const q = document.getElementById('searchInput')?.value?.toLowerCase() || '';
        const filtered = keys.filter(k => {
            const matchQ = !q || k.name.toLowerCase().includes(q) || k.id.toLowerCase().includes(q);
            const matchS = this.currentFilter === 'all' || k.status === this.currentFilter;
            return matchQ && matchS;
        });

        const totalPages = Math.ceil(filtered.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderGanttChart();
        }
    },

    /**
     * 특정 페이지로 이동
     */
    goToPage: function(page) {
        const apiData = ApiKeyMngrData.getApiKeyMngrData();
        const today = new Date();
        const keys = apiData.map(k => {
            const endDate = new Date(k.start_dt);
            endDate.setFullYear(endDate.getFullYear() + k.due);
            const daysLeft = Math.ceil((endDate - today) / 86400000);
            let status = 'ok';
            if (daysLeft <= 30 && daysLeft > 0) status = 'expiring-30';
            if (daysLeft <= 7 && daysLeft > 0) status = 'expiring-7';
            if (daysLeft <= 0) status = 'err';
            return { 
                id: k.cd, 
                name: k.cd, 
                start: k.start_dt, 
                end: endDate.toISOString().split('T')[0],
                endDate: endDate,
                daysLeft: daysLeft,
                status: status,
                reason: daysLeft <= 0 ? '만료됨' : null
            };
        });

        const q = document.getElementById('searchInput')?.value?.toLowerCase() || '';
        const filtered = keys.filter(k => {
            const matchQ = !q || k.name.toLowerCase().includes(q) || k.id.toLowerCase().includes(q);
            const matchS = this.currentFilter === 'all' || k.status === this.currentFilter;
            return matchQ && matchS;
        });

        const totalPages = Math.ceil(filtered.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderGanttChart();
        }
    },

    /**
     * 날짜를 퍼센트로 계산
     */
    calculatePct: function(date) {
        const today = new Date();
        const VIEW_START = new Date(today.getFullYear() - 1, 9, 1); // 10월
        const VIEW_END = new Date(today.getFullYear() + 1, 0, 1); // 1월
        const TOTAL_MS = VIEW_END - VIEW_START;
        
        const d = new Date(date);
        return Math.max(0, Math.min(100, ((d - VIEW_START) / TOTAL_MS) * 100));
    },

    /**
     * 툴팁 표시
     */
    showTip: function(e, el) {
        const tip = document.getElementById('tooltip');
        if (!tip) return;
        
        const daysLeft = parseInt(el.dataset.days);
        const statusTxt = el.dataset.status === 'ok'
            ? '정상'
            : el.dataset.status === 'expiring-30'
                ? `만료 임박 (D-${daysLeft})`
                : el.dataset.status === 'expiring-7'
                    ? `만료 임박 (D-${daysLeft})`
                    : (el.dataset.reason || '비정상');
        
        tip.innerHTML = `
            <div class="t-key">${el.dataset.id}</div>
            <div class="t-row"><span>시작일</span><span>${el.dataset.start}</span></div>
            <div class="t-row"><span>만료일</span><span>${el.dataset.end}</span></div>
            <div class="t-row"><span>상태</span><span>${statusTxt}</span></div>`;
        
        tip.style.display = 'block';
        this.moveTip(e);
    },

    /**
     * 툴팁 이동
     */
    moveTip: function(e) {
        const tip = document.getElementById('tooltip');
        if (tip) {
            tip.style.left = (e.clientX + 14) + 'px';
            tip.style.top = (e.clientY - 12) + 'px';
        }
    },

    /**
     * 툴팁 숨기기
     */
    hideTip: function() { 
        const tip = document.getElementById('tooltip');
        if (tip) {
            tip.style.display = 'none'; 
        }
    },

    /**
     * 이벤트 리스너 설정
     */
    setupGanttEventListeners: function() {
        document.addEventListener('mousemove', e => {
            const tip = document.getElementById('tooltip');
            if (tip && tip.style.display !== 'none') {
                this.moveTip(e);
            }
        });
    },

    /**
     * 페이지네이션 렌더링
     */
    renderPagination: function(container, currentPage, totalPages, renderFunction, storageKey) {
        if (!storageKey) {
            storageKey = 'apiKeyMngrPage';
        }
        
        container.innerHTML = '';
        
        // 이전 페이지 버튼
        const prevButton = document.createElement('button');
        prevButton.className = 'px-3 py-1 rounded-lg text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition';
        prevButton.innerHTML = '이전';
        prevButton.disabled = currentPage === 1;
        prevButton.onclick = function() {
            if (currentPage > 1) {
                localStorage.setItem(storageKey, currentPage - 1);
                renderFunction();
            }
        };
        container.appendChild(prevButton);
        
        // 페이지 번호 버튼
        const visiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(visiblePages / 2));
        let endPage = Math.min(totalPages, startPage + visiblePages - 1);
        
        if (endPage - startPage + 1 < visiblePages) {
            startPage = Math.max(1, endPage - visiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.className = 'px-3 py-1 rounded-lg text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition';
            pageButton.textContent = i;
            pageButton.onclick = function() {
                localStorage.setItem(storageKey, i);
                renderFunction();
            };
            container.appendChild(pageButton);
        }
        
        // 다음 페이지 버튼
        const nextButton = document.createElement('button');
        nextButton.className = 'px-3 py-1 rounded-lg text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition';
        nextButton.innerHTML = '다음';
        nextButton.disabled = currentPage === totalPages;
        nextButton.onclick = function() {
            if (currentPage < totalPages) {
                localStorage.setItem(storageKey, currentPage + 1);
                renderFunction();
            }
        };
        container.appendChild(nextButton);
    },

    /**
     * 날짜 포맷팅
     */
    formatDate: function(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * 알림 메일 전송 (단일 CD)
     * Following the same pattern as Airflow's ServiceMonitor.send_emails()
     */
    sendNotification: async function(cd) {
        if (!confirm(`선택한 API 키(CD: ${cd})의 소유자에게 만료 알림 메일을 전송하시겠습니까?`)) {
            return;
        }
        
        try {
            const result = await ApiKeyMngrData.sendEmail([cd]);
            
            if (result.success) {
                const successCount = result.results.success.length;
                const failedCount = result.results.failed.length;
                const skippedCount = result.results.skipped.length;
                
                let message = `메일 발송 완료: 성공 ${successCount}건`;
                if (failedCount > 0) message += `, 실패 ${failedCount}건`;
                if (skippedCount > 0) message += `, 건너뜀 ${skippedCount}건`;
                
                alert(message);
                
                // 실패/건너뜀 상세 정보 출력
                if (failedCount > 0) {
                    console.error('실패 항목:', result.results.failed);
                }
                if (skippedCount > 0) {
                    console.warn('건너뜀 항목:', result.results.skipped);
                }
            } else {
                alert(`메일 발송 실패: ${result.message}`);
            }
        } catch (error) {
            console.error('메일 전송 오류:', error);
            alert('메일 전송 중 오류가 발생했습니다.');
        }
    },

    /**
     * 알림 메일 전송 (선택된 여러 CD)
     */
    sendNotificationBulk: async function(cds) {
        if (!cds || cds.length === 0) {
            alert('메일을 보낼 항목을 선택해주세요.');
            return;
        }
        
        if (!confirm(`선택한 ${cds.length}개의 API 키 소유자에게 만료 알림 메일을 전송하시겠습니까?`)) {
            return;
        }
        
        try {
            const result = await ApiKeyMngrData.sendEmail(cds);
            
            if (result.success) {
                const successCount = result.results.success.length;
                const failedCount = result.results.failed.length;
                const skippedCount = result.results.skipped.length;
                
                let message = `메일 발송 완료: 성공 ${successCount}건`;
                if (failedCount > 0) message += `, 실패 ${failedCount}건`;
                if (skippedCount > 0) message += `, 건너뜀 ${skippedCount}건`;
                
                alert(message);
                
                // 실패/건너뜀 상세 정보 출력
                if (failedCount > 0) {
                    console.error('실패 항목:', result.results.failed);
                }
                if (skippedCount > 0) {
                    console.warn('건너뜀 항목:', result.results.skipped);
                }
            } else {
                alert(`메일 발송 실패: ${result.message}`);
            }
        } catch (error) {
            console.error('메일 전송 오류:', error);
            alert('메일 전송 중 오류가 발생했습니다.');
        }
    },

    /**
     * 로딩 표시
     */
    showLoading: function(show) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            if (show) {
                loadingElement.classList.remove('hidden');
            } else {
                loadingElement.classList.add('hidden');
            }
        }
    },

    /**
     * 로딩 숨기기
     */
    hideLoading: function() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.classList.add('hidden');
        }
    },

    /**
     * CD 업데이트 버튼 이벤트
     */
    handleUpdateCdButton: async function() {
        this.showLoading();
        try {
            const success = await ApiKeyMngrData.updateCdFromMngrSett();
            if (success) {
                alert('CD 업데이트가 성공적으로 완료되었습니다.');
                this.renderApiKeyMngrTable();
                this.renderAbnormalApiKeyMngrTable();
                this.renderApiKeyExpiryChart();
            } else {
                alert('CD 업데이트에 실패했습니다.');
            }
        } catch (error) {
            console.error('CD 업데이트 오류:', error);
            alert('CD 업데이트 중 오류가 발생했습니다.');
        } finally {
            this.hideLoading();
        }
    },

    /**
     * 페이지 로드 이벤트
     */
    handlePageLoad: async function() {
        this.showLoading();
        try {
            const success = await ApiKeyMngrData.loadApiKeyMngrData();
            if (success) {
                this.renderApiKeyMngrTable();
                this.renderAbnormalApiKeyMngrTable();
                this.renderApiKeyExpiryChart();
            } else {
                alert('API 키 관리 데이터 로드에 실패했습니다.');
            }
        } catch (error) {
            console.error('API 키 관리 데이터 로드 오류:', error);
            alert('API 키 관리 데이터 로드 중 오류가 발생했습니다.');
        } finally {
            this.hideLoading();
        }
    },

    /**
     * 탭 클릭 이벤트
     */
    handleTabClick: function(tabIndex) {
        // 탭 버튼 상태 업데이트
        document.querySelectorAll('.tab-btn').forEach((btn, index) => {
            if (index === tabIndex) {
                btn.classList.add('active', 'bg-blue-50', 'text-blue-600');
                btn.classList.remove('text-gray-600');
            } else {
                btn.classList.remove('active', 'bg-blue-50', 'text-blue-600');
                btn.classList.add('text-gray-600');
            }
        });
        
        // 탭 내용 표시 업데이트
        document.querySelectorAll('.tab-content').forEach((content, index) => {
            content.classList.toggle('hidden', index !== tabIndex);
        });
        
        // 탭 1(기간 차트)일 때 차트 다시 렌더링
        if (tabIndex === 1) {
            this.renderApiKeyExpiryChart();
        }
    },

    /**
     * 수정 모달 표시
     */
    showEditModal: function(item) {
        // 모달 HTML 생성 (동적으로 생성하여 기존 DOM에 추가)
        const modal = document.createElement('div');
        modal.id = 'editModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'bg-white rounded-lg shadow-xl p-6 w-96';
        
        // 모달 내용 생성
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
        
        // 입력 필드에 값 설정
        modalContent.querySelector('#editCd').value = item.cd;
        modalContent.querySelector('#editApiKey').value = item.api_key || '';
        modalContent.querySelector('#editApiOwnrEmail').value = item.api_ownr_email_addr || '';
        modalContent.querySelector('#editDue').value = item.due;
        modalContent.querySelector('#editStartDt').value = item.start_dt;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    },

    /**
     * 수정 모달 숨기기
     */
    hideEditModal: function() {
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.remove();
        }
    },

    /**
     * API 키 관리 데이터 업데이트 이벤트 (API 키 포함)
     */
    handleUpdateApiKeyMngr: async function(cd) {
        const apiKey = document.getElementById('editApiKey').value;
        const apiOwnrEmail = document.getElementById('editApiOwnrEmail').value;
        const due = parseInt(document.getElementById('editDue').value);
        const startDt = document.getElementById('editStartDt').value;
        
        try {
            const success = await ApiKeyMngrData.updateApiKeyMngr(cd, due, startDt, apiOwnrEmail, apiKey);
            if (success) {
                this.hideEditModal();
                this.showSuccessMessage('API 키 관리 데이터가 성공적으로 업데이트되었습니다.');
                this.renderApiKeyMngrTable();
                this.renderAbnormalApiKeyMngrTable();
                this.renderGanttChart();
            } else {
                this.showErrorMessage('API 키 관리 데이터 업데이트에 실패했습니다.');
            }
        } catch (error) {
            console.error('API 키 관리 데이터 업데이트 오류:', error);
            this.showErrorMessage('API 키 관리 데이터 업데이트 중 오류가 발생했습니다.');
        }
    },

    /**
     * 성공 메시지 표시
     */
    showSuccessMessage: function(message) {
        alert(message);
    },

    /**
     * 오류 메시지 표시
     */
    showErrorMessage: function(message) {
        alert(message);
    },

    /**
     * API 키 유효기간 차트 렌더링 (기존 이름과 동일한 메서드)
     */
    renderApiKeyExpiryChart: function() {
        this.renderGanttChart();
    },

    /**
     * 페이지 초기화
     */
    init: function() {
        // 초기 데이터 로드
        this.handlePageLoad();

        // 탭 전환 이벤트
        this.setupTabNavigation();

        // API 키 관리 탭 내부 탭 전환 이벤트
        this.setupApiTabNavigation();

        // CD 업데이트 버튼 이벤트
        this.setupUpdateCdButton();

        // 페이지당 수량 선택 이벤트
        this.setupPageSizeSelect();
    },

    /**
     * 탭 전환 이벤트 (mngr_sett와 동일한 구조)
     */
    setupTabNavigation: function() {
        const tabs = document.querySelectorAll('#api_key_mngr_page .tab-button');
        const tabContents = document.querySelectorAll('#api_key_mngr_page .tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = tab.dataset.tab;

                // 모든 탭과 내용 숨기기
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                // 선택된 탭 활성화
                tab.classList.add('active');
                const contentId = `content${tabId}`;
                const content = document.getElementById(contentId);
                if (content) {
                    content.classList.add('active');
                }

                // 탭에 따라 데이터 로드
                if (tabId === '1') {
                    console.log('기간 차트 탭 선택');
                    this.loadApiKeyExpiryInfo();
                } else if (tabId === '2') {
                    console.log('위험군 탭 선택');
                    this.renderRiskApiKeyMngrTable();
                } else if (tabId === '3') {
                    console.log('설정 탭 선택');
                    this.loadMailSettings();
                    this.loadEventLog();
                }
            });
        });
    },

    /**
     * API 키 관리 탭 내부 탭 전환 이벤트
     */
    setupApiTabNavigation: function() {
        const apiTabs = document.querySelectorAll('.api-tab-btn');
        const normalContainer = document.getElementById('normal-api-table-container');
        const abnormalContainer = document.getElementById('abnormal-api-table-container');

        apiTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const apiTab = tab.dataset.apiTab;

                // 모든 API 탭 버튼 상태 초기화
                apiTabs.forEach(t => {
                    t.classList.remove('active');
                });

                // 선택된 API 탭 활성화
                tab.classList.add('active');

                // 테이블 컨테이너 표시/숨기기
                if (apiTab === 'normal') {
                    normalContainer.classList.remove('hidden');
                    abnormalContainer.classList.add('hidden');
                    this.renderApiKeyMngrTable();
                } else if (apiTab === 'abnormal') {
                    normalContainer.classList.add('hidden');
                    abnormalContainer.classList.remove('hidden');
                    this.renderAbnormalApiKeyMngrTable();
                }
            });
        });
    },

    /**
     * 페이지당 수량 선택 이벤트
     */
    setupPageSizeSelect: function() {
        const pageSizeSelect = document.getElementById('page-size-select');
        const riskPageSizeSelect = document.getElementById('risk-page-size-select');

        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', () => {
                this.renderApiKeyMngrTable();
                this.renderAbnormalApiKeyMngrTable();
            });
        }

        if (riskPageSizeSelect) {
            riskPageSizeSelect.addEventListener('change', () => {
                this.renderRiskApiKeyMngrTable();
            });
        }
    },

    /**
     * CD 업데이트 버튼 이벤트
     */
    setupUpdateCdButton: function() {
        const updateCdButton = document.getElementById('update-cd-button');
        if (updateCdButton) {
            updateCdButton.addEventListener('click', async () => {
                this.showLoading();
                try {
                    const result = await ApiKeyMngrData.updateCdFromMngrSett();
                    if (result) {
                        this.showSuccessMessage(`성공적으로 ${result.added_count}개의 CD 값을 추가했습니다.`);
                        // 데이터 다시 로드
                        await this.handlePageLoad();
                    } else {
                        this.showErrorMessage('CD 업데이트에 실패했습니다.');
                    }
                } catch (error) {
                    this.showErrorMessage('CD 업데이트 중 오류가 발생했습니다.');
                } finally {
                    this.hideLoading();
                }
            });
        }
    },

    /**
     * API 키 유통기한 정보 로드
     */
    loadApiKeyExpiryInfo: function() {
        this.showLoading();
        try {
            // 기존 데이터를 사용하여 Gantt 차트 렌더링
            this.renderGanttChart();
        } catch (error) {
            console.error('API 키 유통기한 정보 조회 실패:', error);
            this.showErrorMessage('API 키 유통기한 정보를 불러오는 데 실패했습니다.');
        } finally {
            this.hideLoading();
        }
    },

    /**
     * 메일 설정 저장
     */
    saveMailSettings: async function() {
        const settings = {
            mail30: {
                subject: document.getElementById('mail30_subject')?.value || '',
                from: document.getElementById('mail30_from')?.value || '',
                body: document.getElementById('mail30_body')?.value || ''
            },
            mail7: {
                subject: document.getElementById('mail7_subject')?.value || '',
                from: document.getElementById('mail7_from')?.value || '',
                body: document.getElementById('mail7_body')?.value || ''
            },
            mail0: {
                subject: document.getElementById('mail0_subject')?.value || '',
                from: document.getElementById('mail0_from')?.value || '',
                body: document.getElementById('mail0_body')?.value || ''
            }
        };

        try {
            const response = await axios.post('/api/api_key_mngr/mail_settings', settings);
            if (response.data.success) {
                alert('메일 설정이 저장되었습니다.');
            } else {
                alert('메일 설정 저장 실패: ' + (response.data.message || '알 수 없는 오류'));
            }
        } catch (error) {
            console.error('메일 설정 저장 오류:', error);
            alert('메일 설정 저장 중 오류가 발생했습니다.');
        }
    },

    /**
     * 메일 설정 로드
     */
    loadMailSettings: async function() {
        try {
            const response = await axios.get('/api/api_key_mngr/mail_settings');
            if (response.data.success) {
                const settings = response.data.settings;
                if (settings.mail30) {
                    document.getElementById('mail30_subject').value = settings.mail30.subject || '';
                    document.getElementById('mail30_from').value = settings.mail30.from || '';
                    document.getElementById('mail30_body').value = settings.mail30.body || '';
                }
                if (settings.mail7) {
                    document.getElementById('mail7_subject').value = settings.mail7.subject || '';
                    document.getElementById('mail7_from').value = settings.mail7.from || '';
                    document.getElementById('mail7_body').value = settings.mail7.body || '';
                }
                if (settings.mail0) {
                    document.getElementById('mail0_subject').value = settings.mail0.subject || '';
                    document.getElementById('mail0_from').value = settings.mail0.from || '';
                    document.getElementById('mail0_body').value = settings.mail0.body || '';
                }
            }
        } catch (error) {
            console.error('메일 설정 로드 오류:', error);
        }
    },

    /**
     * 이벤트 이력 로드
     */
    loadEventLog: async function() {
        const tableBody = document.getElementById('event-log-table-body');
        if (!tableBody) return;

        try {
            const response = await axios.get('/api/api_key_mngr/event_log');
            if (response.data.success) {
                const logs = response.data.logs || [];
                tableBody.innerHTML = '';
                
                if (logs.length === 0) {
                    tableBody.innerHTML = `
                        <tr>
                            <td colspan="5" class="py-8 px-6 text-center text-gray-500">
                                전송 이력이 없습니다.
                            </td>
                        </tr>
                    `;
                    return;
                }

                logs.forEach(log => {
                    const row = document.createElement('tr');
                    row.className = 'hover:bg-gray-50 transition';
                    
                    const resultClass = log.success ? 'text-green-600 font-medium' : 'text-red-600 font-medium';
                    const resultText = log.success ? '성공' : '실패';
                    
                    row.innerHTML = `
                        <td class="py-4 px-6 text-gray-700">${log.sent_at || '-'}</td>
                        <td class="py-4 px-6 font-medium text-gray-800">${log.cd || '-'}</td>
                        <td class="py-4 px-6 text-gray-700">${log.to_email || '-'}</td>
                        <td class="py-4 px-6 ${resultClass}">${resultText}</td>
                        <td class="py-4 px-6 text-gray-500">${log.error_msg || '-'}</td>
                    `;
                    tableBody.appendChild(row);
                });
            }
        } catch (error) {
            console.error('이벤트 이력 로드 오류:', error);
        }
    }
};
