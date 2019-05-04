$(function () {
	'use strict';
	$(document).ready(function () {
		// common
		function debounce(func, wait, immediate) {
			var args,
				result,
				thisArg,
				timeoutId;

			function delayed() {
				timeoutId = null;
				if (!immediate) {
					result = func.apply(thisArg, args);
				}
			}

			return function () {
				var isImmediate = immediate && !timeoutId;
				args = arguments;
				thisArg = this;

				clearTimeout(timeoutId);
				timeoutId = setTimeout(delayed, wait);

				if (isImmediate) {
					result = func.apply(thisArg, args);
				}
				return result;
			};
		}

		// up button
		(function () {
			var $but = $('.up'),
				$footer = $('.footer'),
				footerHeight = $footer.outerHeight() - 10,
				bodyHeight = $('body').height(),
				limit = 0,
				time = 500;

			$but.click(function (e) {
				$('body, html').animate({
					scrollTop: 0
				}, 500);
				e.stopPropagation();
				e.preventDefault();
				return false;
			});

			$but.css({opacity: 0});

			function showUp() {
				var scrollTop = $(window).scrollTop(),
					val = limit && (scrollTop > limit) ? 1 : 0;
				$but.stop().animate({opacity: val}, time);
			}

			var lazyShowUp = debounce(function () {
					limit = (bodyHeight > $(window).height()) ? (bodyHeight - $(window).height() - footerHeight) : 0;
					showUp();
				}, (time + 200), false),
				lazyGabCalc = debounce(function () {
					footerHeight = $footer.outerHeight() - 10;
					bodyHeight = $('body').height();
				}, 500, false);

			$(window).bind('scroll.up resize.up', lazyShowUp);
			$(window).bind('resize.up', lazyGabCalc);
			lazyShowUp();
			setInterval(lazyShowUp, 2000);
		})();
		// up button End

		// projects list filters
		(function () {
			var $linksBox = $('.nav'),
				$links = $('.nav__item', $linksBox),
				activeClass = 'nav__item_active',
				$activeLink = $(('.' + activeClass), $linksBox),
				$itemWrap = $('.projects-wrap'),
				$itemBox = $('.projects', $itemWrap),
				$allItems = $('.project', $itemBox),
				activeItemsCount = $allItems && $allItems.length ? $allItems.length : 0,
				outerItemsCount = 0,
				stepTime = 50,
				minTime = 400,
				minBoxTime = 700,
				k = 2.5;

			function getItems(type) {
				var $items = type ? $allItems.filter(('[js-type="' + type + '"]')) : null;
				return $items;
			}

			function getOtherItems(type) {
				var $items = type ? $allItems.not(('[js-type="' + type + '"]')) : null;
				return $items;
			}

			function setCallback(callback, $item, $items) {
				if (callback && $item && $items) {
					var index = $items.index($item) + 1,
						length = $items.length;
					if (index === length) {
						callback();
					}
				}
			}

			var lazyGabFix = debounce(function () {
				var $items = $allItems;
				if ($items && $items.css) {
					$items.css({
						height: '',
						width: ''
					});
				}
			}, 3000, false);

			function hide($items, callback) {
				if ($items && $items.length) {
					var currTime = stepTime * parseInt(outerItemsCount) * k;
					currTime = currTime > minTime ? currTime : minTime;
					$items.stop().animate({
						height: 'hide',
						width: 'hide'
					}, currTime, function () {
						setCallback(callback, $(this), $items);
						lazyGabFix();
					});
				} else if (callback) {
					callback();
				}
			}

			function show($items, callback) {
				if ($items && $items.length) {
					var currTime = stepTime * parseInt(activeItemsCount) * k;
					currTime = currTime > minTime ? currTime : minTime;
					$itemWrap.show();
					$items.stop().animate({
						height: 'show',
						width: 'show'
					}, currTime, function () {
						setCallback(callback, $(this), $items);
						lazyGabFix();
					});
				} else if (callback) {
					callback();
				}
			}

			$links.click(function () {
				var $link = $(this),
					type = $link.attr('js-type'),
					$activeItems = getItems(type),
					$otherItems = getOtherItems(type);
				$activeLink.removeClass(activeClass);

				if (!type) {
					$otherItems = null;
					$activeItems = $allItems;
				}

				activeItemsCount = $activeItems && $activeItems.length ? $activeItems.length : 0;
				outerItemsCount = $otherItems && $otherItems.length ? $otherItems.length : 0;

				hide($otherItems, function () {
					if ($activeItems && $activeItems.length) {
						$itemWrap.show(minBoxTime);
					}
					show($activeItems, function () {
						if ($activeItems && $activeItems.length) {
							$itemWrap.show();
						} else {
							$itemWrap.hide(minBoxTime);
						}
					});
				});

				if (type) {
					$activeLink = $link.addClass(activeClass);
				} else {
					$activeLink = $links.eq(0).addClass(activeClass);
				}

			});

		})();
		// projects list filters End
	});
});
