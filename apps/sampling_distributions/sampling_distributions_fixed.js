// Global variables
var x_scale_clt, y_scale_clt, z_scale_clt;
var width = 1000;
var height = 400;
var y1 = height / 4;   // you forgot to define y1
var y2 = height / 2;
var sampling_path, sampling_area, theoretical_path;
var currentDist = "bernoulli"; // or your default
var counts = [];
var sampling = false;
var samplingInterval;
var n = 1;
var bins = 30; // Number of bins
var alpha = 1;
var beta = 1;
var counts = [];

function draw_bar(g, y, label) {
  g.append("line")
    .attr("x1", 0)
    .attr("x2", 1000)
    .attr("y1", y)
    .attr("y2", y)
    .attr("stroke", "#cccccc")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "4 2");

  g.append("text")
    .attr("x", 5)
    .attr("y", y - 5)
    .attr("font-size", "10px")
    .text(label);
}

function centerOnDistribution(dist) {
  let newXDomain = [-5, 5]; // Default
  let newYDomain = [0, 1];  // We'll set better after drawing

  try {
    if (dist === "normal") {
      const mu = +document.getElementById("normalMu").value;
      const sigma = +document.getElementById("normalSigma").value;
      newXDomain = [mu - 5 * sigma, mu + 5 * sigma];
    }
    else if (dist === "uniform") {
      const min = +document.getElementById("uniformA").value;
      const max = +document.getElementById("uniformB").value;
      newXDomain = [min - 1, max + 1];
    }
    else if (dist === "beta") {
      newXDomain = [-0.2, 1.2];
    }
    else if (dist === "bernoulli") {
      newXDomain = [-0.5, 1.5];
    }
    else if (dist === "binomialDiscrete") {
      const n = +document.getElementById("binomialN").value;
      newXDomain = [-2, n + 2];
    }
    else if (dist === "geometric") {
      newXDomain = [0, 15];
    }
    else if (dist === "poisson") {
      const lambda = +document.getElementById("poissonLambda").value;
      newXDomain = [0, Math.max(10, lambda * 3)];
    }
    else if (dist === "gamma") {
      const shape = +document.getElementById("gammaK").value;
      const scale = +document.getElementById("gammaTheta").value;
      const mean = shape * scale;
      newXDomain = [0, mean + 5 * Math.sqrt(shape) * scale];
    }
    else if (dist === "exponential") {
      const lambda = +document.getElementById("exponentialLambda").value;
      newXDomain = [0, 10 / lambda];
    }
    else if (dist === "chisquare") {
      const k = +document.getElementById("chisquareK").value;
      newXDomain = [0, 5 * k];
    }
    else if (dist === "studentt") {
      newXDomain = [-10, 10];
    }

    // Update scales
    x_scale_clt.domain(newXDomain).nice();

  } catch (e) {
    console.error("Error in centerOnDistribution:", e);
  }
}
//*******************************************************************************//
//Discrete and Continuous
//*******************************************************************************//
function discrete_continuous() {
  //Constants
  var xMax = [-40,40];
  var yMax = [0,5];
  var currentView = [-5,5];

  var parameters = {'bernoulli':['Probability'], 
                    'binomialDiscrete':['Number','Probability'], 
                    'negbin':['Number','Probability'], 
  				          'geometric':['Probability'], 
                    'poisson':['Lambda'],
                    'uniform':['Min','Max'], 
                    'normal':['Mean','Std'], 
                    'studentt':['Dof'], 
                    'chisquare':['Dof'], 
                    'exponential':['Lambda'], 
                    'centralF': ['Dof1','Dof2'], 
                    'gamma': ['Shape','Scale'], 
                    'beta': ['Alpha','Beta']};

  var initialParameters = {'bernoulli':[0.5], 
                           'binomialDiscrete':[5,0.5], 
                           'negbin':[5,0.5], 
                           'geometric':[0.5], 
                           'poisson':[5],
  						             'uniform':[-5,5], 
                           'normal':[0,1], 
                           'studentt':[5], 
                           'chisquare':[5], 
                           'exponential':[1], 
                           'centralF':[5,5], 
                           'gamma': [1,1], 
                           'beta': [1,1]};

  var distributions = ['bernoulli',
                       'binomialDiscrete',
                       'negbin',
                       'geometric',
                       'poisson',
                       'uniform',
                       'normal',
                       'studentt',
                       'chisquare',
                       'exponential',
                       'centralF',
                       'gamma', 
                       'beta'];
                       
  var initialView = {'bernoulli':[-5,5], 
                     'binomialDiscrete':[-1,6], 
                     'negbin':[-1,6], 
                     'geometric':[0,6], 
                     'poisson':[-1,6],
                     'uniform':[-6,6], 
                     'normal':[-5,5], 
                     'studentt':[-5,5], 
                     'chisquare':[-1,8], 
                     'exponential':[-1,5], 
                     'centralF':[-1,5],
                      "":[-5,5], 
                      'gamma': [-1,5], 
                      'beta': [-0.5,1.5]};

  var currentPercent = 0;


  // Create SVG and elements
  // var svgDist = d3.select("#graphDist").append("svg");
    // 1: Set up dimensions of SVG
  var margin = {top: 60, right: 20, bottom: 100, left: 20},
    width = 700 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

  // 2: Create SVG
  var svgDist = d3.select("#graphDist").append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin.top + margin.bottom))
      .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var xDist = svgDist.append("g").attr("class", "x axis");
  var yDist = svgDist.append("g").attr("class", "y axis");
  var clip = svgDist.append("clipPath").attr("id", "view").append("rect");
  var pdfPath = svgDist.append("path").attr("id", "pdf").attr("clip-path", "url(#view)");
  var pdfArea = svgDist.append("path").attr("id", "pdfArea").attr("clip-path", "url(#view)").moveToBack();
  var cdfPath = svgDist.append("path").attr("id", "cdf").attr("clip-path", "url(#view)");
  var shift = svgDist.append("rect").attr("fill", "transparent").attr("id","shift");
  var control = svgDist.append("g");

  //Create scale functions
  var xScaleDist = d3.scaleLinear().domain([-5, 5]);

  var yScaleDist = d3.scaleLinear().domain([0, 1]);

  //Define X axis
  var xAxisDist = d3.axisBottom(xScaleDist).ticks(5);

  //Define Y axis
  var yAxisDist = d3.axisLeft(yScaleDist).ticks(5);


  function scale() {
    svgDist.call(zoom.event); // https://github.com/mbostock/d3/issues/2387

    // Record the coordinates (in data space) of the center (in screen space).
    var center0 = zoom.center(), translate0 = zoom.translate(), coordinates0 = coordinates(center0);
    scale = zoom.scale() * Math.pow(2, +this.getAttribute("data-zoom"));
    zoom.scale(Math.max(0.25, Math.min(scale, 4)));

    // Translate back to the center.
    var center1 = point(coordinates0);
    zoom.translate([translate0[0] + center0[0] - center1[0], translate0[1] + center0[1] - center1[1]]);

    svgDist.transition().duration(1000).call(zoom.event);
  }

  function coordinates(point) {
    var scale = zoom.scale(), translate = zoom.translate();
    return [(point[0] - translate[0]) / scale, (point[1] - translate[1]) / scale];
  }

  function point(coordinates) {
    var scale = zoom.scale(), translate = zoom.translate();
    return [coordinates[0] * scale + translate[0], coordinates[1] * scale + translate[1]];
  }

  // Draw PDF/CDF Path
  function redrawPath(dist) {
    try {
      if (dist != "") {
        var line = d3.line()
          .x(function (d) { return xScaleDist(d[0]) })
          .y(function (d) { return yScaleDist(d[1]) })
          .curve(d3.curveBasis);
        var area = d3.area()
          .x(function (d) { return xScaleDist(d[0]) })
          .y0(yScaleDist(0))
          .y1(function (d) { return yScaleDist(d[1]) })
          .curve(d3.curveBasis);
        var parameter = parameters[dist];
        var params = parameter.map(function (x) { return parseFloat(document.getElementById(dist + x).value) });
        params.unshift(0);
        pdfPath
          .datum(d3.range(Math.floor(currentView[0]), Math.ceil(currentView[1]) + 0.01, 0.01).map(function (x) {
            params[0] = x;
            return [x, Math.min(jStat[dist].pdf.apply(null, params), yMax[1])];
          }))
          .attr("d", line)
          .style("stroke-width", "5px");
        pdfArea
          .datum(d3.range(currentView[0], currentView[0] + 0.01 + (currentView[1] - currentView[0]) * currentPercent, 0.01).map(function (x) {
            params[0] = x;
            return [x, Math.min(jStat[dist].pdf.apply(null, params), yMax[1])];
          }))
          .attr("d", area)
          .style("opacity", "0.5");
        cdfPath
          .datum(d3.range(currentView[0], currentView[0] + 0.01 + (currentView[1] - currentView[0]) * currentPercent, 0.01).map(function (x) {
            params[0] = x;
            return [x, jStat[dist].cdf.apply(null, params)];
          }))
          .attr("d", line)
          .style("stroke-width", "5px");
      } else {
        pdfPath.style("stroke-width", "0px");
        pdfArea.style("opacity", "0");
        cdfPath.style("stroke-width", "0px");
      }
    } catch (e) {
      console.error("Error generating sample for distribution:", dist, e);
    }
  }

  function create_slider(callback, svg, width, height, padding) {
    const sliderScale = d3.scaleLinear().domain([0, 1]).range([padding, width - padding]);
  
    const sliderGroup = svg.append("g")
      .attr("class", "giant-slider")
      .attr("transform", `translate(0, ${height})`);
  
    // Full slider line (background track)
    sliderGroup.append("line")
      .attr("x1", sliderScale(0))
      .attr("x2", sliderScale(1))
      .attr("stroke", "#888")
      .attr("stroke-width", 4);
  
    // Filled portion of slider
    const fill = sliderGroup.append("line")
      .attr("x1", sliderScale(0))
      .attr("x2", sliderScale(0))
      .attr("stroke", "#FF8B22")
      .attr("stroke-width", 4);
  
    // Handle (draggable circle)
    const handle = sliderGroup.append("circle")
      .attr("r", 8)
      .attr("cx", sliderScale(0))
      .attr("fill", "#FF8B22")
      .attr("class", "handle")
      .call(d3.drag()
        .on("drag", function(event) {
          const x = Math.max(sliderScale(0), Math.min(sliderScale(1), event.x));
          const val = sliderScale.invert(x);
          handle.attr("cx", sliderScale(val));
          fill.attr("x2", sliderScale(val)); // update fill width
          callback(val);
        })
      );

    // Reset function
    return () => {
      handle.attr("cx", sliderScale(0));
      fill.attr("x2", sliderScale(0));
      callback(0);
    };
  }




  $(".inputDist").on("input", function(e) {
    var id = this.parentNode.id.replace(/^parameters-/, '');
    currentDist = id;
    centerOnDistribution(currentDist);
    updateRangeInput($(this).val(), this.id);
    redrawPath(currentDist);

  });

    function updateRangeInput(n, id) {
    d3.select("#"+id+"-value").text(n);
  };

  function slide(val) {
    currentPercent = val;
    redrawPath(currentDist);
  // --- Zoom Behavior Setup ---
  const zoom = d3.zoom()
    .scaleExtent([0.5, 10])
    .translateExtent([[0, 0], [width, height]])
    .on("zoom", zoomed);

  svgDist.call(zoom);  // Attach zoom to SVG

  function zoomed(event) {
    const transform = event.transform;
    const newX = transform.rescaleX(xScaleDist);
    const newY = transform.rescaleY(yScaleDist);

    xDist.call(xAxisDist.scale(newX));
    yDist.call(yAxisDist.scale(newY));

    // Redraw paths using new scales
    if (pdfPath.datum()) {
      pdfPath.attr("d", d3.line()
        .x(d => newX(d[0]))
        .y(d => newY(d[1]))
        .curve(d3.curveBasis)(pdfPath.datum()));
    }

    if (cdfPath.datum()) {
      cdfPath.attr("d", d3.line()
        .x(d => newX(d[0]))
        .y(d => newY(d[1]))
        .curve(d3.curveBasis)(cdfPath.datum()));
    }

    if (pdfArea.datum()) {
      pdfArea.attr("d", d3.area()
        .x(d => newX(d[0]))
        .y0(newY(0))
        .y1(d => newY(d[1]))
        .curve(d3.curveBasis)(pdfArea.datum()));
    }
  }
}

  //Handles discrete/continuous radio buttons
  $("input[name='distributions']").on("change", function () {
      $('.definition').toggle();
      $('.distribution').css('display','none');
      $('.distributions').val(function () {
        return $(this).find('option').filter(function () {
            return $(this).prop('defaultSelected');
        }).val();
      });
      currentDist = dist;
      $('#descriptionTable').css('display','none');
      $('#resetDist').css('display','none').click();
      $('.giant-slider').css('display','none');
  });

  //Draw Distribution
  $('.distributions').on('change', function() {
    var dist = $(this).find("option:selected").val();
    $('.distribution').hide();
    $('.' + dist).show();
    currentDist = dist;
    $("#descriptionTable").css("display", "table");
    $("#resetDist").css("display", "inline-block");
    centerOnDistribution(currentDist); 
    redrawPath(currentDist); // ✅ Ensure graph updates
  });
  
  


  //Reset function
  $('#resetDist').on('click', function() {
  	distributions.map(function(x){
  		var paramNames = parameters[x];
  		var paramValues = initialParameters[x];
  		for (var i = paramNames.length - 1; i >= 0; i--) {
  			updateRangeInput(paramValues[i], x+paramNames[i]);
  			$('#'+x+paramNames[i]).val(paramValues[i]);
  		};
  	});
    currentView = initialView[currentDist];
    xScaleDist.domain(currentView);
    yScaleDist.domain([0, 1]);
    d3.zoom()
  .scaleExtent([1, 10]) // optional
  .on("zoom", (event) => {
    const transform = event.transform;
    // Rescale axes
    const newX = transform.rescaleX(xScaleDist);
    const newY = transform.rescaleY(yScaleDist);
    })
    xDist.call(xAxisDist);
    yDist.call(yAxisDist);
    currentPercent = 0;
    $("#percentDist").val(0);
    reset_slider();
    redrawPath(currentDist);
  });

  //Update SVG based on width of container
	var wpad = 10;
  var hpad = 40;

  var reset_slider = create_slider(slide, svgDist, width - 2 * wpad, height, wpad);


	yScaleDist.range([height-hpad, hpad]);
	xScaleDist.range([wpad, width-wpad]);
  d3.zoom()
  .scaleExtent([1, 10]) // optional
  .on("zoom", (event) => {
    const transform = event.transform;
    // Rescale axes
    const newX = transform.rescaleX(xScaleDist);
    const newY = transform.rescaleY(yScaleDist);

    svg.select(".x-axis").call(d3.axisBottom(newX));
    svg.select(".y-axis").call(d3.axisLeft(newY));

    // Transform any elements (like bars/points)
    chartArea.selectAll(".bar")
      .attr("x", d => newX(d.x0))
      .attr("width", d => Math.max(0, newX(d.x1) - newX(d.x0) - 1));
  });

  control.attr("transform", "translate(" + (width-120) + "," + hpad + ")")

	xDist.attr("transform", "translate(0," + (height - hpad) + ")").call(xAxisDist);
	yDist.attr("transform", "translate(" + wpad + ",0)").call(yAxisDist);
	shift.attr("x", wpad).attr("y", hpad).attr("width", width-2*wpad).attr("height", height-2*hpad);
	clip.attr("x", wpad).attr("y", hpad-2).attr("width", width-2*wpad).attr("height", height-2*hpad+4);

	redrawPath(currentDist);

}
//*******************************************************************************//
//Central Limit Theorem
//*******************************************************************************//

function clt() {
  // constants
  var margin = {top: 15, right: 5, bottom: 15, left: 5};
  var width = 1000;
  var height = 400;

  x_scale_clt = d3.scaleLinear().domain([0, 1]).range([0, width]);
  y_scale_clt = d3.scaleLinear().domain([0, 3]).range([height / 3 - 50, 0]);
  z_scale_clt = d3.scaleLinear().domain([0, 3]).range([0, height/3]);

  // create svg
  var svg_clt = d3.select("#graph").append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin.top + margin.bottom))
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



  // horizontal bars and paths
  svg_clt.call(draw_bar, height/3, "population");
  svg_clt.call(draw_bar, height/2, "samples");
  svg_clt.call(draw_bar, height, "sampling distribution");

  sampling_path = svg_clt.append("path").attr("id", "pdf-clt");
  sampling_area = svg_clt.append("path").attr("id", "pdfArea-clt");
  theoretical_path = svg_clt.append("path").attr("id", "cdf-clt").attr("opacity", 0);

  function draw_population() {
    var line = d3.line()
      .x(d => x_scale_clt(d[0]))
      .y(d => y_scale_clt(d[1]))
      .curve(d3.curveBasis);

    var area = d3.area()
      .x(d => x_scale_clt(d[0]))
      .y1(d => y_scale_clt(d[1]))
      .y0(y_scale_clt(0))
      .curve(d3.curveBasis);
  
    var datum = [];
  
    try {
      // Populate datum based on distribution
      if (currentDist === "beta") {
        const alpha = +document.getElementById("BetaAlpha").value;
        const beta = +document.getElementById("BetaBeta").value;
        datum = d3.range(0, 1.01, 0.01).map(x => [x, Math.min(jStat.beta.pdf(x, alpha, beta))]);
      } 
      else if (currentDist === "normal") {
        const mu = +document.getElementById("normalMu").value;
        const sigma = +document.getElementById("normalSigma").value;
        datum = d3.range(mu - 5 * sigma, mu + 5 * sigma, 0.1).map(x => [x, jStat.normal.pdf(x, mu, sigma)]);
      } 
      else if (currentDist === "uniform") {
        const min = +document.getElementById("uniformA").value;
        const max = +document.getElementById("uniformB").value;
        const height = 1 / (max - min);
        datum = [[min, height], [max, height]];
      }
      else if (currentDist === "bernoulli") {
        const p = +document.getElementById("bernoulliP").value;
        datum = [[0, 1 - p], [1, p]];
      }
      else if (currentDist === "binomialDiscrete") {
        const n = +document.getElementById("binomialN").value;
        const p = +document.getElementById("binomialP").value;
        datum = d3.range(0, n + 1).map(x => [x, jStat.binomial.pdf(x, n, p)]);
      }
      else if (currentDist === "geometric") {
        const p = +document.getElementById("geometricP").value;
        datum = d3.range(0, 15, 1).map(x => [x, jStat.geometric.pdf(x, p)]);
      }
      else if (currentDist === "poisson") {
        const lambda = +document.getElementById("poissonLambda").value;
        datum = d3.range(0, lambda * 3, 1).map(x => [x, jStat.poisson.pdf(x, lambda)]);
      }
      else if (currentDist === "negativebinomial") {
        const r = +document.getElementById("negativebinomialR").value;
        const p = +document.getElementById("negativebinomialP").value;
        datum = d3.range(0, r * 5, 1).map(x => [x, jStat.negbin.pdf(x, r, p)]);
      }
      else if (currentDist === "gamma") {
        const shape = +document.getElementById("gammaK").value;
        const scale = +document.getElementById("gammaTheta").value;
        datum = d3.range(0, shape * scale * 5, 0.5).map(x => [x, jStat.gamma.pdf(x, shape, scale)]);
      }
      else if (currentDist === "exponential") {
        const lambda = +document.getElementById("exponentialLambda").value;
        datum = d3.range(0, 10 / lambda, 0.1).map(x => [x, jStat.exponential.pdf(x, lambda)]);
      }
      else if (currentDist === "chisquare") {
        const k = +document.getElementById("chisquareK").value;
        datum = d3.range(0, 5 * k, 0.5).map(x => [x, jStat.chisquare.pdf(x, k)]);
      }
      else if (currentDist === "studentt") {
        const k = +document.getElementById("studenttK").value;
        datum = d3.range(-10, 10, 0.1).map(x => [x, jStat.studentt.pdf(x, k)]);
      }
    } catch (error) {
      console.error("Error generating distribution data:", error);
    }
  
    // --- ✅ Auto-rescale based on generated datum ---
    if (datum.length > 0) {
      const xExtent = d3.extent(datum, d => d[0]);
      const yMax = d3.max(datum, d => d[1]);
  
      x_scale_clt.domain(xExtent).nice();
      z_scale_clt.domain([0, yMax * 1.1]).nice();  // Slight padding
    }
  
    // Redraw the population path
    sampling_path.datum(datum).attr("d", line);
    sampling_area.datum(datum).attr("d", area);
  }
  
  
  // Update sampling distributions
  function draw_sampling() {
  // path function
  var line = d3.line()
  .x(function(d) { return x_scale_clt(d[0])})
  .y(function(d) { return y1 - z_scale_clt(d[1])})
  .curve(d3.curveBasis);
  // area function
  var area = d3.area()
  .x(function(d) { return x_scale_clt(d[0])})
  .y0(y1)
  .y1(function(d) { return y1 - z_scale_clt(d[1])})
  .curve(d3.curveBasis);
  // pdf data
  var datum = d3.range(0, 1.05, 0.05).map(function(x) { 
  return [x, Math.min(jStat.beta.pdf(x, alpha, beta),10)]; 
  })
  // update sampling distribution
  sampling_path.datum(datum).attr("d", line);
  sampling_area.datum(datum).attr("d", area);
  
  }
  
  // draw theoretical distribution
  function draw_theoretical() {
  var line = d3.line()
  .x(d => x_scale_clt(d[0]))
  .y(d => 3 * y2 + y_scale_clt(d[1]))
  .curve(d3.curveBasis);
  
  let mean, variance;
  let datum = [];
  
  try {
  if (n === 1) {
    // When sample size is 1, theoretical is the *same* as population distribution
    if (currentDist === "beta") {
      const alpha = +document.getElementById("BetaAlpha").value;
      const beta = +document.getElementById("BetaBeta").value;
      datum = d3.range(0, 1.01, 0.01).map(x => [x, jStat.beta.pdf(x, alpha, beta)]);
    } 
    else if (currentDist === "normal") {
      const mu = +document.getElementById("normalMu").value;
      const sigma = +document.getElementById("normalSigma").value;
      datum = d3.range(mu - 5 * sigma, mu + 5 * sigma, 0.1).map(x => [x, jStat.normal.pdf(x, mu, sigma)]);
    }
    else if (currentDist === "uniform") {
      const min = +document.getElementById("uniformA").value;
      const max = +document.getElementById("uniformB").value;
      const height = 1 / (max - min);
      datum = [[min, height], [max, height]];
    }
    else if (currentDist === "bernoulli") {
      const p = +document.getElementById("bernoulliP").value;
      datum = [[0, 1 - p], [1, p]];
    }
    else if (currentDist === "binomialDiscrete") {
      const trials = +document.getElementById("binomialN").value;
      const p = +document.getElementById("binomialP").value;
      datum = d3.range(0, trials + 1).map(x => [x, jStat.binomial.pdf(x, trials, p)]);
    }
    else if (currentDist === "geometric") {
      const p = +document.getElementById("geometricP").value;
      datum = d3.range(0, 15, 1).map(x => [x, jStat.geometric.pdf(x, p)]);
    }
    else if (currentDist === "poisson") {
      const lambda = +document.getElementById("poissonLambda").value;
      datum = d3.range(0, lambda * 3, 1).map(x => [x, jStat.poisson.pdf(x, lambda)]);
    }
    else if (currentDist === "gamma") {
      const shape = +document.getElementById("gammaK").value;
      const scale = +document.getElementById("gammaTheta").value;
      datum = d3.range(0, shape * scale * 5, 0.5).map(x => [x, jStat.gamma.pdf(x, shape, scale)]);
    }
    else if (currentDist === "exponential") {
      const lambda = +document.getElementById("exponentialLambda").value;
      datum = d3.range(0, 10 / lambda, 0.1).map(x => [x, jStat.exponential.pdf(x, lambda)]);
    }
    else if (currentDist === "chisquare") {
      const k = +document.getElementById("chisquareK").value;
      datum = d3.range(0, 5 * k, 0.5).map(x => [x, jStat.chisquare.pdf(x, k)]);
    }
    else if (currentDist === "studentt") {
      const df = +document.getElementById("studenttK").value;
      datum = d3.range(-10, 10, 0.1).map(x => [x, jStat.studentt.pdf(x, df)]);
    }
  } else {
    // When n > 1, approximate sampling mean with a Normal distribution
    if (currentDist === "beta") {
      const alpha = +document.getElementById("BetaAlpha").value;
      const beta = +document.getElementById("BetaBeta").value;
      mean = jStat.beta.mean(alpha, beta);
      variance = jStat.beta.variance(alpha, beta) / n;
      datum = d3.range(0, 1.05, 0.01).map(x => [x, jStat.normal.pdf(x, mean, Math.sqrt(variance))]);
    }
    else if (currentDist === "normal") {
      const mu = +document.getElementById("normalMu").value;
      const sigma = +document.getElementById("normalSigma").value;
      mean = mu;
      variance = (sigma * sigma) / n;
      datum = d3.range(mu - 5 * Math.sqrt(variance), mu + 5 * Math.sqrt(variance), 0.1).map(x => [x, jStat.normal.pdf(x, mean, Math.sqrt(variance))]);
    }
    else if (currentDist === "uniform") {
      const min = +document.getElementById("uniformA").value;
      const max = +document.getElementById("uniformB").value;
      mean = (min + max) / 2;
      variance = ((max - min) ** 2) / 12 / n;
      datum = d3.range(min - 1, max + 1, 0.1).map(x => [x, jStat.normal.pdf(x, mean, Math.sqrt(variance))]);
    }
    else if (currentDist === "bernoulli") {
      const p = +document.getElementById("bernoulliP").value;
      mean = p;
      variance = p * (1 - p) / n;
      datum = d3.range(-0.5, 1.5, 0.01).map(x => [x, jStat.normal.pdf(x, mean, Math.sqrt(variance))]);
    }
    else if (currentDist === "binomialDiscrete") {
      const trials = +document.getElementById("binomialN").value;
      const p = +document.getElementById("binomialP").value;
      mean = trials * p;
      variance = trials * p * (1 - p) / n;
      datum = d3.range(0, trials + 5, 0.1).map(x => [x, jStat.normal.pdf(x, mean, Math.sqrt(variance))]);
    }
    else if (currentDist === "geometric") {
      const p = +document.getElementById("geometricP").value;
      mean = (1 - p) / p;
      variance = (1 - p) / (p * p) / n;
      datum = d3.range(0, 20, 0.1).map(x => [x, jStat.normal.pdf(x, mean, Math.sqrt(variance))]);
    }
    else if (currentDist === "poisson") {
      const lambda = +document.getElementById("poissonLambda").value;
      mean = lambda;
      variance = lambda / n;
      datum = d3.range(0, lambda * 3, 0.1).map(x => [x, jStat.normal.pdf(x, mean, Math.sqrt(variance))]);
    }
    else if (currentDist === "gamma") {
      const shape = +document.getElementById("gammaK").value;
      const scale = +document.getElementById("gammaTheta").value;
      mean = shape * scale;
      variance = (shape * scale * scale) / n;
      datum = d3.range(0, mean + 5 * Math.sqrt(variance), 0.1).map(x => [x, jStat.normal.pdf(x, mean, Math.sqrt(variance))]);
    }
    else if (currentDist === "exponential") {
      const lambda = +document.getElementById("exponentialLambda").value;
      mean = 1 / lambda;
      variance = 1 / (lambda * lambda) / n;
      datum = d3.range(0, 10 / lambda, 0.1).map(x => [x, jStat.normal.pdf(x, mean, Math.sqrt(variance))]);
    }
    else if (currentDist === "chisquare") {
      const k = +document.getElementById("chisquareK").value;
      mean = k;
      variance = 2 * k / n;
      datum = d3.range(0, 5 * k, 0.1).map(x => [x, jStat.normal.pdf(x, mean, Math.sqrt(variance))]);
    }
    else if (currentDist === "studentt") {
      const df = +document.getElementById("studenttK").value;
      mean = 0;
      variance = df / (df - 2) / n;
      datum = d3.range(-5, 5, 0.1).map(x => [x, jStat.normal.pdf(x, mean, Math.sqrt(variance))]);
    }
  }
  
  // Update path
  theoretical_path.datum(datum).attr("d", line);
  
  } catch (e) {
  console.error("Error in draw_theoretical:", e);
  }
  }
  function draw_histogram() {
  
    // create histogram
    var histogram = d3.histogram()
      .domain(x_scale_clt.domain())
      .thresholds(x_scale_clt.ticks(bins));
    var bars = svg_clt.append("g").attr("class", "histogram");
    var data = histogram(counts);
    var ymax = d3.max(data.map(d => d.length));
    z_scale_clt.domain([0, ymax]).nice();
    var bar = bars.selectAll("g").data(data);
  
    var barEnter = bar.enter().append("g").attr("class", "bar");
    barEnter.append("rect");
    barEnter.append("text")
      .attr("y", 3 * y1 - 15)
      .attr("text-anchor", "middle");
  
      bar.select("rect")
      .attr("x", d => x_scale_clt(d.x0) + 1)
      .attr("width", d => Math.max(0, x_scale_clt(d.x1) - x_scale_clt(d.x0) - 1))
      .transition().duration(250)
      .attr("y", d => (3 * y1) - z_scale_clt(d.length))   // y of top of bar
      .attr("height", d => z_scale_clt(d.length));         // height from top down
  
  
    bar.select("text")
      .attr("x", d => x_scale_clt((d.x0 + d.x1) / 2))
      .text(d => d.length > 0 ? d3.format(".0%")(d.length / counts.length) : "");
  
    bar.exit().remove();
  }

  // Zoom behavior
  var zoom_clt = d3.zoom()
  .scaleExtent([0.5, 20])
  .translateExtent([[-Infinity, 0], [Infinity, height]])
  .on("zoom", zoomed_clt);

  svg_clt.call(zoom_clt);

  function zoomed_clt(event) {
    var transform = event.transform;
    var newX = transform.rescaleX(x_scale_clt);
    x_scale_clt.domain(newX.domain());

    draw_population();
    draw_histogram();
    draw_theoretical();

  }
  // Creates Circles and transitions
  function tick() {
    var data = [];
    for (var i = 0; i < n; i++) {
      if (currentDist === "bernoulli") {
        var p = +document.getElementById("bernoulliP").value;
        data.push(Math.random() < p ? 1 : 0);
      } else if (currentDist === "binomialDiscrete") {
        var trials = +document.getElementById("binomialN").value;
        var prob = +document.getElementById("binomialP").value;
        data.push(jStat.binomialDiscrete.sample(trials, prob));
      } else if (currentDist === "geometric") {
        var p = +document.getElementById("geometricP").value;
        data.push(jStat.geometric.sample(p));
      } else if (currentDist === "poisson") {
        var lambda = +document.getElementById("poissonLambda").value;
        data.push(jStat.poisson.sample(lambda));
      } else if (currentDist === "negativebinomial") {
        var r = +document.getElementById("negativebinomialR").value;
        var p = +document.getElementById("negativebinomialP").value;
        data.push(jStat.negbin.sample(r, p));
      } else if (currentDist === "beta") {
        var alpha = +document.getElementById("BetaAlpha").value;
        var beta = +document.getElementById("BetaBeta").value;
        data.push(jStat.beta.sample(alpha, beta));
      } else if (currentDist === "normal") {
        var mu = +document.getElementById("normalMu").value;
        var sigma = +document.getElementById("normalSigma").value;
        data.push(jStat.normal.sample(mu, sigma));
      } else if (currentDist === "uniform") {
        var min = +document.getElementById("uniformA").value;
        var max = +document.getElementById("uniformB").value;
        data.push(min + Math.random() * (max - min));
      } else if (currentDist === "gamma") {
        var shape = +document.getElementById("gammaK").value;
        var scale = +document.getElementById("gammaTheta").value;
        data.push(jStat.gamma.sample(shape, scale));
      } else if (currentDist === "exponential") {
        var lambda = +document.getElementById("exponentialLambda").value;
        data.push(jStat.exponential.sample(lambda));
      } else if (currentDist === "chisquare") {
        var k = +document.getElementById("chisquareK").value;
        data.push(jStat.chisquare.sample(k));
      } else if (currentDist === "studentt") {
        var k = +document.getElementById("studenttK").value;
        data.push(jStat.studentt.sample(k));
      }
    }
  
    var mean = d3.mean(data);

    var group = svg_clt.append("g").attr("class", "ball-group");

    // Capture the enter selection!
    var balls = group.selectAll(".ball")
      .data(data)
      .enter() // << here's the important part
      .append("circle")
      .attr("class", "ball")
      .attr("cx", function(d) { return x_scale_clt(d); })
      .attr("cy", y1)
      .attr("r", 5);

    var i = 0, j = 0;

    balls.transition()
      // .duration(dt)
      .attr("cy", y1 + y2 - 5)
      .each(function() { ++i; })
      .on("end", function() {
        if (!--i) {
          balls
            .transition()
            .duration(400)
            .attr("cx", x_scale_clt(mean))
            .style("fill", "#FF8B22")
            .transition()
            .duration(400)
            .attr("cy", 3 * y1 - 3)
            .attr("r", 3)
            .each(function() { ++j; })
            .on("end", function() {
              if (!--j) {
                counts.push(mean);
                draw_histogram();
                draw_sampling();
              }
              d3.select(this).remove();
            });
        }
      });
  }


  // initiate sampling
  function sample() {
    if (!sampling) {
      sampling = true;
      samplingInterval = setInterval(tick, 500);  // draws every 100ms
      document.getElementById("sampleButton").textContent = "Stop Sampling";
    } else {
      sampling = false;
      clearInterval(samplingInterval);
      document.getElementById("sampleButton").textContent = "Start Sampling";
    }
  }



  // reset and clear CLT
  function reset_clt() {
    clearInterval(samplingInterval);
    counts = [];
    svg_clt.selectAll("circle").remove();
    svg_clt.selectAll(".bar").remove();
    y_scale_clt.domain([0, 3]);
    draw_population();

    draw_theoretical()

    draw_histogram();
}

  // Attach event listeners to CLT parameter sliders
  $(".clt-params input[type='range']").on("input", function() {
    const spanId = this.id + "-value";
    $("#" + spanId).text(this.value);
    draw_population(); // Redraw the population when a CLT parameter changes
  });

  $(document).on("input", ".inputDist", function() {
    const id = $(this).attr("id");
    $("#" + id + "-value").text($(this).val());

    draw_population();

    draw_theoretical()

    draw_histogram();
  });


  // update sample size
  d3.select("#sample").on("input", function() {
    n = +this.value;
    d3.select("#sample-value").text(n);
    reset_clt();
  	});

  // update number of draws
  d3.select("#draws").on("input", function() {
    draws = +this.value;
    d3.select("#draws-value").text(draws);
  });

  // theoretical on/off
  $("#theoretical").change(function() {
     if($(this).is(":checked")) {
        theoretical_path.attr("opacity", 1);
     } else {
        theoretical_path.attr("opacity", 0);
     }
     draw_sampling();
  });

  // drop balls
  document.getElementById("sampleButton").addEventListener("click", sample);
  document.getElementById("resetButton").addEventListener("click", reset_clt);


  // Handle distribution change
  d3.select("#cltDist").on("change", function () {
    currentDist = this.value;
  
    // Show relevant parameter controls
    $('.clt-params').hide();
    $('#parameters-' + currentDist).show();
  
    // Redraw the population curve and reset sample
    draw_population();

    draw_theoretical()

    draw_histogram();
  });

  $('.clt-params').hide();
  $('#parameters-' + currentDist).show();

}

//Handles functionality of Distributions
$(window).load(function () {
  $(document).ready(function() {
    clt();
    discrete_continuous();
    $(".distribution").hide();
    $(".bernoulli").show();
    $("#descriptionTable").css("display", "table");
    $("#resetDist").css("display", "inline-block");
    $('.distributions').val(currentDist);
    centerOnDistribution(currentDist);
 });

});