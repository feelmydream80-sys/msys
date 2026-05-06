



import { allJobMstList, allMngrSettings } from './data.js';
import { loadAnalyticsPageData } from './events.js';


export let successRateChart = null;
export let troublePieChart = null;


const DEFAULT_CHART_COLORS = [
    'rgb(255, 99, 132)', 'rgb(54, 162, 235)', 'rgb(255, 206, 86)',
    'rgb(75, 192, 192)', 'rgb(153, 102, 255)', 'rgb(255, 159, 64)',
    'rgb(201, 203, 207)', 'rgb(23, 162, 184)', 'rgb(108, 117, 125)',
    'rgb(0, 123, 255)'
];



export function renderJobCheckboxes(labelDisplayType = 'name', dataPermissions = []) {
    const jobCheckboxesContainer = document.getElementById('jobCheckboxes');
    if (!jobCheckboxesContainer) {
        
        return;
    }


    const currentlyCheckedIds = new Set(
        Array.from(jobCheckboxesContainer.querySelectorAll('.job-checkbox:checked')).map(cb => cb.value)
    );
    

    const isFirstRender = jobCheckboxesContainer.querySelectorAll('.job-checkbox').length === 0;

    jobCheckboxesContainer.innerHTML = '';






    const baseFilteredList = allJobMstList.filter(job => {

        const numericString = job.job_id.replace(/[^0-9]/g, '');
        if (!numericString) {
            return false;
        }
        
        const jobIdNum = parseInt(numericString, 10);
        if (isNaN(jobIdNum)) {
            return false;
        }

        const isMultipleOf100 = jobIdNum > 0 && jobIdNum % 100 === 0;
        const isIn900Range = jobIdNum >= 900 && jobIdNum <= 910;


        return !isMultipleOf100 && !isIn900Range;
    });


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


export function initializeChartTypeRadios() {
    document.querySelectorAll('input[name="successChartType"]').forEach(radio => {
        radio.addEventListener('change', loadAnalyticsPageData);
    });
    document.querySelectorAll('input[name="troubleChartType"]').forEach(radio => {
        radio.addEventListener('change', loadAnalyticsPageData);
    });
}


export function initializeLabelDisplayRadios(dataPermissions = []) {
    document.querySelectorAll('input[name="labelDisplayType"]').forEach(radio => {
        radio.addEventListener('change', (event) => {
            const displayType = event.target.value;

            localStorage.setItem('chartLabelDisplayType', displayType);
            renderJobCheckboxes(displayType, dataPermissions);
            loadAnalyticsPageData();
        });
    });
}


export function renderSuccessRateChart(data, chartType, mngrSettings, labelDisplayType = 'name') {
    const ctx = document.getElementById('successRateChart')?.getContext('2d');
    if (!ctx) {
        
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



        if (dataRange < 20 && minValue > 70) {



            const suggestedMin = Math.floor((minValue - 10) / 5) * 5;
            yAxisOptions.suggestedMin = Math.max(0, suggestedMin);
        } else {

            yAxisOptions.beginAtZero = true;
        }
    } else {

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
                    display: false
                },
                legend: {
                    display: false
                },
                title: { display: true, text: '기간별 Job ID별 수집 성공률 추이' }
            },
            elements: { point: { radius: 0, hitRadius: 0 } },
            animation: {
                duration: 500,
                easing: 'linear',
                delay: 0,
                animateScale: false,
                animateRotate: false,
                mode: 'default'
            }
        }
    });


    const chartContainer = ctx.canvas.parentElement;
    chartContainer.style.minHeight = '300px';
    const observer = new ResizeObserver(entries => {
        for (const entry of entries) {

            if (entry.contentRect.height > 150) {
                successRateChart.resize();
            }
        }
    });
    observer.observe(chartContainer);

    const legendContainer = document.getElementById('successRateLegend');
    if (legendContainer) {
        legendContainer.innerHTML = '';
        const datasets = successRateChart.data.datasets;
        datasets.forEach((dataset, i) => {
            const item = document.createElement('span');
            item.style.cssText = 'display:inline-flex;align-items:center;cursor:pointer;font-size:12px;gap:4px;padding:2px 0;';
            const colorDot = document.createElement('span');
            colorDot.style.cssText = 'display:inline-block;width:12px;height:12px;border-radius:50%;background:' + dataset.borderColor + ';flex-shrink:0;';
            const label = document.createElement('span');
            label.style.cssText = 'color:#555;white-space:nowrap;';
            label.textContent = dataset.label;
            item.appendChild(colorDot);
            item.appendChild(label);
            item.addEventListener('click', () => {
                const meta = successRateChart.getDatasetMeta(i);
                meta.hidden = !meta.hidden;
                successRateChart.update();
                item.style.opacity = meta.hidden ? '0.4' : '1';
            });
            legendContainer.appendChild(item);
        });
    }
}


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


    const labels = troubleCodeData.map((item) => {
        const errorCode = item.error_code || '';
        const errorName = item.error_name || '';
        
        if (labelDisplayType === 'code') {
            return errorCode;
        } else {

            if (errorCode && errorName && errorName !== errorCode) {
                return `${errorCode} (${errorName})`;
            }
            return errorName || errorCode;
        }
    });
    const dataValues = troubleCodeData.map(item => item.count || 0);
    

    const backgroundColors = troubleCodeData.map(item => {

        return item.bg_color || '#a3a3a3';
    });
    const txtColors = troubleCodeData.map(item => item.txt_color || '#374151');

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

                            const label = context.label || context.chart.data.labels[context.dataIndex] || '알 수 없음';
                            return `${label}: ${context.raw}건`;
                        }
                    }
                },
                legend: {
                    position: 'top',
                    labels: {
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const ds = data.datasets[0];
                                    return {
                                        text: label || '알 수 없음',
                                        fillStyle: typeof ds.backgroundColor[i] !== 'undefined' ? ds.backgroundColor[i] : '#a3a3a3',
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                title: { display: true, text: '장애 코드별 비율' },
                datalabels: {
                    color: (context) => txtColors[context.dataIndex] || '#fff',
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
            scales: chartType === 'bar' ? {
                x: {
                    ticks: {
                        callback: function(value, index) {

                            const label = this.getLabelForValue(value);
                            return label || labels[index] || '알 수 없음';
                        }
                    }
                },
                y: {
                    beginAtZero: true
                }
            } : {},
            animation: {
                duration: 500,
                easing: 'linear'
            }
        }
    });


    const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
            if (entry.contentRect.height > 150) {
                troublePieChart.resize();
            }
        }
    });
    chartContainer.style.minHeight = '300px';
    observer.observe(chartContainer);
}
