var aboutSlider;

function round(value, decimals) {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

function AboutSlider() {
  var me = this;

  this.container = jQuery('.about-slider__container').eq(0);

  this.activeSlide;
  this.nextIndex;

  this.switchTimer;
  this.compass = this.container.find('.compass');
  this.footer = this.container.find('.about-slider__footer');
  this.slides = this.createSlides();
  this.frameTransitionHandler = null;

  this.setupSlideHandlers();

  this.compass.parent().addClass('about-slider__compass--bottom');

  this.activeSlide = this.slides[0];
}

AboutSlider.prototype.createSlides = function () {
  var me = this;
  var slides = [];

  var slideElements = this.container.find('.about-slider__slide').not('.backdrop');
  var slideControls = this.container.find('.about-slider__button');

  slideElements.each(function (index) {
    var slide = {
      index: index,
      nextIndex: (index + 1 < (slideElements.length)) ? index + 1 : 0,
      prevIndex: (index - 1 >= 0) ? index - 1 : slideElements.length - 1,
      container: jQuery(this),
      background: jQuery(this).find('.about-slider__background'),
      foreground: jQuery(this).find('.about-slider__layer1'),
      backgroundBackdrop: jQuery(this).next('.backdrop-mask').find('.about-slider__background'),
      foregroundBackdrop: jQuery(this).next('.backdrop-mask').find('.about-slider__layer1'),
      backdropHolder: jQuery(this).next('.backdrop-mask').find('.about-slider__slide'),
      compassColor: !index ? 'green' : 'default',
      compassPosition: (index === 0) ? 'bottom' : 'top-left',
      control: !index ? null : slideControls.eq(index - 1),
      keyframes: me.createAnimationFrames(slideSettings[index]),
      isTransitioning: false
    };

    slide.currentFrame = Math.floor(slide.keyframes.length / 2);
    slide.background.css('transform', slide.keyframes[slide.currentFrame].background);
    slide.backgroundBackdrop.css('transform', slide.keyframes[slide.currentFrame].background);
    slide.foreground.css('transform', slide.keyframes[slide.currentFrame].foreground);
    slide.foregroundBackdrop.css('transform', slide.keyframes[slide.currentFrame].foreground);

    slides[index] = slide;
  });

  return slides;
}

AboutSlider.prototype.setupSlideHandlers = function () {
  var me = this;

  this.slides.map(function (slide) {
    slide.container.bind('wheel', _.throttle(function (event) {
      me.handleScroll(event);
      return false;
    }, 1000, {leading: true, trailing: false}));

    slide.container.swipe({
      swipe: function (event, direction, distance, duration) {
        var fakeEvent = {originalEvent: {}};

        if (direction === 'up' || direction === 'left') fakeEvent.originalEvent.deltaY = 1;
        else if (direction === 'down' || direction === 'right') fakeEvent.originalEvent.deltaY = -1;
        else {
          return false;
        }

        me.handleScroll(fakeEvent);
      }
    });

    if (slide.control) {
      slide.control.click(function (event) {
        me.handleControlClick(slide.index);
        return false;
      });
    }
  });
}

AboutSlider.prototype.handleScroll = function (event) {
  if (this.activeSlide.isTransitioning) return false;

  var nextFrame;

  if (event.originalEvent.deltaY > 0) {
    nextFrame = this.activeSlide.currentFrame + 1;
    this.compass.removeClass('spinning--reverse').addClass('spinning');
  } else if (event.originalEvent.deltaY < 0) {
    nextFrame = this.activeSlide.currentFrame - 1;
    this.compass.removeClass('spinning').addClass('spinning--reverse');
  } else {
    return false
  }

  if (nextFrame < 0) {
    this.activateSlide(this.activeSlide.prevIndex);
    return false;
  } else if (nextFrame >= this.activeSlide.keyframes.length) {
    this.activateSlide(this.activeSlide.nextIndex);
    return false;
  } else {
    var self = this;
    var nextFrameCall = function () {
      self.handleScroll(event);
    };
  }

  this.setSlideFrame(this.activeSlide, nextFrame, nextFrameCall);
}


AboutSlider.prototype.setSlideFrame = function (slide, keyframeIndex, callback) {
  var backgroundTransform = this.activeSlide.keyframes[keyframeIndex].background;
  var foregroundTransform = this.activeSlide.keyframes[keyframeIndex].foreground;

  slide.background.css({'transform': backgroundTransform});
  slide.backgroundBackdrop.css({'transform': backgroundTransform});
  slide.foreground.css({'transform': foregroundTransform});
  slide.foregroundBackdrop.css({'transform': foregroundTransform});
  this.frameTransitionHandler = setTimeout(function () {
    slide.currentFrame = keyframeIndex;
    if (callback) {
      callback();
    }
  }, 350);

}

AboutSlider.prototype.activateSlide = function (index) {
  var me = this;
  if (this.frameTransitionHandler) {
    clearTimeout(this.frameTransitionHandler);
  }

  var newSlide = this.slides[index];

  newSlide.isTransitioning = 'revealing';
  this.activeSlide.isTransitioning = 'hiding';

  newSlide.container.addClass('revealing').fadeIn(450, function () {
    me.setSlideFrame(me.activeSlide, Math.floor(newSlide.keyframes.length / 2));
    me.activeSlide.container.removeClass('active');
    me.activeSlide.backdropHolder.removeClass('active');

    me.compass.removeClass('spinning spinning--reverse');

    if (newSlide.compassColor === 'default') {
      me.compass.removeClass('compass--green');
    } else if (newSlide.compassColor === 'green') {
      me.compass.addClass('compass--green');
    }


    me.compass.parent().removeClass('about-slider__compass--bottom').removeClass('about-slider__compass--top-left');
    me.compass.parent().addClass('about-slider__compass--' + newSlide.compassPosition);

    if (me.activeSlide.control) me.activeSlide.control.removeClass('active');

    newSlide.container.addClass('active').removeClass('revealing');
    newSlide.backdropHolder.addClass('active').removeClass('revealing');

    if (newSlide.control) newSlide.control.addClass('active');

    me.activeSlide.isTransitioning = false;
    me.activeSlide = newSlide;
    newSlide.isTransitioning = false;
  });
}

AboutSlider.prototype.createAnimationFrames = function (frameSettings) {
  var steps = 7;
  var stepArray = [];

  for (var i = 0; i < steps; i++) {
    var stepValue = {};
    frameSettings.map(function (layer) {
      var translateX = layer.translateX.min + i * (layer.translateX.max - layer.translateX.min) / steps;
      var translateY = layer.translateY.min + i * (layer.translateY.max - layer.translateY.min) / steps;
      var scaleX = layer.scaleX.min + i * (layer.scaleX.max - layer.scaleX.min) / steps;
      var scaleY = layer.scaleY.min + i * (layer.scaleY.max - layer.scaleY.min) / steps;
      var perspectiveX = layer.perspectiveX.min + i * (layer.perspectiveX.max - layer.perspectiveX.min) / steps;
      var perspectiveY = layer.perspectiveY.min + i * (layer.perspectiveY.max - layer.perspectiveY.min) / steps;
      var transformString =
        'translate(' + round(translateX, 2) + '%, ' + round(translateY, 2) + '%) ' +
        'matrix3d(' + round(scaleX, 3) + ', 0, 0, ' + round(perspectiveY / 100000, 7) + ', ' +
        '0, ' + round(scaleY, 3) + ', 0, ' + round(perspectiveX / 100000, 7) + ', ' +
        '0, 0, 1, 0, ' +
        '0, 0, 0, 1)';
      stepValue[layer.name] = transformString;
    });

    stepArray.push(stepValue);
  }

  return stepArray;
}

AboutSlider.prototype.handleControlClick = function (index) {
  if (index === this.activeSlide.index || this.activeSlide.isTransitioning) return false;
  this.activateSlide(index);
}

jQuery(function ($) {
  aboutSlider = new AboutSlider();
});
