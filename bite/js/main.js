$('[data-toggle="popover"]').popover({
  trigger: 'hover'
});
jQuery.fn.scrollCenter = function(elem, speed) {

  var active = jQuery(this).find(elem); // find the active element
  //var activeWidth = active.width(); // get active width
  var activeWidth = active.width() / 2; // get active width center

  //alert(activeWidth)

  var pos = active.position().left + activeWidth; //get left position of active li + center position
  var elpos = jQuery(this).scrollLeft(); // get current scroll position
  var elW = jQuery(this).width(); //get div width
  //var divwidth = jQuery(elem).width(); //get div width
  pos = pos + elpos - elW / 2; // for center position if you want adjust then change this

  jQuery(this).animate({
    scrollLeft: pos
  }, speed === undefined ? 1000 : speed);
  return this;
};

jQuery.fn.scrollCenterORI = function(elem, speed) {
  jQuery(this).animate({
    scrollLeft: jQuery(this).scrollLeft() - jQuery(this).offset().left + jQuery(elem).offset().left
  }, speed === undefined ? 1000 : speed);
  return this;
};


function initializeSlider() {

if ( $(window).width() < 768 ) {
  $('.accordion-slider, .accordion-slider .box').css('height', window.innerHeight - 122);
}

var active;
var boxes = $('.accordion-slider .box').length;
var singleBoxWidth = (100 / boxes) * 0.6;
var collapsedWidth = singleBoxWidth - ( singleBoxWidth / ( boxes - 1 ) );
var openWidth = 100 - (collapsedWidth * ( boxes - 1 ) );

function activateSlide(that) {
  if ( !$(that).hasClass('active') ) {
    if ( active && $(window).width() >= 768 ) {
      TweenLite.to(active.find('.accordion-slider-title'), 0, {opacity:0, x:-20+'%', overwrite:'all'});
      TweenLite.to(active.find('.accordion-slider-content'), 0, {opacity:0, x:-20+'%', overwrite:'all'});
      TweenLite.to(active.find('.accordion-slider-object'), 0.4, {opacity:1, width:100+'%', x:70+'%', y:-50+'%', overwrite:'all'});
    }
    //introduce new active elements
    var others = $('.accordion-slider .box').not(that);
    active = $(that);
    $(that).addClass('active').removeClass('inactive');
    others.removeClass('active').addClass('inactive');
    var tl = new TimelineLite();
    if ( $(window).width() >= 768 ) {
      tl.to(others, 0.8, {ease: Back.easeOut.config(1.1),width:collapsedWidth + '%'}, 0)
      .to(active, 0.8, {ease: Back.easeOut.config(1.1),width:openWidth + '%'}, 0)
      .to(active.find('.accordion-slider-title'), 0.6, {ease: Back.easeOut.config(1.2), x:0+'%', opacity:1}, 0.3)
      .to(active.find('.accordion-slider-content'), 0.6, {ease: Back.easeOut.config(1.2),x:0+'%', opacity:1}, 0.4)
      .to(active.find('.accordion-slider-object'), 0.4, {opacity:1,right:50+'%',width:34+'%', x:124+'%', y:-50+'%'}, 0);
    } else {
      tl.from(active.find('.accordion-slider-title'), 0.6, {ease: Back.easeOut.config(1.2), scale:0.5, x:0, opacity:0}, 0.3)
      .to(active.find('.accordion-slider-title'), 0.6, {ease: Back.easeOut.config(1.2), opacity:1, scale:1, x:0}, 0.3)
      .from(active.find('.accordion-slider-content'), 0.6, {ease: Back.easeOut.config(1.2), opacity:0, scale:0.5, x:0}, 0.4)
      .to(active.find('.accordion-slider-content'), 0.6, {ease: Back.easeOut.config(1.2), opacity:1, scale:1, x:0}, 0.4)
      .from(active.find('.accordion-slider-object'), 0.4, {width:'auto', x:50+'%', y:0}, 0)
      .to(active.find('.accordion-slider-object'), 0.4, {opacity:1, x:-50+'%'}, 0);
    }
  }
}

//activate middle slide
activateSlide('.accordion-slider .box.second-box');

function switchSlides() {
  $('.accordion-slider-pagination a').removeClass('active');
  if ( $('.accordion-slider .box.first-box').hasClass('active') ) {
    activateSlide('.accordion-slider .box.second-box');
    $('.accordion-slider-pagination .second').addClass('active');
  } else if ( $('.accordion-slider .box.second-box').hasClass('active') ) {
    activateSlide('.accordion-slider .box.third-box');
    $('.accordion-slider-pagination .third').addClass('active');
  } else {
    activateSlide('.accordion-slider .box.first-box');
    $('.accordion-slider-pagination .first').addClass('active');
  }
}

function previousSlides() {
  $('.accordion-slider-pagination a').removeClass('active');
  if ( $('.accordion-slider .box.first-box').hasClass('active') ) {
    activateSlide('.accordion-slider .box.third-box');
    $('.accordion-slider-pagination .third').addClass('active');
  } else if ( $('.accordion-slider .box.second-box').hasClass('active') ) {
    activateSlide('.accordion-slider .box.first-box');
    $('.accordion-slider-pagination .first').addClass('active');
  } else {
    activateSlide('.accordion-slider .box.second-box');
    $('.accordion-slider-pagination .second').addClass('active');
  }
}

//switch slides every x seconds
var slideshow = setInterval(switchSlides, 5000);

$('.accordion-slider').on('click', '.box', function() {
  if ( $(window).width() >= 768 ) {
    activateSlide(this);
    clearInterval(slideshow);
    slideshow = setInterval(switchSlides, 5000);
  }
});

var previousScrollY = 0;

$(document).on('show.bs.modal', function() {
    previousScrollY = window.scrollY;
    $('html').addClass('modal-open').css({
        marginTop: -previousScrollY,
        overflow: 'hidden',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        position: 'fixed',
    });
}).on('hidden.bs.modal', function() {
    $('html').removeClass('modal-open').css({
        marginTop: 0,
        overflow: 'visible',
        left: 'auto',
        right: 'auto',
        top: 'auto',
        bottom: 'auto',
        position: 'static',
    });
    window.scrollTo(0, previousScrollY);
});

$('.accordion-slider').swipe( {
  swipeLeft:function() {
    switchSlides();
    clearInterval(slideshow);
    slideshow = setInterval(switchSlides, 5000);
  },
  swipeRight:function() {
    previousSlides();
    clearInterval(slideshow);
    slideshow = setInterval(switchSlides, 5000);
  }
});

// Mobile slider pagination
$('.accordion-slider-pagination a').on('click', function(e) {
  var index = $(this).attr('href').replace( /#/, "" );
  $('.accordion-slider-pagination a').removeClass('active');
  if ( index == 'slide1' ) {
    activateSlide('.accordion-slider .box.first-box');
    $('.accordion-slider-pagination .first').addClass('active');
  } else if ( index == 'slide2' ) {
    activateSlide('.accordion-slider .box.second-box');
    $('.accordion-slider-pagination .second').addClass('active');
  } else {
    activateSlide('.accordion-slider .box.third-box');
    $('.accordion-slider-pagination .third').addClass('active');
  }
  clearInterval(slideshow);
  slideshow = setInterval(switchSlides, 5000);
  e.preventDefault();
});


}

// Custom select
function initCustomSelect() {

$('select').not('.custom__select').each(function() {
  var $this = $(this), numberOfOptions = $(this).children('option').length;

  $this.addClass('select-hidden');
  $this.wrap('<div class="select"></div>');
  $this.after('<div class="select-styled"></div>');

  var $styledSelect = $this.next('div.select-styled');
  $styledSelect.text($this.children('option').eq(0).text());

  var $list = $('<ul />', {
    'class': 'select-options'
  }).insertAfter($styledSelect);

  for (var i = 0; i < numberOfOptions; i++) {
    $('<li />', {
      text: $this.children('option').eq(i).text(),
      rel: $this.children('option').eq(i).val()
    }).appendTo($list);
  }

  var $listItems = $list.children('li');

  $styledSelect.click(function(e) {
    e.stopPropagation();
    $('div.select-styled.active').not(this).each(function(){
      $(this).removeClass('active').next('ul.select-options').slideUp(150);
    });
    $(this).toggleClass('active').next('ul.select-options').slideToggle(200);
  });

  $listItems.click(function(e) {
    e.stopPropagation();
    $styledSelect.text($(this).text()).removeClass('active');
    $this.val($(this).attr('rel'));
    $list.slideUp(150);
    $this.trigger('change');
  });

  $(document).click(function() {
    $styledSelect.removeClass('active');
    $list.slideUp(150);
  });

});

}



$.fn.inView = function() {
  //Window Object
  var win = $(window);
  //Object to Check
  obj = $(this);
  //the top Scroll Position in the page
  var scrollPosition = win.scrollTop();
  //the end of the visible area in the page, starting from the scroll position
  var visibleArea = win.scrollTop() + win.height();
  //the end of the object to check
  var objEndPos = (obj.offset().top + obj.outerHeight());
  return(visibleArea >= objEndPos && scrollPosition <= objEndPos ? true : false);
};



$.fn.animateTo = function(appendTo, destination, duration, easing, complete) {
  if(appendTo !== 'appendTo'     &&
     appendTo !== 'prependTo'    &&
     appendTo !== 'insertBefore' &&
     appendTo !== 'insertAfter') return this;
  var target = this.clone(true).css('visibility','hidden')[appendTo](destination);
  this.css({
    'position' : 'relative',
    'top'      : '0px',
    'left'     : '0px'
  }).animate({
    'top'  : (target.offset().top - this.offset().top)+'px',
    'left' : (target.offset().left - this.offset().left)+'px'
  }, duration, easing, function() {
    target.replaceWith($(this));
    $(this).css({
      'position' : 'static',
      'top'      : '',
      'left'     : ''
    });
    if($.isFunction(complete)) complete.call(this);
  });
};

jQuery(function($) {

$('a[href*="#"].scrollto:not([href="#"])').click(function() {
  if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
    var minusOffset = 100;

    if ($(this).attr('data-minus-offset')) {
      minusOffset = $(this).attr('data-minus-offset');
    }

    var target = $(this.hash);
    target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
    if (target.length) {
      $('html, body').animate({
        scrollTop: target.offset().top - minusOffset
      }, 700);
      return false;
    }
  }
});


$('.scrollto-tab').click(function() {
  var target = "#" + $(this).data('target');
  $('[href="' + target + '"]').trigger('click');
  setTimeout(function() {
    $('html, body').animate({
      scrollTop: $(target).offset().top - 100
    }, 700);
  }, 200);
  return false;
});

// Check inputs if filled
$('.form-control').each(function() {
  var el = $(this);

  el.keyup(function() {
    if($(this).val() === "") {
      $(this).parent().removeClass('input--filled');
    } else {
      $(this).parent().addClass('input--filled');
    }
  });

  el.blur(function() {
    if ($(this).val()) {
      $(this).parent().addClass('input--filled');
    } else {
      $(this).parent().removeClass('input--filled');
    }
  });

  if ($(this).val()) {
    $(this).parent().addClass('input--filled');
  } else {
    $(this).parent().removeClass('input--filled');
  }
});

initializeSlider();

function collision($div1, $div2) {
  var x1 = $div1.offset().left;
  var y1 = $div1.offset().top;
  var h1 = $div1.outerHeight(true);
  var w1 = $div1.outerWidth(true);
  var b1 = y1 + h1;
  var r1 = x1 + w1;
  var x2 = $div2.offset().left;
  var y2 = $div2.offset().top;
  var h2 = $div2.outerHeight(true);
  var w2 = $div2.outerWidth(true);
  var b2 = y2 + h2;
  var r2 = x2 + w2;

  if (b1 < y2 || y1 > b2 || r1 < x2 || x1 > r2) return false;
  return true;
}

function stickCreditLimit() {
  var creditLimitWidth = $('.panel--creditLimit').width();
  var creditLimitHeight = $('.panel--creditLimit').height();

  if ( collision( $('.panel--creditLimit'), $('.recommendedSlider') ) === true ) {
    $('.recommendedSlider').css({
      'top': creditLimitHeight + 30
    });
  }

  if ( $(window).width() < 992 ) {
    $('.panel--creditLimit').css({
      'right': '0px'
    });
  } else {
    $('.panel--creditLimit').css({
      'right': -creditLimitWidth - 40
    });
  }

}

$(window).resize(function() {
  if ( $('.shoppingCart--step1').length ) {
    stickCreditLimit();
  }
});

$(window).on('scroll', function() {

  if ( $(window).width() >= 768 ) {

    if ( $('.whyJoin__icon').length && $('.whyJoin__icon').inView() ) {
      $('.whyJoin').addClass('active');
      $('.whyJoin__icon, .whyJoin .btn').addClass('animated bounceIn');
    }

    if ( $('.coverage__graphic').length && $('.coverage__graphic').inView() ) {
      $('.graphic__text').addClass('animated bounceIn');
    }

  }

  if ( $(window).width() >= 992 ) {
    if ( $('.innerPage-header__panel').length && $('.innerPage-header__panel').inView() ) {
      $('.innerPage-header__panel').addClass('animated fadeInUp');
    }
  }

  if ( $('.shoppingCart--step1').length ) {
    stickCreditLimit();
  }

  if ( $('.compareBar:not(.compareBar--inner-page)').length && $(window).width() < 768 && $('.compareBar__product-list').is(":visible") ) {
    $('.compareBar__toggle').addClass('up');
    $('.compareBar .compareBar__product-list').slideUp(300);
  }

  if ( $('.service__addToCart').length ) {
    if ( collision( $('.service__addToCart'), $('.footer') ) === true || collision( $('.service__addToCart'), $('.lSSlideOuter') ) === true ) {
      $('.service__addToCart').css('opacity', '0');
    } else {
      $('.service__addToCart').css('opacity', '1');
    }
  }

});

if ( $('.filterResult').length ) {

  var waypoint = new Waypoint({
    element: $('.filterResult'),
    handler: function(direction) {
      if ( direction == 'down') {
        $('.filterResult').append('<div class="col-xs-12 loader-wrapper"><div class="cssload-loader"><div class="cssload-ball"></div></div></div>');
        setTimeout(function() {
          $('.filterResult .loader-wrapper').remove();
          $('.filterResult__more').removeClass('hide');
          Waypoint.refreshAll();
          bannerHeight();
        }, 2000);
      }
    },
    offset: 'bottom-in-view'
  });

}

if ( $('.service__addToCart').length && $(window).width() > 991 ) {

  var addToCartWaypoint = new Waypoint({
    element: $('.servicesDetails__content'),
    handler: function(direction) {
      if ( direction == 'down') {
        $('.service__addToCart').addClass('fixed');
      } else {
        $('.service__addToCart').removeClass('fixed');
      }
    },
    offset: '120px'
  });

  // var addToCartWaypoint2 = new Waypoint({
  //   element: $('.servicesDetails__content'),
  //   handler: function(direction) {
  //     if ( direction == 'down') {
  //       $('.service__addToCart').css('opacity', '0');
  //     } else {
  //       $('.service__addToCart').css('opacity', '1');
  //     }
  //   },
  //   offset: 'bottom-in-view'
  // });

}

if ( $('.shoppingCart--step1').length ) {
  stickCreditLimit();
}

// $('html, body').animate({
//   scrollTop: $('body').offset().top + 1
// }, 0);

// Parallax
if ( $(window).width() > 991 ) {
  var rellax = new Rellax('.rellax', {
    center: true
  });
}

// Home page graphic animation
if ( $('#graphic').length ) {
  new Vivus('graphic', {
    duration: 180,
    start: 'inViewport',
    animTimingFunction: Vivus.EASE_OUT,
    file: 'images/graphic.svg'
  });
}

initCustomSelect();

$('.product__addToFavorites').on('click', function(e) {
  $(this).toggleClass('active');
  e.preventDefault();
});

function addToCompareList(that) {
  $this = that;
  productID = $this.closest('.product').attr('id');
  lastProductID = $('.compareBar__product-list .compareBar__product:not(:empty):last').attr('id');
  productImage = $this.closest('.product').find('.product__thumb').attr('src');
  productName = $this.closest('.product').find('.product__title a').html();
  if ( $('.compareBar__product-list .compareBar__product:not(:empty)').length == 4 ) {
    $('.compareBar .compareBar__product:last').html('<img src="'+ productImage +'" class="compareBar__product-thumb img-responsive center-block"><div class="compareBar__product-inner"><h3 class="compareBar__product-title">'+ productName +'</h3><a href="#" class="compareBar__product-remove"></a></div>').removeClass('compareBar__product--empty').attr('id', productID+'-compare').hide().fadeIn(300);
    $('.product[id='+lastProductID.replace('-compare','')+'] .checkbox--compare input').prop('checked', false).parent().find('div').html(addText);
  } else {
    $('.compareBar__toggle').removeClass('up');
    $('.compareBar').addClass('swing-in-bottom-fwd').show();
    $('.compareBar .compareBar__product:empty:first').html('<img src="'+ productImage +'" class="compareBar__product-thumb img-responsive center-block"><div class="compareBar__product-inner"><h3 class="compareBar__product-title">'+ productName +'</h3><a href="#" class="compareBar__product-remove"></a></div>').removeClass('compareBar__product--empty').attr('id', productID+'-compare').hide().fadeIn(300);
  }
  if ( $(window).width() < 768 ) {
    $('.compareBar .compareBar__product-list').show();
  }
}

function removeFromCompareList(that) {
  $this = that;
  productID = $this.closest('.product').attr('id');
  productImage = $this.closest('.product').find('.product__thumb').attr('src');
  productName = $this.closest('.product').find('.product__title a').html();
  $('.compareBar').find('.compareBar__product[id='+productID+'-compare]').html('').addClass('compareBar__product--empty').removeAttr('id');
  if ( $('.compareBar__product-list .compareBar__product:empty').length == 4 ) {
    $('.compareBar').removeClass('swing-in-bottom-fwd').addClass('swing-out-bottom-bck');
    setTimeout(function() {
      $('.compareBar').hide().removeClass('swing-out-bottom-bck');
    }, 500);
  }
}

var removeText = $('.checkbox--compare input').attr('data-removetext');
var addText = $('.checkbox--compare input').attr('data-addtext');

$('.checkbox--compare input').on('click', function() {
  $(this).parent().find('div').html(this.checked ? removeText : addText);
  this.checked ? addToCompareList( $(this) ) : removeFromCompareList( $(this) );
});

$('.compareBar__product-list').on('click', '.compareBar__product-remove', function(e) {
  productID = $(this).closest('.compareBar__product').attr('id').replace('-compare','');
  $(this).closest('.compareBar__product').html('').addClass('compareBar__product--empty').removeAttr('id');
  $('.product[id='+productID+'] .checkbox--compare input').prop('checked', false).parent().find('div').html(addText);
  if ( $('.compareBar__product-list .compareBar__product:empty').length == 4 ) {
    $('.compareBar').removeClass('swing-in-bottom-fwd').addClass('swing-out-bottom-bck');
    setTimeout(function() {
      $('.compareBar').hide().removeClass('swing-out-bottom-bck');
    }, 500);
  }
  e.preventDefault();
});

if ( $(window).width() < 768 ) {
  $('.compareBar').on('click', '.compareBar__product', function(e) {
    $(this).find('.compareBar__product-remove').trigger('click');
    e.preventDefault();
  });
}

$('.compareBar__removeall').on('click', function(e) {
  $('.compareBar .compareBar__product').html('').addClass('compareBar__product--empty').removeAttr('id');
  $('.checkbox--compare input').prop('checked', false).parent().find('div').html(addText);
  $('.compareBar').removeClass('swing-in-bottom-fwd').addClass('swing-out-bottom-bck');
  setTimeout(function() {
    $('.compareBar').hide().removeClass('swing-out-bottom-bck');
  }, 500);
  e.preventDefault();
});

$('.compareBar__toggle').on('click', function(e) {
  $(this).toggleClass('up');
  $('.compareBar .compareBar__product-list').slideToggle(300);
  e.preventDefault();
});

//Product categories mobile dropdown
$('.productCategories__mobileSelect').on('click', '.placeholder', function() {
  var parent = $(this).closest('.productCategories__mobileSelect');
  if ( ! parent.hasClass('is-open')) {
    parent.addClass('is-open');
    $('.productCategories__mobileSelect.is-open').not(parent).removeClass('is-open');
  } else {
    parent.removeClass('is-open');
  }
}).on('click', 'ul>li', function() {
  var parent = $(this).closest('.productCategories__mobileSelect');
  parent.removeClass('is-open').find('.placeholder').text( $(this).text() );
});

//Price range slider
$('#rangeSlider1 .rangeSlider').slider({
  range: true,
  min: 5,
  max: 80,
  step: 1,
  values: [19, 60],
  slide: function (e, ui) {
    $('#rangeSlider1 .value1').html(ui.values[0] + '€');
    $('#rangeSlider1 .value2').html(ui.values[1] + '€');
  }
});

$('#rangeSlider1 .value1').html( $("#rangeSlider1 .rangeSlider").slider( "values", 0 ) + '€' );
$('#rangeSlider1 .value2').html( $("#rangeSlider1 .rangeSlider").slider( "values", 1 ) + '€' );

//Price range slider
$('#rangeSlider4 .rangeSlider').slider({
  range: "min",
  min: 0,
  max: 100,
  step: 1,
  value: 0,
  slide: function (e, ui) {
    $('#rangeSlider4 .value1').html(ui.value);
  }
});

$('#rangeSlider4 .value1').html( $("#rangeSlider4 .rangeSlider").slider("value") );

//Memory range slider
$('#rangeSlider2 .rangeSlider').slider({
  range: true,
  min: 8,
  max: 32,
  step: 4,
  values: [16, 20],
  slide: function (e, ui) {
    $('#rangeSlider2 .value1').html(ui.values[0] + ' GB');
    $('#rangeSlider2 .value2').html(ui.values[1] + ' GB');
  }
});

$('#rangeSlider2 .value1').html( $("#rangeSlider2 .rangeSlider").slider( "values", 0 ) + ' GB' );
$('#rangeSlider2 .value2').html( $("#rangeSlider2 .rangeSlider").slider( "values", 1 ) + ' GB' );

//Show mobile filters
$('.filterResult__show, .filterResult__hide').on('click', function() {
  $('.filterSidebar').slideToggle(300);
});

// Show transparent backgdrop when filtering products, add coresponding class to every filterable action
$('.filter-action').on('mouseup', function(e) {
  $('body').append('<div class="modal-backdrop fade in"></div>');
  setTimeout(function() {
    $('.modal-backdrop').removeClass('in').addClass('out').remove();
  }, 1000);
});

$('[data-toggle="popover"]').popover({
  trigger: 'hover'
});

$('#services-accessories__slider, #similar__slider').lightSlider({
    item: 4,
    autoWidth: false,
    slideMove: 1,
    slideMargin: 0,
    speed: 400,
    easing: 'cubic-bezier(0.25, 0, 0.25, 1)',
    auto: false,
    loop: true,
    pause: 4000,
    pager: false,

    responsive : [
      {
        breakpoint:1200,
        settings: {
          item: 3,
          slideMove: 1
        }
      },
      {
        breakpoint:991,
        settings: {
          item: 2,
          slideMove: 1
        }
      }
    ]

});

$('#other_services, .lp-slider').lightSlider({
    item: 4,
    autoWidth: false,
    slideMove: 1,
    slideMargin: 0,
    speed: 400,
    easing: 'cubic-bezier(0.25, 0, 0.25, 1)',
    auto: false,
    loop: true,
    pause: 4000,
    pager: false,

    responsive : [
      {
        breakpoint:1200,
        settings: {
          item: 3,
          slideMove: 1
        }
      },
      {
        breakpoint:991,
        settings: {
          item: 2,
          slideMove: 1
        }
      },
      {
        breakpoint:767,
        settings: {
          item: 1,
          slideMove: 1
        }
      }
    ]

});

var productSLider = $('.productPreview__imageSlider').not('.product-modal .productPreview__imageSlider').lightSlider({
    item: 1,
    autoWidth: false,
    slideMove: 1,
    slideMargin: 0,
    speed: 400,
    easing: 'cubic-bezier(0.25, 0, 0.25, 1)',
    auto: false,
    loop: true,
    pause: 4000,
    pager: true,
    gallery: true,
    thumbItem: 4,
    enableTouch: true,
    currentPagerPosition: 'middle'
});

productSLider.parent().next('.lSGallery').swipe( {
  swipeLeft:function() {
    productSLider.goToNextSlide();
  },
  swipeRight:function() {
    productSLider.goToPrevSlide();
  }
});

$('.product-modal').on('shown.bs.modal', function (e) {
  $('.productPreview__imageSlider').lightSlider({
      item: 1,
      autoWidth: false,
      slideMove: 1,
      slideMargin: 0,
      speed: 400,
      easing: 'cubic-bezier(0.25, 0, 0.25, 1)',
      auto: false,
      loop: true,
      //pause: 4000,
      pager: false
  });
});

$('#recommendedSlider').lightSlider({
    item: 1,
    autoWidth: false,
    slideMove: 1,
    slideMargin: 10,
    speed: 400,
    easing: 'cubic-bezier(0.25, 0, 0.25, 1)',
    auto: false,
    loop: true,
    pause: 4000,
    pager: false,

    responsive : [
      {
        breakpoint:991,
        settings: {
          item: 2,
          slideMove: 1
        }
      }
    ]

});

$('.tariffModal').on('shown.bs.modal', function() {
  $('#tariffModal__newNumberSlider').lightSlider({
      item: 1,
      autoWidth: false,
      slideMove: 1,
      slideMargin: 0,
      speed: 400,
      easing: 'cubic-bezier(0.25, 0, 0.25, 1)',
      auto: false,
      loop: false,
      pager: false
  });
  if ( $('.tariffModal__newNumberBulk').length ) {
    $('.tariffModal__newNumberBulk input[type="number"]').val( $('.tariffModal__newNumberSlider .checkbox--phone').length );
  }
});

$('.tariffModal--family').on('shown.bs.modal', function() {
  $('.tariffModal--family .tariffModal__finalAddedNumbers').empty();
  for (var i = 0; i < planUsers; i++) {
    $('.tariffModal--family .tariffModal__finalAddedNumbers').append('<span>&nbsp;</span>');
  }
  $('.tariffModal__price').html( $('.tariffPlan__price').html() ).fadeIn(300);
});

//Switch tabs to collapse on mobile
$('.tabCollapse').not('.mobile-visible').tabCollapse({
  accordionClass: 'visible-xs tabCollapse'
});

//Scroll to collapse top on mobile
// if ( $(window).width() < 768 ) {
//   $('[id$=accordion]').on('shown.bs.collapse', '.panel-default', function (e) {
//     var offset = $(this).find('.collapse.in').prev('.panel-heading');
//     if(offset) {
//       $('html,body').animate({
//         scrollTop: $(offset).offset().top
//       }, 500);
//     }
//   });
// }

var planUsers = 3;
var planPricePerUser = 32;
var planPriceAdditive = 6.5;

$('.tariffPlan__multiplierAdd').on('click', function() {
  if ( planUsers < 5) {
    planUsers++;
    planPricePerUser += planPriceAdditive;
    planCalculatedPrice = ( planPricePerUser ).toFixed(2);
    number = planCalculatedPrice.toString().split(".")[0];
    decimals = planCalculatedPrice.toString().split(".")[1];
    $('.tariffPlan__multiplyPrice .tariffPlan__multiplier span').html(planUsers);
    $('.tariffPlan__multiplyPrice .tariffPlan__price span').html( number + "." + "<sup>" + decimals + " €</sup>" );
    $('.tariffPlan__pricePerUser span').html( (planCalculatedPrice / planUsers).toFixed(2) );
  }
});

$('.tariffPlan__multiplierRemove').on('click', function() {
  if ( planUsers > 1) {
    planUsers--;
    planPricePerUser -= planPriceAdditive;
    planCalculatedPrice = ( planPricePerUser ).toFixed(2);
    number = planCalculatedPrice.toString().split(".")[0];
    decimals = planCalculatedPrice.toString().split(".")[1];
    $('.tariffPlan__multiplyPrice .tariffPlan__multiplier span').html(planUsers);
    $('.tariffPlan__multiplyPrice .tariffPlan__price span').html( number + "." + "<sup>" + decimals + " €</sup>" );
    $('.tariffPlan__pricePerUser span').html( (planCalculatedPrice / planUsers).toFixed(2) );
  }
});

$('.tariffPlan__buyExtraApps .checkbox input').on('click', function() {
  //$(this).parent().find('div').html(this.checked ? removeText : addText);
  appInitialPriceNumber = parseFloat( $('.tariffPlan__buyExtraApps .tariffPlan__price span').html() );
  appInitialPriceDecimal = parseFloat( $('.tariffPlan__buyExtraApps .tariffPlan__price span sup').html() );
  //appCalculatedPriceDecimal = (appInitialPriceDecimal).toFixed(2);
  appCalculatedPrice = appInitialPriceNumber + '.' + appInitialPriceDecimal;
  number = appCalculatedPrice.split(".")[0];
  decimals = appCalculatedPrice.split(".")[1];
  $('.tariffPlan__buyExtraApps .tariffPlan__price span').html(
    this.checked ? parseInt(number)+1 + "." + "<sup>" + decimals + " €</sup>"
    : parseInt(number)-1 + "." + "<sup>" + decimals + " €</sup>"
  );
});

$('#rangeSlider3 .rangeSlider').slider({
  range: "min",
  min: 2,
  max: 50,
  step: 0.01,
  value: 4,
  slide: function (e, ui) {
    var result = parseFloat(ui.value).toFixed(2);
    var oneMonth = $('.tariffPlan__validMonths p').attr('data-onemonth');
    var twoMonths = $('.tariffPlan__validMonths p').attr('data-twomonths');
    var sixMonths = $('.tariffPlan__validMonths p').attr('data-sixmonths');
    $('.tariffPlan__validMonths p').show();
    if ( result >= 2.00 && result <= 2.99 ) {
      $('.tariffPlan__validMonths p strong').html(oneMonth);
    } else if ( result >= 3.00 && result <= 7.99 ) {
      $('.tariffPlan__validMonths p strong').html(twoMonths);
    } else if ( result >= 8.00 && result <= 50 ) {
      $('.tariffPlan__validMonths p strong').html(sixMonths);
    } else if ( result < 2.00 ) {
      $('.tariffPlan__validMonths p strong').html('');
      $('.tariffPlan__validMonths p').hide();
    }

    splitResult = result.split('.').join("");

    value1 = splitResult.split("")[0];
    value2 = splitResult.split("")[1];
    value3 = splitResult.split("")[2];
    value4 = splitResult.split("")[3];

    if ( result < 10.00 ) {
      $('#rangeSlider3 .tariffPlan__selectedAmountNumbers--value1').val('');
      $('#rangeSlider3 .tariffPlan__selectedAmountNumbers--value2').val(value1);
      $('#rangeSlider3 .tariffPlan__selectedAmountNumbers--value3').val(value2);
      $('#rangeSlider3 .tariffPlan__selectedAmountNumbers--value4').val(value3);
    } else {
      $('#rangeSlider3 .tariffPlan__selectedAmountNumbers--value1').val(value1);
      $('#rangeSlider3 .tariffPlan__selectedAmountNumbers--value2').val(value2);
      $('#rangeSlider3 .tariffPlan__selectedAmountNumbers--value3').val(value3);
      $('#rangeSlider3 .tariffPlan__selectedAmountNumbers--value4').val(value4);
    }

  }
});

$('.tariffPlan__selectedAmountNumbers input').keydown(function(e) {
  // Allow: backspace, delete, tab, escape, enter and .
  if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
    // Allow: Ctrl+A, Command+A
    (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
    // Allow: home, end, left, right, down, up
    (e.keyCode >= 35 && e.keyCode <= 40)) {
    return;
  }
  // Ensure that it is a number and stop the keypress
  if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
    e.preventDefault();
  }
});

$('.tariffPlan__selectedAmountNumbers--value1').keyup( function (e) {
  if ( $(this).val() >= "5" && $('.tariffPlan__selectedAmountNumbers--value2').val() > "0" || $(this).val() > "5" && $('.tariffPlan__selectedAmountNumbers--value2').val() == "0" ) {
    $(this).val('4');
  }
  if ( $(this).val() == "0" && $('.tariffPlan__selectedAmountNumbers--value2').val() == "0" && $('.tariffPlan__selectedAmountNumbers--value3').val() == "0" && $('.tariffPlan__selectedAmountNumbers--value4').val() == "0" ) {
    $('.tariffPlan__selectedAmountNumbers--value2').val('1');
    $(this).val('');
  } else if ( $(this).val() == "0" || $(this).val() === "" ) {
    $(this).val('');
  }
});

$('.tariffPlan__selectedAmountNumbers--value2, .tariffPlan__selectedAmountNumbers--value3, .tariffPlan__selectedAmountNumbers--value4').keyup( function (e) {
  if ( $(this).val() > "0" && $('.tariffPlan__selectedAmountNumbers--value1').val() >= "5" ) {
    $(this).val('0');
  }
});

$('.tariffPlan__selectedAmountNumbers--value2').keyup( function (e) {
  if ( $(this).val() == "0" && $('.tariffPlan__selectedAmountNumbers--value3').val() == "0" && $('.tariffPlan__selectedAmountNumbers--value4').val() == "0" && $('.tariffPlan__selectedAmountNumbers--value1').val() === "" ) {
    $(this).val('1');
  }
});

$('.tariffPlan__selectedAmountNumbers--value3').keyup( function (e) {
  if ( $(this).val() == "0" && $('.tariffPlan__selectedAmountNumbers--value2').val() == "0" && $('.tariffPlan__selectedAmountNumbers--value4').val() == "0" && $('.tariffPlan__selectedAmountNumbers--value1').val() === "" ) {
    $(this).val('1');
  }
});

$('.tariffPlan__selectedAmountNumbers--value4').keyup( function (e) {
  if ( $(this).val() == "0" && $('.tariffPlan__selectedAmountNumbers--value2').val() == "0" && $('.tariffPlan__selectedAmountNumbers--value3').val() == "0" && $('.tariffPlan__selectedAmountNumbers--value1').val() === "" ) {
    $(this).val('1');
  }
});

$('#bank-payment .tariffPlan__selectedAmountNumbers input, #bank-payment-collapse .tariffPlan__selectedAmountNumbers input').keyup(function (e) {
  var val = "";
  $('#bank-payment .tariffPlan__selectedAmountNumbers input, #bank-payment-collapse .tariffPlan__selectedAmountNumbers input').each(function(){
    val += $(this).val();
  });
  splitVal = val.replace(/(.)(?=(.{2})+$)/g,"$1.");
  firstTwo = splitVal.substr(0, 2);
  lastTwo = splitVal.slice(-2);
  $('.tariffPlan__selectedAmountTotal').html( firstTwo + '.<sup>' + lastTwo + ' €</sup');
});

function focustext() {
  var input = this;
  setTimeout(function() {
      input.selectionStart = 0;
      input.selectionEnd = input.val().length;
  }, 100);
}

$('.tariffPlan__selectedAmountNumbers input').keyup(function(e) {
  if (e.keyCode == 9) {} else {
    if ( $(window).width() < 768 ) {
      $(this).nextAll('input').focus(focustext);
    } else {
      $(this).nextAll('input').eq(0).focus().select();
    }
  }
});

$('.tariffPlan__selectedAmountNumbers input').on('click', function() {
  if ( $(window).width() < 768 ) {
    $(this).focus(focustext);
  } else {
    $(this).select();
  }
});

//Collapse tariff plan extras on mobile
if ( $(window).width() <= 767 ) {
  $('.tariffPlan__extras').removeClass("in");
}

$('[data-toggle="tooltip"]').tooltip({
  trigger: 'hover'
});

$('.tariffModal__addPhone, .tariffModal__currentAddedNumbers').on('keydown', 'input[type="text"]', function(e) {
  // Allow: backspace, delete, tab, escape, enter and space
  if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 32]) !== -1 ||
    // Allow: Ctrl+A, Command+A
    (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
    // Allow: home, end, left, right, down, up
    (e.keyCode >= 35 && e.keyCode <= 40)) {
    return;
  }
  // Ensure that it is a number and stop the keypress
  if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
    e.preventDefault();
  }
});

$('.tariffModal__addPhone input[type="text"]').keyup(function(e) {
  if ( !this.value ) {
    $(this).next('.input-group-btn').find('.btn').attr('disabled', 'disabled');
  } else {
    $(this).next('.input-group-btn').find('.btn').removeAttr('disabled');
  }
});



// Tariff modal phone number logic

var tariffPhoneNumberInitialPrice = 0;
var tariffPhoneNumberPriceAdditive = 18.50;

var phoneNumberID = 0;

var maxNumbers = 5;

function tariffAddPhoneNumberPrice() {
  tariffPhoneNumberInitialPrice += tariffPhoneNumberPriceAdditive;
  phonesCalculatedPrice = ( tariffPhoneNumberInitialPrice ).toFixed(2);
  number = phonesCalculatedPrice.toString().split(".")[0];
  decimals = phonesCalculatedPrice.toString().split(".")[1];
  $('.tariffModal__price span').html( number + "." + "<sup>" + decimals + " €</sup>" );
}

function tariffSubstractPhoneNumberPrice() {
  tariffPhoneNumberInitialPrice -= tariffPhoneNumberPriceAdditive;
  phonesCalculatedPrice = ( tariffPhoneNumberInitialPrice ).toFixed(2);
  number = phonesCalculatedPrice.toString().split(".")[0];
  decimals = phonesCalculatedPrice.toString().split(".")[1];
  $('.tariffModal__price span').html( number + "." + "<sup>" + decimals + " €</sup>" );
}

$('.tariffModal__addCurrentNumber').on('click', function(e) {
  var currentPhone = $('.tariffModal__addPhone input[type="text"]').val();

  if ( $('.tariffModal--family').hasClass('in') ) {
    maxNumbers = planUsers;
  } else if ( $('.tariffModal--business').hasClass('in') ) {
    maxNumbers = 5;
  }

  if ( $('.tariffModal__finalAddedNumber').length < maxNumbers || $('.tariffModal--business').hasClass('in') && $('.tariffModal__currentNumber').length < maxNumbers ) {
    phoneNumberID++;
    $('.tariffModal__currentAddedNumbers').append('<div class="input-group tariffModal__currentNumber"><span class="input-group-addon">+371</span><input type="text" data-phoneid="phone'+ phoneNumberID +'" class="form-control" aria-label="Phone nr" value="'+ currentPhone +'"><span class="input-group-btn"><button class="btn btn-default tariffModal__removeCurrentNumber" type="button"></button></span></div>');
    $(this).closest('.tariffModal__currentOperator').find('.tariffModal__sectionTitle').addClass('active');
    $('.tariffModal__finalAddedNumbers').prepend('<div id="phone'+ phoneNumberID +'" class="tariffModal__finalAddedNumber">'+ currentPhone +'</div>');
    $('.tariffModal__addPhone input[type="text"]').val('').focus().blur();
    $('.tariffModal__infoHeading span').html( $('.tariffModal__finalAddedNumber').length );
    $('.tariffModal__addCurrentNumber').attr('disabled', 'disabled');
    if ( !$('.tariffModal--family').hasClass('in') ) {
      tariffAddPhoneNumberPrice();
    }
    $('.tariffModal__infoText').slideUp(300);
    $('.tariffModal__infoHeading').removeClass('hide');
    $('.tariffModal__alert').addClass('hidden');
    if ( !$('.tariffModal--family').hasClass('in') || $('.tariffModal__finalAddedNumber').length == maxNumbers ) {
      $('.tariffModal__continue').removeAttr('disabled');
    }
    $('.tariffModal__price').fadeIn(300);
    $('.tariffModal--family .tariffModal__finalAddedNumbers span:last-child').remove();
  } else {
    $('.tariffModal__alert').removeClass('hidden');
    $('.modal').animate({
      scrollTop: 0
    }, 500);
  }
  e.preventDefault();
});

$('.tariffModal__currentAddedNumbers').on('click', '.tariffModal__removeCurrentNumber', function(e) {

  if ( $('.tariffModal--family').hasClass('in') ) {
    maxNumbers = planUsers;
  } else if ( $('.tariffModal--business').hasClass('in') ) {
    maxNumbers = 5;
  }

  $(this).closest('.tariffModal__currentNumber').remove();
  if ( !$('.tariffModal--family').hasClass('in') ) {
    tariffSubstractPhoneNumberPrice();
  }
  if ( $('.tariffModal__currentAddedNumbers').html() === '' ) {
    $('.tariffModal__currentOperator .tariffModal__sectionTitle').removeClass('active');
  }
  dataPhoneID = $(this).closest('.tariffModal__currentNumber').find('input[type="text"]').attr('data-phoneid');
  $('.tariffModal__finalAddedNumbers').find('#'+ dataPhoneID).remove();
  $('.tariffModal--family .tariffModal__finalAddedNumbers').append('<span>&nbsp;</span>');
  $('.tariffModal__infoHeading span').html( $('.tariffModal__finalAddedNumber').length );
  if ( $('.tariffModal__finalAddedNumber').length < maxNumbers ) {
    $('.tariffModal__alert').addClass('hidden');
  }
  if ( $('.tariffModal__finalAddedNumber').length === 0 || $('.tariffModal--family').hasClass('in') && $('.tariffModal__finalAddedNumber').length < maxNumbers ) {
    $('.tariffModal__infoText').slideDown(300);
    $('.tariffModal__infoHeading').addClass('hide');
    $('.tariffModal__continue').attr('disabled', 'disabled');
    if ( !$('.tariffModal--family').hasClass('in') ) {
      $('.tariffModal__price').hide();
    }
  }
  e.preventDefault();
});


$('.tariffModal__currentPlan .checkbox input').on('click', function() {
  var currentPlanPhone = $(this).next().html();

  if ( $('.tariffModal--family').hasClass('in') ) {
    maxNumbers = planUsers;
  } else if ( $('.tariffModal--business').hasClass('in') ) {
    maxNumbers = Number.POSITIVE_INFINITY;
  }

  if (this.checked) {
    if ( $('.tariffModal__finalAddedNumber').length < maxNumbers ) {
      phoneNumberID++;
      $('.tariffModal__finalAddedNumbers').prepend('<div id="phone'+ phoneNumberID +'" class="tariffModal__finalAddedNumber">'+ currentPlanPhone +'</div>');
      if ( !$('.tariffModal--family').hasClass('in') ) {
        tariffAddPhoneNumberPrice();
      }
      $('.tariffModal__infoHeading span').html( $('.tariffModal__finalAddedNumber').length );
      $(this).attr('data-phoneid', 'phone'+phoneNumberID);
      $('.tariffModal__infoText').slideUp(300);
      $('.tariffModal__infoHeading').removeClass('hide');
      $('.tariffModal__alert').addClass('hidden');
      if ( !$('.tariffModal--family').hasClass('in') || $('.tariffModal__finalAddedNumber').length == maxNumbers ) {
        $('.tariffModal__continue').removeAttr('disabled');
      }
      $('.tariffModal__price').fadeIn(300);
      $('.tariffModal--family .tariffModal__finalAddedNumbers span:last-child').remove();
    } else {
      $('.tariffModal__alert').removeClass('hidden');
      $('.modal').animate({
        scrollTop: 0
      }, 500);
      return false;
    }
  } else {
    if ( $('.tariffModal__finalAddedNumber').length !== 0 && !$('.tariffModal--family').hasClass('in') ) {
      tariffSubstractPhoneNumberPrice();
    }
    dataPhoneID = $(this).attr('data-phoneid');
    $('.tariffModal__finalAddedNumbers').find('#'+ dataPhoneID).remove();
    $('.tariffModal__infoHeading span').html( $('.tariffModal__finalAddedNumber').length );
    $('.tariffModal--family .tariffModal__finalAddedNumbers').append('<span>&nbsp;</span>');
    if ( $('.tariffModal__finalAddedNumber').length === 0 || $('.tariffModal--family').hasClass('in') && $('.tariffModal__finalAddedNumber').length < maxNumbers ) {
      $('.tariffModal__infoText').slideDown(300);
      $('.tariffModal__infoHeading').addClass('hide');
      $('.tariffModal__continue').attr('disabled', 'disabled');
      if ( !$('.tariffModal--family').hasClass('in') ) {
        $('.tariffModal__price').hide();
      }
    }
  }

  $('.tariffModal__currentPlan .tariffModal__sectionTitle').addClass('active');
  if ( $('.tariffModal__currentPlan .checkbox input:checked').length === 0 ) {
    $('.tariffModal__currentPlan .tariffModal__sectionTitle').removeClass('active');
  }

  if ( $('.tariffModal__finalAddedNumber').length < maxNumbers ) {
    $('.tariffModal__alert').addClass('hidden');
  }

});

$('.tariffModal__newNumber .checkbox input').on('click', function() {
  var newPhone = $(this).next().html();

  if ( $('.tariffModal--family').hasClass('in') ) {
    maxNumbers = planUsers;
  } else if ( $('.tariffModal--business').hasClass('in') ) {
    maxNumbers = Number.POSITIVE_INFINITY;
  }

  if (this.checked) {
    phoneNumberID++;

    if ( $('.tariffModal__finalAddedNumber').length < maxNumbers ) {
      $('.tariffModal__finalAddedNumbers').prepend('<div id="phone'+ phoneNumberID +'" class="tariffModal__finalAddedNumber">'+ newPhone +'</div>');
      if ( !$('.tariffModal--family').hasClass('in') ) {
        tariffAddPhoneNumberPrice();
      }
      $('.tariffModal__infoHeading span').html( $('.tariffModal__finalAddedNumber').length );
      $(this).attr('data-phoneid', 'phone'+phoneNumberID);
      $('.tariffModal__infoText').slideUp(300);
      $('.tariffModal__infoHeading').removeClass('hide');
      $('.tariffModal__alert').addClass('hidden');
      if ( !$('.tariffModal--family').hasClass('in') || $('.tariffModal__finalAddedNumber').length == maxNumbers ) {
        $('.tariffModal__continue').removeAttr('disabled');
      }
      $('.tariffModal__price').fadeIn(300);
      $('.tariffModal--family .tariffModal__finalAddedNumbers span:last-child').remove();
    } else {
      $('.tariffModal__alert').removeClass('hidden');
      $('.modal').animate({
        scrollTop: 0
      }, 500);
      return false;
    }
  } else {
    if ( $('.tariffModal__finalAddedNumber').length !== 0 && !$('.tariffModal--family').hasClass('in') ) {
      tariffSubstractPhoneNumberPrice();
    }
    dataPhoneID = $(this).attr('data-phoneid');
    $('.tariffModal__finalAddedNumbers').find('#'+ dataPhoneID).remove();
    $('.tariffModal__infoHeading span').html( $('.tariffModal__finalAddedNumber').length );
    $('.tariffModal--family .tariffModal__finalAddedNumbers').append('<span>&nbsp;</span>');
    if ( $('.tariffModal__finalAddedNumber').length === 0 || $('.tariffModal--family').hasClass('in') && $('.tariffModal__finalAddedNumber').length < maxNumbers ) {
      $('.tariffModal__infoText').slideDown(300);
      $('.tariffModal__infoHeading').addClass('hide');
      $('.tariffModal__continue').attr('disabled', 'disabled');
      if ( !$('.tariffModal--family').hasClass('in') ) {
        $('.tariffModal__price').hide();
      }
    }
  }

  $('.tariffModal__newNumber .tariffModal__sectionTitle').addClass('active');
  if ( $('.tariffModal__newNumber .checkbox input:checked').length === 0 ) {
    $('.tariffModal__newNumber .tariffModal__sectionTitle').removeClass('active');
  }

  if ( $('.tariffModal__finalAddedNumber').length < maxNumbers ) {
    $('.tariffModal__alert').addClass('hidden');
  }

});

var substringMatcher = function(strs) {
  return function findMatches(q, cb) {
    var matches, substringRegex;
    // an array that will be populated with substring matches
    matches = [];
    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, 'i');
    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, obj){
      if (substrRegex.test(obj.name)) {
        matches.push(obj);
      }
    });
    cb(matches);
  };
};

// Search
$('a[data-target="#search"][data-toggle="collapse"]').on('touchstart', function (event) {
  var search = $('#search');
  var input = $('#search input[type="text"], #search input[type="search"]');

  // On iPhone only in touch events we can focus input, show search + input immediatelly
  search.collapse('toggle');
  input.focus();

  event.preventDefault();
});

$('#search').on('shown.bs.collapse', function () {
  var input = $('#search input[type="text"], #search input[type="search"]');

  // For desktop
  input.focus();

  $(document).on('click.search', function (event) {
    if (!$(event.target).closest('#search').length) {
      $('#search').collapse('hide');
    }
  });

  input.on('keydown.search', function (event) {
    if (event.which === 27) { // ESC
      $('#search').collapse('hide');
    }
  });
});

$('#search').on('hide.bs.collapse', function () {
  var input = $('#search input[type="text"], #search input[type="search"]');

  $(document).off('click.search');
  input.off('keydown.search');
});

// var match = ['worm', 'confrontation', 'mail', 'feedback', 'deadly', 'throw', 'grounds', 'concentration', 'issue', 'displace', 'queue', 'begin', 'office', 'reflection', 'bush', 'sleeve', 'plead', 'passion', 'deposit', 'franchise', '123 456 789', '256 879 445', '987 654 321', '185 295 365', '467 164 926', '842 733 744'
// ];

// Data structure with fake data for categories search demo
var match = [
  {name: 'Ko darīt, ja telefonam ir nepieciešams remonts?rerserherherhrhsrtjsrtjstjstrj', categ: 'Kā kļūt par Bites klientu?'},
  {name: 'Ko darīt, ja esi aizmirsis PIN un/vai PUK kodu?', categ: 'Kā kļūt par Bites klientu?'},
  {name: 'Ko darīt gadījumā, ja neizdodas nosūtīt SMS?', categ: 'Kā kļūt par Bites klientu?'},
  {name: 'Ko darīt, ja ir pazudis vai nozagts telefons?', categ: 'Kā kļūt par Bites klientu?'},
  {name: 'Ko darīt, ja ir nepieciešama jauna SIM karte?', categ: 'Kā kļūt par Bites klientu?'}
];

$('#searchAccNum').typeahead({
  source: substringMatcher(match),
  fitToElement: true,
  afterSelect: function() {
    $('#tariffModal__currentNumberSlider').lightSlider({
        item: 1,
        autoWidth: false,
        slideMove: 1,
        slideMargin: 0,
        speed: 400,
        easing: 'cubic-bezier(0.25, 0, 0.25, 1)',
        auto: false,
        loop: false,
        pager: false
    }).fadeIn(300);
    $('#tariffModal__currentNumberSlider input:checkbox').trigger('click');
  }
});

// Get the search dropdown menu item template
var search_dropdown_template = function (item) {
  return `
      <p class="search-dropdown--item-name">` + item.name + '</p>' +
        `<p class="search-dropdown--item-categ">
          Categories <img src="images/path-2.svg">` + item.categ +
        `</p>
    `;
}

$('#searchFAQ').typeahead({
  source: substringMatcher(match),
  minLength: 2,
  displayText: function (item) {
    return search_dropdown_template(item);
  },
  afterSelect: function(item) {
    $('#searchFAQ').val(item.name).change();
  }
});

$('.tariffModal__searchAccNum').keyup(function(e) {
  if ( !this.value ) {
    $('.tariffModal__currentPlan .tariffModal__sectionTitle').removeClass('active');
    $('#tariffModal__currentNumberSlider input:checkbox').trigger('click');
  } else {
    $('.tariffModal__currentPlan .tariffModal__sectionTitle').addClass('active');
  }
});

$('.tariffModal__newNumberBulkAdd').on('click', function(e) {
  var bulk = $('.tariffModal__newNumberBulk input[type="number"]').val();
  $('.tariffModal__newNumberSlider .checkbox--phone').slice( $('.tariffModal__newNumberSlider .checkbox--phone input:checkbox:checked').length, bulk).find('input:checkbox').trigger('click');
  e.preventDefault();
});

$('.shoppingCart__useCouponButton').on('click', function(e) {
  $('.shoppingCart__discountCodeForm').fadeOut(300);
  $('.shoppingCart__discountCodeMessage').delay(300).fadeIn(300);
  $('.shoppingCart__totalInfoText--discount').html('Discount 10%');
  $('.shoppingCart__totalPrice--discount').html('-91.70 €');
  $('.shoppingCart__table--lease tr:first-child').find('.shoppingCart__tablePriceColumn').html('<p><span>'+ productPricePerMonth +' €</span>/men.</p><p><del>'+ productPriceOldPerMonth +' €/men.</del></p>');
  $('.shoppingCart__table--lease tr:first-child').find('.shoppingCart__tablePriceTotalColumn').html('<p><span>'+ productPricePerMonth +' €</span>/men.</p><p><del>'+ productPriceOldPerMonth +' €/men.</del></p>');
  e.preventDefault();
});

$('.shoppingCart__useCouponAgain').on('click', function(e) {
  $('.shoppingCart__discountCodeForm').delay(300).fadeIn(300);
  $('.shoppingCart__discountCodeMessage').fadeOut(300);
  e.preventDefault();
});

var productPrice = "779.00";
var productPricePerMonth = "14.00";
var productPriceOldPerMonth = "11.50";
var productPeriod = "36 mth.";
var productPriceUpfront = "600.00";

$('.shoppingCart__table--lease').on('click', '.shoppingCart__moveDownProduct', function(e) {
  $('.shoppingCart__paynow').slideDown(300);
  $(this).removeClass('shoppingCart__moveDownProduct').addClass('shoppingCart__moveUpProduct');
  $(this).closest('tr').find('.shoppingCart__tablePriceColumn').html('<p>'+ productPrice +' €</p>');
  $(this).closest('tr').find('.shoppingCart__tablePriceTotalColumn').html('<p>'+ productPrice +' €</p>');
  $(this).closest('tr').find('.shoppingCart__tablePeriodColumn, .shoppingCart__tableUpfrontColumn').remove();
  $(this).closest('tr').animateTo('appendTo', '.shoppingCart__table--paynow tbody', 0, 'ease-in-out');
  if ( $('.shoppingCart__table--lease tbody tr').length === 0 ) {
    $('.shoppingCart__lease').slideUp(300);
  }
  e.preventDefault();
});

$('.shoppingCart__table--paynow').on('click', '.shoppingCart__moveUpProduct', function(e) {
  $('.shoppingCart__lease').slideDown(300);
  setTimeout(function() {
    $('.recommendedSlider').css({
    'top': creditLimitHeight + 30
  });
  }, 10);
  $(this).removeClass('shoppingCart__moveUpProduct').addClass('shoppingCart__moveDownProduct');
  $(this).closest('tr').find('.shoppingCart__tablePriceColumn').html('<p>'+ productPricePerMonth +' €/men.</p>');
  $(this).closest('tr').find('.shoppingCart__tablePriceTotalColumn').html('<p>'+ productPricePerMonth +' €/men.</p>').after('<td class="shoppingCart__tableUpfrontColumn">'+ productPriceUpfront +' €</td>');
  $(this).closest('tr').find('.shoppingCart__tableQuantityColumn').after('<td class="shoppingCart__tablePeriodColumn">'+ productPeriod +'</td>');
  $(this).closest('tr').animateTo('appendTo', '.shoppingCart__table--lease tbody', 0, 'ease-in-out');
  if ( $('.shoppingCart__table--paynow tbody tr').length === 0 ) {
    $('.shoppingCart__paynow').slideUp(300);
  }
  e.preventDefault();
});


var initial;

function removeProductFromShoppingCart(that) {
  $this = that;
  initial = window.setTimeout(
  function() {
    if ( $this.closest('table').find('tbody tr').length == 2 ) {
      if ( $this.closest('table').hasClass('shoppingCart__table--lease') ) {
         $('.recommendedSlider').css({
          'top': 0
        });
      }
      $this.closest('table').parent().slideUp(300);
      $('.shoppingCart__tableUndoRow').remove();
      $this.closest('tr').remove();
    } else {
      $('html, body').animate({
        scrollTop: $this.closest('.shoppingCart__table').offset().top - 150
      }, 500);
      $('.shoppingCart__tableUndoRow').remove();
      if ( $this.closest('.shoppingCart__table--subscribe').length > 0 ) {
        $this.closest('table').parent().slideUp(300);
        $this.closest('table').find('tbody tr').remove();
        $('.shoppingCart__tableUndoRow').remove();
      } else {
        $this.closest('tr').remove();
      }
    }
    stickCreditLimit();
  }, 3000);
}

$('.shoppingCart__removeProduct').on('click', function(e) {
  $this = $(this);
  $(this).closest('tr').after('<tr class="shoppingCart__tableUndoRow"><td align="right" colspan="8"><p>Bring back the deleted item!</p><a class="btn btn-default btn-sm shoppingCart__undoRemoveProduct" href="#" role="button">Undo</a></td></tr>');
  if ( $(window).width() > 767 ) {
    $('.shoppingCart__tableUndoRow').height( $(this).closest('tr').height() );
  }
  $(this).closest('tr').hide();

  removeProductFromShoppingCart( $(this) );

  e.preventDefault();
});

$('.shoppingCart__table').on('click', '.shoppingCart__undoRemoveProduct', function(e) {
  clearTimeout(initial);
  $(this).closest('tr').prev().show();
  $(this).closest('tr').remove();
  e.preventDefault();
});

$('input[name="personal-details"]').click(function () {
  $(this).tab('show');
});

$('.personal-or-business').on('click', function() {
  var personalText = $(this).closest('.panel-payment').find('.panel-title a').attr('data-personal');
  var businessText = $(this).closest('.panel-payment').find('.panel-title a').attr('data-business');
  if ( $(this).hasClass('personal') ) {
    $(this).closest('.panel-payment').find('.panel-title a').html(personalText);
  } else {
    $(this).closest('.panel-payment').find('.panel-title a').html(businessText);
  }
  $(this).tab('show');
  $("<a>").data("target", $(this).data("second-tab")).tab("show");
});

$('.panel-heading a').on('click', function(e) {
  if ( $(this).hasClass('no-collapse') ) {
    e.stopPropagation();
    e.preventDefault();
  }
});

$('.panel-payment').on('click', '.shoppingCart__btnConfirm', function(e) {
  if ( !$(this).attr('disabled') ) {
    $(this).closest('.panel-payment').addClass('finished');
    $(this).closest('.panel-payment').next().prev().removeClass('active');
    if ( !$(this).closest('.panel-payment').next().hasClass('finished') ) {
      $(this).closest('.panel-payment').next().addClass('active');
    }
    $(this).closest('.panel-payment').next().find('.no-collapse').removeClass('no-collapse');
    $(this).closest('.panel-payment').next().find('.collapse').collapse('show');
    $('html, body').animate({
      scrollTop: $(this).closest('.panel-payment').offset().top
    }, 500);
  }
  e.preventDefault();
});

$('#payment-and-delivery').on('show.bs.collapse',function() {
  $('#payment-and-delivery .in').collapse('hide');
});


//$('.panel-collapse').collapse('show');


$('.shoppingCart__cardSelect').on('change', function() {
  var cardName = $(this).val();
  $('.shoppingCart__cardImage').html('<img src="images/'+ cardName.toLowerCase() +'.png" alt="'+ cardName +'" class="img-responsive">').hide().fadeIn(500);
});

$('.checkbox--terms-and-conditions input').on('click', function() {
  this.checked ? $('.shoppingCart__btnConfirm--terms').removeAttr('disabled') : $('.shoppingCart__btnConfirm--terms').attr('disabled', 'disabled');
});

$('.leasingModal__continue--step1').on('click', function(e) {
  $('.leasingModal__step--1').hide();
  $('.leasingModal__step--loading').show();
  setTimeout(function() {
    if ( $('.leasingModal__step--loading').hasClass('leasingModal__step--no-answer') ) {
      $('.leasingModal').modal('hide');
      $('.leasingModal__preLeasing').hide();
      $('.leasingModal__postLeasing-no-answer').removeClass('hide');
    } else {
      $('.leasingModal__step--loading').hide();
      $('.leasingModal__step--2').show();
    }
  }, 3000);
  e.preventDefault();
});

$('.leasingModal__bigger-credit-limit').on('click', function(e) {
  $('.leasingModal .modal-footer').slideToggle(300);
  $('.leasingModal').animate({
      scrollTop: $('.leasingModal__bigger-credit-limit').offset().top
  }, 500);
  e.preventDefault();
});

$('input[type="file"]').change(function () {
  if ( $(this).val() ) {
    error = false;
    var filename = $(this).val();
    filename = filename.substring(filename.lastIndexOf("\\") + 1, filename.length);
    $(this).closest('.file-upload').find('.file-name').html(filename);
    $(this).closest('.file-upload').find('label').addClass('btn--check');
    if (error) {
      parent.addClass('error').prepend.after('<div><span class="label label-danger">' + error + '</span></div>');
    }
  }
});

$('.leasingModal__continue-checkout').on('click', function(e) {
  $('.leasingModal__preLeasing').hide();
  $('.leasingModal__postLeasing').removeClass('hide');
  e.preventDefault();
});


var initialFeePrice = $('.shoppingCart__initialFeeBasePrice').html();

//Leasing initial fee slider
$('.shoppingCart__initialFeeSlider .rangeSlider').slider({
  range: "min",
  min: 0,
  max: 100,
  step: 1,
  value: 100,
  slide: function (e, ui) {
    $('.shoppingCart__initialFeeSlider .percent span').html(ui.value);
    var initialFeePercent = ui.value;
    var calcPrice = ( initialFeePrice * initialFeePercent / 100 );
    number = calcPrice.toFixed(2).toString().split(".")[0];
    decimals = calcPrice.toFixed(2).toString().split(".")[1];
    $('.shoppingCart__initialFeePrice').html( "<span>" + number + "." + "<sup>" + decimals + " €</sup></span>" );
  }
});

$('.shoppingCart__initialFeeSlider .percent span').html( $(".shoppingCart__initialFeeSlider .rangeSlider").slider("value") );

$('.nav-tabs--bank-select li a').on('click', function(e) {
  $(this).closest('.panel-payment').find('.panel-title__payment-type').html( $(this).html() );
  $('.selectOption--bank input').prop('checked', false);
  $(this).closest('.panel-payment').find('.panel-title__payment-option').html('');
  $('#card_number').val('').parent().removeClass('input--filled');
  e.preventDefault();
});

$('.selectOption--bank input').on('click', function() {
  var bankName = $(this).parent().find('div').html();
  if (this.checked) {
    $(this).closest('.panel-payment').find('.panel-title__payment-option').html(': ' + bankName);
  }
});

$('#card_number').keyup(function(e) {
  $(this).closest('.panel-payment').find('.panel-title__payment-option').html(': ' + $(this).val() );
});

$('.addRouters__router').on('click', function(e) {
  if ( !$(this).parent().hasClass('addRouters--addons') ) {
    $('.addRouters__router').removeClass('selected');
  }
  $(this).toggleClass('selected');
  e.preventDefault();
});

$('#show-open-stores').on('click', function() {
  var storeItem = $('.storeList .storeItem__wrap.storeItem--closed');
  this.checked ? storeItem.hide() : storeItem.show();
});

// Custom select2
if ($('.custom__select').length) {
  $('.custom__select').select2({
    minimumResultsForSearch: Infinity,
  });
}

var data1 = [
  { id: 0, text: 'Rīga' },
  { id: 1, text: 'Rīga 2' },
  { id: 2, text: 'Rīga 3' }
];

$('.custom__select[data-id="1"]').select2({
  data: data1,
  width: 'auto',
  escapeMarkup: function (markup) { return markup; }
});

var addresses = [
  { id: 0, text: 'Address 1' },
  { id: 1, text: 'Address 2' },
  { id: 2, text: 'Address 3' },
  { id: 3, text: 'Address 4' },
  { id: 4, text: 'Address 5' },
  { id: 5, text: 'Address 6' },
  { id: 6, text: 'Address 7' },
  { id: 7, text: 'Address 8' },
  { id: 8, text: 'Address 9' },
  { id: 9, text: 'Address 10' }
];

var selectSingle = $('.custom__select[data-id="address"]').select2({
  data: addresses,
  allowClear: true,
  width: 'auto',
  placeholder: "Type in your street or village",
  dropdownCssClass: 'custom__select--address-dropdown',
  //multiple: true,
  //maximumSelectionLength: 1,
  escapeMarkup: function (markup) { return markup; }
});

selectSingle.one('select2:open', function() {
  $('.custom__select--address-dropdown .select2-results').prepend('<button class="manualAddress-btn">Enter address manually</button>');
  $('.manualAddress-btn').on('click', function() {
    selectSingle.select2('close');
    $('.addressSelect-auto').slideToggle(200);
    $('.addressSelect-manual').slideToggle(200);
  });
});

$('.switchAddressSelect').on('click', function(e) {
  $('.addressSelect-auto').slideToggle(200);
  $('.addressSelect-manual').slideToggle(200);
  e.preventDefault();
});

// selectSingle.one('select2:opening', function(e) {
//   e.preventDefault();
// });

function removeProductFromWishlist(that) {
  $this = that;
  initial = window.setTimeout(
  function() {
    $this.closest('.wishlist__item').slideUp(300);
    setTimeout(function() {
      $this.closest('.wishlist__item').remove();
    }, 300);
    $('body').stop().animate({scrollTop: 0}, '500', 'swing');
    if ( $this.closest('.wishlist__item-list').find('.wishlist__item').length === 1 ) {
      $('.wishlist_empty-title').removeClass('hide');
      $('.btn--update-wishlist').hide();
    }
  }, 3000);
}

$('.wishlist__item-remove').on('click', function(e) {
  $this = $(this);
  $(this).parent('.wishlist__item').prepend('<div class="wishlist__item-undo-wrap"><div class="wishlist__item-undorow"><p>Bring back the deleted item!</p><a class="btn btn-default btn-sm wishlist__item-undo" href="#" role="button">Undo</a></div></div>');
  removeProductFromWishlist( $(this) );
  e.preventDefault();
});

$('.wishlist__item').on('click', '.wishlist__item-undo', function(e) {
  clearTimeout(initial);
  $this = $(this);
  $(this).closest('.wishlist__item-undo-wrap').fadeOut(200);
  setTimeout(function() {
    $this.closest('.wishlist__item-undo-wrap').remove();
  }, 300);
  e.preventDefault();
});

// Password strength check
$('input[type="password"]').keyup(function() {
  var el = $(this),
      password = $(this).val(),
      weak = el.parent().find('.password__strength').data("weak"),
      strong = el.parent().find('.password__strength').data("strong");
  if (password) {
    el.parent().find('.password__strength').addClass('open');
    if (password.length > 7 && password.match(/([0-9])/)) {
      el.parent().find('.password__strength').addClass('password__strength--strong').text(strong);
    } else {
      el.parent().find('.password__strength').removeClass('password__strength--strong').text(weak);
    }
  } else {
    el.parent().find('.password__strength').removeClass('open');
  }
});

// Password match check
$('input[type="password"].input-password-confirm').keyup(function() {
  var el = $(this),
      password = $(this).val(),
      nomatch = el.parent().find('.password__strength').data("nomatch"),
      match = el.parent().find('.password__strength').data("match");
  if (password) {
    el.parent().find('.password__strength').addClass('open');
    if ( password == $(this).parent().prev().find('input[type="password"]').val() ) {
      el.parent().find('.password__strength').addClass('password__strength--strong').text(match);
    } else {
      el.parent().find('.password__strength').removeClass('password__strength--strong').text(nomatch);
    }
  } else {
    el.parent().find('.password__strength').removeClass('open');
  }
});

function moveColumn(table, from, to) {
  var cols;
  $('tr', table).each(function () {
    cols = $(this).children('th, td');
    cols.eq(from).detach().insertBefore(cols.eq(to));
  });
}

$('.compare-table__product-remove').on('click', function(e) {
  var index = $(this).closest('th').index() + 1;
  if ( $(window).width() > 767 ) {
    $('.compare-table td:nth-child('+index+'),th:nth-child('+index+')').empty();
    $('.compare-table thead th:nth-child('+index+')').addClass('compare-table__product-empty');
    if ( index == 2 ) {
      moveColumn( $('.compare-table'), 2, 1 );
      moveColumn( $('.compare-table'), 3, 2 );
      moveColumn( $('.compare-table'), 4, 3 );
    } else if ( index == 3 ) {
      moveColumn( $('.compare-table'), 3, 2 );
      moveColumn( $('.compare-table'), 4, 3 );
    } else if ( index == 4 ) {
      moveColumn( $('.compare-table'), 4, 3 );
    }
    if ( $('.compare-table--compareBar th:empty').length == 5 ) {
      $('.compareBar--inner-page').slideUp(300);
    }
  } else {
    if ( $('.compare-table--compareBar th').length == 3 ) {
      $('.compare-table__arrows').fadeOut(200);
    }
    if ( $('.compare-table--compareBar th').length == 2 ) {
      $('.compare-table td:nth-child('+index+'),th:nth-child('+index+')').empty();
      $('.compare-table thead th:nth-child('+index+')').addClass('compare-table__product-empty');
    } else {
      $('.compare-table td:nth-child('+index+'),th:nth-child('+index+')').remove();
    }
  }
  e.preventDefault();
});

$('.compare-table').tableHeadFixer({
  'z-index': 100,
  'head': false,
  'left': 1
});

$('.compare-table__move-right').on('click', function(e) {
  $('.compare-table__wrap').animate({
    scrollLeft: "+=230px"
  }, 300);
  e.preventDefault();
});

$('.compare-table__move-left').on('click', function(e) {
  $('.compare-table__wrap').animate({
    scrollLeft: "-=230px"
  }, 300);
  e.preventDefault();
});

$('.compare-table__wrap').on('scroll', function(e) {
  if ( $(this).scrollLeft() + $(this).innerWidth() >= $(this)[0].scrollWidth ) {
    $('.compare-table__move-right').fadeOut(200);
    $('.compare-table__move-left').fadeIn(200);
  } else if ($(this).scrollLeft() === 0) {
    $('.compare-table__move-left').fadeOut(200);
    $('.compare-table__move-right').fadeIn(200);
  } else {
    $('.compare-table__move-left').fadeIn(200);
    $('.compare-table__move-right').fadeIn(200);
  }
  $('.compare-table__wrap--compareBar').scrollLeft( $(this).scrollLeft() );
});

if ( $('.compare-table__arrows').length && $(window).width() < 992 ) {

  var compareTableArrows = new Waypoint({
    element: $('.compare-table:not(.compare-table--compareBar) thead'),
    handler: function(direction) {
      if ( direction == 'down') {
        if ( $('.compare-table--compareBar th').length > 2 ) {
          $('.compare-table__arrows').fadeIn(200);
        }
      } else {
        $('.compare-table__arrows').fadeOut(200);
      }
    }
  });

}

if ( $('.compareBar--inner-page').length ) {

  if ( $(window).width() > 767 ) {
    var compareBarWaypoint = new Waypoint({
      element: $('.compare-table:not(.compare-table--compareBar) thead'),
      handler: function(direction) {
        if ( direction == 'down') {
          $('.compareBar--inner-page').fadeIn(200).css('top', '60px');
        } else {
          $('.compareBar--inner-page').css('top', '-120px').fadeOut(200);
        }
      },
      offset: '-20%'
    });
  } else {
    var continuousElements = $('.compare-table:not(.compare-table--compareBar) td');
    for (var i = 0; i < continuousElements.length; i++) {
      new Waypoint.Inview({
        element: continuousElements[i],
        enter: function(direction) {
          if ( direction == 'up') {
            $('.compareBar--inner-page').fadeIn(200).css('top', '60px');
          }
        },
        exit: function(direction) {
          if ( direction == 'down') {
            $('.compareBar--inner-page').css('top', '-120px').fadeOut(200);
          }
        }
      });
    }
    var compareBarWaypoint2 = new Waypoint({
      element: $('.compare-table:not(.compare-table--compareBar) thead'),
      handler: function(direction) {
        if ( direction == 'up') {
          $('.compareBar--inner-page').css('top', '-120px').fadeOut(200);
        }
      },
      offset: 0
    });
  }

}

var timelineBorders = [];

function drawTimelineBorder() {

  var borderDefault = document.getElementsByClassName("timeline-border");
  for (var i = borderDefault.length - 1; i >= 0; i--) {
    var timelineBorder = new Vivus(borderDefault[i], {
      duration: 60,
      start: 'autostart',
      type: 'sync',
      animTimingFunction: Vivus.EASE_OUT,
      file: 'images/timeline-border.svg',
      onReady: function (myVivus) {
        myVivus.el.setAttribute('height', '210px');
      }
    });
    timelineBorders.push(timelineBorder);
  }

}

var timelineHoverBorders = [];

function drawTimelineBorderHover() {
  var borderHover = document.getElementsByClassName("timeline-border--hover");
  for (var i = borderHover.length - 1; i >= 0; i--) {
    var timelineBorderHover = new Vivus(borderHover[i], {
      duration: 60,
      start: 'autostart',
      type: 'sync',
      animTimingFunction: Vivus.EASE_OUT,
      file: 'images/timeline-border--hover.svg',
      onReady: function (myVivus) {
        myVivus.el.setAttribute('height', '210px');
      }
    });
    timelineHoverBorders.push(timelineBorderHover);
  }
}

if ( $('.horizontal-timeline').length ) {
  drawTimelineBorder();
  drawTimelineBorderHover();
}

$('.horizontal-timeline .events a').on('mouseenter', function() {
  $.each(timelineHoverBorders, function(k, timelineBorderHover){
    timelineBorderHover.reset().play();
  });
});

$('.horizontal-timeline .events a').on('mouseleave', function() {
  $.each(timelineHoverBorders, function(k, timelineBorderHover){
    timelineBorderHover.play(-1);
  });
});

var timelines = $('.horizontal-timeline'),
  eventsMinDistance = 200;

(timelines.length > 0) && initTimeline(timelines);

function initTimeline(timelines) {
  timelines.each(function () {
    var timeline = $(this),
      timelineComponents = {};
    //cache timeline components

    timelineComponents['timelineWrapper'] = timeline.find('.events-wrapper');
    timelineComponents['eventsWrapper'] = timelineComponents['timelineWrapper'].children('.events');
    timelineComponents['fillingLine'] = timelineComponents['eventsWrapper'].children('.filling-line');
    timelineComponents['timelineEvents'] = timelineComponents['eventsWrapper'].find('a');
    timelineComponents['timelineDates'] = parseDate(timelineComponents['timelineEvents']);
    timelineComponents['eventsMinLapse'] = minLapse(timelineComponents['timelineDates']);
    timelineComponents['timelineNavigation'] = timeline.find('.timeline-navigation');
    timelineComponents['eventsContent'] = timeline.children('.events-content');

    //assign a left postion to the single events along the timeline
    setDatePosition(timelineComponents, eventsMinDistance);
    //assign a width to the timeline
    var timelineTotWidth = setTimelineWidth(timelineComponents, eventsMinDistance);
    //the timeline has been initialize - show it
    timeline.addClass('loaded');

    //detect click on the next arrow
    timelineComponents['timelineNavigation'].on('click', '.next', function (event) {
      event.preventDefault();
      updateSlide(timelineComponents, timelineTotWidth, 'next');
    });
    //detect click on the prev arrow
    timelineComponents['timelineNavigation'].on('click', '.prev', function (event) {
      event.preventDefault();
      updateSlide(timelineComponents, timelineTotWidth, 'prev');
    });
    //detect click on the a single event - show new event content
    timelineComponents['eventsWrapper'].on('click', 'a', function (event) {
      event.preventDefault();
      timelineComponents['timelineEvents'].removeClass('selected');
      $(this).addClass('selected');
      updateOlderEvents($(this));
      updateFilling($(this), timelineComponents['fillingLine'], timelineTotWidth);
      updateVisibleContent($(this), timelineComponents['eventsContent']);
      $.each(timelineBorders, function(k, timelineBorder){
        timelineBorder.reset().play();
      });
    });

    $('.events-wrapper').swipe( {
      swipeLeft:function() {
        updateSlide(timelineComponents, timelineTotWidth, 'next');
      },
      swipeRight:function() {
        updateSlide(timelineComponents, timelineTotWidth, 'prev');
      }
    });

    //on swipe, show next/prev event content
    timelineComponents['eventsContent'].on('swipeleft', function () {
      var mq = checkMQ();
      (mq == 'mobile') && showNewContent(timelineComponents, timelineTotWidth, 'next');
    });
    timelineComponents['eventsContent'].on('swiperight', function () {
      var mq = checkMQ();
      (mq == 'mobile') && showNewContent(timelineComponents, timelineTotWidth, 'prev');
    });

    //keyboard navigation
    $(document).keyup(function (event) {
      if (event.which == '37' && elementInViewport(timeline.get(0))) {
        showNewContent(timelineComponents, timelineTotWidth, 'prev');
      } else if (event.which == '39' && elementInViewport(timeline.get(0))) {
        showNewContent(timelineComponents, timelineTotWidth, 'next');
      }
      $.each(timelineBorders, function(k, timelineBorder){
        timelineBorder.reset().play();
      });
    });
  });
}

function updateSlide(timelineComponents, timelineTotWidth, string) {
  //retrieve translateX value of timelineComponents['eventsWrapper']
  var translateValue = getTranslateValue(timelineComponents['eventsWrapper']),
    wrapperWidth = Number(timelineComponents['timelineWrapper'].css('width').replace('px', ''));
  //translate the timeline to the left('next')/right('prev')
  (string == 'next') ?
    translateTimeline(timelineComponents, translateValue - wrapperWidth + eventsMinDistance, wrapperWidth - timelineTotWidth) : translateTimeline(timelineComponents, translateValue + wrapperWidth - eventsMinDistance);
}

function showNewContent(timelineComponents, timelineTotWidth, string) {
  //go from one event to the next/previous one
  var visibleContent = timelineComponents['eventsContent'].find('.selected'),
    newContent = (string == 'next') ? visibleContent.next() : visibleContent.prev();

  if (newContent.length > 0) { //if there's a next/prev event - show it
    var selectedDate = timelineComponents['eventsWrapper'].find('.selected'),
      newEvent = (string == 'next') ? selectedDate.parent('li').next('li').children('a') : selectedDate.parent('li').prev('li').children('a');

    updateFilling(newEvent, timelineComponents['fillingLine'], timelineTotWidth);
    updateVisibleContent(newEvent, timelineComponents['eventsContent']);
    newEvent.addClass('selected');
    selectedDate.removeClass('selected');
    updateOlderEvents(newEvent);
    updateTimelinePosition(string, newEvent, timelineComponents);
  }
}

function updateTimelinePosition(string, event, timelineComponents) {
  //translate timeline to the left/right according to the position of the selected event
  var eventStyle = window.getComputedStyle(event.get(0), null),
    eventLeft = Number(eventStyle.getPropertyValue("left").replace('px', '')),
    timelineWidth = Number(timelineComponents['timelineWrapper'].css('width').replace('px', '')),
    timelineTotWidth = Number(timelineComponents['eventsWrapper'].css('width').replace('px', ''));
  var timelineTranslate = getTranslateValue(timelineComponents['eventsWrapper']);

  if ((string == 'next' && eventLeft > timelineWidth - timelineTranslate) || (string == 'prev' && eventLeft < -timelineTranslate)) {
    translateTimeline(timelineComponents, -eventLeft + timelineWidth / 2, timelineWidth - timelineTotWidth);
  }
}

function translateTimeline(timelineComponents, value, totWidth) {
  var eventsWrapper = timelineComponents['eventsWrapper'].get(0);
  value = (value > 0) ? 0 : value; //only negative translate value
  value = (!(typeof totWidth === 'undefined') && value < totWidth) ? totWidth : value; //do not translate more than timeline width
  setTransformValue(eventsWrapper, 'translateX', value + 'px');
  //update navigation arrows visibility
  (value === 0) ? timelineComponents['timelineNavigation'].find('.prev').addClass('inactive') : timelineComponents['timelineNavigation'].find('.prev').removeClass('inactive');
  (value == totWidth) ? timelineComponents['timelineNavigation'].find('.next').addClass('inactive') : timelineComponents['timelineNavigation'].find('.next').removeClass('inactive');
}

function updateFilling(selectedEvent, filling, totWidth) {
  //change .filling-line length according to the selected event
  var eventStyle = window.getComputedStyle(selectedEvent.get(0), null),
    eventLeft = eventStyle.getPropertyValue("left"),
    eventWidth = eventStyle.getPropertyValue("width");
  eventLeft = Number(eventLeft.replace('px', '')) + Number(eventWidth.replace('px', '')) / 2;
  var scaleValue = eventLeft / totWidth;
  setTransformValue(filling.get(0), 'scaleX', scaleValue);
}

function setDatePosition(timelineComponents, min) {
  for (i = 0; i < timelineComponents['timelineDates'].length; i++) {
    var distance = daydiff(timelineComponents['timelineDates'][0], timelineComponents['timelineDates'][i]),
      distanceNorm = Math.round(distance / timelineComponents['eventsMinLapse']) + 2;
    timelineComponents['timelineEvents'].eq(i).css('left', distanceNorm * min - 220 + 'px');
  }
}

function setTimelineWidth(timelineComponents, width) {
  var timeSpan = daydiff(timelineComponents['timelineDates'][0], timelineComponents['timelineDates'][timelineComponents['timelineDates'].length - 1]),
    timeSpanNorm = timeSpan / timelineComponents['eventsMinLapse'],
    timeSpanNorm = Math.round(timeSpanNorm) + 4,
    totalWidth = timeSpanNorm * width;
  timelineComponents['eventsWrapper'].css('width', totalWidth + 'px');
  updateFilling(timelineComponents['eventsWrapper'].find('a.selected'), timelineComponents['fillingLine'], totalWidth);
  updateTimelinePosition('next', timelineComponents['eventsWrapper'].find('a.selected'), timelineComponents);

  return totalWidth;
}

function updateVisibleContent(event, eventsContent) {
  var eventDate = event.data('date'),
    visibleContent = eventsContent.find('.selected'),
    selectedContent = eventsContent.find('[data-date="' + eventDate + '"]'),
    selectedContentHeight = selectedContent.height();

  if (selectedContent.index() > visibleContent.index()) {
    var classEnetering = 'selected enter-right',
      classLeaving = 'leave-left';
  } else {
    var classEnetering = 'selected enter-left',
      classLeaving = 'leave-right';
  }

  selectedContent.attr('class', classEnetering);
  visibleContent.attr('class', classLeaving).one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function () {
    visibleContent.removeClass('leave-right leave-left');
    selectedContent.removeClass('enter-left enter-right');
  });
  eventsContent.css('height', selectedContentHeight + 'px');
}

function updateOlderEvents(event) {
  event.parent('li').prevAll('li').children('a').addClass('older-event').end().end().nextAll('li').children('a').removeClass('older-event');
}

function getTranslateValue(timeline) {
  var timelineStyle = window.getComputedStyle(timeline.get(0), null),
    timelineTranslate = timelineStyle.getPropertyValue("-webkit-transform") ||
      timelineStyle.getPropertyValue("-moz-transform") ||
      timelineStyle.getPropertyValue("-ms-transform") ||
      timelineStyle.getPropertyValue("-o-transform") ||
      timelineStyle.getPropertyValue("transform");

  if (timelineTranslate.indexOf('(') >= 0) {
    var timelineTranslate = timelineTranslate.split('(')[1];
    timelineTranslate = timelineTranslate.split(')')[0];
    timelineTranslate = timelineTranslate.split(',');
    var translateValue = timelineTranslate[4];
  } else {
    var translateValue = 0;
  }

  return Number(translateValue);
}

function setTransformValue(element, property, value) {
  element.style["-webkit-transform"] = property + "(" + value + ")";
  element.style["-moz-transform"] = property + "(" + value + ")";
  element.style["-ms-transform"] = property + "(" + value + ")";
  element.style["-o-transform"] = property + "(" + value + ")";
  element.style["transform"] = property + "(" + value + ")";
}

function parseDate(events) {
  var dateArrays = [];
  events.each(function () {
    var singleDate = $(this),
      dateComp = singleDate.data('date').split('T');
    if (dateComp.length > 1) { //both DD/MM/YEAR and time are provided
      var dayComp = dateComp[0].split('/'),
        timeComp = dateComp[1].split(':');
    } else if (dateComp[0].indexOf(':') >= 0) { //only time is provide
      var dayComp = ["2000", "0", "0"],
        timeComp = dateComp[0].split(':');
    } else { //only DD/MM/YEAR
      var dayComp = dateComp[0].split('/'),
        timeComp = ["0", "0"];
    }
    var newDate = new Date(dayComp[2], dayComp[1] - 1, dayComp[0], timeComp[0], timeComp[1]);
    dateArrays.push(newDate);
  });
  return dateArrays;
}

function daydiff(first, second) {
  return Math.round((second - first));
}

function minLapse(dates) {
  //determine the minimum distance among events
  var dateDistances = [];
  for (i = 1; i < dates.length; i++) {
    var distance = daydiff(dates[i - 1], dates[i]);
    dateDistances.push(distance);
  }
  return Math.min.apply(null, dateDistances);
}

function elementInViewport(el) {
  var top = el.offsetTop;
  var left = el.offsetLeft;
  var width = el.offsetWidth;
  var height = el.offsetHeight;

  while (el.offsetParent) {
    el = el.offsetParent;
    top += el.offsetTop;
    left += el.offsetLeft;
  }

  return (
    top < (window.pageYOffset + window.innerHeight) &&
    left < (window.pageXOffset + window.innerWidth) &&
    (top + height) > window.pageYOffset &&
    (left + width) > window.pageXOffset
  );
}

function checkMQ() {
  return window.getComputedStyle(document.querySelector('.horizontal-timeline'), '::before').getPropertyValue('content').replace(/'/g, "").replace(/"/g, "");
}

if ( $('.collapse--navbar').length && $(window).width() < 768 ) {
  $('.collapse--navbar').removeClass('in');
}

$('.helpful-question a').on('click', function(e) {
  $('.helpful-question a').removeClass('active animated tada');
  $(this).addClass('active animated tada');
  e.preventDefault();
});

$('.panorama').cyclotron();

if ( $('#panorama-drag').length ) {
  new Vivus('panorama-drag', {
    duration: 100,
    start: 'inViewport',
    animTimingFunction: Vivus.EASE_OUT,
    file: 'images/icons/icon-drag.svg',
    onReady: function (myVivus) {
      myVivus.el.setAttribute('height', '89px');
    }
  });
}

if ( $(window).width() < 768 ) {
  $('#jobs-gallery').justifiedGallery({
    rowHeight: 100,
    lastRow: "justify",
    captions: false,
    margins: 0,
    cssAnimation: true
  });
  $('.gallery__slider-masonry').justifiedGallery({
    rowHeight: 70,
    maxRowHeight: 70,
    lastRow: "justify",
    captions: false,
    margins: 0,
    cssAnimation: true,
    refreshTime: 30
  }).on('jg.complete', function (e) { gallerySlider.refresh(); });
} else if ( $(window).width() > 1210 ) {
  $('#jobs-gallery').justifiedGallery({
    rowHeight: 270,
    lastRow: "justify",
    captions: false,
    margins: 0,
    cssAnimation: true
  });
  $('.gallery__slider-masonry').justifiedGallery({
    rowHeight: 160,
    maxRowHeight: 160,
    lastRow: "justify",
    captions: false,
    margins: 0,
    cssAnimation: true
  }).on('jg.complete', function (e) { gallerySlider.refresh(); });
} else {
  $('#jobs-gallery').justifiedGallery({
    rowHeight: 200,
    //maxRowHeight: 450,
    lastRow: "justify",
    captions: false,
    margins: 0,
    cssAnimation: true
  });
  $('.gallery__slider-masonry').justifiedGallery({
    rowHeight: 160,
    maxRowHeight: 160,
    lastRow: "justify",
    captions: false,
    margins: 0,
    cssAnimation: true
  }).on('jg.complete', function (e) { gallerySlider.refresh(); });
}

var tos = $('.gallery a').tosrus({
  buttons: {
    next: true,
    prev: true,
    close: true
  },
  keys: {
    next: true,
    prev: true,
    close: true
  },
  pagination: {
    add: true,
    type: "thumbnails",
    anchorBuilder: function(index){
      return '<a href="#" style="background-image: url('+$($('.jg-entry').get(index-1)).children().attr('src')+');"></a>';
    }
  },
  wrapper: {
    //onClick: "close"
  },
  youtube: {
    imageLink: false
  }
});

$('.tos-slide').swipe( {
  swipeLeft:function() {
    tos.trigger("next");
  },
  swipeRight:function() {
    tos.trigger("prev");
  }
});

var articleSize = $('.news-list .news-list__article').length;
var articleNumber = 5;
$('.news-list .news-list__article:lt('+articleNumber+' )').show().css('display', 'block');

if ( articleSize <= 5 ) {
  $('.news-list__load-more').hide();
}

$('.news-list__load-more').on('click', function(e) {
  articleNumber = (articleNumber + 5 <= articleSize) ? articleNumber + 5 : articleSize;
  $('.news-list .news-list__article:lt('+articleNumber+')').fadeIn(300).css('display', 'block');
  if ( $('.news-list .news-list__article:hidden').length > 0 ) { } else {
    $('.news-list__load-more').slideUp(300);
  }
  e.preventDefault();
});

var gallerySlider = $('.gallery__slider, .singleProduct__offer-slider').lightSlider({
    item: 1,
    mode: "slide",
    autoWidth: false,
    adaptiveHeight: true,
    slideMove: 1,
    slideMargin: 0,
    speed: 400,
    easing: 'cubic-bezier(0.25, 0, 0.25, 1)',
    auto: false,
    loop: false,
    pager: false
});

$('#test_your_device_form').on('submit', function(evt) {
  evt.preventDefault();
  if ($(this).find('#test_your_device').val() === '123456') {
    $('#test__ok').modal('show');
  } else {
    $('#test__error').modal('show');
  }
});

$('#test_your_sim_card_form').on('submit', function(evt) {
  evt.preventDefault();
  if ($(this).find('#test_your_sim_card').val() === '123456') {
    $('#test__ok').modal('show');
  } else {
    $('#test__error').modal('show');
  }
});

if ($('.search__location').length) {
  var substringMatcher = function(strs) {
    return function findMatches(q, cb) {
      var matches, substringRegex;
      matches = [];
      substrRegex = new RegExp(q, 'i');
      $.each(strs, function(i, str) {
        if (substrRegex.test(str)) {
          matches.push(str);
        }
      });
      cb(matches);
    };
  };

  var match = [
    'Riga',
    'Sēbruciems',
    'Skulte',
    'Silakrogs',
  ];

  $('.search__location').typeahead({
    source: substringMatcher(match),
    fitToElement: true,
    highlighter: function(item) {
      return "<span data-name="+item+">"+item+"</span>";
    }
  });
}

// Custom tooltip
$('.custom__tooltip').on('click', function() {
  $('.custom__tooltip').removeClass('open');
  $(this).toggleClass('open');
});

$('body').on('click', function(event){
  if ($('.custom__tooltip').hasClass('open')) {
    if($(event.target).closest('.custom__tooltip.open').length == 0) {
      $('.custom__tooltip').removeClass('open');
    }
  }
});

// MAP

var markers = [];

function map_initialize() {
    var style= [
        {
            "featureType": "administrative",
            "stylers": [
              { "visibility": "off" }
            ]
        },
        {"featureType":"water","elementType":"geometry","stylers":[  { "visibility": "off" }]},
        {"featureType": "transit.line",
            "stylers": [
                { "visibility": "off" }
            ]
        },
        {
            "featureType": "road",
            "stylers": [
                { "visibility": "off" }
            ]
        },
        {
            "featureType": "poi",
            "stylers": [
                {lightness:100},{saturation:-100},
                { "visibility": "on" }
            ]
        },
        {
            "featureType": "landscape",
            "stylers": [
                {lightness:100},{saturation:-100},
                { "visibility": "on" }
            ]
        },
        {
            "elementType": "labels",
            "stylers": [
                { "visibility": "off" }
            ]
        },
        {
            "stylers": [
                { "visibility": "off" }
            ]
        },
        {
            "featureType": "administrative",
            "stylers": [
                { "visibility": "on" }
            ]
        },
            {featureType:"water",elementType:"geometry",stylers:[ { "visibility": "on" }]},
                {"featureType": "transit.line",
                    "stylers": [
                { "visibility": "off" }
            ]
        },
        {
            "featureType": "road",
            "stylers": [
                { "visibility": "on" }
            ]
        },
        {
            "elementType": "labels",
            "stylers": [
                { "visibility": "on" }
            ]
        },
    ];

    //set google map options
    var centerLT = new google.maps.LatLng(54.968315993088396, 23.94995273437497);
    var centerLV = new google.maps.LatLng(56.93613743271883, 24.10376132812497);
    var riga = new google.maps.LatLng(56.94834476995304, 24.116535186767578);
    var centerLL = riga;
    var transparent_marker = 'images/icons/icon-transparent-marker.png'

    var zoomRiga = 11;

    var map_options = {
      scrollwheel: false,
      draggable: true,
      minZoom: 7,
      maxZoom: 16,
      zoom: zoomRiga,
      center: riga,
      styles: style,
    };
    var map = new google.maps.Map(document.getElementById("mapCanvas"), map_options);

    var locations = [
        [$('.map__content-good').html(), 56.94834476995304, 24.116535186767578, transparent_marker],
        [$('.map__content-bad').html(), 56.930917, 23.88351990000001, transparent_marker],
        [$('.map__content-good').html(), 57.31831989999998, 24.43644089999998, transparent_marker],
        [$('.map__content-bad').html(), 56.96360929999999, 24.42914970000004, transparent_marker],
    ];

    var marker, i;
    var infowindow = new google.maps.InfoWindow();

    google.maps.event.addListener(map, 'click', function() {
      infowindow.close();
    });


    for (i = 0; i < locations.length; i++) {
        marker = new google.maps.Marker({
            position: new google.maps.LatLng(locations[i][1], locations[i][2]),
            map: map,
            icon: locations[i][3]
        });

        google.maps.event.addListener(marker, 'click', (function(marker, i) {
            return function() {
                infowindow.setContent(locations[i][0]);
                infowindow.open(map, marker);
                google.maps.event.addListener(infowindow, 'domready', function() {
                    var iw_outer = $('.gm-style-iw');

                    var iw_background = iw_outer.prev();
                    iw_background.children().css({'display' : 'none'});
                    var iw_close_btn = iw_outer.next();

                    iw_close_btn.css({
                        display: 'none',
                        width: '26px',
                        height: '26px',
                        opacity: '1',
                        left: '-52px', top: '33px',
                        border: '7px solid #fff',
                        'border-radius': '13px',
                        'box-shadow': 'rgb(224, 224, 224) 0px 0px 5px'
                      });

                    iw_close_btn.mouseout(function(){
                      $(this).css({opacity: '1'});
                    });
                });
                map.panTo(marker.getPosition());
            }
        })(marker, i));

        markers.push(marker);
    }

}
if ( $('#mapCanvas').length ) {
  google.maps.event.addDomListener(window, 'load', map_initialize);
}


function google_location_click(id){
    google.maps.event.trigger(markers[id], 'click');
}

$('.map__infowindow-trigger').on('click', function(evt) {
    evt.preventDefault();
    var el = $(this),
        el_id = el.index();
    google_location_click(el_id);
});

$('body').on('click', '.innerPage-header__boxes .typeahead li, .map__section .typeahead li', function() {
    var el = $(this);
        el_data = el.find('span').attr('data-name');
    $('.map__infowindow-trigger[data-name="'+el_data+'"]').click();

    $('html, body').stop(true, false).animate({
        scrollTop: $('.map__section').offset().top - 0
    }, 700);
});

// textarea clear text on focus
$('textarea')
  .focus(function() {
    if (this.value === this.defaultValue) {
        this.value = '';
    }
  })
  .blur(function() {
    if (this.value === '') {
        this.value = this.defaultValue;
    }
});


// sms character remaining
var sms_max = 140;

$('.form-info-text--counter span').html(sms_max);

$('.sms-text').keyup(function(e) {
  if ( this.value.length == sms_max ) {
    e.preventDefault();
  } else if ( this.value.length > sms_max ) {
    this.value = this.value.substring(0, sms_max);
  }
  var text_length = $('.sms-text').val().length;
  var text_remaining = sms_max - text_length;
  $('.form-info-text--counter span').html(text_remaining);
});

// insert cookie agreement content
if ( !$('body').hasClass('no-cookie-agreement') ) {
  setTimeout(function() {
    $('body').prepend('<div class="alert alert-dismissible cookie-agreement" role="alert"><div class="container"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>Bite is constantly improving our services to serve you better and more personal. By using this website you agree that we will use your Cookies to <a href="#"><strong>personalize content for you</strong></a>.</div></div>');
    $('.cookie-agreement').hide();
  }, 1000);
}

$('.btn--pay-with-card').on('click', function(e) {
  var random = Math.floor(Math.random() * 2) + 1;
  $('.pay-with-card__form').slideUp(300);
  if ( random == 1 ) {
    $('.pay-with-card__success').slideDown(300);
  } else {
    $('.pay-with-card__fail').slideDown(300);
  }
  e.preventDefault();
});

// insert loading animation demo
$('.buy-plan').on('click', function(e) {
  $('body').addClass('loading');
  //autoclose for demo only, remove when needed
  setTimeout(function() {
    $('body').removeClass('loading');
  }, 2000);
  e.preventDefault();
});

if ( $('input[type="number"]').length ) {
  $('input[type="number"]').stepper();
}

// Adjust search result height, show all button, count, no results
function adjustSearchResult() {
  $('.search-result .container--search-result').removeClass('four three two one');
  $('.search-result .search-result__list a').show();
  $('.search-result .search-result__empty').hide();
  $('.search-result .container--search-result').removeClass('empty');
  $('.search-result .search-result__list').removeClass('search-result__list--empty');

  // if ( $('.search-result .search-result__list a').length == 4 ) {
  //   $('.search-result .container--search-result').addClass('four');
  // }
  // if ( $('.search-result .search-result__list a').length == 3 ) {
  //   $('.search-result .container--search-result').addClass('three');
  // }
  // if ( $('.search-result .search-result__list a').length == 2 ) {
  //   $('.search-result .container--search-result').addClass('two');
  // }
  // if ( $('.search-result .search-result__list a').length == 1 ) {
  //   $('.search-result .container--search-result').addClass('one');
  // }

  if ( $('.search-result .search-result__list a').length == 0 ) {
    $('.search-result .search-result__list').addClass('search-result__list--empty');
    $('.search-result .search-result__empty').show();
    $('.search-result .search-result__list a').hide();
    $('.search-result .btn-showall').hide();
    $('.search-result .container--search-result').addClass('empty');
  }
  var max_length = -1;
  $('.search-result .search-result__list').each(function() {
    var $this = $(this);
    $this.parent().parent().find('.btn-showall').hide();
    var results = $this.find('a').length;
    $this.prev('.search-result__heading').find('span').html(results);
    if ( results > 5 ) {
      $this.find('a').slice(5).hide();
      $this.parent().parent().find('.btn-showall').show().css('display', 'inline-block');
    }
    if ( results == 0 ) {
      $this.addClass('search-result__list--empty');
      $this.find('a').hide();
      $this.parent().parent().find('.btn-showall').hide();
    }

    max_length = Math.max(max_length, results);

    if ( $(window).height() < 630 && $(window).width() > 767 ) {
      $('.search-result .search-result__list a:nth-child(5)').hide();
      $('.search-result .container--search-result').addClass('four');
      if ( results > 4 ) {
        $this.parent().parent().find('.btn-showall').show().css('display', 'inline-block');
      }
    }
    if ( $(window).height() < 570 && $(window).width() > 767 ) {
      $('.search-result .search-result__list a:nth-child(4)').hide();
      $('.search-result .container--search-result').addClass('three');
      if ( results > 3 ) {
        $this.parent().parent().find('.btn-showall').show().css('display', 'inline-block');
      }
    }
    if ( $(window).height() < 500 && $(window).width() > 767 ) {
      $('.search-result .search-result__list a:nth-child(3)').hide();
      $('.search-result .container--search-result').addClass('two');
      if ( results > 2 ) {
        $this.parent().parent().find('.btn-showall').show().css('display', 'inline-block');
      }
    }
    if ( $(window).height() < 430 && $(window).width() > 767 ) {
      $('.search-result .search-result__list a:nth-child(2)').hide();
      $('.search-result .container--search-result').addClass('one');
      if ( results > 1 ) {
        $this.parent().parent().find('.btn-showall').show().css('display', 'inline-block');
      }
    }
  });
  if ( max_length == 4 ) {
    $('.container--search-result').addClass('four');
  }
  if ( max_length == 3 ) {
    $('.container--search-result').addClass('three');
  }
  if ( max_length == 2 ) {
    $('.container--search-result').addClass('two');
  }
  if ( max_length == 1 ) {
    $('.container--search-result').addClass('one');
  }
}

adjustSearchResult();

$(window).resize(function() {
  adjustSearchResult();
});

// Display search result
$('.search input').on('input', function() {
  adjustSearchResult();
  if ( $(this).val() ) {
    $('.search-result').slideDown(200);
  } else {
    $('.search-result').slideUp(200);
  }
});

function splitSubmenuToColumns() {
  var num_cols = 6,
      container = $('.productCategories__submenu'),
      listItem = 'li',
      listClass = 'productCategories__submenu-column';
  if ( $(window).width() < 1200 ) {
    num_cols = 5;
  }
  if ( $(window).width() < 992 ) {
    num_cols = 4;
  }
  container.each(function () {
    var items_per_col = new Array(),
      items = $(this).find(listItem),
      min_items_per_col = Math.floor(items.length / num_cols),
      difference = items.length - (min_items_per_col * num_cols);
    for (var i = 0; i < num_cols; i++) {
      if (i < difference) {
        items_per_col[i] = min_items_per_col + 1;
      } else {
        items_per_col[i] = min_items_per_col;
      }
    }
    for (var i = 0; i < num_cols; i++) {
      $(this).append($('<ul ></ul>').addClass(listClass));
      for (var j = 0; j < items_per_col[i]; j++) {
        var pointer = 0;
        for (var k = 0; k < i; k++) {
          pointer += items_per_col[k];
        }
        $(this).find('.' + listClass).last().append(items[j + pointer]);
      }
    }
  });
  $('.productCategories__sub-container').css('opacity', '1');
}

splitSubmenuToColumns();

$(window).on('resize', function(){
  splitSubmenuToColumns();
});

$('a[href$="#filterCategory-more"]').on('click', function(e) {
  var text1 = $(this).attr('data-text-open');
  var text2 = $(this).attr('data-text-close');
  if ( $(this).hasClass('collapsed') ) {
    $(this).text(text2);
  } else {
    $(this).text(text1);
  }
  e.preventDefault();
});

$('.btn--check-credit-limit').on('click', function(e) {
  $('.credit-limit__intro').hide();
  $('.credit-limit__authorize').show().removeClass('hide');
  e.preventDefault();
});

$('.credit-limit__authorize .button__list a').on('click', function(e) {
  $(this).closest('.panel-body').addClass('loading');
  setTimeout(function() {
    $('.loading').removeClass('loading');
    $('.credit-limit__authorize').hide();
    $('.credit-limit__result').show().removeClass('hide');
    $('.credit-limit__toggle').addClass('authorized');
  }, 2000);
  e.preventDefault();
});

$('.credit-limit__toggle, .credit-limit__close').on('click', function() {
  $('.credit-limit__toggle').slideToggle(200);
  $('.credit-limit__container').slideToggle(200);
});



var slidesWrapper = $('#video-slider1');

if (slidesWrapper.length > 0) {
  var sliderNav = slidesWrapper.next('.hero-slider-nav'),
    slidesNumber = slidesWrapper.children('li').length,
    visibleSlidePosition = 0,
    autoPlayId,
    autoPlayDelay = 5000;

  setVideo(slidesWrapper, true);
  //setAutoplay(slidesWrapper, slidesNumber, autoPlayDelay);

  sliderNav.on('click', 'li', function (event) {
    event.preventDefault();
    var selectedItem = $(this);
    if ( !selectedItem.hasClass('selected') ) {
      // if it's not already selected
      var selectedPosition = selectedItem.index(),
        activePosition = slidesWrapper.find('li.selected').index();

      if (activePosition < selectedPosition) {
        nextSlide(slidesWrapper.find('.selected'), slidesWrapper, sliderNav, selectedPosition);
      } else {
        prevSlide(slidesWrapper.find('.selected'), slidesWrapper, sliderNav, selectedPosition);
      }

      //this is used for the autoplay
      visibleSlidePosition = selectedPosition;
      updateSliderNavigation(sliderNav, selectedPosition);
      //reset autoplay
      //setAutoplay(slidesWrapper, slidesNumber, autoPlayDelay);
    }
  });
}

function nextSlide(visibleSlide, container, pagination, n) {
  visibleSlide.removeClass('selected from-left from-right').addClass('is-moving').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function () {
    visibleSlide.removeClass('is-moving');
  });
  container.children('li').eq(n).addClass('selected from-right').prevAll().addClass('move-left');
  checkVideo(visibleSlide, container, n);
}

function prevSlide(visibleSlide, container, pagination, n) {
  visibleSlide.removeClass('selected from-left from-right').addClass('is-moving').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function () {
    visibleSlide.removeClass('is-moving');
  });
  container.children('li').eq(n).addClass('selected from-left').removeClass('move-left').nextAll().removeClass('move-left');
  checkVideo(visibleSlide, container, n);
}

function updateSliderNavigation(pagination, n) {
  var navigationDot = pagination.find('.selected');
  navigationDot.removeClass('selected');
  pagination.find('li').eq(n).addClass('selected');
}

function setVideo(container, autoplay) {
  container.find('.bg-video-wrapper').each(function () {
    var videoWrapper = $(this);
    if (videoWrapper.is(':visible')) {
      var videoUrl = videoWrapper.data('video'),
        video = $('<video loop muted><source src="' + videoUrl + '.mp4" type="video/mp4" /><source src="' + videoUrl + '.webm" type="video/webm" /></video>');
      video.appendTo(videoWrapper);
      // play video if first slide
      if (autoplay && videoWrapper.parent('.bg-video.selected').length > 0) video.get(0).play();
    }
  });
}

function checkVideo(hiddenSlide, container, n) {
  //check if a video outside the viewport is playing - if yes, pause it
  var hiddenVideo = hiddenSlide.find('video');
  if (hiddenVideo.length > 0 && container.hasClass('hero-slider--thumbs')) {
    hiddenVideo.get(0).pause();
    container.find('.hero-slider__content').show();
  }
  //check if the select slide contains a video element - if yes, play the video
  var visibleVideo = container.children('li').eq(n).find('video');
  if (visibleVideo.length > 0 && !container.hasClass('hero-slider--thumbs') ) visibleVideo.get(0).play();
}

// function setAutoplay(wrapper, length, delay) {
//   if (wrapper.hasClass('autoplay')) {
//     clearInterval(autoPlayId);
//     autoPlayId = window.setInterval(function () {
//       autoplaySlider(length)
//     }, delay);
//   }
// }

// function autoplaySlider(length) {
//   if (visibleSlidePosition < length - 1) {
//     nextSlide(slidesWrapper.find('.selected'), slidesWrapper, sliderNav, visibleSlidePosition + 1);
//     visibleSlidePosition += 1;
//   } else {
//     prevSlide(slidesWrapper.find('.selected'), slidesWrapper, sliderNav, 0);
//     visibleSlidePosition = 0;
//   }
//   updateSliderNavigation(sliderNav, visibleSlidePosition);
// }

var slidesWrapper2 = $('#video-slider2');

if (slidesWrapper2.length > 0) {
  var sliderNav2 = slidesWrapper2.closest('.hero').find('.hero-slider-nav'),
    slidesNumber = slidesWrapper2.children('li').length,
    visibleSlidePosition = 0,
    autoPlayId,
    autoPlayDelay = 5000;

  setVideo(slidesWrapper2);

  sliderNav2.on('click', 'li', function (event) {
    event.preventDefault();
    var selectedItem = $(this);
    if ( !selectedItem.hasClass('selected') ) {
      // if it's not already selected
      var selectedPosition = selectedItem.index(),
        activePosition = slidesWrapper2.find('li.selected').index();

      if (activePosition < selectedPosition) {
        nextSlide(slidesWrapper2.find('.selected'), slidesWrapper2, sliderNav2, selectedPosition);
      } else {
        prevSlide(slidesWrapper2.find('.selected'), slidesWrapper2, sliderNav2, selectedPosition);
      }

      //this is used for the autoplay
      visibleSlidePosition = selectedPosition;
      updateSliderNavigation(sliderNav2, selectedPosition);
      updateSliderNavigation(slidesWrapper2.closest('.hero').find('.hero-slider-nav--bullets'), selectedPosition);
    }

    slidesWrapper2.closest('.hero').find('.hero-slider-nav ul').scrollCenter('.selected', 500);

  });
}

$('.hero-slider .btn--play').on('click', function() {
  $(this).closest('.hero-slider__content').fadeOut(200);
  $(this).closest('.bg-video').find('video').get(0).play();
});

$('.list-accordion li').on('click', function() {
  var listItem = $(this).attr('aria-controls');
  $('.screens img').hide();
  $('.screens').find("[aria-controls='" + listItem + "']").show().css('display', 'block');
  $('.list-accordion li').removeClass('active');
  $(this).addClass('active');
});

if ( $(window).width() < 1024 ) {
  $('.slider-cards').lightSlider({
    item: 3,
    slideMove: 1,
    enableDrag: false,
    slideMargin: 0,
    easing: 'cubic-bezier(0.25, 0, 0.25, 1)',
    responsive: [
      {
        breakpoint: 800,
        settings: {
          item: 2,
          controls: false
        }
      },
      {
        breakpoint: 512,
        settings: {
          item: 1,
          controls: false
        }
      }
    ]
  });
}

function bannerHeight() {
  $('.product--banner').each(function() {
    var height = $(this).parent().prev().find('.product').innerHeight();
    $(this).height(height);
  });
}

bannerHeight();

$(window).on('resize', function() {
  bannerHeight();
});



//temporary annoyance disable
setTimeout(function() {
  $('.cookie-agreement').hide();
}, 1000);


// Perfect scrollbar
if ($('.custom--scrollbar').length) {
  $('.custom--scrollbar').perfectScrollbar();
}

}); // jQuery(function($)

// if ( $(window).width() < 768 ) {
//   window.viewportUnitsBuggyfill.init({force: true});
// }
