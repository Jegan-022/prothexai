// gauge.js
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

export function drawGauge(value, elementId) {
    const width = 300;
    const height = 200; // Half circle
    const radius = Math.min(width, height) - 20;

    // Remove old gauge if exists
    d3.select(elementId).selectAll("*").remove();

    const svg = d3.select(elementId)
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .append("g")
        .attr("transform", `translate(${width / 2},${height - 10})`);

    // Scale
    const scale = d3.scaleLinear()
        .domain([0, 100])
        .range([-Math.PI / 2, Math.PI / 2]);

    // Arc Generator
    const arc = d3.arc()
        .innerRadius(radius - 20)
        .outerRadius(radius)
        .startAngle(-Math.PI / 2);

    // Background Arc (Gray)
    svg.append("path")
        .datum({ endAngle: Math.PI / 2 })
        .style("fill", "#223D49")
        .attr("d", arc);

    // Foreground Arc (Animated)
    // Determine Color
    let color = "#10B981"; // Green
    if (value < 60) color = "#EF4444";
    else if (value < 80) color = "#EAB308";

    const foreground = svg.append("path")
        .datum({ endAngle: -Math.PI / 2 })
        .style("fill", color)
        .attr("d", arc);

    // Animation
    foreground.transition()
        .duration(1500)
        .attrTween("d", function (d) {
            const interpolate = d3.interpolate(d.endAngle, scale(value));
            return function (t) {
                d.endAngle = interpolate(t);
                return arc(d);
            };
        });

    // Text Value
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "-1em")
        .style("fill", "white")
        .style("font-size", "3rem")
        .style("font-weight", "bold")
        .text(0)
        .transition()
        .duration(1500)
        .tween("text", function () {
            const i = d3.interpolate(0, value);
            return function (t) {
                this.textContent = Math.round(i(t));
            };
        });
}
