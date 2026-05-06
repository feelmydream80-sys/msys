

window.ApiKeyMngrUI = window.ApiKeyMngrUI || {};






window.ApiKeyMngrUI.updateStatisticsCount = function(keys) {
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
};


window.ApiKeyMngrUI.updateApiKeyMngrStatisticsCount = function() {
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

    window.ApiKeyMngrUI.updateStatisticsCount(keys);
};






window.ApiKeyMngrUI.renderGanttChart = function() {
    const today = new Date();
    const VIEW_START = new Date(today.getFullYear() - 1, 9, 1);
    const VIEW_END = new Date(today.getFullYear() + 1, 0, 1);
    const TOTAL_MS = VIEW_END - VIEW_START;


    const apiData = ApiKeyMngrData.getApiKeyMngrData();
    

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


    window.ApiKeyMngrUI.updateStatisticsCount(keys);


    const q = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    const sortBy = 'expiry';

    let filtered = keys.filter(k => {
        const matchQ = !q || k.name.toLowerCase().includes(q) || k.id.toLowerCase().includes(q);
        const matchS = window.ApiKeyMngrUI.currentFilter === 'all' || k.status === window.ApiKeyMngrUI.currentFilter;
        return matchQ && matchS;
    });


    filtered.sort((a, b) => {
        if (sortBy === 'expiry') return a.endDate - b.endDate;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return new Date(a.start) - new Date(b.start);
    });


    window.ApiKeyMngrUI.buildGantt('API 키 유효기간', filtered, 'ganttChart');
};


window.ApiKeyMngrUI.buildGantt = function(labelText, items, containerId) {
    if (!items.length) { 
        document.getElementById(containerId).innerHTML = '<div class="no-result">검색 결과가 없습니다.</div>'; 
        return; 
    }
    

    const startIndex = (window.ApiKeyMngrUI.currentPage - 1) * window.ApiKeyMngrUI.itemsPerPage;
    const endIndex = startIndex + window.ApiKeyMngrUI.itemsPerPage;
    const paginatedItems = items.slice(startIndex, endIndex);

    const today = new Date();
    const todayP = window.ApiKeyMngrUI.calculatePct(today);

    const rows = paginatedItems.map((k, idx) => {
        const left = window.ApiKeyMngrUI.calculatePct(k.start);
        const right = window.ApiKeyMngrUI.calculatePct(k.end);
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
    

    const totalPages = Math.ceil(items.length / window.ApiKeyMngrUI.itemsPerPage);
    let paginationHtml = '';
    if (totalPages > 1) {
        paginationHtml = '<div class="flex justify-center items-center gap-2 mt-4">';
        paginationHtml += `<button onclick="ApiKeyMngrUI.previousPage()" ${window.ApiKeyMngrUI.currentPage === 1 ? 'disabled' : ''} class="px-3 py-1 rounded-lg text-sm font-medium ${window.ApiKeyMngrUI.currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}">이전</button>`;
        
        const visiblePages = 5;
        let startPage = Math.max(1, window.ApiKeyMngrUI.currentPage - Math.floor(visiblePages / 2));
        let endPage = Math.min(totalPages, startPage + visiblePages - 1);
        
        if (endPage - startPage + 1 < visiblePages) {
            startPage = Math.max(1, endPage - visiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `<button onclick="ApiKeyMngrUI.goToPage(${i})" class="px-3 py-1 rounded-lg text-sm font-medium ${i === window.ApiKeyMngrUI.currentPage ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}">${i}</button>`;
        }
        
        paginationHtml += `<button onclick="ApiKeyMngrUI.nextPage()" ${window.ApiKeyMngrUI.currentPage === totalPages ? 'disabled' : ''} class="px-3 py-1 rounded-lg text-sm font-medium ${window.ApiKeyMngrUI.currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}">다음</button>`;
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
};


window.ApiKeyMngrUI.calculatePct = function(date) {
    const today = new Date();
    const VIEW_START = new Date(today.getFullYear() - 1, 9, 1);
    const VIEW_END = new Date(today.getFullYear() + 1, 0, 1);
    const TOTAL_MS = VIEW_END - VIEW_START;
    
    const d = new Date(date);
    return Math.max(0, Math.min(100, ((d - VIEW_START) / TOTAL_MS) * 100));
};






window.ApiKeyMngrUI.handlePageSizeChange = function() {
    const select = document.getElementById('gantt-page-size-select');
    window.ApiKeyMngrUI.itemsPerPage = parseInt(select.value);
    window.ApiKeyMngrUI.currentPage = 1;
    window.ApiKeyMngrUI.renderGanttChart();
};


window.ApiKeyMngrUI.previousPage = function() {
    if (window.ApiKeyMngrUI.currentPage > 1) {
        window.ApiKeyMngrUI.currentPage--;
        window.ApiKeyMngrUI.renderGanttChart();
    }
};


window.ApiKeyMngrUI.nextPage = function() {
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
        const matchS = window.ApiKeyMngrUI.currentFilter === 'all' || k.status === window.ApiKeyMngrUI.currentFilter;
        return matchQ && matchS;
    });

    const totalPages = Math.ceil(filtered.length / window.ApiKeyMngrUI.itemsPerPage);
    if (window.ApiKeyMngrUI.currentPage < totalPages) {
        window.ApiKeyMngrUI.currentPage++;
        window.ApiKeyMngrUI.renderGanttChart();
    }
};


window.ApiKeyMngrUI.goToPage = function(page) {
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
        const matchS = window.ApiKeyMngrUI.currentFilter === 'all' || k.status === window.ApiKeyMngrUI.currentFilter;
        return matchQ && matchS;
    });

    const totalPages = Math.ceil(filtered.length / window.ApiKeyMngrUI.itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        window.ApiKeyMngrUI.currentPage = page;
        window.ApiKeyMngrUI.renderGanttChart();
    }
};






window.ApiKeyMngrUI.showTip = function(e, el) {
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
    window.ApiKeyMngrUI.moveTip(e);
};


window.ApiKeyMngrUI.moveTip = function(e) {
    const tip = document.getElementById('tooltip');
    if (tip) {
        tip.style.left = (e.clientX + 14) + 'px';
        tip.style.top = (e.clientY - 12) + 'px';
    }
};


window.ApiKeyMngrUI.hideTip = function() { 
    const tip = document.getElementById('tooltip');
    if (tip) {
        tip.style.display = 'none'; 
    }
};






window.ApiKeyMngrUI.renderApiKeyExpiryChart = function() {
    window.ApiKeyMngrUI.renderGanttChart();
};




window.showTip = window.ApiKeyMngrUI.showTip;
window.hideTip = window.ApiKeyMngrUI.hideTip;
window.moveTip = window.ApiKeyMngrUI.moveTip;
