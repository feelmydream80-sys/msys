



let currentIconMap = {};


export function setDashboardIconMap(iconMap) {
    currentIconMap = iconMap;
}


export function getStyledSuccessRateHtml(successRate, successCount, totalCount, failCount, noDataCount, adminSetting, thresholdType, failStreak) {











    let icon;
    let color;
    let statusName;
    let statusCode;


    if (totalCount === 0) {
        statusCode = 'CD903';
    } else if (failCount > 0) {
        statusCode = 'CD902';
    } else {
        statusCode = 'CD901';
    }
   


    const statusInfo = getStatusInfo(statusCode, adminSetting);
    icon = statusInfo.icon;
    color = statusInfo.color;
    statusName = statusInfo.statusName;


    let tooltipFullContent = `${icon} ${statusName}: 성공률: ${successRate.toFixed(2)}%<br>성공: ${successCount}건, 실패: ${failCount}건, 미수집: ${noDataCount}건 (총: ${totalCount}건)`;
    if (failStreak > 0) {
        tooltipFullContent += `<br>연속 실패: ${failStreak}회`;
    }



    return `
        <div class="tooltip">
            <span class="status-icon" style="color: ${color};">${icon}</span>
            <span class="status-text" style="color: ${color};">${successRate.toFixed(2)}%</span>
            <br>
            <span class="text-sm text-gray-500">(실패: ${failCount}회, 미존재: ${noDataCount}회)</span>
            <span class="tooltiptext">${tooltipFullContent}</span>
        </div>
    `;
}


export function getFailStreakBadgeHtml(failStreak, adminSetting) {



    if (failStreak <= 0) return '';

    let badgeColorClass = 'bg-gray-500';
    if (adminSetting) {
        const cfFailCnt = adminSetting.cf_fail_cnt || 0;
        const cfWarningCnt = adminSetting.cf_warning_cnt || 0;

        if (cfFailCnt > 0 && failStreak >= cfFailCnt) {
            badgeColorClass = 'bg-red-500';
        } else if (cfWarningCnt > 0 && failStreak >= cfWarningCnt) {
            badgeColorClass = 'bg-orange-500';
        }
    }
    return `<span class="inline-block px-2 py-1 ml-2 text-xs font-bold text-white rounded-full ${badgeColorClass}">연속 실패: ${failStreak}</span>`;
}


export function getStatusInfo(statusCode, adminSettings) {
    let icon;
    let color;
    let statusName;


    if (!adminSettings) {
        switch (statusCode) {
            case 'CD901': statusName = '정상'; icon = '🟢'; color = '#28a745'; break;
            case 'CD902': statusName = '장애'; icon = '🔴'; color = '#dc3545'; break;
            case 'CD903': statusName = '미존재'; icon = '⚪'; color = '#6c757d'; break;
            default: statusName = '확인필요'; icon = '⚫'; color = '#343a40'; break;
        }
        return { icon, color, statusName };
    }


    switch (statusCode) {
        case 'CD901':
            icon = currentIconMap[adminSettings.cf_success_icon] || '🟢';
            color = adminSettings.cf_success_wd_color || '#28a745';
            statusName = '정상';
            break;
        case 'CD902':
            icon = currentIconMap[adminSettings.cf_fail_icon] || '🔴';
            color = adminSettings.cf_fail_wd_color || '#dc3545';
            statusName = '장애';
            break;
        case 'CD903':
            icon = '⚪';
            color = '#6c757d';
            statusName = '미존재';
            break;
        default:

            icon = '⚫';
            color = '#343a40';
            statusName = '확인필요';
            break;
    }
    return { icon, color, statusName };
}