var CELL_CENTROIDS_POINTS_SVG = null;
var CELL_ARROWS_SVG = null;
var TRAFFIC_DIRECTION_SOURCE = "outgoing";
var TRAFFIC_DIRECTION_DEST = "incoming";
var circleScaleFactor = 0;

var wholeTrafficMatrix = null;
var trafficCellCentroids = null;
var maxTrafficValue = null;
var minTrafficValue = null;
var trafficDirection = TRAFFIC_DIRECTION_SOURCE;
var srcLocationType = "ALL";
var destLocationType = "ALL";

var streamColor = d3.scale.quantize()
						  .domain([0,24])
						  .range(["#BD0026","#F03B20","#FD8D3C","#FECC5C","#FFFFB2"]);
							
var streamMouseoutTimeout = null;
var streamFixed = false;

/*
 * 
 */
function initCellCentroids(nextStep){
	console.log("initCellCentroids() backgroundLayerName = "+backgroundLayerName);
	registerActiveInitLoad("initCellCentroids");
	d3.json("json/traffic/"+backgroundLayerName+"_centroids.json", 
			function(d){
				trafficCellCentroids = d;
				unregisterActiveInitLoad("initCellCentroids");
				if(typeof nextStep == "function"){
					nextStep();
				}
			});
}
registeredInitLoaders.push(initCellCentroids);

/*
 * 
 */
function updateCellCentroids(nextStep){
	console.log("updateCellCentroids() backgroundLayerName = "+backgroundLayerName);
	d3.json("json/traffic/"+backgroundLayerName+"_centroids.json", 
			function(d){
				trafficCellCentroids = d;
				if(typeof nextStep == "function"){
					nextStep();
				}
			});
}

/*
 * 
 */
function initTrafficMatrix(nextStep){
	console.log("initTrafficMatrix() backgroundLayerName = "+backgroundLayerName+" srcLocationType = "+srcLocationType+" trafficDirection = " +trafficDirection);
	registerActiveInitLoad("initTrafficMatrix");
	d3.json("json/traffic/"+backgroundLayerName+".json", 
			function(d){
				wholeTrafficMatrix = d;
				calcCircleScaleFactor();
				console.log("initTrafficMatrix() LOADED!");
				unregisterActiveInitLoad("initTrafficMatrix");
				if(typeof nextStep == "function"){
					nextStep();
				}
	});
}
registeredInitLoaders.push(initTrafficMatrix);

/*
 * 
 */
function updateTrafficMatrix(nextStep){
	console.log("updateTrafficMatrix() backgroundLayerName = "+backgroundLayerName+" backgroundSignatureAttribute = "+backgroundSignatureAttribute+" trafficDirection = "+trafficDirection);
	//registerActiveLoad("updateTrafficMatrix");
	d3.json("json/traffic/"+backgroundLayerName+".json", 
			function(d){
				wholeTrafficMatrix = d;
				calcCircleScaleFactor();	
				//unregisterActiveLoad("updateTrafficMatrix");
				if(typeof nextStep == "function"){
					nextStep();
				}
	});
}

/*
 * 
 */
function updateSrcLocationType(newSrcLocationType){
	srcLocationType = newSrcLocationType;
	calcCircleScaleFactor();
	updateInitialArrows();
}

/*
 * 
 */
function updateDestLocationType(newDestLocationType){
	destLocationType = newDestLocationType;
	calcCircleScaleFactor();	
	updateInitialArrows();
}

/*
 * 
 */
function updateTrafficDir(newTrafficDirection){
	trafficDirection = newTrafficDirection;
	//updateTrafficMatrix(updateInitialArrows);
	calcCircleScaleFactor();
	updateInitialArrows();
}

/*
 * TOOLTIP
 */
function showTraficTooltip_firstLevel(sourcePath, sourcePos){
	
	if(!wholeTrafficMatrix[srcLocationType][destLocationType]){
		return;
	}
	
	var xPosition = d3.mouse(d3.select('body').node())[0]+15;
	var yPosition = d3.mouse(d3.select('body').node())[1]+15;
	
	var tt = d3.select("#tooltip");
	
	tt.style("left", xPosition + "px")
	  .style("top", yPosition + "px")
	  .style("background","none");
	
	/* Headline */
	tt.append("p")
	  .append("b")
	  .text(function(){
			if(trafficDirection == TRAFFIC_DIRECTION_SOURCE){
				return "Quellverkehr";
			}else{
				return "Zielverkehr";
			}
	  });
	/*tt.append("p")
	  .text(function(){
		  return "von "+
		  		 findTrafficStandorttypName(srcLocationType)+
		  		 " zu "+
		  		findTrafficStandorttypName(destLocationType);
	  });*/
	tt.append("p").text(" ");
	
	
	/* traffic bin */
	var trafficBin = 0;
	if(wholeTrafficMatrix[srcLocationType][destLocationType][sourcePos] && wholeTrafficMatrix[srcLocationType][destLocationType][sourcePos][sourcePos]){
		trafficBin = wholeTrafficMatrix[srcLocationType][destLocationType][sourcePos][sourcePos];
	}
	
	/* calc whole traffic */
	var trafficValue = 0;
	if(trafficDirection == TRAFFIC_DIRECTION_SOURCE){
		//traffic
		d3.keys(wholeTrafficMatrix[srcLocationType][destLocationType][sourcePos]).forEach(function(_targetPos){
			if(_targetPos!="tts" && _targetPos!="ttd" && _targetPos!="tt"){
				trafficValue += wholeTrafficMatrix[srcLocationType][destLocationType][sourcePos][_targetPos];
				console.log("counting ausgehenden Verkehr: srcLocationType="+srcLocationType+" destLocationType="+destLocationType+
					        "\nquelle = "+sourcePos+" ziel="+_targetPos+" value="+wholeTrafficMatrix[srcLocationType][destLocationType][sourcePos][_targetPos]+
					        " sum="+trafficValue);
			}
		});
		tt.append("p")
		  	.text(function(){	
				return "Ausgehender Verkehr: "+trafficValue;
		  	});
	}else{
		/* unterschied zu OUTGOING: source und dest vertauscht! */
		//traffic
		d3.keys(wholeTrafficMatrix[srcLocationType][destLocationType]).forEach(function(_targetPos){
			if(_targetPos!="tts" && _targetPos!="ttd" && _targetPos!="tt"){
				if(wholeTrafficMatrix[srcLocationType][destLocationType][_targetPos][sourcePos]){
					trafficValue += wholeTrafficMatrix[srcLocationType][destLocationType][_targetPos][sourcePos];
					console.log("counting eingehenden Verkehr: srcLocationType="+srcLocationType+" destLocationType="+destLocationType+
						        "\nquelle = "+_targetPos+" ziel="+sourcePos+" value="+wholeTrafficMatrix[srcLocationType][destLocationType][_targetPos][sourcePos]+
						        " sum="+trafficValue);
				}
			}
		});
		tt.append("p")
		  	.text(function(){	
		  		return "Eingehender Verkehr: "+trafficValue;
		  	});
	}
	
	if(trafficValue > 0){
		
		tt.append("p").text(function(){
			if(trafficBin != 0){
				var trafficBinRel = (100/trafficValue*trafficBin);
				trafficBinRel = Math.round(trafficBinRel*10)/10;
				return "davon Binnenverkehr: "+trafficBin + " ("+trafficBinRel+"%)";
			}else{
				return "davon Binnenverkehr: -/-";
			}
		});
		
		
		//if(srcLocationType == "ALL"){
		var ttTable = tt.append("table").classed("trafficTooltip", true);
		var ttTableHead = ttTable.append("tr");
		ttTableHead.append("th")
		           .html("Vorgänger-<br>Standorttypen");
		ttTableHead.append("th")
	    			.html("Folge-<br>Standorttypen");
		
		var ttBody = ttTable.append("tr");
		var svgVorgaenger = ttBody.append("td").append("svg");
		var svgFolge = ttBody.append("td").append("svg");
		addVorgaengerPie(sourcePos, svgVorgaenger);
		addFolgePie(sourcePos, svgFolge);
	}

	d3.select("#tooltip *")
	  .style("opacity",1);
	
	/* and show! */
	tt.classed("hidden", false);
	
	var ttb = d3.select("#tooltip_background")
	.style("left", xPosition + "px")
	.style("top", yPosition + "px")
	.style("width", tt.style("width"))
	.style("height", tt.style("height"))
	.style("opacity", .5)
	.classed("hidden", false);
}

/*
 * 
 */
function addVorgaengerPie(sourcePos, svgElement){
	
	var pieData = [];
	
	if(trafficDirection == TRAFFIC_DIRECTION_SOURCE){
		
		d3.keys(wholeTrafficMatrix).forEach(function(_srcLocationType){
			if(_srcLocationType.indexOf("ALL") == -1
					&& _srcLocationType.indexOf("_avg") == -1
					&& _srcLocationType.indexOf("_min") == -1
					&& _srcLocationType.indexOf("_max") == -1
					&& _srcLocationType.indexOf("tt") == -1
					&& _srcLocationType.indexOf("tts") == -1
					&& _srcLocationType.indexOf("ttd") == -1){
				
				if(srcLocationType != "ALL" && srcLocationType != _srcLocationType){
					return;
				}
				
				if(wholeTrafficMatrix[_srcLocationType][destLocationType] 
					&& wholeTrafficMatrix[_srcLocationType][destLocationType][sourcePos]){
					
					var trafficVolume = 0;
				
					d3.keys(wholeTrafficMatrix[_srcLocationType][destLocationType][sourcePos]).forEach(function(_destPos){
						if(_destPos.indexOf("tt") == -1 && _destPos.indexOf("tts") == -1 && _destPos.indexOf("ttd") == -1){
							trafficVolume += wholeTrafficMatrix[_srcLocationType][destLocationType][sourcePos][_destPos];
						}
					});
					
					if(trafficVolume>0){
						console.log("Vorgaenger pie srcLocationType = "+_srcLocationType+" trafficVolume = "+trafficVolume);
						pieData.push({"locationType":_srcLocationType,"trafficVolume":trafficVolume});
	
					}
				}
			}
		});
		
	}else if(trafficDirection == TRAFFIC_DIRECTION_DEST){
		//unterschied zu OUTGOING: sourcePos und destPos vertauscht!
		
		d3.keys(wholeTrafficMatrix[srcLocationType]).forEach(function(_destLocationType){
			if(_destLocationType.indexOf("ALL") == -1
					&& _destLocationType.indexOf("_avg") == -1
					&& _destLocationType.indexOf("_min") == -1
					&& _destLocationType.indexOf("_max") == -1
					&& _destLocationType.indexOf("tt") == -1
					&& _destLocationType.indexOf("tts") == -1
					&& _destLocationType.indexOf("ttd") == -1){
				
				if(destLocationType != "ALL" && destLocationType != _destLocationType){
					return;
				}
				
				var trafficVolume = 0;
				
				d3.keys(wholeTrafficMatrix[srcLocationType][_destLocationType]).forEach(function(_destPos){
					if(_destPos.indexOf("tt") == -1 && _destPos.indexOf("tts") == -1 && _destPos.indexOf("ttd") == -1){
						if(wholeTrafficMatrix[srcLocationType][_destLocationType][_destPos][sourcePos]){
							trafficVolume += wholeTrafficMatrix[srcLocationType][_destLocationType][_destPos][sourcePos];
						}
					}
				});
				
				if(trafficVolume>0){
					console.log("Vorgaenger pie srcLocationType = "+_destLocationType+" trafficVolume = "+trafficVolume);
					pieData.push({"locationType":_destLocationType,"trafficVolume":trafficVolume});

				}
			}
		});
		
	}
	
	pieData.sort(function(a, b){
		return b.trafficVolume - a.trafficVolume;
	});
	
	addPie(pieData, svgElement);
	
}

/*
 * 
 */
function addFolgePie(sourcePos, svgElement){
	console.log("addFolgePie() start");
	var pieData = [];
	
	if(trafficDirection == TRAFFIC_DIRECTION_SOURCE){
		
		if(destLocationType != "ALL"){
			
			d3.keys(wholeTrafficMatrix[srcLocationType]).forEach(function (_destLocationType){
				if(_destLocationType.indexOf("ALL") == -1
						&& _destLocationType.indexOf("_avg") == -1
						&& _destLocationType.indexOf("_min") == -1
						&& _destLocationType.indexOf("_max") == -1
						&& _destLocationType.indexOf("tt") == -1
						&& _destLocationType.indexOf("tts") == -1
						&& _destLocationType.indexOf("ttd") == -1){
					
					if(wholeTrafficMatrix[srcLocationType][_destLocationType] 
						&& wholeTrafficMatrix[srcLocationType][_destLocationType][sourcePos]){
					
						var trafficVolume = 0;
						
						d3.keys(wholeTrafficMatrix[srcLocationType][_destLocationType][sourcePos]).forEach(function(_destPos){
							if(_destPos.indexOf("tt") == -1 && _destPos.indexOf("tts") == -1 && _destPos.indexOf("ttd") == -1){
								trafficVolume += wholeTrafficMatrix[srcLocationType][_destLocationType][sourcePos][_destPos];
							}
						});
						
						if(trafficVolume > 0){
							console.log("addFolgePie destLocationType = "+_destLocationType+" sum = "+trafficVolume);
							pieData.push({"locationType":_destLocationType,"trafficVolume":trafficVolume});
						}
					}
				}
			});
		
		}else{
			
			d3.keys(wholeTrafficMatrix["ALL"]).forEach(function (_destLocationType){
				if(_destLocationType.indexOf("ALL") == -1
						&& _destLocationType.indexOf("_avg") == -1
						&& _destLocationType.indexOf("_min") == -1
						&& _destLocationType.indexOf("_max") == -1
						&& _destLocationType.indexOf("tt") == -1
						&& _destLocationType.indexOf("tts") == -1
						&& _destLocationType.indexOf("ttd") == -1){
					
					if(wholeTrafficMatrix[srcLocationType][_destLocationType] 
						&& wholeTrafficMatrix[srcLocationType][_destLocationType][sourcePos]){
					
						var trafficVolume = 0;
						
						d3.keys(wholeTrafficMatrix[srcLocationType][_destLocationType][sourcePos]).forEach(function(_destPos){
							if(_destPos.indexOf("tt") == -1 && _destPos.indexOf("tts") == -1 && _destPos.indexOf("ttd") == -1){
								trafficVolume += wholeTrafficMatrix[srcLocationType][_destLocationType][sourcePos][_destPos];
							}
						});
						
						if(trafficVolume > 0){
							console.log("addFolgePie destLocationType = "+_destLocationType+" sum = "+trafficVolume);
							pieData.push({"locationType":_destLocationType,"trafficVolume":trafficVolume});
						}
					}
				}
			});
			
		}
		
	}else if(trafficDirection == TRAFFIC_DIRECTION_DEST){
		//Unterschied zu OUTGOING: sourcePos und targetPos sind vertauscht!
		
		d3.keys(wholeTrafficMatrix).forEach(function (_srcLocationType){
			if(_srcLocationType.indexOf("ALL") == -1
					&& _srcLocationType.indexOf("_avg") == -1
					&& _srcLocationType.indexOf("_min") == -1
					&& _srcLocationType.indexOf("_max") == -1
					&& _srcLocationType.indexOf("tt") == -1
					&& _srcLocationType.indexOf("tts") == -1
					&& _srcLocationType.indexOf("ttd") == -1){
				
				if(srcLocationType != "ALL" && srcLocationType != _srcLocationType){
					return;
				}
				
				if(wholeTrafficMatrix[_srcLocationType][destLocationType]){
					
					var trafficVolume = 0;
				
					d3.keys(wholeTrafficMatrix[_srcLocationType][destLocationType]).forEach(function(_destPos){
						if(_destPos.indexOf("tt") == -1 && _destPos.indexOf("tts") == -1 && _destPos.indexOf("ttd") == -1){
							if(wholeTrafficMatrix[_srcLocationType][destLocationType][_destPos][sourcePos]){
								trafficVolume += wholeTrafficMatrix[_srcLocationType][destLocationType][_destPos][sourcePos];
							}
						}
					});
					
					if(trafficVolume > 0){
						console.log("Folge pie destLocationType = "+_srcLocationType+" sum = "+trafficVolume);
						pieData.push({"locationType":_srcLocationType,"trafficVolume":trafficVolume});
					}
				}
			}
		});
		
	}
	
	pieData.sort(function(a, b){
		return b.trafficVolume - a.trafficVolume;
	});
	
	addPie(pieData, svgElement);
	
}

/*
 * 
 */
function addPie(pieData, svgElement){
	
	/*var data = [
	{"locationType":"<5","trafficVolume":2704659},
	{"locationType":"5-13","trafficVolume":4499890},
	{"locationType":"14-17","trafficVolume":2159981},
	{"locationType":"18-24","trafficVolume":3853788},
	{"locationType":"25-44","trafficVolume":14106543},
	{"locationType":"45-64","trafficVolume":8819342},
	{"locationType":">=65","trafficVolume":612463}
	];*/
	
	var width = 135,
    height = 115 + pieData.length * LEGEND_CONFIG.fontSize,
    radius = (Math.min(width, height) / 2) * 0.75;

	var arc = d3.svg.arc()
	    .outerRadius(radius-10)
	    .innerRadius(0);
	
	var pie = d3.layout.pie()
	    .sort(null)
	    .value(function(d) { return d.trafficVolume; });
	
	var svg = svgElement
	    .attr("width", width)
	    .attr("height", height)
	  .append("g")
	    .attr("transform", "translate(" + (radius+15) + "," + radius + ")");
	
	pieData.forEach(function(d) {
	    d.trafficVolume = +d.trafficVolume;
	  });

	  var g = svg.selectAll(".arc")
	      .data(pie(pieData))
	    .enter().append("g")
	      .attr("class", "arc");
	
	  g.append("path")
	      .attr("d", arc)
	      .style("fill", function(d, i) { 
	    	  var color = LEGEND_DATA.colorMap.layer_possibilities[d.data.locationType];
	    	  return color; 
	      });
	
	  /*g.append("text")
	      .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
	      .attr("dy", ".35em")
	      .style("text-anchor", "middle")
	      .text(function(d) { return d.data.locationType; });*/

	  var trafficVolumeSum = d3.sum(pieData, function(d){return d.trafficVolume});
	  
	  var pieLegend = svgElement
	  	.append("g")
	  	.attr("transform", "translate(" +0+ "," + radius*2 + ")");

	  pieLegend.selectAll("rect")
		   .data(pieData)
		   .enter()
		   .append("rect")
		   .attr("x", 0)
		   .attr("y", function(d, i){
			   	return 10+15*i;
		   })
		   .attr("width", 20)
	 	   .attr("height", 10)
	 	   .style("fill", function(d, i) { 
		   	    var color = LEGEND_DATA.colorMap.layer_possibilities[d.locationType];
		   	    return color; 
	       });
	  
	  pieLegend.selectAll("text")
	  		   .data(pieData)
	  		   .enter()
	  		   .append("text")
	  		   .attr("x", 25)
	  		   .attr("y", function(d, i){
	  			   return 20+15*i;
	  		   })
	  		   .text(function(d){ 
	  			   return findTrafficStandorttypName(d.locationType, true)+
	  			          " ("+((d.trafficVolume / trafficVolumeSum) * 100).toFixed(1)+"%)"; 
	  		   });
	  
}

/*
 * 
 */
function showTraficTooltip_secondLevel(sourcePath, sourcePos, targetPath, targetPos){
	
}

/*
 * 
 */
function hideTrafficTooltip(){
	d3.selectAll(".tooltip").classed("hidden", true);
    d3.selectAll("#tooltip *").remove();
}

/*
 * DRAWING 
 */
function drawInitCellCentroids(){
	console.log("drawInitCellCentroids()");
	if(CELL_CENTROIDS_POINTS_SVG == null){
		CELL_CENTROIDS_POINTS_SVG = MAP_SVG.append("g");
	}else{
		CELL_CENTROIDS_POINTS_SVG.selectAll("*").remove();
	}
	CELL_CENTROIDS_POINTS_SVG.selectAll("circle")
		.data(trafficCellCentroids)
		.enter()
		.append("circle")
		.attr("cx", function(d){return d[0];})
		.attr("cy", function(d){return d[1];})
		.attr("r", function(d){return 0;})
		.style("pointer-events","none")
		.style("fill", "black");
	updateInitialArrows();
}
registeredDrawers.push(drawInitCellCentroids);

/*
 * 
 */
function drawInitCellArrows(){
	
}


/*
 * 
 */
function appendOnMouseOverShowTraffic(){
	console.log("appendOnMouseOverShowTraffic()");
	streamColor.domain([0, BACKGROUND_SVG.selectAll("path").size()*2]);
	streamFixed = false;
	BACKGROUND_SVG.selectAll("path")
				  .on("mouseover", function(d, i){
					  if(streamFixed){
						 return; 
					  }
					  removeAllArrows();
					  showStreamHalo(d3.select(this));
					  window.clearTimeout(streamMouseoutTimeout);
					  var maxI = BACKGROUND_SVG.selectAll("path").size();
					  showTraffic(i, maxI);
					  showStreamLegend();
					  addArrows(d3.select(this), i);
					  showTraficTooltip_firstLevel(d3.select(this), i);
				  })
				  .on("mouseout", function(d, i){
					  if(streamFixed){
						  return;
					  }
					  clearStreamHalo(d3.select(this));
					  updateInitialArrows();
					  streamMouseoutTimeout = window.setTimeout(rollbackOriginalState, 100);
					  hideTrafficTooltip();
				  })
				  .on("click", function(d, i){
					  streamFixed = !streamFixed;
					  if(!streamFixed){
						  //simulate mouseover!
						  clearAllStreamHalos();
						  removeAllArrows();
						  addArrows(d3.select(this));
						  showStreamHalo(d3.select(this));
						  window.clearTimeout(streamMouseoutTimeout);
						  var maxI = BACKGROUND_SVG.selectAll("path").size();
						  showTraffic(i, maxI);
					  }
				  });
}
registeredDrawers.push(appendOnMouseOverShowTraffic);

/*
 * 
 */
function rollbackOriginalState(){
	console.log("rollbackOriginalState()");
	drawBackground();
	appendOnMouseOverShowTraffic();
	hideStreamLegend();
}

/*
 * 
 */
function showTraffic(selectedI, maxI){
	console.log("showTraffic() selectedI="+selectedI + "maxI="+maxI);
	CELL_CENTROIDS_POINTS_SVG.selectAll("circle")
						  .transition()
						  .attr("r", function(d, i){
							  try{
								  //var attr = backgroundSignatureAttribute.replace("_psk","");
								  if(trafficDirection == TRAFFIC_DIRECTION_SOURCE){
									  if(wholeTrafficMatrix[srcLocationType][destLocationType][selectedI] 
									     && wholeTrafficMatrix[srcLocationType][destLocationType][selectedI][i]){
										  return Math.sqrt(wholeTrafficMatrix[srcLocationType][destLocationType][selectedI][i] / Math.PI) * circleScaleFactor;
									  }
									  return 0;
								  }else{
									  if(wholeTrafficMatrix[srcLocationType][destLocationType][i] 
									     && wholeTrafficMatrix[srcLocationType][destLocationType][i][selectedI]){
										  return Math.sqrt(wholeTrafficMatrix[srcLocationType][destLocationType][i][selectedI] / Math.PI) * circleScaleFactor;
									  }
									  return 0;
								  }
							  }catch(e){
								  return 0;
							  }
						  });
	
	
}

/*
 * 
 */
function addArrows(sourcePath, sourcePos){
	console.log("addArrows()");
	var arrows = MAP_SVG.append("g").attr("id", "arrows");
	
	var sourcePoint = trafficCellCentroids[sourcePos];
	var count = BACKGROUND_SVG.selectAll("path").size();
	
	if(!wholeTrafficMatrix[srcLocationType][destLocationType]
		|| !wholeTrafficMatrix[srcLocationType][destLocationType][sourcePos]){
		return;
	}
	
	var top10 = [];
	if(trafficDirection == TRAFFIC_DIRECTION_SOURCE){
		top10 = wholeTrafficMatrix[srcLocationType][destLocationType][sourcePos].tts;
	}else{
		top10 = wholeTrafficMatrix[srcLocationType][destLocationType][sourcePos].ttd;
	}
	
	for(var i=0; i<top10.length; i++){
		var targetPos = top10[i];

		console.log("addArrow sourcePos="+sourcePos+" targetPos="+targetPos);
		
		if(sourcePos == targetPos){
			continue;
		}
						
		
		//if(!trafficMatrix[sourcePos]){
		//	continue;
		//}
			
		var targetPoint = trafficCellCentroids[targetPos];
		
		var arrow = arrows.append("path")
			  .attr("d", function(d) {
				  var dx = targetPoint[0] - sourcePoint[0],
			      	  dy = targetPoint[1] - sourcePoint[1],
			          dr = Math.sqrt(dx * dx + dy * dy);
			      return "M" + 
			      	  sourcePoint[0] + "," + 
			      	  sourcePoint[1] + "A" + 
			          dr + "," + dr + " 0 0,1 " + 
			          targetPoint[0] + "," + 
			          targetPoint[1];
			    })
			  .style("stroke", "black")
			  .style("stroke-width", function(d, i){
				  /*var width = JSON.parse(JSON.stringify(trafficMatrix[sourcePos][targetPos].targets/10 ));
				  if(width < 1){
					  return 1;
				  }
				  return width;*/
				  return 1;
			  })
			  .style("stroke-linecap", "butt")
			  //.style("stroke-dasharray", "5, 5")
			  .style("stroke-opacity", 1)
			  .style("fill","none")
			  .style("pointer-events","none");
		

		/* end */
		
		if(trafficDirection == TRAFFIC_DIRECTION_SOURCE){
			//outgoing
			var arrowOffset = Math.sqrt(wholeTrafficMatrix[srcLocationType][destLocationType][sourcePos][targetPos] / Math.PI) * circleScaleFactor + 2;
			var currentLength = arrow.node().getTotalLength();
			var newLength = currentLength - arrowOffset;
			var endPoint = arrow.node().getPointAtLength(newLength);
			var newTargetPoint = [endPoint.x, endPoint.y];
			
			/* start */
			var arrowOffset2 = 0;
			if(wholeTrafficMatrix[srcLocationType][destLocationType][sourcePos] && wholeTrafficMatrix[srcLocationType][destLocationType][sourcePos][sourcePos]){
				arrowOffset2 = Math.sqrt(wholeTrafficMatrix[srcLocationType][destLocationType][sourcePos][sourcePos] / Math.PI) * circleScaleFactor + 2;
			}
			
			var startPoint = arrow.node().getPointAtLength(arrowOffset2);
			var newSourcePoint = [startPoint.x, startPoint.y];
		}else{
			//incoming: source und target vertauschen!
			var arrowOffset = Math.sqrt(wholeTrafficMatrix[srcLocationType][destLocationType][targetPos][sourcePos] / Math.PI) * circleScaleFactor + 2;
			var currentLength = arrow.node().getTotalLength();
			var newLength = currentLength - arrowOffset;
			var endPoint = arrow.node().getPointAtLength(newLength);
			var newTargetPoint = [endPoint.x, endPoint.y];
			
			/* start */
			var arrowOffset2 = 0;
			if(wholeTrafficMatrix[srcLocationType][destLocationType][sourcePos] && wholeTrafficMatrix[srcLocationType][destLocationType][sourcePos][sourcePos]){
				arrowOffset2 = Math.sqrt(wholeTrafficMatrix[srcLocationType][destLocationType][sourcePos][sourcePos] / Math.PI) * circleScaleFactor + 2;
			}
			
			var startPoint = arrow.node().getPointAtLength(arrowOffset2);
			var newSourcePoint = [startPoint.x, startPoint.y];
		}
		
		
		arrow.attr("d", function(d) {
			var dx = newTargetPoint[0] - newSourcePoint[0],
	      	    dy = newTargetPoint[1] - newSourcePoint[1],
	            dr = Math.sqrt(dx * dx + dy * dy);
			if(trafficDirection == TRAFFIC_DIRECTION_SOURCE){
				return "M" + 
				  	newSourcePoint[0] + "," + 
				  	newSourcePoint[1] + "A" + 
		          	dr + "," + dr + " 0 0,1 " + 
		          	newTargetPoint[0] + "," + 
		          	newTargetPoint[1];
			}else{
				return "M" + 
				 	newTargetPoint[0] + "," + 
					newTargetPoint[1]+ "A" + 
					dr + "," + dr + " 0 0,0 " + 
					newSourcePoint[0] + "," + 
					newSourcePoint[1];
			}
	    })
	    .attr("marker-end", "url(#arrowEnd)");
		
	}
}

/*
 * 
 */
function removeAllArrows(){
	console.log("removeAllArrows()");
	MAP_SVG.selectAll("g#arrows").remove();
	CELL_CENTROIDS_POINTS_SVG.selectAll("circle").transition().attr("r",0);
}

/**
 * 
 */
function updateInitialArrows(){
	console.log("updateInitialArrows()");
	
	removeAllArrows();
	
	if(!wholeTrafficMatrix[srcLocationType][destLocationType]){
		return;
	}
	
	var arrows = MAP_SVG.append("g").attr("id", "arrows");
	
	var top10 = wholeTrafficMatrix[srcLocationType][destLocationType].tt;
	
	for(var i=0; i<top10.length; i++){
		var sourcePos = top10[i][0]
		var targetPos = top10[i][1];
		
		var sourcePoint = trafficCellCentroids[sourcePos];
		var targetPoint = trafficCellCentroids[targetPos];
		
		if(sourcePos == targetPos){
			drawCircleArrow(sourcePoint, arrows);
			continue;
		}
		
			
		var arrow = arrows.append("path")
			  .attr("d", function(d) {
				  var dx = targetPoint[0] - sourcePoint[0],
			      	  dy = targetPoint[1] - sourcePoint[1],
			          dr = Math.sqrt(dx * dx + dy * dy);
			      return "M" + 
			      	  sourcePoint[0] + "," + 
			      	  sourcePoint[1] + "A" + 
			          dr + "," + dr + " 0 0,1 " + 
			          targetPoint[0] + "," + 
			          targetPoint[1];
			    })
			  .style("stroke", "black")
			  .style("stroke-width", function(d, i){
				  /*var width = JSON.parse(JSON.stringify( trafficMatrix[sourcePos][targetPos].targets/10 ));
				  if(width < 1){
					  return 1;
				  }
				  return width;*/
				  return 1;
			  })
			  .style("stroke-linecap", "round")
			  //.style("stroke-dasharray", "5, 5")
			  .style("stroke-opacity", 1)
			  .style("fill","none")
			  .style("pointer-events","none");
		

		var arrowOffset = 6;
		var currentLength = arrow.node().getTotalLength();
		var newLength = currentLength - arrowOffset;

		var startPoint = arrow.node().getPointAtLength(arrowOffset);
		sourcePoint = [startPoint.x, startPoint.y];
		
		var endPoint = arrow.node().getPointAtLength(newLength);
		targetPoint = [endPoint.x, endPoint.y];
			
		arrow.attr("d", function(d) {
			var dx = targetPoint[0] - sourcePoint[0],
	      	  dy = targetPoint[1] - sourcePoint[1],
	          dr = Math.sqrt(dx * dx + dy * dy);
	      return "M" + 
	      	  sourcePoint[0] + "," + 
	      	  sourcePoint[1] + "A" + 
	          dr + "," + dr + " 0 0,1 " + 
	          targetPoint[0] + "," + 
	          targetPoint[1];
	    })
	    .attr("marker-end", "url(#arrowEnd)");
		
	}
	drawLegend();
}
registeredDrawers.push(updateInitialArrows);

function drawCircleArrow(centerPoint, parentGroup){
	var radius = 10,
	padding = 10,
	radians = 2 * Math.PI;
	
	var dimension = (2 * radius) + (2 * padding),
	points = 10;
	
	var angle = d3.scale.linear()
	.domain([0, points])
	.range([0, radians]);
	
	var line = d3.svg.line.radial()
	.interpolate("basis")
	.tension(0)
	.radius(radius)
	.angle(function(d, i) { return angle(i); });
	
	var newGroup = parentGroup.append("g");
	
	newGroup.append("path").datum(d3.range(points))
	.style("stroke","black")
	.style("fill","none")
	.attr("class", "line")
	.attr("d", line)
	.attr("transform", "translate(" + (centerPoint[0]) + ", " + (centerPoint[1]) + ") rotate(200)")
	.attr("marker-end","url(#arrowEnd)");
}


/*
 * 
 */
function showStreamHalo(path){
	path.style("stroke", "yellow")
		.style("stroke-width", 3);
}

/*
 * 
 */
function clearStreamHalo(path){
	path.style("stroke", "white")
	.style("stroke-width", 1);
}

/*
 * 
 */
function clearAllStreamHalos(){
	BACKGROUND_SVG.selectAll("path")
				  .style("stroke", "white")
				  .style("stroke-width", 1);
}



/**
 ** 
 ** LEGEND
 **
 */

/*
 * 
 */
function hideStreamLegend(){
	LEGEND_SVG.select("g.backgroundlayer").style("display","block");
	LEGEND_SVG.select("g.streamlayer").style("display","none");
}

/*
 * 
 */
function showStreamLegend(){
	return;
	
	var currentOffset = parseInt(LEGEND_SVG.select("g.backgroundlayer text:first-child").attr("y"));
	
	LEGEND_SVG.select("g.backgroundlayer").style("display","none");
	
	LEGEND_SVG.selectAll(".streamlayer").remove();
	var layerSvg = LEGEND_SVG.append("g").classed("streamlayer", true);

	//append Groupname
	layerSvg.append("text")
		 .attr("x", 0)
		 .attr("y", currentOffset)
		 .style("font-weight", "bold")
		 .style("font-size", LEGEND_CONFIG.fontSizePt)
		 .style("font-family", LEGEND_CONFIG.fontFamily)
		 //.text(group.de);
		 .text(function(){ 
			 return "Verkehrsströme";
		 });
	
	currentOffset += LEGEND_CONFIG.fontSize + 5;
	
	var maxValue = streamColor.domain()[1];
	var minValue = streamColor.domain()[0];
	var divValue = maxValue - minValue;
	
	labelOffset = LEGEND_CONFIG.iconWidth + LEGEND_CONFIG.iconMargin;
	for(var i=0; i<streamColor.range().length; i++){
		
		layerSvg.append("rect")
			.attr("x", function(){return 0})
			.attr("y", function(){return currentOffset - LEGEND_CONFIG.iconWidth / 2})
			.attr("width", function(){return LEGEND_CONFIG.iconWidth})
			.attr("height", function(){return LEGEND_CONFIG.iconHeight})
			.style("fill", "white")
			.style("stroke", "none");
		
		layerSvg.append("rect")
			.attr("x", function(){return 0})
			.attr("y", function(){return currentOffset - LEGEND_CONFIG.iconWidth / 2})
			.attr("width", function(){return LEGEND_CONFIG.iconWidth})
			.attr("height", function(){return LEGEND_CONFIG.iconHeight})
			.style("fill", function(){ 
				return streamColor.range()[i];
			})
			.style("fill-opacity", 1)
			.style("stroke", "none");
		
	
		layerSvg.append("text")
			 .attr("x", labelOffset)
			 .attr("y", function(){ return currentOffset + LEGEND_CONFIG.iconHeight / 2 - LEGEND_CONFIG.fontSize / 2})
			 .style("font-weight", "normal")
			 .style("font-color", "black")
			 .style("font-size", LEGEND_CONFIG.fontSizePt)
			 .style("font-family", LEGEND_CONFIG.fontFamily)
			 .text(function(){
				 var steps = streamColor.range().length
				 var stepSize = 1 / streamColor.range().length;
				 
				 var von = minValue + parseInt((divValue * (steps-i-1) * stepSize).toFixed(0));
				 var bis = minValue + parseInt((divValue * (steps-i) * stepSize).toFixed(0));
				 return von+" - "+bis+" Ziele / km²";
			 });
		
		currentOffset += LEGEND_CONFIG.iconHeight + LEGEND_CONFIG.iconMargin;
		
	}
	
}

/*
 * 
 */
function getCentroid(selection) {
	console.log("getCentroid()");
    // get the DOM element from a D3 selection
    // you could also use "this" inside .each()
    var element = selection.node(),
        // use the native SVG interface to get the bounding box
        bbox = element.getBBox();
    // return the center of the bounding box
    return [bbox.x + bbox.width/2, bbox.y + bbox.height/2];
}

/*
 *
 */
function calcCircleScaleFactor(){
	if(!wholeTrafficMatrix[srcLocationType][destLocationType]){
		maxTrafficValue = 0;
		return;
	}
	var _maxTrafficValue=0;
	wholeTrafficMatrix[srcLocationType][destLocationType].tt.forEach(function(trafficStream){
		if(_maxTrafficValue < wholeTrafficMatrix[srcLocationType][destLocationType][trafficStream[0]][trafficStream[1]]){
			_maxTrafficValue = wholeTrafficMatrix[srcLocationType][destLocationType][trafficStream[0]][trafficStream[1]];
		}
	});
	circleScaleFactor = (backgroundLayerOverview.avg_square_px / Math.sqrt(_maxTrafficValue / Math.PI)) * .5;
	console.log("maxTrafficValue="+_maxTrafficValue);
	console.log("circleScaleFactor="+circleScaleFactor);
	maxTrafficValue = _maxTrafficValue;
}

/*
 * 
 */
function openTrafficDialog(){
	openDialog("traffic_dialog", "dialog_traffic.html")
	//d3.select("#background_dialog").style("display","block");
	//d3.select("#fade").style("display","block");
}

function findTrafficStandorttypName(locationType, short){
	if(short){
		switch(locationType){
			 case "ALL" : return "Alle";
			 case "HOME" : return "Wohnort";
			 case "JOB" : return "Arbeit";
			 case "EDUCATION" : return "Bildung";
			 case "SHOPPING" : return "Einkauf";
			 case "SETTLEMENT" : return "priv. Erled.";
			 case "LEISURE" : return "Freizeit";
			 case "OTHER" : return "Andere";
		}		
	}
	switch(locationType){
		 case "ALL" : return "Alle";
		 case "HOME" : return "Wohnorte";
		 case "JOB" : return "Arbeitsstandorte";
		 case "EDUCATION" : return "Bildungsstandorte";
		 case "SHOPPING" : return "Einkaufsstandorte";
		 case "SETTLEMENT" : return "Standorte privater Erledigung";
		 case "LEISURE" : return "Freizeitstandorte";
		 case "OTHER" : return "Andere Standorte";
	}
}