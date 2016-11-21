var bezirkeGeoms = null;
var scalePathX = null;
var scalePathY = null;
var pageNumbers = null;
var currentPageNumber = 0;
var searchTree = null;
/*
 * 
 */
function init(){
	configSearchHh();
	loadOverview();
}

/*
 * 
 */
function configSearchHh(){
	
	d3.select("#search_hh_button")
	  .on("click", function(){
		  var query = d3.select("#search_hh_field").property("value");
		  startSearch(query);
	  });
	
	d3.select("#search_hh_field")
	  .on("focus", function(){
		  console.log("onfocus");
		  var field = d3.select(this);
		  if(field.property("value") == "Haushalt suchen..."){
			  field.property("value", "");
			  field.classed("silver", false);
		  }
		  if(searchTree == null){
			  d3.json("json/pathlayers/overview/search_tree.json", function(d){
				  searchTree = d;
			  });
		  }
	  })
	  .on("blur", function(){
		  console.log("onblur");
		  var field = d3.select(this);
		  if(field.property("value") == ""){
			  field.property("value", "Haushalt suchen...");
		  }
		  if(field.property("value") == "Haushalt suchen..."){
			  field.classed("silver", true);
		  }
	  })
	  .on("keyup", function(){
		  console.log("onkeyup");
		  d3.selectAll(".highlight_search").classed("highlight_search", false);
		  searchError("");
		  var field = d3.select(this);
		  var query = field.property("value");
		  if(query == "Haushalt suchen..."){
			  field.classed("silver", true);
		  }else{
			  field.classed("silver", false);
		  }
		  startSearch(query);
	  });
}

/*
 * 
 */
function searchError(msg){
	d3.select(".searchError")
	  .text(msg);
}

/*
 * 
 */
function startSearch(query){
	if(query.length > 7){
		  searchError("Eingabe zu lang!");
	  }
	  if(query.length == 7){
		  if(searchTree != null){
			  try{
				  var pageFound = searchTree[query.charAt(0)]
							  		   [query.charAt(1)]
							  		   [query.charAt(2)]
							  		   [query.charAt(3)]
							  		   [query.charAt(4)]
							  		   [query.charAt(5)]
							  		   [query.charAt(6)];
				  
				  if(typeof pageFound != "undefined"){
					  console.log("pageFound = "+pageFound+
							  	  " currentPageNumber = "+currentPageNumber+
							  	  " paging = "+(pageFound - currentPageNumber));
					  paging(pageFound - currentPageNumber);
				  }else{
					  searchError("nicht gefunden!");
				  }
			  }catch(e){
				  console.log("kein Treffer!")
				  searchError("nicht gefunden!");
			  }
		  }
	  }else{
		  console.log("keine Suche!")
	  }
}

/**
 * 
 */
function loadOverview(){
	d3.json("json/backgroundlayers/bezirke_thumb_0_90.json", function(bezirke){
		
		bezirkeGeoms = bezirke.features;
		initScales();
		
		d3.json("json/pathlayers/overview/overview_main.json", function(overviewMain){
			console.log("overviewMain= ",overviewMain);
			pageNumbers = overviewMain.page_numbers;
			d3.select("#pageNumbers").text(pageNumbers);
			
			d3.json("json/pathlayers/overview/page_0.json", function(overviewPage){
				
				writeTable(overviewPage);
			
			});
			
		});
	});
}

/**
 * 
 * @param hhId
 * @param pId
 * @param personContainer
 */
function togglePath(hhId, pId, personContainer){
	if(!personContainer.classed("selected")){
		parent.pathIds.push({"hhId":hhId,"pId":pId});
		parent.loadData(parent.drawData);
		personContainer.innerHTML = "entfernen";
		
	}else if(personContainer.classed("selected")){
		var position = 0;
		for(; position < parent.pathIds.length; position++){
			if(parent.pathIds[position].hhId == hhId && parent.pathIds[position].pId == pId){
				break;
			}
		}
		parent.pathIds.splice(position, 1);
		parent.loadData(parent.drawData);
	}
	personContainer.classed("selected", !personContainer.classed("selected"));
}

/**
 * 
 * @param overviewPage
 */
function writeTable(overviewPage){
	
	d3.select("#tableWrapper").selectAll("div").remove();
	
	d3.select("#tableWrapper")
		
		.selectAll("div")
		.data(overviewPage)
		.enter()
		.append("div")
		.classed("hh",true)
		.each(function(household){
			var hhDiv = d3.select(this);
			var hhId = household.hh_id;
			hhDiv.append("p")
			 	.classed("title", true)
			 	.classed("highlight_search", function(){
			 		return d3.select("#search_hh_field").property("value") == hhId;
			 	})
			 	.text("Haushalt "+household.hh_id);
			hhDiv.selectAll("div")
				.data(household.members)
				.enter()
				.append("div")
				.classed("p", true)
				.classed("selected", function(d){
					var hh_id = this.parentElement.__data__.hh_id;
					for(var i=0; i<parent.pathIds.length; i++){
						if(parent.pathIds[i].hhId == hh_id && parent.pathIds[i].pId == d.p_id){
							return true;
						}
					}
					return false;
				})
				.each(function(member){

					var p = d3.select(this);
										
					var hh_id = this.parentElement.__data__.hh_id;
					var sex = parent.LEGEND_DATA.labelMap.layer_sex[member.p_sex].de;

					var title = sex+", "+member.p_age+" Jahre";
					p.append("p")
						.classed("title", true)
						.text(title);
					
					var preview = p.append("svg")
					   .style("width","75px")
					   .style("height","55px")
					
					loadPreview(hh_id, 
							member.p_id, 
							preview);
								
				})
				.on("click", function(d){
					var hh_id = this.parentElement.__data__.hh_id;
					togglePath(hh_id, d.p_id, d3.select(this));
				})
				.on("mouseover", function(d){
					var hhData = this.parentElement.__data__;
					mouseover(hhData, d);
				})
				.on("mouseout", mouseout);
					  
		});
}

/*
 * 
 */
function paging(direction){
	var newPageNumber = currentPageNumber + direction; 
	if(newPageNumber < 0 || newPageNumber > (pageNumbers-2)){
		return;
	}
	currentPageNumber = newPageNumber;
	
	d3.select("#currentPageNumber").text((currentPageNumber+1));
	
	var pageStr = currentPageNumber.toString();
	var pageFolder = ""; 
	for(var i=0; i<pageFolder.length-2; i++){
		pageFolder += pageFolder.substring(i,i+1)+"/";
	}
	
	var pageSubPath = "/";
	if(currentPageNumber.toString().length > 2){
		var subfolders =  currentPageNumber.toString().length-2;
		for(var i=0; i<subfolders; i++){
			pageSubPath += currentPageNumber.toString().charAt(i)+"/";
		}
	}
	
	d3.json("json/pathlayers/overview"+pageSubPath+pageFolder+"page_"+(currentPageNumber)+".json", function(overviewPage){
		writeTable(overviewPage);
	});
}

function pageFirst(){
	var divFirst = -currentPageNumber;
	console.log("pageFirst(): currentPageNumber="+currentPageNumber+" divFirst="+divFirst);
	paging(divFirst);
}

function pageLast(){
	var divLast = pageNumbers - currentPageNumber -2;
	paging(divLast);
}

/*
 * 
 */
function mouseover(hhData, pData){
	
	var xPosition = d3.mouse(d3.select('body').node())[0]+15;
	var yPosition = d3.mouse(d3.select('body').node())[1]+15;
	
	var tt = d3.select(parent.document.getElementById("tooltip"));
	tt.selectAll("*").remove();
	
	tt.style("left", xPosition + "px")
	  .style("top", yPosition + "px");
	
	var table = tt.append("table");
	var firstRow = table.append("tr");

	/* Person */
	var firstCell = firstRow.append("td");
	firstCell.append("span")
			 .classed("title", true)
			 .text("Person ");
	firstCell.append("span").style("color","silver").text(pData.p_id);
	firstCell.append("br");
	firstCell.append("span").text("Alter: "+pData.p_age);
	firstCell.append("br");
	firstCell.append("span").text("Geschlecht: "+parent.LEGEND_DATA.labelMap.layer_sex[pData.p_sex].de);
	firstCell.append("br");
	firstCell.append("span").text("Monatskarte: "+((pData.p_abo)?"ja":"nein"));
	
	/* Haushalt */
	var secondCell = firstRow.append("td");
	secondCell.append("span")
			  .classed("title", true)
			  .text("Haushalt ");
	secondCell.append("span").style("color","silver").text(hhData.hh_id);
	secondCell.append("br");
	secondCell.append("span").text("Anzahl Personen: "+hhData.hh_members);
	secondCell.append("br");
	secondCell.append("span").text("Auto vorhanden: "+hhData.hh_cars);
	secondCell.append("br");
	secondCell.append("span").text("Einkommen: "+hhData.hh_income+" Euro");

	
	/* Tagesplan */
	var thirdCell = table.append("tr")
						 .append("td")
						 .attr("colspan",2)
						 .style("padding-top","5px");
	thirdCell.append("span")
			 .classed("title", true)
			 .text("Tagesplan");
	thirdCell.append("span")
	         .style("color","silver")
	         .style("padding-left","3px")
	         .text(pData.scheme_id);
	thirdCell.append("br");

	if(pData.activities.length == 0){
		//>24:00!!!
		thirdCell.append("span")
				 .text("nicht verfügbar!")
				 .style("color","red");
		thirdCell.append("br");
		thirdCell.append("span")
		 		 .text("(Person nach 24:00 Uhr unterwegs)")
		 		 .style("color","red");
		
	}else{
		//<24:00
		thirdCell.append("span").text("Gesamtstrecke: "+(pData.total_distance / 1000).toFixed(1)+"km");
		thirdCell.append("br");
		var tr = thirdCell.append("table").append("tr")
		tr.append("td")
			.style("vertical-align","text-top")
			.text("Gelegenheiten:");
		var possibilities = "";
		for(var i=0; i<pData.possibilities.length; i++){
			if(i>0){
				possibilities += ", ";
			}
			possibilities += parent.LEGEND_DATA.labelMap.layer_possibilities[pData.possibilities[i]].de;
		}
		tr.append("td")
			.style("width","200px").text(possibilities);
	}
	
	
	
	//Show the tooltip
	tt.classed("hidden", false);
	
}

/*
 * 
 */
function mouseout(d){
	var tt = d3.select(parent.document.getElementById("tooltip"));
	tt.selectAll("*").remove();
	tt.classed("hidden", true);
}





/**
 *
 */
/*
 * 
 */
function initScales(){
	
	var minX = d3.min(bezirkeGeoms, function(d) {
			return d3.min(d.vertices, function(e){
				return e[0];
			});
		});
	var maxX = d3.max(bezirkeGeoms, function(d) {
		return d3.max(d.vertices, function(e){
			return e[0];
		});
	});
	var minY = d3.min(bezirkeGeoms, function(d) {
		return d3.min(d.vertices, function(e){
			return e[1];
		});
	});
	var maxY = d3.max(bezirkeGeoms, function(d) {
		return d3.max(d.vertices, function(e){
			return e[1];
		});
	});
	
	
	scalePathX = d3.scale.linear().domain([minX, maxX])
								  .range([0, 75]);
	scalePathY = d3.scale.linear().domain([minY, maxY])
	  							  .range([0, 55]);
}

/*
 * 
 */
var createPathLayerFunction = d3.svg.line()
								.x(function(d) { 
									return scalePathX(d[0]); })
								.y(function(d) {
									return scalePathY(d[1]); })
								.interpolate("linear");

/*
 * 
 */
var createBackgroundLayerFunction = d3.svg.line()
								.x(function(d, i){ return scalePathX(d[0]); })
								.y(function(d, i){ return scalePathY(d[1]); });								

/*
 * 
 */
function loadPreview(hhId, pId, svg){
	d3.json(parent.createPathLayerUrl(hhId, pId),
		function(d){
		
			var pathLayerGeoms = null; 
		
			for(var i=0; i<d.geometries.length; i++){
				if(d.geometries[i].azimuth == 0 && d.geometries[i].elevation == "90"){
					pathLayerGeoms = d.geometries[i].segments;
					break;
				}
			}

			if(pathLayerGeoms.length == 0){
				svg.append("text")
				   .attr("x", 20)
				   .attr("y", 30)
				   .text(">24:00")
				   .style("font-size","8pt")
				   .style("fill","silver")
				   .style("font-weight","bold");
			}else{
				svg.selectAll("path")
					.data(bezirkeGeoms)
					.enter()
					.append("path")
					.attr("d", function(d){
						return createBackgroundLayerFunction(d.vertices);
					})
					.style("fill", "none")
					.style("stroke", "silver")
					.style("stroke-width", "1");
				
				svg.selectAll("path")
					.data(pathLayerGeoms, function(d, i){ return d.id; })
					.enter()
					.append("path")
					.attr("id", function(d){ return "path_"+d.id })
				    .attr("d", function(d){ return createPathLayerFunction(d.coordinates);})
				    .style("stroke","black");
				
				svg.append("circle")
					.attr("cx",scalePathX(pathLayerGeoms[0].coordinates[0][0]))
					.attr("cy",scalePathY(pathLayerGeoms[0].coordinates[0][1]))
					.attr("r", 3)
					.style("fill","#D95F02");
			}
			
		});
}