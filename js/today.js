// Bernoulli Distribution Visualization with D3.js
const bernoulliMargin = { top: 30, right: 30, bottom: 30, left: 40 };
const bernoulliWidth = 400 - bernoulliMargin.left - bernoulliMargin.right;
const bernoulliHeight = 300 - bernoulliMargin.top - bernoulliMargin.bottom;

const bernoulliSvg = d3.select("#bernoulli-chart")
  .append("svg")
  .attr("width", bernoulliWidth + bernoulliMargin.left + bernoulliMargin.right)
  .attr("height", bernoulliHeight + bernoulliMargin.top + bernoulliMargin.bottom)
  .append("g")
  .attr("transform", `translate(${bernoulliMargin.left},${bernoulliMargin.top})`);

const bernoulliX = d3.scaleBand().domain([0, 1]).range([0, bernoulliWidth]).padding(0.4);
const bernoulliY = d3.scaleLinear().domain([0, 1]).range([bernoulliHeight, 0]);

bernoulliSvg.append("g")
  .attr("transform", `translate(0,${bernoulliHeight})`)
  .call(d3.axisBottom(bernoulliX).tickFormat(d => `P(${d})`));

bernoulliSvg.append("g").call(d3.axisLeft(bernoulliY).ticks(5));

let bernoulliBars = bernoulliSvg.selectAll(".bar")
  .data([0.5, 0.5])
  .enter()
  .append("rect")
  .attr("class", "bar")
  .attr("x", (_, i) => bernoulliX(i))
  .attr("width", bernoulliX.bandwidth())
  .attr("y", d => bernoulliY(d))
  .attr("height", d => bernoulliHeight - bernoulliY(d))
  .attr("fill", (_, i) => i === 1 ? "#4caf50" : "#f44336");

function updateBernoulli(p) {
  d3.select("#bernoulli-p-value").text(p.toFixed(2));
  bernoulliBars.data([1 - p, p])
    .transition()
    .duration(300)
    .attr("y", d => bernoulliY(d))
    .attr("height", d => bernoulliHeight - bernoulliY(d));
}

document.getElementById("bernoulli-slider").addEventListener("input", function () {
  updateBernoulli(+this.value);
});

updateBernoulli(0.5);

// Binomial Distribution Visualization
const binomialMargin = { top: 30, right: 30, bottom: 30, left: 40 };
const binomialWidth = 500 - binomialMargin.left - binomialMargin.right;
const binomialHeight = 300 - binomialMargin.top - binomialMargin.bottom;

const binomialSvg = d3.select("#binomial-chart")
  .append("svg")
  .attr("width", binomialWidth + binomialMargin.left + binomialMargin.right)
  .attr("height", binomialHeight + binomialMargin.top + binomialMargin.bottom)
  .append("g")
  .attr("transform", `translate(${binomialMargin.left},${binomialMargin.top})`);

const binomialX = d3.scaleBand().range([0, binomialWidth]).padding(0.1);
const binomialY = d3.scaleLinear().domain([0, 1]).range([binomialHeight, 0]);

binomialSvg.append("g")
  .attr("class", "x-axis")
  .attr("transform", `translate(0, ${binomialHeight})`);

binomialSvg.append("g")
  .attr("class", "y-axis")
  .call(d3.axisLeft(binomialY).ticks(5));

function factorial(n) {
  return n === 0 ? 1 : Array.from({ length: n }, (_, i) => i + 1).reduce((a, b) => a * b, 1);
}

function binomialP(n, k, p) {
  const coeff = factorial(n) / (factorial(k) * factorial(n - k));
  return coeff * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

function updateBinomial(n, p) {
  d3.select("#binomial-n-value").text(n);
  d3.select("#binomial-p-value").text(p.toFixed(2));

  const data = d3.range(n + 1).map(k => ({ k, prob: binomialP(n, k, p) }));
  binomialX.domain(data.map(d => d.k));
  binomialY.domain([0, d3.max(data, d => d.prob)]);

  binomialSvg.select(".x-axis").call(d3.axisBottom(binomialX));
  binomialSvg.select(".y-axis").transition().duration(300).call(d3.axisLeft(binomialY).ticks(5));

  const bars = binomialSvg.selectAll(".bar").data(data, d => d.k);

  bars.enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => binomialX(d.k))
    .attr("width", binomialX.bandwidth())
    .attr("y", d => binomialY(0))
    .attr("height", 0)
    .attr("fill", "steelblue")
    .merge(bars)
    .transition()
    .duration(300)
    .attr("x", d => binomialX(d.k))
    .attr("width", binomialX.bandwidth())
    .attr("y", d => binomialY(d.prob))
    .attr("height", d => binomialHeight - binomialY(d.prob));

  bars.exit().remove();
}

document.getElementById("binomial-n-slider").addEventListener("input", () => {
  updateBinomial(+binomialNSlider.value, +binomialPSlider.value);
});
document.getElementById("binomial-p-slider").addEventListener("input", () => {
  updateBinomial(+binomialNSlider.value, +binomialPSlider.value);
});

const binomialNSlider = document.getElementById("binomial-n-slider");
const binomialPSlider = document.getElementById("binomial-p-slider");
updateBinomial(+binomialNSlider.value, +binomialPSlider.value);

// Galton Board Logic (Centered Pegs + Histogram + Reset/Pause Controls)

const galtonMargin = { top: 20, right: 30, bottom: 100, left: 30 };
const galtonWidth = 600;
const galtonHeight = 500;
const spacing = 40;

const galtonSvg = d3.select("#galton-chart")
  .append("svg")
  .attr("width", galtonWidth)
  .attr("height", galtonHeight);

const galtonGroup = galtonSvg.append("g")
  .attr("transform", `translate(${galtonMargin.left},${galtonMargin.top})`);

let galtonConfig = {
  size: 8,
  bias: 0.5,
  speed: 150,
  histogram: Array(9).fill(0),
};

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

  const path = [];
  let x = galtonWidth / 2;
  let y = 0;
  let position = 0;

  for (let i = 0; i < galtonConfig.size; i++) {
    const right = Math.random() < galtonConfig.bias;
    if (right) position++;
    x += right ? spacing / 2 : -spacing / 2;
    y += spacing;
    path.push([x, y]);
  }

  galtonConfig.histogram[position]++;
  updateGaltonHistogram();

  const ball = ballLayer.append("circle")
    .attr("r", 5)
    .attr("fill", "orange")
    .attr("cx", galtonWidth / 2)
    .attr("cy", 0);

  path.forEach(([px, py], i) => {
    ball.transition()
      .delay(i * galtonConfig.speed)
      .duration(galtonConfig.speed)
      .attr("cx", px)
      .attr("cy", py);
  });

  ball.transition()
    .delay(path.length * galtonConfig.speed + 1000)
    .remove();
}

function updateGaltonHistogram() {
  const bins = galtonConfig.histogram.length;
  const histHeight = 100;
  const maxCount = d3.max(galtonConfig.histogram);

  const x = d3.scaleBand().domain(d3.range(bins)).range([0, galtonWidth]).padding(0.1);
  const y = d3.scaleLinear().domain([0, maxCount || 1]).range([histHeight, 0]);

  const bars = histLayer.selectAll("rect").data(galtonConfig.histogram);

  bars.enter()
    .append("rect")
    .attr("x", (_, i) => x(i))
    .attr("width", x.bandwidth())
    .attr("y", y(0))
    .attr("height", 0)
    .attr("fill", "teal")
    .merge(bars)
    .transition()
    .duration(300)
    .attr("x", (_, i) => x(i))
    .attr("width", x.bandwidth())
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
    .attr("x", (_, i) => x(i) + x.bandwidth() / 2)
    .attr("y", d => y(d) - 5);

  labels.exit().remove();

  histLayer.attr("transform", `translate(0, ${galtonConfig.size * spacing + 40})`);
}

document.getElementById("depth-slider").addEventListener("input", e => {
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
