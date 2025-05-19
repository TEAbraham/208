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

// Additional jStat functions
jStat.bernoulli = {
  pdf: (k, p) => (k < 0 || !Number.isInteger(k) || k > 1 || p < 0 || p > 1) ? 0 : (k === 1 ? p : 1 - p),
  cdf: (k, p) => (k < 0 ? 0 : k < 1 ? 1 - p : 1),
  mean: (p) => p,
  variance: (p) => p * (1 - p),
  sample: (p) => +(Math.random() < p)
};

jStat.geometric = {
  pdf: (k, p) => (k < 1 || !Number.isInteger(k) || p < 0 || p > 1) ? 0 : (1 - p) ** (k - 1) * p,
  cdf: (k, p) => (k < 1 || !Number.isInteger(k) || p < 0 || p > 1) ? 0 : 1 - (1 - p) ** k,
  mean: (p) => 1 / p,
  variance: (p) => (1 - p) / (p * p),
  sample: (p) => {
    let count = 1;
    while (Math.random() >= p) {
      count++;
    }
    return count;
  }
};

jStat.binomialDiscrete = {
  pdf: (k, n, p) => (k < 0 || !Number.isInteger(k) || k > n || p < 0 || p > 1) ? 0 : jStat.binomial.pdf(k, n, p),
  cdf: (k, n, p) => jStat.binomial.cdf(k, n, p),
  mean: (n, p) => n * p,
  variance: (n, p) => n * p * (1 - p),
  sample: (n, p) => {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += +(Math.random() < p);
    }
    return sum;
  }
};


jStat.negbin = {
  pdf: (k, r, p) => (k < 0 || !Number.isInteger(k) || r <= 0 || p < 0 || p > 1) ? 0 :
    jStat.combination(k + r - 1, k) * (p ** r) * ((1 - p) ** k),
  cdf: (k, r, p) => jStat.ibetainc(p, r, k + 1),
  mean: (r, p) => (1 - p) * r / p,
  variance: (r, p) => (1 - p) * r / (p * p),
  sample: (r, p) => {
    let failures = 0, successes = 0;
    while (successes < r) {
      if (Math.random() < p) successes++;
      else failures++;
    }
    return failures;
  }
};


jStat.poisson = {
  pdf: (k, lambda) => (k < 0 || !Number.isInteger(k) || lambda < 0) ? 0 :
    (Math.pow(lambda, k) * Math.exp(-lambda)) / jStat.factorial(k),
  cdf: (k, lambda) => 1 - jStat.gammap(k + 1, lambda),
  mean: (lambda) => lambda,
  variance: (lambda) => lambda,
  sample: (lambda) => {
    let L = Math.exp(-lambda);
    let k = 0, p = 1;
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    return k - 1;
  }
};

// Accurate regularized incomplete beta function for Negative Binomial CDF
function betacf(x, a, b) {
  const MAX_ITER = 100;
  const EPS = 1e-8;
  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;
  let c = 1;
  let d = 1 - qab * x / qap;
  if (Math.abs(d) < EPS) d = EPS;
  d = 1 / d;
  let h = d;

  for (let m = 1, m2 = 2; m <= MAX_ITER; m++, m2 += 2) {
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < EPS) d = EPS;
    c = 1 + aa / c;
    if (Math.abs(c) < EPS) c = EPS;
    d = 1 / d;
    h *= d * c;

    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < EPS) d = EPS;
    c = 1 + aa / c;
    if (Math.abs(c) < EPS) c = EPS;
    d = 1 / d;
    let delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1.0) < EPS) break;
  }

  return h;
}

function ibetainc(x, a, b) {
  if (x < 0 || x > 1) return NaN;
  if (x === 0) return 0;
  if (x === 1) return 1;

  const lnBeta = jStat.gammaln(a) + jStat.gammaln(b) - jStat.gammaln(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lnBeta) / a;

  const cf = betacf(x, a, b);
  return front * cf;
}

jStat.ibetainc = ibetainc;

jStat.poisson.cdf = function(k, lambda) {
  if (k < 0 || !Number.isInteger(k) || lambda < 0) return 0;

  let sum = 0;
  for (let i = 0; i <= k; i++) {
    sum += jStat.poisson.pdf(i, lambda);
    if (sum >= 1) break;  // stop if total reaches 1 (numerical cap)
  }

  return Math.min(sum, 1);  // ensure never exceeds 1 due to rounding
};
