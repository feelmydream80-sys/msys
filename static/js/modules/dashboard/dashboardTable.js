


import { parseCronExpression, formatNumberWithCommas, formatNumberToKorean } from '../common/utils.js';


function createPeriodRateDisplay(
    item,
    periodPrefix,
    threshold,
    successColor,
    warningColor,
    successIcon,
    warningIcon
) {
    const successCount = item[`${periodPrefix}_success`] || 0;
    const failCount = item[`${periodPrefix}_fail_count`] || 0;
    const noDataCount = item[`${periodPrefix}_no_data_count`] || 0;
    const ingCount = item[`${periodPrefix}_ing_count`] || 0;
    const miscCount = item[`${periodPrefix}_misc_count`] || 0;

    const calculatedPeriodTotal = successCount + failCount + noDataCount;
    const displayRate = (calculatedPeriodTotal > 0) ? ((successCount / calculatedPeriodTotal) * 100).toFixed(2) : '0.00';
    
    let periodStatusColor = successColor;
    let periodStatusIcon = successIcon;

    if (calculatedPeriodTotal === 0) {
        periodStatusColor = '#adb5bd';
        periodStatusIcon = '⚪';
    } else if (parseFloat(displayRate) < parseFloat(threshold)) {
        periodStatusColor = warningColor;
        periodStatusIcon = warningIcon;
    }

    return `
        <div class="flex flex-col items-end">
            <div class="flex items-center justify-end gap-1">
                <span class="status-icon">${periodStatusIcon || ''}</span>
                <span class="font-semibold" style="color: ${periodStatusColor};">${displayRate}%</span>
            </div>
            <div class="text-xs text-gray-500 mt-1">
                (${formatNumberWithCommas(successCount)}, ${formatNumberWithCommas(ingCount)}, ${formatNumberWithCommas(failCount)}/${formatNumberWithCommas(noDataCount)}/${formatNumberWithCommas(miscCount)})
            </div>
        </div>
    `;
}


export function renderDashboardSummaryTable(summaryData) {
    const tableBody = document.getElementById('dashboardTableBody');
    if (!tableBody) {
        return;
    }
    tableBody.innerHTML = '';

    if (!summaryData || summaryData.length === 0) {
        return;
    }

    summaryData.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200 hover:bg-gray-50';

        const jobSetting = item.settings || {};
        

        if (jobSetting.CHRT_DSP_YN && jobSetting.CHRT_DSP_YN.toUpperCase() === 'N') {
            return;
        }
        

        const currentFailStreak = item.fail_streak || 0;
        const failCnt = parseFloat(jobSetting.cnn_failr_thrs_val || 3);
        const warningCnt = parseFloat(jobSetting.cnn_warn_thrs_val || 1);

        let jobStatusColor = jobSetting.cnn_sucs_wrd_colr || '#28a745';
        let jobStatusIcon = jobSetting.cnn_sucs_icon_id_code || '';

        if (currentFailStreak >= failCnt) {
            jobStatusColor = jobSetting.cnn_failr_wrd_colr || '#dc3545';
            jobStatusIcon = jobSetting.cnn_failr_icon_id_code || '';
        } else if (currentFailStreak >= warningCnt) {
            jobStatusColor = jobSetting.cnn_warn_wrd_colr || '#ffc107';
            jobStatusIcon = jobSetting.cnn_warn_icon_id_code || '';
        }

        const jobIdContent = window.isAdmin
            ? `<a href="http://CIB200L2:18080/dags/${item.job_id}/grid" target="_blank" class="font-semibold hover:underline" style="color: ${jobStatusColor};">${item.job_id}</a>`
            : `<span class="font-semibold" style="color: ${jobStatusColor};">${item.job_id}</span>`;

        const jobIdDisplay = `
            <div class="flex flex-col items-start">
                <div class="flex items-center justify-start gap-1">
                    <span class="status-icon">${jobStatusIcon || ''}</span>
                    ${jobIdContent}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                    (${currentFailStreak}회 연속 실패)
                </div>
            </div>
        `;
        

        const srSuccessColor = jobSetting.sucs_rt_sucs_wrd_colr || '#28a745';
        const srWarningColor = jobSetting.sucs_rt_warn_wrd_colr || '#ffc107';
        const srSuccessIcon = jobSetting.sucs_rt_sucs_icon_id_code || '';
        const srWarningIcon = jobSetting.sucs_rt_warn_icon_id_code || '';

        const thresholds = {
            day: parseFloat(jobSetting.dly_sucs_rt_thrs_val || 95),
            week: parseFloat(jobSetting.dd7_sucs_rt_thrs_val || 90),
            month: parseFloat(jobSetting.mthl_sucs_rt_thrs_val || 85),
            half: parseFloat(jobSetting.mc6_sucs_rt_thrs_val || 80),
            year: parseFloat(jobSetting.yy1_sucs_rt_thrs_val || 75),
        };

        const currentTotalCount = (item.overall_success_count || 0) + (item.overall_fail_count || 0) + (item.overall_no_data_count || 0) + (item.overall_cd904_count || 0) + (item.overall_ing_count || 0);

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 align-top">${jobIdDisplay}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 align-top">${item.cd_nm || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 align-top">
                <div>${item.frequency || 'N/A'}</div>
                <div class="text-xs text-gray-500 mt-1">${parseCronExpression(item.frequency)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right align-top">${formatNumberToKorean(currentTotalCount)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right align-top">
                ${createPeriodRateDisplay(item, 'day', thresholds.day, srSuccessColor, srWarningColor, srSuccessIcon, srWarningIcon)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right align-top">
                ${createPeriodRateDisplay(item, 'week', thresholds.week, srSuccessColor, srWarningColor, srSuccessIcon, srWarningIcon)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right align-top">
                ${createPeriodRateDisplay(item, 'month', thresholds.month, srSuccessColor, srWarningColor, srSuccessIcon, srWarningIcon)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right align-top">
                ${createPeriodRateDisplay(item, 'half', thresholds.half, srSuccessColor, srWarningColor, srSuccessIcon, srWarningIcon)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right align-top">
                ${createPeriodRateDisplay(item, 'year', thresholds.year, srSuccessColor, srWarningColor, srSuccessIcon, srWarningIcon)}
            </td>
        `;
        tableBody.appendChild(row);
    });
}
