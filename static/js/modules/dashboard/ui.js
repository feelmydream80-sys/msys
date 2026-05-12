



import { fetchMinMaxDates } from '../common/api/dashboard.js';
import { showMessage, formatNumberWithKoreanUnits } from '../common/utils.js';
import { getKSTNow, formatDate } from '../common/dateUtils.js';


export function initializeDatePickers(loadSummaryCallback) {
    const startDatePicker = document.getElementById('startDate');
    const endDatePicker = document.getElementById('endDate');
    const allDataCheckbox = document.getElementById('allDataCheckbox');


    const today = getKSTNow();
    const currentYear = today.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    
    const defaultStartDate = formatDate(startOfYear);
    const defaultEndDate = formatDate(today);

    if (startDatePicker) startDatePicker.value = defaultStartDate;
    if (endDatePicker) endDatePicker.value = defaultEndDate;
    if (allDataCheckbox) allDataCheckbox.checked = false;


    if (startDatePicker) startDatePicker.addEventListener('change', () => loadSummaryCallback());
    if (endDatePicker) endDatePicker.addEventListener('change', () => loadSummaryCallback());
    if (allDataCheckbox) {
        allDataCheckbox.addEventListener('change', () => {
            if (startDatePicker) startDatePicker.disabled = allDataCheckbox.checked;
            if (endDatePicker) endDatePicker.disabled = allDataCheckbox.checked;
            loadSummaryCallback();
        });
    }
}


export function updateSummaryCards(summaryData) {

    const totalJobsElement = document.getElementById('totalJobsCount');
    const totalCollectionsElement = document.getElementById('totalCollectionsCount');

    if (!totalJobsElement || !totalCollectionsElement) {
        return;
    }

    if (summaryData.length === 0) {
        totalJobsElement.textContent = '0';
        totalCollectionsElement.textContent = '0';
        ['day', 'week', 'month', 'half', 'year'].forEach(p => {
            const rateElement = document.getElementById(`${p}SuccessRate`);
            const countElement = document.getElementById(`${p}TotalCount`);
            if (rateElement) rateElement.textContent = '0.00';
            if (countElement) countElement.textContent = '0';
        });
        return;
    }

    const totalJobsCount = summaryData.length;
    const totalCollections = summaryData.reduce((sum, item) => {
        return sum + (item.overall_success_count || 0) + (item.overall_fail_count || 0) + (item.overall_no_data_count || 0) + (item.overall_ing_count || 0);
    }, 0);

    totalJobsElement.textContent = totalJobsCount;
    totalCollectionsElement.textContent = formatNumberWithKoreanUnits(totalCollections);


    const totalDaySuccess = summaryData.reduce((sum, item) => sum + (item.day_success || 0), 0);
    const totalDayScheduled = summaryData.reduce((sum, item) => sum + (item.day_total_scheduled || 0), 0);
    const daySuccessRate = totalDayScheduled > 0 ? ((totalDaySuccess / totalDayScheduled) * 100).toFixed(2) : '0.00';

    const daySuccessRateElement = document.getElementById('daySuccessRate');
    const dayTotalCountElement = document.getElementById('dayTotalCount');
    if (daySuccessRateElement) daySuccessRateElement.textContent = daySuccessRate;
    if (dayTotalCountElement) dayTotalCountElement.textContent = formatNumberWithKoreanUnits(totalDayScheduled);


    const calculatePeriodTotalsForCards = (periodPrefix) => {
        let totalSuccess = 0, totalFail = 0, totalNoData = 0;
        summaryData.forEach(item => {
            totalSuccess += (item[periodPrefix + '_success'] || 0);
            totalFail += (item[periodPrefix + '_fail_count'] || 0);
            totalNoData += (item[periodPrefix + '_no_data_count'] || 0);
        });

        const total = totalSuccess + totalFail + totalNoData;
        const successRate = total > 0 ? ((totalSuccess / total) * 100).toFixed(2) : '0.00';
        return { total, successRate };
    };


    ['week', 'month', 'half', 'year'].forEach(p => {
        const stats = calculatePeriodTotalsForCards(p);
        const rateElement = document.getElementById(`${p}SuccessRate`);
        const countElement = document.getElementById(`${p}TotalCount`);
        if (rateElement) rateElement.textContent = stats.successRate;
        if (countElement) countElement.textContent = formatNumberWithKoreanUnits(stats.total);
    });
}


export function renderDashboardChartText(summaryData) {
        const chartContainer = document.getElementById('dashboardChartContainer');
        if (!chartContainer) {
            return;
        }

    let chartText = '<h3 class="text-lg font-semibold mb-2">수집현황 분석 차트</h3>';
    if (summaryData.length === 0) {
        chartText += '<p class="text-gray-600">표시할 차트 데이터가 없습니다.</p>';
    } else {
        chartText += '<pre class="bg-gray-100 p-4 rounded-md text-sm overflow-auto max-h-96">';
        chartText += 'Job ID별 수집 성공률:\n\n';
        summaryData.forEach(item => {
            const yearTotalForChart = (item.year_success || 0) + (item.year_fail_count || 0) + (item.year_no_data_count || 0) + (item.year_cd904_count || 0) + (item.year_ing_count || 0);
            const yearSuccessRate = yearTotalForChart > 0 ? ((item.year_success || 0) / yearTotalForChart * 100).toFixed(2) : '0.00';
            chartText += `[${item.job_id}] ${item.cd_nm}: ${yearSuccessRate}%\n`;
        });
        chartText += '</pre>';
    }
    chartContainer.innerHTML = chartText;
}


export async function fetchAndDisplayMinMaxDatesDashboard() {
    const minDateDisplayElement = document.getElementById('minDateDisplay');
    const maxDateDisplayElement = document.getElementById('maxDateDisplay');
    const summaryMinDateElement = document.getElementById('summary-min-date');
    const summaryMaxDateElement = document.getElementById('summary-max-date');

    if (!minDateDisplayElement || !maxDateDisplayElement || !summaryMinDateElement || !summaryMaxDateElement) {

        return;
    }

    try {

        const dates = await fetchMinMaxDates('dashboardSummary');
        const minDate = dates.min_date || 'N/A';
        const maxDate = dates.max_date || 'N/A';

        minDateDisplayElement.textContent = minDate;
        maxDateDisplayElement.textContent = maxDate;
        summaryMinDateElement.textContent = minDate;
        summaryMaxDateElement.textContent = maxDate;
    } catch (error) {
        showMessage('실 존재 데이터 기간 로드 실패: ' + error.message, 'error');
    }
}


export async function displayMinMaxDates(dataType, minDateId, maxDateId) {
    const minDateDisplayElement = document.getElementById(minDateId);
    const maxDateDisplayElement = document.getElementById(maxDateId);

    if (!minDateDisplayElement || !maxDateDisplayElement) {
        return;
    }

    try {
        const dates = await fetchMinMaxDates(dataType);
        minDateDisplayElement.textContent = dates.min_date || 'N/A';
        maxDateDisplayElement.textContent = dates.max_date || 'N/A';
    } catch (error) {
        minDateDisplayElement.textContent = 'Error';
        maxDateDisplayElement.textContent = 'Error';
        showMessage(`최소/최대 날짜 로드 실패: ${error.message}`, 'error');
    }
}
