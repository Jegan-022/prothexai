// charts.js
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

export function drawTrendChart(data, elementId) {
    // data is array: [{date: 'Mon', symmetry: 0.95}, ...]

    // Clear
    d3.select(elementId).selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = document.getElementById(elementId.replace('#', '')).clientWidth - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const svg = d3.select(elementId)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X Scale
    const x = d3.scalePoint()
        .domain(data.map(d => d.date)) // e.g. "Mon"
        .range([0, width]);

    // Y Scale (Symmetry 0 to 1.2 or auto)
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.symmetry) || 1.0])
        .range([height, 0]);

    // Axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .attr("color", "#94A3B8");

    svg.append("g")
        .call(d3.axisLeft(y).ticks(5))
        .attr("color", "#94A3B8");

    // Line
    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.symmetry))
        .curve(d3.curveMonotoneX);

    // Add path
    const path = svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#0DA2E7")
        .attr("stroke-width", 3)
        .attr("d", line);

    // Animate Line
    const totalLength = path.node().getTotalLength();
    path
        .attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

    // Points
    svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d.date))
        .attr("cy", d => y(d.symmetry))
        .attr("r", 4)
        .attr("fill", "#0DA2E7");
}
