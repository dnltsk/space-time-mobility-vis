var showLabels = false;
var gridSize = 2;
var elevations = [0, 30, 60, 90];
var elevation = 90;
var azimuths = [0, 45, 90, 135, 180, 225, 270, 315];
var azimuth = 0;
var backgroundLayerName = "ortsteile";
var backgroundLayerGeoms = null;
var backgroundLayerAtts = null;

var backgroundLayerOverview = null;
var backgroundSignatureAttribute = "POPULATION_psk";
var backgroundOpacityScale = d3.scale.quantize().range([0.166, 0.333, 0.5, 0.666, 0.833]);


function initLoadBackgroundLayerOverview(nextStep){
	registerActiveInitLoad("initLoadBackgroundLayerOverview");
	d3.json("json/backgroundlayers/"+backgroundLayerName+"_overview.json", 
			function(d){
				backgroundLayerOverview = d;
				backgroundOpacityScale.domain([backgroundLayerOverview["min_"+backgroundSignatureAttribute], 
				                               backgroundLayerOverview["max_"+backgroundSignatureAttribute]]);
				
				console.log("MAP: backgroundOpacityScale: ",backgroundOpacityScale.domain());
				
				unregisterActiveInitLoad("initLoadBackgroundLayerOverview");
				nextStep();
			});
}
registeredInitLoaders.push(initLoadBackgroundLayerOverview);

function loadWholeBackgroundLayer(nextStep){
	loadBackgroundLayerAtts(nextStep);
	loadBackgroundLayerGeoms(nextStep);
}
registeredLoaders.push(loadWholeBackgroundLayer);

function loadBackgroundLayerAtts(nextStep){
	registerActiveLoad("loadBackgroundLayerAtts");
	var url = "json/backgroundlayers/"+backgroundLayerName+"_attributes.json";
	d3.json(url, 
			function(d){
				backgroundLayerAtts = d.features;
				unregisterActiveLoad("loadBackgroundLayerAtts");
				nextStep();
			});
}

function loadBackgroundLayerGeoms(nextStep){
	registerActiveLoad("loadBackgroundLayerGeoms");
	var url = "json/backgroundlayers/"+backgroundLayerName+"_"+azimuth+"_"+elevation+".json";
	d3.json(url, 
			function(d){
				backgroundLayerGeoms = d.features;
				unregisterActiveLoad("loadBackgroundLayerGeoms");
				nextStep();
			});
}

/*
 * Wird von Background-Dialog bedient
 */
function updateBackgroundLayer(_backgroundLayerName){
	backgroundLayerName = _backgroundLayerName;
	
	loadWholeBackgroundLayer(drawData);
	initLoadBackgroundLayerOverview(drawUpdatedSignature);
	
	if(typeof updateCellCentroids != "undefined"){
		updateCellCentroids(drawInitCellCentroids);
	}
	if(typeof updateTrafficMatrix != "undefined"){
		updateTrafficMatrix(updateInitialArrows);
	}
}

function updateShowLabels(_showLabels){
	showLabels = _showLabels;
}

function updateGridSize(_gridSize){
	gridSize = _gridSize;
	var oldGridName = backgroundLayerName.substr(0,backgroundLayerName.length-1);
	var newBackgroundLayerName = oldGridName+gridSize
	updateBackgroundLayer(newBackgroundLayerName);
}

/*
 * Methode wird vom Background-Dialog bedient
 */
function updateSignature(_signatureAttr){
	backgroundSignatureAttribute = _signatureAttr;
	currentBackgroundLayerId = "layer_"+backgroundSignatureAttribute;
	backgroundOpacityScale.domain([backgroundLayerOverview["min_"+backgroundSignatureAttribute], 
	                               backgroundLayerOverview["max_"+backgroundSignatureAttribute]]);
	console.log("MAP: backgroundOpacityScale: ",backgroundOpacityScale.domain());
	drawUpdatedSignature();
}

/*
 * 
 */
function drawUpdatedSignature(){
	BACKGROUND_SVG.selectAll("path")
		.data(backgroundLayerGeoms)
		.transition()
		.duration(500)
		.style("fill-opacity", function(d, i){
			return getBackgroundLayerOpacity(i);
		})
		
		.style("fill", function(d, i){
			if(typeof backgroundLayerAtts[i][backgroundSignatureAttribute] == "undefined"){
				return "WhiteSmoke";
			}
			return LEGEND_DATA.colorMap[currentBackgroundLayerId];
		});
	
	drawLegend();
}

/*
 * 
 */
function updateElevation(_direction){
	var currentIndex = elevations.indexOf(elevation);
	//get new index
	var newIndex = 0;
	if(_direction > 0){
		newIndex = currentIndex+1; //im Uhrzeigersinn
	}else{
		newIndex = currentIndex-1;//gegen Uhrzeigersinn
	}
	//check new index
	if(newIndex >= elevations.length){
		newIndex = elevations.length-1;
	}else if(newIndex <= -1){
		newIndex = 0
	}
	elevation = elevations[newIndex];
	
	loadData(transitData);
}

function updateAzimuth(_direction){
	var currentIndex = azimuths.indexOf(azimuth);
	var newIndex = 0;
	if(_direction > 0){
		newIndex = currentIndex+1; //im Uhrzeigersinn
	}else{
		newIndex = currentIndex-1;//gegen Uhrzeigersinn
	}
	if(newIndex >= azimuths.length){
		newIndex = 0;
	}else if(newIndex <= -1){
		newIndex = azimuths.length-1;
	}
	azimuth = azimuths[newIndex];
	
	loadData(transitData);
}

/**
 ** D3-Draw procedures
 **/

/*
 * 
 */
var createBackgroundLayerFunction = d3.svg.line()
	.x(function(d, i){ return d[0]; })
	.y(function(d, i){ return d[1]; });
	//.interpolate("basis");

function getBackgroundLayerOpacity(i){
	var bgFeature = backgroundLayerAtts[i];
	var signatureValue = bgFeature[backgroundSignatureAttribute];
	if(typeof signatureValue == "undefined"){
		return 1;
	}
	var result = backgroundOpacityScale(signatureValue);
	return result;
}

/*
 * drawBackground */
function drawBackground(){
	console.log("drawBackground() BACKGROUND_SVG = "+BACKGROUND_SVG);
	//Create backgroundlayer
	
	BACKGROUND_SVG.selectAll("path")
		.remove();
	
	BACKGROUND_SVG.selectAll("path")
		.data(backgroundLayerGeoms)
		.enter()
		.append("path")
		.attr("d", function(d){
			return createBackgroundLayerFunction(d.vertices);
		})
		.style("fill", function(d, i){
			if(typeof backgroundLayerAtts[i][backgroundSignatureAttribute] == "undefined"){
				return "WhiteSmoke";
			}
			return LEGEND_DATA.colorMap[currentBackgroundLayerId];
		})
		.style("fill-opacity", function(d, i){
			return getBackgroundLayerOpacity(i);
		})
		.style("stroke", "white")
		.style("stroke-width", "1")
		.style("stroke-opacity", 1);
		
}
registeredDrawers.push(drawBackground);

/*
 * transitBackground
 */
function transitBackground(){
	BACKGROUND_SVG.selectAll("path")
		.data(backgroundLayerGeoms)
		.transition()
		.attr("d", function(d){
			return createBackgroundLayerFunction(d.vertices);
		});
}
registeredTransitioners.push(transitBackground);

/*
 * 
 */
function openBackgroundDialog(){
	openDialog("background_dialog", "dialog_background.html")
	//d3.select("#background_dialog").style("display","block");
	//d3.select("#fade").style("display","block");
}