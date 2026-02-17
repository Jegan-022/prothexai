export class DualAxisCorrelationChart {
    constructor(containerId) {
        this.containerId = containerId;
        this.margin = { top: 40, right: 60, bottom: 40, left: 60 };
    }

    render(data) {
        const container = d3.select(this.containerId);
        container.html(""); // Clear previous

        if (!data || data.length === 0) {
            container.html('<p class="text-muted" style="text-align: center; padding: 3rem;">No correlation data available.</p>');
            return;
        }

        const width = container.node().getBoundingClientRect().width - this.margin.left - this.margin.right;
        const height = 300 - this.margin.top - this.margin.bottom;

        const svg = container.append("svg")
            .attr("width", width + this.margin.left + this.margin.right)
            .attr("height", height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        // SVG Filters for Glow Effect
        const defs = svg.append("defs");
        const filter = defs.append("filter")
            .attr("id", "glow");
        filter.append("feGaussianBlur")
            .attr("stdDeviation", "2.5")
            .attr("result", "coloredBlur");
        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "coloredBlur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");

        // Scales
        const x = d3.scaleTime()
            .domain(d3.extent(data, d => new Date(d.date)))
            .range([0, width]);

        const yLeft = d3.scaleLinear()
            .domain([0, 100])
            .nice()
            .range([height, 0]);

        const yRight = d3.scaleLinear()
            .domain([0, Math.max(2.0, d3.max(data, d => d.walking_speed_mps) * 1.1)])
            .nice()
            .range([height, 0]);

        // Axes
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b %d")).ticks(5))
            .attr("color", "#94A3B8")
            .style("font-size", "11px");

        svg.append("g")
            .call(d3.axisLeft(yLeft).ticks(5))
            .attr("color", "#0EA5E9")
            .style("font-size", "11px");

        svg.append("g")
            .attr("transform", `translate(${width},0)`)
            .call(d3.axisRight(yRight).ticks(5))
            .attr("color", "#10B981")
            .style("font-size", "11px");

        // Grid lines
        svg.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(yLeft).tickSize(-width).tickFormat("").ticks(5))
            .style("stroke", "#334155")
            .style("stroke-opacity", 0.15)
            .select(".domain").remove();

        // Line Generators
        const lineSymmetry = d3.line()
            .x(d => x(new Date(d.date)))
            .y(d => yLeft(d.gait_symmetry_index))
            .curve(d3.curveMonotoneX);

        const lineSpeed = d3.line()
            .x(d => x(new Date(d.date)))
            .y(d => yRight(d.walking_speed_mps))
            .curve(d3.curveMonotoneX);

        // Draw Lines with Glow
        const pathSym = svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "#0EA5E9")
            .attr("stroke-width", 3)
            .style("filter", "url(#glow)")
            .attr("d", lineSymmetry);

        const pathSpeed = svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "#10B981")
            .attr("stroke-width", 3)
            .style("filter", "url(#glow)")
            .attr("d", lineSpeed);

        // Animation
        this.animateLine(pathSym);
        this.animateLine(pathSpeed);

        // Data Dots
        svg.selectAll(".dot-sym")
            .data(data)
            .enter().append("circle")
            .attr("cx", d => x(new Date(d.date)))
            .attr("cy", d => yLeft(d.gait_symmetry_index))
            .attr("r", 4)
            .attr("fill", "#0EA5E9")
            .attr("stroke", "#0F172A")
            .attr("stroke-width", 2);

        svg.selectAll(".dot-speed")
            .data(data)
            .enter().append("circle")
            .attr("cx", d => x(new Date(d.date)))
            .attr("cy", d => yRight(d.walking_speed_mps))
            .attr("r", 4)
            .attr("fill", "#10B981")
            .attr("stroke", "#0F172A")
            .attr("stroke-width", 2);

        // Risk Dots (Overlays)
        svg.selectAll(".dot-risk")
            .data(data.filter(d => d.gait_symmetry_index < 75))
            .enter()
            .append("circle")
            .attr("cx", d => x(new Date(d.date)))
            .attr("cy", d => yLeft(d.gait_symmetry_index))
            .attr("r", 6)
            .attr("fill", "none")
            .attr("stroke", "#EF4444")
            .attr("stroke-width", 2);

        // Tooltip Overlay
        this.addTooltip(svg, width, height, x, yLeft, yRight, data);

        // Legend
        const legend = svg.append("g")
            .attr("transform", `translate(0, -25)`);

        legend.append("rect").attr("width", 12).attr("height", 3).attr("fill", "#0EA5E9");
        legend.append("text").attr("x", 16).attr("y", 6).text("Gait Symmetry (%)").attr("fill", "#94A3B8").style("font-size", "12px");

        legend.append("rect").attr("width", 12).attr("height", 3).attr("fill", "#10B981").attr("x", 130);
        legend.append("text").attr("x", 146).attr("y", 6).text("Walking Speed (m/s)").attr("fill", "#94A3B8").style("font-size", "12px");
    }

    animateLine(path) {
        const length = path.node().getTotalLength();
        path.attr("stroke-dasharray", length + " " + length)
            .attr("stroke-dashoffset", length)
            .transition()
            .duration(1500)
            .ease(d3.easeCubicOut)
            .attr("stroke-dashoffset", 0);
    }

    addTooltip(svg, width, height, x, yLeft, yRight, data) {
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
            const d = data[i - 1] || data[i]; // Fallback to avoid index error

            if (d) {
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html(`
                    <div style="font-weight:600; color:#F8FAFC; margin-bottom:4px;">${d.date}</div>
                    <div style="color:#0EA5E9">Symmetry: ${d.gait_symmetry_index.toFixed(1)}%</div>
                    <div style="color:#10B981">Speed: ${d.walking_speed_mps.toFixed(2)} m/s</div>
                    ${d.gait_symmetry_index < 75 ? "<div style='color:#EF4444; margin-top:2px;'>⚠️ Gait Risk Detected</div>" : ""}
                `)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 28) + "px");
            }
        }).on("mouseout", () => {
            tooltip.transition().duration(500).style("opacity", 0);
        });
    }
}
