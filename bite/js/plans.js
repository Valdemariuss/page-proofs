jQuery(function ($) {

  $('.scroll-back').click(function () {
    $('html, body').animate({scrollTop: 0}, 800);
  });

  $('.tabDropdown').click(function () {
    $(this).toggleClass('expanded');
  });

  $('.video-button').click(function () {
    $('#videoPopup').show();
  });
  $('#videoPopup').click(function () {
    $(this).hide();
  });

});