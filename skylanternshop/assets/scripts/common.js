$(function () {
	'use strict';
	$(document).ready(function(){
		// catalog
		var $tree = $(".tree");
		$tree.delegate(".tree__label", "click.tree", function(){
			var $label = $(this),
				$item = $label.parent(),
				$children = $(".tree__list", $item);
			$children.animate({
					"height": "toggle",
					"opacity": "toggle"
				}, 400, function() {
					$item.toggleClass("tree__item_open");
				}
			);

		});

		// adaptive
		$tree.delegate(".tree__mobile", "click.tree", function(){
			var $label = $(this),
				$tree = $label.parent(),
				$menu = $(".tree__menu", $tree);
			$menu.animate({
					"height": "toggle",
					"opacity": "toggle"
				}, 400, function() {
					$tree.toggleClass("tree__state_open");
				}
			);

		});

		// number input in order form
		$('.nom-inp').each(function(){
			var $box = $(this),
				$inp = $(".nom-inp__inp", $box),
				$up = $(".nom-inp__up", $box),
				$down = $(".nom-inp__down", $box),
				oldVal = 1,
				timer = null;

			function getVal(){
				var val = parseInt($inp.val());
				return val ? val : oldVal;
			}
			function resize(val){
				if(timer){
					clearTimeout(timer);
				}
				timer = setTimeout((function(val){
					var startVal = val ? val : getVal(),
						len = val.toString().length;
					val = startVal && len < 10 ? startVal : oldVal;
					len = val.toString().length;
					$inp.attr("size", len);
					$inp.val(val);
					oldVal = val;
				})(val), 300);
			}

			$up.click(function(){
				resize((getVal() + 1));
			});
			$down.click(function(){
				resize((getVal() - 1));
			});
			$inp.keyup(function(){resize();});

		});
	});
});
