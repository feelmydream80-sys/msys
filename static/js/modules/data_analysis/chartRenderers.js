



let successRateChartInstance;
let troublePieChartInstance;


export function createOrUpdateChart(chartId, type, data, options, existingChart) {
    const ctx = document.getElementById(chartId);
    if (!ctx) {

        return null;
    }

    if (existingChart) {
        existingChart.data = data;
        existingChart.options = options;
        existingChart.update();
        return existingChart;
    } else {
        const newChart = new Chart(ctx, {
            type: type,
            data: data,
            options: options

        });
        return newChart;
    }
}


export function renderSuccessRateChart(data, allAdminSettings, chartType) {

    const labels = [...new Set(data.map(item => item.base_date))].sort();

    const datasets = Object.values(allAdminSettings)
        .filter(setting => setting.display_yn)
        .map(setting => {
            const jobData = data.filter(item => item.job_id === setting.cd);
            const successRates = labels.map(date => {
                const record = jobData.find(item => item.base_date === date);
                return record ? (record.success_rate * 100).toFixed(2) : null;
            });

            return {
                label: setting.cd_nm || setting.cd,
                borderColor: setting.chart_color || '#007bff',
                backgroundColor: setting.chart_color ? `${setting.chart_color}80` : 'rgba(0, 123, 255, 0.5)',
                data: successRates,
                tension: 0.3,
                fill: false,
                hidden: false,
            };
        });

    const chartData = {
        labels: labels,
        datasets: datasets
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: '기간별 수집 성공률 추이',
                font: { size: 18, weight: 'bold' },
                color: '#333'
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += context.parsed.y;
                        }
                        return label;
                    }
                }
            },
            datalabels: {
                display: false
            },
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    font: { size: 12 },
                    color: '#555',
                    boxWidth: 20,
                    padding: 15
                }
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'day',
                    tooltipFormat: 'yyyy-MM-dd',
                    displayFormats: {
                        day: 'MM-dd'
                    }
                },
                title: {
                    display: true,
                    text: '날짜',
                    color: '#555'
                },
                grid: {
                    display: false
                }
            },
            y: {
                title: {
                    display: true,
                    text: '성공률 (%)',
                    color: '#555'
                },
                min: 0,
                max: 100,
                ticks: {

                },
                grid: {
                    color: '#e0e0e0'
                }
            }
        },
        animation: {
    duration: 800,
    easing: 'linear'
},
    };

    successRateChartInstance = createOrUpdateChart('successRateChart', chartType, chartData, chartOptions, successRateChartInstance);
}


export function renderTroubleChart(data, chartType) {

    let chartData;
    let chartOptions;

    if (chartType === 'doughnut') {
        const statusCounts = {};
        data.forEach(item => {
            statusCounts[item.status_name] = (statusCounts[item.status_name] || 0) + item.count;
        });

        const labels = Object.keys(statusCounts);
        const counts = Object.values(statusCounts);

        const backgroundColors = labels.map(label => {
            switch (label) {
                case '장애': return '#dc3545';
                case '경고': return '#ffc107';
                case '주의': return '#ffc107';
                case '정상': return '#28a745';
                case '미수집': return '#6c757d';
                case '확인필요': return '#343a40';
                default: return '#cccccc';
            }
        });

        chartData = {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: backgroundColors,
                hoverOffset: 10,
                borderWidth: 1,
                borderColor: '#fff'
            }]
        };

        chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '장애 코드별 비율',
                    font: { size: 18, weight: 'bold' },
                    color: '#333'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += `${context.parsed} 건`;
                            }
                            return label;
                        }
                    }
                },
                datalabels: {
                    display: false
                }
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        font: { size: 12 },
                        color: '#555',
                        boxWidth: 20,
                        padding: 15
                    }
                }
            },
            animation: {
    duration: 800,
    easing: 'linear'
},
        };
    } else if (chartType === 'bar') {
        const hourlyData = {};
        data.forEach(item => {
            if (!hourlyData[item.hour]) {
                hourlyData[item.hour] = {};
            }
            hourlyData[item.hour][item.status] = item.count;
        });

        const hours = Array.from({ length: 24 }, (_, i) => i);
        const statuses = [...new Set(data.map(item => item.status))].sort();

        const backgroundColorsMap = {
            'CD902': '#dc3545',
            'CD903': '#ffc107',
            'CD901': '#28a745',
            'CD904': '#17a2b8',
            'CD905': '#343a40',

        };

        const datasets = statuses.map(status => {
            return {
                label: status,
                data: hours.map(hour => (hourlyData[hour] && hourlyData[hour][status]) ? hourlyData[hour][status] : 0),
                backgroundColor: backgroundColorsMap[status] || '#cccccc',
                borderColor: backgroundColorsMap[status] || '#cccccc',
                borderWidth: 1
            };
        });

        chartData = {
            labels: hours.map(h => `${h}시`),
            datasets: datasets
        };

        chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: '시간대별 장애 발생 현황',
                    font: { size: 18, weight: 'bold' },
                    color: '#333'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += `${context.parsed} 건`;
                            }
                            return label;
                        }
                    }
                },
                datalabels: {
                    display: false,
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        font: { size: 12 },
                        color: '#555',
                        boxWidth: 20,
                        padding: 15
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '시간',
                        color: '#555'
                    },
                    grid: {
                        display: false
                    },
                    stacked: true
                },
                y: {
                    title: {
                        display: true,
                        text: '발생 건수',
                        color: '#555'
                    },
                    beginAtZero: true,
                    grid: {
                        color: '#e0e0e0'
                    },
                    stacked: true
                }
            },
            animation: {
    duration: 800,
    easing: 'linear'
},
        };
    }

    troublePieChartInstance = createOrUpdateChart('troublePieChart', chartType, chartData, chartOptions, troublePieChartInstance);
}
