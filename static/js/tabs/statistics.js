// @DOC_FILE: statistics.js
// @DOC_DESC: 통계 탭 모듈

import { statisticsApi } from '../services/api.js';
import { stateManager } from '../services/stateManager.js';
import { debugLog } from '../utils.js';

/**
 * 통계 탭 클래스
 */
class StatisticsTab {
    /**
     * 생성자
     */
    constructor() {
        // DOM 요소들
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
    }

    /**
     * DOM 요소 초기화
     * @returns {boolean} - 초기화 성공 여부
     */
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

    /**
     * 이벤트 리스너 등록
     */
    initEventListeners() {
        if (this.elements.tab) {
            this.elements.tab.addEventListener('click', () => this.loadConfig());
        }

        if (this.elements.excelDownloadBtn) {
            this.elements.excelDownloadBtn.addEventListener('click', () => this.downloadExcel());
        }

        const autoLoadStats = () => {
            this.toggleView();
            this.loadData();
        };

        if (this.elements.dailyViewRadio) this.elements.dailyViewRadio.addEventListener('change', autoLoadStats);
        if (this.elements.weeklyMonthlyViewRadio) this.elements.weeklyMonthlyViewRadio.addEventListener('change', autoLoadStats);
        if (this.elements.comparisonViewRadio) this.elements.comparisonViewRadio.addEventListener('change', autoLoadStats);
        if (this.elements.yearSelect) this.elements.yearSelect.addEventListener('change', () => this.loadData());
        if (this.elements.startDateInput) this.elements.startDateInput.addEventListener('change', () => this.loadData());
    }

    /**
     * 날짜 입력 필드 초기화
     */
    initializeDateInputs() {
        // 오늘 날짜로 startDateInput 초기화
        if (this.elements.startDateInput) {
            const today = new Date().toISOString().split('T')[0];
            this.elements.startDateInput.value = today;
        }
    }

    /**
     * 통계 설정 로드
     */
    async loadConfig() {
        // 설정이 이미 로드되었는지 확인
        if (this.elements.yearSelect.options.length > 0) {
            this.loadData();
            return;
        }

        try {
            const config = await statisticsApi.getConfig();
            
            // 연도 드롭다운 채우기
            this.elements.yearSelect.innerHTML = '';
            config.years.forEach(year => {
                const option = new Option(`${year}년`, year);
                this.elements.yearSelect.add(option);
            });

            // 메뉴 드롭다운 채우기
            this.elements.menuSelect.innerHTML = '';
            this.elements.menuSelect.add(new Option('전체 메뉴', 'all'));
            config.menus.forEach(menu => {
                const option = new Option(menu.menu_nm, menu.menu_id);
                this.elements.menuSelect.add(option);
            });

            // 상태 관리에 메뉴 데이터 저장 (아이콘 데이터도 저장하되, 메뉴 데이터를 별도로 저장)
            stateManager.setState('menus', config.menus || []);
            stateManager.setState('icons', config.icons || []);

            // 날짜 입력 필드 초기화
            this.initializeDateInputs();

            // 뷰 토글 호출 (초기 스타일 설정)
            this.toggleView();
            // 데이터 로드
            this.loadData();
        } catch (error) {
            console.error('통계 설정 로드 실패:', error);
        }
    }

    /**
     * 통계 데이터 로드
     */
    async loadData() {
        debugLog('통계 데이터 로드 시작');

        const viewType = document.querySelector('input[name="statsViewType"]:checked')?.value;
        debugLog('통계 뷰 타입:', viewType);

        if (!viewType) {
            console.error('통계 뷰 타입을 찾을 수 없음');
            return;
        }

        const params = new URLSearchParams({ view_type: viewType });
        debugLog('API 파라미터:', params.toString());

        if (viewType === 'daily') {
            const selectedDate = this.elements.startDateInput?.value;
            debugLog('선택된 날짜:', selectedDate);

            if (!selectedDate) {
                console.error('선택된 날짜가 없음 - 기본값 사용');
                // 기본값으로 오늘 날짜 사용
                const today = new Date().toISOString().split('T')[0];
                params.append('start_date', today);
                params.append('end_date', today);
            } else {
                params.append('start_date', selectedDate);
                params.append('end_date', selectedDate);
            }
        } else { // weekly_monthly or comparison
            const selectedYear = this.elements.yearSelect?.value;
            debugLog('선택된 연도:', selectedYear);

            if (!selectedYear) {
                console.error('선택된 연도가 없음');
                // 기본값으로 현재 연도 사용
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
                if (data.yearly_chart_data) {
                    this.renderLineChart(data.yearly_chart_data, data.weekly_stats);
                }
            } else if (viewType === 'comparison') {
                this.renderComparisonStats(data);
                this.renderComparisonLineChart(data);
            }
        } catch (error) {
            console.error('통계 데이터 로드 실패:', error);
        }
    }

    /**
     * 일별 통계 렌더링
     * @param {object} data - 통계 데이터
     */
    renderDailyStats(data) {
        debugLog('일별 통계 렌더링 시작');
        debugLog('데이터:', data);

        const { menu_access_stats, total_access_stats } = data;
        debugLog('메뉴 접근 통계:', menu_access_stats);
        debugLog('전체 통계:', total_access_stats);

        // 전체 메뉴 목록 가져오기 (stateManager에서)
        const allMenus = stateManager.getState('menus') || [];
        debugLog('전체 메뉴 목록:', allMenus);

        // 요약 정보 렌더링
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

        // 테이블 렌더링
        this.elements.dailyTableBody.innerHTML = '';
        
        if (allMenus.length > 0) {
            // menu_access_stats가 menu_id 대신 menu_nm으로 키를 가지고 있는 경우 처리
            const statsMap = new Map();
            if (menu_access_stats) {
                menu_access_stats.forEach(stat => {
                    const key = stat.menu_id || stat.menu_nm; // menu_id가 없으면 menu_nm 사용
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
            
            // 막대 차트 렌더링
            this.renderBarChart(menu_access_stats || [], allMenus);
        } else {
            this.elements.dailyTableBody.innerHTML = '<tr><td colspan="3">표시할 메뉴가 없습니다.</td></tr>';
        }
    }

    /**
     * 주간/월간 통계 렌더링
     * @param {object} data - 통계 데이터
     */
    renderWeeklyMonthlyStats(data) {
        const { weekly_stats, yearly_total } = data;
        const table = this.elements.weeklyTable;
        if (!table) return;

        // 기존 내용 제거
        table.innerHTML = '';

        // 헤더 생성
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        const headers = ['월', '주차', '메뉴', '총 접속 횟수', '메뉴별 순 방문자 수', '사이트 순 방문자 수'];
        headers.forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });

        // 바디 생성
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
                
                weeksInMonth.forEach((weekData, weekIndex) => {
                    weekData.menus.forEach((menu, menuIndex) => {
                        const row = tbody.insertRow();
                        
                        if (weekIndex === 0 && menuIndex === 0) {
                            const monthCell = row.insertCell();
                            monthCell.textContent = `${month}월`;
                            monthCell.rowSpan = totalRowsInMonth;
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
            });
        } else {
            const row = tbody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = headers.length;
            cell.textContent = '데이터가 없습니다.';
            cell.style.textAlign = 'center';
        }

        // 연간 총계 푸터 생성
        let tfoot = table.querySelector('tfoot');
        if (!tfoot) {
            tfoot = table.createTFoot();
        }
        tfoot.innerHTML = ''; // 기존 푸터 내용 제거

        if (yearly_total) {
            const footerRow = tfoot.insertRow();
            const totalCell = footerRow.insertCell();
            totalCell.colSpan = 3;
            totalCell.textContent = '연간 총계';
            totalCell.style.fontWeight = 'bold';
            totalCell.style.textAlign = 'center';

            footerRow.insertCell().textContent = (yearly_total.total_access_count || 0).toLocaleString();
            footerRow.insertCell().textContent = (yearly_total.total_menu_unique_user_count || 0).toLocaleString();
            footerRow.insertCell().textContent = (yearly_total.total_site_unique_user_count || 0).toLocaleString();
        }
    }

    /**
     * 막대 차트 렌더링
     * @param {array} menuAccessStats - 메뉴 접근 통계
     * @param {array} allMenus - 전체 메뉴 목록
     */
    renderBarChart(menuAccessStats, allMenus) {
        debugLog('막대 차트 렌더링 시작');
        debugLog('메뉴 접근 통계:', menuAccessStats);
        debugLog('전체 메뉴:', allMenus);

        if (this.elements.chartInstance) {
            debugLog('기존 차트 인스턴스 파괴');
            this.elements.chartInstance.destroy();
        }

        // 맵 생성하여 빠르게 조회
        const statsMap = new Map();
        if (menuAccessStats) {
            menuAccessStats.forEach(item => {
                const key = item.menu_id || item.menu_nm; // menu_id가 없으면 menu_nm 사용
                statsMap.set(key, item);
            });
        }
        debugLog('통계 맵 생성 완료');

        // 모든 메뉴가 표시되도록 데이터 구성
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

    /**
     * 라인 차트 렌더링
     * @param {array} yearlyChartData - 연간 차트 데이터
     * @param {array} weeklyStatsData - 주간 통계 데이터
     */
    renderLineChart(yearlyChartData, weeklyStatsData) {
        if (this.elements.chartInstance) {
            this.elements.chartInstance.destroy();
        }

        const year = this.elements.yearSelect.value;
        if (!year) return;

        // 1. 전체 연도의 레이블과 0으로 채워진 데이터 구조 생성
        const allWeeksData = [];
        const labels = [];
        for (let month = 1; month <= 12; month++) {
            // 5주를 기준으로 가정하여 일관된 차트 축 유지
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

        // 2. API 데이터를 주별로 집계
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

        // 3. 전체 연도 구조에 API 데이터 매핑
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

    /**
     * 엑셀 다운로드
     */
    async downloadExcel() {
        if (typeof XLSX === 'undefined') {
            console.warn('엑셀 라이브러리를 로드하는 중입니다. 잠시 후 다시 시도해주세요.');
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
            } else { // weekly_monthly or comparison
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
                data.weekly_stats.forEach(week => {
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
                });
                ws = XLSX.utils.aoa_to_sheet(ws_data);
                XLSX.utils.book_append_sheet(wb, ws, "주별-월별 통계");

            } else if (viewType === 'comparison') {
                fileName = `연도별_비교_통계_${year}.xlsx`;
                ws_data = [['월', '주차', '메뉴', '연도', '총 접속 횟수', '메뉴별 순 방문자 수', '사이트 순 방문자 수']];
                
                const combinedData = {};
                const processData = (stats, year_label) => {
                    if (!stats) return;
                    stats.forEach(week => {
                        const weekKey = `${week.month}-${week.week}`;
                        if (!combinedData[weekKey]) combinedData[weekKey] = { month: week.month, week: week.week, menus: {} };
                        week.menus.forEach(menu => {
                            const menuKey = menu.menu_nm;
                            if (!combinedData[weekKey].menus[menuKey]) combinedData[weekKey].menus[menuKey] = {};
                            combinedData[weekKey].menus[menuKey][year_label] = {
                                ...menu,
                                site_unique: week.site_unique_user_count
                            };
                        });
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
                ws = XLSX.utils.aoa_to_sheet(ws_data);
                XLSX.utils.book_append_sheet(wb, ws, "연도별 비교 통계");
            }

            if (ws) {
                XLSX.writeFile(wb, fileName);
                console.log('Excel 파일 다운로드가 시작되었습니다.');
            } else {
                console.warn('다운로드할 데이터가 없습니다.');
            }

        } catch (error) {
            console.error(`엑셀 다운로드 오류: ${error.message}`);
        }
    }

    /**
     * 비교 통계 렌더링
     * @param {object} data - 통계 데이터
     */
    renderComparisonStats(data) {
        const { this_year_stats, last_year_stats, yearly_total } = data;
        const table = this.elements.comparisonTable;
        if (!table) return;

        // 연도 레전드 설정
        const currentYear = this.elements.yearSelect.value;
        if (this.elements.comparisonYearLegend) {
            this.elements.comparisonYearLegend.textContent = `( ${currentYear}년 / ${currentYear - 1}년 )`;
        }

        table.innerHTML = ''; // 기존 내용 제거

        // 헤더 생성
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        const headers = ['월', '주차', '메뉴', '총 접속 횟수', '메뉴별 순 방문자 수', '사이트 순 방문자 수'];
        headers.forEach(text => {
            const th = document.createElement('th');
            th.innerHTML = text.replace(/\s/g, '<br>'); // 가독성을 위해 줄바꿈 추가
            headerRow.appendChild(th);
        });

        // 바디 생성
        const tbody = table.createTBody();
        if (!this_year_stats || this_year_stats.length === 0) {
            const row = tbody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = headers.length;
            cell.textContent = '데이터가 없습니다.';
            cell.style.textAlign = 'center';
            return;
        }

        // 성장률 계산 및 출력을 위한 헬퍼 함수
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

        // 데이터 결합 및 그룹화
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

        // 행 렌더링
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

                // 월 셀 (rowspan 적용)
                if (weekData.month !== currentMonth) {
                    currentMonth = weekData.month;
                    const monthCell = row.insertCell();
                    monthCell.textContent = `${currentMonth}월`;
                    monthCell.rowSpan = monthlyRowSpans[currentMonth];
                    monthCell.style.verticalAlign = 'middle';
                }

                // 주차 셀 (rowspan 적용)
                if (menuIndex === 0) {
                    const weekCell = row.insertCell();
                    weekCell.textContent = `${weekData.week}주`;
                    weekCell.rowSpan = numMenus;
                    weekCell.style.verticalAlign = 'middle';
                }

                // 메뉴명
                row.insertCell().textContent = menuName;

                // 데이터 셀
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
                
                // 사이트 순 방문자 수 (rowspan 적용)
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

        // 푸터 생성
        const tfoot = table.createTFoot();
        tfoot.innerHTML = ''; // 기존 내용 제거
        if (yearly_total) {
            const thisYear = yearly_total.this_year || {};
            const lastYear = yearly_total.last_year || {};
            const footerRow = tfoot.insertRow();
            footerRow.innerHTML = `<td colspan="3" class="text-center font-bold">연간 총계</td>`;

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

    /**
     * 비교 라인 차트 렌더링
     * @param {object} data - 통계 데이터
     */
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

    /**
     * 뷰 토글
     */
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
        
        if (this.elements.menuSelect) this.elements.menuSelect.style.display = 'none'; // 항상 숨김
        if (this.elements.excelDownloadBtn) this.elements.excelDownloadBtn.style.display = 'inline-block'; // 항상 표시
    }

    /**
     * 탭이 활성화될 때 호출되는 메서드
     */
    activate() {
        this.initElements();
        this.initEventListeners();
        this.loadConfig();
    }
}

// 전역 인스턴스 생성 및 내보내기
export const statisticsTab = new StatisticsTab();