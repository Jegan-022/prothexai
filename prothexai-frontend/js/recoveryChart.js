export class RecoveryChart {
    constructor(containerId) {
        this.containerId = containerId;
        this.margin = { top: 20, right: 20, bottom: 30, left: 40 };
    }

    render(data) {
        const container = d3.select(this.containerId);
        container.html("");

        const width = container.node().getBoundingClientRect().width - this.margin.left - this.margin.right;
        const height = 250 - this.margin.top - this.margin.bottom;

        const svg = container.append("svg")
            .attr("width", width + this.margin.left + this.margin.right)
            .attr("height", height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        // Scales
        const x = d3.scaleTime()
            .domain(d3.extent(data, d => new Date(d.date)))
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, 100])
            .range([height, 0]);

        // Gradient
        const gradient = svg.append("defs")
            .append("linearGradient")
            .attr("id", "recovery-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#10B981")
            .attr("stop-opacity", 0.4);

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#10B981")
            .attr("stop-opacity", 0);

        // Area Generator
        const area = d3.area()
            .x(d => x(new Date(d.date)))
            .y0(height)
            .y1(d => y(d.health_score))
            .curve(d3.curveBasis);

        // Moving Average Calculation
        const movingAvgData = this.calculateMovingAverage(data, 7);
        const lineMA = d3.line()
            .x((d, i) => x(new Date(data[i + 6].date))) // Align with 7th day
            .y(d => y(d))
            .curve(d3.curveBasis);

        // Draw Area
        svg.append("path")
            .datum(data)
            .attr("fill", "url(#recovery-gradient)")
            .attr("d", area);

        // Draw MA Line
        svg.append("path")
            .datum(movingAvgData)
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", "4 4")
            .attr("opacity", 0.7)
            .attr("d", lineMA);

        // Axes
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(5))
            .attr("color", "#64748B");

        svg.append("g")
            .call(d3.axisLeft(y).ticks(5))
            .attr("color", "#64748B");

        // Tooltip
        this.addTooltip(svg, width, height, x, y, data, movingAvgData);
    }

    calculateMovingAverage(data, windowSize) {
        let ma = [];
        for (let i = 0; i < data.length - windowSize + 1; i++) {
            const windowSlice = data.slice(i, i + windowSize);
            const sum = windowSlice.reduce((acc, val) => acc + val.health_score, 0);
            ma.push(sum / windowSize);
        }
        return ma;
    }

    addTooltip(svg, width, height, x, y, data, maData) {
        const tooltip = d3.select("body").append("div")
            .attr("class", "d3-tooltip")
            .style("opacity", 0);

        const overlay = svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .style("fill", "none")
            .style("pointer-events", "all");

        overlay.on("mousemove", (event) => {
            const bisectDate = d3.bisector(d => new Date(d.date)).left;
            const x0 = x.invert(d3.pointer(event)[0]);
            const i = bisectDate(data, x0, 1);
            const d = data[i - 1];

            if (d) {
                // Find MA value if aligned
                // Simplified: tooltip just shows prompt requirements
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html(`
                    <strong>${d.date}</strong><br/>
                    Score: ${d.health_score.toFixed(1)}
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            }
        }).on("mouseout", () => {
            tooltip.transition().duration(500).style("opacity", 0);
        });
    }
}
