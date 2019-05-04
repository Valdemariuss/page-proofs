var landingSlider;
var interactiveProductBanner;
var multipleProductCarousel;

function LandingSlider (slider, slides) {
  var me = this;
  this.slides = slides;

  this.slider = $(slider);

  this.defaultBackground = '#00a040';
  this.defaultColor = '#ffffff';

  var slideContainers = this.slider.find('.landing-slider__slide');
  var slideControls = this.slider.find('.landing-slider__pagination').eq(0).children('a');

  this.slides.map(function (slide, index) {
    slide.index = index;
    slide.container = slideContainers.eq(index);
    slide.control = slideControls.eq(index);
    slide.container.children('.slide__background').css(
      {backgroundImage: 'url(' + slide.imageURL + ')'}
    );

    slide.container.on('click', function () {
      if ($(window).width() >= 768 && !$(this).hasClass('active')) {
        me.activateSlide(index);
        return false;
      }
    });

    slide.container.swipe({
      swipeLeft: function () {
        me.switchSlides()
      },
      swipeRight: function () {
        me.switchSlides(false)
      }
    });

    slide.control.on('click', function () {
      if (me.activeSlide.index !== index) {
        me.activateSlide(index);
        return false;
      }
    });
  });

  this.slideInfoContent = this.slider.find('.slider__info-content').eq(0);

  this.setSlideInfo(0, fade = 200);
  this.activeSlide = slides[0];
  this.activeSlide.control.addClass('active');
  this.setSlideSwitchTimer();
}

LandingSlider.prototype.activateSlide = function (nextSlideIndex) {
  this.setSlideInfo(nextSlideIndex);

  var nextSlide = this.slides[nextSlideIndex];

  var prevSlideClasses = this.activeSlide.container.attr('class');
  var nextSlideClasses = nextSlide.container.attr('class');

  nextSlide.container.removeClass().addClass(prevSlideClasses);
  this.activeSlide.container.removeClass().addClass(nextSlideClasses);

  this.activeSlide.control.removeClass('active');
  nextSlide.control.addClass('active');

  this.activeSlide = nextSlide;
  this.setSlideSwitchTimer();
}

LandingSlider.prototype.setSlideSwitchTimer = function (time = 8000) {
  var me = this;

  clearInterval(this.timer);

  this.timer = setInterval(function () {
    me.switchSlides();
  }, time);
}

LandingSlider.prototype.setSlideInfo = function (nextSlideIndex, fade = 300) {
  var slide = this.slides[nextSlideIndex];
  this.setSliderColor(slide);
  this.slideInfoContent.children().hide();

  this.slideInfoContent.find('h2').html(slide.heading);
  this.slideInfoContent.find('p').html(slide.description);

  if (slide.buttonText && slide.link) {
    this.slideInfoContent.children('a').attr('href', slide.link).text(slide.buttonText);
  }
  this.slideInfoContent.children().delay(200).fadeIn(fade);
}

LandingSlider.prototype.setSliderColor = function (slide) {
  this.slider.css('background', slide.background || this.defaultBackground);
  this.slider.css('color', slide.color || this.defaultColor);
}

LandingSlider.prototype.switchSlides = function (switchToRight = true) {
  var me = this;
  var step = switchToRight ? 1 : -1;
  var calculatedIndex = me.activeSlide.index + step;
  var nextSlideIndex;
  if (calculatedIndex >= 0 && calculatedIndex < me.slides.length) {
    nextSlideIndex = calculatedIndex;
  } else if (calculatedIndex < 0) {
    nextSlideIndex = me.slides.length - 1;
  } else {
    nextSlideIndex = 0;
  }

  this.activateSlide(nextSlideIndex);
}

LandingSlider.prototype.destroy = function () {
  this.activateSlide(0);
  this.activeSlide.control.removeClass('active');
  void this.activeSlide.control.get(0).offsetWidth; // Workaround to reset animation
  clearInterval(this.timer);
  this.activeSlide = null;

  this.slides.map(function (slide, index) {
    slide.container.off('click');
    slide.container.off('swipe');
    slide.control.off('click');
  });

  this.slides = null;
}

function reinitializeLandingSlider(slides) {
  landingSlider.destroy();
  landingSlider = new LandingSlider(slides);
}

/**
 * @param slide object with slide definition
 * @param position zero-based index of slide
 * @returns {boolean}
 */
function replaceLandingSliderSlide(slide, position = 0) {
  if(!(window.landingSlider && window.landingSlider.slides)){
    return false;
  }
  var slides = landingSlider.slides.map(function (slide) {
    return Object.assign({}, slide);
  });
  slides[position] = slide;
  reinitializeLandingSlider(slides);
  return true;
}

function createSlides(isPersonalized = false) {
  var extraHeading = isPersonalized ? 'Personalized: ' : '';
  return slides = [
    {
      heading: extraHeading + 'Excellent quality all across the country',
      description: 'BITE has a cutting edge technology mobile towers network, which covers 99% of Latvia with quality 4G mobile internet.',
      imageURL: 'images/banner-box1-coverage.jpg',
      buttonText: 'See coverage',
      link: '#slide1'
    },
    {
      heading: extraHeading + 'Best offers on the newest technology',
      description: 'BITE consistently maintains best offers in the country on the latest smartphones, tablets and laptops.',
      imageURL: 'images/banner-box2-phone.jpg',
      buttonText: 'View store',
      link: '#slide2',
      color: '#000000',
      background: '#f9f9f9'
    },
    {
      heading: extraHeading + 'Enjoy carefree service anywhere you are',
      description: 'Bite service and support is so good that you can enjoy life to the fullest, anywhere, any time.',
      imageURL: 'images/banner-box3-party.jpg',
      buttonText: 'Sign up',
      link: '#slide3'
    }
  ];
}

function initializeJoiningBenefits() {
  var container = $('#joining-benefits').eq(0);
  var controls = container.children('.benefits__selection').children('li');
  var infos = container.find('.benefits__info').children('.benefits__info-content');
  var slides = container.find('.benefits__slides').children('.benefits__slide');

  controls.each(function (index) {
    $(this).click('click', function (event) {
      if ($(this).hasClass('active')) {
        return false;
      }

      controls.removeClass('active');
      $(this).addClass('active');

      slides.filter('.active').hide().removeClass('active');
      slides.eq(index).addClass('active').fadeIn(200);

      infos.filter('.active').hide().removeClass('active');
      infos.eq(index).addClass('active').fadeIn(200);
    });
  });

  var animation = bodymovin.loadAnimation({
    container: container.find('.animation__canvas').get(0),
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: 'animations/piechart-zero.json',
  });
}

function initializeManabiteBenefits() {
  var activeBullet;

  var container = $('#joining-benefits-manabite').eq(0);
  var animationCanvas = container.find('.animation__canvas');
  var animationContainer = animationCanvas.eq(0).parent();
  var animationHeader = container.find('.animation__header').eq(0);
  var controls = container.find('.animation__selection').eq(0).children('li');

  var prevArrow = container.find('.animation__arrow--prev').eq(0);
  var nextArrow = container.find('.animation__arrow--next').eq(0);

  animationContainer.swipe({
    swipeLeft: function () {
      var next = activeBullet.next();

      if (next.length) {
        handleControlClick(next);
      }
      else {
        handleControlClick(controls.eq(0))
      }
    },
    swipeRight: function () {
      var prev = activeBullet.prev();

      if (prev.length) {
        handleControlClick(prev);
      }
      else {
        handleControlClick(controls.eq(-1))
      }
    }
  });

  prevArrow.click(function () {
    handleControlClick(activeBullet.prev());
  });

  nextArrow.click(function () {
    handleControlClick(activeBullet.next());
  });

  controls.each(function (index) {
    $(this).click(function () {
      handleControlClick(controls.eq(index));
    });
  });

  handleControlClick(controls.eq(0));

  function handleControlClick(bullet) {
    if (bullet.hasClass('active')) {
      return false;
    }
    clearInterval(this.timer);

    controls.removeClass('active');
    bullet.addClass('active');
    activeBullet = bullet;

    var prevBullets = bullet.prevAll('li');
    var nextBullets = bullet.nextAll('li');

    if (!prevBullets.length) prevArrow.hide().addClass('hidden');
    if (prevBullets.length) prevArrow.show().removeClass('hidden');

    if (!nextBullets.length) nextArrow.hide().addClass('hidden');
    if (nextBullets.length) nextArrow.show().removeClass('hidden');

    showAnimation(bullet.data('animation-name'), bullet.data('animation-header'));
    initializeAutoSlide();
  }

  // This function gives No Cross Origin Request error if animation files are not served from HTTP, workaround below
  function showAnimation(name, headerText = '') {
    animationHeader.text(headerText);

    bodymovin.destroy('advantage');

    var animation = bodymovin.loadAnimation({
      container: animationCanvas.get(0),
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: 'animations/' + name,
      name: 'advantage'
    });

    if (!animation.animationData.length) {
      console.log('Failed to load animation from file because file is not served from HTTP, falling back to workaround.')
      showAnimationNoCORS(name, headerText);
    }
  }

  // Workaround to load animations from JS file attached to index.html
  function showAnimationNoCORS(name, headerText = '') {
    animationHeader.text(headerText);

    // Remove previous animation
    bodymovin.destroy('advantage');

    // Create new animation
    var animation = bodymovin.registerAnimation(animationCanvas.get(0));
    animation.setData(animation.wrapper, animationData[name]);
  }

  function initializeAutoSlide(time = 5000) {
    clearInterval(this.timer);
    this.timer = setInterval(function () {
      var nextSlide = activeBullet.next();
      if (nextSlide.length) {
        handleControlClick(nextSlide);
      } else {
        handleControlClick(controls.eq(0));
      }

    }, time);
  }

  initializeAutoSlide(5000);
}

function MultipleProductCarousel($container) {
  var me = this;

  this.activeProduct;

  this.container = $container;
  this.viewport = this.container.find('.multiple-products__viewport').eq(0);
  this.carousel = this.container.find('.multiple-products__slides').eq(0);
  this.carouselControls = this.container.find('.multiple-products__arrow--carousel');
  this.carouselX = 0;
  this.products = this.carousel.find('.product--landing');

  this.carouselControls.click(function () {
    me.handleCarouselArrowClick($(this));
  });

  this.products.each(function (index) {
    var product = $(this);
    var controls = product.find('.multiple-products__arrow--single');

    controls.click(function () {
      var control = $(this);
      me.handleSingleArrowClick(control, product);
    });

    product.focus(function () {
      me.focusProduct(product);
    });

    product.mouseout(function () {
      if ($(window).width() >= 768) {
        product.removeClass('active');
        product.blur();
      } else return;
    });

    product.focusout(function () {
      if ($(window).width() >= 768) {
        product.removeClass('active');
      } else return;
    });
  });

  // Focus one product if window is mobile size
  if ($(window).width() < 768 && !me.activeProduct) {
    me.focusProduct(me.products.eq(0));
  }

  // Center carousel for initial window size
  me.centerCarousel();
  me.toggleCarouselControls();

  $(window).resize(_.debounce(function () {
    // Recenter carousel on window resize, focus one product if going down to mobile
    if ($(window).width() < 768) {
      if (me.activeProduct) me.focusProduct(me.activeProduct);
      else me.focusProduct(me.products.eq(0));
    } else {
      me.focusProduct(false);
    }

    me.centerCarousel();
  }, 200, {trailing: true}));
}

MultipleProductCarousel.prototype.focusProduct = function (product) {
  this.products.removeClass('active');

  if (product) {
    this.activeProduct = product;
    this.activeProduct.addClass('active');
  }
}

MultipleProductCarousel.prototype.handleSingleArrowClick = function (control, product) {
  var nextProduct;
  if (control.hasClass('multiple-products__arrow--next')) {
    nextProduct = product.nextAll().length ? product.next() : this.products.eq(0);
  } else if (control.hasClass('multiple-products__arrow--prev')) {
    nextProduct = product.prevAll().length ? product.prev() : this.products.eq(-1);
  } else {
    return;
  }

  this.focusProduct(nextProduct);
  return false;
}

MultipleProductCarousel.prototype.handleCarouselArrowClick = function (control) {
  if (control.hasClass('multiple-products__arrow--next')) {
    this.carouselX -= 1;
  } else if (control.hasClass('multiple-products__arrow--prev')) {
    this.carouselX += 1;
  }
  this.moveCarousel();
  return false;
}

MultipleProductCarousel.prototype.moveCarousel = function () {
  var productWidth = this.products.get(0).offsetWidth;

  this.carousel.css('transform', 'translate(' + this.carouselX * productWidth + 'px, 0)');
  this.toggleCarouselControls();
}

MultipleProductCarousel.prototype.centerCarousel = function () {
  if (this.viewport.get(0).offsetWidth >= this.carousel.get(0).offsetWidth) {
    this.carouselX = 0;
  }
  this.moveCarousel();
}

MultipleProductCarousel.prototype.toggleCarouselControls = function () {
  var prevArrow = this.carouselControls.filter('.multiple-products__arrow--prev');
  var nextArrow = this.carouselControls.filter('.multiple-products__arrow--next');
  var productWidth = this.products.get(0).offsetWidth;

  if (this.carouselX === 0) {
    prevArrow.addClass('hidden');
  } else {
    prevArrow.removeClass('hidden');
  }

  if (this.carouselX * productWidth <= this.viewport.get(0).offsetWidth - this.carousel.get(0).offsetWidth) {
    nextArrow.addClass('hidden');
  } else {
    nextArrow.removeClass('hidden');
  }
}

function InteractiveProductBanner(banner) {
  var me = this;

  this.banner = $(banner);
  this.products = [];
  this.animationTimer;

  var productContainers = this.banner.find('.interactive-banner__product');
  var controls = this.banner.find('.interactive-banner__pagination').eq(0).children('a');

  productContainers.get().map(function (productContainer, index) {
    me.products[index] = {
      index: index,
      container: productContainers.eq(index),
      animatedLayer: productContainers.eq(index).find('.interactive-banner__layer--l2'),
      initialOffer: productContainers.eq(index).find('.interactive-banner__layer--l1 .featured-product__offer:not(".featured-product__offer--discount")'),
      discountOffer: productContainers.eq(index).find('.interactive-banner__layer--l1 .featured-product__offer--discount'),
      control: controls.eq(index)
    };
  });

  this.products.map(function (product) {
    product.control.on('click', function () {
      if (me.activeProduct.index !== product.index) {
        me.activateProduct(product.index);
        return false;
      }
    });

    product.container.on('mousemove', _.throttle(function (event) {
      me.handleSlideOver(event, product);
    }, 100));

    product.container.on('click', function () {
      if ($(window).width() > 767) {
        return false;
      }
      product.initialOffer.toggle();
      product.discountOffer.toggle();
    });

  });

  this.activeProduct = this.products[0];
  this.activeProduct.control.addClass('active');
  this.setProductSwitchTimer();
}

InteractiveProductBanner.prototype.activateProduct = function (nextProductIndex) {
  var nextProduct = this.products[nextProductIndex];

  this.activeProduct.container.addClass('hidden').hide();
  nextProduct.container.removeClass('hidden').show();

  this.activeProduct.control.removeClass('active');
  nextProduct.control.addClass('active');

  this.activeProduct = nextProduct;
  this.setProductSwitchTimer();
}

InteractiveProductBanner.prototype.setProductSwitchTimer = function (time = 5000) {
  var me = this;

  clearInterval(this.timer);

  this.timer = setInterval(function () {
    me.switchProducts(me);
  }, time);
}

InteractiveProductBanner.prototype.setAnimationTimer = function (time = 100) {
  var me = this;

  clearInterval(this.animationTimer);

  this.animationTimer = setInterval(function () {
    me.animateBackground();
  }, time);
}

InteractiveProductBanner.prototype.switchProducts = function (me, switchToRight = true) {
  var step = switchToRight ? 1 : -1;
  var calculatedIndex = me.activeProduct.index + step;
  var nextProductIndex;
  if (calculatedIndex >= 0 && calculatedIndex < me.products.length) {
    nextProductIndex = calculatedIndex;
  } else if (calculatedIndex < 0) {
    nextProductIndex = me.products.length - 1;
  } else {
    nextProductIndex = 0;
  }

  me.activateProduct(nextProductIndex);
}

InteractiveProductBanner.prototype.handleSlideOver = function (event, product) {
  if ($(window).width() <= 767) {
    return false;
  }
  var target = product.container.get(0);

  // Mouse on page
  var pageX = event.pageX;
  var pageY = event.pageY;

  // Element top left corner on page
  var elementLeft = target.offsetLeft;
  var elementTop = $(target).eq(0).parent().get(0).offsetTop;

  // Element height and width
  var height = target.offsetHeight;
  var width = target.offsetWidth;

  // Mouse position on element (in px)
  var elementX = (pageX - elementLeft);
  var elementY = (pageY - elementTop);

  product.animatedLayer.css('width', 263 + elementX + Math.round(elementY / height * 126) + 'px');
}

function initializeNewsSection() {
  var newsItemAnchor = $('.news__item').find('a[data-toggle="collapse"]');
  var newsSlides = $('.news__slide');

  newsItemAnchor.each(function (index) {
    var anchor = $(this);

    anchor.click(function () {
      showNewsImage(anchor, index);
    });
  })
    .get(0).click();

  function showNewsImage(anchor, index) {
    if (!anchor.hasClass('collapsed')) {
      return false;
    }

    newsSlides.html($(anchor).parents('.news__item').find('.news-item__slide_content').html());
  }
}

function handleNewsletterSubscribe(event) {
  var newsletterContainer = $(event.target).parent().parent();
  var newsletterForm = newsletterContainer.find('.newsletter__form--join').eq(0);
  var newsletterSuccess = newsletterContainer.find('.newsletter__form--success').eq(0);

  newsletterForm.addClass('hidden');
  newsletterSuccess.removeClass('hidden');
}

function initializeBusinessModal() {
  var modal = $('.modal--business-contact');
  var checkbox = modal.find('#business-checkbox');
  var submit = modal.find('#submit-business-modal');
  var form = modal.find('.business-modal__step--form');
  var success = modal.find('.business-modal__step--success');

  checkbox.change(function () {
    if (this.checked) submit.prop('disabled', false);
    else if (!this.checked) submit.prop('disabled', true);
  });

  submit.click(function () {
    form.addClass('hidden');
    success.removeClass('hidden');
    return false;
  });
}

function initializeVideoSlide(container) {
  var video = container.find('video').get(0);
  container.click(handleClick);
  container.hover(playVideo, pauseVideo);

  function handleClick() {
    if (video.paused) {
      playVideo();
    } else {
      pauseVideo();
    }
    return false;
  }

  function playVideo() {
    if (container.hasClass('playing')) return;

    var playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(function () {
        container.addClass('playing');
      })
        .catch(function (error) {
          console.error(error);
        });
    } else {
    }
  }

  function pauseVideo() {
    if (!container.hasClass('playing')) return false;
    video.pause();
    container.removeClass('playing');
  }
}

jQuery(function ($) {
  landingSlider = new LandingSlider($('.slider__container').eq(0), createSlides());

  initializeJoiningBenefits();

  initializeManabiteBenefits();

  multipleProductCarousel = new MultipleProductCarousel($('.multiple-products__container').eq(0));

  interactiveProductBanner = new InteractiveProductBanner($('.interactive-banner__container').eq(0));

  initializeNewsSection();

  $('#newsletter-subsribe').click(handleNewsletterSubscribe);

  initializeBusinessModal();

  initializeVideoSlide($('.benefits__slide--video-player').eq(0));

  $('.landing-page-block').css({height: $('.landing-page-block').innerHeight()});//fixing the block height dependent on vh

});
