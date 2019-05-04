(function(){
	function bind(el, event, handler, useCapture){
		if(el && event && handler){
			var useCapture = useCapture || false;
			try{
				if (el.addEventListener) {
					el.addEventListener(event, handler, useCapture ? useCapture : false);
				} else if (el.attachEvent) {
					el.attachEvent('on' + event, function(){
						handler.call(el);
					});
				} else{
					//alert("Add handler is not supported");
				}
			}catch(err){}
		}
	}

	function getComputedCSSPropertyValue(element, CSSProperty) {
	    return (typeof getComputedStyle == "undefined" ? element.currentStyle : getComputedStyle(element, null))[CSSProperty];
	}

	var allNodes = [];
	function getAllNodes(el){
		var el = el ? el : document.body,
			childs = el.children;
		allNodes.push(el);
		if(childs && childs.length){
			for(var x= 0, l = childs.length; x < l; x++){
				getAllNodes(childs[x]);
			}
		}
	}

	function displayInlineFix(){
		getAllNodes();
		var elements = allNodes;
		for(var x=0, l=elements.length; x < l; x++){
			var el = elements[x],
				styleDis = getComputedCSSPropertyValue(el, 'display');
			if(styleDis == 'inline-block'){
				el.style.display = 'inline';
				el.style.zoom = '1';
			}
		}
	}

	bind(window, 'load', displayInlineFix);

})();