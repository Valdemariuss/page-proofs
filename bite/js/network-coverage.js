var handleMapSizes = function() {
    $('.network-coverage-map__map-container').css('width', '100%');
    $('.network-coverage-map__map-container').css('padding', '0');
    $('.network-coverage-map__map-container').css('top', '0');
    $('.network-coverage-map__map-search').css('left', '15px');
    $('.coverage_block_input_holder input').css('position', 'relative');
    $('.coverage_block_input_holder input').css('left', '0');

    if ($(window).width() < 768) $('.locate_user').css('left', '245px');
    else $('.locate_user').css('left', '310px');
    if ($(window).width() < 768) $('.network-coverage-key').css('margin-top', '60px');
    else $('.network-coverage-key').css('margin-top', '150px');
    $('html, body').animate({ scrollTop: 0 }, 1000, 'swing');
}

$('#mapCanvas-coverage').on('click', function () {
    handleMapSizes()
});

$('.network-coverage-recent-works__right-arrow').on('click', function() {
    $('.network-coverage-recent-works__item-list').scrollLeft($('.network-coverage-recent-works__item-list').scrollLeft() + 250);
})

$('.network-coverage-recent-works__left-arrow').on('click', function() {
    $('.network-coverage-recent-works__item-list').scrollLeft($('.network-coverage-recent-works__item-list').scrollLeft() - 250);
})

var handleShowingArrows = function() {
    var amountOfScrollOnLeft = $('.network-coverage-recent-works__item-list').scrollLeft(),
    responsiveContainerWidth = $('.network-coverage-recent-works__item-list-container').width(),
    listWidth = $('.network-coverage-recent-works__item-list')[0].scrollWidth;
    
    if ($(window).width() < 768 || amountOfScrollOnLeft + responsiveContainerWidth === listWidth) $('.network-coverage-recent-works__right-arrow').css('display', 'none');
    else $('.network-coverage-recent-works__right-arrow').css('display', 'flex');

    if ($(window).width() < 768 || amountOfScrollOnLeft === 0) $('.network-coverage-recent-works__left-arrow').css('display', 'none');
    else $('.network-coverage-recent-works__left-arrow').css('display', 'flex');
}

$(document).ready(function() {
    handleShowingArrows();
});

$('.network-coverage-recent-works__item-list').scroll(function() {
    handleShowingArrows();
})

$(document).on('click', function() {
    if ($('.network-coverage-imei__popup').css('display') != 'none')
        $('.network-coverage-imei__popup').css('display', 'none');
});

$('.network-coverage-imei__popup-container>a').on('click', function(event) {
    event.stopPropagation();
    if ($('.network-coverage-imei__popup').css('display') != 'block')
        $('.network-coverage-imei__popup').css('display', 'block');
});

$('.network-coverage-imei__popup').on('click', function(event) {
    event.stopPropagation();
})

$('.network-coverage-imei__check-input-group>button').on('click', function() {
    if ($('.network-coverage-imei__check-input-group>input').val().length === 0)
        $('#network-coverage-imei__device-supports-popup').modal();
    else
        $('#network-coverage-imei__upgrade-popup').modal();
});

$(window).resize(function () {
    handleShowingArrows();
    handleMapSizes();
});
