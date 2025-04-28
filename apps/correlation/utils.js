function round(val) {
    return Math.round(Number(val) * 1000) / 1000;
  }
  
  function drawGaussian(n, mean, sd) {
    return d3.range(n).map(() => d3.randomNormal(mean, sd)());
  }
  
  function calculateRegression(data) {
    const xMean = d3.mean(data, d => d[0]);
    const yMean = d3.mean(data, d => d[1]);
    const cov = d3.sum(data, d => (d[0] - xMean) * (d[1] - yMean)) / data.length;
    const varX = d3.variance(data, d => d[0]);
    const slope = cov / varX;
    const intercept = yMean - slope * xMean;
    return { slope, intercept };
  }
  
  function calculateEllipse(meanX, meanY, sdX, sdY, rho, level) {
    const chisq = { 0.5: 1.386, 0.8: 3.219, 0.95: 5.991, 0.99: 9.210 }[level];
    return {
      rx: Math.sqrt(chisq) * sdX,
      ry: Math.sqrt(chisq) * sdY,
      angle: Math.atan2(2 * rho * sdX * sdY, (sdX ** 2 - sdY ** 2)) / 2
    };
  }
  
  function calculateOverlapDistance(rho, r) {
    rho = Math.abs(rho) < 1e-5 ? 0 : rho;
    let k = (rho * rho) / 2;
    if (k > 0 && k < 1) {
      let t1 = Math.pow(12 * k * Math.PI, 1 / 3);
      for (let i = 0; i < 10; ++i) {
        let t0 = t1;
        t1 = (Math.sin(t0) - t0 * Math.cos(t0) + 2 * k * Math.PI) / (1 - Math.cos(t0));
      }
      k = (1 - Math.cos(t1 / 2)) / 2;
    }
    return 2 * r * k;
  }
  