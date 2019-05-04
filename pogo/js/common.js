// JavaScript Document
function createMenu()
{
	var html='';
	var links=$("#secMenu a");
	var x=1;
	$(links).each(
	function()
	{
		var href=$(this).attr("href");
		var text=$(this).text();
		var classVal='';
		if(x==1)
		{
			classVal='class="first"';
		}
		else if(x==links.length)
		{
			classVal='class="last"';
		}
		x++;
		html+='<li '+classVal+'><a href="'+href+'">'+text+'</a></li>';
	}
	);
	$("div.gamesMenu ul").html(html);	
}

$(document).ready(
function()
{
	createMenu();
}
);