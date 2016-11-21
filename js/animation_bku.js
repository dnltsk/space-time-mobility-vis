
var ANIMATION_TRIGGER = null;

var animationData = null;

var allCharts = [];
var DOTS_SVG = null;
var CHART_SVG = null;
var CHART_MODES_SVG = null;
var CHART_NET_SVG = null;
var margin = {top: 20, right: 80, bottom: 30, left: 50};

function toggleChart(){
	CHART_MODES_SVG.style("display", (CHART_MODES_SVG.style("display") == "none")?"block":"none");
	CHART_SVG.style("display", (CHART_SVG.style("display") == "none")?"block":"none");
}



/*
 * 
 */
function animationPlay(){
	//window.setInterval(myInterval, 24*60*40/96);
	ANIMATION_TRIGGER = d3.select("body")
						  .append("input")
						  .attr("type","hidden")
						  .attr("name","animationTrigger")
						  .attr("value",0);
	ANIMATION_TRIGGER.transition()
					 .ease("linear")
					 .duration(1440*40)
					 .attr("value",1)
					 .each("end", function(){
						 /*window.setTimeout(2000, function(){
							 animationPause();
						 });*/
					 });
	startMapAnimation();
	startNetAnimation();
	allCharts[0].startAnimation();
	//startChartTimer();
	var control = document.getElementById("animationPlayControl");
	control.src="img/pause_32x32.png";
	control.title="Animation pausieren (ACHTUNG: noch nicht implementiert)";
	control.onclick = animationPause;
	
	
}

/*
 * 
 */
var pauseDotsInterval = null;
function animationPause(){
	ANIMATION_TRIGGER.transition().duration(0);
	pauseDotsInterval = window.setInterval(pauseDots, 100);
	CHART_NET_SVG.selectAll("circle, path").transition().duration(0);
	DOTS_SVG.selectAll("*").transition().duration(0);
	allCharts[0].pauseAnimation();
	DOTS_SVG.selectAll("*").transition().duration(0);
}

var pauseDotsCount = 0;
function pauseDots(){
	if(pauseDotsCount >=10){
		window.clearInterval(pauseDotsInterval);
		if(ANIMATION_TRIGGER.attr("value") >= 1){
			DOTS_SVG.selectAll("*").transition().duration(0).style("fill-opacity",0);
		}
	}
	DOTS_SVG.selectAll("*").transition().duration(0);
	DOTS_SVG.selectAll("circle")
			.attr("r",2.5)
	pauseDotsCount++;
}


var intervalCounter = 0;
function myInterval(){
	console.log("myInterval "+intervalCounter);
	intervalCounter += 96;
}

function initLoadActivities(nextStep){
	registerActiveLoad("initLoadActivities");
	d3.json("json/animation/location_chain.json", 
			function(d){
				console.log("location_chain loaded ",d);
				animationData = d;
				//Animationsdaten nach Startzeit sortieren
				animationData.sort(function(a, b){
					return a[0].from - b[0].from;
				});
				
				for(var i=0; i<animationData.length; i++){
					animationData[i].currentIndex = 0;
				}
				
				DOTS_SVG = MAP_SVG.append("g").attr("id", "dots");
				
				for(var i=0; i<animationData.length; i++){
					appendDot(animationData[i], i);
				}
				
				
				unregisterActiveLoad("initLoadActivities");
				nextStep();
			});
}
registeredLoaders.push(initLoadActivities);

/*
 * 
 */
function appendDot(chain, i){
	DOTS_SVG.selectAll("#chain"+i)
		.data([chain])
		.enter()
		.append("circle")
		.attr("id","chain"+i)
		.classed("possibility", true)
		.style("fill",
				function(d){
			return LEGEND_DATA.colorMap.layer_possibilities[d[0].location_type]
		})
		.style("fill-opacity", 
				function(d){ 
			if(d[0].from == 0){
				return 1;
			}
			return 0;
		})
		.attr("r", 
				function(d){ 
			if(d[0].from == 0){
				return 2.5;
			}
			return 2.5; //evtl. 5!!?
		})
		.attr("cx", function(d){return d[0].coordinate[0]})
		.attr("cy", function(d){return d[0].coordinate[1]});
}

/*
 * 
 */
function startMapAnimation(){
	
	
	DOTS_SVG.selectAll("circle")
			.transition()
			.delay(0)
			.duration(function(d){return d[d.currentIndex].duration * 40})
			.ease("linear")
			.style("fill-opacity",0)
			.each("end", function(){
				nextMapChainLink(this);
			});
		
}

function nextMapChainLink(dotThis){
	
	if(dotThis.__data__.currentIndex+1 > dotThis.__data__.length-1){
		return;
	}
	dotThis.__data__.currentIndex++;
	
	dotThis.parentNode.appendChild(dotThis);
	
	var dot = d3.select(dotThis);
	
	dot.style("fill",
			  function(d){
					return LEGEND_DATA.colorMap.layer_possibilities[d[d.currentIndex].location_type];
	   })
	   .style("fill-opacity", 0)
	   .attr("r", 2.5)
	   .attr("cx", function(d){return d[d.currentIndex].coordinate[0]})
	   .attr("cy", function(d){return d[d.currentIndex].coordinate[1]});
	
	var currentTime = 1440*40 * ANIMATION_TRIGGER.attr("value");
	dot.transition()
		.delay(function(d){
			return d[d.currentIndex].from*40 - currentTime;
		})
		.duration(0)
		.ease("linear")
		.style("fill-opacity", 1)
		.each("end", function(d){
			var currentTime2 = 1440*40 * ANIMATION_TRIGGER.attr("value");
			d3.select(this)
				.transition()
				.delay(0)
				.duration(function(d){return d[d.currentIndex].to*40 - currentTime2})
				.ease("linear")
				.style("fill-opacity",0)
				.each("end", function(){
					nextMapChainLink(this);
				});
		});
		
	
	
}

function startChartTimer(){
	//POSSIBILITIES
	var timer = CHART_SVG.append("line")
						 .attr("x1", 0)
						 .attr("y1", 0)
						 .attr("x2", 0)
						 .attr("y2", 200 - margin.top - margin.bottom)
						 .style("stroke", "black")
						 .style("stroke-width", 2);
	timer.transition()
		 .duration(24*60*40)
		 .ease("linear")
		 .attr("x1", 960 - margin.left - margin.right)
		 .attr("x2", 960 - margin.left - margin.right);
	
	//MODES
	var timer = CHART_MODES_SVG.append("line")
	 .attr("x1", 0)
	 .attr("y1", 0)
	 .attr("x2", 0)
	 .attr("y2", 200 - margin.top - margin.bottom)
	 .style("stroke", "black")
	 .style("stroke-width", 2);
	
	timer.transition()
		.duration(24*60*40)
		.ease("linear")
		.attr("x1", 960 - margin.left - margin.right)
		.attr("x2", 960 - margin.left - margin.right);
}

/**
 * 
 */
function initNetChart(){
	if(CHART_NET_SVG != null){		return;	}
	var screenSize = getScreenSize();
	var height = getNetHeight();
	var width = height;
	
	CHART_NET_SVG = ROOT_SVG.append("g")
		.attr("width", width)
		.attr("height", height)
		.attr("transform", "translate(" + 0 + "," + (screenSize.height - height) + ")")
		.style("display", "block");
		CHART_NET_SVG.selectAll(".underlay").remove();
	
	CHART_NET_SVG.append("rect")
		.classed("underlay", true)
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", width)
		.attr("height", height)
		.style("fill","white")
		.style("fill-opacity", 0.5)
		.style("stroke","white")
		.style("stroke-opacity",1)
		.style("stroke-width",1);
	
	CHART_NET_SVG.fit = function(){
		
		var screenSize = getScreenSize();
		var height = getNetHeight();
		var width = height;
		
		this.attr("width", width)
			.attr("height", height)
			.attr("transform", "translate(" + 0 + "," + (screenSize.height - height) + ")")
			.style("display", "block");
		
		this.select(".underlay")
			.attr("width", width)
			.attr("height", height);
	}
	
	var w = width,
    h = height,
    r = 6;
    //fill = d3.scale.category10();

	var force = d3.layout.force()
	    //.gravity(.01)
	    .charge(-120)
	    .linkDistance(height/2)
	    .size([w, h]);
	
	var svg = CHART_NET_SVG
	    .attr("width", w)
	    .attr("height", h);
	
	svg.append("g")
		.classed("title", true)
		.attr("transform", "translate("+(w/2)+","+(margin.top+10)+")")
		.append("text")
		.attr("text-anchor", "middle")
		.attr("x", 0)
		.attr("y", 0)
		.style("font-weight", "bold")
		.style("text-decoration", "underline")
		.text("Übergänge zwischen Gelegenheiten");
	
	var netContent = svg.append("g").attr("transform", "translate(0,"+(margin.top*.66)+")")
	
	d3.json("json/animation/net.json", function(error, json) {
		
	
	  var link = netContent.append("svg:g").selectAll("path")
		  .data(json.links)
		  .enter()
		  .append("svg:path")
		  .attr("class", "link")
		  .style("stroke-width",function(d){ 
			  return d.frames[0].changes; 
		  })
		  .style("stroke", function(d){ 
		  	  return LEGEND_DATA.colorMap.layer_possibilities[json.nodes[d.source].name]; 
		  })
		  .style("fill","none");
	
	  var node = netContent.selectAll("circle")
	      .data(json.nodes)
	      .enter().append("svg:circle")
	      .attr("r", function(d){ 
	    	  return Math.sqrt(d.frames[0].contains / Math.PI)*1.5; 
	      })
	      .style("fill", function(d) { 
	    	  return LEGEND_DATA.colorMap.layer_possibilities[d.name];
	      })
	      .style("stroke", function(d) { 
	    	  return LEGEND_DATA.colorMap.layer_possibilities[d.name]; 
	      });
		  
	
	  force.nodes(json.nodes)
	       .links(json.links)
	       .on("tick", tick)
	       .start();
	
	  
	  function tick() {
		node.attr("cx", function(d) {
				return d.x = Math.max(r, Math.min(w - r, d.x)); 
			})
		    .attr("cy", function(d) { 
		    	return d.y = Math.max(r, Math.min(h - r, d.y)); 
		    });
		
		link.attr("d", function(d) {
	        var dx = d.target.x - d.source.x,
	            dy = d.target.y - d.source.y,
	            dr = Math.sqrt(dx * dx + dy * dy);
	        return "M" + 
	            d.source.x + "," + 
	            d.source.y + "A" + 
	            dr + "," + dr + " 0 0,1 " + 
	            d.target.x + "," + 
	            d.target.y;
	    });
	  }
});
	
		
}
registeredDrawers.push(initNetChart);


/*
 * 
 */
function startNetAnimation(){
	CHART_NET_SVG.selectAll("circle")
				 .each(function(){
			    	  for(var i=0; i<this.__data__.frames.length; i++){
			    		  d3.select(this).transition()
					    		  		 .duration(24*60*40/96)
					    		  		 .delay(this.__data__.frames[i].frame * 40)
					    		  		 .ease("linear")
					    		  		 .attr("r", Math.sqrt(this.__data__.frames[i].contains*1.5 / Math.PI));
			    	  }
			      });
	
	CHART_NET_SVG.selectAll("path")
				 .each(function(){
			    	  for(var i=0; i<this.__data__.frames.length; i++){
			    		  d3.select(this).transition()
					    		  		 .duration(24*60*40/96)
					    		  		 .delay(this.__data__.frames[i].frame * 40)
					    		  		 .ease("linear")
					    		  		 .style("stroke-width", this.__data__.frames[i].changes / 20);
			    	  }
			    	  d3.select(this).transition()
	    		  		 .delay((1440 + 96) * 40)
	    		  		 .ease("linear")
	    		  		 .style("stroke-width", 0);
			    	  
			      });
}

/**
 * 
 */
function initCharts(){	
	if(allCharts.length > 0){
		return;	
	}
	var newChart = new ChartObject();
	newChart.init(900, 250);
	allCharts.push(newChart);
}
registeredDrawers.push(initCharts);

/*
 * 
 */
function translateCharts(){
	
	CHART_NET_SVG.fit();
	
	var screenSize = getScreenSize();
	
	var netHeight = getNetHeight();
	var netWidth = netHeight;
	
	
	var legendBbox = getBboxOfG(LEGEND_SVG);
	
	chartsHeight = netHeight;
	chartsWidth = screenSize.width - netWidth - legendBbox.maxX;
	
	for(var i=0; i<allCharts.length; i++){
		if(allCharts[i].svgGroup != null){
			allCharts[i].updatePosition(netWidth, 
									    screenSize.height - netHeight, 
									    chartsWidth, 
									    chartsHeight);
		}
		
	}
		
}
	

function appendChartUnderlay(g){
	g.select(".underlay").remove();
	g.append("rect")
		.classed("underlay", true)
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", 0)
		.attr("height", 0)
		.style("fill","white")
		.style("fill-opacity", 0.5)
		.style("stroke","white")
		.style("stroke-opacity",1)
		.style("stroke-width",1);
}

function getNetHeight(){
	var screenSize = getScreenSize();
	var netHeight = screenSize.height * .25;
	if(netHeight < 250){
		return 250;
	}
	return netHeight;
}