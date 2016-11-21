/* 
 * 
 */
function getScreenSize(){
	var width = ROOT_SVG.style("width").replace("px","");
	var height = ROOT_SVG.style("height").replace("px","");
	return {"width":width,
			"height":height};
}

/*
 * 
 */
function getBboxOfG(g){
	
	var minX = null;
	var minY = null;
	var maxX = null;
	var maxY = null;
	g.selectAll("path, use, text").each(function(){
		var bbox = null;
		try{
			bbox = this.getBBox();
		}catch(e){
			return;
		}
		if(minX == null){
			minX = bbox.x;
			minY = bbox.y;
			maxX = bbox.x + bbox.width;
			maxY = bbox.y + bbox.height;
		}else{
			if(minX > bbox.x){
				minX = bbox.x;
			}
			if(minY > bbox.y){
				minY = bbox.y;
			}
			if(maxX < (bbox.x + bbox.width)){
				maxX = bbox.x + bbox.width;
			}
			if(maxY < (bbox.y + bbox.height)){
				maxY = bbox.y + bbox.height;
			}
		}
	});
	
	
	g.selectAll("line").each(function(){
		var coords = [{"x":this.x1, "y":this.y1},
		              {"x":this.x2, "y":this.y2}];
		
		/*if(minX == null){
			minX = coords[0].x;
			minY = coords[0].y;
			maxX = coords[0].x;
			maxY = coords[0].y;
		}*/
		
		for(var i=0; i<coords.length; i++){
			var coord = coords[i];
			if(minX > coord.x){
				minX = coord.x;
			}
			if(minY > coord.y){
				minY = coord.y;
			}
			if(maxX < coord.x){
				maxX = coord.x;
			}
			if(maxY < coord.y){
				maxY = coord.y;
			}
		}
	});
	
	return {"minX":minX,
		    "minY":minY,
		    "maxX":maxX,
		    "maxY":maxY};
	
}

/*
 * 
 */
function toggleHelp(theme, caption, link){
	d3.selectAll(".help_content").style("display","none");
	d3.selectAll("#help_content_"+caption).style("display","block");
	d3.selectAll(".toggle_help").style("font-weight", "normal");
	d3.select(link).style("font-weight", "bold");
}

/*
 * 
 */
function createPathLayerUrl(hhId, pId){
	var hhIdStr = hhId.toString();
	return "json/pathlayers"
			+"/"+hhIdStr.substring(0, 2)
			+"/"+hhIdStr.substring(2, 4)
			+"/"+hhIdStr.substring(4, 6)
			+"/"+hhId+"_"+pId+".json";
}