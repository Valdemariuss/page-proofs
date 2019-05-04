$(function () {
  var $container = $('#warranty-check');

  function showResult () {
    $container.addClass('warranty-check--result');
  }

  if ($container.length) {
    // Warranty check animation
    var $animation = $container.find('.animation__canvas');

    bodymovin.loadAnimation({
      container: $animation.get(0),
      renderer: 'svg',
      loop: $animation.data('animLoop'),
      autoplay: $animation.data('animAutoplay'),
      path: $animation.data('animPath')
    });

    // Form submit / show results
    var $form = $container.find('form');

    $form.on('submit', function (event) {
      // @TODO Ajax
      showResult();
      event.preventDefault();
    });
  }

})