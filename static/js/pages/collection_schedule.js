import { showToast } from '../utils/toast.js';
import { downloadExcelTemplate } from '../utils/excelDownload.js';
import { filterActiveMstData } from '../modules/common/utils.js';
import { scheduleSettingsApi } from '../services/api.js';
import { getKSTNow, formatDateTime, formatDBDateTime } from '../modules/common/dateUtils.js';
import { showLoading, hideLoading } from '../components/loading.js';


let mstData = {};
let monthOffset = 0;
let weekOffset = 0;
let subGroupsByParent = {};
let memoColors = { iconId: null, bgColr: '#fef08b', txtColr: '#a16207' };
let isAdminUser = false;

export function init() {

    isAdminUser = false;
    const body = document.body;
    if (body && body.dataset.user) {
        try {
            const userData = JSON.parse(body.dataset.user);
            isAdminUser = userData.permissions && userData.permissions.includes('mngr_sett');
        } catch (e) {

        }
    }


    const weeklyBtn = document.getElementById('weekly-btn');
    const monthlyBtn = document.getElementById('monthly-btn');
    const calendarGrid = document.getElementById('calendar-grid');
    const cardTitle = document.querySelector('.card-title');
    const totalCountEl = document.getElementById('total-count');
    const successCountEl = document.getElementById('success-count');
    const failCountEl = document.getElementById('fail-count');
    const nodataCountEl = document.getElementById('nodata-count');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const settingsHeader = document.getElementById('settings-header');
    const settingsBody = document.getElementById('settings-body');
    const settingsContainer = document.getElementById('settings-container');
    const toggleIcon = document.getElementById('toggle-icon');
    

    let monthOffset = 0;
    let weekOffset = 0;


    const guideToggleBtn = document.getElementById('guide-toggle-btn');
    const guidePopup = document.getElementById('guide-popup');

    if (guideToggleBtn && guidePopup) {
        guideToggleBtn.addEventListener('mouseenter', () => {
            guidePopup.classList.remove('hidden');
        });
        guideToggleBtn.addEventListener('mouseleave', () => {
            guidePopup.classList.add('hidden');
        });

        guidePopup.addEventListener('mouseenter', () => {
            guidePopup.classList.remove('hidden');
        });
        guidePopup.addEventListener('mouseleave', () => {
            guidePopup.classList.add('hidden');
        });
    }


    const settingsCollapseManager = {
        _storageKey: 'heatmapSettingsCollapsed',
        _isCollapsed: false,

        init() {
            this.loadState();
            this.applyState();
            settingsHeader.addEventListener('click', () => {
                this.toggleState();
            });
        },
        loadState() {
            this._isCollapsed = localStorage.getItem(this._storageKey) === 'true';
        },
        saveState() {
            localStorage.setItem(this._storageKey, this._isCollapsed);
        },
        applyState() {
            settingsBody.classList.toggle('collapsed', this._isCollapsed);
            settingsContainer.classList.toggle('collapsed', this._isCollapsed);
            toggleIcon.classList.toggle('collapsed', this._isCollapsed);
        },
        toggleState() {
            this._isCollapsed = !this._isCollapsed;
            this.applyState();
            this.saveState();
        }
    };
    settingsCollapseManager.init();


    const settingsManager = {
        _settings: {},
        _icons: {},
        _statusCodes: [],
        _statusMapByCd: {},

        _generateIconHtml(iconCode) {
            if (!iconCode) {
                return '';
            }
            if (iconCode.includes('fa-')) {
                return `<i class="${iconCode}"></i>`;
            }
            return iconCode;
        },

        init() {
            this.applyToUI();
            this.updateGuidePopup();
        },

        updateSettings(settings) {
            if (settings) {
                this._settings = settings;
            }
            this.init();
        },

        updateStatusCodes(statusCodes) {
            this._statusCodes = statusCodes || [];
            this.buildDynamicStatusMap();
        },

        buildDynamicStatusMap() {
            this._statusMapByCd = {};
            this._statusCodes.forEach(code => {
                const cd = code.cd || code.CD;
                const bg_colr = code.bg_colr || code.BG_COLR;
                const txt_colr = code.txt_colr || code.TXT_COLR;
                const icon_cd = code.icon_cd || code.ICON_CD;
                
                if (cd) {
                    this._statusMapByCd[cd] = {
                        key: cd,
                        bg_colr: bg_colr,
                        txt_colr: txt_colr,
                        icon_cd: icon_cd
                    };
                }
            });
        },

        getStatusInfoByCd(statusCd) {
            const cd = statusCd?.toUpperCase() || statusCd;
            const info = this._statusMapByCd[cd] || this._statusMapByCd[statusCd];
            
            if (info) {
                return {
                    key: info.key,
                    class: `status-${info.key}`,
                    icon_cd: info.icon_cd,
                    bg_colr: info.bg_colr,
                    txt_colr: info.txt_colr
                };
            }
            return null;
        },

        getStatusInfo(statusCd) {
            return this.getStatusInfoByCd(statusCd) || { key: statusCd, class: `status-${statusCd}`, icon_cd: null, bg_colr: null, txt_colr: null };
        },
        
        applyToUI() {
            const styleId = 'dynamic-status-styles';
            let styleElement = document.getElementById(styleId);
            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = styleId;
                document.head.appendChild(styleElement);
            }

            const s = this._settings;
            
            const defaultColors = {
                'CD901': { bg: '#dcfce7', txt: '#166534' },
                'CD902': { bg: '#fee2e2', txt: '#991b1b' },
                'CD907': { bg: '#e5e7eb', txt: '#6b7280' },
                'CD908': { bg: '#e5e7eb', txt: '#374151' }
            };

            let cssRules = '';
            this._statusCodes.forEach(code => {
                const cd = code.cd || code.CD;
                const bg = code.bg_colr || code.BG_COLR || defaultColors[cd]?.bg || '#808080';
                const txt = code.txt_colr || code.TXT_COLR || defaultColors[cd]?.txt || '#ffffff';
                cssRules += `.status-${cd} { background-color: ${bg}; color: ${txt} !important; }\n`;
                if (cd === 'CD902') {
                    cssRules += `.status-${cd}-warn { background-color: ${bg}; color: ${txt} !important; opacity: 0.5; }\n`;
                }
            });

            styleElement.innerHTML = cssRules;

            document.getElementById('grouping-threshold').value = s.grpMinCnt || 0;
            document.getElementById('red-threshold').value = s.prgsRtRedThrsval || 0;
            document.getElementById('orange-threshold').value = s.prgsRtOrgThrsval || 0;
        },
        
        updateGuidePopup() {
            const popup = document.getElementById('guide-popup');
            if (!popup) return;

            const statusList = this._statusCodes.map(code => {
                return {
                    key: code.cd,
                    label: code.nm,
                    cd: code.cd,
                    descr: code.descr || '',
                    icon_cd: code.icon_cd,
                    bg_colr: code.bg_colr,
                    txt_colr: code.txt_colr
                };
            });

            const getStatusName = (cd) => {
                const status = statusList.find(s => s.key === cd);
                return status ? status.label : cd;
            };

            const createLi = (status) => {
                const iconHtml = this._generateIconHtml(status.icon_cd);
                const bgColor = status.bg_colr || '#808080';
                const textColor = status.txt_colr || '#ffffff';

                return `
                    <li class="flex items-center">
                        <span class="job-pill mr-2" style="background-color:${bgColor}; color:${textColor};">${iconHtml} ${status.label}</span>
                        ${status.descr || ''}
                    </li>`;
            };

            const individualItemsHtml = statusList.map(s => createLi(s)).join('');

            const s = this._settings;
            const grpMinCnt = s.grpMinCnt || 0;
            const prgsRtRedThrsval = s.prgsRtRedThrsval || 30;
            const prgsRtOrgThrsval = s.prgsRtOrgThrsval || 100;
            const succRtRedThrsval = s.succRtRedThrsval || 30;
            const succRtOrgThrsval = s.succRtOrgThrsval || 100;
            const grpColrCrtr = s.grpColrCrtr || 'prgr';
            const memoBgColr = memoColors.bgColr || '#708090';

            const isProgress = grpColrCrtr === 'prgr';
            const criteriaLabel = isProgress ? '진행률' : '성공률';
            const criteriaFormula = isProgress
                ? '완료항목 / 전체항목 × 100%'
                : '성공항목 / 완료항목 × 100%';
            const criteriaNote = isProgress
                ? '※ 진행률 = (완료항목 / 전체항목) × 100%'
                : '※ 성공률 = (성공항목 / 완료항목) × 100%';
            const orgThreshold = isProgress ? prgsRtOrgThrsval : succRtOrgThrsval;
            const redThreshold = isProgress ? prgsRtRedThrsval : succRtRedThrsval;

            const normalStatus = getStatusName('CD901');
            const warnStatus = getStatusName('CD902');
            const scheduledStatus = getStatusName('CD907');

            const cd901Status = statusList.find(s => s.cd === 'CD901');
            const cd902Status = statusList.find(s => s.cd === 'CD902');
            const cd907Status = statusList.find(s => s.cd === 'CD907');

            const createStatusBadge = (status, showNm = false) => {
                if (!status) return '';
                const bgColor = status.bg_colr || '#808080';
                const textColor = status.txt_colr || '#ffffff';
                const icon = status.icon_cd || '';
                const nm = showNm ? ` ${status.label || ''}` : '';
                return `<span class="job-pill mr-2" style="background-color:${bgColor}; color:${textColor}; font-size: 0.65rem; padding: 2px 6px;">${icon}${nm}</span>`;
            };

            const createGroupBadge = (status, opacity = 1) => {
                if (!status) return '';
                const bgColor = status.bg_colr || '#808080';
                const textColor = status.txt_colr || '#ffffff';
                const nm = status.label || '';
                return `<span class="job-pill mr-2" style="background-color:${bgColor}; color:${textColor}; opacity:${opacity}; font-size: 0.65rem; padding: 2px 6px;">${nm}</span>`;
            };

            const groupItemsHtml = `
                <li class="mb-2 text-xs text-gray-600">
                    <span class="font-semibold text-gray-700">[그룹 생성]</span><br>
                    • 수집 항목이 ${grpMinCnt}개 이상일 때 그룹으로 표시<br>
                    • 상위 그룹(CD100) / 하위 그룹(CD101, CD102...)
                </li>
                <li class="mb-2 text-xs text-gray-600">
                    <span class="font-semibold text-gray-700">[색상 기준: ${criteriaLabel}]</span><br>
                    <span class="text-gray-500">${criteriaFormula}</span>
                </li>
                <li class="mb-3 text-xs text-gray-500 border-b border-gray-200 pb-2">
                    ${criteriaNote}
                </li>
                <li class="flex items-center">
                    ${createGroupBadge(cd901Status)}
                    <span>→ ${orgThreshold}% 이상</span>
                </li>
                <li class="flex items-center">
                    ${createGroupBadge(cd902Status)}
                    <span>→ ${redThreshold}% 이상 ~ ${orgThreshold}% 미만</span>
                </li>
                <li class="flex items-center">
                    ${createGroupBadge(cd902Status, 0.5)}
                    <span>→ ${redThreshold}% 미만</span>
                </li>
                <li class="flex items-center">
                    ${createGroupBadge(cd907Status)}
                    <span>→ 예정 항목만 존재</span>
                </li>
                <li class="flex items-center mt-2 pt-2 border-t border-gray-200">
                    <span class="job-pill mr-2" style="background-color:${memoBgColr}; color: #ffffff; font-size: 0.65rem; padding: 2px 6px;">메모</span>
                    <span>메모 등록 시 그룹 배경색 변경</span>
                </li>
            `;

            const detailItemsHtml = `
                <li class="mb-2 text-xs text-gray-600">
                    <span class="font-semibold text-gray-700">[상세 데이터란]</span><br>
                    • 상위/하위 그룹 클릭 시 표시되는<br>
                    &nbsp;&nbsp;개별 수집 항목의 상태입니다.
                </li>
                <div class="flex flex-wrap gap-1">
                    ${statusList.slice(0, 8).map(status => createStatusBadge(status, true)).join('')}
                </div>
            `;

            popup.querySelector('#group-status-guide').innerHTML = groupItemsHtml;
            popup.querySelector('#detail-status-guide').innerHTML = detailItemsHtml;
        },

        get(key) {
            return this._settings[key];
        },
        
        getIconByCd(statusCd) {
            const cd = statusCd?.toUpperCase() || statusCd;
            const info = this._statusMapByCd[cd] || this._statusMapByCd[statusCd];
            if (info && info.icon_cd) {
                return this._generateIconHtml(info.icon_cd);
            }
            return '';
        },

        getIcon(statusKey) {
            const iconCode = this._settings[`${statusKey}IconCd`];
            return this._generateIconHtml(iconCode);
        }
    };
    


    function getStatusInfoByCd(statusCd) {
        return settingsManager.getStatusInfoByCd(statusCd) || { key: statusCd, class: `status-${statusCd}`, icon_cd: null, bg_colr: null, txt_colr: null };
    }

    function isStatusDisplayed(job) {
        return true;
    }

    function getGroupPillColorClass(rate, redThreshold, orangeThreshold) {
        if (rate < redThreshold) return 'status-CD902';
        if (rate < orangeThreshold) return 'status-CD902-warn';
        return 'status-CD901';
    }

    function getBorderColorFromClass(colorClass) {
        const match = colorClass.match(/^status-(CD\d+)/);
        if (!match) return '#4b5563';
        const cd = match[1];
        const info = settingsManager.getStatusInfoByCd(cd);
        return info?.txt_colr || '#4b5563';
    }

    function getProgressBarColorClass(rate, redThreshold, orangeThreshold) {
        if (rate < redThreshold) return 'progress-bar-danger';
        if (rate < orangeThreshold) return 'progress-bar-warning';
        return 'progress-bar-success';
    }

    function createProgressBarHtml(rate, redThreshold, orangeThreshold) {
        const colorClass = getProgressBarColorClass(rate, redThreshold, orangeThreshold);
        return `<div class="progress-bar-container"><div class="progress-bar-fill ${colorClass}" style="width: ${rate}%"></div></div>`;
    }

    function createTooltipContent(job, name) {
        const lines = [];
        if (job.date) {
            lines.push(`예정: ${job.date}`);
        }
        if (job.actual_date) {
            lines.push(`실제 수집: ${job.actual_date}`);
        }
        if (job.status) {
            lines.push(`상태: ${job.status}`);
        }
        if (job.cd_nm) {
            lines.push(`이름: ${job.cd_nm}`);
        }
        if (job.cd_desc) {
            lines.push(`설명: ${job.cd_desc}`);
        }
        return lines.join('\n');
    }

    function renderCalendar(data, today, viewType = 'weekly') {
        calendarGrid.innerHTML = '';
        const displayMode = document.querySelector('input[name="displayMode"]:checked').value;
        if (displayMode === 'name') {
            calendarGrid.classList.add('name-mode');
        } else {
            calendarGrid.classList.remove('name-mode');
        }


        const groupedData = data.reduce((acc, item) => {
            const date = item.date.split(' ')[0];
            if (!acc[date]) acc[date] = [];
            acc[date].push(item);
            return acc;
        }, {});

        if (data.length === 0) {
            calendarGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1;">해당 기간에 예정된 수집 일정이 없습니다.</p>';
            return;
        }

        const allDates = Array.from(new Set(data.map(item => item.date.split(' ')[0]))).sort();
        const startDate = new Date(allDates[0]);
        const endDate = new Date(allDates[allDates.length - 1]);
        
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const currentDateStr = currentDate.toISOString().split('T')[0];
            const dayData = groupedData[currentDateStr] || [];
            
            const dayColumn = document.createElement('div');
            dayColumn.className = 'day-column';
            if (currentDateStr === today) dayColumn.classList.add('today');

            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            const dateStr = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')} (${['일', '월', '화', '수', '목', '금', '토'][currentDate.getDay()]})`;
            

            const statusCounts = {
                'CD901': 0,
                'CD902': 0,
                'CD908': 0,
                'CD907': 0
            };
            
            dayData.filter(isStatusDisplayed).forEach(job => {
                if (job.status === 'CD901') statusCounts['CD901']++;
                else if (job.status === 'CD902') statusCounts['CD902']++;
                else if (job.status === 'CD907') statusCounts['CD907']++;
                else if (['CD908', 'CD904', 'CD905'].includes(job.status)) statusCounts['CD908']++;
            });
            

            const jobsCount = new Set(dayData.filter(isStatusDisplayed).map(j => j.job_id)).size;


            dayHeader.innerHTML = `
                <div>${dateStr}</div>
                <div style="font-size: 10px; margin-top: 2px;">
                    <span style="color: ${settingsManager.getStatusInfoByCd('CD901')?.txt_colr || '#166534'}">성공: ${statusCounts['CD901']}</span> / 
                    <span style="color: ${settingsManager.getStatusInfoByCd('CD902')?.txt_colr || '#991b1b'}">실패: ${statusCounts['CD902']}</span> / 
                    <span style="color: ${settingsManager.getStatusInfoByCd('CD908')?.txt_colr || '#374151'}">미수집: ${statusCounts['CD908']}</span> / 
                    <span style="color: ${settingsManager.getStatusInfoByCd('CD907')?.txt_colr || '#6b7280'}">예정: ${statusCounts['CD907']}</span>
                </div>
            `;
            dayHeader.title = `Jobs: ${jobsCount}개`;
            
            const jobsContainer = document.createElement('div');
            jobsContainer.className = 'jobs-container';


            const jobsBySubGroup = dayData.reduce((acc, job) => {
                const jobIdNum = parseInt(job.job_id.replace('CD', ''), 10);
                if (isNaN(jobIdNum)) return acc;

                const subGroupId = job.job_id;
                if (!acc[subGroupId]) acc[subGroupId] = [];
                acc[subGroupId].push(job);
                return acc;
            }, {});


            const jobsByParentGroup = {};
            Object.keys(jobsBySubGroup).forEach(subGroupId => {
                const subIdNum = parseInt(subGroupId.replace('CD', ''), 10);
                const parentGroupId = `CD${Math.floor(subIdNum / 100) * 100}`;
                if (!jobsByParentGroup[parentGroupId]) jobsByParentGroup[parentGroupId] = {};
                jobsByParentGroup[parentGroupId][subGroupId] = jobsBySubGroup[subGroupId];
            });

            Object.keys(jobsByParentGroup).sort((a, b) => {
                const numA = parseInt(a.replace('CD', ''), 10);
                const numB = parseInt(b.replace('CD', ''), 10);
                return numA - numB;
            }).forEach(parentGroupName => {
                const subGroups = jobsByParentGroup[parentGroupName];
                

                subGroupsByParent[parentGroupName] = Object.keys(subGroups).map(subId => ({
                    cd: subId,
                    cd_nm: mstData[subId]?.cd_nm || subId
                }));
                
                const groupingThreshold = settingsManager.get('grpMinCnt');
                

                const totalJobs = Object.values(subGroups).flat().filter(isStatusDisplayed).length;
                
                if (totalJobs >= groupingThreshold) {

                    const allSubGroupJobs = Object.values(subGroups).flat().filter(isStatusDisplayed);

                    const total = allSubGroupJobs.length;
                    const allScheduled = total > 0 && allSubGroupJobs.every(j => j.status === 'CD907');
                    const success = allSubGroupJobs.filter(j => j.status === 'CD901').length;
                    const fail = allSubGroupJobs.filter(j => j.status === 'CD902').length;
                    const completed = success + fail;
                    
                    const progressRate = total > 0 ? Math.round((completed / total) * 100) : 0;
                    const successRate = completed > 0 ? Math.round((success / completed) * 100) : 0;

                    let colorClass;
                    if (allScheduled) {
                        colorClass = 'status-CD907';
                    } else {
                       const colorCriteria = settingsManager.get('grpColrCrtr') || 'prgr';
                      if (colorCriteria === 'succ') {
                          colorClass = getGroupPillColorClass(successRate, settingsManager.get('succRtRedThrsval'), settingsManager.get('succRtOrgThrsval'));
                      } else {
                          colorClass = getGroupPillColorClass(progressRate, settingsManager.get('prgsRtRedThrsval'), settingsManager.get('prgsRtOrgThrsval'));
                       }
                    }

                    const groupContainer = document.createElement('div');
                    groupContainer.className = 'group-container';
                    groupContainer.style.position = 'relative';

                    const groupPill = document.createElement('div');
                    groupPill.className = `job-pill group-pill-summary ${colorClass}`;
                    const borderStyle = settingsManager.get('grpBrdrStyl') || 'solid';
                    if (borderStyle === 'none') {
                        groupPill.style.borderWidth = '0';
                    } else {
                        groupPill.style.borderStyle = borderStyle;
                        groupPill.style.borderWidth = '2px';
                        groupPill.style.borderColor = getBorderColorFromClass(colorClass);
                    }

                    const displayMode = document.querySelector('input[name="displayMode"]:checked').value;
                    let parentDisplayName = parentGroupName;
                    if (displayMode === 'name' && mstData[parentGroupName]) {
                        parentDisplayName = mstData[parentGroupName].cd_nm;
                    } else if (displayMode === 'desc' && mstData[parentGroupName]) {
                        parentDisplayName = mstData[parentGroupName].cd_desc || parentGroupName;
                    }
                    
                    const redThreshold = settingsManager.get('prgsRtRedThrsval') || 30;
                    const orangeThreshold = settingsManager.get('prgsRtOrgThrsval') || 100;
                    

                    const memoBtnHtml = isAdminUser 
                        ? `<span class="memo-btn" data-grp-id="${parentGroupName}" data-date="${currentDateStr}" data-depth="1" style="cursor: pointer; font-size: 0.65rem; padding: 1px 3px; border-radius: 4px;">+</span>`
                        : `<span class="memo-btn" data-grp-id="${parentGroupName}" data-date="${currentDateStr}" data-depth="1" style="cursor: pointer; font-size: 0.65rem; padding: 1px 3px; border-radius: 4px; display: none;">+</span>`;
                    
                    groupPill.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${parentDisplayName} <span class="expand-icon">▶</span></span>
                            ${memoBtnHtml}
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            ${createProgressBarHtml(progressRate, redThreshold, orangeThreshold)}
                            <span style="font-size: 0.75rem; white-space: nowrap;">${completed}/${total}</span>
                        </div>
                        <div class="text-center" style="font-size: 0.75rem;">
                            <span style="color: ${settingsManager.getStatusInfoByCd('CD901')?.txt_colr || '#166534'}">성공: ${success}</span> / 
                            <span style="color: ${settingsManager.getStatusInfoByCd('CD902')?.txt_colr || '#991b1b'}">실패: ${fail}</span> 
                            (${successRate}%)
                        </div>
                    `;
                    groupPill.title = parentDisplayName;


                    const parentPopup = document.createElement('div');
                    parentPopup.className = 'popup';
                    parentPopup.style.maxWidth = '900px';
                    parentPopup.style.zIndex = '10000';
                    parentPopup.style.position = 'fixed';
                    
                    const parentPopupContent = document.createElement('div');
                    parentPopupContent.className = 'popup-content';
                    parentPopupContent.style.gridTemplateColumns = 'repeat(5, 1fr)';
                    parentPopupContent.style.gap = '0.75rem';


                    const sortedSubGroupIds = Object.keys(subGroups).sort((a, b) => {
                        const numA = parseInt(a.replace('CD', ''), 10);
                        const numB = parseInt(b.replace('CD', ''), 10);
                        return numA - numB;
                    });


                    sortedSubGroupIds.forEach(subGroupId => {
                        const subGroupJobs = subGroups[subGroupId];
                        const filteredSubJobs = subGroupJobs.filter(isStatusDisplayed);

                        const subTotal = filteredSubJobs.length;
                        const subSuccess = filteredSubJobs.filter(j => j.status === 'CD901').length;
                        const subFail = filteredSubJobs.filter(j => j.status === 'CD902').length;
                        const subCompleted = subSuccess + subFail;
                        const subProgressRate = subTotal > 0 ? Math.round((subCompleted / subTotal) * 100) : 0;
                        const subSuccessRate = subCompleted > 0 ? Math.round((subSuccess / subCompleted) * 100) : 0;
                        const subAllScheduled = subTotal > 0 && filteredSubJobs.every(j => j.status === 'CD907');

                        let subColorClass;
                        if (subAllScheduled) {
                            subColorClass = 'status-CD907';
                        } else {
                            const colorCriteria = settingsManager.get('grpColrCrtr') || 'prgr';
                            if (colorCriteria === 'succ') {
                                subColorClass = getGroupPillColorClass(subSuccessRate, settingsManager.get('succRtRedThrsval'), settingsManager.get('succRtOrgThrsval'));
                            } else {
                                subColorClass = getGroupPillColorClass(subProgressRate, settingsManager.get('prgsRtRedThrsval'), settingsManager.get('prgsRtOrgThrsval'));
                            }
                        }

                        const subGroupContainer = document.createElement('div');
                        subGroupContainer.className = 'group-container sub-group-item';
                        subGroupContainer.style.position = 'relative';

                        const subGroupPill = document.createElement('div');
                        subGroupPill.className = `job-pill group-pill-summary ${subColorClass} sub-group-pill`;
                        if (borderStyle === 'none') {
                            subGroupPill.style.borderWidth = '0';
                        } else {
                            subGroupPill.style.borderStyle = borderStyle;
                            subGroupPill.style.borderWidth = '1px';
                            subGroupPill.style.borderColor = getBorderColorFromClass(subColorClass);
                        }

                        let subDisplayName = subGroupId;
                        if (displayMode === 'name' && mstData[subGroupId]) {
                            subDisplayName = mstData[subGroupId].cd_nm;
                        } else if (displayMode === 'desc' && mstData[subGroupId]) {
                            subDisplayName = mstData[subGroupId].cd_desc || subGroupId;
                        }
                        const subTooltipName = subDisplayName;
                        const maxSubLength = 18;
                        if (subDisplayName.length > maxSubLength) {
                            subDisplayName = subDisplayName.substring(0, maxSubLength) + '...';
                        }
                        
                        subGroupPill.innerHTML = `
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${subDisplayName}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                ${createProgressBarHtml(subProgressRate, redThreshold, orangeThreshold)}
                                <span style="font-size: 0.7rem; white-space: nowrap;">${subCompleted}/${subTotal}</span>
                            </div>
                            <div class="text-center" style="font-size: 0.7rem;">
                                <span style="color: ${settingsManager.getStatusInfoByCd('CD901')?.txt_colr || '#166534'}">성공: ${subSuccess}</span> / 
                                <span style="color: ${settingsManager.getStatusInfoByCd('CD902')?.txt_colr || '#991b1b'}">실패: ${subFail}</span> 
                                (${subSuccessRate}%)
                            </div>
                        `;
                        subGroupPill.title = subTooltipName;


                        const subPopup = document.createElement('div');
                        subPopup.className = 'popup';
                        subPopup.style.zIndex = '100000';
                        subPopup.style.position = 'fixed';
                        const subPopupContent = document.createElement('div');
                        subPopupContent.className = 'popup-content';

                        const sortedSubJobs = subGroupJobs.sort((a, b) => {
                            const numA = parseInt(a.job_id.replace('CD', ''), 10);
                            const numB = parseInt(b.job_id.replace('CD', ''), 10);
                            return numA - numB;
                        });

                        sortedSubJobs.forEach(job => {
                            const popupDisplayMode = document.querySelector('input[name="displayMode"]:checked').value;
                            let jobDisplayName = job.job_id;
                            if (popupDisplayMode === 'name' && mstData[job.job_id]) {
                                jobDisplayName = mstData[job.job_id].cd_nm;
                            } else if (popupDisplayMode === 'desc' && mstData[job.job_id]) {
                                jobDisplayName = mstData[job.job_id].cd_desc || job.job_id;
                            }
                            const maxPopupLength = 18;
                            if (jobDisplayName.length > maxPopupLength) {
                                jobDisplayName = jobDisplayName.substring(0, maxPopupLength) + '...';
                            }
                            const statusInfo = getStatusInfoByCd(job.status);

                            const sameDayJobs = dayData.filter(d => d.job_id === job.job_id);
                            if (sameDayJobs.length > 1) {
                                const timePart = (job.date.split(' ')[1] || "");
                                if (timePart) {
                                    const hour = parseInt(timePart.substring(0, 2), 10);
                                    jobDisplayName += `(${hour}시)`;
                                }
                            }
                            const iconHtml = settingsManager.getIconByCd(job.status);
                            const contentHtml = iconHtml ? `${iconHtml}&nbsp;${jobDisplayName}` : jobDisplayName;

                            const pillElement = document.createElement('div');
                            pillElement.className = `job-pill ${statusInfo.class}`;
                            pillElement.title = createTooltipContent(job, jobDisplayName);
                            pillElement.innerHTML = contentHtml;
                            if (statusInfo.bg_colr) {
                                pillElement.style.backgroundColor = statusInfo.bg_colr;
                            }
                            if (statusInfo.txt_colr) {
                                pillElement.style.color = statusInfo.txt_colr;
                            }
                            subPopupContent.appendChild(pillElement);
                        });

                        const subPagination = document.createElement('div');
                        subPagination.className = 'pagination';
                        const subItemsPerPage = 50;
                        const subTotalPages = Math.ceil(sortedSubJobs.length / subItemsPerPage);
                        let subCurrentPage = 1;

                        function updateSubPopupContent() {
                            const startIndex = (subCurrentPage - 1) * subItemsPerPage;
                            const endIndex = startIndex + subItemsPerPage;
                            Array.from(subPopupContent.children).forEach((pill, index) => {
                                pill.style.display = (index >= startIndex && index < endIndex) ? 'block' : 'none';
                            });
                            updateSubPaginationUI();
                        }

                        function updateSubPaginationUI() {
                            subPagination.innerHTML = '';
                            const prevBtn = document.createElement('button');
                            prevBtn.textContent = '← 이전';
                            prevBtn.disabled = subCurrentPage === 1;
                            prevBtn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                if (subCurrentPage > 1) {
                                    subCurrentPage--;
                                    updateSubPopupContent();
                                }
                            });
                            subPagination.appendChild(prevBtn);

                            const pageInfo = document.createElement('span');
                            pageInfo.className = 'page-info';
                            pageInfo.textContent = `${subCurrentPage} / ${subTotalPages}`;
                            subPagination.appendChild(pageInfo);

                            const nextBtn = document.createElement('button');
                            nextBtn.textContent = '다음 →';
                            nextBtn.disabled = subCurrentPage === subTotalPages;
                            nextBtn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                if (subCurrentPage < subTotalPages) {
                                    subCurrentPage++;
                                    updateSubPopupContent();
                                }
                            });
                            subPagination.appendChild(nextBtn);
                        }

                        subPopup.appendChild(subPopupContent);
                        if (subTotalPages > 1) {
                            subPopup.appendChild(subPagination);
                        }
                        document.body.appendChild(subPopup);
                        updateSubPopupContent();

                        const toggleSubPopup = (event) => {

                            if (event.target.classList.contains('memo-btn')) {
                                event.stopPropagation();
                                return;
                            }
                            
                            event.stopPropagation();
                            document.querySelectorAll('.popup').forEach(p => {
                                if (p !== subPopup && p !== parentPopup) {
                                    p.style.display = 'none';
                                    p.classList.remove('active');
                                }
                            });

                            const isVisible = subPopup.style.display === 'block';
                            if (isVisible) {
                                subPopup.style.display = 'none';
                                subPopup.classList.remove('active');
                            } else {
                                const pillRect = subGroupPill.getBoundingClientRect();
                                subPopup.style.display = 'block';
                                subPopup.style.visibility = 'hidden';
                                subPopup.style.position = 'fixed';
                                const popupRect = subPopup.getBoundingClientRect();
                                subPopup.style.visibility = 'visible';


                                const pillBottom = pillRect.bottom;
                                const pillTop = pillRect.top;
                                const pillLeft = pillRect.left;

                                const belowSpace = window.innerHeight - pillRect.bottom - 5;
                                let top, left;
                                if (belowSpace >= popupRect.height) {
                                    top = pillBottom + 5;
                                    left = Math.max(0, Math.min(pillLeft, window.innerWidth - popupRect.width));
                                } else {
                                    const aboveSpace = pillRect.top - 5;
                                    if (aboveSpace >= popupRect.height) {
                                        top = pillTop - popupRect.height - 5;
                                        left = Math.max(0, Math.min(pillLeft, window.innerWidth - popupRect.width));
                                    } else {
                                        top = Math.max(0, (window.innerHeight - popupRect.height) / 2);
                                        left = Math.max(0, (window.innerWidth - popupRect.width) / 2);
                                    }
                                }

                                top = Math.max(0, Math.min(top, window.innerHeight - popupRect.height));
                                left = Math.max(0, Math.min(left, window.innerWidth - popupRect.width));

                                subPopup.style.top = `${top}px`;
                                subPopup.style.left = `${left}px`;
                                subPopup.classList.add('active');
                            }
                        };

                        subGroupPill.addEventListener('click', toggleSubPopup);
                        subGroupContainer.appendChild(subGroupPill);
                        parentPopupContent.appendChild(subGroupContainer);
                    });


                    const parentPagination = document.createElement('div');
                    parentPagination.className = 'pagination';
                    const parentItemsPerPage = 20;
                    const parentTotalPages = Math.ceil(sortedSubGroupIds.length / parentItemsPerPage);
                    let parentCurrentPage = 1;

                    function updateParentPopupContent() {
                        const startIndex = (parentCurrentPage - 1) * parentItemsPerPage;
                        const endIndex = startIndex + parentItemsPerPage;
                        Array.from(parentPopupContent.children).forEach((pill, index) => {
                            pill.style.display = (index >= startIndex && index < endIndex) ? 'block' : 'none';
                        });
                        updateParentPaginationUI();
                    }

                    function updateParentPaginationUI() {
                        parentPagination.innerHTML = '';
                        if (parentTotalPages <= 1) return;
                        
                        const prevBtn = document.createElement('button');
                        prevBtn.textContent = '← 이전';
                        prevBtn.disabled = parentCurrentPage === 1;
                        prevBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            if (parentCurrentPage > 1) {
                                parentCurrentPage--;
                                updateParentPopupContent();
                            }
                        });
                        parentPagination.appendChild(prevBtn);

                        const pageInfo = document.createElement('span');
                        pageInfo.className = 'page-info';
                        pageInfo.textContent = `${parentCurrentPage} / ${parentTotalPages}`;
                        parentPagination.appendChild(pageInfo);

                        const nextBtn = document.createElement('button');
                        nextBtn.textContent = '다음 →';
                        nextBtn.disabled = parentCurrentPage === parentTotalPages;
                        nextBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            if (parentCurrentPage < parentTotalPages) {
                                parentCurrentPage++;
                                updateParentPopupContent();
                            }
                        });
                        parentPagination.appendChild(nextBtn);
                    }

                    parentPopup.appendChild(parentPopupContent);
                    if (parentTotalPages > 1) {
                        parentPopup.appendChild(parentPagination);
                    }
                    document.body.appendChild(parentPopup);
                    updateParentPopupContent();


                    groupPill.addEventListener('click', (event) => {

                        if (event.target.classList.contains('memo-btn')) {
                            return;
                        }
                        
                        event.stopPropagation();
                        document.querySelectorAll('.popup').forEach(p => {
                            if (p !== parentPopup) {
                                p.style.display = 'none';
                                p.classList.remove('active');
                            }
                        });

                        const isVisible = parentPopup.style.display === 'block';
                        if (isVisible) {
                            parentPopup.style.display = 'none';
                            parentPopup.classList.remove('active');
                        } else {

                            parentCurrentPage = 1;
                            updateParentPopupContent();
                            const pillRect = groupPill.getBoundingClientRect();
                            parentPopup.style.display = 'block';
                            parentPopup.style.visibility = 'hidden';
                            parentPopup.style.position = 'fixed';
                            const popupRect = parentPopup.getBoundingClientRect();
                            parentPopup.style.visibility = 'visible';


                            const pillBottom = pillRect.bottom;
                            const pillLeft = pillRect.left;
                            const pillTop = pillRect.top;

                            const belowSpace = window.innerHeight - pillRect.bottom - 5;
                            let top, left;
                            if (belowSpace >= popupRect.height) {
                                top = pillBottom + 5;
                                left = Math.max(0, Math.min(pillLeft, window.innerWidth - popupRect.width));
                            } else {
                                const aboveSpace = pillRect.top - 5;
                                if (aboveSpace >= popupRect.height) {
                                    top = pillTop - popupRect.height - 5;
                                    left = Math.max(0, Math.min(pillLeft, window.innerWidth - popupRect.width));
                                } else {
                                    top = Math.max(0, (window.innerHeight - popupRect.height) / 2);
                                    left = Math.max(0, (window.innerWidth - popupRect.width) / 2);
                                }
                            }

                            top = Math.max(0, Math.min(top, window.innerHeight - popupRect.height));
                            left = Math.max(0, Math.min(left, window.innerWidth - popupRect.width));

                            parentPopup.style.top = `${top}px`;
                            parentPopup.style.left = `${left}px`;
                            parentPopup.classList.add('active');
                        }
                    });

                    groupContainer.appendChild(groupPill);
                    jobsContainer.appendChild(groupContainer);
                } else {

                    const allSubGroupJobs = Object.values(subGroups).flat().filter(isStatusDisplayed);
                    allSubGroupJobs.sort((a, b) => {
                        const numA = parseInt(a.job_id.replace('CD', ''), 10);
                        const numB = parseInt(b.job_id.replace('CD', ''), 10);
                        return numA - numB;
                    });
                    
                    allSubGroupJobs.forEach(job => {
                        const jobItem = document.createElement('div');
                        const statusInfo = getStatusInfoByCd(job.status);
                        jobItem.className = `job-pill ${statusInfo.class}`;
                        if (statusInfo.bg_colr) {
                            jobItem.style.backgroundColor = statusInfo.bg_colr;
                        }
                        if (statusInfo.txt_colr) {
                            jobItem.style.color = statusInfo.txt_colr;
                        }
                        const displayMode = document.querySelector('input[name="displayMode"]:checked').value;
                        let jobDisplayName = job.job_id;
                        if (displayMode === 'name' && mstData[job.job_id]) {
                            jobDisplayName = mstData[job.job_id].cd_nm;
                        } else if (displayMode === 'desc' && mstData[job.job_id]) {
                            jobDisplayName = mstData[job.job_id].cd_desc || job.job_id;
                        }
                        const maxLength = 18;
                        if (jobDisplayName.length > maxLength) {
                            jobDisplayName = jobDisplayName.substring(0, maxLength) + '...';
                        }
                        const iconHTML = settingsManager.getIconByCd(job.status);
                        jobItem.innerHTML = iconHTML ? `${iconHTML}&nbsp;${jobDisplayName}` : jobDisplayName;
                        jobItem.title = createTooltipContent(job, jobDisplayName);
                        jobsContainer.appendChild(jobItem);
                    });
                }
            });

            dayColumn.appendChild(dayHeader);
            dayColumn.appendChild(jobsContainer);
            calendarGrid.appendChild(dayColumn);
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    function updateSummary(data) {
        const filteredData = data.filter(isStatusDisplayed);
        const total = filteredData.length;
        const success = filteredData.filter(d => d.status === 'CD901').length;
        const fail = filteredData.filter(d => d.status === 'CD902').length;
        const nodata = filteredData.filter(d => ['CD908', 'CD904', 'CD905'].includes(d.status)).length;

        totalCountEl.textContent = total;
        successCountEl.textContent = success;
        failCountEl.textContent = fail;
        nodataCountEl.textContent = nodata;
    }


    async function fetchTodayDate() {
        try {
            const response = await fetch('/api/today_date');
            if (!response.ok) {
                throw new Error('Failed to fetch today date');
            }
            const data = await response.json();
            return data.today_date;
        } catch (e) {


            return new Date().toISOString().split('T')[0];
        }
    }

    async function fetchData(viewType) {
        showLoading();

        if (Object.keys(mstData).length === 0) {
            try {
                const mstResponse = await fetch('/api/mst_list');
                const mstResult = await mstResponse.json();
                if (mstResult) {

                    const activeMstResult = filterActiveMstData(mstResult);
                    mstData = activeMstResult.reduce((acc, item) => {
                        acc[item.job_id] = {
                            cd_nm: item.cd_nm,
                            cd_desc: item.cd_desc ? item.cd_desc.replace(/_/g, ' ') : ''
                        };
                        return acc;
                    }, {});
                }
            } catch (e) {


            }
        }

        try {
            let url = `/api/collection_schedule?view=${viewType}`;
            if (viewType === 'monthly') {
                url += `&month_offset=${monthOffset}`;
            } else {
                url += `&week_offset=${weekOffset}`;
            }
            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 401) {
                    showToast('세션이 만료되었거나 로그인되지 않았습니다. 로그인 페이지로 이동합니다.', 'error');
                    window.location.href = '/login';
                }
                throw new Error('Network response was not ok');
            }

            const data = await response.json();


            if (data.error) {
                showToast(data.error, 'error');
                return;
            }


            try {
                const schedRes = await scheduleSettingsApi.getSettings();

                if (schedRes && typeof schedRes === 'object' && Object.keys(schedRes).length > 0) {
                    const s = schedRes;
                    memoColors = {
                        bgColr: s.memoBgColr || '#708090',
                        txtColr: s.memoTxtColr || '#ffffff'
                    };
                }
            } catch (e) {

            }


            if (data.display_settings) {
                settingsManager.updateSettings(data.display_settings);
            }


            try {
                const statusCodesRes = await fetch('/api/mngr_sett/status_codes');
                if (statusCodesRes.ok) {
                    const statusCodes = await statusCodesRes.json();
                    settingsManager.updateStatusCodes(statusCodes);
                    settingsManager.updateGuidePopup();
                    settingsManager.applyToUI();
                }
            } catch (e) {

            }

            cardTitle.textContent = viewType === 'weekly' ? '주간 수집 현황 히트맵' : '월간 수집 현황 히트맵';


            const today = await fetchTodayDate();


            if(data.schedule_data) {
                renderCalendar(data.schedule_data, today, viewType);
                updateSummary(data.schedule_data);
                await updateMemoButtons();
            }

            showToast(viewType === 'weekly' ? '주간 데이터를 불러왔습니다.' : '월간 데이터를 불러왔습니다.', 'success');

        } catch (error) {

            showToast('데이터를 불러오는 데 실패했습니다.', 'error');
        } finally {
            hideLoading();
        }
    }

    if (weeklyBtn) {
        weeklyBtn.addEventListener('click', () => {
            if (!weeklyBtn.classList.contains('active')) {
                weeklyBtn.classList.add('active');
                monthlyBtn.classList.remove('active');

                weekOffset = 0;
                updateNavigationVisibility();
                fetchData('weekly');
            }
        });
    }

    monthlyBtn.addEventListener('click', () => {
        if (!monthlyBtn.classList.contains('active')) {
            monthlyBtn.classList.add('active');
            if (weeklyBtn) weeklyBtn.classList.remove('active');

            monthOffset = 0;
            updateNavigationVisibility();
            fetchData('monthly');
        }
    });

    document.querySelectorAll('input[name="displayMode"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const activeView = weeklyBtn.classList.contains('active') ? 'weekly' : 'monthly';
            fetchData(activeView);
        });
    });
 

    document.addEventListener('click', (event) => {

        const groupContainers = document.querySelectorAll('.group-container');
        let clickedOutside = true;

        groupContainers.forEach(container => {
            if (container.contains(event.target)) {
                clickedOutside = false;
            }
        });

        if (clickedOutside) {

            document.querySelectorAll('.popup').forEach(popup => {
                popup.style.display = 'none';
                popup.classList.remove('active');
            });
        }
    });


    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const monthNavigation = document.getElementById('month-navigation');
    const prevWeekBtn = document.getElementById('prev-week-btn');
    const nextWeekBtn = document.getElementById('next-week-btn');
    const weekNavigation = document.getElementById('week-navigation');
    

    function updateNavigationVisibility() {
        const isMonthlyView = monthlyBtn.classList.contains('active');
        const isWeeklyView = weeklyBtn && weeklyBtn.classList.contains('active');

        if (monthNavigation) {
            monthNavigation.style.display = isMonthlyView ? 'inline-flex' : 'none';
        }
        if (weekNavigation) {
            weekNavigation.style.display = isWeeklyView ? 'inline-flex' : 'none';
        }
    }
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            monthOffset--;
            fetchData('monthly');
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            monthOffset++;
            fetchData('monthly');
        });
    }

    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => {
            weekOffset--;
            if (weeklyBtn && !weeklyBtn.classList.contains('active')) {

                weeklyBtn.classList.add('active');
                monthlyBtn.classList.remove('active');
            }
            fetchData('weekly');
        });
    }

    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => {
            weekOffset++;
            if (weeklyBtn && !weeklyBtn.classList.contains('active')) {
                weeklyBtn.classList.add('active');
                monthlyBtn.classList.remove('active');
            }
            fetchData('weekly');
        });
    }
    

    updateNavigationVisibility();
    

    const downloadExcelTemplateBtn = document.getElementById('downloadExcelTemplateBtn');
    if (downloadExcelTemplateBtn) {
        downloadExcelTemplateBtn.addEventListener('click', downloadExcelTemplate);
    }




    let isGuest = false;
    if (body && body.dataset.user) {
        try {
            const userData = JSON.parse(body.dataset.user);
            isGuest = userData.is_guest === true;
        } catch (e) {

        }
    }
    const initialView = isGuest ? 'monthly' : 'weekly';

    monthOffset = 0;
    weekOffset = 0;
    fetchData(initialView);


    const memoPopup = document.getElementById('memo-popup');
    const memoForm = document.getElementById('memo-form');
    const memoCloseBtn = document.getElementById('memo-close-btn');
    const memoDeleteBtn = document.getElementById('memo-delete-btn');
    const memoContent = document.getElementById('memo-content');
    const memoGrpId = document.getElementById('memo-grp-id');
    const memoDate = document.getElementById('memo-date');
    const memoDepth = document.getElementById('memo-depth');

    if (memoCloseBtn && memoPopup) {
        memoCloseBtn.addEventListener('click', () => {
            memoPopup.classList.add('hidden');
        });
    }

    if (memoPopup) {
        memoPopup.addEventListener('click', (e) => {
            if (e.target === memoPopup) {
                memoPopup.classList.add('hidden');
            }
        });
    }

    if (memoForm) {
        memoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const grpId = memoGrpId.value;
            const date = memoDate.value;
            const depth = parseInt(memoDepth.value);
            const content = memoContent.value;

            try {
                const response = await fetch('/api/group-memo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ grp_id: grpId, memo_date: date, depth: depth, content: content })
                });
                const result = await response.json();
                if (result.success) {
                    memoPopup.classList.add('hidden');
                    await updateMemoButtons();
                }
            } catch (err) {

                alert('메모 저장 중 오류가 발생했습니다.');
            }
        });
    }

    if (memoDeleteBtn) {
        memoDeleteBtn.addEventListener('click', async () => {
            const grpId = memoGrpId.value;
            const date = memoDate.value;
            const depth = parseInt(memoDepth.value);

            try {
                const response = await fetch(`/api/group-memo?grp_id=${grpId}&depth=${depth}&memo_date=${date}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                if (result.success) {

                    const currentMemoBtn = document.querySelector(`.memo-btn[data-grp-id='${grpId}'][data-date='${date}']`);
                    if (currentMemoBtn) {
                        const groupContainer = currentMemoBtn.closest('.group-container');
                        const groupPill = groupContainer?.querySelector('.group-pill-summary');
                        if (groupPill) {
                            groupPill.style.removeProperty('background-color');
                            groupPill.style.removeProperty('color');
                            groupPill.style.removeProperty('border-color');
                        }
                    }
                    memoPopup.classList.add('hidden');
                    await updateMemoButtons();
                } else {
                    alert(result.error || '메모 삭제에 실패했습니다.');
                }
            } catch (err) {

                alert('메모 삭제 중 오류가 발생했습니다.');
            }
        });
    }


    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('memo-btn')) {
            e.stopPropagation();
            const grpId = e.target.dataset.grpId;
            const date = e.target.dataset.date;
            const depth = parseInt(e.target.dataset.depth);

            memoGrpId.value = grpId;
            memoDate.value = date;
            memoDepth.value = depth;

            let loadedMemo = null;
            

            try {
                const response = await fetch(`/api/group-memo?grp_id=${grpId}&depth=${depth}&memo_date=${date}`);
                const result = await response.json();
                loadedMemo = result.memo;

            } catch (err) {

            }

            const isAdmin = typeof isAdminUser !== 'undefined' && isAdminUser;
            

            if (isAdmin && depth === 1) {
                const subGroups = getSubGroupsByParent(grpId);
                const subGroupList = subGroups.length > 0 ? subGroups.map(sg => {
                    const now = getKSTNow();
                    const dateStr = `${String(now.getFullYear()).slice(2)}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                    return `${sg.cd}-${sg.cd_nm}\n- '${dateStr}' : 특이사항 없음`;
                }).join('\n') + '\n\n' : '';
                
                if (loadedMemo) {
                    memoContent.value = loadedMemo.content;
                } else {
                    memoContent.value = subGroupList;
                }
            } else {

                if (loadedMemo) {
                    memoContent.value = loadedMemo.content;
                } else {
                    memoContent.value = '';
                }
            }


            if (memoContent) {
                memoContent.readOnly = !isAdmin;
            }


            const memoInfo = document.getElementById('memo-info');
            const memoWriter = document.getElementById('memo-writer');
            const memoDateInfo = document.getElementById('memo-date-info');

            if (memoInfo && memoWriter && memoDateInfo) {
                if (loadedMemo && loadedMemo.writer_id) {
                    memoWriter.textContent = loadedMemo.writer_id;
                    const createdAt = loadedMemo.created_at || loadedMemo.createdAt;

                    memoDateInfo.textContent = formatDBDateTime(createdAt);
                } else {
                    memoWriter.textContent = '';
                    memoDateInfo.textContent = '';
                }
            }


            if (memoForm && memoForm.querySelector) {
                memoForm.querySelector('button[type="submit"]').style.display = isAdmin ? 'inline-block' : 'none';
            }
            if (memoDeleteBtn) {
                memoDeleteBtn.style.display = (isAdmin && loadedMemo) ? 'inline-block' : 'none';
            }

            if (memoPopup) {
                memoPopup.classList.remove('hidden');
                

                const container = memoPopup.querySelector('div[class*="bg-white"]');
                if (container) {
                    const rect = container.getBoundingClientRect();



                    const textarea = document.getElementById('memo-content');
                    if (textarea) {
                        const taRect = textarea.getBoundingClientRect();



                    }
                }
            }
        }
    });


    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && memoPopup && !memoPopup.classList.contains('hidden')) {
            memoPopup.classList.add('hidden');
        }
    });
}

async function updateMemoButtons() {
    const memoBtns = document.querySelectorAll('.memo-btn');
    if (memoBtns.length === 0) {
        return;
    }

    const grpIds = [...new Set(Array.from(memoBtns).map(btn => btn.dataset.grpId))];
    const dates = [...new Set(Array.from(memoBtns).map(btn => btn.dataset.date))];

    try {
        const apiUrl = '/api/memos-batch?grp_ids=' + grpIds.join(',') + '&dates=' + dates.join(',');
        const response = await fetch(apiUrl);
        const result = await response.json();
        
        if (!result.memos || result.memos.length === 0) {
            memoBtns.forEach(btn => {
                if (isAdminUser) {
                    btn.textContent = '+';
                    btn.style.color = '';
                    btn.style.backgroundColor = '';
                    btn.style.display = '';
                } else {
                    btn.style.display = 'none';
                }
            });
            return;
        }

        memoBtns.forEach(btn => {
            const btnGrpId = btn.dataset.grpId;
            const btnDate = btn.dataset.date;
            
            const hasMemo = result.memos.some(m => {
                const memoDateObj = new Date(m.memo_date);
                const memoDateStr = !isNaN(memoDateObj) ? memoDateObj.toISOString().split('T')[0] : String(m.memo_date).slice(0, 10);
                return m.grp_id === btnGrpId && memoDateStr === btnDate;
            });
            
            if (hasMemo) {
                btn.textContent = '✓';
                btn.style.color = memoColors.txtColr;
                btn.style.backgroundColor = memoColors.bgColr;
                btn.style.display = '';
                

                const groupContainer = btn.closest('.group-container');
                const groupPill = groupContainer?.querySelector('.group-pill-summary');
                if (groupPill) {
                    groupPill.style.setProperty('background-color', memoColors.bgColr, 'important');
                    groupPill.style.setProperty('color', memoColors.txtColr, 'important');
                    groupPill.style.borderColor = memoColors.txtColr;
                }
            } else {
                if (isAdminUser) {
                    btn.textContent = '+';
                    btn.style.color = '';
                    btn.style.backgroundColor = '';
                    btn.style.display = '';
                } else {
                    btn.style.display = 'none';
                }
                

                const groupContainer = btn.closest('.group-container');
                const groupPill = groupContainer?.querySelector('.group-pill-summary');
                if (groupPill) {
                    groupPill.style.removeProperty('background-color');
                    groupPill.style.removeProperty('color');
                    groupPill.style.removeProperty('border-color');
                }
            }
        });
    } catch (err) {

    }
}


function getSubGroupsByParent(parentGrpId) {
    return subGroupsByParent[parentGrpId] || [];
}
