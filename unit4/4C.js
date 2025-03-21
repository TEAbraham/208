//Handles functionality of Compound Probability
window.onload = function () {
  conditional();
  document.querySelectorAll(".perspective").forEach((button) => {
    button.addEventListener("click", function () {
      document.querySelectorAll(".perspective").forEach((btn) =>
        btn.classList.remove("active")
      );
      this.classList.add("active");
      changePerspective(this.id);
      updateRects(1000);
    });
  });
};

//*******************************************************************************//
//Conditional Probability
//*******************************************************************************//
function conditional() {

  // Constants
  let currentPerspective = "universe";
  let radius = 5;
  let eventsData = [
    { x: 1 / 6, y: 0.2, width: 1 / 3, height: 0.05, name: "A" },
    { x: 1 / 3, y: 0.4, width: 1 / 3, height: 0.05, name: "B" },
    { x: 1 / 2, y: 0.6, width: 1 / 3, height: 0.05, name: "C" },
  ];
  let mapper = { 0: "P(A)", 1: "P(B)", 2: "P(C)" };

  // Create SVG Elements
  let svgBallCP = d3.select("#svgBallCP").append("svg").attr("width", 1000).attr("height", 400);
  let svgProbCP = d3.select("#svgProbCP").append("svg").attr("width", 400).attr("height", 200);
  let svgTreeCP = d3.select("#svgTreeCP").append("svg").attr("width", 600).attr("height", 200);

  // Create Clip Path
  let clipCP = svgBallCP.append("clipPath").attr("id", "viewCP").append("rect");

  // Create Container
  let containerBallCP = svgBallCP.append("g").attr("clip-path", "url(#viewCP)");
  let containerProbCP = svgProbCP.append("g");
  let containerTreeCP = svgTreeCP.append("g");

  // Create Scales (D3v7)
  let xScaleCP = d3.scaleLinear().domain([0, 1]).range([0, 980]);
  let xWidthCP = d3.scaleLinear().domain([0, 1]).range([0, 980]);
  let yScaleCP = d3.scaleLinear().domain([0, 1]).range([0, 380]);

  let xScaleProbCP = d3.scaleBand().domain(d3.range(eventsData.length)).range([0, 380]).padding(0.1);
  let yScaleProbCP = d3.scaleLinear().domain([0, 1]).range([180, 0]);

  // Drag Functions (D3v7)
  let dragRect = d3
    .drag()
    .on("start", function () {
      d3.select(this.parentNode).raise();
    })
    .on("drag", function (event, d) {
      let x = Math.max(0, Math.min(xScaleCP.invert(event.x), 1 - d.width));
      d.x = x;
      changePerspective(currentPerspective);
      updateRects(0);
    });

  let dragLeft = d3
    .drag()
    .on("start", function () {
      d3.select(this).raise();
    })
    .on("drag", function (event, d) {
      let x = Math.max(0, Math.min(xScaleCP.invert(event.x), d.x + d.width));
      let change = d.x - x;
      d.x = x;
      d.width = Math.max(0, d.width + change);
      changePerspective(currentPerspective);
      updateRects(0);
    });

  let dragRight = d3
    .drag()
    .on("start", function () {
      d3.select(this).raise();
    })
    .on("drag", function (event, d) {
      let w = Math.max(0, Math.min(xScaleCP.invert(event.x) - d.x, 1 - d.x));
      d.width = w;
      changePerspective(currentPerspective);
      updateRects(0);
    });


  // Create Tooltip
  let tipCP = d3.select("body").append("div")
    .attr("class", "d3-tip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "lightgray")
    .style("padding", "5px")
    .style("border-radius", "5px")
    .style("pointer-events", "none");


  // Ball SVG elements
  let events = containerBallCP
    .selectAll("g.event")
    .data(eventsData)
    .enter()
    .append("g")
    .attr("class", "event");

  let rects = events
    .append("rect")
    .attr("class", (d) => d.name + " shelf")
    .call(dragRect);

  let leftBorders = events
    .append("line")
    .attr("class", (d) => d.name + " border")
    .call(dragLeft);

  let rightBorders = events
    .append("line")
    .attr("class", (d) => d.name + " border")
    .call(dragRight);

  let texts = events
    .append("text")
    .text((d) => d.name)
    .attr("class", (d) => d.name + " label");

  let circles = containerBallCP.append("g").attr("class", "ball");


  //Prob SVG elements
  var probEvents = containerProbCP.selectAll('g.event').data(eventsData).enter().append('g').attr('class', 'event');

  var probRects = probEvents.append('rect').attr('class', function(d){ return (d.name + ' probability') }).on("mouseover", function(d,i) { tipCP.show(d,i);}).on("mouseout", function() { tipCP.hide();});;

  // Create Axis (D3v7)
  let xAxis = d3.axisBottom(xScaleProbCP).tickFormat((d) => mapper[d]);
  let probAxis = containerProbCP.append("g").attr("class", "x axis");

  // Event Listeners for Tooltip
  function handleMouseOver(event, d) {
    tipCP.style("visibility", "visible")
          .html(`Value: ${d}`)
          .style("top", `${event.pageY - 10}px`)
          .style("left", `${event.pageX + 10}px`);
  }

  function handleMouseOut() {
    tipCP.style("visibility", "hidden");
  }

  //Updates positions of rectangles and lines
  function updateRects(dur) {

    rects
      .transition()
      .duration(dur)
      .attr("x", (d) => xScaleCP(d.x))
      .attr("y", (d) => yScaleCP(d.y))
      .attr("width", (d) => xWidthCP(d.width))
      .attr("height", (d) => yScaleCP(d.height));

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

    let probEvents = containerProbCP.selectAll("g.event").data(eventsData);

    // Bind data to probability bars
    let probRects = probEvents.selectAll(".probability").data(eventsData);

    // Update or append rectangles
    probRects.enter()
      .append("rect")
      .merge(probRects)
      .transition().duration(dur)
      .attr("x", (d, i) => xScaleProbCP(i))
      .attr("y", (d, i) => yScaleProbCP(calcOverlap(i, currentPerspective) / xWidthCP.domain()[1]))
      .attr("width", xScaleProbCP.bandwidth())
      .attr("height", (d, i) => 180 - yScaleProbCP(calcOverlap(i, currentPerspective) / xWidthCP.domain()[1]))
      .attr("class", (d) => `${d.name} probability`);

    // Bind data to probability labels
    let probTexts = probEvents.selectAll(".probability-label").data(eventsData);

    probTexts.enter()
      .append("text")
      .merge(probTexts)
      .transition().duration(dur)
      .attr("x", (d, i) => xScaleProbCP(i) + xScaleProbCP.bandwidth() / 2)
      .attr("y", (d, i) => yScaleProbCP(calcOverlap(i, currentPerspective) / xWidthCP.domain()[1]) - 5)
      .attr("text-anchor", "middle")
      .attr("class", (d) => `${d.name} probability-label`)
      .text((d, i) => (calcOverlap(i, currentPerspective) / xWidthCP.domain()[1]).toFixed(2));

    probRects.exit().remove();
    probTexts.exit().remove();

    calcIndependence();
    updateProbabilities();

  }


  //Drops ball randomly from 0 to 1
  function addBall(data){
    var dur = 2500;
    var p = Math.random();
    var pos = [{t: 0}, {t: 1}];
    var a, b, c, events = [];
    var bisector = d3.bisector(function(d){ return d.t }).right;

    if(data[0].x <= p && p <= data[0].x + data[0].width) a = data[0];
    if(data[1].x <= p && p <= data[1].x + data[1].width) b = data[1];
    if(data[2].x <= p && p <= data[2].x + data[2].width) c = data[2];

    if(a) pos.splice(bisector(pos) - 1, 0, { t: a.y, event: a.name });
    if(b) pos.splice(bisector(pos) - 1, 0, { t: b.y, event: b.name });
    if(c) pos.splice(bisector(pos) - 1, 0, { t: c.y, event: c.name });

    if(a) events.push(a);
    if(b) events.push(b);
    if(c) events.push(c);

    var g = circles.append('g').datum({p: p, events: events })
        .attr('transform', function(d){ return 'translate(' + xScaleCP(d.p) + ',0)'; });

    var circle = g.append('circle')
                  .attr('r', radius)
                  .attr('cy', function(){ return yScaleCP(0); });

    pos.forEach(function(d, i){
        if(i === 0) return;
        var dt = pos[i].t - pos[i - 1].t;
        circle = circle
          .transition()
          .duration(dur * dt)
          .ease(d3.easeBounce) // Updated for D3 v7
          .attr('cy', function(){ return yScaleCP(d.t); })
          .on("end", function(){ // Replacing `each('end', ...)` in D3 v7
              if(d.event) d3.select(this).classed(d.event, true);
          });
    });

    circle.on("end", function(d){
        d3.select(this.parentNode).remove();
    });
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
    if (p === "a" && eventsData[0].width) {
      xScaleCP.domain([eventsData[0].x, eventsData[0].x + eventsData[0].width]);
      xWidthCP.domain([0, eventsData[0].width]);
      currentPerspective = "a";
    } else if (p === "b" && eventsData[1].width) {
      xScaleCP.domain([eventsData[1].x, eventsData[1].x + eventsData[1].width]);
      xWidthCP.domain([0, eventsData[1].width]);
      currentPerspective = "b";
    } else if (p === "c" && eventsData[2].width) {
      xScaleCP.domain([eventsData[2].x, eventsData[2].x + eventsData[2].width]);
      xWidthCP.domain([0, eventsData[2].width]);
      currentPerspective = "c";
    } else {
      xScaleCP.domain([0, 1]);
      xWidthCP.domain([0, 1]);
      currentPerspective = "universe";
    }
    updateRects(1000);
  }


  // Fix: Ensure eventData is within bounds in calcOverlap
  function calcOverlap(index, perspective) {
    if (index < 0 || index >= eventsData.length) {
      console.warn(`Invalid index ${index} for eventsData`);
      return 0;
    }
    var a1, a2;
    if (perspective === "a") {
      a1 = eventsData[0].x;
      a2 = a1 + eventsData[0].width;
    } else if (perspective === "b") {
      a1 = eventsData[1].x;
      a2 = a1 + eventsData[1].width;
    } else if (perspective === "c") {
      a1 = eventsData[2].x;
      a2 = a1 + eventsData[2].width;
    } else if (perspective === "universe") {
      a1 = 0;
      a2 = 1;
    }
    var b1 = eventsData[index].x;
    var b2 = b1 + eventsData[index].width;
    var overlap = 0;
    if (a1 <= b1 && b1 <= a2) {
      if (b2 <= a2) {
        overlap = b2 - b1;
      } else {
        overlap = a2 - b1;
      }
    } else if (a1 <= b2 && b2 <= a2) {
      if (b1 <= a1) {
        overlap = b2 - a1;
      } else {
        overlap = b2 - b1;
      }
    } else if (b1 <= a1 && a2 <= b2) {
      overlap = a2 - a1;
    }
    return overlap;
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

    let treeData = {
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

    if (!treeData || typeof treeData !== "object" || !treeData.children) {
      console.error("treeData is not properly initialized or missing children");
      return;
    }

    // Ensure treeData is valid before further processing
    console.log("Tree Data initialized:", treeData);

    let width = 600;
    let height = 200;
    let treeLayout = d3.tree().size([height - 15, width - 225]);
    let root = d3.hierarchy(treeData);
    treeLayout(root);

    d3.select("#svgTreeCP").html("");
    let svg = d3.select("#svgTreeCP").append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate(-10,25)");

    let link = svg.selectAll(".link")
      .data(root.links())
      .enter().append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-width", 2)
      .attr("d", d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x));

    let node = svg.selectAll(".node")
      .data(root.descendants())
      .enter().append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.y},${d.x})`)


    node.append("circle")
      .attr("r", 6)
      .attr("fill", "#69b3a2")
      .style("fill", d =>  {
        if (d.data.name.startsWith("A")) return "#FF9B3C";
        if (d.data.name.startsWith("B")) return "#00d0a1";
        if (d.data.name.startsWith("C")) return "#64bdff";
        if (d.data.name.startsWith("¬")) return "#ccc";
        return "#222";
    })

    node.append("text")
      .attr("dx", 8)
      .attr("dy", 4)
      .text(d => { if (d.data.name != "P") return `${d.data.name} (${d.data.probability.toFixed(2)})` } );
  }





  //Check if event pairs are Independent
  function calcIndependence(){
    if((calcOverlap(0,'b')/eventsData[1].width).toFixed(3) == (eventsData[0].width).toFixed(3)) {
      $('#AB').html('&#10987;');
    } else {
      $('#AB').html('&#8527;');
    }
    if((calcOverlap(1,'c')/eventsData[2].width).toFixed(3) == (eventsData[1].width).toFixed(3)) {
      $('#BC').html('&#10987;');
    } else {
      $('#BC').html('&#8527;');
    }
    if((calcOverlap(2,'a')/eventsData[0].width).toFixed(3) == (eventsData[2].width).toFixed(3)) {
      $('#CA').html('&#10987;');
    } else {
      $('#CA').html('&#8527;');
    }
  }

  //Draws SVG and elements according to width
  function drawCP() {
    let w = 1000;
    let h = 400;
    let padding = 25;

    svgBallCP.attr("width", w).attr("height", h);
    svgProbCP.attr("width", 400).attr("height", 200);
    svgTreeCP.attr("width", 600).attr("height", 200);

    clipCP.attr("x", 0).attr("y", 0).attr("width", w - 2 * padding).attr("height", h - 2 * padding);
    containerBallCP.attr("transform", "translate(" + padding + "," + padding + ")");
    containerProbCP.attr("transform", "translate(" + padding + "," + padding + ")");
    containerTreeCP.attr("transform", "translate(" + padding + "," + padding + ")");
    probAxis.attr("transform", "translate(0," + 180 + ")").call(xAxis);
    changePerspective(currentPerspective);
    updateRects(0);
}

  start()
  drawCP();
  calcIndependence();
  updateProbabilities();
  window.addEventListener("resize", drawCP);
}