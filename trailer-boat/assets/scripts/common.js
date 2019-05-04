$(function () {
	'use strict';

    // Short console function for log
    window.c = function (mes) {
        if (console && console.warn) {
            if (arguments) {
                $(arguments).each(function () {
                    console.warn(this);
                });
            } else {
                console.warn(mes);
            }
        }
    };

    // Protected methods
    // Lazy function
    function __debounce(func, wait, immediate) {
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

	// Catolog Menu
	$(document).ready(function () {
		var mobileWIdth = '700',
			$box = $('.goods-nav'),
			boxOpenClass = 'goods-nav_open',
			boxMobileClass = 'goods-nav_mobile',
			$head = $('.goods-nav__head', $box),
			// $button = $('.icon-goods', $box),
			// $title = $('.goods-nav__title', $box),
			$menu = $('.goods-nav__menu', $box),
			$menuItems = $('.goods-nav__menu-item', $menu),
			menuItemOpenClass = 'goods-nav__menu-item_open',
			$menuItemsLinks = $('.goods-nav__menu-link', $menu),
			mq = window.matchMedia ? window.matchMedia('(max-width: ' + mobileWIdth + 'px)') : null,
			isMobile = (mq &&  mq.matches) ? true : false;
		if (mq && mq.addListener) {
			mq.addListener(function (mq) {
				isMobile = (mq &&  mq.matches) ? true : false;
				// c('isMobile 1 - ' + isMobile);
			});
		}

		// Catalog SubMenu when window is small on bottom
		$menuItems.on('mouseenter.goods-nav', function () {
			if (!isMobile) {
				var $box = $(this);
				this.mouseenterGoodsNav = setTimeout(function () {
					var $subMenu = $('.goods-nav__sub-menu', $box),
						oldMarginTop = $subMenu.stop().css('margin-top'),
						top = Math.floor($subMenu.css({'margin-top': ''}).offset().top - $(window).scrollTop()),
						bottom = top + $subMenu.outerHeight(),
						bodyBottom = $(window).outerHeight(),
						delta = bottom - bodyBottom,
						marginTop = (delta > -10) ? '-' + (delta + 10) + 'px' : '';
					if (marginTop) {
						$subMenu.css({'margin-top': oldMarginTop}).animate({'margin-top': marginTop}, 300, function () {
							$(this).css({'margin-top': marginTop});
						});
					} else {
						$subMenu.css({'margin-top': marginTop});
					}
				}, 900);
			}
		}).on('mouseleave.goods-nav', function () {
			if (this.mouseenterGoodsNav) {
				clearTimeout(this.mouseenterGoodsNav);
				this.mouseenterGoodsNav = null;
			}
		});

		// Adaptive Catalog Menu
		var resizeTimer = null;
		$(window).on('resize', function () {
			if (resizeTimer) {
				clearTimeout(resizeTimer);
			}
			resizeTimer = setTimeout(function () {
				if (isMobile) { // $(window).width() < mobileWIdth
					$box.addClass(boxMobileClass);
				} else {
					$box.removeClass(boxMobileClass).removeClass(boxOpenClass);
					// $menuItems.removeClass(menuItemOpenClass);
				}
			}, 500);
		}).trigger('resize');


		$head.on('click.goods-nav', function () {
			if (isMobile) {
				$menu.stop().slideToggle(500, function () {
					$box.toggleClass(boxOpenClass);
				});
			}
		});

		$menuItemsLinks.on('click.goods-nav', function () {
			if (isMobile) {
				var $item = $(this).parent(),
					$list = $('.goods-nav__sub-menu', $item);
				$list.stop().slideToggle(500, function () {
					$item.toggleClass(menuItemOpenClass);
				});
			}
		});
	});

	// Adaptive site menu
	function AdaptiveMenu(settings) {
		var self = this;
		$.extend(self, settings);
		$(document).ready(function () {
			self.init();
		});
	}

	AdaptiveMenu.prototype = {
		mobileWIdth: 830,
		isMobile: false,
		init: function () {
			var self = this;
			self.elementsInit();
			self.isMobileInit();
			self.initScrollMenu();
			self.createMenu();
		},
		elementsInit: function () {
			var self = this;
			self.$header = $('.header');
			self.$headerMenuBox = $('.header-menu__box', self.$header);
		},
		isMobileInit: function () {
			var self = this,
				mq = window.matchMedia ? window.matchMedia('(max-width: ' + self.mobileWIdth + 'px)') : null;
			self.isMobile = (mq &&  mq.matches) ? true : false;
			if (mq && mq.addListener) {
				mq.addListener(function (mq) {
					self.isMobile = (mq &&  mq.matches) ? true : false;
					self.displayMenu();
				});
			}
		},
		iscreateMenu: false,
		createMenu: function () {
			var self = this;
			if (self.isMobile && !self.iscreateMenu) {
				var $header = self.$header;
				self.$menu = $('<div class=mobile-menu/>').prependTo($('body'));
				self.$menuHeader = $('<div class="mobile-menu__header  layer"/>').prependTo(self.$menu);
				self.$button = $('.icon-goods', $header).clone().appendTo(self.$menuHeader);

				self.$search = $('.site-search', $header);
				self.$searchParent = self.$search.parent();
				self.$search.appendTo(self.$menuHeader);

				self.$cart = $('.cart', $header);
				self.$cartParent = self.$cart.parent();
				self.$cart.appendTo(self.$menuHeader);

				self.$menuBox = $('<div class="mobile-menu__box  layer"/>').appendTo(self.$menu);

				self.$buyerMenu = $('.buyer-menu', $header);
				self.$buyerMenuParent = self.$buyerMenu.parent();
				self.$buyerMenu.appendTo(self.$menuBox);

				self.$feedbackMenu = $('.feedback-menu', $header);
				self.$feedbackMenuParent = self.$feedbackMenu.parent().hide();
				self.$feedbackMenu.appendTo(self.$menuBox);

				self.$mainMenu = $('.main-menu', $header);
				self.$mainMenuParent = self.$mainMenu.parent();
				self.$mainMenu.appendTo(self.$menuBox);

				self.$phones = $('.phones', $header);
				self.$phonesParent = self.$phones.parent();
				self.$phones.appendTo(self.$menuBox);

				self.$callback = $('.callback', $header);
				self.$callbackParent = self.$callback.parent().hide();
				self.$callback.appendTo(self.$menuBox);

				self.$button.add(self.$search).add(self.$cart).wrap('<div class="mobile-menu__cell"></div>');

				self.$headerMenuBox.hide();

				self.$button.on('click.AdaptiveMenu', function () {
					self.$menuBox.slideToggle();
					self.$menu.toggleClass('mobile-menu_open');
				});

				$('body').addClass('mobile-page');

				self.iscreateMenu = true;

				self.createScrollMenu();
			}
		},
		destroyMenu: function () {
			var self = this;
			if (!self.isMobile && self.iscreateMenu) {
				self.$feedbackMenu.appendTo(self.$feedbackMenuParent.css({display: ''}));
				self.$search.appendTo(self.$searchParent);
				self.$cart.appendTo(self.$cartParent);
				self.$mainMenu.appendTo(self.$mainMenuParent);
				self.$buyerMenu.appendTo(self.$buyerMenuParent);
				self.$phones.appendTo(self.$phonesParent);
				self.$callback.appendTo(self.$callbackParent.css({display: ''}));
				self.$menu.remove();
				self.$headerMenuBox.css({display: ''});
				$('body').removeClass('mobile-page');
				self.iscreateMenu = false;
				self.destroyScrollMenu();
			}
		},
		displayMenu: function () {
			var self = this;
			if (self.isMobile) {
				self.createMenu();
				self.$menu.show();
			} else {
				self.$menu.hide();
				self.destroyMenu();
			}
		},
		oldScrollTop: 0,
		windowHeight: 0,
		initScrollMenu: function () {
			// c('initScrollMenu');
			var self = this;
			$(window).on('resize.AdaptiveMenuScrollMenu', function () {
				// c('resize.AdaptiveMenuScrollMenu');
				self.windowHeight = $(window).outerHeight();
			}).trigger('resize.AdaptiveMenuScrollMenu');
		},
		createScrollMenu: function () {
			// c('createScrollMenu');
			var self = this,
				// i = 0,
				lazyScroll = __debounce(function () {
					// c('lazyScroll - ' + (i++));
					var menuHeight =  self.$menu.outerHeight(),
						windowHeight = self.windowHeight;
					if (menuHeight > windowHeight) {
						var $menu = self.$menu,
							scrollTop = $(window).scrollTop(),
							top = Math.floor($menu.offset().top - scrollTop),
							deltaScroll = scrollTop - self.oldScrollTop,
							bottom = top + menuHeight,
							bodyBottom = windowHeight,
							deltaBottom = bottom - bodyBottom,
							oldCssTop = parseInt($menu.css('top')),
							cssTop = oldCssTop - deltaScroll;
						cssTop = cssTop > 0 ? 0 : cssTop;
						// c('deltaScroll - ' + deltaScroll);
						// c('top - ' + top, 'scrollTop - ' + scrollTop);
						// c('bottom - ' + bottom, 'bodyBottom - ' + bodyBottom);
						// c('cssTop - ' + cssTop);
						if (deltaScroll > 0) { // bottom
							if (deltaBottom > 0) {
								cssTop = deltaScroll > deltaBottom ? oldCssTop - deltaBottom : cssTop;
								$menu.css({top: cssTop + 'px'});
							}
						} else if (deltaScroll < 0) { // top
							if (cssTop <= 0) {
								$menu.css({top: cssTop + 'px'});
							}
						}
						self.oldScrollTop = scrollTop;
					}
				}, 20);

			$(window).on('scroll.AdaptiveMenuScrollMenu', lazyScroll);
		},
		destroyScrollMenu: function () {
			// c('destroyScrollMenu');
			$(window).off('scroll.AdaptiveMenuScrollMenu');
		}
	};

	new AdaptiveMenu();

	// Main slider

	function MainSlider($block, settings) {
		// settings
		this.$block = $block;
		// this.$items = $('.slider__slide', $block);
		this.$inputs = $('.slider__check', $block);
		this.$buttons = $('.slider__label', $block);
		this.index = 0;
		this.autoPlay = false;
		this.autoPlayDuratin = 10000;

		$.extend(this, settings); // allow decorator, mixins

		this.init();

		return this;
	}

	MainSlider.prototype = {
		init: function () {
			var self = this;
			self.autoPlayInit();
		},
		showItem: function (index) {
			var self = this;
			// self.$inputs.eq(index).trigger('click');
			self.$inputs.eq(index).prop('checked', true);
			self.index = index;
		},
		setLeft: function () {
			var self = this,
				index = self.index - 1;
			index = index >= 0 ? index : (self.$inputs.length - 1);
			self.showItem(index);
		},
		setRight: function () {
			var self = this,
				index = self.index + 1;
			index = index <= (self.$inputs.length - 1) ? index : 0;
			self.showItem(index);
		},
		autoPlayInit: function () {
			var self = this;
			if (self.autoPlay) {
				var intervalId = setInterval(function () {
					if (self.autoPlay) {
						self.setRight();
					}
				}, self.autoPlayDuratin);

				self.$buttons.on('click.MainSlider', function () {
					self.autoPlay = false;
					clearInterval(intervalId);
				});
			}
		}
	};

	jQuery.fn.mainSlider = function (settings) {
		return this.each(function () {
			this.mainSlider = new MainSlider($(this), settings);
		});
	};

	$('.slider').mainSlider({autoPlay: true});

	// Brend slider

	function BrendSlider($block, settings) {
		// settings
		this.$block = $block;
		this.$items = $('.brend-slider__box', $block);
		this.$left = $('.brend-slider__arrow-left', $block);
		this.$right = $('.brend-slider__arrow-right', $block);
		this.index = 0;
		this.autoPlay = false;
		this.autoPlayDuratin = 5000;

		$.extend(this, settings); // allow decorator, mixins

		this.init();

		return this;
	}

	BrendSlider.prototype = {
		init: function () {
			var self = this;
			self.$items.hide().eq(0).show();
			this.index = 0;
			this.$left.on('click.BrendSlider', function () {
				self.setLeft();
			});
			this.$right.on('click.BrendSlider', function () {
				self.setRight();
			});
			self.autoPlayInit();
		},
		setLeft: function () {
			var self = this,
				index = self.index - 1;
			index = index >= 0 ? index : (self.$items.length - 1);
			// c('left index - ' + index);
			self.showItem(index);
		},
		setRight: function () {
			var self = this,
				index = self.index + 1;
			index = index <= (self.$items.length - 1) ? index : 0;
			// c('right index - ' + index);
			self.showItem(index);
		},
		showItem: function (index) {
			var self = this,
				$oldItem = self.$items.eq(self.index),
				$newItem = self.$items.eq(index),
				time = 500;
			$newItem.stop();
			$oldItem.stop().fadeOut(time, function () {
				$newItem.fadeIn(time);
				self.index = index;
			});
		},
		// showItem: function (index) {
		// 	var self = this,
		// 		$oldItem = self.$items.eq(self.index),
		// 		$newItem = self.$items.eq(index),
		// 		time = 500;
		// 	$oldItem.stop().slideUp(time);
		// 	$newItem.stop().slideDown(time);
		// 	self.index = index;
		// },
		autoPlayInit: function () {
			var self = this;
			if (self.autoPlay) {
				var intervalId = setInterval(function () {
					if (self.autoPlay) {
						self.setLeft();
					}
				}, self.autoPlayDuratin);

				self.$left.add(self.$right).on('click.BrendSlider', function () {
					self.autoPlay = false;
					clearInterval(intervalId);
				});
			}
		}
	};

	jQuery.fn.brendSlider = function (settings) {
		return this.each(function () {
			this.brendSlider = new BrendSlider($(this), settings);
		});
	};

	$('.brend-slider').brendSlider({autoPlay: true});

	// Scroll top button
	jQuery.fn.scrollTopButton = function () {
		var $button = $('<a href="#" class="scroll-top"></a>')
		.html('<svg class="icon icon-up-arrow" role="img"><use xlink:href="assets/images/icon.svg#up-arrow"/></svg>')
		.hide().appendTo($('body'))
		.on('click.scrollTopButton', function (e) {
			$('html, body').animate({
				scrollTop: 0
			}, 'slow');
			e.preventDefault();
			return false;
		});
		$(window).scroll(function () {
			if ($(window).scrollTop() > 700) {
				$button.show();
			} else {
				$button.hide();
			}
		});
	};

	$().scrollTopButton();

	// animations when window scroll
	// var wow = new WOW({
	// 	boxClass: 'wow', // default
	// 	animateClass: 'animated', // default
	// 	offset: 0, // default
	// 	mobile: true, // default
	// 	live: true // default
	// });
	// wow.init();
	new WOW().init();

	// form filters
	// sliders
	function initSliders($filterForm) {
		var sliderChangeTimer = null,
			sliderFormat = function (str) {
				str = str.toString().replace(/(\.(.*))/g, '');
				var arr = str.split(''),
					str_temp = '';
				if (str.length > 3) {
					for (var i = arr.length - 1, j = 1; i >= 0; i--, j++) {
						str_temp = arr[i] + str_temp;
						if (j % 3 === 0) {
							str_temp = ' ' + str_temp;
						}
					}
					return str_temp;
				} else {
					return str;
				}
			},
			sliderChange = function ($parentBox, ui, $box) {
				var $labels = $('.filter__slider-label-count', $parentBox),
					values = ui.values;
				$(values).each(function (index, value) {
					var $label =  $labels.eq(index),
						valueHtml = $box.data('format-number') ? sliderFormat(value) : value;
					$label.html($.trim(valueHtml));
				});
			},
			lazySliderChange = function ($parentBox, ui, $box) {
				if (sliderChangeTimer) {
					clearTimeout(sliderChangeTimer);
				}
				sliderChangeTimer = setTimeout(function () {
					sliderChange($parentBox, ui, $box);
				}, 50);
			},
			sliderSetValue = function ($parentBox, ui) {
				var $inputs = $('.filter__slider-input', $parentBox),
					values = ui.values;
				$(values).each(function (index, value) {
					var $input =  $inputs.eq(index);
					$input.prop('value', value);
				});
			};
		$('.filter__slider', $filterForm).each(function () {
			var $box = $(this),
				$parentBox = $box.parent(),
				data = $box.data(),
				settings = {
					min: 0,
					max: 100,
					range: true,
					slide: function (event, ui) {
						lazySliderChange($parentBox, ui, $box);
					},
					change: function (event, ui) {
						sliderChange($parentBox, ui, $box);
						sliderSetValue($parentBox, ui);
					}
				};
			$.extend(settings, data);
			// c('settings - ', settings);
			$box.slider(settings);
			sliderChange($parentBox, settings, $box);
			sliderSetValue($parentBox, settings);
		});
		// jQuery('.filter__slider').slider();
	}

	function resetSliders($filterForm) {
		$('.filter__slider', $filterForm).each(function () {
			var $box = $(this),
				data = $box.data();
			$box.slider('values', data.values);
		});
	}

	$(document).ready(function () {
		var $filterForm = $('.filter');
		if ($filterForm.length) {
			$('.filter__block-hd', $filterForm).on('click.filters', function () {
				var $header = $(this),
					$block = $header.parent(),
					$body = $('.filter__block-body', $block);
				$body.stop().slideToggle(500, function () {
					$block.toggleClass('filter__block_close');
				});
			});

			// sliders
			initSliders($filterForm);

			$('.filter__btn', $filterForm).on('click.filters', function () {
				c('click - initSliders');
				resetSliders($filterForm);
			});
		}
	});

	// goods-list page
	// $(document).ready(function () {
	// 	var $box = $('.goods'),
	// 		$inputs = $('.goods-filter__grid-input', $box),
	// 		$listInput = $('#js-goods-grid-0', $box),
	// 		listInput = $listInput.get(0),
	// 		listClass = 'goods_list',
	// 		$labels = $('.goods-filter__grid', $box),
	// 		toggleView = function () {
	// 			if (listInput && listInput.checked) {
	// 				$box.addClass(listClass);
	// 			} else {
	// 				$box.removeClass(listClass);
	// 			}
	// 		};
	// 	toggleView();
	// 	$inputs.on('change.goods-list', toggleView);

	// });

	// number input in product cart
	$(document).ready(function () {
		$('.nom-inp').each(function () {
			var $box = $(this),
				$inp = $('.nom-inp__inp', $box),
				$up = $('.nom-inp__up', $box),
				$down = $('.nom-inp__down', $box),
				postfix = $inp.data('postfix') || '',
				oldVal = 1,
				timer = null;

			function getVal() {
				var val = parseInt($inp.val());
				return val ? val : oldVal;
			}
			function resize(val) {
				if (timer) {
					clearTimeout(timer);
				}
				timer = setTimeout((function (val) {
					var startVal = val ? val : getVal(),
						len = val.toString().length;
					val = startVal && len < 10 ? startVal : oldVal;
					len = (val.toString() + postfix).length;
					$inp.attr('size', len);
					$inp.val(val + postfix);
					oldVal = val;
				})(val), 300);
			}

			$up.click(function () {
				resize((getVal() + 1));
			});
			$down.click(function () {
				resize((getVal() - 1));
			});
			$inp.keyup(function () {
				resize();
			});

		});
	});
});
