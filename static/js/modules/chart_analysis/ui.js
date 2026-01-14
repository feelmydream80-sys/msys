// @DOC_FILE: ui.js (chart_analysis)
// @DOC_DESC: 이 파일은 분석 페이지의 UI 렌더링, 초기화, 및 차트 생성을 담당합니다.
// Job ID 체크박스 생성, 날짜 선택기 초기화, 차트 렌더링 로직을 포함합니다.

import { allJobMstList, allMngrSettings } from './data.js';
import { loadAnalyticsPageData } from './events.js';

// @DOC: 차트 인스턴스를 저장하여 이전 차트를 파괴하고 새로 그릴 수 있도록 합니다.
export let successRateChart = null;
export let troublePieChart = null;

// @DOC: 관리자 설정에 색상이 지정되지 않았을 경우 사용할 기본 차트 색상 팔레트입니다.
const DEFAULT_CHART_COLORS = [
    'rgb(255, 99, 132)', 'rgb(54, 162, 235)', 'rgb(255, 206, 86)',
    'rgb(75, 192, 192)', 'rgb(153, 102, 255)', 'rgb(255, 159, 64)',
    'rgb(201, 203, 207)', 'rgb(23, 162, 184)', 'rgb(108, 117, 125)',
    'rgb(0, 123, 255)'
];

// @DOC: 장애 코드별로 고정된 색상을 매핑하여 차트의 일관성을 유지합니다.
const errorCodeColorMap = {
    'CD901': '#22c55e', // 정상(성공)
    'CD902': '#ef4444', // 실패
    'CD903': '#f59e42', // 미수집
    'CD904': '#22c55e', // 계측중
};

// @DOC: 장애 코드별로 고정된 이름을 매핑하여 차트 라벨에 사용합니다.
const errorCodeNameMap = {
    'CD901': '정상(성공)',
    'CD902': '실패',
    'CD903': '미수집',
    'CD904': '계측중',
};

/**
 * @DOC: Job ID 목록을 받아 동적으로 체크박스를 생성하고 컨테이너에 추가합니다.
 * @param {string} labelDisplayType - 'name' 또는 'code'
 */
export function renderJobCheckboxes(labelDisplayType = 'name', dataPermissions = []) {
    const jobCheckboxesContainer = document.getElementById('jobCheckboxes');
    if (!jobCheckboxesContainer) {
        console.error("Error: jobCheckboxes container not found.");
        return;
    }

    // 현재 체크된 Job ID들을 저장합니다.
    const currentlyCheckedIds = new Set(
        Array.from(jobCheckboxesContainer.querySelectorAll('.job-checkbox:checked')).map(cb => cb.value)
    );
    
    // 처음 렌더링될 때(체크박스가 하나도 없을 때)는 모든 항목을 선택 상태로 초기화합니다.
    const isFirstRender = jobCheckboxesContainer.querySelectorAll('.job-checkbox').length === 0;

    jobCheckboxesContainer.innerHTML = '';

    // 관리자 설정(allMngrSettings)이 비어있으면 체크박스가 렌더링되지 않는 문제를 해결하기 위해,
    // 모든 Job 마스터 목록(allJobMstList)을 기준으로 체크박스를 생성하도록 수정합니다.
    // 사용자의 데이터 접근 권한(dataPermissions)에 따라 Job 목록을 필터링합니다.
    // dataPermissions가 비어 있지 않은 경우에만 필터링을 적용합니다.
    // 1. Job ID 필터링 규칙 적용: 100의 배수 제외, 900-910 범위 제외
    const baseFilteredList = allJobMstList.filter(job => {
        // "CD101"과 같은 문자열에서 숫자 부분만 추출합니다.
        const numericString = job.job_id.replace(/[^0-9]/g, '');
        if (!numericString) {
            return false; // 숫자 부분이 없으면 제외
        }
        
        const jobIdNum = parseInt(numericString, 10);
        if (isNaN(jobIdNum)) {
            return false;
        }

        const isMultipleOf100 = jobIdNum > 0 && jobIdNum % 100 === 0;
        const isIn900Range = jobIdNum >= 900 && jobIdNum <= 910;

        // 두 조건에 해당하지 않는 경우에만 목록에 포함
        return !isMultipleOf100 && !isIn900Range;
    });

    // 2. 사용자 데이터 권한에 따라 추가 필터링을 적용합니다.
    const filteredJobList = dataPermissions && dataPermissions.length > 0
        ? baseFilteredList.filter(job => dataPermissions.includes(job.job_id))
        : baseFilteredList;

    const sortedJobList = [...filteredJobList].sort((a, b) => {
        const numA = parseInt(a.job_id.replace('CD', ''), 10);
        const numB = parseInt(b.job_id.replace('CD', ''), 10);
        return numA - numB;
    });

    sortedJobList.forEach(job => {
        const jobId = job.job_id;
        const jobName = job.cd_nm || jobId;
        const displayLabel = labelDisplayType === 'code' ? jobId : jobName;
        
        // 첫 렌더링 시에는 모두 체크, 그 외에는 이전 상태를 복원합니다.
        const isChecked = isFirstRender || currentlyCheckedIds.has(jobId);

        const label = document.createElement('label');
        label.className = 'job-checkbox-label';
        label.innerHTML = `
            <input type="checkbox" class="job-checkbox form-checkbox text-blue-600 mr-2" value="${jobId}" ${isChecked ? 'checked' : ''}>
            <span>${displayLabel}</span>
        `;
        jobCheckboxesContainer.appendChild(label);
    });

    jobCheckboxesContainer.querySelectorAll('.job-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', loadAnalyticsPageData);
    });
}

/**
 * @DOC: Luxon 라이브러리를 사용하여 시작일과 종료일 날짜 선택기를 초기화하고 이벤트 리스너를 설정합니다.
 */
export function initializeDatePickers() {
    const startDatePicker = document.getElementById('startDate');
    const endDatePicker = document.getElementById('endDate');

    const currentYear = luxon.DateTime.local().year;
    const defaultStartDate = luxon.DateTime.local().set({ year: currentYear, month: 1, day: 1 }).toISODate();
    const defaultEndDate = luxon.DateTime.local().toISODate();

    if (startDatePicker) startDatePicker.value = defaultStartDate;
    if (endDatePicker) endDatePicker.value = defaultEndDate;

    if (startDatePicker) startDatePicker.addEventListener('change', loadAnalyticsPageData);
    if (endDatePicker) endDatePicker.addEventListener('change', loadAnalyticsPageData);
}

/**
 * @DOC: 차트 타입(라인/바, 도넛/바)을 선택하는 라디오 버튼에 이벤트 리스너를 설정합니다.
 */
export function initializeChartTypeRadios() {
    document.querySelectorAll('input[name="successChartType"]').forEach(radio => {
        radio.addEventListener('change', loadAnalyticsPageData);
    });
    document.querySelectorAll('input[name="troubleChartType"]').forEach(radio => {
        radio.addEventListener('change', loadAnalyticsPageData);
    });
}

/**
 * @DOC: 라벨 표시 유형(코드/명칭)을 선택하는 라디오 버튼에 이벤트 리스너를 설정합니다.
 */
export function initializeLabelDisplayRadios(dataPermissions = []) {
    document.querySelectorAll('input[name="labelDisplayType"]').forEach(radio => {
        radio.addEventListener('change', (event) => {
            const displayType = event.target.value;
            // 사용자의 선택을 localStorage에 저장합니다.
            localStorage.setItem('chartLabelDisplayType', displayType);
            renderJobCheckboxes(displayType, dataPermissions); // dataPermissions를 전달하여 체크박스를 다시 렌더링
            loadAnalyticsPageData(); // 차트 데이터 로드
        });
    });
}

/**
 * @DOC: Chart.js를 사용하여 기간별 수집 성공률 차트를 렌더링합니다.
 * @param {Array<Object>} data - API로부터 받은 원본 차트 데이터.
 * @param {string} chartType - 'line' 또는 'bar'.
 * @param {Object} mngrSettings - 관리자 설정.
 * @param {string} labelDisplayType - 'name' 또는 'code'.
 */
export function renderSuccessRateChart(data, chartType, mngrSettings, labelDisplayType = 'name') {
    const ctx = document.getElementById('successRateChart')?.getContext('2d');
    if (!ctx) {
        console.error("Success Rate Chart canvas element not found.");
        return;
    }

    if (successRateChart) {
        successRateChart.destroy();
    }

    const groupedData = data.reduce((acc, item) => {
        const jobId = String(item.job_id);
        if (!acc[jobId]) {
            acc[jobId] = [];
        }
        acc[jobId].push(item);
        return acc;
    }, {});

    const allDates = [...new Set(data.map(item => luxon.DateTime.fromHTTP(item.date).toISODate()))].sort();

    const datasets = Object.keys(groupedData).map((jobIdKey, index) => {
        const actualJobId = (jobIdKey === 'undefined' || jobIdKey === 'null' || !jobIdKey) ? 'UNKNOWN_JOB' : jobIdKey;
        const jobData = groupedData[jobIdKey].sort((a, b) => luxon.DateTime.fromHTTP(a.date).toISODate().localeCompare(luxon.DateTime.fromHTTP(b.date).toISODate()));
        
        const dataPoints = allDates.map(date => {
            const item = jobData.find(d => luxon.DateTime.fromHTTP(d.date).toISODate() === date);
            return item ? parseFloat(item.success_rate) : (chartType === 'line' ? null : 0);
        });

        const mngrSetting = Array.isArray(mngrSettings) ? mngrSettings.find(setting => setting.cd === actualJobId) : null;
        const dynamicColor = mngrSetting?.chrt_colr || DEFAULT_CHART_COLORS[index % DEFAULT_CHART_COLORS.length];
        
        const jobMst = allJobMstList.find(mst => mst.job_id === actualJobId);
        const jobName = jobMst?.cd_nm || actualJobId;
        const displayLabel = labelDisplayType === 'code' ? actualJobId : jobName;

        return {
            label: displayLabel,
            data: dataPoints,
            borderColor: dynamicColor,
            backgroundColor: dynamicColor.replace('rgb', 'rgba').replace(')', ', 0.5)'),
            tension: 0.1,
            fill: false,
            spanGaps: chartType === 'line'
            // datalabels: { display: false } // @deprecated: 개별 데이터셋 설정 대신 차트 전체 옵션으로 제어
        };
    });

    const allDataPoints = datasets.flatMap(ds => ds.data).filter(p => p !== null && p !== undefined);
    const yAxisOptions = {
        max: 100,
        title: { display: true, text: '성공률 (%)' }
    };

    if (allDataPoints.length > 0) {
        const minValue = Math.min(...allDataPoints);
        const maxValue = Math.max(...allDataPoints);
        const dataRange = maxValue - minValue;

        // 데이터의 변동폭이 20% 미만이고, 최소값이 70% 이상일 때 Y축 범위를 조정합니다.
        // 이는 데이터가 높은 구간에 밀집되어 있을 때 가독성을 높이기 위함입니다.
        if (dataRange < 20 && minValue > 70) {
            // Y축의 최소값을 데이터의 최소값보다 10% 정도 낮게 설정하되, 5의 배수로 맞춥니다.
            // 예: minValue가 98이면 suggestedMin은 85가 됩니다.
            // 예: minValue가 81이면 suggestedMin은 70이 됩니다.
            const suggestedMin = Math.floor((minValue - 10) / 5) * 5;
            yAxisOptions.suggestedMin = Math.max(0, suggestedMin); // 최소값은 0 이하로 내려가지 않도록 보정
        } else {
            // 그 외의 경우에는 0부터 시작하여 전체적인 추이를 보여줍니다.
            yAxisOptions.beginAtZero = true;
        }
    } else {
        // 데이터가 없는 경우, 0부터 시작합니다.
        yAxisOptions.beginAtZero = true;
    }

    successRateChart = new Chart(ctx, {
        type: chartType,
        data: { labels: allDates, datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: yAxisOptions,
                x: { title: { display: true, text: '날짜' }, type: 'category', ticks: { autoSkip: true, maxTicksLimit: 20 } }
            },
            plugins: {
                tooltip: {
                    enabled: true, mode: 'nearest', intersect: false,
                    callbacks: {
                        label: context => `${context.dataset.label}: ${context.raw !== null ? parseFloat(context.raw).toFixed(2) : 'N/A'}`
                    }
                },
                datalabels: {
                    display: false // 완전 비활성화 - 차트 위 데이터 값 표시하지 않음
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        // 범례 라벨을 Job 이름만 표시 (성공률 값 제거)
                        generateLabels: (chart) => {
                            return chart.data.datasets.map((dataset, i) => ({
                                text: dataset.label,
                                fillStyle: dataset.borderColor,
                                strokeStyle: dataset.borderColor,
                                lineWidth: 2,
                                hidden: !chart.isDatasetVisible(i),
                                index: i
                            }));
                        }
                    }
                },
                title: { display: true, text: '기간별 Job ID별 수집 성공률 추이' }
            },
            elements: { point: { radius: 0, hitRadius: 0 } },
            animation: {
                duration: 500, // 빠른 페이드
                easing: 'linear', // 선형 페이드
                delay: 0, // 동시 시작
                animateScale: false,
                animateRotate: false,
                mode: 'default'
            }
        }
    });

    // SPA 렌더링 타이밍 이슈 해결을 위해 ResizeObserver 사용
    const chartContainer = ctx.canvas.parentElement;
    chartContainer.style.minHeight = '300px'; // JS로 최소 높이 강제
    const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
            // 컨테이너가 실제로 렌더링되어 높이를 가졌을 때 차트 크기 조정
            if (entry.contentRect.height > 150) { // 150px 이상일 때만 리사이즈
                successRateChart.resize();
            }
        }
    });
    observer.observe(chartContainer);
}

/**
 * @DOC: Chart.js를 사용하여 장애 코드별 비율 차트를 렌더링합니다.
 * @param {Array<Object>} troubleCodeData - API로부터 받은 장애 코드 데이터.
 * @param {string} chartType - 'doughnut' 또는 'bar'.
 * @param {string} startDate - 조회 시작일.
 * @param {string} endDate - 조회 종료일.
 * @param {Object} mngrSettings - 관리자 설정.
 * @param {string} labelDisplayType - 'name' 또는 'code'.
 */
export function renderTroublePieChart(troubleCodeData, chartType, startDate, endDate, mngrSettings, labelDisplayType = 'name') {
    const ctx = document.getElementById('troublePieChart').getContext('2d');
    const chartContainer = ctx.canvas.parentElement;

    if (!troubleCodeData || troubleCodeData.length === 0) {
        ctx.canvas.style.display = 'none';
        let noDataMsg = document.getElementById('troublePieNoDataMsg');
        if (!noDataMsg) {
            noDataMsg = document.createElement('div');
            noDataMsg.id = 'troublePieNoDataMsg';
            noDataMsg.className = 'text-center text-gray-500 my-8';
            chartContainer.appendChild(noDataMsg);
        }
        noDataMsg.textContent = `장애 코드 없음 (조회 기간: ${startDate} ~ ${endDate})`;
        return;
    }
    
    ctx.canvas.style.display = '';
    const noDataMsg = document.getElementById('troublePieNoDataMsg');
    if (noDataMsg) noDataMsg.remove();

    const labels = troubleCodeData.map(item => {
        const errorCode = item.error_code || '알 수 없음';
        const errorName = item.error_name || errorCodeNameMap[errorCode] || errorCode;
        return labelDisplayType === 'code' ? errorCode : errorName;
    });
    const dataValues = troubleCodeData.map(item => item.count || 0);
    
    const getColorForErrorCode = (errorCode) => {
        if (!mngrSettings || mngrSettings.length === 0) {
            return errorCodeColorMap[errorCode] || '#a3a3a3';
        }
        const setting = mngrSettings[0]; // Assuming global color settings from the first entry
        switch (errorCode) {
            case 'CD901': return setting.cnn_sucs_wrd_colr;
            case 'CD902': return setting.cnn_failr_wrd_colr;
            case 'CD903': return setting.cnn_warn_wrd_colr;
            case 'CD904': return '#84cc16'; // @FIX: CD904(계측중)를 연두색으로 변경
            default: return '#a3a3a3';
        }
    };

    const backgroundColors = troubleCodeData.map(item => getColorForErrorCode(item.error_code));

    if (troublePieChart) {
        troublePieChart.destroy();
    }

    troublePieChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{ data: dataValues, backgroundColor: backgroundColors }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: context => {
                            return `${context.label}: ${context.raw}건`;
                        }
                    }
                },
                legend: { position: 'top' },
                title: { display: true, text: '장애 코드별 비율' },
                datalabels: {
                    color: '#fff',
                    formatter: (value, ctx) => {
                        const sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                        if (sum === 0) return '0%';
                        const percentage = (value * 100 / sum).toFixed(1) + "%";
                        return percentage;
                    },
                    font: {
                        size: 18,
                        weight: 'bold',
                    }
                }
            },
            animation: {
                duration: 500, // 페이드 효과
                easing: 'linear'
            }
        }
    });

    // SPA 렌더링 타이밍 이슈 해결을 위해 ResizeObserver 사용
    const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
            if (entry.contentRect.height > 150) { // 150px 이상일 때만 리사이즈
                troublePieChart.resize();
            }
        }
    });
    chartContainer.style.minHeight = '300px'; // JS로 최소 높이 강제
    observer.observe(chartContainer);
}
