jQuery(function ($) {
  var TabbedAccordion = function (container) {
    this.$el = $(container);
    this.$accordionItems = this.$el.find('.item');
    this.isNormalizeHeight = this.$el.hasClass('tabbed-content--normalize-height');

    if (this.isNormalizeHeight) {
      this.$accordionContent = this.$accordionItems.find('.item-content');
      this.resizeContent();

      var self = this;

      $(window).on('resize', function() {
        self.resizeContent();
      })
    }

    this.$tabItems = this.$el.find('.tabs li');
    this.attachListeners();
    if (this.isAccordion()) {
      this.clearState();
    } else {
      this.$tabItems.first().click();
    }
  };

  TabbedAccordion.prototype.resizeContent = function () {
    var maxItemHeight = 0;

    this.$accordionContent.css('height', 'auto');

    this.$accordionContent.each(function(index, el) {
      if (!index || $(el).height() > maxItemHeight) {
        maxItemHeight = $(el).height();
      }
    });

    // this.$accordionContent.height(maxItemHeight);
  };

  TabbedAccordion.prototype.attachListeners = function () {
    var self = this;
    this.$tabItems.find('a').on('click', self.changeTab());
    this.$accordionItems.on('click', self.changeAccordion());
  };

  TabbedAccordion.prototype.changeTab =
    function () {
      var self = this;
      return function (event) {

        event.preventDefault();
        self.clearState();
        var targetSectionId = $(event.currentTarget).attr('href');
        $(event.currentTarget).parent('li').addClass('active');
        self.$accordionItems.filter(targetSectionId).addClass('active');
      }
    };


  TabbedAccordion.prototype.changeAccordion = function () {
    var self = this;
    return function (event) {
      if (event.target !== this) {//:before handler
        return;
      }
      event.preventDefault();
      var currentId = $(event.currentTarget).attr('id');
      if (!$(event.currentTarget).hasClass('active')) {
        self.clearState();
        $(event.currentTarget).addClass('active');
      } else {
        self.clearState();
      }
      self.$tabItems.find('a[href$="#' + currentId + '"]').parent('li').addClass('active');
    };

  };

  TabbedAccordion.prototype.clearState = function () {
    this.$accordionItems.filter('.active').removeClass('active');
    this.$tabItems.filter('.active').removeClass('active');
  };

  TabbedAccordion.prototype.isAccordion = function () {
    return (this.$el.find('.tabs:visible').length == 0);
  };


  var tabbedAccordion = new TabbedAccordion('.tabbed-content');

  //bootstrap dropdown menu dirty override
  $('.mobile-menu-item').click(function (event) {
    $(".mobile-menu-name").text($(this).text());
    $(".mobile-menu-item").removeClass('active');
    var self = this;
    setTimeout(function () {
      $(self).addClass('active')
    }, 0);
  });

  //bootstrap dropdown default value
  var dropDownItems;
  if ((dropDownItems = $('.dropdown .dropdown-menu .mobile-menu-item')) && dropDownItems.length) {
    dropDownItems[0].click();
  }


});