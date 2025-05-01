const distSelector = document.getElementById("distSelector");
const slidersContainer = document.getElementById("sliders");
const canvas = document.getElementById("plotCanvas");
const ctx = canvas.getContext("2d");

const sliderConfigs = {
  bernoulli: () => [{ id: "p", label: "p", min: 0, max: 1, step: 0.01, value: 0.5 }],
  binomialDiscrete: () => [
    { id: "n", label: "n", min: 1, max: 100, step: 1, value: 10 },
    { id: "p", label: "p", min: 0, max: 1, step: 0.01, value: 0.5 }
  ],
  geometric: () => [{ id: "p", label: "p", min: 0.01, max: 1, step: 0.01, value: 0.2 }],
  poisson: () => [{ id: "lambda", label: "λ", min: 0.1, max: 20, step: 0.1, value: 5 }],
  normal: () => [
    { id: "mu", label: "μ", min: -10, max: 10, step: 0.1, value: 0 },
    { id: "sigma", label: "σ", min: 0.1, max: 10, step: 0.1, value: 1 }
  ],
  uniform: () => [
    { id: "a", label: "a (min)", min: -10, max: 10, step: 0.1, value: -2 },
    { id: "b", label: "b (max)", min: -10, max: 10, step: 0.1, value: 2 }
  ]
};

function createSliders(configs) {
  slidersContainer.innerHTML = "";
  return configs.map(({ id, label, ...rest }) => {
    const wrapper = document.createElement("div");
    const labelEl = document.createElement("label");
    const input = document.createElement("input");
    const span = document.createElement("span");

    input.type = "range";
    input.id = id;
    Object.assign(input, rest);
    span.textContent = rest.value;
    labelEl.textContent = `${label}: `;
    labelEl.appendChild(span);
    wrapper.appendChild(labelEl);
    wrapper.appendChild(input);
    slidersContainer.appendChild(wrapper);

    input.addEventListener("input", () => {
      span.textContent = input.value;
      drawCanvas();
    });

    return input;
  });
}

function drawCanvas() {
  const dist = distSelector.value;
  const inputs = Array.from(slidersContainer.querySelectorAll("input"));
  const values = Object.fromEntries(inputs.map(i => [i.id, +i.value]));

  let x = [], y = [];
  if (dist === "bernoulli") {
    x = [0, 1];
    y = [1 - values.p, values.p];
  } else if (dist === "binomialDiscrete") {
    x = [...Array(values.n + 1).keys()];
    y = x.map(k => jStat.binomial.pdf(k, values.n, values.p));
  } else if (dist === "geometric") {
    x = [...Array(15).keys()];
    y = x.map(k => jStat.geometric.pdf(k, values.p));
  } else if (dist === "poisson") {
    const limit = Math.ceil(Math.max(15, values.lambda * 3));
    x = [...Array(limit).keys()];
    y = x.map(k => jStat.poisson.pdf(k, values.lambda));
  } else if (dist === "normal") {
    x = [];
    for (let i = values.mu - 4 * values.sigma; i <= values.mu + 4 * values.sigma; i += 0.1)
      x.push(i);
    y = x.map(k => jStat.normal.pdf(k, values.mu, values.sigma));
  } else if (dist === "uniform") {
    if (values.a >= values.b) return;
    x = [values.a, values.b];
    y = [1 / (values.b - values.a), 1 / (values.b - values.a)];
  }

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const margin = 40;
  const plotWidth = canvas.width - 2 * margin;
  const plotHeight = canvas.height - 2 * margin;
  const xMin = Math.min(...x);
  const xMax = Math.max(...x);
  const yMax = Math.max(...y);

  // Axis
  ctx.strokeStyle = "black";
  ctx.beginPath();
  ctx.moveTo(margin, margin);
  ctx.lineTo(margin, margin + plotHeight);
  ctx.lineTo(margin + plotWidth, margin + plotHeight);
  ctx.stroke();

  // Data path
  ctx.strokeStyle = "steelblue";
  ctx.beginPath();
  x.forEach((xi, i) => {
    const xPixel = margin + ((xi - xMin) / (xMax - xMin)) * plotWidth;
    const yPixel = margin + plotHeight - ((y[i] / yMax) * plotHeight);
    if (i === 0) ctx.moveTo(xPixel, yPixel);
    else ctx.lineTo(xPixel, yPixel);
  });
  ctx.stroke();
}

distSelector.addEventListener("change", () => {
  const configs = sliderConfigs[distSelector.value]();
  createSliders(configs);
  drawCanvas();
});

const configs = sliderConfigs[distSelector.value]();
createSliders(configs);
drawCanvas();
