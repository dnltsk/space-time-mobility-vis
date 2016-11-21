function selectGeometry(layerName, node){
	d3.selectAll("#geometry td").classed("selected", false);
	node.className = "selected";
	parent.updateBackgroundLayer(layerName);
	window.setTimeout(drawSignatures, 100);
}

function selectSignature(signatureAttr, node){
	d3.selectAll("#signature td").classed("selected", false);
	node.className = "selected";
	parent.updateSignature(signatureAttr);
	window.setTimeout(drawGeometries, 100);
}

var backgroundOpacityScale = d3.scale.quantize().range([0.166, 0.333, 0.5, 0.666, 0.833]);

var backgroundLayers = {};

var layersLoading = [];

function init(){
	for(var i=0; i<backgroundLayersNames.length; i++){
		backgroundLayers[backgroundLayersNames[i]] = {};
	}
	preloadLayers(draw);
}

function preloadLayers(nextStep){
	for(var i=0; i<backgroundLayersNames.length; i++){
		preloadLayer(backgroundLayersNames[i], draw);
	}
}

function preloadLayer(name, nextStep){
	layersLoading.push(name);
	d3.json("json/backgroundlayers/"+name+"_0_90.json", function(geoms){
		backgroundLayers[name].geoms = geoms.features;
		layersLoading.splice(layersLoading.indexOf(name), 1);
		nextStep();
	});
	layersLoading.push(name+"_atts");
	d3.json("json/backgroundlayers/"+name+"_attributes.json", function(atts){
		backgroundLayers[name].atts = atts.features;
		layersLoading.splice(layersLoading.indexOf(name+"_atts"), 1);
		nextStep();
	});
	layersLoading.push(name+"_overview");
	d3.json("json/backgroundlayers/"+name+"_overview.json", function(overview){
		backgroundLayers[name].overview = overview;
		layersLoading.splice(layersLoading.indexOf(name+"_overview"), 1);
		nextStep();
	});
}

function draw(){
	if(layersLoading.length > 0){
		return;
	}
	drawGeometries();
	drawSignatures();
	preselect();
}

/*
 *
 */
function drawGeometries(){
	d3.selectAll("#geometry svg")
		.each(function(){
			var geomSvg = d3.select(this);
			var layerName = geomSvg.attr("class");
			var signatureAttribute = parent.backgroundSignatureAttribute;
			
			backgroundOpacityScale.domain([backgroundLayers[layerName].overview["min_"+signatureAttribute], 
			                               backgroundLayers[layerName].overview["max_"+signatureAttribute]]);
			
			console.log("DIALOG: drawGeometries() für "+layerName+"/"+signatureAttribute+": range=",backgroundOpacityScale.domain());
			
			geomSvg.selectAll("path")
				.remove();
			geomSvg.selectAll("path")
				.data(backgroundLayers[layerName].geoms)
				.enter()
				.append("path")
				.attr("d", function(d){
					return parent.createBackgroundLayerFunction(d.vertices);
				})
				.style("fill", function(d, i){
					var signatureValue = backgroundLayers[layerName].atts[i][parent.backgroundSignatureAttribute];
					if(typeof signatureValue == "undefined"){
						return "WhiteSmoke";
					}
					return parent.LEGEND_DATA.colorMap[parent.currentBackgroundLayerId];
				})
				.style("fill-opacity", function(d, i){
					var signatureValue = backgroundLayers[layerName].atts[i][parent.backgroundSignatureAttribute];
					if(typeof signatureValue == "undefined"){
						return 1;
					}
					//var result = parent.backgroundOpacityScale(signatureValue);
					var result = backgroundOpacityScale(signatureValue);
					return result;
				})
				.style("stroke", "white")
				.style("stroke-width", "1");
	});
}

/*
 *
 */
function drawSignatures(){
	d3.selectAll("#signature svg")
		.each(function(){
			var geomSvg = d3.select(this);
			var layerName = parent.backgroundLayerName;
			var signatureAttribute = geomSvg.attr("class");
			backgroundOpacityScale.domain([backgroundLayers[layerName].overview["min_"+signatureAttribute], 
			                               backgroundLayers[layerName].overview["max_"+signatureAttribute]]);
			
			console.log("DIALOG: drawSignatures für "+layerName+"/"+signatureAttribute+": ",backgroundOpacityScale.domain());
			
			geomSvg.selectAll("path")
				.remove();
			geomSvg.selectAll("path")
				.data(backgroundLayers[layerName].geoms)
				.enter()
				.append("path")
				.attr("d", function(d){
					return parent.createBackgroundLayerFunction(d.vertices);
				})
				.style("fill", function(d, i){
					var signatureValue = backgroundLayers[layerName].atts[i][parent.backgroundSignatureAttribute];
					if(typeof signatureValue == "undefined"){
						return "WhiteSmoke";
					}
					return parent.LEGEND_DATA.colorMap["layer_"+signatureAttribute];
				})
				.style("fill-opacity", function(d, i){
					var signatureValue = backgroundLayers[layerName].atts[i][signatureAttribute];
					if(typeof signatureValue == "undefined"){
						return 1;
					}
					//var result = parent.backgroundOpacityScale(signatureValue);
					var result = backgroundOpacityScale(signatureValue);
					return result;
				})
				.style("stroke", "white")
				.style("stroke-width", "1");
	});
}

/*
 *
 */
function preselect(){
	d3.selectAll("#signature td")
		.each(function(){
			var td = d3.select(this);
			var svg = td.selectAll("svg")
			if(!svg.empty() && svg.classed(parent.backgroundSignatureAttribute)){
				td.classed("selected", true);
			}
		});
	
	d3.selectAll("#geometry td")
		.each(function(){
			var td = d3.select(this);
			var svg = td.selectAll("svg")
			if(!svg.empty() && svg.classed(parent.backgroundLayerName)){
				td.classed("selected", true);
			}
		});
}