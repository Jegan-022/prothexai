export class PressureHeatmap {
    constructor(containerId) {
        this.containerId = containerId;
        this.margin = { top: 30, right: 30, bottom: 50, left: 30 };
    }

    render(data) {
        // Data input: { left: [values...], right: [values...] }
        // Default to array of 72 zeros if missing (12x6 grid)
        const leftData = data.left || Array(72).fill(10);
        const rightData = data.right || Array(72).fill(10);

        const container = d3.select(this.containerId);
        container.html("");

        const width = container.node().getBoundingClientRect().width;
        const height = 350;
        const gridCols = 6;
        const gridRows = 12;

        // Calculate cell size based on available width split in two
        const cellGap = 4;
        const panelWidth = (width - this.margin.left - this.margin.right - 40) / 2; // 40px gap between stumps
        const cellSize = Math.floor(panelWidth / gridCols);

        const svg = container.append("svg")
            .attr("width", width)
            .attr("height", height);

        // Color Scale
        const colorScale = d3.scaleLinear()
            .domain([0, 50, 100])
            .range(["#3B82F6", "#FACC15", "#EF4444"]);

        // Draw Panel Function
        const drawPanel = (stumpData, offsetX, label) => {
            const g = svg.append("g")
                .attr("transform", `translate(${offsetX},${this.margin.top})`);

            g.append("text")
                .attr("x", (gridCols * cellSize) / 2)
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .attr("fill", "#94A3B8")
                .text(label);

            g.selectAll("rect")
                .data(stumpData)
                .enter()
                .append("rect")
                .attr("x", (d, i) => (i % gridCols) * (cellSize + cellGap))
                .attr("y", (d, i) => Math.floor(i / gridCols) * (cellSize + cellGap))
                .attr("width", cellSize)
                .attr("height", cellSize)
                .attr("rx", 3)
                .attr("fill", "#1E293B") // Initial dark color
                .transition()
                .duration(800)
                .delay((d, i) => i * 10) // Staggered animation
                .attr("fill", d => colorScale(d));

            // Tooltip events (naive implementation attachment for brevity, usually do overlay)
            // Re-selecting to attach events after transition
            g.selectAll("rect").on("mouseover", function (event, d) {
                d3.select(this).attr("stroke", "#fff").attr("stroke-width", 2);
                // Tooltip logic here
            }).on("mouseout", function () {
                d3.select(this).attr("stroke", "none");
            });
        };

        const startX = this.margin.left;
        drawPanel(leftData, startX, "Left Stump");

        const rightX = startX + (gridCols * (cellSize + cellGap)) + 40;
        drawPanel(rightData, rightX, "Right Stump");

        // Legend
        this.addLegend(svg, width, height, colorScale);
    }

    addLegend(svg, width, height, colorScale) {
        const legendWidth = 200;
        const legendHeight = 10;

        const defs = svg.append("defs");
        const linearGradient = defs.append("linearGradient")
            .attr("id", "legend-gradient");

        linearGradient.append("stop").attr("offset", "0%").attr("stop-color", "#3B82F6");
        linearGradient.append("stop").attr("offset", "50%").attr("stop-color", "#FACC15");
        linearGradient.append("stop").attr("offset", "100%").attr("stop-color", "#EF4444");

        const legendG = svg.append("g")
            .attr("transform", `translate(${(width - legendWidth) / 2}, ${height - 30})`);

        legendG.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legend-gradient)")
            .attr("rx", 5);

        legendG.append("text").attr("x", 0).attr("y", 25).text("Min Pressure").attr("fill", "#64748B").attr("font-size", "10px");
        legendG.append("text").attr("x", legendWidth).attr("y", 25).attr("text-anchor", "end").text("Max Pressure").attr("fill", "#64748B").attr("font-size", "10px");
    }
}
