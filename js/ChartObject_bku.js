var ChartObject = function(){
		
	this.url = "json/animation/chart_possibilities.json";
	
	this.colorMap = LEGEND_DATA.colorMap.layer_possibilities;
	
	this.chartData = null;
	this.svgGroup = null;
	this.width = null;
	this.height = null;
	this.xScale = null;
	this.yScale = null;
	this.xAxis = null;
	this.yAxis = null;

	/*
	 * 
	 */
	this.init = function(completeWidth, completeHeight){
		var thisJson = this;
		
		
		d3.json(thisJson.url, function(error, data) {
			
			
			thisJson.svgGroup = ROOT_SVG.append("g")
				.attr("width", completeWidth)
				.attr("height", completeHeight)
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
				.style("display", "block");
			
			appendChartUnderlay(thisJson.svgGroup);
			
			thisJson.calcSize(completeWidth, completeHeight);
			thisJson.chartData = thisJson.parseData(data);
			thisJson.initScales();
			thisJson.initAxis();
			thisJson.draw(completeWidth, completeHeight);
			translateCharts();
		});
	};
	
	/*
	 * 
	 */
	this.calcSize = function(completeWidth, completeHeight){
		this.width = completeWidth - margin.left - margin.right;
		this.height = completeHeight - margin.top - margin.bottom;
	};
	
	/*
	 * 
	 */
	this.parseData = function(rawData){
		var thisJson = this;
		
		var parseDate = d3.time.format("%H:%M").parse;
		
		var colorDummy = d3.scale.category10();
		colorDummy.domain(d3.keys(rawData[0]).filter(function(key) { return key !== "frame" && key !== "time"; }));
		rawData.forEach(function(d) {
			d.time=parseDate(d.frame);
		});
		
		var parsedData = colorDummy.domain().map(function(name) {
			return {
			  name: name,
			  values: rawData.map(function(d) {
			    return {time: d.time, value: +d[name]};
			  })
			};
		});
		
		return parsedData;
		
	};
	
	/*
	 * 
	 */
	this.initScales = function(){
		var thisJson = this;
		
		this.xScale = d3.time.scale().range([0, thisJson.width]);
		this.yScale = d3.scale.linear().range([thisJson.height, 0]);
		
		this.xScale.domain(d3.extent(thisJson.chartData[0].values, function(v) { return v.time; }));
		this.yScale.domain([
			d3.min(thisJson.chartData, function(c) { return d3.min(c.values, function(v) { return v.value; }); }),
			d3.max(thisJson.chartData, function(c) { return d3.max(c.values, function(v) { return v.value; }); })
		]);
		
	};
	
	/*
	 * 
	 */
	this.initAxis = function(){
		var thisJson = this;
		this.xAxis = d3.svg.axis()
						   .scale(thisJson.xScale)
						   .orient("bottom")
						   .tickFormat(d3.time.format("%H"));
		this.yAxis = d3.svg.axis()
						   .scale(thisJson.yScale).orient("left");
	};

	/*
	 * 
	 */
	this.draw = function(completeWidth, completeHeight){
		
		var thisJson = this;
		
		var line = d3.svg.line()
			.interpolate("basis")
			.x(function(d) { return thisJson.xScale(d.time); })
			.y(function(d) { return thisJson.yScale(d.value); });
		
		
		if(!thisJson.svgGroup.select("g.x.axis").empty()){
			/* UPDATE */
			thisJson.svgGroup.select("g.x.axis")
							 .attr("transform", "translate(0," + (thisJson.height) + ")")
							 .call(thisJson.xAxis);
			thisJson.svgGroup.select("g.y.axis").call(thisJson.yAxis);
		}else{
			/* INITIAL CREATE */
			// x-Axis
			var xAxisG = thisJson.svgGroup.append("g")
			xAxisG = xAxisG.classed("x", true)
						   .classed("axis", true)
						   .attr("transform", "translate(0," + (thisJson.height) + ")")
						   .call(thisJson.xAxis);
			xAxisG.selectAll("path, line")
				.style("fill", "none")
				.style("stroke", "black")
				.style("shape-rendering", "crispEdges");

			// y-Axis
			var yAxisG = thisJson.svgGroup.append("g")
							     .classed("y", true)
							     .classed("axis", true)
							     .call(thisJson.yAxis);
			
			yAxisG.selectAll("path, line")
				.style("fill", "none")
				.style("stroke", "black")
				.style("shape-rendering", "crispEdges");
			
			yAxisG.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", 6)
				.attr("dy", ".71em")
				.style("text-anchor", "end")
				.text("Anzahl der Nutzung");
			
			
		}
	
		// lines
		if(!thisJson.svgGroup.selectAll("g.city path.line").empty()){
			/* UPDATE */
			thisJson.svgGroup.selectAll("g.city path.line")
				   			 .attr("d", function(d) {
				   				 return line(d.values); 
				   			 });
		}else{
			/* INITIAL CREATE */
			var city = thisJson.svgGroup.selectAll(".city")
			  .data(thisJson.chartData)
			  .enter()
			  .append("g")
			  .classed("city", true);
		
			city.append("path")
				.classed("line", true)
				.attr("d", function(d) { return line(d.values); })
				//.style("stroke", function(d) { return colorDummy(d.name); })
				.style("stroke", function(d) { return thisJson.colorMap[d.name]; })
				.style("stroke-width", 2)
				.style("fill","none");
		
			/*city.append("text")
			    .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
			    .attr("transform", function(d) { return "translate(" + xScale(d.value.time) + "," + yScale(d.value.value) + ")"; })
			    .attr("x", 3)
			    .attr("dy", ".35em")
			    .text(function(d) { return d.name; });*/
		}
		
		if(!thisJson.svgGroup.selectAll("g.title").empty()){
			/* UPDATE */
			thisJson.svgGroup.selectAll("g.title")
							 .attr("transform", "translate("+((thisJson.width/2)+margin.left)+",10)");
		}else{
			/* INITIAL CREATE */
			thisJson.svgGroup.append("g")
					.classed("title", true)
					.attr("transform", "translate("+((thisJson.width/2)+margin.left)+",10)")
					.append("text")
					.attr("text-anchor", "middle")
					.attr("x", 0)
					.attr("y", 0)
					.style("font-weight", "bold")
					.style("text-decoration", "underline")
					.text("Genutzte Gelegenheiten nach Tageszeit");
		}
	};
	
	/*
	 * 
	 */
	this.startAnimation = function(){
		var thisJson = this;
		var line = thisJson.svgGroup
						 .append("line")
						 .attr("id","timeTick")
						 .attr("x1",0)
						 .attr("y1",0)
						 .attr("x2",0)
						 .attr("y2",thisJson.height)
						 .style("stroke", "black")
						 .style("stroke-width", 2);
		line.transition()
			.ease("linear")
			.duration(1440*40)
			.attr("x1", thisJson.width)
			.attr("x2", thisJson.width);
	};
	
	this.pauseAnimation = function(){
		this.svgGroup.selectAll("*").transition().duration(0);
	}
	
	/*
	 * 
	 */
	this.updatePosition = function(left, top, completeWidth, completeHeight){
		
		left = parseInt(left.toFixed(0));
		top = parseInt(top.toFixed(0));
		completeWidth = completeWidth.toFixed(0);
		completeHeight = completeHeight.toFixed(0);
		
		var thisJson = this;
		
		thisJson.calcSize(completeWidth, completeHeight);
		thisJson.initScales();
		thisJson.initAxis();
		thisJson.draw(completeWidth, completeHeight);
		
		
		if(!thisJson.svgGroup.select("#timeTick").empty()){
			var currentState = ANIMATION_TRIGGER.attr("value");
			var currentX = thisJson.width * currentState;
			var timeLeft = (1440*40) - (1440*40)*currentState;

			thisJson.svgGroup.select("#timeTick")
				.transition()
				.duration(0)
				.style("display", "block")
				.each("end", function(){
					thisJson.svgGroup.select("#timeTick")
						.transition()
						.duration(0)
						.attr("x1", currentX)
						.attr("x2", currentX)
						.each("end", function(){
							thisJson.svgGroup.select("#timeTick")
								.transition()
								.ease("linear")
								.duration(timeLeft)
								.attr("x1", thisJson.width)
								.attr("x2", thisJson.width);
						});
					
				});
			
		}
		
		
		thisJson.svgGroup.attr("transform", "translate("+(left+margin.left)+","+(top+margin.top)+")");
		thisJson.svgGroup.select(".underlay")
			.attr("x", -margin.left)
			.attr("y", -margin.top)
			.attr("width", completeWidth-margin.right+40)
			.attr("height", completeHeight);
	};
	
};