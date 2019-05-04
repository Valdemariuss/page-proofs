function Tower()
{
	this.count=3;
	this.maxCount=5;
	this.minRingWidth=30;
	this.ringsHeight=20;
	this.collumns=3;
	this.collArr=[];
	this.rings=[];
	this.step=0;
	this.history="";
    this.init = function(){
		var obj=this;				
		var option="";		
		for(var x=3; x<=obj.maxCount; x++) { var selected=(x==obj.count)?"selected='selected'":""; option+="<option "+selected+" value='"+x+"'>"+x+"</option>"; }
		$("#towerRingCount").append(option);
		var collumns="";
		for(var x=1; x<=obj.collumns; x++) { collumns+="<i val='"+x+"'></i>"; }
		$("#towerBox").append(collumns);		
		var leftStep=$("#towerBox").width()/obj.collumns - $($("#towerBox i").get(0)).width()/2;
		var left=leftStep/2;
		$("#towerBox i").each(function(){				   
			$(this).css("left",left);
			left+=leftStep;
		});
		$("#towerRingCount").change( function(){
			obj.startGame();
		});
		$("#towerButton").click( function(){
			obj.startGame();
		});
		obj.startGame();
    }		
}

Tower.prototype = {
	startGame:function(){
		var obj=this; obj.step=0;
		obj.history="";
		$("#towerMessage").hide();
		for(var x=1; x<=obj.collumns; x++) { obj.collArr[x]=[]; }
		obj.count=$("#towerRingCount").val();
		var height=obj.count*obj.ringsHeight+8+parseInt(obj.count);
		$("#towerBox").css("height",height); $("#towerBox i").css("height",height-2);
		$("#towerBox div").remove();
		var divs="";
		for(var x=1; x<=obj.count; x++) { divs+="<div val='"+x+"'></div>"; obj.collArr[1][x]=true; }
		$("#towerBox").append(divs);
		$("#towerBox div").each( function(){
			var ring=this;							  
			obj.rings[$(ring).attr("val")]=this;			
		});
		obj.ringsGab();
		obj.ringsPos();
	},
	ringsGab:function(){
		var obj=this;
		var width=obj.minRingWidth+obj.count*20;
		$("#towerBox div").each(function(){
			$(this).css({width:width+"px",height:obj.ringsHeight+"px"});
			width-=20;									   
		});
	},
	ringsPos:function(){
		var obj=this;
		$("#towerBox i").each(function(){
			var coll=this;						   
			var index=$(coll).attr("val");
			var bot=0;
			var topRing=null;
			var ringsCount=0;
			for(var x=1; x<obj.collArr[index].length; x++) {
				if(obj.collArr[index][x]){
					var ring=obj.rings[x];
					var pos=$(coll).position();
					$(ring).css({bottom:bot+"px",top:"",left:pos.left - $(ring).width()/2+$(coll).width()/2});
					bot+=$(ring).height()+1;
					$(ring).draggable("destroy");
					$(ring).mouseup(function(){ return });
					topRing=ring;
					if(index==obj.collumns) ringsCount++;
				}
			}
			if(ringsCount==obj.count) { obj.gameWin(); return }
			$(topRing).draggable({
				cursor: "move",
				revert: "invalid",
				addClasses: false,
				scroll: false,
				drag: function(e, ui) {
					obj.moveCalk(ui.helper,ui.position);
				}
			});			
			$(topRing).mouseup(function(e){
				obj.dropRing(e);								 
			});			
		});									   
	},
	moveCalk:function(el,pos){
		var obj=this;
		$("#towerBox i").removeClass("tower-can").removeClass("tower-ban").each(function(){
			var coll=this;
			var moveFlag=obj.moveFlag(pos,el,coll);
			if(moveFlag && moveFlag.flag) {
				if($(el).attr("val")>moveFlag.maxRing) $(coll).addClass("tower-can");
				else $(coll).addClass("tower-ban");
			}
		});
	},
	dropRing:function(e){
		var obj=this;
		var el=e.srcElement || e.target;
		var pos=$(el).position();
		$("#towerBox i").removeClass("tower-can").removeClass("tower-ban").each(function(){
			var coll=this;
			var moveFlag=obj.moveFlag(pos,el,coll);
			if(moveFlag && moveFlag.flag) {
				if( $(el).attr("val")>moveFlag.maxRing ) {
					$(el).draggable({revert:false});
					for(var x=1; x<=obj.collumns; x++) {					
						if(obj.collArr[x][$(el).attr("val")]){
							obj.step++;
							obj.history+="#"+obj.step+": "+x+" -> ";
							delete( obj.collArr[x][$(el).attr("val")] );
						}
					}
					obj.history+=$(coll).attr("val")+"\n";
					obj.collArr[$(coll).attr("val")][$(el).attr("val")]=true;
					obj.ringsPos();					
				}
			}
		});
	},
	moveFlag:function(pos,el,coll){
		var obj=this;
		var right=pos.left+$(el).width();
		var bottom=pos.top+$(el).height();
		var collPos=$(coll).position();
		var index=$(coll).attr("val");
		var ringIn=$(el).attr("val");		
		if( (collPos.left>pos.left)&&(collPos.left+$(coll).width()<right)&&
			(collPos.top<pos.top)&&(collPos.top+$(coll).height()>bottom)&&													 
			(!obj.collArr[index][ringIn]) ) {
			var maxRing=0;
			for(var x=1; x<=obj.count; x++) { if(obj.collArr[$(coll).attr("val")][x]){ maxRing=x; } }
			return {"flag":true, "maxRing":maxRing};
		}
	},
	gameWin:function(){
		var step=this.step;		
		$("#towerMessage").html("<h1>Поздравляем!Вы выполнили задачу за "+step+" ходов</h1><h2>История ходов</h2><textarea>"+this.history+"</textarea>").show();	
	}
}

$(document).ready(function() {					   
	new Tower().init();	
});
