var ROOT_SVG = null;
var MAP_SVG = null;
var PATH_SVG = null;
var PATH_DEFS_SVG = null;
var PATH_USES_SVG = null;
var BACKGROUND_SVG = null;
var LABELS_SVG = null;
var LEGEND_SVG = null;
var NORTHARROW_SVG = null;

var isFirstLoad = true;

var registeredInitLoaders = [];
var registeredActiveInitLoads = [];

var registeredLoaders = [];
var registeredActiveLoads = [];

var registeredDrawers = [];
var registeredTransitioners = [];
var registeredSorts = [];

var zoomBehavior = null;

var lastZoomScale = 1;
function zoomEvent() {
	MAP_SVG.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	if(lastZoomScale != d3.event.scale){
		lastZoomScale = d3.event.scale;
		if(typeof trafficMatrix != "undefined"){
			drawLegend();
		}
	}
	/*features.select(".state-border").style("stroke-width", 1.5 / d3.event.scale + "px");
	features.select(".county-border").style("stroke-width", .5 / d3.event.scale + "px");*/
}

function init(){
	console.log("init()");
	initLoadersRegistered(structSvg);
	loadData(drawData);
}

/*
 * Struct
 */
structSvgExecuted = false;
function structSvg(){
	console.log("structSvg()");
	if(registeredActiveInitLoads.length > 0){
		console.log("structSvg() exit () registeredActiveInitLoads.length="+registeredActiveInitLoads.length);
		return;
	}
	if(structSvgExecuted){
		console.log("structSvg() exit () structSvgExecuted="+structSvgExecuted);
		return;
	}
	structSvgExecuted = true;
	
	ROOT_SVG = d3.select("svg#map");
	
	MAP_SVG = ROOT_SVG.append("g");
	
	createArrowEndMarker();

	var width = ROOT_SVG.style("width");
	width = width.substr(0,width.length-2);
	var height = ROOT_SVG.style("height");
	height = height.substr(0,height.length-2);
	MAP_SVG.attr("transform", function(){return "translate("+width/2+","+height/2+")"});
	
	zoomBehavior = d3.behavior.zoom()
		.translate([width/2, height/2])
		.scale(1)
		.scaleExtent([0, 8])
		.on("zoom", zoomEvent);
	MAP_SVG.call(zoomBehavior);
	
	BACKGROUND_SVG = MAP_SVG.append("g").attr("id", "backgrounds")
	LABELS_SVG = MAP_SVG.append("g").attr("id", "labels");
	PATH_SVG = MAP_SVG.append("g").attr("id", "paths");
	PATH_DEFS_SVG = PATH_SVG.append("defs");
	PATH_USES_SVG = PATH_SVG.append("g");
	
	LEGEND_SVG = ROOT_SVG.append("g").attr("id", "legend");
	
	NORTHARROW_SVG = ROOT_SVG.append("g").attr("id", "northarrow");
	
}

/*
 * 
 */
function initLoadersRegistered(nextStep){
	console.log("initLoadersRegistered()");
	for(var i=0; i<registeredInitLoaders.length; i++){
		//console.log(registeredInitLoaders[i]);
		registeredInitLoaders[i](nextStep);
	}
}

/*
 * Load
 */
function loadData(nextStep){
	console.log("loadData()");
	if(!structSvgExecuted){
		//console.log("loadData() structSvgExecuted="+structSvgExecuted+" -> 500-Timeout");
		window.setTimeout(loadData, 500, nextStep);
		return
	}
	for(var i=0; i<registeredLoaders.length; i++){
		registeredLoaders[i](nextStep);
	}
}

/*
 * Draw
 */
function drawData(){
	console.log("drawData()");
	if(registeredActiveLoads.length > 0){
		return;
	}
	for(var i=0; i<registeredDrawers.length; i++){
		registeredDrawers[i]();
	}
	if(isFirstLoad){
		centerMap();
	}
	isFirstLoad = false;
	//sortData();
}

/*
 * Transition
 */
function transitData(){
	console.log("transitData()");
	if(registeredActiveLoads.length > 0){
		return;
	}
	for(var i=0; i<registeredTransitioners.length; i++){
		registeredTransitioners[i]();
	}
	//sortData();
}

/*
 * register
 */
function registerActiveLoad(name){
	registeredActiveLoads.push(name);
}

/*
 * unregister
 */
function unregisterActiveLoad(name){
	var position = registeredActiveLoads.indexOf(name);
	registeredActiveLoads.splice(position, 1);
}

/*
 * register
 */
function registerActiveInitLoad(name){
	registeredActiveInitLoads.push(name);
}

/*
 * unregister
 */
function unregisterActiveInitLoad(name){
	var position = registeredActiveInitLoads.indexOf(name);
	registeredActiveInitLoads.splice(position, 1);
}

/*
 * open dialog
 */
function openDialog(domId, url){
	var iframe = document.getElementById(domId);
	if(iframe.src.indexOf("dummy") > 0){
		iframe.src = url;
	}
	d3.select("#"+domId).style("display","block");
	d3.select("#fade").style("display","block");
}

/*
 * centerMap
 */
function centerMap(){
	
	
	var mapWidth = ROOT_SVG.style("width").replace("px","");
	var mapHeight = ROOT_SVG.style("height").replace("px","");
	
	var mapBbox = getBboxOfG(MAP_SVG);
	
	var drawWidth = mapBbox.maxX - mapBbox.minX;
	var drawHeight = mapBbox.maxY - mapBbox.minY;
	
	var offsetX = mapBbox.maxX + mapBbox.minX;
	var offsetY = mapBbox.maxY + mapBbox.minY;

	var buffer10Width = drawWidth * 0.1;
	var buffer10Height = drawHeight * 0.1;
	
	drawWidth += buffer10Width;
	drawHeight += buffer10Height;
	
	var scaleX = mapWidth / drawWidth;
	var scaleY = mapHeight / drawHeight;
	
	var scale = scaleX;
	if(scaleY < scaleX){
		scale = scaleY;
	}
	
	var translateX = (mapWidth - offsetX*scale) / 2;
	var translateY = (mapHeight - offsetY*scale) / 2;
	
	MAP_SVG
		.transition()
		//.ease("bounce")
		.duration(2000)
		.attr("transform", function(){return "translate("+translateX+","+translateY+"),scale("+scale+")"});
	
	zoomBehavior = d3.behavior.zoom()
		.translate([translateX, translateY])
		.scale(scale)
		.scaleExtent([0, 8])
		.on("zoom", zoomEvent);
	
	//an dieser Stelle nicht MAP_SVG nutzen!
	d3.select("svg#map").call(zoomBehavior);
	
}

function createArrowEndMarker(){
	MAP_SVG.append("svg:defs").selectAll("marker")
	 .data(["medium"])
	 .enter().append("svg:marker")
	    .attr("id", "arrowEnd")               // As explained here: http://www.d3noob.org/2013/03/d3js-force-directed-graph-example-basic.html
	    .attr("viewBox", "0 -10 25 25")
	    .attr("refX", 10)
	    .attr("refY", 0)
	    .attr("markerWidth", 15)
	    .attr("markerHeight", 15)
	    .attr("orient", "auto")
	    .attr("markerUnits", "userSpaceOnUse")
	    .style("stroke","black")
	    .style("stroke-width",1)
	    .style("stroke-opacity",1)
	    .style("stroke-linecap", "butt")
	    .style("stroke-linejoin", "miter")
	    .style("fill", "none")
	  .append("svg:path")
	    .attr("d", "M0,-5L10,0L0,5");
	
}