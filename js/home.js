// Combined home.js and unit.js with redundancies removed

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
