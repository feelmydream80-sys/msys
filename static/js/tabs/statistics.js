


import { statisticsApi } from '../services/api.js';
import { stateManager } from '../services/stateManager.js';
import { debugLog } from '../utils.js';


class StatisticsTab {
    
    constructor() {

        this.elements = {
            tab: null,
            dailyViewRadio: null,
            weeklyMonthlyViewRadio: null,
            comparisonViewRadio: null,
            yearSelect: null,
            menuSelect: null,
            dateRangeContainer: null,
            startDateInput: null,
            endDateInput: null,
            filterBtn: null,
            excelDownloadBtn: null,
            dailyViewContainer: null,
            weeklyMonthlyViewContainer: null,
            comparisonViewContainer: null,
            summaryContainer: null,
            dailyTableBody: null,
            weeklyTable: null,
            comparisonTable: null,
            comparisonYearLegend: null,
            chartCanvas: null,
            chartInstance: null
        };
        

        this.eventListenersInitialized = false;
    }

    
    initElements() {
        const container = document.getElementById('mngr_sett_page');
        if (!container) return false;

        Object.keys(this.elements).forEach(key => {
            const id = {
                tab: 'button[data-tab="statistics"]',
                dailyViewRadio: 'dailyViewRadio',
                weeklyMonthlyViewRadio: 'weeklyMonthlyViewRadio',
                comparisonViewRadio: 'comparisonViewRadio',
                yearSelect: 'statsYearSelect',
                menuSelect: 'statsMenuSelect',
                dateRangeContainer: 'statsDateRangeContainer',
                startDateInput: 'statsStartDate',
                endDateInput: 'statsEndDate',
                filterBtn: 'statsFilterBtn',
                excelDownloadBtn: 'statsExcelDownloadBtn',
                dailyViewContainer: 'dailyViewContainer',
                weeklyMonthlyViewContainer: 'weeklyMonthlyViewContainer',
                comparisonViewContainer: 'comparisonViewContainer',
                summaryContainer: 'statsSummary',
                dailyTableBody: 'menuStatsTableBody',
                weeklyTable: 'weeklyMonthlyStatsTable',
                comparisonTable: 'comparisonStatsTable',
                comparisonYearLegend: 'comparisonYearLegend',
                chartCanvas: 'accessStatsChart'
            }[key];
            
            this.elements[key] = container.querySelector(`#${id}`) || container.querySelector(id);
        });

        return true;
    }

    
    initEventListeners() {

        if (!this.eventListenerCount) {
            this.eventListenerCount = 0;
        }
        this.eventListenerCount++;


        this.handleTabClick = () => this.loadConfig();
        this.handleDownloadClick = () => this.downloadExcel();
        this.autoLoadStats = () => {
            this.toggleView();
            this.loadData();
        };
        this.handleYearChange = () => this.loadData();
        this.handleDateChange = () => this.loadData();




        if (this.elements.tab) {

            this.elements.tab.removeEventListener('click', this.handleTabClick);

            this.elements.tab.addEventListener('click', this.handleTabClick);
        }

        if (this.elements.excelDownloadBtn) {

            this.elements.excelDownloadBtn.removeEventListener('click', this.handleDownloadClick);

            this.elements.excelDownloadBtn.addEventListener('click', this.handleDownloadClick);
        }

        if (this.elements.dailyViewRadio) {

            this.elements.dailyViewRadio.removeEventListener('change', this.autoLoadStats);

            this.elements.dailyViewRadio.addEventListener('change', this.autoLoadStats);
        }
        if (this.elements.weeklyMonthlyViewRadio) {

            this.elements.weeklyMonthlyViewRadio.removeEventListener('change', this.autoLoadStats);

            this.elements.weeklyMonthlyViewRadio.addEventListener('change', this.autoLoadStats);
        }
        if (this.elements.comparisonViewRadio) {

            this.elements.comparisonViewRadio.removeEventListener('change', this.autoLoadStats);

            this.elements.comparisonViewRadio.addEventListener('change', this.autoLoadStats);
        }
        if (this.elements.yearSelect) {

            this.elements.yearSelect.removeEventListener('change', this.handleYearChange);

            this.elements.yearSelect.addEventListener('change', this.handleYearChange);
        }
        if (this.elements.startDateInput) {

            this.elements.startDateInput.removeEventListener('change', this.handleDateChange);

            this.elements.startDateInput.addEventListener('change', this.handleDateChange);
        }

    }

    
    initializeDateInputs() {

        if (this.elements.startDateInput) {
            const today = new Date().toISOString().split('T')[0];
            this.elements.startDateInput.value = today;
        }
    }

    
    async loadConfig() {

        if (this.elements.yearSelect.options.length > 0) {
            this.loadData();
            return;
        }

        try {
            const config = await statisticsApi.getConfig();
            

            this.elements.yearSelect.innerHTML = '';
            config.years.forEach(year => {
                const option = new Option(`${year}년`, year);
                this.elements.yearSelect.add(option);
            });


            this.elements.menuSelect.innerHTML = '';
            this.elements.menuSelect.add(new Option('전체 메뉴', 'all'));
            config.menus.forEach(menu => {
                const option = new Option(menu.menu_nm, menu.menu_id);
                this.elements.menuSelect.add(option);
            });


            stateManager.setState('menus', config.menus || []);
            stateManager.setState('icons', config.icons || []);


            this.initializeDateInputs();


            this.toggleView();

            this.loadData();
        } catch (error) {

        }
    }

    
    async loadData() {
        debugLog('통계 데이터 로드 시작');

        const viewType = document.querySelector('input[name="statsViewType"]:checked')?.value;
        debugLog('통계 뷰 타입:', viewType);

        if (!viewType) {

            return;
        }

        const params = new URLSearchParams({ view_type: viewType });
        debugLog('API 파라미터:', params.toString());

        if (viewType === 'daily') {
            const selectedDate = this.elements.startDateInput?.value;
            debugLog('선택된 날짜:', selectedDate);

            if (!selectedDate) {


                const today = new Date().toISOString().split('T')[0];
                params.append('start_date', today);
                params.append('end_date', today);
            } else {
                params.append('start_date', selectedDate);
                params.append('end_date', selectedDate);
            }
        } else {
            const selectedYear = this.elements.yearSelect?.value;
            debugLog('선택된 연도:', selectedYear);

            if (!selectedYear) {


                const currentYear = new Date().getFullYear();
                params.append('year', currentYear.toString());
            } else {
                params.append('year', selectedYear);
            }
            params.append('menu_nm', 'all');
        }

        debugLog('최종 API 파라미터:', params.toString());

        try {
            debugLog('통계 API 호출 시작:', `/api/statistics?${params.toString()}`);
            const data = await statisticsApi.getData(viewType, Object.fromEntries(params));
            debugLog('통계 API 데이터 수신:', data);

            if (viewType === 'daily') {
                this.renderDailyStats(data);
            } else if (viewType === 'weekly_monthly') {
                this.renderWeeklyMonthlyStats(data);

                this.renderLineChart(data.yearly_chart_data, data.weekly_stats);
            } else if (viewType === 'comparison') {
                this.renderComparisonStats(data);

                this.renderComparisonLineChart(data);
            }
        } catch (error) {

        }
    }

    
    renderDailyStats(data) {
        debugLog('일별 통계 렌더링 시작');
        debugLog('데이터:', data);

        const { menu_access_stats, total_access_stats } = data;
        debugLog('메뉴 접근 통계:', menu_access_stats);
        debugLog('전체 통계:', total_access_stats);


        const allMenus = stateManager.getState('menus') || [];
        debugLog('전체 메뉴 목록:', allMenus);


        this.elements.summaryContainer.innerHTML = `
            <div class="bg-blue-100 p-4 rounded-lg text-center">
                <p class="text-lg font-semibold text-blue-800">총 접속 횟수</p>
                <p class="text-3xl font-bold">${total_access_stats.total_access_count || 0}</p>
            </div>
            <div class="bg-green-100 p-4 rounded-lg text-center">
                <p class="text-lg font-semibold text-green-800">순 방문자 수</p>
                <p class="text-3xl font-bold">${total_access_stats.unique_user_count || 0}</p>
            </div>
        `;


        this.elements.dailyTableBody.innerHTML = '';
        
        if (allMenus.length > 0) {

            const statsMap = new Map();
            if (menu_access_stats) {
                menu_access_stats.forEach(stat => {
                    const key = stat.menu_id || stat.menu_nm;
                    statsMap.set(key, stat);
                });
            }

            allMenus.forEach(menu => {
                const stat = statsMap.get(menu.menu_id) || statsMap.get(menu.menu_nm) || { total_access_count: 0, unique_user_count: 0 };
                const row = `<tr>
                    <td>${menu.menu_nm}</td>
                    <td>${stat.total_access_count}</td>
                    <td>${stat.unique_user_count}</td>
                </tr>`;
                this.elements.dailyTableBody.innerHTML += row;
            });
            

            this.renderBarChart(menu_access_stats || [], allMenus);
        } else {
            this.elements.dailyTableBody.innerHTML = '<tr><td colspan="3">표시할 메뉴가 없습니다.</td></tr>';
        }
    }

    
    renderWeeklyMonthlyStats(data) {
        const { weekly_stats, yearly_total } = data;
        const table = this.elements.weeklyTable;
        if (!table) return;


        table.innerHTML = '';


        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        const headers = ['월', '주차', '메뉴', '총 접속 횟수', '메뉴별 순 방문자 수', '사이트 순 방문자 수'];
        headers.forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });


        const tbody = table.createTBody();
        if (weekly_stats && weekly_stats.length > 0) {
            const monthlyData = {};
            weekly_stats.forEach(week => {
                if (!monthlyData[week.month]) {
                    monthlyData[week.month] = [];
                }
                monthlyData[week.month].push(week);
            });

            Object.keys(monthlyData).sort((a, b) => a - b).forEach(month => {
                const weeksInMonth = monthlyData[month];
                const totalRowsInMonth = weeksInMonth.reduce((sum, week) => sum + week.menus.length, 0);
                

                let monthlyTotalAccessCount = 0;
                let monthlyTotalMenuUniqueUserCount = 0;
                let monthlyTotalSiteUniqueUserCount = 0;
                
                weeksInMonth.forEach(weekData => {
                    weekData.menus.forEach(menu => {
                        monthlyTotalAccessCount += menu.total_access_count || 0;
                        monthlyTotalMenuUniqueUserCount += menu.unique_user_count || 0;
                    });
                    monthlyTotalSiteUniqueUserCount += weekData.site_unique_user_count || 0;
                });
                
                weeksInMonth.forEach((weekData, weekIndex) => {
                    weekData.menus.forEach((menu, menuIndex) => {
                        const row = tbody.insertRow();
                        
                        if (weekIndex === 0 && menuIndex === 0) {
                            const monthCell = row.insertCell();
                            monthCell.textContent = `${month}월`;
                            monthCell.rowSpan = totalRowsInMonth + 1;
                            monthCell.style.verticalAlign = 'middle';
                        }

                        if (menuIndex === 0) {
                            const weekCell = row.insertCell();
                            weekCell.textContent = `${weekData.week}주`;
                            weekCell.rowSpan = weekData.menus.length;
                            weekCell.style.verticalAlign = 'middle';
                        }

                        row.insertCell().textContent = menu.menu_nm;
                        row.insertCell().textContent = (menu.total_access_count || 0).toLocaleString();
                        row.insertCell().textContent = (menu.unique_user_count || 0).toLocaleString();

                        if (menuIndex === 0) {
                            const siteUniqueCell = row.insertCell();
                            siteUniqueCell.textContent = (weekData.site_unique_user_count || 0).toLocaleString();
                            siteUniqueCell.rowSpan = weekData.menus.length;
                            siteUniqueCell.style.verticalAlign = 'middle';
                        }
                    });
                });
                

                const monthlyTotalRow = tbody.insertRow();
                monthlyTotalRow.style.fontWeight = 'bold';
                monthlyTotalRow.style.backgroundColor = '#f3f4f6';
                

                monthlyTotalRow.insertCell();
                monthlyTotalRow.insertCell();
                
                const monthlyTotalLabelCell = monthlyTotalRow.insertCell();
                monthlyTotalLabelCell.textContent = `${month}월 총계`;
                
                const monthlyTotalAccessCell = monthlyTotalRow.insertCell();
                monthlyTotalAccessCell.textContent = monthlyTotalAccessCount.toLocaleString();
                
                const monthlyTotalMenuUniqueCell = monthlyTotalRow.insertCell();
                monthlyTotalMenuUniqueCell.textContent = monthlyTotalMenuUniqueUserCount.toLocaleString();
                
                const monthlyTotalSiteUniqueCell = monthlyTotalRow.insertCell();
                monthlyTotalSiteUniqueCell.textContent = monthlyTotalSiteUniqueUserCount.toLocaleString();
            });
        } else {
            const row = tbody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = headers.length;
            cell.textContent = '데이터가 없습니다.';
            cell.style.textAlign = 'center';
        }


        let tfoot = table.querySelector('tfoot');
        if (!tfoot) {
            tfoot = table.createTFoot();
        }
        tfoot.innerHTML = '';

        if (weekly_stats && weekly_stats.length > 0) {

            const monthlyTotals = {};
            weekly_stats.forEach(week => {
                if (!monthlyTotals[week.month]) {
                    monthlyTotals[week.month] = {
                        total_access_count: 0,
                        total_menu_unique_user_count: 0,
                        total_site_unique_user_count: 0
                    };
                }
                
                week.menus.forEach(menu => {
                    monthlyTotals[week.month].total_access_count += menu.total_access_count || 0;
                    monthlyTotals[week.month].total_menu_unique_user_count += menu.unique_user_count || 0;
                });
                
                monthlyTotals[week.month].total_site_unique_user_count += week.site_unique_user_count || 0;
            });
            

            Object.keys(monthlyTotals).sort((a, b) => a - b).forEach(month => {
                const monthlyTotalRow = tfoot.insertRow();
                monthlyTotalRow.style.fontWeight = 'bold';
                monthlyTotalRow.style.backgroundColor = '#e5e7eb';
                
                const monthCell = monthlyTotalRow.insertCell();
                monthCell.textContent = `${month}월 총계`;
                monthCell.colSpan = 3;
                monthCell.style.textAlign = 'center';
                
                monthlyTotalRow.insertCell().textContent = monthlyTotals[month].total_access_count.toLocaleString();
                monthlyTotalRow.insertCell().textContent = monthlyTotals[month].total_menu_unique_user_count.toLocaleString();
                monthlyTotalRow.insertCell().textContent = monthlyTotals[month].total_site_unique_user_count.toLocaleString();
            });
        }
        

        if (yearly_total) {
            const footerRow = tfoot.insertRow();
            const totalCell = footerRow.insertCell();
            totalCell.colSpan = 3;
            totalCell.textContent = '연간 총계';
            totalCell.style.fontWeight = 'bold';
            totalCell.style.textAlign = 'center';
            totalCell.style.backgroundColor = '#d1d5db';

            footerRow.insertCell().textContent = (yearly_total.total_access_count || 0).toLocaleString();
            footerRow.insertCell().textContent = (yearly_total.total_menu_unique_user_count || 0).toLocaleString();
            footerRow.insertCell().textContent = (yearly_total.total_site_unique_user_count || 0).toLocaleString();
        }
    }

    
    renderBarChart(menuAccessStats, allMenus) {
        debugLog('막대 차트 렌더링 시작');
        debugLog('메뉴 접근 통계:', menuAccessStats);
        debugLog('전체 메뉴:', allMenus);

        if (this.elements.chartInstance) {
            debugLog('기존 차트 인스턴스 파괴');
            this.elements.chartInstance.destroy();
        }


        const statsMap = new Map();
        if (menuAccessStats) {
            menuAccessStats.forEach(item => {
                const key = item.menu_id || item.menu_nm;
                statsMap.set(key, item);
            });
        }
        debugLog('통계 맵 생성 완료');


        const chartData = allMenus.map(menu => {
            const stats = statsMap.get(menu.menu_id) || statsMap.get(menu.menu_nm);
            return {
                menu_nm: menu.menu_nm,
                total_access_count: stats ? stats.total_access_count : 0,
                unique_user_count: stats ? stats.unique_user_count : 0
            };
        });

        const labels = chartData.map(d => d.menu_nm);
        const totalAccessData = chartData.map(d => d.total_access_count);
        const uniqueUserData = chartData.map(d => d.unique_user_count);

        this.elements.chartInstance = new Chart(this.elements.chartCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '총 접속 횟수',
                        data: totalAccessData,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: '순 방문자 수',
                        data: uniqueUserData,
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                scales: { y: { beginAtZero: true } },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    
    renderLineChart(yearlyChartData, weeklyStatsData) {
        if (this.elements.chartInstance) {
            this.elements.chartInstance.destroy();
        }

        const year = this.elements.yearSelect.value;
        if (!year) return;


        const allWeeksData = [];
        const labels = [];
        for (let month = 1; month <= 12; month++) {

            for (let week = 1; week <= 5; week++) {
                const label = `${month}월 ${week}주`;
                labels.push(label);
                allWeeksData.push({
                    label: label,
                    month: month,
                    week: week,
                    total_access_count: 0,
                    menu_unique_user_count: 0,
                    site_unique_user_count: 0
                });
            }
        }


        const apiAggregates = {};
        if (yearlyChartData && yearlyChartData.length > 0) {
            yearlyChartData.forEach(row => {
                const key = `${row.month}-${row.week_of_month}`;
                if (!apiAggregates[key]) {
                    apiAggregates[key] = { total_access_count: 0, menu_unique_user_count: 0 };
                }
                apiAggregates[key].total_access_count += Number(row.total_access_count || 0);
                apiAggregates[key].menu_unique_user_count += Number(row.unique_user_count || 0);
            });
        }
        if (weeklyStatsData && weeklyStatsData.length > 0) {
            weeklyStatsData.forEach(weekData => {
                const key = `${weekData.month}-${weekData.week}`;
                if (!apiAggregates[key]) {
                    apiAggregates[key] = { total_access_count: 0, menu_unique_user_count: 0 };
                }
                apiAggregates[key].site_unique_user_count = weekData.site_unique_user_count;
            });
        }


        allWeeksData.forEach(weekData => {
            const key = `${weekData.month}-${weekData.week}`;
            if (apiAggregates[key]) {
                weekData.total_access_count = apiAggregates[key].total_access_count;
                weekData.menu_unique_user_count = apiAggregates[key].menu_unique_user_count;
                weekData.site_unique_user_count = apiAggregates[key].site_unique_user_count || 0;
            }
        });

        const totalAccessData = allWeeksData.map(d => d.total_access_count);
        const menuUniqueUserData = allWeeksData.map(d => d.menu_unique_user_count);
        const siteUniqueUserData = allWeeksData.map(d => d.site_unique_user_count);

        this.elements.chartInstance = new Chart(this.elements.chartCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '총 접속 횟수',
                        data: totalAccessData,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        fill: true,
                        tension: 0.1
                    },
                    {
                        label: '사이트 순 방문자 수',
                        data: siteUniqueUserData,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        fill: true,
                        tension: 0.1
                    }
                ]
            },
            options: {
                scales: { y: { beginAtZero: true } },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    
    async downloadExcel() {

        if (this.isDownloading) {

            return;
        }
        this.isDownloading = true;



        this.elements.excelDownloadBtn.removeEventListener('click', this.handleDownloadClick);

        if (typeof XLSX === 'undefined') {


            this.elements.excelDownloadBtn.addEventListener('click', this.handleDownloadClick);
            this.isDownloading = false;
            return;
        }
        
        const viewType = document.querySelector('input[name="statsViewType"]:checked').value;
        const year = this.elements.yearSelect.value;
        const selectedDate = this.elements.startDateInput.value;

        try {
            let wb = XLSX.utils.book_new();
            let ws, ws_data, fileName;

            const params = new URLSearchParams({ view_type: viewType });
            if (viewType === 'daily') {
                params.append('start_date', selectedDate);
                params.append('end_date', selectedDate);
            } else {
                params.append('year', year);
            }

            const data = await statisticsApi.downloadExcel(viewType, Object.fromEntries(params));

            if (viewType === 'daily') {
                fileName = `일별_접속통계_${selectedDate}.xlsx`;
                ws_data = [['메뉴', '총 접속 횟수', '순 방문자 수']];
                const menus = stateManager.getState('menus');
                const statsMap = new Map(data.menu_access_stats.map(s => [s.menu_id, s]));
                menus.forEach(menu => {
                    const stat = statsMap.get(menu.menu_id) || { total_access_count: 0, unique_user_count: 0 };
                    ws_data.push([menu.menu_nm, stat.total_access_count, stat.unique_user_count]);
                });
                ws = XLSX.utils.aoa_to_sheet(ws_data);
                XLSX.utils.book_append_sheet(wb, ws, "일별 통계");

            } else if (viewType === 'weekly_monthly') {
                fileName = `주별-월별_접속통계_${year}.xlsx`;
                ws_data = [['월', '주차', '메뉴', '총 접속 횟수', '메뉴별 순 방문자 수', '사이트 순 방문자 수']];
                
                if (data.weekly_stats && Array.isArray(data.weekly_stats)) {
                    data.weekly_stats.forEach(week => {
                        if (week.menus && Array.isArray(week.menus)) {
                            week.menus.forEach((menu, index) => {
                                ws_data.push([
                                    index === 0 ? `${week.month}월` : '',
                                    index === 0 ? `${week.week}주` : '',
                                    menu.menu_nm,
                                    menu.total_access_count,
                                    menu.unique_user_count,
                                    index === 0 ? week.site_unique_user_count : ''
                                ]);
                            });
                        }
                    });


                    const monthlyTotals = {};
                    data.weekly_stats.forEach(week => {
                        if (!monthlyTotals[week.month]) {
                            monthlyTotals[week.month] = {
                                total_access_count: 0,
                                total_menu_unique_user_count: 0,
                                total_site_unique_user_count: 0
                            };
                        }
                        
                        week.menus.forEach(menu => {
                            monthlyTotals[week.month].total_access_count += menu.total_access_count || 0;
                            monthlyTotals[week.month].total_menu_unique_user_count += menu.unique_user_count || 0;
                        });
                        
                        monthlyTotals[week.month].total_site_unique_user_count += week.site_unique_user_count || 0;
                    });

                    Object.keys(monthlyTotals).sort((a, b) => a - b).forEach(month => {
                        ws_data.push([
                            `${month}월 총계`,
                            '',
                            '',
                            monthlyTotals[month].total_access_count,
                            monthlyTotals[month].total_menu_unique_user_count,
                            monthlyTotals[month].total_site_unique_user_count
                        ]);
                    });


                    if (data.yearly_total) {
                        ws_data.push([
                            '연간 총계',
                            '',
                            '',
                            data.yearly_total.total_access_count,
                            data.yearly_total.total_menu_unique_user_count,
                            data.yearly_total.total_site_unique_user_count
                        ]);
                    }
                }
                
                ws = XLSX.utils.aoa_to_sheet(ws_data);
                XLSX.utils.book_append_sheet(wb, ws, "주별-월별 통계");

            } else if (viewType === 'comparison') {
                fileName = `연도별_비교_통계_${year}.xlsx`;
                ws_data = [['월', '주차', '메뉴', '연도', '총 접속 횟수', '메뉴별 순 방문자 수', '사이트 순 방문자 수']];
                
                const combinedData = {};
                const processData = (stats, year_label) => {
                    if (!stats || !Array.isArray(stats)) return;
                    stats.forEach(week => {
                        const weekKey = `${week.month}-${week.week}`;
                        if (!combinedData[weekKey]) combinedData[weekKey] = { month: week.month, week: week.week, menus: {} };
                        if (week.menus && Array.isArray(week.menus)) {
                            week.menus.forEach(menu => {
                                const menuKey = menu.menu_nm;
                                if (!combinedData[weekKey].menus[menuKey]) combinedData[weekKey].menus[menuKey] = {};
                                combinedData[weekKey].menus[menuKey][year_label] = {
                                    ...menu,
                                    site_unique: week.site_unique_user_count
                                };
                            });
                        }
                    });
                };
                processData(data.this_year_stats, year);
                processData(data.last_year_stats, year - 1);

                const sortedWeeks = Object.values(combinedData).sort((a, b) => a.month - b.month || a.week - b.week);
                sortedWeeks.forEach(week => {
                    Object.keys(week.menus).sort().forEach(menuName => {
                        const thisYearMenu = week.menus[menuName][year];
                        const lastYearMenu = week.menus[menuName][year - 1];

                        if (thisYearMenu) {
                            ws_data.push([`${week.month}월`, `${week.week}주`, menuName, year, thisYearMenu.total_access_count, thisYearMenu.unique_user_count, thisYearMenu.site_unique]);
                        }
                        if (lastYearMenu) {
                            ws_data.push([`${week.month}월`, `${week.week}주`, menuName, year - 1, lastYearMenu.total_access_count, lastYearMenu.unique_user_count, lastYearMenu.site_unique]);
                        }
                    });
                });


                if (data.this_year_stats && data.last_year_stats) {
                    const monthlyTotals = {};
                    const processMonthlyData = (stats, year_param) => {
                        if (!stats) return;
                        stats.forEach(week => {
                            if (!monthlyTotals[week.month]) {
                                monthlyTotals[week.month] = {
                                    this_year: { total_access_count: 0, total_menu_unique_user_count: 0, total_site_unique_user_count: 0 },
                                    last_year: { total_access_count: 0, total_menu_unique_user_count: 0, total_site_unique_user_count: 0 }
                                };
                            }
                            
                            week.menus.forEach(menu => {
                                monthlyTotals[week.month][year_param].total_access_count += menu.total_access_count || 0;
                                monthlyTotals[week.month][year_param].total_menu_unique_user_count += menu.unique_user_count || 0;
                            });
                            
                            monthlyTotals[week.month][year_param].total_site_unique_user_count += week.site_unique_user_count || 0;
                        });
                    };
                    
                    processMonthlyData(data.this_year_stats, 'this_year');
                    processMonthlyData(data.last_year_stats, 'last_year');
                    
                    Object.keys(monthlyTotals).sort((a, b) => a - b).forEach(month => {

                        ws_data.push([
                            `${month}월 총계`,
                            '',
                            '',
                            year,
                            monthlyTotals[month].this_year.total_access_count,
                            monthlyTotals[month].this_year.total_menu_unique_user_count,
                            monthlyTotals[month].this_year.total_site_unique_user_count
                        ]);
                        

                        ws_data.push([
                            `${month}월 총계`,
                            '',
                            '',
                            year - 1,
                            monthlyTotals[month].last_year.total_access_count,
                            monthlyTotals[month].last_year.total_menu_unique_user_count,
                            monthlyTotals[month].last_year.total_site_unique_user_count
                        ]);
                    });
                }


                if (data.yearly_total) {

                    ws_data.push([
                        '연간 총계',
                        '',
                        '',
                        year,
                        data.yearly_total.this_year.total_access_count,
                        data.yearly_total.this_year.total_menu_unique_user_count,
                        data.yearly_total.this_year.total_site_unique_user_count
                    ]);
                    

                    ws_data.push([
                        '연간 총계',
                        '',
                        '',
                        year - 1,
                        data.yearly_total.last_year.total_access_count,
                        data.yearly_total.last_year.total_menu_unique_user_count,
                        data.yearly_total.last_year.total_site_unique_user_count
                    ]);
                }

                ws = XLSX.utils.aoa_to_sheet(ws_data);
                XLSX.utils.book_append_sheet(wb, ws, "연도별 비교 통계");
            }

            if (ws) {
                XLSX.writeFile(wb, fileName);

            } else {

            }

        } catch (error) {

        } finally {

            this.elements.excelDownloadBtn.addEventListener('click', this.handleDownloadClick);


            this.isDownloading = false;
        }
    }

    
    renderComparisonStats(data) {
        const { this_year_stats, last_year_stats, yearly_total } = data;
        const table = this.elements.comparisonTable;
        if (!table) return;


        const currentYear = this.elements.yearSelect.value;
        if (this.elements.comparisonYearLegend) {
            this.elements.comparisonYearLegend.textContent = `( ${currentYear}년 / ${currentYear - 1}년 )`;
        }

        table.innerHTML = '';


        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        const headers = ['월', '주차', '메뉴', '총 접속 횟수', '메뉴별 순 방문자 수', '사이트 순 방문자 수'];
        headers.forEach(text => {
            const th = document.createElement('th');
            th.innerHTML = text.replace(/\s/g, '<br>');
            headerRow.appendChild(th);
        });


        const tbody = table.createTBody();
        if (!this_year_stats || this_year_stats.length === 0) {
            const row = tbody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = headers.length;
            cell.textContent = '데이터가 없습니다.';
            cell.style.textAlign = 'center';
            return;
        }


        const getGrowthHtml = (current, previous) => {
            const diff = current - previous;
            const arrow = diff > 0 ? '▲' : (diff < 0 ? '▼' : '');
            const color = diff > 0 ? 'text-red-500' : (diff < 0 ? 'text-blue-500' : 'text-gray-500');

            if (previous === 0) {
                if (current > 0) {
                    return `<span class="${color}">${arrow} ${diff.toLocaleString()}</span>`;
                }
                return `<span class="text-gray-500">-</span>`;
            }
            
            const growth = ((current - previous) / previous) * 100;
            
            return `<span class="${color}">${arrow} ${diff.toLocaleString()} (${growth.toFixed(1)}%)</span>`;
        };


        const combinedData = {};
        const processData = (stats, year) => {
            if (!stats) return;
            stats.forEach(week => {
                const weekKey = `${week.month}-${week.week}`;
                if (!combinedData[weekKey]) {
                    combinedData[weekKey] = { month: week.month, week: week.week, menus: {}, site_unique: {} };
                }
                combinedData[weekKey].site_unique[year] = week.site_unique_user_count;
                week.menus.forEach(menu => {
                    if (!combinedData[weekKey].menus[menu.menu_nm]) {
                        combinedData[weekKey].menus[menu.menu_nm] = {};
                    }
                    combinedData[weekKey].menus[menu.menu_nm][year] = menu;
                });
            });
        };
        processData(this_year_stats, 'this_year');
        processData(last_year_stats, 'last_year');

        const sortedWeeks = Object.values(combinedData).sort((a, b) => a.month - b.month || a.week - b.week);


        const monthlyRowSpans = {};
        sortedWeeks.forEach(week => {
            const menuCount = Object.keys(week.menus).length;
            if (!monthlyRowSpans[week.month]) monthlyRowSpans[week.month] = 0;
            monthlyRowSpans[week.month] += menuCount;
        });

        let currentMonth = -1;
        sortedWeeks.forEach(weekData => {
            const menuNames = Object.keys(weekData.menus).sort();
            const numMenus = menuNames.length;

            menuNames.forEach((menuName, menuIndex) => {
                const row = tbody.insertRow();
                const thisYearData = weekData.menus[menuName]['this_year'] || { total_access_count: 0, unique_user_count: 0 };
                const lastYearData = weekData.menus[menuName]['last_year'] || { total_access_count: 0, unique_user_count: 0 };


                if (weekData.month !== currentMonth) {
                    currentMonth = weekData.month;
                    const monthCell = row.insertCell();
                    monthCell.textContent = `${currentMonth}월`;
                    monthCell.rowSpan = monthlyRowSpans[currentMonth];
                    monthCell.style.verticalAlign = 'middle';
                }


                if (menuIndex === 0) {
                    const weekCell = row.insertCell();
                    weekCell.textContent = `${weekData.week}주`;
                    weekCell.rowSpan = numMenus;
                    weekCell.style.verticalAlign = 'middle';
                }


                row.insertCell().textContent = menuName;


                const fields = ['total_access_count', 'unique_user_count'];
                fields.forEach(field => {
                    const current = thisYearData[field] || 0;
                    const previous = lastYearData[field] || 0;
                    const cell = row.insertCell();
                    cell.innerHTML = `
                        <div class="flex flex-col items-center">
                            <span>${current.toLocaleString()} / ${previous.toLocaleString()}</span>
                            ${getGrowthHtml(current, previous)}
                        </div>
                    `;
                });
                

                if (menuIndex === 0) {
                    const siteCell = row.insertCell();
                    const current = weekData.site_unique['this_year'] || 0;
                    const previous = weekData.site_unique['last_year'] || 0;
                    siteCell.innerHTML = `
                        <div class="flex flex-col items-center">
                            <span>${current.toLocaleString()} / ${previous.toLocaleString()}</span>
                            ${getGrowthHtml(current, previous)}
                        </div>
                    `;
                    siteCell.rowSpan = numMenus;
                    siteCell.style.verticalAlign = 'middle';
                }
            });
        });


        const tfoot = table.createTFoot();
        tfoot.innerHTML = '';

        if (this_year_stats && this_year_stats.length > 0) {

            const monthlyTotals = {};
            const processMonthlyData = (stats, year) => {
                if (!stats) return;
                stats.forEach(week => {
                    if (!monthlyTotals[week.month]) {
                        monthlyTotals[week.month] = {
                            this_year: { total_access_count: 0, total_menu_unique_user_count: 0, total_site_unique_user_count: 0 },
                            last_year: { total_access_count: 0, total_menu_unique_user_count: 0, total_site_unique_user_count: 0 }
                        };
                    }
                    
                    week.menus.forEach(menu => {
                        monthlyTotals[week.month][year].total_access_count += menu.total_access_count || 0;
                        monthlyTotals[week.month][year].total_menu_unique_user_count += menu.unique_user_count || 0;
                    });
                    
                    monthlyTotals[week.month][year].total_site_unique_user_count += week.site_unique_user_count || 0;
                });
            };
            
            processMonthlyData(this_year_stats, 'this_year');
            processMonthlyData(last_year_stats, 'last_year');
            

            Object.keys(monthlyTotals).sort((a, b) => a - b).forEach(month => {
                const monthlyTotalRow = tfoot.insertRow();
                monthlyTotalRow.style.fontWeight = 'bold';
                monthlyTotalRow.style.backgroundColor = '#e5e7eb';
                
                const monthCell = monthlyTotalRow.insertCell();
                monthCell.textContent = `${month}월 총계`;
                monthCell.colSpan = 3;
                monthCell.style.textAlign = 'center';
                

                const currentAccess = monthlyTotals[month].this_year.total_access_count;
                const previousAccess = monthlyTotals[month].last_year.total_access_count;
                const accessCell = monthlyTotalRow.insertCell();
                accessCell.innerHTML = `
                    <div class="flex flex-col items-center">
                        <span>${currentAccess.toLocaleString()} / ${previousAccess.toLocaleString()}</span>
                        ${getGrowthHtml(currentAccess, previousAccess)}
                    </div>
                `;
                

                const currentMenuUnique = monthlyTotals[month].this_year.total_menu_unique_user_count;
                const previousMenuUnique = monthlyTotals[month].last_year.total_menu_unique_user_count;
                const menuUniqueCell = monthlyTotalRow.insertCell();
                menuUniqueCell.innerHTML = `
                    <div class="flex flex-col items-center">
                        <span>${currentMenuUnique.toLocaleString()} / ${previousMenuUnique.toLocaleString()}</span>
                        ${getGrowthHtml(currentMenuUnique, previousMenuUnique)}
                    </div>
                `;
                

                const currentSiteUnique = monthlyTotals[month].this_year.total_site_unique_user_count;
                const previousSiteUnique = monthlyTotals[month].last_year.total_site_unique_user_count;
                const siteUniqueCell = monthlyTotalRow.insertCell();
                siteUniqueCell.innerHTML = `
                    <div class="flex flex-col items-center">
                        <span>${currentSiteUnique.toLocaleString()} / ${previousSiteUnique.toLocaleString()}</span>
                        ${getGrowthHtml(currentSiteUnique, previousSiteUnique)}
                    </div>
                `;
            });
        }
        

        if (yearly_total) {
            const thisYear = yearly_total.this_year || {};
            const lastYear = yearly_total.last_year || {};
            const footerRow = tfoot.insertRow();
            footerRow.innerHTML = `<td colspan="3" class="text-center font-bold">연간 총계</td>`;
            footerRow.style.backgroundColor = '#d1d5db';

            const fields = ['total_access_count', 'total_menu_unique_user_count', 'total_site_unique_user_count'];
            fields.forEach(field => {
                const current = thisYear[field] || 0;
                const previous = lastYear[field] || 0;
                const cell = footerRow.insertCell();
                cell.innerHTML = `
                    <div class="flex flex-col items-center font-bold">
                        <span>${current.toLocaleString()} / ${previous.toLocaleString()}</span>
                        ${getGrowthHtml(current, previous)}
                    </div>
                `;
            });
        }
    }

    
    renderComparisonLineChart(data) {
        if (this.elements.chartInstance) {
            this.elements.chartInstance.destroy();
        }

        const { yearly_chart_data_this_year, yearly_chart_data_last_year } = data;
        const year = this.elements.yearSelect.value;
        if (!year) return;

        const labels = [];
        for (let month = 1; month <= 12; month++) {
            for (let week = 1; week <= 5; week++) {
                labels.push(`${month}월 ${week}주`);
            }
        }

        const processChartData = (chartData) => {
            const weeklyTotals = new Array(labels.length).fill(0);
            if (!chartData) return weeklyTotals;

            chartData.forEach(row => {
                const monthIndex = row.month - 1;
                const weekIndex = row.week_of_month - 1;
                const labelIndex = monthIndex * 5 + weekIndex;
                if (labelIndex >= 0 && labelIndex < weeklyTotals.length) {
                    weeklyTotals[labelIndex] += Number(row.total_access_count || 0);
                }
            });
            return weeklyTotals;
        };

        const thisYearData = processChartData(yearly_chart_data_this_year);
        const lastYearData = processChartData(yearly_chart_data_last_year);

        this.elements.chartInstance = new Chart(this.elements.chartCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: `${year}년 총 접속 횟수`,
                        data: thisYearData,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        fill: true,
                        tension: 0.1
                    },
                    {
                        label: `${year - 1}년 총 접속 횟수`,
                        data: lastYearData,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        fill: true,
                        tension: 0.1
                    }
                ]
            },
            options: {
                scales: { y: { beginAtZero: true } },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    }

    
    toggleView() {
        const viewType = document.querySelector('input[name="statsViewType"]:checked')?.value;

        const showIf = (element, condition) => {
            if (element) element.style.display = condition ? (element.tagName === 'DIV' ? 'block' : 'flex') : 'none';
        };

        showIf(this.elements.dailyViewContainer, viewType === 'daily');
        showIf(this.elements.weeklyMonthlyViewContainer, viewType === 'weekly_monthly');
        showIf(this.elements.comparisonViewContainer, viewType === 'comparison');
        
        showIf(this.elements.dateRangeContainer, viewType === 'daily');
        showIf(this.elements.yearSelect, viewType === 'weekly_monthly' || viewType === 'comparison');
        
        if (this.elements.menuSelect) this.elements.menuSelect.style.display = 'none';
        if (this.elements.excelDownloadBtn) this.elements.excelDownloadBtn.style.display = 'inline-block';
    }

    
    activate() {

        this.initElements();

        if (!this.eventListenersInitialized) {
            this.initEventListeners();
            this.eventListenersInitialized = true;
        } else {

        }
        this.loadConfig();
    }
}


export const statisticsTab = new StatisticsTab();