//Handles functionality of Distributions
$(window).load(function () {
  discrete_continuous();
  clt();
});

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
                       
  var initialView = {'bernoulli':[-1,5], 
                     'binomialDiscrete':[-1,5], 
                     'negbin':[-1,5], 
                     'geometric':[-1,5], 
                     'poisson':[-1,5],
                     'uniform':[-6,6], 
                     'normal':[-5,5], 
                     'studentt':[-5,5], 
                     'chisquare':[-1,8], 
                     'exponential':[-1,5], 
                     'centralF':[-1,5],
                      "":[-5,5], 
                      'gamma': [-1,5], 
                      'beta': [-0.5,1.5]};

  var currentDist="";
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


  //Handle zoom and scale
  var zoom = d3.zoom()
      .scaleExtent([0.25, 4])
      .on("zoom", zoomed);


  //Zoom function
  function zoomed() {
  	if (xScaleDist.domain()[0] < xMax[0]) {
  	    var x = zoom.translate()[0] - xScaleDist(xMax[0]) + xScaleDist.range()[0];
  	    zoom.translate([x, 0]);
  	}
  	if (xScaleDist.domain()[1] > xMax[1]) {
  	    var x = zoom.translate()[0] - xScaleDist(xMax[1]) + xScaleDist.range()[1];
  	    zoom.translate([x, 0]);
  	}
  	if (yScaleDist.domain()[0] != yMax[0]) {
  	    var y = zoom.translate()[1] - yScaleDist(yMax[0]) + yScaleDist.range()[0];
  	    zoom.translate([zoom.translate()[0], y]);
  	}
  	if (yScaleDist.domain()[1] > yMax[1]) {
  	    var y = zoom.translate()[1] - yScaleDist(yMax[1]) + yScaleDist.range()[1];
  	    zoom.translate([zoom.translate()[0], y]);
  	}
  	//Update X axis
  	xDist.call(xAxisDist);
  	//Update Y axis
  	yDist.call(yAxisDist);
  	//Update current view area
  	currentView = xScaleDist.domain();

  	redrawPath(currentDist);
  }

  //Add control buttons for zoom and pan
  function move() {
    svgDist.call(zoom.event); // https://github.com/mbostock/d3/issues/2387

    // Record the coordinates (in data space) of the center (in screen space).
    var center0 = zoom.center(), translate0 = zoom.translate(), dir = +this.getAttribute("data-move");
    var translate = translate0[0]+center0[0]*dir;
    // Translate from center.
    zoom.translate([translate, 0]);

    svgDist.transition().duration(1000).call(zoom.event);
  }

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

  control.selectAll('image.move')
          .data(['left','right'])
          .enter()
          .append('image')
          .attr("xlink:href", function(d,i) { return "./img/"+d+".png"; })
          .attr("x", function(d,i) {return i*50;})
          .attr("y", 10)
          .attr("width", 25)
          .attr("height", 25)
          .attr("class", "move")
          .attr("data-move",function(d,i) {return 1 + i*-2;})
          .on("click", move);

  control.selectAll('image.scale')
          .data(['plus','minus'])
          .enter()
          .append('image')
          .attr("xlink:href", function(d,i) { return "./img/"+d+".png"; })
          .attr("x", 25)
          .attr("y", function(d,i) {return i*25;})
          .attr("width", 25)
          .attr("height", 25)
          .attr("class", "scale")
          .attr("data-zoom",function(d,i) {return 1 + i*-2;})
          .on("click", scale);

  // Draw PDF/CDF Path
  function redrawPath(dist) {
    if(dist != "") {
    	var line = d3.line()
    	  .x(function(d) { return xScaleDist(d[0])})
    	  .y(function(d) { return yScaleDist(d[1])})
    	  .curve(d3.curveBasis);
    	var area = d3.area()
    	  .x(function(d) { return xScaleDist(d[0])})
    	  .y0(yScaleDist(0))
    	  .y1(function(d) { return yScaleDist(d[1])})
    	  .interpolate("linear");
    	var parameter = parameters[dist];
    	var params = parameter.map(function(x){return parseFloat(document.getElementById(dist+x).value)});
    	params.unshift(0);
    	pdfPath
    	  .datum(d3.range(Math.floor(currentView[0]),Math.ceil(currentView[1])+0.01,0.01).map(function(x) { 
    	  	params[0] = x;
    	  	return [x, Math.min(jStat[dist].pdf.apply(null, params),yMax[1])]; }))
    	  .attr("d", line)
    	  .style("stroke-width", "5px");
    	pdfArea
    	  .datum(d3.range(currentView[0],currentView[0]+0.01+(currentView[1]-currentView[0])*currentPercent,0.01).map(function(x) { 
    	  	params[0] = x;
    	  	return [x, Math.min(jStat[dist].pdf.apply(null, params),yMax[1])]; }))
    	  .attr("d", area)
        .style("opacity", "0.5");
    	cdfPath
    	  .datum(d3.range(currentView[0],currentView[0]+0.01+(currentView[1]-currentView[0])*currentPercent,0.01).map(function(x) { 
    	  	params[0] = x;
    	  	return [x, jStat[dist].cdf.apply(null, params)]; }))
    	  .attr("d", line)
        .style("stroke-width", "5px");
    } else {
      pdfPath.style("stroke-width", "0px");
      pdfArea.style("opacity", "0");
      cdfPath.style("stroke-width", "0px");
    }
  }

  function create_slider(callback, svg, width, height, padding) {
    const sliderScale = d3.scaleLinear().domain([0, 1]).range([padding, width - padding]);

    const sliderGroup = svg.append("g")
      .attr("class", "giant-slider")
      .attr("transform", `translate(0, ${height - 30})`);

    sliderGroup.append("line")
      .attr("x1", sliderScale(0))
      .attr("x2", sliderScale(1))
      .attr("stroke", "#888")
      .attr("stroke-width", 4);

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
          callback(val);
        })
      );

    return () => {
      handle.attr("cx", sliderScale(0));
      callback(0);
    };
  }

  //Update Range Input
  $(".inputDist").on("input", function(e) {
  	updateRangeInput($(this).val(), this.id);
  	redrawPath(this.parentNode.id);
  	});
  function updateRangeInput(n, id) {
    d3.select("#"+id+"-value").text(round(n,2));
  };

  // //Update Percent Input
  // $("#percentDist").on("input", function(e) {
  // 	currentPercent = $(this).val();
  // 	redrawPath(currentDist);
  // 	});
  // slide function
  function slide(val) {
    currentPercent = val;
    redrawPath(currentDist);
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
      currentDist = "";
      $('#descriptionTable').css('display','none');
      $('#resetDist').css('display','none').click();
      $('.giant-slider').css('display','none');
  });

  //Draw Distribution
  $('.distributions').on('change', function(){
      var dist = $(this).find("option:selected").prop('value');
      $('.distribution').css('display','none');
      $('.'+dist).toggle();
      currentDist = dist;
      $('#descriptionTable').css('display','table');
      $('#resetDist').css('display','inline-block').click();
      $('.giant-slider').css('display','block');
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
    zoom.x(xScaleDist).y(yScaleDist);
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

// svg.call(zoom)
//    .call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2));

  control.attr("transform", "translate(" + (width-120) + "," + hpad + ")")

	xDist.attr("transform", "translate(0," + (height - hpad) + ")").call(xAxisDist);
	yDist.attr("transform", "translate(" + wpad + ",0)").call(yAxisDist);
	shift.attr("x", wpad).attr("y", hpad).attr("width", width-2*wpad).attr("height", height-2*hpad).call(zoom);
	clip.attr("x", wpad).attr("y", hpad-2).attr("width", width-2*wpad).attr("height", height-2*hpad+4);

	redrawPath(currentDist);

}
//*******************************************************************************//
//Central Limit Theorem
//*******************************************************************************//

function clt() {
  // define width, height, margin
  var margin = {top: 15, right: 5, bottom: 15, left: 5};
  var width = 800;//parseInt(d3.select("#graph").style("width")) - margin.left - margin.right,
      height = 500;
  // create svg
  var svg_clt = d3.select("#graph").append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin.top + margin.bottom))
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // constants
  var dt = 100,
      n = 1,
      draws = 1,
      alpha = 1,
      beta = 1,
      y1 = height / 3,
      y2 = height / 4,
      bins = 20,
      counts = [],
      interval_clt;


  // scales
  var x_scale_clt = d3.scaleLinear().domain([0, 1]).range([0, width]);
  var y_scale_clt = d3.scaleLinear().domain([0, 3]).range([0, height - (2*y1)]);
  var z_scale_clt = d3.scaleLinear().domain([0, 3]).range([0, y1]);


  // clip path
  var clip_clt = svg_clt.append("clipPath")
                  .attr("id", "view_clt")
                  .append("rect")
                  .attr("x", 0)
                  .attr("y", height - (2*y1 - y2))
                  .attr("width", width)
                  .attr("height", (2*y1 - y2));

  // draw horizontal bar
  function draw_bar(selection, dy, label) {
    // group
    var axis = selection.append("g").attr("class", "axis");
    // bar
    axis.append("line")
      .attr("x1", x_scale_clt(0))
      .attr("x2", x_scale_clt(1))
      .attr("y1", dy)
      .attr("y2", dy);
    // label
    axis.append("text")
      .attr("x", x_scale_clt(0))
      .attr("y", dy)
      .attr("dy", "1em")
      .text(label);
  };
  // create three bars
  svg_clt.call(draw_bar, y1, "draw");
  svg_clt.call(draw_bar, y1+y2, "average");
  svg_clt.call(draw_bar, 3*y1, "count");


  // path and area elements
  var sampling_path = svg_clt.append("path").attr("id", "pdf"),
      sampling_area = svg_clt.append("path").attr("id", "pdfArea"),
      theoretical_path = svg_clt.append("path")
                                .attr("id", "cdf")
                                .attr("opacity", 0)
                                .attr("clip-path", "url(#view_clt)")
                                .moveToBack();

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
    // draw threoretical
    draw_theoretical(datum);
  }

  // draw theoretical distribution
  function draw_theoretical(datum) {
    // path function
    var line = d3.line()
      .x(function(d) { return x_scale_clt(d[0])})
      .y(function(d) { return 3*y1 - y_scale_clt(d[1])})
      .curve(d3.curveBasis);
    // update theoretical distribution
    if (n == 1) {
      theoretical_path.datum(datum).attr("d", line);
      //y_scale_clt.domain([0,3]);
    } else {
      var mean = jStat.beta.mean(alpha, beta);
      var variance = jStat.beta.variance(alpha, beta)/n;
      var x_mode = jStat.normal.mode(mean, Math.sqrt(variance));
      y_scale_clt.domain([0, jStat.normal.pdf(x_mode, mean, Math.pow(variance,0.5))]);
      datum = d3.range(0, 1.05, 0.01).map(function(x) { return [x, jStat.normal.pdf(x, mean, Math.pow(variance,0.5))]; });
      theoretical_path.datum(datum).attr("d", line);
    }
  }

  // create histogram
  var histogram = d3.histogram()
  .domain(x_scale_clt.domain())
  .thresholds(x_scale_clt.ticks(bins));
  var bars = svg_clt.append("g").attr("class", "histogram");

  function draw_histogram() {
    // get histrogram of counts
    var data = histogram(counts);
    // update scale
    var ymax = d3.max(data.map(function(d) { return d.y; }));
    y_scale_clt.domain([0, ymax*bins]);
    // enter bars
    var bar = bars.selectAll("g").data(data);
    var barEnter = bar.enter().append("g").attr("class", "bar");
    barEnter.append("rect");
    barEnter.append("text")
      .attr("y", 3*y1 - 15)
      .attr("text-anchor", "middle");
    // update bars
    bar.select("rect")
      .attr("x", function(d) { return x_scale_clt(d.x) + 1; })
      .attr("width", x_scale_clt(data[0].dx) - 1)
    .transition().duration(250)
      .attr("y", function(d) { return 3*y1 - y_scale_clt(d.y*bins); })
      .attr("height", function(d) { return y_scale_clt(d.y*bins); });
    bar.select("text")
      .attr("x", function(d) { return x_scale_clt(d.x + 1/(2*bins)); })
      .text(function(d) { return d.y > 0 ? d3.format("%")(d.y) : ""; });
    // exit bars
    bar.exit().remove();
  };

  // Creates Circles and transitions
  function tick() {
    // take samples
    var data = [];
    for (var i = 0; i < n; i++) {
      data.push(jStat.beta.sample(alpha,beta));
    };
    var mean = d3.mean(data);
    // add balls
    var group = svg_clt.append("g").attr("class", "ball-group");
    var balls = group.selectAll(".ball").data(data);
    // animate balls
    var i = 0, j = 0;
    balls.enter()
      .append("circle")
      .attr("class", "ball")
      .attr("cx", function(d) { return x_scale_clt(d); })
      .attr("cy", y1)
      .attr("r", 5)
      .transition()
      .duration(dt)
      .attr("cy", y1 + y2 - 5)
      .each(function() { ++i; })
      .each("end", function() {
        if (!--i) {
          balls
            .transition()
            .duration(400)
            .attr("cx", x_scale_clt(mean))
            .style("fill", "#FF8B22")
            .transition()
            .duration(400)
            .attr("cy", 3*y1-3)
            .attr("r", 3)
            .each(function() { ++j; })
            .each("end", function() {
              if (!--j) {
                counts.push(mean);
                draw_histogram();
                draw_sampling();
              }
              d3.select(this).remove();
            });
        };
      });
  }

  // initiate sampling
  function start_sampling() {
    dt = 350/Math.pow(1.04, draws);
    var count = 0;
    interval_clt = setInterval(function() { 
      tick();
        if (++count === draws){
          clearInterval(interval_clt);
        }
    }, dt);
  }


  // reset and clear CLT
  function reset_clt() {
    clearInterval(interval_clt);
    counts = [];
    d3.timer.flush();
    svg_clt.selectAll("circle").remove();
    svg_clt.selectAll(".bar").remove();
    y_scale_clt.domain([0,3]);
    draw_sampling();
  }

  // update alpha
  $("#alpha_clt").on("input", function(e) {
    alpha = parseFloat($(this).val());
    d3.select("#alpha_clt-value").text(round(alpha,2));
    reset_clt();
  });

  // update beta
  $("#beta_clt").on("input", function(e) {
    beta = parseFloat($(this).val());
    d3.select("#beta_clt-value").text(round(beta,2));
    reset_clt();
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
  $("#form_clt").click(function() {
    clearInterval(interval_clt);
    start_sampling();
  });
  
  draw_sampling();
}
