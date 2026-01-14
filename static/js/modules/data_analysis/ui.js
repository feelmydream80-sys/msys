// static/js/modules/data_analysis/ui.js

/**
 * @module ui
 * @description 데이터 분석 페이지의 UI 렌더링 및 DOM 조작을 담당합니다.
 * - 요약 카드, 추이 차트, 원천 데이터 테이블, Job 상세 정보 테이블 등을 렌더링합니다.
 * - 페이징 UI를 생성하고 업데이트합니다.
 * - AI 분석 결과를 화면에 표시합니다.
 * 
 * @example
 * import { renderAllComponents, initializeUIPgination } from './ui.js';
 * 
 * // 데이터 로드 후 모든 UI 컴포넌트 렌더링
 * renderAllComponents({ summary, trend, raw, jobInfo });
 * 
 * // 페이지 초기화 시 페이징 UI 설정
 * initializeUIPgination(onPageChangeCallback);
 */

import { getErrorCodeMap, getJobMstInfoMap, getChartColorMap, setRawData, getRawData, setJobInfoData, getJobInfoData } from './data.js';
import { parseCronExpression, numberWithCommas, getKoreanDay, formatNumberWithUnits } from './utils.js';
import { initPagination } from '../ui_components/pagination.js';

// 전역 상태 변수 (UI 모듈 내에서만 사용)
let trendChart = null;
let chronologicalRawData = [];

// 페이징 상태
let rawCurrentPage = 1;
let jobInfoCurrentPage = 1;
let jobInfoPageSize = 5;
let rawDataPageSize = 10;
let rawDataSearchTerm = '';
let jobInfoSearchTerm = '';

/**
 * @description 날짜 선택기의 기본값을 설정합니다.
 * @param {HTMLElement} startDate - 시작일 input
 * @param {HTMLElement} endDate - 종료일 input
 */
export function setDefaultDates(startDate, endDate) {
    const today = luxon.DateTime.local();
    const startOfYear = today.startOf('year');
    if (startDate) startDate.value = startOfYear.toISODate();
    if (endDate) endDate.value = today.toISODate();
}

/**
 * @description 요약 카드를 렌더링합니다.
 * @param {Array} rawData - 원천 데이터 배열
 */
export function renderSummaryCards(rawData) {
    const errorCodeMap = getErrorCodeMap();
    // ... (기존 renderSummaryCards 로직)
    const durations = rawData
        .filter(r => r.start_dt && r.end_dt)
        .map(r => ({
            min: (new Date(r.end_dt) - new Date(r.start_dt)) / (1000*60*60),
            row: r
        }))
        .filter(v => !isNaN(v.min));
    let durationText = '-';
    let maxInfoHtml = '';
    if (durations.length > 0) {
        const minObj = durations.reduce((a, b) => a.min < b.min ? a : b);
        const maxObj = durations.reduce((a, b) => a.min > b.min ? a : b);
        durationText = `0.0hr/${maxObj.min.toFixed(1)}hr`;
        if (maxObj.row && maxObj.row.start_dt && maxObj.row.job_id) {
            const dateStr = new Date(maxObj.row.start_dt).toLocaleString('ko-KR', {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'});
            maxInfoHtml = `<div style='font-size:0.5em;color:#666;margin-top:2px;'>최대: ${dateStr} (${maxObj.row.job_id})</div>`;
        }
    }
    document.getElementById('durationRange').innerHTML = durationText + maxInfoHtml;

    let fail = 0, total = 0;
    const failData = [];
    rawData.forEach(r => {
        const match = r.rqs_info && r.rqs_info.match(/(총 요청 수|\ucd1d \uc694\uccad \uc218): (\d+), (실패|\uc2e4\ud328): (\d+)/);
        if (match) {
            const t = parseInt(match[2]);
            const f = parseInt(match[4]);
            total += t;
            // status가 'CD902'일 경우에만 실패 건수를 합산
            if (r.status === 'CD902') {
                fail += f;
                if (f > 0) {
                    failData.push({ ...r, failCount: f, totalCount: t });
                }
            }
        }
    });
    
    let latestFailInfo = '';
    if (failData.length > 0) {
        const latestFail = failData.reduce((latest, current) => new Date(current.start_dt || current.date) > new Date(latest.start_dt || latest.date) ? current : latest);
        const failDate = new Date(latestFail.start_dt || latestFail.date);
        const formattedDate = failDate ? failDate.toISOString().slice(0, 10) : 'N/A';
        latestFailInfo = `최근 실패: ${formattedDate} (${latestFail.job_id}, ${latestFail.failCount}건)`;
    }
    
    document.getElementById('failCount').innerHTML = `
        <div class="text-2xl font-bold">${formatNumberWithUnits(fail)}건/${formatNumberWithUnits(total)}건</div>
        ${latestFailInfo ? `<div class="text-xs text-gray-600 mt-1">${latestFailInfo}</div>` : ''}
    `;

    const stopData = rawData.filter(r => r.status && r.status !== 'CD901' && r.status !== 'CD904');
    const stopCount = stopData.length;
    
    let latestStopInfo = '';
    if (stopData.length > 0) {
        const latestStop = stopData.reduce((latest, current) => new Date(current.start_dt || current.date) > new Date(latest.start_dt || latest.date) ? current : latest);
        const stopDate = new Date(latestStop.start_dt || latestStop.date);
        const stopCode = errorCodeMap[latestStop.status] || latestStop.status;
        const formattedDate = stopDate ? stopDate.toISOString().slice(0, 10) : 'N/A';
        latestStopInfo = `최근 중단: ${formattedDate} (${latestStop.job_id}, ${stopCode})`;
    }
    
    document.getElementById('stopCount').innerHTML = `
        <div class="text-2xl font-bold">${numberWithCommas(stopCount)}회</div>
        ${latestStopInfo ? `<div class="text-xs text-gray-600 mt-1">${latestStopInfo}</div>` : ''}
    `;
}

/**
 * @description 추이/경향 차트를 렌더링합니다.
 * @param {Object} data - 차트 데이터
 */
export function renderTrendChart(data) {
    const trendChartElem = document.getElementById('trendChart');
    const trendChartCtx = trendChartElem ? trendChartElem.getContext('2d') : null;
    if (!trendChartCtx) return;
    if (trendChart) trendChart.destroy();
    
    const chartColorMap = getChartColorMap();
    const datasets = data.datasets.map(ds => ({
        ...ds,
        borderColor: chartColorMap[ds.label] || '#888',
        backgroundColor: chartColorMap[ds.label] || '#888',
    }));

    trendChart = new Chart(trendChartCtx, {
        type: 'line',
        data: { labels: data.labels, datasets },
        options: {
            responsive: true,
            plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false }, datalabels: { display: false } },
            interaction: { mode: 'nearest', axis: 'x', intersect: false },
            scales: { x: { display: true, title: { display: true, text: '일자' } }, y: { display: true, title: { display: true, text: '성공률(%)' }, min: 0, max: 100 } }
        }
    });
}

/**
 * @description 인사이트 텍스트를 렌더링합니다.
 * @param {string} text - 표시할 텍스트
 */
export function renderInsight(text) {
    const insightBox = document.getElementById('insightBox');
    if (insightBox) insightBox.textContent = text;
}

/**
 * @description AI 답변 텍스트를 렌더링합니다.
 * @param {string} text - 표시할 텍스트
 */
export function renderAiAnswer(text) {
    const aiAnswer = document.getElementById('aiAnswer');
    if (aiAnswer) aiAnswer.textContent = text;
}

// --- 원천 데이터 테이블 관련 함수들 ---

function calcDailyStats(rawData) {
    // ... (기존 calcDailyStats 로직)
    const dayMap = {};
    rawData.forEach(row => {
        let day = '';
        if (row.start_dt) {
            const d = new Date(row.start_dt);
            day = d.toISOString().slice(0, 16).replace('T', ' ');
        }
        const jobId = row.job_id;
        if (!dayMap[day]) dayMap[day] = {};
        if (!dayMap[day][jobId]) dayMap[day][jobId] = [];
        dayMap[day][jobId].push(row);
    });
    const result = {};
    Object.entries(dayMap).forEach(([day, jobMap]) => {
        Object.entries(jobMap).forEach(([jobId, rows]) => {
            let total = 0, success = 0;
            rows.forEach(r => {
                const match = r.rqs_info && r.rqs_info.match(/(총 요청 수|\ucd1d \uc694\uccad \uc218): (\d+), (실패|\uc2e4\ud328): (\d+)/);
                if (match) {
                    const t = parseInt(match[2]);
                    const f = parseInt(match[4]);
                    total += t;
                    success += (t - f);
                }
            });
            const completeness = total > 0 ? (success / total) * 100 : 0;
            const durations = rows.filter(r => r.start_dt && r.end_dt).map(r => (new Date(r.end_dt) - new Date(r.start_dt)) / (1000*60*60));
            const avgDuration = durations.length > 0 ? (durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
            let trimmedAvg = avgDuration;
            if (durations.length > 2) {
                const sorted = durations.slice().sort((a, b) => a - b);
                const trimmed = sorted.slice(1, -1);
                trimmedAvg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
            }
            result[`${day}_${jobId}`] = {
                completeness: completeness ? completeness.toFixed(1) : '',
                avgDuration: avgDuration ? avgDuration.toFixed(2) : '',
                trimmedAvg: trimmedAvg ? trimmedAvg.toFixed(2) : '',
                success,
                total
            };
        });
    });
    return result;
}

function filterRawData(data, searchTerm) {
    if (!searchTerm) return data;
    const searchLower = searchTerm.toLowerCase();
    const errorCodeMap = getErrorCodeMap();
    return data.filter(item => 
        (item.job_id && item.job_id.toLowerCase().includes(searchLower)) ||
        (item.status && item.status.toLowerCase().includes(searchLower)) ||
        (item.error_code && item.error_code.toLowerCase().includes(searchLower)) ||
        (errorCodeMap[item.error_code || item.status] && errorCodeMap[item.error_code || item.status].toLowerCase().includes(searchLower))
    );
}

function renderRawTableContent(pageData) {
    // ... (기존 renderRawTableContent 로직)
    const rawDataTable = document.getElementById('rawDataTable').getElementsByTagName('tbody')[0];
    if (!rawDataTable) return;
    
    rawDataTable.innerHTML = '';
    const dailyStats = calcDailyStats(getRawData()); // success_rate_change 계산을 위해 유지
    const errorCodeMap = getErrorCodeMap();

    pageData.forEach(row => {
        const kstStartString = row.start_dt || '';
        const kstEndString = row.end_dt || '';
        const kstStart = kstStartString ? new Date(kstStartString) : null;
        const kstEnd = kstEndString ? new Date(kstEndString) : null;
        const day = kstStartString.slice(0, 16);

        let collectHour = '';
        if (kstStartString) {
            if (kstEndString) {
                // new Date()를 여기서만 계산용으로 사용
                collectHour = ((new Date(kstEndString) - new Date(kstStartString)) / (1000 * 60 * 60)).toFixed(2) + 'hr';
            } else {
                collectHour = '수집 중';
            }
        }
        
        const statusLabel = errorCodeMap[row.error_code || row.status] || (row.error_code || row.status || '');
        const stat = dailyStats[`${day}_${row.job_id}`] || {};
        
        let completenessText = 'N/A';
        if (collectHour !== '수집 중') {
            const match = row.rqs_info && row.rqs_info.match(/(총 요청 수|\ucd1d \uc694\uccad \uc218): (\d+), (실패|\uc2e4\ud328): (\d+)/);
            if (match) {
                const total = parseInt(match[2]);
                const fail = parseInt(match[4]);
                const success = total - fail;
                const percent = total > 0 ? Math.round((success / total) * 100) : 0;
                completenessText = `${formatNumberWithUnits(success)}/${formatNumberWithUnits(total)} (${percent}%)`;
            }
        } else {
            completenessText = '수집 중';
        }
        
        const chronologicalJobRows = chronologicalRawData.filter(r => r.job_id === row.job_id);
        const chronologicalRowIdx = chronologicalJobRows.findIndex(r => (r.con_id || r.start_dt) === (row.con_id || row.start_dt));
        const cumulativeCount = chronologicalRowIdx + 1;

        const jobRows = getRawData().filter(r => r.job_id === row.job_id);
        const rowIdx = jobRows.findIndex(r => (r.con_id || r.start_dt) === (row.con_id || r.start_dt));
        
        const last3 = jobRows.slice(Math.max(0, rowIdx-2), rowIdx+1).filter(r => r.start_dt && r.end_dt);
        const avg3hr = last3.length > 0 ? (last3.map(r => (new Date(r.end_dt)-new Date(r.start_dt))/(1000*60*60)).reduce((a,b)=>a+b,0)/last3.length).toFixed(2) : '';
        
        let failStreak = 0;
        for (let i = rowIdx; i >= 0; i--) {
            const currentRow = jobRows[i];
            const match = currentRow.rqs_info && currentRow.rqs_info.match(/(총 요청 수|\ucd1d \uc694\uccad \uc218): (\d+), (실패|\uc2e4\ud328): (\d+)/);
            if (match) {
                const failCount = parseInt(match[4]);
                if (failCount > 0) {
                    failStreak++;
                } else {
                    break; // 실패가 없으면 연속이 끊김
                }
            } else {
                // rqs_info가 없는 경우, status 기반으로 판단 (기존 로직 유지)
                if (currentRow.status !== 'CD901' && currentRow.status !== 'CD904') {
                    failStreak++;
                } else {
                    break;
                }
            }
        }
        
        const allDurations = jobRows.filter(r=>r.start_dt&&r.end_dt).map(r=>(new Date(r.end_dt)-new Date(r.start_dt))/(1000*60*60));
        const mean = allDurations.length>0 ? allDurations.reduce((a,b)=>a+b,0)/allDurations.length : 0;
        let isOutlier = '';
        if (kstStart && kstEnd) {
            const duration = (kstEnd-kstStart)/(1000*60*60);
            if (duration === 0) isOutlier = '이상(수집시간 0)';
            else if (mean > 0 && duration >= mean*2) isOutlier = '이상(평균의 2배 이상)';
        }
        
        let prevComp = '0.0';
        if(rowIdx>0) {
            const prev = jobRows[rowIdx-1];
            const prevStat = dailyStats[(new Date(prev.start_dt)?.toISOString().slice(0,16).replace('T',' ')||'')+'_'+prev.job_id]||{};
            const currStat = dailyStats[(kstStart?.toISOString().slice(0,16).replace('T',' ')||'')+'_'+row.job_id]||{};
            if(prevStat.completeness && currStat.completeness) {
                const diff = (parseFloat(currStat.completeness)-parseFloat(prevStat.completeness)).toFixed(1);
                prevComp = (diff>0?'+':'')+diff;
            }
        }
        
        let prevCompColor = 'text-gray-500';
        if (parseFloat(prevComp) > 0) prevCompColor = 'text-red-600 font-bold';
        else if (parseFloat(prevComp) < 0) prevCompColor = 'text-blue-600 font-bold';
        
        // 예측 수집시간 계산 (샘플 값: 평균 수집시간에 ±15% 변동 적용)
        let predictedCollectHour = '';
        if (kstStart && kstEnd && stat.avgDuration && parseFloat(stat.avgDuration) > 0) {
            const actualDuration = (kstEnd - kstStart) / (1000 * 60 * 60);
            const avgDuration = parseFloat(stat.avgDuration);
            // 실제 수집시간과 평균의 차이를 기반으로 예측값 생성
            const variation = (actualDuration - avgDuration) * 0.1; // 10% 변동 적용
            const predictedDuration = avgDuration + variation;
            predictedCollectHour = predictedDuration > 0 ? predictedDuration.toFixed(2) + 'hr' : 'N/A';
        } else if (stat.avgDuration && parseFloat(stat.avgDuration) > 0) {
            // 과거 데이터 기반 예측
            const avgDuration = parseFloat(stat.avgDuration);
            const randomVariation = (Math.random() - 0.5) * 0.3; // ±15% 랜덤 변동
            const predictedDuration = avgDuration * (1 + randomVariation);
            predictedCollectHour = predictedDuration > 0 ? predictedDuration.toFixed(2) + 'hr' : 'N/A';
        } else {
            predictedCollectHour = 'N/A';
        }


        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-4 py-2 border-b text-center">${row.start_dt || (row.date || '')}</td>
            <td class="px-4 py-2 border-b text-center">${row.job_id || ''}</td>
            <td class="px-4 py-2 border-b text-center">${statusLabel}</td>
            <td class="px-4 py-2 border-b text-center">${getKoreanDay(kstStart)}</td>
            <td class="px-4 py-2 border-b text-center">${collectHour}</td>
            <td class="px-4 py-2 border-b text-center">${predictedCollectHour}</td>
            <td class="px-4 py-2 border-b text-center">${completenessText}</td>
            <td class="px-4 py-2 border-b text-center">${stat.avgDuration !== undefined && stat.avgDuration !== '' ? stat.avgDuration : '0.0'}</td>
            <td class="px-4 py-2 border-b text-center">${stat.trimmedAvg !== undefined && stat.trimmedAvg !== '' ? stat.trimmedAvg : '0.0'}</td>
            <td class="px-4 py-2 border-b text-center">${avg3hr}</td>
            <td class="px-4 py-2 border-b text-center">${failStreak}</td>
            <td class="px-4 py-2 border-b text-center">${isOutlier}</td>
            <td class="px-4 py-2 border-b text-center ${prevCompColor}">${prevComp}</td>
            <td class="px-4 py-2 border-b text-center">${cumulativeCount}</td>
        `;
        rawDataTable.appendChild(tr);
    });
}

function renderRawTablePage(pageData) {
    renderRawTableContent(pageData);
}

/**
 * @description 원천 데이터 테이블을 초기 렌더링합니다.
 * @param {Array} data - 원천 데이터 배열
 */
export function renderRawTable(data) {
    chronologicalRawData = [...data].sort((a, b) => new Date(a.start_dt) - new Date(b.start_dt));
    const sortedData = [...data].sort((a, b) => new Date(b.start_dt) - new Date(a.start_dt));
    setRawData(sortedData);
    
    initPagination({
        fullData: getRawData(),
        pageSize: rawDataPageSize,
        renderTableCallback: renderRawTablePage,
        paginationId: 'rawPagination',
        pageSizeId: 'rawDataPageSize',
        searchId: 'rawDataSearch',
        totalCountId: 'data-analysis-total-count'
    });
}

// --- Job 상세 정보 테이블 관련 함수들 ---

function filterJobInfoData(data, searchTerm) {
    if (!searchTerm) return data;
    const searchLower = searchTerm.toLowerCase();
    return data.filter(item => 
        (item.job_id && item.job_id.toLowerCase().includes(searchLower)) ||
        (item.cd_nm && item.cd_nm.toLowerCase().includes(searchLower)) ||
        (item.item1 && item.item1.toLowerCase().includes(searchLower))
    );
}

function renderJobInfoTableContent(pageData) {
    const table = document.getElementById('jobInfoTable');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    
    pageData.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-4 py-2 border-b text-center">${item.job_id || ''}</td>
            <td class="px-4 py-2 border-b text-center">${item.cd_nm || ''}</td>
            <td class="px-4 py-2 border-b text-center">
                <div>${item.item6 || 'N/A'}</div>
                <div class="text-xs text-gray-500 mt-1">${parseCronExpression(item.item6)}</div>
            </td>
            <td class="px-4 py-2 border-b text-center">${item.cd_desc || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderJobInfoTablePage(pageData) {
    renderJobInfoTableContent(pageData);
}

/**
 * @description Job ID 상세정보 테이블을 렌더링합니다.
 */
export function renderJobInfoTable() {
    const jobMstInfoMap = getJobMstInfoMap();
    const jobInfoData = Object.keys(jobMstInfoMap).sort((a, b) => {
        const numA = parseInt(a.replace('CD', ''), 10);
        const numB = parseInt(b.replace('CD', ''), 10);
        return numA - numB;
    }).map(jobId => ({
        job_id: jobId,
        cd_nm: jobMstInfoMap[jobId].cd_nm || '',
        item6: jobMstInfoMap[jobId].item6 || '',
        cd_desc: jobMstInfoMap[jobId].cd_desc || ''
    }));
    setJobInfoData(jobInfoData);

    initPagination({
        fullData: getJobInfoData(),
        pageSize: jobInfoPageSize,
        renderTableCallback: renderJobInfoTablePage,
        paginationId: 'jobInfoPagination',
        pageSizeId: 'jobInfoPageSize',
        searchId: 'jobInfoSearch',
    });
}

// --- 페이징 UI 초기화 ---

/**
 * @description 원천 데이터 테이블의 페이징 UI를 초기화합니다.
 */
export function initRawDataPaging() {
    // 이 함수는 이제 initPagination으로 대체되었으므로 비워둡니다.
    // 페이지 크기 및 검색 이벤트는 pagination.js 모듈에서 직접 처리합니다.
}

/**
 * @description Job ID 상세 정보 테이블의 페이징 UI를 초기화합니다.
 */
export function initJobInfoPaging() {
    // 이 함수는 이제 initPagination으로 대체되었으므로 비워둡니다.
}
