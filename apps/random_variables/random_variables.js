// random_variable.js

import { select, scaleLinear, axisBottom, axisLeft } from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function initRandomVariableApp() {
  const width = 600;
  const height = 300;

  const svg = select("#rvDist")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#ffffff")
    .style("border", "1px solid #ccc");

  const xScale = scaleLinear().domain([0, 10]).range([50, width - 50]);
  const yScale = scaleLinear().domain([0, 1]).range([height - 50, 50]);

  const xAxis = axisBottom(xScale);
  const yAxis = axisLeft(yScale);

  svg.append("g")
    .attr("transform", `translate(0, ${height - 50})`)
    .call(xAxis);

  svg.append("g")
    .attr("transform", `translate(50, 0)`)
    .call(yAxis);

  const barGroup = svg.append("g").attr("id", "bars");

  function drawBars(data) {
    const bars = barGroup.selectAll("rect").data(data);

    bars.enter()
      .append("rect")
      .merge(bars)
      .attr("x", (d, i) => xScale(i))
      .attr("y", d => yScale(d))
      .attr("width", 30)
      .attr("height", d => height - 50 - yScale(d))
      .attr("fill", "steelblue");

    bars.exit().remove();
  }

  const randomData = () => Array.from({ length: 10 }, () => Math.random());
  drawBars(randomData());

  document.getElementById("startRV").onclick = () => drawBars(randomData());
  document.getElementById("resetRV").onclick = () => drawBars(Array(10).fill(0));
}