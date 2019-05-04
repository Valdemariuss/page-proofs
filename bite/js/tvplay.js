/**
 * TV Play page specific JS
 */

(function () { // IIFE
    const BACKGROUND_WIDTH = 2560;
    const BACKGROUND_HEIGHT = 1600;
    const $background = $('.js-tvplay-intro');
    const $rotatedElements = $background.find('[data-rotate]');
    const $parallaxElements = $background.find('[data-parallax]').not($rotatedElements);

    /**
     * Ease value animation
     *
     * @param {object} initlaValue Initial value
     * @param {function} callback Callback function which is called on change
     */
    function easing (initlaValue, callback) {
        let targetValue = initlaValue;
        let value = initlaValue;
        const tension = 0.12;
        const precision = 0.01;

        const tick = function () {
            if (!compare(value, targetValue)) {
                for (let key in value) {
                    value[key] = value[key] * (1 - tension) + targetValue[key] * tension;

                    if (Math.abs(targetValue[key] - value[key]) < precision) {
                        value[key] = targetValue[key];
                    }
                }

                callback(value);
            }

            requestAnimationFrame(tick);
        };

        const compare = function (a, b) {
            for (let key in a) {
                if (a[key] !== b[key]) return false;
            }
            return true;
        };

        requestAnimationFrame(tick);

        return function (value) {
            targetValue = value;
        };
    }

    /**
     * Mouse / touch device rotation input listener
     *
     * @param {function} callback Callback function which is called on change
     */
    function input (callback) {
        const ease = new easing({'x': 0.5, 'y': 0.5}, callback);
        let isTouch = false;
        let mouseX = 0.5;
        let mouseY = 0.5;
        let orientationX = 0;
        let orientationY = 0;
        let scrollY = $(window).scrollTop() / window.innerHeight * 3;

        $(window).on('scroll', function () {
            scrollY = $(window).scrollTop() / window.innerHeight * 3;

            ease({
                'x': mouseX + orientationX,
                'y': mouseY + orientationY + scrollY
            });
        });
        $(document).one('touchstart', function (event) {
            isTouch = true;
        });
        $(document).on('mousemove', function (event) {
            if (!isTouch) {
                mouseX = event.clientX / window.innerWidth - 0.5;
                mouseY = event.clientY / window.innerHeight - 0.5;

                ease({
                    'x': mouseX + orientationX,
                    'y': mouseY + orientationY + scrollY
                });
            }
        });
        $(window).on('deviceorientation', function (e) {
            const event = e.originalEvent;
            const a = event.alpha;
            const b = event.beta;
            const g = event.gamma;

            orientationX = -Math.max(-1, Math.min(1, g / 90 * 4));
            orientationY = Math.max(-1, Math.min(1, b / 90 * 4));

            ease({
                'x': mouseX + orientationX,
                'y': mouseY + orientationY + scrollY
            });
        });
    }

    function resize () {
        const scale = Math.max(window.innerWidth / BACKGROUND_WIDTH, window.innerHeight / BACKGROUND_HEIGHT);
        $background.css('transform', 'translate(-50%, -50%) scale(' + scale + ')');
    }

    function update (input) {
        $rotatedElements.each(function () {
            const $element = $(this);
            const angle = $element.data('rotate');
            const angleY = input.x * angle[1] + $element.data('angleY');
            const angleX = input.y * angle[0] + $element.data('angleX');
            const angleZ = $element.data('angleZ');
            const scale = $element.data('scale');
            const parallaxConfig = $element.data('parallax');
            let parallax = '';

            if (parallaxConfig) {
                parallax = 'translate3d(' + (parallaxConfig[0] * input.x) + 'px, ' + (parallaxConfig[1] * input.y) + 'px, 0)';
            }

            $element.css('transform', parallax + ' rotateY(' + angleY + 'deg) rotateX(' + angleX + 'deg) rotateZ(' + angleZ + 'deg) scale(' + scale[0] + ', ' + scale[1] + ')');
        });

        $parallaxElements.each(function () {
            const $element = $(this);
            const parallaxConfig = $element.data('parallax');

            $element.css('transform', 'translate3d(' + (parallaxConfig[0] * input.x) + 'px, ' + (parallaxConfig[1] * input.y) + 'px, 0)');
        });
    }

    $(window).on('resize', resize);
    input(update);

    resize();
})();

$(function() {

    $('[data-toggle="tooltip"]').tooltip({
        html: true
    });

    let channelsPopupSlider = {
        pager: false,
        item: 1.2,
        controls: false,
        slideMargin: 0
    };

    var isSliderInit = false;

    $('.table-comparison__cell[data-target="#channels-popup-mobile"]').on('click', function() {
        if (isSliderInit) return;

        setTimeout(function() {
            isSliderInit = true;
            $('.channels-popup-slider').lightSlider(channelsPopupSlider);
            $('.channels-popup-slider').animate({ opacity: '1' }, 500);
        }, 500);
    });


    let channelsSlider = $('.tvplay-channels ul').lightSlider({
        pager: false,
        item: 7,
        controls: false,
        responsive: [
            {
                breakpoint: 1280,
                settings: {
                    item: 5
                },
            },
            {
                breakpoint: 768,
                settings: {
                    item: 4
                }
            },
            {
                breakpoint: 540,
                settings: {
                    item: 2.8
                }
            }
        ],
        onAfterSlide: function (el, count) {
            var item = 2.8;

            if ($(window).width() > 540) {
                item = 4
            }

            if ($(window).width() > 768) {
                item = 5
            }

            if ($(window).width() > 1280) {
                item = 7
            }

            if (el.getTotalSlideCount() - item === count) {
                $('.tvplay-channels .lSNext').addClass('is-disabled');
            } else {
                $('.tvplay-channels .lSNext').removeClass('is-disabled');
            }

            if (el.getTotalSlideCount() - item * 2 === count) {
                $('.tvplay-channels .lSPrev').addClass('is-disabled');
            } else {
                $('.tvplay-channels .lSPrev').removeClass('is-disabled');
            }
        },
        onBeforeSlide: function () {
            $('.tvplay-channels [data-toggle="popover"]').popover('hide');
        }
    });

    $('.tvplay-channels').on('mousedown', function() {
        if ($('body').hasClass('tos-touch')) return;
        $('.tvplay-channels [data-toggle="popover"]').popover('hide');
    });

    $('.tvplay-channels .lSPrev').click(function(e) {
        e.preventDefault();
        channelsSlider.goToPrevSlide();
    })

    $('.tvplay-channels .lSNext').click(function(e) {
        e.preventDefault();
        channelsSlider.goToNextSlide();
    })



    let sliderOptions = {
        pager: false,
        item: 6,
        controls: false,
        responsive: [
            {
                breakpoint: 1280,
                settings: {
                    item: 4
                }
            },
            {
                breakpoint: 780,
                settings: {
                    item: 3
                }
            },
            {
                breakpoint: 425,
                settings: {
                    item: 1.5
                }
            }
        ],
        onAfterSlide: function (el, count) {
            var item = 1.5;

            if ($(window).width() > 425) {
                item = 3
            }

            if ($(window).width() > 780) {
                item = 4
            }

            if ($(window).width() > 1280) {
                item = 6
            }

            if (el.getTotalSlideCount() - item === count) {
                $(el).parents('.lSSlideOuter').siblings('.lSAction').find('.lSNext').addClass('is-disabled');
            } else {
                $(el).parents('.lSSlideOuter').siblings('.lSAction').find('.lSNext').removeClass('is-disabled');
            }

            if (count === 0) {
                $(el).parents('.lSSlideOuter').siblings('.lSAction').find('.lSPrev').addClass('is-disabled');
            } else {
                $(el).parents('.lSSlideOuter').siblings('.lSAction').find('.lSPrev').removeClass('is-disabled');
            }
        }
    };

    $('.tvplay-films a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        let target = $(e.target).attr("href");
        initSliderByTab(target);
    });

    $('.tvplay-films a[data-toggle="tab"]').on('hide.bs.tab', function (e) {
        let target = $(e.target).attr("href");

        $(target).find('.tvplay-films__movies').animate({ opacity: '0' }, 800);
    });

    initSliderByTab('#films_tab1');

    function initSliderByTab(id) {
        let $p = $(id).find('div.active');

        if (!$p.length) {
            $p = $(id)
        }

        let el = $p.find('.tvplay-films__movies');

        el.animate({ opacity: '1' }, 800);

        if($(el).hasClass('lightSlider')) {
            return;
        }

        let moviesSlider = $(el).lightSlider(sliderOptions);

        $('.lSPrev', $p).click(function(e) {
            e.preventDefault();
            moviesSlider.goToPrevSlide();
        })

        $('.lSNext', $p).click(function(e) {
            e.preventDefault();
            moviesSlider.goToNextSlide();
        })
    }

    (function() {
        let $p = $('.tvplay-films');

        if ($p.length) {
            $('.tvplay-films__nav a', $p).click(function(e) {
                let $span = $(this).find('span');

                let offset = $span.width() / 2,
                    boundX = $span[0].getBoundingClientRect().x;

                $('.tvplay-films__nav-arrow').css('transform', 'translate(' + (boundX + offset) +'px)');
            });

            $('.tvplay-films__nav .active a', $p).click();
        }
    })();

    (function() {
        let $p = $('.tvplay-plans');

        if ($p.length) {
            let currentColumnIndex = 1;
            let activeClass = 'table-comparison--active';

            let changeColumn = function ($parent, index) {
                if (!index || typeof index === 'object') index = currentColumnIndex;

                if( !$parent ) { return; }

                let $currentColumn = $parent.find('.table-comparison__head .table-comparison__cell:nth-child(' + (index + 1) + ')', $p).eq(0);
                $parent.find('.table-comparison__column', $p).css('transform', 'translate(' + $currentColumn.position().left +'px)');
            };

            $('.tvplay-plans__desktop .table-comparison__cell:not(:first-child)', $p).hover(function(e) {
                e.preventDefault();

                var $parent = $(this).parents('.table-comparison');

                if (currentColumnIndex !== $(this).index()) {
                    currentColumnIndex = $(this).index();
                    changeColumn($parent, currentColumnIndex)
                }
            });

            $('.tvplay-plans__slider .table-comparison .btn-default', $p).click(function(e) {
                e.preventDefault();

                let $table = $(this).parents('.table-comparison');
                currentColumnIndex = $table.index() + 1;

                $table.siblings().removeClass(activeClass);
                $table.addClass(activeClass);
            });

            if ($('.table-comparison--3').length) {
                changeColumn($('.table-comparison--3'));
            }

            if ($('.table-comparison--4').length) {
                changeColumn($('.table-comparison--4'));
            }


            $(window).resize(function() {
                changeColumn();

                if ($(window).width() < 540) {
                    $('.channels-popup').modal('hide');
                }
            });

            let plansSlider = $('.tvplay-plans__slider', $p).lightSlider({
                pager: false,
                item: 1.25,
                controls: false,
                slideMargin: 0
            });
        }
    })();

    $(document).on('scroll', function() {
        if ($('.js-scrollto').is(':visible')) {
            $('.js-scrollto').fadeOut(600);
        }
    });

    $('.tvplay-intro__nav').click(function() {
        $(this).fadeOut(600);
    });

    $('.js-custom-scrollbar').mCustomScrollbar();

    $('.js-youtube-stop').on('click', function() {
        $(this).siblings('iframe')[0].contentWindow.postMessage('{"event":"command","func":"' + 'stopVideo' + '","args":""}', '*');
    });

    var $container = $('.tvplay-features figure'),
        container_w = $container.width(),
        container_h = $container.height(),
        $layer_1 = $container.find('img'),
        $layer_2 = $('.js-parallax-icon');

    $container.on('mousemove.parallax', function(event) {

        var pos_x = event.offsetX,
            pos_y = event.offsetY,
            left  = 0,
            top   = 0;

        left = container_w / 2 - pos_x;
        top  = container_h / 2 - pos_y;

        TweenMax.to(
            $layer_2,
            1,
            {
                css: {
                    transform: 'translateX(' + left / 36 + 'px) translateY(' + top / 18 + 'px)'
                },
                ease:Expo.easeOut,
                overwrite: 'all'
            }
        );

        TweenMax.to(
            $layer_1,
            1,
            {
                css: {
                    transform: 'translateX(' + left / 12 + 'px) translateY(' + top / 6 + 'px)'
                },
                ease:Expo.easeOut,
                overwrite: 'all'
            }
        );
    });

    var offersHeightsArr = [];

    if ($(window).width() < 992) {
        setTimeout(function() {
            offersHeightsArr = offersHeights();
            $('.js-offers-row').css('height', offersHeightsArr[0]);
        }, 300);
    }

    $('.js-offers-toggle').on('click', function() {
        var $row = $('.js-offers-row');
        var $this = $(this).closest('a');

        if ($this.hasClass('is-open')) {
            $this.removeClass('is-open');
            $row.css('height', offersHeightsArr[0]);

            $('html,body').animate({
                scrollTop: $row.offset().top + offersHeightsArr[0] / 2
            },500);
        } else {
            $this.addClass('is-open');
            $row.css('height', offersHeightsArr[1]);
        }
    });

    function offersHeights() {
        var $row = $('.js-offers-row');
        var firstThreeHeight = 0;
        var fullHeight = 0;

        $row.find('.tvplay-offers__item').each(function(index, element) {
            var elHeight = $(element).innerHeight() + 10;

            if (index < 3 ) {
                firstThreeHeight += elHeight;
            }

            fullHeight += elHeight;
        });

        return [firstThreeHeight, fullHeight];
    }


    // fix scroll issue on page load
    // (after page load scroll position on middle)
    setTimeout(function() {
        $('html,body').animate({
            scrollTop: 0
        }, 0);
    }, 160);

});