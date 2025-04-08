// random_variable.js
export function initRandomVariableA() {
  const width = 600;
  const height = 300;

  const svg = d3.select("#rvDistA")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#ffffff")
    .style("border", "1px solid #ccc");

  const xScale = d3.scaleLinear().domain([0, 10]).range([50, width - 50]);
  const yScale = d3.scaleLinear().domain([0, 1]).range([height - 50, 50]);

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  svg.append("g")
    .attr("transform", `translate(0, ${height - 50})`)
    .call(xAxis);

  svg.append("g")
    .attr("transform", `translate(50, 0)`)
    .call(yAxis);

  const barGroup = svg.append("g").attr("id", "bars");

  const meanLine = svg.append("line")
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .style("display", "none");

  const stdLineLeft = svg.append("line")
    .attr("stroke", "black")
    .attr("stroke-dasharray", "5,5")
    .style("display", "none");

  const stdLineRight = svg.append("line")
    .attr("stroke", "black")
    .attr("stroke-dasharray", "5,5")
    .style("display", "none");

  const statsDiv = d3.select("#rvDistA")
    .append("div")
    .attr("class", "rv-stats")
    .style("margin-top", "10px");

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

    const mean = d3.mean(data) * 10;
    const std = d3.deviation(data) * 10;

    meanLine
      .attr("x1", xScale(mean))
      .attr("x2", xScale(mean))
      .attr("y1", 50)
      .attr("y2", height - 50)
      .style("display", "inline");

    stdLineLeft
      .attr("x1", xScale((mean - std)))
      .attr("x2", xScale((mean - std)))
      .attr("y1", 50)
      .attr("y2", height - 50)
      .style("display", "inline");

    stdLineRight
      .attr("x1", xScale((mean + std)))
      .attr("x2", xScale((mean + std)))
      .attr("y1", 50)
      .attr("y2", height - 50)
      .style("display", "inline");

    statsDiv.html(`Mean: ${mean.toFixed(3)} &nbsp;&nbsp; SD: ${std.toFixed(3)}`);
  }

  const randomData = () => Array.from({ length: 10 }, () => Math.random());
  drawBars(randomData());

  document.getElementById("startRVA").onclick = () => drawBars(randomData());
  document.getElementById("resetRVA").onclick = () => drawBars(Array(10).fill(0));
}

export function initRandomVariableB() {
  const width = 600;
  const height = 300;

  const svg = d3.select("#rvDistB")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#ffffff")
    .style("border", "1px solid #ccc");

  const xScale = d3.scaleLinear().domain([0, 10]).range([50, width - 50]);
  const yScale = d3.scaleLinear().domain([0, 1]).range([height - 50, 50]);

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  svg.append("g")
    .attr("transform", `translate(0, ${height - 50})`)
    .call(xAxis);

  svg.append("g")
    .attr("transform", `translate(50, 0)`)
    .call(yAxis);

  const barGroup = svg.append("g").attr("id", "bars");

  const meanLine = svg.append("line")
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .style("display", "none");

  const stdLineLeft = svg.append("line")
    .attr("stroke", "black")
    .attr("stroke-dasharray", "5,5")
    .style("display", "none");

  const stdLineRight = svg.append("line")
    .attr("stroke", "black")
    .attr("stroke-dasharray", "5,5")
    .style("display", "none");

  const statsDiv = d3.select("#rvDistB")
    .append("div")
    .attr("class", "rv-stats")
    .style("margin-top", "10px");

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

    const mean = d3.mean(data) * 10;
    const std = d3.deviation(data) * 10;

    meanLine
      .attr("x1", xScale(mean))
      .attr("x2", xScale(mean))
      .attr("y1", 50)
      .attr("y2", height - 50)
      .style("display", "inline");

    stdLineLeft
      .attr("x1", xScale((mean - std)))
      .attr("x2", xScale((mean - std)))
      .attr("y1", 50)
      .attr("y2", height - 50)
      .style("display", "inline");

    stdLineRight
      .attr("x1", xScale((mean + std)))
      .attr("x2", xScale((mean + std)))
      .attr("y1", 50)
      .attr("y2", height - 50)
      .style("display", "inline");

    statsDiv.html(`Mean: ${mean.toFixed(3)} &nbsp;&nbsp; SD: ${std.toFixed(3)}`);
  }

  const randomData = () => Array.from({ length: 10 }, () => Math.random());
  drawBars(randomData());

  document.getElementById("startRVB").onclick = () => drawBars(randomData());
  document.getElementById("resetRVB").onclick = () => drawBars(Array(10).fill(0));
}
