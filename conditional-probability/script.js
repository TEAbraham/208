//Handles functionality of Compound Probability
$(window).load(function () {
  conditional();
});

//*******************************************************************************//
//Conditional Probability
//*******************************************************************************//
function conditional() {

  //Constants
  var currentPerspective = 'universe'
  var radius = 5;
  var eventsData = [
          { x: 1/6, y: 0.2, width: 1/3, height: 0.05, name: 'A' },
          { x: 1/3, y: 0.4, width: 1/3, height: 0.05, name: 'B' },
          { x: 1/2, y: 0.6, width: 1/3, height: 0.05, name: 'C' }
      ];
  var mapper = {0: "P(A)", 1: "P(B)", 2: "P(C)"};

  //Create SVG
  var svgBallCP = d3.select('#svgBallCP').append('svg');
  var svgProbCP = d3.select('#svgProbCP').append('svg');
  var svgTreeCP = d3.select('#svgTreeCP').append('svg');

  //Create Clip Path
  var clipCP = svgBallCP.append("clipPath").attr("id", "viewCP").append("rect");

  //Create Container
  var containerBallCP = svgBallCP.append('g').attr("clip-path", "url(#viewCP)");
  var containerProbCP = svgProbCP.append('g');
  var containerTreeCP = svgTreeCP.append('g');

  //Create Scales
  var xScaleCP = d3.scale.linear().domain([0, 1]);
  var xWidthCP = d3.scale.linear().domain([0, 1]);
  var yScaleCP = d3.scale.linear().domain([0, 1]);

  var xScaleProbCP = d3.scale.ordinal().domain([0,1,2]);
  var yScaleProbCP = d3.scale.linear().domain([0, 1]);


  //Drag Functions
  var dragRect = d3.behavior.drag()
           .origin(function() { return {x: d3.select(this).attr("x"),y:0};})
           .on('dragstart', function(){d3.select(this.parentNode).moveToFront();}) 
           .on('drag', function(d,i) {
              var x = Math.max(0,Math.min(xScaleCP.invert(d3.event.x),(1-eventsData[i].width)));
              eventsData[i].x = x;
              changePerspective(currentPerspective);
              updateRects(0);
            })
  var dragLeft = d3.behavior.drag()
           .on('dragstart', function(){d3.select(this).moveToFront();})
           .on('drag', function(d,i) {
              var x = Math.max(0,Math.min(xScaleCP.invert(d3.event.x),(eventsData[i].x+eventsData[i].width),1));
              var change = eventsData[i].x - x;
              eventsData[i].x = x;
              eventsData[i].width = Math.max(0,eventsData[i].width + change);
              changePerspective(currentPerspective);
              updateRects(0);
           })
  var dragRight = d3.behavior.drag()
           .on('dragstart', function(){d3.select(this).moveToFront();})
           .on('drag', function(d,i) {
              var w = Math.max(0,Math.min(xScaleCP.invert(d3.event.x)-eventsData[i].x,(1-eventsData[i].x)));
              eventsData[i].width = w;
              changePerspective(currentPerspective);
              updateRects(0);
           })

  //Tool tip for Prob
  var tipCP = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0])
                .html(function(d,i) { 
                  var prob = calcOverlap(i,currentPerspective)/(xWidthCP.domain()[1]);
                  return round(prob,2);});

  //Ball SVG elements
  var events = containerBallCP.selectAll('g.event').data(eventsData).enter().append('g').attr('class', 'event');

  var rects = events.append('rect').attr('class', function(d){ return (d.name + ' shelf') }).call(dragRect);

  var leftBorders = events.append('line').attr('class', function(d){ return (d.name + ' border') }).call(dragLeft);

  var rightBorders = events.append('line').attr('class', function(d){ return (d.name + ' border') }).call(dragRight);

  var texts = events.append('text').text(function(d){ return d.name }).attr('class', function(d){ return d.name + ' label'});

  var circles = containerBallCP.append("g").attr("class", "ball").moveToBack();

  //Prob SVG elements
  var probEvents = containerProbCP.selectAll('g.event').data(eventsData).enter().append('g').attr('class', 'event');

  var probRects = probEvents.append('rect').attr('class', function(d){ return (d.name + ' probability') }).on("mouseover", function(d,i) { tipCP.show(d,i);}).on("mouseout", function() { tipCP.hide();});;

  var probAxis = containerProbCP.append("g").attr("class", "x axis");

  var xAxis = d3.svg.axis().scale(xScaleProbCP).orient("bottom").tickFormat(function (d) { return mapper[d]});


  //Updates positions of rectangles and lines
  function updateRects(dur) {
    rects.transition().duration(dur)
      .attr('x', function(d){ return xScaleCP(d.x) })
      .attr('y', function(d){ return yScaleCP(d.y) })
      .attr('width', function(d){ return xWidthCP(d.width) })
      .attr('height', function(d){ return yScaleCP(d.height) });

    leftBorders.transition().duration(dur)
      .attr('x1', function(d){ return xScaleCP(d.x) })
      .attr('y1', function(d){ return yScaleCP(d.y) })
      .attr('x2', function(d){ return xScaleCP(d.x) })
      .attr('y2', function(d){ return yScaleCP(d.y+d.height) });

    rightBorders.transition().duration(dur)
      .attr('x1', function(d){ return xScaleCP(d.x+d.width) })
      .attr('y1', function(d){ return yScaleCP(d.y) })
      .attr('x2', function(d){ return xScaleCP(d.x+d.width) })
      .attr('y2', function(d){ return yScaleCP(d.y+d.height) });

    texts.transition().duration(dur)
      .attr('x', function(d){ return xScaleCP(d.x + d.width/2) })
      .attr('y', function(d){ return yScaleCP(d.y + d.height + 0.05) });

    circles.selectAll('g').each(function(){
      d3.select(this).transition().duration(dur)
        .attr('transform', function(d){return 'translate(' + xScaleCP(d.p) + ',0)'});
    });

    probRects.transition().duration(dur)
      .attr('x', function(d,i){ return xScaleProbCP(i); })
      .attr('y', function(d,i){ return yScaleProbCP(calcOverlap(i,currentPerspective)/xWidthCP.domain()[1]); })
      .attr('width', function(d,i){ return xScaleProbCP.rangeBand(); })
      .attr('height', function(d,i){ return yScaleProbCP(1-calcOverlap(i,currentPerspective)/xWidthCP.domain()[1]); });

    // Call updateProbabilities() whenever the rectangles update
    calcIndependence();
    updateProbabilities();
    // createProbabilityTree();
  }


  //Drops ball randomly from 0 to 1
  function addBall(data){
    var dur = 2500;
    var p = Math.random();
    var pos = [{t: 0}, {t: 1}];
    var a, b, c, events = [];
    var bisector = d3.bisector(function(d){ return d.t }).right

    if(data[0].x <= p && p <= data[0].x + data[0].width) a = data[0]
    if(data[1].x <= p && p <= data[1].x + data[1].width) b = data[1]
    if(data[2].x <= p && p <= data[2].x + data[2].width) c = data[2]
    if(a) pos.splice(bisector(pos) - 1, 0, { t: a.y, event: a.name})
    if(b) pos.splice(bisector(pos) - 1, 0, { t: b.y, event: b.name})
    if(c) pos.splice(bisector(pos) - 1, 0, { t: c.y, event: c.name})
    if(a) events.push(a)
    if(b) events.push(b)
    if(c) events.push(c)
    var g = circles.append('g').datum({p: p, events: events })
        .attr('transform', function(d){return 'translate(' + xScaleCP(d.p) + ',0)'})
    var circle = g.append('circle')
                  .attr('r', radius)
                  .attr('cy', function(){ return yScaleCP(0) });

    pos.forEach(function(d, i){
      if(i === 0) return
      var dt = pos[i].t - pos[i - 1].t
      circle = circle
        .transition()
        .duration(dur * dt)
        .ease('bounce')
        .attr('cy', function(){ return yScaleCP(d.t) })
        .each('end', function(){ if(d.event) d3.select(this).classed(d.event, true) })
    })
    circle.each('end', function(d){
      d3.select(this.parentNode).remove();
    })
  }

  //Start and Stop ball sampling
  var interval;
  function start() {
    interval = setInterval(function() { 
      addBall(eventsData);
    }, 50);
  }
  function stop() {
    clearInterval(interval);
  }

  //Handles start and stop buttons
  $('.ballBtns').on('click', function(){
    var button = d3.select(this).attr('id');
    if(button=='start') start();
    if(button=='stop')  stop();
    $('#start').toggle();
    $('#stop').toggle(); 
  })

  //Handle Perspective Buttons
  $('.perspective').on('click', function(){
    $('#'+currentPerspective).toggleClass('active');
    $(this).toggleClass('active');
    changePerspective(d3.select(this).attr('id'));
    updateRects(1000);
  })

  //Changes Perspective
  function changePerspective(p){
    if(p=='a' && eventsData[0].width) {
      xScaleCP.domain([eventsData[0].x,(eventsData[0].x+eventsData[0].width)]);
      xWidthCP.domain([0,eventsData[0].width]);
      currentPerspective = 'a';
      mapper = {0: "P(A|A)", 1: "P(B|A)", 2: "P(C|A)"};
    } else if(p=='b' && eventsData[1].width) {
      xScaleCP.domain([eventsData[1].x,(eventsData[1].x+eventsData[1].width)]);
      xWidthCP.domain([0,eventsData[1].width]);
      currentPerspective = 'b';
      mapper = {0: "P(A|B)", 1: "P(B|B)", 2: "P(C|B)"};
    } else if(p=='c' && eventsData[2].width) {
      xScaleCP.domain([eventsData[2].x,(eventsData[2].x+eventsData[2].width)]);
      xWidthCP.domain([0,eventsData[2].width]);
      currentPerspective = 'c';
      mapper = {0: "P(A|C)", 1: "P(B|C)", 2: "P(C|C)"};
    } else if (p=='universe') {
      xScaleCP.domain([0,1]);
      xWidthCP.domain([0,1]);
      currentPerspective = 'universe';
      mapper = {0: "P(A)", 1: "P(B)", 2: "P(C)"};
    }
    probAxis.call(xAxis);
    // createProbabilityTree();
  }


  //Calculates overlap of rectangles
  function calcOverlap(index, perspective){
    var a1,a2;
    if(perspective=='a') { 
      a1 = eventsData[0].x; 
      a2 = a1 + eventsData[0].width;
    } else if(perspective=='b') { 
      a1 = eventsData[1].x; 
      a2 = a1 + eventsData[1].width;
    } else if(perspective=='c') { 
      a1 = eventsData[2].x; 
      a2 = a1 + eventsData[2].width;
    } else if (perspective=='universe') {
      a1 = 0; 
      a2 = 1;
    }
    
    var b1 = eventsData[index].x;
    var b2 = b1 + eventsData[index].width;

    var overlap = 0
    // if b1 is between [a1, a2]
    if(a1 <= b1 && b1 <= a2){
      // b is entirely inside of a
      if(b2 <= a2){
        overlap = b2 - b1
      }else {
        overlap = a2 - b1
      }
    }
    // if b2 is between [a1, a2]
    else if(a1 <= b2 && b2 <= a2){
      if(b1 <= a1){
        overlap = b2 - a1
      }else{
        overlap = b2 - b1
      }
    }
    // if b1 is left of a1 and b2 is right of a2
    else if(b1 <= a1 && a2 <= b2) {
      overlap = a2 - a1
    }
    return overlap
  }
  function updateProbabilities() {
    const totalWidth = 1; // Universe size is normalized to 1
    let pA = eventsData[0].width / totalWidth;
    let pB = eventsData[1].width / totalWidth;
    let pC = eventsData[2].width / totalWidth;

    let pAAndB = calcOverlap(0, 'b') / totalWidth;
    let pBAndC = calcOverlap(1, 'c') / totalWidth;
    let pAAndC = calcOverlap(0, 'c') / totalWidth;

    let pAGivenB = pB ? pAAndB / pB : 0;
    let pBGivenA = pA ? pAAndB / pA : 0;
    let pBGivenC = pC ? pBAndC / pC : 0;
    let pCGivenB = pB ? pBAndC / pB : 0;
    let pAGivenC = pC ? pAAndC / pC : 0;
    let pCGivenA = pA ? pAAndC / pA : 0;


    $("#pOfA").text(pA.toFixed(3));
    $("#pOfB").text(pB.toFixed(3));
    $("#pOfC").text(pC.toFixed(3));

    $("#pOfAAndB").text(pAAndB.toFixed(3));
    $("#pOfBAndC").text(pBAndC.toFixed(3));
    $("#pOfCAndA").text(pAAndC.toFixed(3));

    $("#pOfAGivenB").text(pAGivenB.toFixed(3));
    $("#pOfAGivenB_Percentage").text((pAGivenB * 100).toFixed(1));
    $("#pOfBGivenA").text(pBGivenA.toFixed(3));
    $("#pOfBGivenA_Percentage").text((pBGivenA * 100).toFixed(1));

    $("#pOfBGivenC").text(pBGivenC.toFixed(3));
    $("#pOfBGivenC_Percentage").text((pBGivenC * 100).toFixed(1));
    $("#pOfCGivenB").text(pCGivenB.toFixed(3));
    $("#pOfCGivenB_Percentage").text((pCGivenB * 100).toFixed(1));

    $("#pOfAGivenC").text(pAGivenC.toFixed(3));
    $("#pOfAGivenC_Percentage").text((pAGivenC * 100).toFixed(1));
    $("#pOfCGivenA").text(pCGivenA.toFixed(3));
    $("#pOfCGivenA_Percentage").text((pCGivenA * 100).toFixed(1));

    // Modify the `createProbabilityTree()` function

    let treeData;

    if (currentPerspective == 'universe') {
      treeData = {
        name: "P",
        probability: 1,
        children: [
          {
            name: "A",
            probability: pA,
            children: [
              {
                name: "B",
                probability: pB,
                children: [
                  { name: "C", probability: pC },
                  { name: "¬C", probability: 1 - pC }
                ]
              },
              {
                name: "¬B",
                probability: 1 - pB,
                children: [
                  { name: "C", probability: pC },
                  { name: "¬C", probability: 1 - pC }
                ]
              }
            ]
          },
          {
            name: "¬A",
            probability: 1 - pA,
            children: [
              {
                name: "B",
                probability: pB,
                children: [
                  { name: "C", probability: pC },
                  { name: "¬C", probability: 1 - pC }
                ]
              },
              {
                name: "¬B",
                probability: 1 - pB,
                children: [
                  { name: "C", probability: pC },
                  { name: "¬C", probability: 1 - pC }
                ]
              }
            ]
          }
        ]
      };
    } else if (currentPerspective == 'a') {
      treeData = {
        name: "P",
        probability: 1,
        children: [
          {
            name: "A|A",
            probability: 1,
            children: [
              {
                name: "B|A",
                probability: pBGivenA,
                children: [
                  { name: "C|A", probability: pCGivenA },
                  { name: "¬C|A", probability: 1 - pCGivenA }
                ]
              },
              {
                name: "¬B|A",
                probability: 1 - pBGivenA,
                children: [
                  { name: "C|A", probability: pCGivenA },
                  { name: "¬C|A", probability: 1 - pCGivenA }
                ]
              }
            ]
          },
          {
            name: "¬A|A",
            probability: 0,
            children: [
              {
                name: "B|A",
                probability: pBGivenA,
                children: [
                  { name: "C|A", probability: pCGivenA },
                  { name: "¬C|A", probability: 1 - pCGivenA }
                ]
              },
              {
                name: "¬B|A",
                probability: 1 - pBGivenA,
                children: [
                  { name: "C|A", probability: pCGivenA },
                  { name: "¬C|A", probability: 1 - pCGivenA }
                ]
              }
            ]
          }
        ]
      };
    } else if (currentPerspective == 'b') {
      treeData = {
        name: "P",
        probability: 1,
        children: [
          {
            name: "A|B",
            probability: pAGivenB,
            children: [
              {
                name: "B|B",
                probability: 1,
                children: [
                  { name: "C|B", probability: pCGivenB },
                  { name: "¬C|B", probability: 1 - pCGivenB }
                ]
              },
              {
                name: "¬B|B",
                probability: 0,
                children: [
                  { name: "C|B", probability: pCGivenB },
                  { name: "¬C|B", probability: 1 - pCGivenB }
                ]
              }
            ]
          },
          {
            name: "¬A|B",
            probability: 1 - pAGivenB,
            children: [
              {
                name: "B|B",
                probability: 1,
                children: [
                  { name: "C|B", probability: pCGivenB },
                  { name: "¬C|B", probability: 1 - pCGivenB }
                ]
              },
              {
                name: "¬B|B",
                probability: 0,
                children: [
                  { name: "C|B", probability: pCGivenB },
                  { name: "¬C|B", probability: 1 - pCGivenB }
                ]
              }
            ]
          }
        ]
      }
    } else if (currentPerspective == 'c') {
      treeData = {
        name: "P",
        probability: 1,
        children: [
          {
            name: "A|C",
            probability: pAGivenC,
            children: [
              {
                name: "B|C",
                probability: pBGivenC,
                children: [
                  { name: "C|C", probability: 1 },
                  { name: "¬C|C", probability: 0 }
                ]
              },
              {
                name: "¬B|C",
                probability: 1 - pBGivenC,
                children: [
                  { name: "C|C", probability: 1 },
                  { name: "¬C|C", probability: 0 }
                ]
              }
            ]
          },
          {
            name: "¬A|C",
            probability: 1 - pAGivenC,
            children: [
              {
                name: "B|C",
                probability: pBGivenC,
                children: [
                  { name: "C|C", probability: 1 },
                  { name: "¬C|C", probability: 0 }
                ]
              },
              {
                name: "¬B|C",
                probability: 1 - pBGivenC,
                children: [
                  { name: "C|C", probability: 1 },
                  { name: "¬C|C", probability: 0 }
                ]
              }
            ]
          }
        ]
      }
    }

    var container = d3.select("#svgTreeCP");
    var width = container.node().clientWidth;
    var height = 250;
    var padding = 15;

    d3.select("#svgTreeCP").html("");
    var svg = d3.select("#svgTreeCP").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + padding + "," + padding + ")");

    var treeLayout = d3.layout.tree().size([height - 2 * padding, width - 2 * padding]);
    var nodes = treeLayout.nodes(treeData);
    var links = treeLayout.links(nodes);

    var diagonal = d3.svg.diagonal().projection(function (d) {
        return [d.y, d.x];
    });

    nodes.forEach(function (d) {
        d.y = d.depth * (width / 4);
    });

    svg.selectAll(".link")
        .data(links)
        .enter().append("path")
        .attr("class", "link")
        .attr("d", diagonal)
        .style("stroke-width", "2px");

    var node = svg.selectAll(".node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function (d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    node.append("circle")
        .attr("r", 8)
        .style("fill", function (d) {
            return getFillColor(d.name);
        });

    node.append("text")
        .attr("dx", function (d) { return d.children ? -10 : 10; })
        .attr("dy", 4)
        .style("font-size", "12px")
        .style("text-anchor", function (d) { return d.children ? "end" : "start"; })
        .text(function (d) { if (d.name != "P") return d.name + " (" + d.probability.toFixed(3) + ")"; });

    function getFillColor(name) {
        if (name.startsWith("A")) return "#FF9B3C";
        if (name.startsWith("B")) return "#00d0a1";
        if (name.startsWith("C")) return "#64bdff";
        if (name.startsWith("¬")) return "#ccc";
        return "#222";
    }

  }





  //Check if event pairs are Independent
  function calcIndependence(){
    if(round(calcOverlap(0,'b')/eventsData[1].width,2) == round(eventsData[0].width,2)) {
      $('#AB').html('independent');
    } else {
      $('#AB').html('dependent');
    }
    if(round(calcOverlap(1,'c')/eventsData[2].width,2) == round(eventsData[1].width,2)) {
      $('#BC').html('independent');
    } else {
      $('#BC').html('dependent');
    }
    if(round(calcOverlap(2,'a')/eventsData[0].width,2) == round(eventsData[2].width,2)) {
      $('#CA').html('independent');
    } else {
      $('#CA').html('dependent');
    }
  }

  //Draws SVG and elements according to width
  function drawCP() {
    var w = d3.select('#svgBallCP').node().clientWidth;
    var wProb = d3.select('#svgProbCP').node().clientWidth;
    var wTree = d3.select('#svgTreeCP').node().clientWidth;
    var h = 500;
    var hProb = 200;
    var hTree = 200;
    var padding = 25;

    //Update svg size
    svgBallCP.attr("width", w).attr("height", h);
    svgProbCP.attr("width", wProb).attr("height", hProb).call(tipCP);
    svgTreeCP.attr("width", wTree).attr("height", hTree).call(tipCP);

    //Update Clip Path
    clipCP.attr("x", 0).attr("y", 0).attr("width", w-2*padding).attr("height", h-2*padding);

    //Update Container
    containerBallCP.attr("transform", "translate(" + padding + "," + padding + ")");
    containerProbCP.attr("transform", "translate(" + padding + "," + padding + ")");
    containerTreeCP.attr("transform", "translate(" + padding + "," + padding + ")");

    //Update Scale Range
    xScaleCP.range([0, (w - 2*padding)]);
    xWidthCP.range([0, (w - 2*padding)]);
    yScaleCP.range([0, (h-2*padding)]);

    xScaleProbCP.rangeRoundBands([0, wProb - 2*padding], .5);
    yScaleProbCP.range([hProb-2*padding, 0]);

    //Update Axis
    probAxis.attr("transform", "translate(" + 0 + "," + (hProb-2*padding+1) + ")").call(xAxis);

    //Update Rectangles
    changePerspective(currentPerspective);
    updateRects(0)
  }


  start();
  drawCP();
  $(window).on("resize", drawCP);

  $(document).ready(function () {
    calcIndependence();
    updateProbabilities();
    // createProbabilityTree();
  });
}