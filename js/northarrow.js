var northarrow = null; 

/*
 *
 */
function initLoadNorthArrow(nextStep){
	if(northarrow != null){
		nextStep();
		return;
	}
	registerActiveLoad("initLoadNorthArrow");
	d3.json("json/northarrow/northarrow.json", 
			function(d){
		northarrow = d;
		unregisterActiveLoad("initLoadNorthArrow");
		nextStep();
	});
}
registeredLoaders.push(initLoadNorthArrow);

/*
 * 
 */
var createNortharrowFunction = d3.svg.line()
	.x(function(d, i){ return d[0]; })
	.y(function(d, i){ return d[1]; });
	//.interpolate("basis"

/*
 * drawNortharrow
 */
function drawNortharrow(){
	
	NORTHARROW_SVG.append("rect")
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
	
	NORTHARROW_SVG.selectAll("path")
		.remove();
	
	northarrow[azimuth][elevation].sort(function(a, b){
		var aPos = northarrow[azimuth].faceOrder.indexOf(a.name);
		var bPos = northarrow[azimuth].faceOrder.indexOf(b.name);
		return (aPos < bPos) ? -1 : 1;
	});
	
	NORTHARROW_SVG.selectAll("path")
		.data(northarrow[azimuth][elevation], function(d){return d.name;})
		.enter()
		.append("path")
		.attr("d", function(d){
			return createNortharrowFunction(d.vertices);
		})
		.style("fill", function(d){ return (d.isBlack)?"black":"white";})
		.style("fill-opacity", "1")
		.style("stroke", function(d){ return (d.isBlack)?"white":"black";})
		.style("stroke-width", "1");
	
	translateNorthArrow();
}
registeredDrawers.push(drawNortharrow);

/*
 * transitNortharrow
 */
function transitNortharrow(){
	northarrow[azimuth][elevation].sort(function(a, b){
		var aPos = northarrow[azimuth].faceOrder.indexOf(a.name);
		var bPos = northarrow[azimuth].faceOrder.indexOf(b.name);
		return (aPos < bPos) ? -1 : 1;
	});
	
	NORTHARROW_SVG.selectAll("path")
		.data(northarrow[azimuth][elevation], function(d){return d.name;})
		.order()
		.transition()
		.duration(1000)
		.attr("d", function(d){
			return createNortharrowFunction(d.vertices);
		});
}
registeredTransitioners.push(transitNortharrow);

/*
 * 
 */
function translateNorthArrow(){
	//var mapWidth = ROOT_SVG.style("width").replace("px","");
	//var mapHeight = ROOT_SVG.style("height").replace("px","");

	var northarrowBuffer = 12;
	var northarrowBbox = {"minX":-74,"minY":-64,"maxX":64,"maxY":64};

	//translateX = mapWidth-northarrowBbox.maxX-northarrowBuffer;
	//translateY = mapHeight-northarrowBbox.maxY-northarrowBuffer;
	translateX = northarrowBbox.maxX+northarrowBuffer;
	translateY = northarrowBbox.maxY+northarrowBuffer;
	
	NORTHARROW_SVG.attr("transform", function(){
		return "translate(103, 95) scale(.4,.4)";
	});
	
	NORTHARROW_SVG.select(".underlay")
		.attr("x", -257) //-257
		.attr("y", -237) //-237
		.attr("width", 523)//523
		.attr("height", 410);
}