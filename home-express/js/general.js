// JavaScript Document
function isIE()
{
	var browser=navigator.appName;
	var b_version=navigator.appVersion;
	var version=parseFloat(b_version);
	if (browser=="Microsoft Internet Explorer"){
	return true;
	}
	else
	{
	return false;
	}
}
var isIe=isIE();
var brKoef=1;
if(!isIe)
{
	brKoef=-1
}

var picBox;
var cursorBox;
var returnFlag=0;
function createCash()
{
	picBox=$("#picBox")[0];
	picBox.style.width=3360+'px';
	if(isIe)
	{
		picBox.style.right=840+'px';
	}
	else
	{
		picBox.style.marginLeft=-840+'px';	
	}	
			
}
function mousePageXY(e)
{
	var x = 0, y = 0;	
	if (!e) e = window.event;	
	if (e.pageX || e.pageY)
	{
		x = e.pageX;
		y = e.pageY;
	}
	else if (e.clientX || e.clientY)
	{
		x = e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft) - document.documentElement.clientLeft;
		y = e.clientY + (document.documentElement.scrollTop || document.body.scrollTop) - document.documentElement.clientTop;
	}	
	return {"x":x, "y":y};
}




var start=0;
var startX;
if(isIe)
{
	var margL=840;
}
else
{
	var margL=840;	
}

var move=1;
var bloks=[];
var revBloks=[];

function boxInit()
{
	$(document.body).append("<b id='cursor'/></b>");
	cursorBox=$("#cursor")[0];
	$("#picBox>div").each(
	function()
	{
		bloks.push(this);
		this.onmousedown=function(){return false}
		this.onselectstart=function(){return false}
	}
	);	
	for(x=bloks.length-1;x>=0;x--)
	{
		revBloks.push(bloks[x]);
	}		
	picBox.onmousemove=function(e)
	{
		var now=mousePageXY(e);
		var windWidth=document.compatMode=='CSS1Compat' && !window.opera?document.documentElement.clientWidth:document.body.clientWidth;// ширена окна браузера
		var yrav=(windWidth/2)-now.x;
		var delta=(yrav/10)+(840*brKoef);
		if(isIe)
		{
			picBox.style.pixelRight=delta;	
		}
		else
		{
			picBox.style.marginLeft=delta+"px";	
		}		
	}
	picBox.onmousedown=function(e)
	{
		if(isIe)
		{
			margL=parseInt(picBox.style.right);	
		}
		else
		{
			margL=parseInt(picBox.style.marginLeft)*-1;	
		}	
			
		var now=mousePageXY(e);
		$(cursorBox).show();
		startX=now.x;
		cursorBox.style.top=now.y+'px';
		cursorBox.style.left=now.x+'px';		
		moveInit();	
	}	
}
function picMouseDown(e)
{
	if(($(picBox).attr("move")==1)&&($(picBox).attr("move")=='1'))
	{
		move=1;	
	}
	if(stopMove==1)
	{
		stopMove=0;
	}
	if(move==1)
	{	
		if(isIe)
		{
			margL=parseInt(picBox.style.right);	
		}
		else
		{
			margL=parseInt(picBox.style.marginLeft)*-1;
			
		}
		//alert(margL);
		$(cursorBox).show();		
		var now=mousePageXY(e);
		startX=now.x;
		cursorBox.style.top=now.y+'px';
		cursorBox.style.left=now.x+'px';
	}
}

var stopMove=0;
var scrollMove=0;

function picMouseUp(e)
{
	$(cursorBox).hide();
	if(scrollMove==0)
	{
		if(!endVal)
		{
			endVal=840;			
		}
		animReturn();		
	}
	stopMove=1;
}

var nowRight;

function animReturn()
{
	if(!endVal)
	{
		endVal=840;			
	}
	if(isIe)
	{
		nowRight=parseInt(picBox.style.right);	
	}
	else
	{
		nowRight=parseInt(picBox.style.marginLeft)*-1;	
	}	
	var speed=5;
	var time=50;	
	if(((nowRight>endVal)&&(nowRight<endVal+speed+6))||((nowRight<endVal)&&(nowRight>endVal-speed-6)))
	{
		if(isIe)
		{
			picBox.style.right=endVal+'px';	
		}
		else
		{
			picBox.style.marginLeft=-endVal+'px';				
		}						
	}
	else
	{
		var time=setTimeout("animReturn()",time);		
		if(nowRight>endVal)
		{
			nowRight=nowRight-speed;
		}
		else if(nowRight<endVal)
		{
			nowRight=nowRight+speed;
		}
				
		if(isIe)
		{
			picBox.style.right=nowRight+'px';	
		}
		else
		{
			picBox.style.marginLeft=-nowRight+'px';				
		}		
	}
}

function picMouseMove(e)
{
	if((move==1)&&(stopMove==0))
	{	
		//передвижение курсора
		var now=mousePageXY(e);
		cursorBox.style.top=now.y+'px';
		cursorBox.style.left=now.x+'px';						
		var now=mousePageXY(e);		
		var delta=startX-now.x;	
		var amp=110; // чуствительность жеста передвижения	
		if(delta>amp)
		{
			animateScroll(1);
		}
		else if(delta<-amp)
		{			
			animateScroll(0);			
		}
		else
		{
			if(isIe)
			{
				picBox.style.right=margL+delta+'px';	
			}
			else
			{
				picBox.style.marginLeft=-(margL+delta)+'px';
			}			
		}
	}
}

function moveInit()
{
	picBox.onmousedown=picMouseDown;	
	picBox.onmouseup=picMouseUp;
	picBox.onmousemove=picMouseMove;	
}

function animateScroll(rev)
{
	scrollMove=1;	
	move=0;
	$(picBox).attr("move","0");
	$(cursorBox).hide();
	if(isIe)
	{
		var margL=parseInt(picBox.style.right);	
	}
	else
	{
		var margL=parseInt(picBox.style.marginLeft)*-1;				
	}	
	
	if(rev)// вправо
	{
		if(isIe)
		{
			var koef=Math.ceil(margL/840);// до ближайшего большего	
		}
		else
		{
			var koef=Math.ceil(margL/840);// до ближайшего меньшего			
		}		
									
	}
	else
	{
		if(isIe)
		{
			var koef=Math.floor(margL/840);// до ближайшего меньшего			
		}
		else
		{
			var koef=Math.floor(margL/840);// до ближайшего большего				
		}								
	}	
	nowVal=margL;
	endVal=koef*840;
	//alert(endVal+"|"+nowVal);
	animFloat();	
}

var endVal;
var nowVal;
var animTime=30;
if(!isIe)
{
	animTime=15;
}

function animFloat()
{
	$(cursorBox).hide();	
	var speed=37; // скорость
	if(!isIe)
	{
		speed=20;
	}	
	if(((nowVal>endVal)&&(nowVal<endVal+speed+(speed+4)))||((nowVal<endVal)&&(nowVal>endVal-speed-(speed+4))))
	{
		if(isIe)
		{
			picBox.style.right=endVal+'px';
		}
		else
		{
			picBox.style.marginLeft=-endVal+'px';			
		}		
		slowingFloat();		
		return nowVal,endVal;		
	}
	else
	{		
		if(isIe)
		{
			picBox.style.right=nowVal+'px';
		}
		else
		{
			picBox.style.marginLeft=-nowVal+'px';			
		}
		
		var time=setTimeout("animFloat()",animTime);	
	}
	if(nowVal>endVal)
	{
		nowVal=nowVal-speed;
	}
	else if(nowVal<endVal)
	{
		nowVal=nowVal+speed;
	}		
}

var slowingTime=30;
if(!isIe)
{
	slowingTime=10;
}

function slowingFloat()
{
	var speed=8;
	if(!isIe)
	{
		speed=2;
	}	
	var time=slowingTime;
	
	var kkk=10;
	if(!isIe)
	{
		kkk=3;
	}	
	if(((nowVal>endVal)&&(nowVal<endVal+speed+kkk))||((nowVal<endVal)&&(nowVal>endVal-speed-kkk)))
	{
		if(isIe)
		{
			picBox.style.right=endVal+'px';
		}
		else
		{
			picBox.style.marginLeft=-endVal+'px';			
		}
		
		slowingTime=50;
		if(!isIe)
		{
			slowingTime=10;
		}		
		
		checkPicRight(endVal);
	}
	else
	{
		if(isIe)
		{
			picBox.style.right=nowVal+'px';
		}
		else
		{
			picBox.style.marginLeft=-nowVal+'px';			
		}		
		
		var time=setTimeout("slowingFloat()",time);		
		if(nowVal>endVal)
		{
			nowVal=nowVal-speed;
		}
		else if(nowVal<endVal)
		{
			nowVal=nowVal+speed;
		}
		
		slowingTime=slowingTime+0;
		
	}	
}

function checkPicRight(right)
{
	picWidth=picBox.clientWidth;
	if(right==0)
	{
		$(revBloks).each(
		function()
		{
			var newNode = this.cloneNode(1);
			$(picBox).prepend(newNode);			
		}
		);
		picBox.style.width=picWidth+3360+'px';
		if(isIe)
		{
			var picRight=parseInt(picBox.style.right);
			picBox.style.right=picRight+3360+'px';
		}
		else
		{
			var picRight=parseInt(picBox.style.marginLeft)*-1;
			picBox.style.marginLeft=-(picRight+3360)+'px';			
		}		

		endVal=picRight+3360;
		
		$("#picBox>div").each(
		function()
		{
			this.onmousedown=function(){return false}
			this.onselectstart=function(){return false}
		}
		);		
	}
	else if((picWidth-right)<=3360)
	{		
		$(bloks).each(
		function()
		{
			var newNode = this.cloneNode(1);
			$(picBox).append(newNode);			
		}
		);
		picBox.style.width=picWidth+3360+'px';		
		$("#picBox>div").each(
		function()
		{
			this.onmousedown=function(){return false}
			this.onselectstart=function(){return false}
		}
		);		
		
	}
	$(picBox).attr("move","1");
	scrollMove=0;	
}

/* -------------------------- */

function initServisHide()
{
	var dl=$("#services")[0];
	var dtList=$(dl).find("dt");
	var ddList=$(dl).find("dd");
	$(ddList[0]).show();	
	var x=0;
	$(dtList).each(
	function()
	{
		var i=$(this).find("i");
		i=i[0];
		var index=x;
		i.onclick=function()
		{
			(function() {
				animHideServ(ddList,index);	  
			})();										
		}
		x++;
	}
	);	
}
function animHideServ(ddList,x)
{
	var time=250;
	$(ddList).animate({height: "hide"}, time);
	var ddHeight=ddList[x].clientHeight;
	//alert(ddHeight);
	if(ddHeight>20)
	{
		$(ddList[x]).animate({height: "hide"}, time);
	}
	else
	{
		$(ddList[x]).animate({height: "show"}, time);
	}
}
	
$(document).ready(
function()
{
	createCash();
	boxInit();
	initServisHide();
	//alert(brKoef);
}
);