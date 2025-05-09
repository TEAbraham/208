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
jStat.bernoulli = {
  pdf: (k, p) => (k < 0 || !Number.isInteger(k) || k > 1 || p < 0 || p > 1) ? 0 : jStat.binomial.pdf(k, 1, p),
  cdf: (k, p) => jStat.binomial.cdf(k, 1, p),
  mean: (p) => p,
  sample: (p) => Array.from({length: 1}, () => +(Math.random() < p)).reduce((a, b) => a + b, 0)
};

jStat.binomialDiscrete = {
  pdf: (k, n, p) => (k < 0 || !Number.isInteger(k) || k > n || p < 0 || p > 1) ? 0 : jStat.binomial.pdf(k, n, p),
  cdf: (k, n, p) => jStat.binomial.cdf(k, n, p),
  mean: (n, p) => n * p,
  sample: (n, p) => Array.from({length: n}, () => +(Math.random() < p)).reduce((a, b) => a + b, 0)
};

jStat.geometric = {
  pdf: (k, p) => (k < 1 || !Number.isInteger(k) || p < 0 || p > 1) ? 0 : (1-p)**(k-1)*p,
  cdf: (k, p) => { let sum = 0; for (let i = 1; i <= k; i++) {sum +=jStat.geometric.pdf(i,p) }; return sum  },
  mean: (p) => 1/p,
  sample: (p) => Array.from({length: 1}, () => +(Math.random() < p)).reduce((a, b) => a + b, 0)
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
