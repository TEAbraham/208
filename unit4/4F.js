window.onload = function () {
  galton();
  document.querySelectorAll(".perspective").forEach((button) => {
    button.addEventListener("click", function () {
      document.querySelectorAll(".perspective").forEach((btn) =>
        btn.classList.remove("active")
      );
      this.classList.add("active");
      changePerspective(this.id);
      updateRects(1000);
    });
  });
};


function galton() {

  let fullWidth = document.getElementById("galton-container").clientWidth;

  // Galton Board Logic (Centered Pegs + Histogram + Reset/Pause Controls)

  function factorial(n) {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  }

  // Galton Board Logic
  const galtonMargin = { top: 20, right: 30, bottom: 100, left: 30 };
  const galtonWidth = fullWidth;
  let galtonHeight = 600;
  const spacing = 40;

  let galtonSvg = d3.select("#galton-chart")
    .append("svg")
    .attr("width", galtonWidth)
    .attr("height", galtonHeight)
    .attr("id", "galton-svg");

  const galtonGroup = galtonSvg.append("g")
    .attr("transform", `translate(${galtonMargin.left},${galtonMargin.top})`);

  let galtonConfig = { size: 10, bias: 0.5, speed: 500, histogram: Array(9).fill(0) };

  const pegLayer = galtonGroup.append("g");
  const ballLayer = galtonGroup.append("g");
  const histLayer = galtonGroup.append("g");

  let dropping = true;

  function drawGaltonBoard() {
    pegLayer.selectAll("circle").remove();
    const size = galtonConfig.size;
    for (let row = 0; row < size; row++) {
      for (let col = 0; col <= row; col++) {
        const cx = galtonWidth / 2 - (row * spacing / 2) + col * spacing;
        pegLayer.append("circle")
          .attr("cx", cx)
          .attr("cy", row * spacing)
          .attr("r", 5)
          .attr("fill", "#666");
      }
    }
  }

  function dropBallAnimated() {
    if (!dropping) return;

    let x = galtonWidth / 2;
    let y = 0;
    let position = 0;
    let delay = 0;

    const ball = ballLayer.append("circle")
      .attr("r", 5)
      .attr("fill", "orange")
      .attr("cx", x)
      .attr("cy", y);

    for (let i = 0; i < galtonConfig.size; i++) {
      const right = Math.random() < galtonConfig.bias;
      if (right) position++;
      const xNext = x + (right ? spacing / 2 : -spacing / 2);
      const yBounce = y - 10;
      const yNext = y + spacing;

      ball.transition().delay(delay).duration(galtonConfig.speed / 2)
        .attr("cx", xNext).attr("cy", yBounce)
        .attr("fill", right ? "#00d0a1" : "#FF9B3C");

      ball.transition().delay(delay + galtonConfig.speed / 2).duration(galtonConfig.speed / 2)
        .attr("cy", yNext);

      x = xNext;
      y = yNext;
      delay += galtonConfig.speed;
    }
    // Update histogram AFTER ball finishes dropping
    ball.transition()
      .delay(delay)
      .duration(0)
      .on("end", () => {
        galtonConfig.histogram[position]++;
        updateGaltonHistogram();
        ball.transition().duration(1000).remove();
      });
  }
  function updateGaltonHistogram() {
    const bins = galtonConfig.histogram.length;
    const histHeight = 100;
    const maxCount = d3.max(galtonConfig.histogram);

    const x = d3.scaleLinear().domain([0, bins - 1]).range([
      galtonWidth / 2 - (bins - 1) * spacing / 2,
      galtonWidth / 2 + (bins - 1) * spacing / 2
    ]);
    const y = d3.scaleLinear().domain([0, maxCount || 1]).range([histHeight, 0]);

    const barWidth = spacing;
    const bars = histLayer.selectAll("rect").data(galtonConfig.histogram);

    bars.enter()
      .append("rect")
      .attr("x", (_, i) => galtonWidth / 2 - (bins - 1) * spacing / 2 + i * spacing)
      .attr("width", barWidth)
      .attr("y", y(0))
      .attr("height", 0)
      .attr("fill", "#64bdff")
      .merge(bars)
      .transition()
      .duration(300)
      .attr("x", (_, i) => x(i) - spacing / 2)
      .attr("width", spacing)
      .attr("y", d => y(d))
      .attr("height", d => histHeight - y(d));

    bars.exit().remove();

    const labels = histLayer.selectAll("text").data(galtonConfig.histogram);

    labels.enter()
      .append("text")
      .attr("text-anchor", "middle")
      .attr("fill", "#333")
      .attr("font-size", "12px")
      .merge(labels)
      .transition()
      .duration(300)
      .text(d => d)
      .attr("x", (_, i) => x(i))
      .attr("y", d => y(d) - 5);

    labels.exit().remove();

    histLayer.attr("transform", `translate(0, ${galtonConfig.size * spacing + 40})`);
  }

  document.getElementById("depth-slider").addEventListener("input", e => {
    const galtonSvgElement = document.getElementById("galton-svg");
    galtonConfig.size = +e.target.value;
    galtonHeight = galtonConfig.size >= 12 ? 1000 : 600;
    galtonSvgElement.setAttribute("height", galtonHeight);
    const val = +e.target.value;
    document.getElementById("depth-val").textContent = val;
    galtonConfig.size = val;
    galtonConfig.histogram = Array(val + 1).fill(0);
    drawGaltonBoard();
    updateGaltonHistogram();
  });

  document.getElementById("bias-slider").addEventListener("input", e => {
    const val = +e.target.value;
    document.getElementById("bias-val").textContent = val;
    galtonConfig.bias = val / 100;
  });

  document.getElementById("speed-slider").addEventListener("input", e => {
    const val = +e.target.value;
    document.getElementById("speed-val").textContent = val;
    galtonConfig.speed = val;
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    galtonConfig.histogram = Array(galtonConfig.size + 1).fill(0);
    updateGaltonHistogram();
  });

  document.getElementById("pause-btn").addEventListener("click", () => {
    dropping = !dropping;
    document.getElementById("pause-btn").textContent = dropping ? "Pause" : "Resume";
  });

  drawGaltonBoard();
  setInterval(dropBallAnimated, 500);
}