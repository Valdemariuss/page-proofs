$(function () {

  var DISABLE_ANIMATION_CLASSNAME = 'video-controls__timeline--disable-animation';

  function VideoPlayback (container) {
    var $container = $(container);

    this.$container = $container;
    this.$audioToggle = $container.find('.video-controls__audio');
    this.$timeline = $container.find('.video-controls__timeline');
    this.$timelineProgress = $container.find('.video-controls__timeline__progress');
    this.$video = $container.parent().find('video');
    this.progress = 0;

    this.$audioToggle.on('click', this.toggleAudio.bind(this));

    this.$video.on('loadeddata play playing canplaythrough', this.checkVideoState.bind(this));
    this.$video.on('timeupdate durationchange', this.handleCurrentTimeChange.bind(this));

    this.$timeline.on('mousedown touchstart', this.handleTimelineClickStart.bind(this));

    this.checkVideoState();
  }

  VideoPlayback.prototype.getVideo = function () {
    // Support for multiple videos, eg. one for mobile, one for desktop
    return this.$video.filter(':visible').get(0);
  };

  VideoPlayback.prototype.toggleAudio = function () {
    var video = this.getVideo();
    var muted = video.muted = !video.muted;
    this.$audioToggle.toggleClass('video-controls__audio--muted', muted);
  };

  VideoPlayback.prototype.checkVideoState = function () {
    if (this.getVideo().readyState === HTMLVideoElement.HAVE_ENOUGH_DATA) {
      this.$container.removeClass('disabled');
    }
  };

  VideoPlayback.prototype.handleCurrentTimeChange = function () {
      var video = this.getVideo();
      var progress = video.duration ? video.currentTime / video.duration : 0;

      this.updateProgressBar(progress);
  };

  VideoPlayback.prototype.updateProgressBar = function (progress) {
    var $timeline = this.$timeline;

    if (progress < this.progress && !$timeline.hasClass(DISABLE_ANIMATION_CLASSNAME)) {
      // Prevent animation from end to start during loop
      $timeline.addClass(DISABLE_ANIMATION_CLASSNAME);

      setTimeout(function () {
        $timeline.removeClass(DISABLE_ANIMATION_CLASSNAME);
      }, 60);
    }

    this.$timelineProgress.css('width', progress * 100 + '%');
    this.progress = progress;
  };





  /**
   * On progress bar mouse down start tracking mouse movement
   *
   * @param {object} event Event
   * @protected
   */
  VideoPlayback.prototype.handleTimelineClickStart = function (event) {
    var eventNameMove = event.type === 'mousedown' ? 'mousemove' : 'touchmove';
    var eventNameEnd = event.type === 'mousedown' ? 'mouseup' : 'touchend';

    event.preventDefault();

    $(document).on(eventNameMove + '.video-controls', this.handleTimelineClick.bind(this));
    $(document).on(eventNameEnd + '.video-controls', this.handleTimelineClickStop.bind(this));

    this.$timeline.addClass(DISABLE_ANIMATION_CLASSNAME);
    this.getVideo().pause();

    this.handleTimelineClick(event);
  };

  VideoPlayback.prototype.handleTimelineClickStop = function () {
    $(document).off('.video-controls');
    this.$timeline.removeClass(DISABLE_ANIMATION_CLASSNAME);
    this.getVideo().play();
  };

  VideoPlayback.prototype.handleTimelineClick = function (event) {
    var $timeline = this.$timeline;
    var video = this.getVideo();
    var inputX = (event.type === 'mousemove' || event.type === 'mousedown' ? event.clientX : event.originalEvent.touches[0].clientX);
    var percentage = Math.min(1, Math.max(0, (inputX - $timeline.offset().left) / $timeline.width()));
    var position = video.duration * percentage;

    this.updateProgressBar(percentage);
    video.currentTime = video.duration * percentage;
  };


  $('.video-controls').each(function () {
    new VideoPlayback(this);
  });

});