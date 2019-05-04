/**
 *
 * jQuery linksTimer plugin v1.0.0 - 2015-06-04
 * Author: Vladimir Sartakov  https://vladimirsartakov.moikrug.ru/
 * License: MIT
 * Dependencies: jQuery, jQuery Json, jQuery Cookie, jQuery Countdown
 *
 */

$(function () {

    var storage = $.localStorage,
        timeData = {
            cookieName: 'links-timers',
            // cookieExpires: 30, // cookie live in days
            getOld: function ($link) {
                var self = this,
                    id = $link.data('id'),
                    data = self.getCookie(),
                    storeTime = data && data[id] ? data[id] : null,
                    nowTime = +(new Date),
                    time = storeTime && storeTime > nowTime ? storeTime : null;
                return time;
            },
            getNew: function ($link) {
                var self = this,
                    seconds = parseInt($link.data('time')),
                    id = $link.data('id'),
                    data = self.getCookie(),
                    time = ( +(new Date) + (seconds * 1000) );

                data[id] = time;

                // $.cookie(self.cookieName, $.toJSON(data), {
                //     expires: self.cookieExpires,
                //     path: '/'
                // });

                storage.set(self.cookieName, $.toJSON(data));

                return time;
            },
            getCookie: function () {
                var self = this,
                    // cookieData = $.cookie(self.cookieName),
                    cookieData = storage.get(self.cookieName),
                    // storeData = cookieData ? $.secureEvalJSON(cookieData) : {},
                    storeData = cookieData,
                    data = storeData ? storeData : {};
                return data;
            },
            destroyCookie: function () {
                var self = this;
                // $.cookie(self.cookieName, null);
                storage.remove(self.cookieName);
            }

        };

    function linksTimer($link) {
        this.$link = $link;
        this.create();
        return this;
    }

    linksTimer.prototype = {
        $link : $(),
        $descLink : $(),
        time : null,
        descLinkHref : "",
        isDisabled : false,
        create: function () {
            var self = this,
                $link = self.$link,
                href = $link.attr('href'),
                $descLink = $('<a href="' + href + '" class="link-desc" target="_blank">' + $link.text() + '</a>'),
                time = timeData.getOld($link);

            self.$link = $link;
            self.$descLink = $descLink;
            self.descLinkHref = href;

            $link.before($descLink);

            $descLink.on('click', function (e) {
                //e.preventDefault();
                $link.trigger('click');
            });

            $link.countdown({
                date: +(new Date) + 0,
                render: function (data) {
                    $(this.el).html(this.leadingZeros(data.hours, 2) + ":" + this.leadingZeros(data.min, 2) + ":" + this.leadingZeros(data.sec, 2));
                    self.disableLink();
                },
                onEnd: function () {
                    $(this.el).addClass('ended');
                    self.time = 0;
                    self.disableLink();
                }
            }).on("click", function (e) {
                e.preventDefault();
                self.disableLink();
                if( !self.isDisabled ) {
                    var time = timeData.getNew($link);
                    self.setTime($link, time);
                }
            });

            self.disableLink();
            self.setTime($link, time);            
        },
        disableLink : function() {
            var self = this;
            if ( self.time > 0 ) {
                if( !self.isDisabled ) {
                    self.$descLink.attr({ "href": "javascript:void(0)", "target" :"" })
                        .css("opacity", "0.5")
                        .addClass("disabled-link");
                    self.$link.attr("href", "javascript:void(0)");
                    self.isDisabled = true;
                }                
            } else {
                 if( self.isDisabled ) {
                    self.$descLink.attr({ "href": self.descLinkHref, "target" :"_blank" })
                        .css("opacity", "")
                        .removeClass("disabled-link");
                    self.$link.attr("href", self.descLinkHref);
                    self.isDisabled = false;
                 }
            }
        },
        setTime: function ($link, time) {
            var self = this;
            if ($link && time) {
                $link.removeClass('ended')
                    .data('countdown')
                    .update(time)
                    .start();
            }
            self.time = time;
            // self.disableLink();
        }
    };

    jQuery.fn.linksTimer = function () {
        return this.each(function () {
            this.linksTimer = new linksTimer($(this));
        });
    };

});

$(document).ready(function () {
    $('.countdown.callback').linksTimer();
});
