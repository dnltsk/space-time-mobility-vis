function initDownloadify(){
	Downloadify.create('control_export',{
	    filename: function(){
	      return ".svg";
	    },
	    data: function(){ 
	    	var value = parent.document.getElementById("map").parentNode.innerHTML;
			value = value.replace(/^\s+|\s+$/g, '');
			value = value.replace(/\t/g, " ");
			value = value.replace(/\n/g, "");
			value = value.replace(/\s</g, "<");
			value = value.replace(/>\s/g, ">");
			return value;
	    },
	    onComplete: function(){
	      //alert('Your File Has Been Saved!'); 
	    },
	    onCancel: function(){ 
	      //alert('You have cancelled the saving of this file.');
	    },
	    onError: function(){ 
	      alert('Fehler beim Download'); 
	    },
	    transparent: false,
	    swf: 'js/downloadify/downloadify.swf',
	    downloadImage: 'js/downloadify/download_icon.png',
	    width: 32,
	    height: 32,
	    transparent: true,
	    append: false
	  });
}
registeredInitLoaders.push(initDownloadify);