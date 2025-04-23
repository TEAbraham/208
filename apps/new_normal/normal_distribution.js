document.addEventListener("DOMContentLoaded", function () {
    const width = 800, height = 400, margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height);
  
    const plotArea = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
  
    const x = d3.scaleLinear().domain([-4, 4]).range([0, innerWidth]);
    const y = d3.scaleLinear().domain([0, 0.45]).range([innerHeight, 0]);
  
    plotArea.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x));
  
    plotArea.append("g")
      .call(d3.axisLeft(y));
  
    const line = d3.line()
      .x(d => x(d.x))
      .y(d => y(d.y));

    function drawNormalCurve(mean, sd) {
      const data = d3.range(-4, 4.01, 0.01).map(x => ({
        x: x,
        y: jStat.normal.pdf(x * sd + mean, mean, sd)
      }));

      plotArea.selectAll(".dist-line").remove();
      plotArea.append("path")
        .datum(data)
        .attr("class", "dist-line")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);

      // Shade areas and update ranges
      drawShadedIntervals(mean, sd);
    }

    function drawShadedIntervals(mean, sd) {
      plotArea.selectAll(".shade").remove();
      const intervals = [1, 2, 3].reverse();
      const colors = ["#cce5ff", "#99ccff", "#66b2ff"];
      intervals.forEach((k, i) => {
        const start = mean - k * sd;
        const end = mean + k * sd;
        const shadedData = d3.range(start, end, (end - start) / 100).map(x => ({
          x: x,
          y: jStat.normal.pdf(x, mean, sd)
        }));

        plotArea.append("path")
          .datum(shadedData)
          .attr("class", "shade")
          .attr("fill", colors[i])
          .attr("stroke", "none")
          .attr("d", d3.area()
            .x(d => x(d.x))
            .y0(innerHeight)
            .y1(d => y(d.y))
          );

        // Update text in table
        const selector = ["range-68", "range-95", "range-997"].reverse()[i];
        document.getElementById(selector).textContent = `${start.toFixed(2)} to ${end.toFixed(2)}`;
      });
    }

    // Hook up controls
    function update() {
      const mean = parseFloat(document.getElementById("mean").value);
      const sd = parseFloat(document.getElementById("sd").value);
      drawNormalCurve(mean, sd);
    }

    $("#mean, #sd").on("input", update);

    update();
  });
