

export function clearHeatmap(container) {
    container.innerHTML = '';
}

export function drawContinuousHeatmap(container, data, startDateStr, endDateStr, colorMin, colorMax) {
    container.innerHTML = '';
    if (container.clientWidth === 0) return;


    container.dataset.heatmapData = JSON.stringify(Array.from(data.entries()));
    container.dataset.startDate = startDateStr;
    container.dataset.endDate = endDateStr;


    const width = container.clientWidth;

    const weekLabelWidth = 25;
    const monthLabelHeight = 14;
    const yearLabelHeight = 20;
    const cellSize = 14;
    const cellMargin = 1;
    const height = (cellSize + cellMargin) * 7 + monthLabelHeight + yearLabelHeight;

    const startParts = startDateStr.split('-');
    const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    const endParts = endDateStr.split('-');
    const endDate = new Date(endParts[0], endParts[1] - 1, endParts[2]);
    
    const days = d3.timeDays(startDate, d3.timeDay.offset(endDate, 1));
    const weeks = d3.timeWeeks(d3.timeWeek.floor(startDate), d3.timeWeek.ceil(endDate));
    
    const svgWidth = weeks.length * (cellSize + cellMargin) + weekLabelWidth;

    const svg = d3.select(container)
        .style("overflow-x", "auto")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${weekLabelWidth}, ${monthLabelHeight + yearLabelHeight})`);

    const timeFormat = d3.timeFormat("%Y-%m-%d");


    const values = Array.from(data.values()).filter(v => v > 0);
    const maxCount = d3.max(values) || 1;

    const color = d3.scaleLinear()
        .domain([0, maxCount])
        .range([colorMin || "#9be9a8", colorMax || "#216e39"])
        .interpolate(d3.interpolateRgb);

    const weekOfYear = d3.timeFormat("%U");

    const rects = svg.selectAll(".day")
        .data(days)
        .enter().append("rect")
        .attr("class", "day")
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("rx", 3)
        .attr("ry", 3)
        .attr("x", d => {
            const startOfWeek = d3.timeWeek.floor(startDate);
            const weekIndex = d3.timeWeek.count(startOfWeek, d);
            return weekIndex * (cellSize + cellMargin);
        })
        .attr("y", d => d.getDay() * (cellSize + cellMargin))
        .style("fill", d => {
            const value = data.get(timeFormat(d));
            if (value === undefined || value === null || value <= 0) {
                return "#ebedf0";
            }
            return color(value);
        });

    rects.append("title")
        .text(d => {
            const value = data.get(timeFormat(d)) || 0;
            return `${timeFormat(d)}: ${value} 건`;
        });

    const monthData = d3.timeMonths(d3.timeMonth.floor(startDate), endDate);
    svg.selectAll(".month")
        .data(monthData)
        .enter().append("text")
        .attr("class", "month")
        .attr("x", d => {
            const startOfWeek = d3.timeWeek.floor(startDate);
            const firstDayOfMonth = d3.timeMonth.floor(d);
            const weekIndex = d3.timeWeek.count(startOfWeek, firstDayOfMonth);
            return weekIndex * (cellSize + cellMargin);
        })
        .attr("y", -5)
        .text(d3.timeFormat("%b"));

    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const yearData = [];
    for (let y = startYear; y <= endYear; y++) {
        yearData.push(new Date(y, 0, 1));
    }

    svg.selectAll(".year")
        .data(yearData)
        .enter().append("text")
        .attr("class", "year")
        .attr("x", d => {
            const startOfWeek = d3.timeWeek.floor(startDate);
            const firstDayOfYear = d3.timeYear.floor(d);
            const weekIndex = d3.timeWeek.count(startOfWeek, firstDayOfYear);
            return weekIndex * (cellSize + cellMargin);
        })
        .attr("y", -25)
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text(d3.timeFormat("%Y"));


    svg.selectAll(".year-separator")
        .data(yearData.slice(1))
        .enter().append("line")
        .attr("class", "year-separator")
        .attr("x1", d => {
            const startOfWeek = d3.timeWeek.floor(startDate);
            const firstDayOfYear = d3.timeYear.floor(d);
            const weekIndex = d3.timeWeek.count(startOfWeek, firstDayOfYear);
            return weekIndex * (cellSize + cellMargin) - cellMargin / 2;
        })
        .attr("x2", d => {
            const startOfWeek = d3.timeWeek.floor(startDate);
            const firstDayOfYear = d3.timeYear.floor(d);
            const weekIndex = d3.timeWeek.count(startOfWeek, firstDayOfYear);
            return weekIndex * (cellSize + cellMargin) - cellMargin / 2;
        })
        .attr("y1", -3)
        .attr("y2", height - monthLabelHeight - yearLabelHeight)
        .style("stroke", "#999")
        .style("stroke-width", 3)
        .style("stroke-dasharray", "2,2");

    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    svg.selectAll(".wday")
        .data(d3.range(7))
        .enter().append("text")
        .attr("class", "wday")
        .attr("x", -weekLabelWidth + 5)
        .attr("y", d => d * (cellSize + cellMargin) + cellSize / 1.5)
        .text(d => (d % 2 !== 0) ? weekDays[d] : '');


    container.scrollLeft = container.scrollWidth;
  

}

export function redrawAllHeatmaps() {
    const heatmapContainer = document.getElementById('heatmap-container');
    const cards = heatmapContainer.querySelectorAll('.jandi-card');
    cards.forEach(card => {
        const graphDiv = card.querySelector('.graph');
        if (graphDiv && graphDiv.dataset.heatmapData && graphDiv.dataset.startDate && graphDiv.dataset.endDate) {
            const contributions = new Map(JSON.parse(graphDiv.dataset.heatmapData));
            const startDate = graphDiv.dataset.startDate;
            const endDate = graphDiv.dataset.endDate;
            if (graphDiv.clientWidth > 0) {
                const adminSettings = window.adminSettingsMap || {};
                const setting = adminSettings[card.id.replace('jandi-card-', '')] || {};
                drawContinuousHeatmap(graphDiv, contributions, startDate, endDate, setting.jandi_color_min, setting.jandi_color_max);
            }
        }
    });
}

/**
 * Checks if a heatmap container inside a card is visible and empty, and if so, draws the heatmap.
 * This is used to lazily render heatmaps when a collapsed card is expanded.
 * @param {HTMLElement} card - The card element to check.
 */
export function drawHeatmapIfNeeded(card) {
    const graphDiv = card.querySelector('.graph');

    if (graphDiv && graphDiv.clientWidth > 0 && graphDiv.innerHTML.trim() === '') {

        if (graphDiv.dataset.heatmapData && graphDiv.dataset.startDate && graphDiv.dataset.endDate) {
            try {
                const contributions = new Map(JSON.parse(graphDiv.dataset.heatmapData));
                const startDate = graphDiv.dataset.startDate;
                const endDate = graphDiv.dataset.endDate;
                const adminSettings = window.adminSettingsMap || {};
                const setting = adminSettings[card.id.replace('jandi-card-', '')] || {};
                drawContinuousHeatmap(graphDiv, contributions, startDate, endDate, setting.jandi_color_min, setting.jandi_color_max);
            } catch (e) {

            }
        }
    }
}
