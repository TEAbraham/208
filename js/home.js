export function buildLogo(svg, scaleFactor = 1) {
  const rectWidth = 340 * scaleFactor;
  const rectHeight = 385 * scaleFactor;
  const rectX = 200 * scaleFactor;
  const rectY = 200 * scaleFactor;

  svg.append("rect")
    .attr("x", rectX)
    .attr("y", rectY)
    .attr("width", rectWidth)
    .attr("height", rectHeight)
    .attr("fill", "white")
    .attr("stroke", "darkgreen")
    .attr("stroke-width", 5 * scaleFactor);

  const arcLeft = d3.arc()
    .innerRadius(rectHeight / 2 - 0.01)
    .outerRadius(rectHeight / 2)
    .startAngle(-Math.PI)
    .endAngle(-2 * Math.PI);

  const arcRight = d3.arc()
    .innerRadius(rectHeight / 2 - 0.01)
    .outerRadius(rectHeight / 2)
    .startAngle(Math.PI)
    .endAngle(2 * Math.PI);

  const arcTop = d3.arc()
    .innerRadius(rectHeight / 2 - 0.01)
    .outerRadius(rectHeight / 2)
    .startAngle(-1.05)
    .endAngle(1.05);

  svg.append("path")
    .attr("d", arcLeft)
    .attr("transform", `translate(${rectX - 200 * scaleFactor}, ${rectY + rectHeight / 2})`)
    .attr("fill", "none")
    .attr("stroke", "darkgreen")
    .attr("stroke-width", 5 * scaleFactor)
    .transition()
    .duration(1500)
    .attr("transform", `translate(${rectX + 25 * scaleFactor}, ${rectY + rectHeight / 2})`);

  svg.append("path")
    .attr("d", arcRight)
    .attr("transform", `translate(${rectX + rectWidth + 200 * scaleFactor}, ${rectY + rectHeight / 2})`)
    .attr("fill", "none")
    .attr("stroke", "darkgreen")
    .attr("stroke-width", 5 * scaleFactor)
    .transition()
    .duration(1500)
    .attr("transform", `translate(${rectX + rectWidth - 25 * scaleFactor}, ${rectY + rectHeight / 2})`);

  svg.append("path")
    .attr("d", arcTop)
    .attr("transform", `translate(${rectX + rectWidth / 2}, ${rectY - 200 * scaleFactor})`)
    .attr("fill", "white")
    .attr("stroke", "darkgreen")
    .attr("stroke-width", 5 * scaleFactor)
    .transition()
    .duration(1500)
    .attr("transform", `translate(${rectX + rectWidth / 2}, ${rectY + rectHeight / 2})`);

    svg.append("rect")
      .attr("x", 130 * scaleFactor)
      .attr("y", 300 * scaleFactor)
      .attr("width", rectWidth / 3)
      .attr("height", rectHeight)
      .attr("fill", "white");

    svg.append("rect")
      .attr("x", 160 * scaleFactor + rectWidth)
      .attr("y", 300 * scaleFactor)
      .attr("width", rectWidth / 3)
      .attr("height", rectHeight)
      .attr("fill", "white");
}

document.addEventListener('DOMContentLoaded', function () {
  if (document.querySelector("#bg-animation")) {
    buildLogo(d3.select("#bg-animation"), 1);
  }

  if (document.querySelector("#logo")) {
    const miniLogo = d3.select("#logo")
      .append("svg")
      .attr("width", 100)
      .attr("height", 100)
      .style("margin-left", "0px")
      .style("vertical-align", "middle");

    buildLogo(miniLogo, 0.1);
  }
});

// Shrink header on scroll
window.addEventListener("scroll", () => {
  const menu = document.querySelector(".menu-top");
  if (window.scrollY > 10) {
    menu.classList.add("shrink");
  } else {
    menu.classList.remove("shrink");
  }
});

// Active menu highlighting
document.querySelectorAll('.menu-top ul li a').forEach(link => {
  link.addEventListener('click', function() {
      document.querySelectorAll('.menu-top ul li.active').forEach(active => active.classList.remove('active'));
      this.parentElement.classList.add('active');
  });
});

// Extend D3 selection prototype for bringing elements to front/back
d3.selection.prototype.moveToFront = function() {
  return this.each(function() {
      this.parentNode.appendChild(this);
  });
};

d3.selection.prototype.moveToBack = function() {
  return this.each(function() {
      this.parentNode.insertBefore(this, this.parentNode.firstChild);
  });
};

// Rounding function
function round(number, decimal) {
  let power = Math.pow(10, decimal);
  return (Math.round(number * power) / power).toFixed(decimal);
}

// Additional jStat functions
jStat.binomialDiscrete = {
  pdf: (k, n, p) => (k < 0 || !Number.isInteger(k) || k > n || p < 0 || p > 1) ? 0 : jStat.binomial.pdf(k, n, p),
  cdf: (k, n, p) => jStat.binomial.cdf(k, n, p),
  mean: (n, p) => n * p,
  sample: (n, p) => Array.from({length: n}, () => +(Math.random() < p)).reduce((a, b) => a + b, 0)
};

// Slider creation function
function create_slider(slide, svg, width, height, margin) {
  let x = d3.scaleLinear().domain([0, 1]).range([0, width]).clamp(true);
  let slider = svg.append("g").attr("class", "range").attr("transform", `translate(${margin},${height})`);
  
  slider.append("line").attr("class", "track").attr("x1", x.range()[0]).attr("x2", x.range()[1])
      .select(() => this.parentNode.appendChild(this.cloneNode(true)))
      .attr("class", "track-inset")
      .select(() => this.parentNode.appendChild(this.cloneNode(true)))
      .attr("class", "track-overlay")
      .call(d3.drag().on('drag', function(event) {
          let val = x.invert(event.x);
          handle.attr("cx", x(val));
          slide(val);
      }));
  
  let handle = slider.insert("circle", ".track-overlay").attr("class", "handle").attr("r", 12);
  
  return () => handle.attr("cx", x(0));
}
