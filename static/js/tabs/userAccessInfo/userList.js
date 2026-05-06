

import { config } from './config.js';
import statusManager from './statusManager.js';
import { formatDBDateTime, getLast6Months, getWeeksPerMonthFn } from '../../modules/common/dateUtils.js';


function hmColor(value, mode = 'all') {
    if (!value) return '#f3f4f6';
    return '#C4A5F8';
}


window.__userAccessAnimationsAdded = window.__userAccessAnimationsAdded || false;


(function addAnimationStyles() {
    if (window.__userAccessAnimationsAdded || document.getElementById('user-access-animations')) {
        return;
    }
    window.__userAccessAnimationsAdded = true;
    
    const style = document.createElement('style');
    style.id = 'user-access-animations';
    style.textContent = `
        @keyframes heatmapGrow {
            from { transform: scaleY(0); opacity: 0; }
            to { transform: scaleY(1); opacity: 1; }
        }
        @keyframes lineDraw {
            from { stroke-dashoffset: var(--line-length, 100); }
            to { stroke-dashoffset: 0; }
        }
        @keyframes pointAppear {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .heatmap-bar {
            transform-origin: bottom;
            animation: heatmapGrow 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .line-path {
            animation: lineDraw 0.6s ease-out forwards;
        }
        .line-point {
            transform-origin: center;
            animation: pointAppear 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
    `;
    document.head.appendChild(style);
})();


function daysAgo(dateStr) {
    if (!dateStr) return 999;
    const today = new Date();
    const date = new Date(dateStr);
    return Math.floor((today - date) / (1000 * 60 * 60 * 24));
}


const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월'];


let dynamicThresholds = { cd991: 30, cd992: 7, cd993: 90 };

export function setThresholds(thresholds) {
    dynamicThresholds = { ...dynamicThresholds, ...thresholds };
}

class UserListRenderer {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.total = 0;
        this.searchTerm = '';
        this.filterMode = 'none';
        this.filterDays = 0;
        this.sortKey = null;
        this.sortDir = 'asc';
        this.users = [];
        this.mode = 'all';
        this.chartType = 'heatmap';
        this._renderDebounceTimer = null;
        this._isRendering = false;
        this._loadingPromise = null;
    }


    setChartType(chartType) {
        this.chartType = chartType;

        if (window.userAccessInfo?.isInitialized) {
            this.renderTable(this.users);
        }

        this.updateChartTypeButtons();
    }


    updateChartTypeButtons() {
        const btnHeatmap = document.getElementById('btn-chart-heatmap');
        const btnLine = document.getElementById('btn-chart-line');
        
        if (btnHeatmap) {
            const isActive = this.chartType === 'heatmap';
            btnHeatmap.style.cssText = isActive 
                ? 'padding: 4px 12px; border-radius: 4px; border: 1px solid #333; background: #333; color: #fff; font-size: 12px; cursor: pointer;'
                : 'padding: 4px 12px; border-radius: 4px; border: 1px solid #ddd; background: #fff; color: #666; font-size: 12px; cursor: pointer;';
        }
        
        if (btnLine) {
            const isActive = this.chartType === 'line';
            btnLine.style.cssText = isActive 
                ? 'padding: 4px 12px; border-radius: 4px; border: 1px solid #333; background: #333; color: #fff; font-size: 12px; cursor: pointer;'
                : 'padding: 4px 12px; border-radius: 4px; border: 1px solid #ddd; background: #fff; color: #666; font-size: 12px; cursor: pointer;';
        }
    }

    async setMode(mode) {
        this.mode = mode;

        await this.render(this.currentPage, this.pageSize, this.searchTerm, this.filterMode, this.filterDays);
    }


    async render(page = 1, pageSize = 10, searchTerm = '', filterMode = 'none', filterDays = 0, forceReload = false) {

        if (this._loadingPromise) {
            return this._loadingPromise;
        }

        this._loadingPromise = this._doRender(page, pageSize, searchTerm, filterMode, filterDays, forceReload);
        
        try {
            return await this._loadingPromise;
        } finally {
            this._loadingPromise = null;
        }
    }

    async _doRender(page, pageSize, searchTerm, filterMode, filterDays, forceReload) {
        this.currentPage = page;
        this.pageSize = pageSize;
        this.searchTerm = searchTerm;
        this.filterMode = filterMode;
        this.filterDays = filterDays;

        let data = null;


        if (forceReload || !this.users || this.users.length === 0) {
            data = await this.fetchUsers(page, pageSize, searchTerm);
            this.users = data.items;
        }


        if (filterMode === 'all' && filterDays > 0 && this.users) {
            this.users = this.users.filter(u => daysAgo(u.last_acs_dt) >= filterDays);
            if (data) {
                data.total = this.users.length;
                data.total_pages = Math.ceil(data.total / pageSize);
            }
        }

        this.renderTable(this.users);
        if (data && data.total !== undefined) {
            this.renderPagination(data);
        }
        this.updateChartTypeButtons();

        return data;
    }

    async fetchUsers(page, pageSize, searchTerm) {
        try {
            const params = new URLSearchParams({
                page: page,
                page_size: pageSize,
                mode: this.mode
            });
            
            if (searchTerm) {
                params.append('search', searchTerm);
            }

            const response = await fetch(`/api/analytics/statistics/user-list?${params}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            

            const usersWithWeeklyData = data.items.map(user => ({
                ...user,
                weekly_data: user.weekly_data || []
            }));
            

            return {
                items: usersWithWeeklyData.map(user => ({
                    user_id: user.user_id,
                    user_nm: user.user_id,
                    acc_sts: user.acc_sts,
                    monthly_counts: user.monthly_counts || [0,0,0,0,0,0],
                    weekly_data: user.weekly_data || [],
                    total: user.total_acs_cnt || 0,
                    last_acs_dt: user.last_acs_dt,
                    initials: this._getInitials(user.user_id),
                    status_info: user.status_info || this._calculateStatus(user.last_acs_dt)
                })),
                total: data.total,
                page: data.page,
                page_size: data.page_size,
                total_pages: data.total_pages
            };
        } catch (e) {
            return {
                items: [],
                total: 0,
                page: 1,
                page_size: pageSize,
                total_pages: 0
            };
        }
    }

    _getInitials(userId) {
        const letters = userId.match(/[a-zA-Z]/g);
        if (letters) {
            return letters.slice(0, 2).join('').toUpperCase();
        }
        return userId.substring(0, 2).toUpperCase();
    }

    _calculateStatus(lastAcsDt, accSts) {

        const statusMap = {
            'APPROVED': { label: '승인', cls: 'b-green' },
            'PENDING': { label: '대기', cls: 'b-amber' },
            'DORMANT': { label: '휴 면', cls: 'b-gray' },
            'INACTIVE': { label: '비활성', cls: 'b-red' }
        };
        
        if (accSts && statusMap[accSts]) {
            return statusMap[accSts];
        }
        

        if (!lastAcsDt) {
            return { label: '미접속', cls: 'b-gray' };
        }
        
        const da = daysAgo(lastAcsDt);
        const { cd991, cd992, cd993 } = dynamicThresholds;
        

        if (da <= cd992) return { label: '활성', cls: 'b-green' };
        if (da <= cd991) return { label: '최근', cls: 'b-amber' };
        if (da <= cd993) return { label: '휴 면', cls: 'b-gray' };
        return { label: '비활성', cls: 'b-red' };
    }

    renderTable(users) {

        if (this._renderDebounceTimer) {
            clearTimeout(this._renderDebounceTimer);
        }
        
        this._renderDebounceTimer = setTimeout(() => {
            this._doRenderTable(users);
        }, 50);
    }
    
    _doRenderTable(users) {
        const tbody = document.getElementById('userAccessTableBody');
        if (!tbody) {
            this._renderDebounceTimer = null;
            return;
        }

        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" style="text-align: center; padding: 40px; color: #666;">
                        등록된 사용자가 없습니다.
                    </td>
                </tr>
            `;
            this._renderDebounceTimer = null;
            return;
        }

        tbody.innerHTML = users.map(user => {
            const st = user.status_info || this._calculateStatus(user.last_acs_dt, user.acc_sts);
            const da = daysAgo(user.last_acs_dt);
            const daLabel = da === 0 ? '오늘' : da === 1 ? '어제' : da < 0 ? '오늘' : da + '일 전';

            const lastAccessDate = user.last_acs_dt ? 
                formatDBDateTime(user.last_acs_dt).split(' ')[0] : '-';


            const weeksPerMonth = getWeeksPerMonthFn(6);
            const weeklyData = user.weekly_data || [];
            

            let monthlyCells;
            
            if (this.chartType === 'line') {

                monthlyCells = this._renderWeeklyLineCells(weeklyData, weeksPerMonth);
            } else {

                monthlyCells = this._renderMonthlyHeatmapCells(weeklyData, weeksPerMonth);
            }

            return `
                <tr data-user-id="${this.escapeHtml(user.user_id)}">
                    <td><span class="user-id" style="font-family:monospace;font-size:12px;">${this.escapeHtml(user.user_id)}</span></td>
                    <td><span class="count" style="font-weight:500;">${user.total}회</span></td>
                    ${monthlyCells}
                    <td>
                        <div class="last-access" style="color:#666;font-size:12px;">${lastAccessDate}</div>
                        <div class="days-ago" style="font-size:11px;color:#999;margin-top:1px;">${daLabel}</div>
                    </td>
                    <td><span class="badge" style="display:inline-block;padding:2px 7px;border-radius:20px;font-size:11px;font-weight:500;background:${st.cls === 'b-green' ? '#f0fdf4;color:#166534' : st.cls === 'b-amber' ? '#fffbeb;color:#92400e' : st.cls === 'b-red' ? '#fef2f2;color:#991b1b' : '#f4f4f4;color:#6b7280'}">${st.label}</span></td>
                    <td><button class="detail-btn" onclick="window.userAccessInfo?.showDetail('${user.user_id}')" style="padding:4px 10px;border-radius:6px;border:1px solid #ddd;background:transparent;color:#666;font-size:11px;cursor:pointer;">상세</button></td>
                </tr>
            `;
        }).join('');
        
        this._renderDebounceTimer = null;
    }

    renderPagination(data) {
        const container = document.getElementById('userAccessPagination');
        const totalCountEl = document.getElementById('userAccessTotalCount');
        

        if (totalCountEl) {
            totalCountEl.textContent = `(총 ${data.total}명)`;
        }

        if (!container) return;

        const { page, total_pages, total } = data;

        if (total === 0) {
            container.innerHTML = '';
            return;
        }

        let html = '';


        if (page > 1) {
            html += `<button onclick="window.userAccessInfo?.render(${page - 1})" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">이전</button>`;
        }


        for (let i = 1; i <= total_pages; i++) {
            if (i === 1 || i === total_pages || (i >= page - 2 && i <= page + 2)) {
                html += `<button onclick="window.userAccessInfo?.render(${i})" 
                        style="padding: 6px 12px; border: 1px solid ${i === page ? '#007bff' : '#ddd'}; background: ${i === page ? '#007bff' : 'white'}; color: ${i === page ? 'white' : '#333'}; border-radius: 4px; cursor: pointer;">${i}</button>`;
            } else if (i === page - 3 || i === page + 3) {
                html += `<span style="padding: 6px;">...</span>`;
            }
        }


        if (page < total_pages) {
            html += `<button onclick="window.userAccessInfo?.render(${page + 1})" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">다음</button>`;
        }

        container.innerHTML = html;
    }

    setFilter(mode, days) {
        this.filterMode = mode;
        this.filterDays = days;
        this.render(this.currentPage, this.pageSize, this.searchTerm, mode, days);
    }

    updateFilterButtons(mode) {
        const btnAll = document.getElementById('btn-filter-all');
        const btnNone = document.getElementById('btn-filter-none');
        if (btnAll && btnNone) {
            btnAll.style.cssText = mode === 'all' 
                ? 'height: 32px; padding: 0 10px; border-radius: 4px; border: 1px solid #333; background: #333; color: #fff; font-size: 12px; cursor: pointer;'
                : 'height: 32px; padding: 0 10px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.16); background: white; color: #666; font-size: 12px; cursor: pointer;';
            btnNone.style.cssText = mode === 'none'
                ? 'height: 32px; padding: 0 10px; border-radius: 4px; border: 1px solid #333; background: #333; color: #fff; font-size: 12px; cursor: pointer;'
                : 'height: 32px; padding: 0 10px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.16); background: white; color: #666; font-size: 12px; cursor: pointer;';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }


    _renderMonthlyHeatmapCells(weeklyData, weeksPerMonth) {

        if (!weeklyData || weeklyData.length === 0) {
            weeklyData = new Array(26).fill(0);
        }
        

        const cleanWeeklyData = weeklyData.filter(v => v !== null).slice(0, 26);
        

        while (cleanWeeklyData.length < 26) {
            cleanWeeklyData.push(0);
        }
        
        let weekIndex = 0;
        
        return weeksPerMonth.map((weekCount, monthIdx) => {

            const monthWeeks = [];
            for (let i = 0; i < weekCount && weekIndex < cleanWeeklyData.length; i++) {
                monthWeeks.push(cleanWeeklyData[weekIndex]);
                weekIndex++;
            }
            

            const bars = monthWeeks.map((val, idx) => {
                if (val === 0 || val === undefined || val === null) {
                    return `<div style="width: 4px; height: 30px; visibility: hidden; flex-shrink: 0;"></div>`;
                }
                const color = hmColor(val, this.mode);

                const heightPercent = Math.min(100, Math.max(20, val * 5));
                const heightPx = Math.round(30 * heightPercent / 100);
                const delay = idx * 40;
                return `<div class="heatmap-bar" style="width: 4px; height: ${heightPx}px; background: ${color}; border-radius: 1px; flex-shrink: 0; animation-delay: ${delay}ms; opacity: 0;" title="${idx + 1}주차: ${val}회"></div>`;
            }).join('');
            

            const monthTotal = monthWeeks.reduce((sum, v) => sum + (v || 0), 0);
            
            return `<td style="text-align: center; padding: 8px 4px;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 6px; height: 30px;">
                    <div style="display: flex; align-items: flex-end; gap: 2px;">
                        ${bars}
                    </div>
                    <span style="font-size: 10px; font-weight: 500; color: #666; min-width: 20px; text-align: left;">${monthTotal}</span>
                </div>
            </td>`;
        }).join('');
    }


    _renderWeeklyLineCells(weeklyData, weeksPerMonth) {
        const cleanWeeklyData = (weeklyData || []).filter(v => v !== null).slice(0, 26);
        while (cleanWeeklyData.length < 26) {
            cleanWeeklyData.push(0);
        }

        let weekIndex = 0;

        return weeksPerMonth.map((weekCount, monthIdx) => {
            const monthWeeks = [];
            for (let i = 0; i < weekCount && weekIndex < cleanWeeklyData.length; i++) {
                monthWeeks.push(cleanWeeklyData[weekIndex]);
                weekIndex++;
            }

            if (monthWeeks.length === 0) {
                return `<td style="text-align: center; padding: 8px 4px;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                        <svg width="50" height="25"></svg>
                        <span style="font-size: 10px; font-weight: 500; color: #999;">0</span>
                    </div>
                </td>`;
            }

            const maxVal = Math.max(...monthWeeks, 1);
            const pointsArr = monthWeeks.map((val, i) => {
                const x = (i / (monthWeeks.length - 1 || 1)) * 50;
                const y = 25 - ((val / maxVal) * 20);
                return { x, y, val };
            });
            const points = pointsArr.map(p => `${p.x},${p.y}`).join(' ');


            let lineLength = 0;
            for (let i = 1; i < pointsArr.length; i++) {
                const dx = pointsArr[i].x - pointsArr[i-1].x;
                const dy = pointsArr[i].y - pointsArr[i-1].y;
                lineLength += Math.sqrt(dx * dx + dy * dy);
            }

            lineLength = Math.ceil(lineLength * 1.5);


            const monthTotal = monthWeeks.reduce((sum, v) => sum + (v || 0), 0);

            return `<td style="text-align: center; padding: 8px 4px;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                    <svg width="50" height="25" style="vertical-align: middle;">
                        <polyline class="line-path" points="${points}" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
                            stroke-dasharray="${lineLength}" stroke-dashoffset="${lineLength}" style="--line-length: ${lineLength}; animation-delay: ${monthIdx * 100}ms;"/>
                        ${pointsArr.map((p, i) => {
                            const pointDelay = monthIdx * 100 + (i * 50) + 300;
                            const fill = i === pointsArr.length - 1 ? '#1e40af' : '#93c5fd';
                            return `<circle class="line-point" cx="${p.x}" cy="${p.y}" r="2" fill="${fill}" style="animation-delay: ${pointDelay}ms; opacity: 0;"/>`;
                        }).join('')}
                    </svg>
                    <span style="font-size: 10px; font-weight: 500; color: #666; min-width: 20px; text-align: left;">${monthTotal}</span>
                </div>
            </td>`;
        }).join('');
        
        this._renderDebounceTimer = null;
    }
}


const userListRenderer = new UserListRenderer();

export default userListRenderer;
