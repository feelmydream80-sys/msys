// static/js/modules/data_analysis/events.js

/**
 * @module events
 * @description 데이터 분석 페이지의 이벤트 처리 및 메인 로직을 담당합니다.
 * - 필터 변경, 버튼 클릭 등 사용자 이벤트를 처리합니다.
 * - 데이터 모듈과 UI 모듈을 연결하여 전체 애플리케이션 흐름을 제어합니다.
 * - AI 분석 요청 및 응답 처리를 담당합니다.
 * 
 * @example
 * import { initializeAnalysisPage } from './events.js';
 * 
 * document.addEventListener('DOMContentLoaded', initializeAnalysisPage);
 */

import {
    initializeData,
    fetchSummaryData,
    fetchTrendData,
    fetchRawData,
    updateJobMstInfoMap,
    getChartColorMap,
    setRawData,
    getRawData,
    getJobInfoData,
    getErrorCodeMap
} from './data.js';
import {
    setDefaultDates,
    renderSummaryCards,
    renderTrendChart,
    renderRawTable,
    renderJobInfoTable,
    renderInsight,
    renderAiAnswer,
    initRawDataPaging,
    initJobInfoPaging
} from './ui.js';
import { initCollapsibleFeatures } from '../ui_components/collapsible.js';
import { updatePaginationData } from '../ui_components/pagination.js';
import { displayMinMaxDates } from '../dashboard/ui.js';
import { downloadExcelTemplate } from '../../utils/excelDownload.js';

// DOM 요소 캐싱
const elements = {
    startDate: document.getElementById('startDate'),
    endDate: document.getElementById('endDate'),
    jobIdSelect: document.getElementById('jobIdSelect'),
    errorCodeSelect: document.getElementById('errorCodeSelect'),
    allDataCheckbox: document.getElementById('allDataCheckbox'),
    askAiBtn: document.getElementById('askAiBtn'),
    aiQuestion: document.getElementById('aiQuestion'),
    analyzeBtn: document.getElementById('analyzeBtn')
};

/**
 * @description 필터 값에 따라 모든 데이터를 조회하고 화면을 다시 렌더링합니다.
 */
async function fetchAndRenderAll() {
    const start = elements.startDate.value;
    const end = elements.endDate.value;
    const jobId = elements.jobIdSelect.value;
    const jobIds = (jobId === '' || jobId === '전체') ? undefined : [jobId];
    const errorCode = elements.errorCodeSelect.value;
    const allData = elements.allDataCheckbox ? elements.allDataCheckbox.checked : false;

    try {
        const [summary, trend, raw] = await Promise.all([
            fetchSummaryData(start, end, jobIds, allData),
            fetchTrendData(start, end, jobIds, allData),
            fetchRawData(start, end, jobIds, allData)
        ]);
        
        setRawData(raw);

        let filteredRaw = getRawData();
        if (errorCode && errorCode !== '' && errorCode !== '전체') {
            filteredRaw = filteredRaw.filter(row => row.status === errorCode);
        }

        const jobIdSet = new Set();
        trend.forEach(d => { if (d.job_id) jobIdSet.add(d.job_id); });
        filteredRaw.forEach(d => { if (d.job_id) jobIdSet.add(d.job_id); });
        await updateJobMstInfoMap(Array.from(jobIdSet));

        renderRawTable(filteredRaw);
        renderJobInfoTable();
        renderSummaryCards(getRawData()); // 항상 전체 데이터로 요약 카드 렌더링
        renderInsight('');
        renderAiAnswer('');

        const chartColorMap = getChartColorMap();
        const trendLabels = [...new Set(trend.map(d => d.date || d.log_dt || d.start_dt))];
        const jobIdsSet = [...new Set(trend.map(d => d.job_id))];
        const datasets = jobIdsSet.map(jid => ({
            label: jid,
            data: trendLabels.map(date => {
                const found = trend.find(d => (d.date || d.log_dt || d.start_dt) === date && d.job_id === jid);
                return found ? Number(found.success_rate) : null;
            }),
            borderColor: chartColorMap[jid] || '#888',
            backgroundColor: chartColorMap[jid] || '#888',
            pointRadius: 3,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: false
        }));
        renderTrendChart({ labels: trendLabels, datasets });

    } catch (e) {
        alert('데이터 조회 실패: ' + e.message);
    }
}

/**
 * @description Gemini API를 호출하여 데이터 분석을 요청하고 결과를 표시합니다.
 */
function askGeminiAnalysis() {
    // ... (기존 askGeminiAnalysis 로직)
    let jobInfoRows = [];
    const jobInfoTable = document.getElementById('jobInfoTable');
    if (jobInfoTable) {
        const trs = jobInfoTable.querySelectorAll('tbody tr');
        trs.forEach(tr => {
            const tds = tr.querySelectorAll('td');
            if (tds.length >= 3) {
                jobInfoRows.push({
                    job_id: tds[0].textContent.trim(),
                    name: tds[1].textContent.trim(),
                    desc: tds[2].textContent.trim()
                });
            }
        });
    }
    
    const data = lastRawData || [];
    let prompt = `아래는 데이터 수집 시스템의 Job ID 상세 정보와 수집 및 가공 데이터입니다.\n\n`;
    prompt += `[Job ID 상세 정보]\n`;
    jobInfoRows.forEach(row => {
        prompt += `- ${row.job_id}: ${row.name}, 설명: ${row.desc}\n`;
    });
    prompt += `\n[수집 및 가공 데이터]\n`;
    data.forEach(row => {
        prompt += `| ${Object.values(row).join(' | ')} |\n`;
    });
    prompt += `\n이 데이터를 바탕으로\n1. Job ID별/전체의 최대·최소 소요시간, 실패건수, 중단횟수의 경향\n2. 최근 이상치/연속 실패/성공률 변화 등 특이점\n3. 데이터 품질 및 수집 안정성에 대한 인사이트\n4. (추가 데이터가 생기면) 새로운 컬럼까지 포함한 종합 분석\n을 표와 요약으로 정리해줘.`;
    
    renderInsight(prompt);
    renderAiAnswer('Gemini에게 분석 요청 중...');
    
    fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    })
    .then(res => res.json())
    .then(data => {
        const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'AI 응답이 없습니다.';
        renderAiAnswer(answer);
    })
    .catch(err => {
        renderAiAnswer('Gemini API 호출 오류: ' + err);
    });
}

/**
 * @description 이벤트 리스너를 초기화합니다.
 */
function initializeEventListeners() {
    elements.jobIdSelect?.addEventListener('change', fetchAndRenderAll);
    elements.errorCodeSelect?.addEventListener('change', fetchAndRenderAll);
    elements.startDate?.addEventListener('change', fetchAndRenderAll);
    elements.endDate?.addEventListener('change', fetchAndRenderAll);
    elements.allDataCheckbox?.addEventListener('change', fetchAndRenderAll);

    elements.askAiBtn?.addEventListener('click', () => {
        renderAiAnswer('AI 답변 예시: ' + elements.aiQuestion.value);
    });

    elements.analyzeBtn?.addEventListener('click', askGeminiAnalysis);

    // 검색 이벤트 리스너
    const jobInfoSearch = document.getElementById('jobInfoSearch');
    if (jobInfoSearch) {
        jobInfoSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const allJobInfo = getJobInfoData();
            const filtered = allJobInfo.filter(item => 
                (item.job_id && item.job_id.toLowerCase().includes(searchTerm)) ||
                (item.cd_nm && item.cd_nm.toLowerCase().includes(searchTerm)) ||
                (item.cd_desc && item.cd_desc.toLowerCase().includes(searchTerm))
            );
            updatePaginationData('jobInfoPagination', filtered);
        });
    }

    const rawDataSearch = document.getElementById('rawDataSearch');
    if (rawDataSearch) {
        rawDataSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const allRawData = getRawData();
            const errorCodeMap = getErrorCodeMap();
            const filtered = allRawData.filter(item => {
                const statusLabel = errorCodeMap[item.error_code || item.status] || (item.error_code || item.status || '');
                
                // '실패'로 검색했을 때의 특별 처리
                if (searchTerm === '실패') {
                    const match = item.rqs_info && item.rqs_info.match(/(?:실패|실패): (\d+)/);
                    const failCount = match ? parseInt(match[1]) : 0;
                    // status가 CD902이고, rqs_info에 실패 건수가 0보다 크거나, statusLabel이 '실패'를 포함하는 경우
                    return (item.status === 'CD902' && failCount > 0) || (statusLabel && statusLabel.includes('실패'));
                }

                return (item.job_id && item.job_id.toLowerCase().includes(searchTerm)) ||
                       (item.status && item.status.toLowerCase().includes(searchTerm)) ||
                       (item.error_code && item.error_code.toLowerCase().includes(searchTerm)) ||
                       (statusLabel && statusLabel.toLowerCase().includes(searchTerm));
            });
            updatePaginationData('rawPagination', filtered);
        });
    }

    // 엑셀 템플릿 다운로드 버튼 이벤트 리스너
    const downloadExcelTemplateBtn = document.getElementById('downloadExcelTemplateBtn');
    if (downloadExcelTemplateBtn) {
        downloadExcelTemplateBtn.addEventListener('click', downloadExcelTemplate);
    }
}

/**
 * @description 데이터 분석 페이지를 초기화합니다.
 */
export async function initializeAnalysisPage() {
    // 카드 접기/펴기 기능 초기화
    initCollapsibleFeatures();

    displayMinMaxDates('dashboardSummary', 'data-min-date', 'data-max-date');
    setDefaultDates(elements.startDate, elements.endDate);
    await initializeData(elements.jobIdSelect, elements.errorCodeSelect);
    initJobInfoPaging();
    initRawDataPaging();
    initializeEventListeners();
    fetchAndRenderAll();
}
