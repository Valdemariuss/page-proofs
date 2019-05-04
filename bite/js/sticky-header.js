$(document).ready(()=>{
    const $header = $('.sticky-header:eq(0)'),
        $substrate = $('.sticky-header__substrate'),
        $doc = $(document),
        docEl = document.documentElement,
        $win = $(window),
        $body = $('body'),
        scrollClass = '_scroll',
        $search = $('.main-search', $header),
        $searchInp = $('.main-search__inp', $search),
        $searchRes = $('.sticky-header__search-result', $header),
        $mainMenu = $('.main-menu', $header),
        sensitivity = 1,
        maxDelta = 1000,
        ua = window.navigator.userAgent.toLowerCase(),
        isIe = (/edge/gi).test(ua) || (/trident/gi).test(ua) || (/msie/gi).test(ua);

    let $mobHeader,
        $mobSubstrate,
        isScroll,
        isHide,
        nowScrollTop = 0,
        lastTopScroll = 0,
        docWidth,
        isMobile,
        isDocScroll,
        startHideTop = parseInt( $header.outerHeight() ),
        scrollFrequency = isIe ? 600 : 100, // ms
        isMobHdOpen = false,
        searchShowSubstrate = false,
        hideSearchSubstrateTimer;


    $win.on('resize.stickyHeader', ()=>{
        const _$header = isMobile && $mobHeader ? $mobHeader : $header;
        docWidth = $doc.width(),
        isMobile = docWidth < 1200;
        isHide = _$header.hasClass('_hide');
        startHideTop = parseInt( _$header.outerHeight() );
    }).trigger('resize.stickyHeader');


    function setScrollState(){
        if(isMobile) { return; }

        if(isDocScroll) {
            if(nowScrollTop > 20) {
                if(!isScroll){
                    $header.addClass(scrollClass);
                    isScroll = true;
                }
            } else if(isScroll) {
                $header.removeClass(scrollClass);
                isScroll = false;
            }
        }
    }

    function hideMenuOnDown(delta, _$header, _$substrate){
        if(delta >= sensitivity){
            if(!isHide) {
                if(nowScrollTop > startHideTop) {
                    if(!isMobHdOpen) {
                        requestAnimationFrame(()=>{
                            _$header.addClass('_hide');
                            _$substrate.removeClass('_show');
                        });
                        isHide = true;
                    }
                }
            }
        } else if( delta <= -sensitivity) {
            if(isHide) {
                requestAnimationFrame(()=>{
                    _$header.removeClass('_hide');
                });
                isHide = false;
            }
        }
    }

    function onScrollCommon() {
        nowScrollTop = $win.scrollTop();
        isDocScroll = (docEl.scrollHeight === docEl.offsetHeight);
        const delta = nowScrollTop - lastTopScroll,
            _$header = isMobile && $mobHeader ? $mobHeader : $header,
            _$substrate = isMobile && $mobSubstrate ? $mobSubstrate : $substrate;

        if( ((delta < maxDelta) && (delta > -maxDelta))
            || (isDocScroll && (nowScrollTop < 100)) ) {
            hideMenuOnDown(delta, _$header, _$substrate);
            setScrollState(delta);
        }
        lastTopScroll = nowScrollTop;
    }

    const onScrollCommonThrottled = _.throttle(onScrollCommon, scrollFrequency);

    $win.on('scroll.stickyHeader', onScrollCommonThrottled).trigger('scroll.stickyHeader');
    setInterval(onScrollCommonThrottled, 1000);

    // search
    function searchInit($search, $searchInp, $searchRes, $substrate) {

        function hideResult() {
            $searchRes.removeClass('_show');
            searchShowSubstrate = false;
            hideSearchSubstrateTimer = setTimeout(()=>{
                if(!searchShowSubstrate){
                    $substrate.removeClass('_show');
                }
            }, 200);

            if(isMobile) {
                isMobHdOpen = false;
            }
        }

        function showResult() {
            searchShowSubstrate = true;
            $substrate.addClass('_show');
            $searchRes.addClass('_show');

            if(isMobile) {
                isMobHdOpen = true;
            }
        }

        function setSearchActive() {
            const val = $searchInp.val().trim(),
                isVal = val && val.length,
                isRes = isVal && (val.length > 1);

            if(isVal){
                $search.addClass('_active');
            } else {
                $search.removeClass('_active');
            }

            if(isRes){
                showResult();
            } else {
                hideResult();
            }
        }
        setSearchActive();

        $searchInp.on('focusin', ()=>{
            $doc.on('keydown.searchInit', (e)=>{
                if(e.keyCode === 27){
                    hideResult();
                    $searchInp.blur();
                }
            });
        });

        $searchInp.on('focusout', ()=>{
            hideResult();
            $doc.off('keydown.searchInit');
        });

        $searchInp.on('input change focusin', setSearchActive);

        $search.on('reset', ()=>{
            setTimeout(setSearchActive, 50);
        });
    }
    searchInit($search, $searchInp, $searchRes, $substrate);

    // lang and user menu
    function langAndUserMenuInit($header, isMobile){
        const $langMenu = $('.lang-menu', $header),
            $langBtn = $('.lang-menu__current', $langMenu);

        if(isMobile){
            $langBtn.on('click', ()=>{
                $langMenu.toggleClass('_open');
            });
        }

        // user menu
        const $userMenu = $('.user-menu__item._submenu', $header),
            $userMenuBtn = $('.icon-arrow-down, .icon-user', $userMenu),
            $userMenuLink = $('.user-menu__link', $userMenu);

        $userMenuBtn.add($userMenuLink).on('click', (e)=>{
            if( !$userMenu.hasClass('_show') ){
                $doc.trigger('click');
            }
            $userMenu.toggleClass('_show');
            e.stopPropagation();
            e.preventDefault();
            return false;
        });

        $doc.on('click', (e)=>{
            const el = $(e.target);

            if ( !$userMenu.has(el).length ) {
                $userMenu.removeClass('_show');
            }

            if ( !$langMenu.has(el).length ) {
                $langMenu.removeClass('_open');
            }

        });
    }
    langAndUserMenuInit($header);

    // main menu
    (()=>{
        $('.main-menu__close', $mainMenu).on('click', function() {
            const $item = $(this).parents('.main-menu__item:eq(0)');
            $mainMenu.addClass('_close');
            $item.mouseout();
            $mainMenu.mouseout();

            setTimeout(()=>{
                $mainMenu.removeClass('_close');
            }, 900);
        });
    })();


    // mobile
    function mobileMainMenu($menu){
      const $items = $('.main-menu__item', $menu),
            $links = $('.main-menu__link', $menu),
            anSpeed = 400;

        $links.wrap('<div class="main-menu__btn"/>');

        $items.each( function() {
            const $item = $(this),
                $btn = $('.main-menu__btn', $item),
                $wrapper = $('.main-menu__wrapper', $item),
                openClass = "_open",
                $uls = $('.icons-menu, .links-menu', $item);

            $btn.on('click', (e) => {
                $wrapper.slideToggle(anSpeed);
                $item.toggleClass(openClass);
            });

            $uls.each( function() {
                const $ul = $(this),
                    $hd = $('.icons-menu__hd, .links-menu__hd', $ul),
                    $li = $('.icons-menu__item, .links-menu__item', $ul);

                $hd.on('click', (e) => {
                    $li.slideToggle(anSpeed);
                    $ul.toggleClass(openClass);
                });
            });
        });
    }

    function mobileInit() {
        $mobHeader = $('.sticky-header-mobile:eq(0)');
        $mobSubstrate = $('.sticky-header-mobile__substrate', $mobHeader);
        const $mobHdMain = $('.sticky-header-mobile__main', $mobHeader),
            $mobHdMainTemp = $(document.createDocumentFragment()),
            $userMenu = $('.user-menu', $header).clone().prependTo($mobHdMainTemp),
            $mobSearchBtn = $('<div class="mobile-main-search__btn" />').prependTo($mobHdMainTemp),
            $mobSearchBtnIcon = $('.main-search__submit .icon', $header).clone().appendTo($mobSearchBtn),
            $logo =  $('.main-logo', $header).clone().prependTo($mobHdMainTemp),
            $mobMenu = $('.mobile-main-menu', $mobHdMain),
            $mobMenuAndSubstrate = $mobMenu.add($mobSubstrate),
            $mobMenuBox = $('.mobile-main-menu__box', $mobMenu),
            $mobMenuBtns = $('.mobile-main-menu__btn-show, .mobile-main-menu__btn-hide', $mobMenu),
            $stickyMenus = $('.sticky-menu', $header),
            $tabsMenu = $stickyMenus.eq(0).clone().addClass('mobile-main-menu__tabs').appendTo($mobMenuBox),
            $mobMainMenu = $mainMenu.clone().appendTo($mobMenuBox),
            $mobMenuFooter = $('<div class="mobile-main-menu__footer" />').appendTo($mobMenuBox),
            $footerMenu = $stickyMenus.eq(1).clone().appendTo($mobMenuFooter),
            $langMenu = $('.lang-menu', $header).clone().appendTo($mobMenuFooter),
            $searchFormBox = $('.sticky-header-mobile__search-form', $mobHeader),
            $searchForm = $('.main-search', $header).clone().appendTo($searchFormBox),
            $mobSearchInp = $('.main-search__inp', $searchForm),
            $mobSearchRes = $('.sticky-header-mobile__search-result', $mobHeader),
            $mobSearchResAndSubstrate = $mobSearchRes.add($mobSubstrate),
            $searchResFake = $( $('.sticky-header__search-result .sticky-header__container', $header).html() ).appendTo($mobSearchRes),
            $userSubMenu = $('.user-menu__item._submenu', $userMenu)
            $userSubMenuBtn = $(' > .icon, .user-menu__link .icon-user', $userSubMenu),
            $userSubMenuHd = $('.user-submenu__hd', $userSubMenu),
            $userMenuBtnHide = $('<div class="user-submenu__hide"/>').appendTo($userSubMenuHd),
            $userMenuBtnHideIcon = $('.mobile-main-menu__btn-hide .icon', $mobMenu).clone().appendTo($userMenuBtnHide),
            $userSubMenuAndSubstrate = $userSubMenu.add($mobSubstrate),
            $allToClose = $mobMenuAndSubstrate.add($mobSearchResAndSubstrate).add($userSubMenu);

        $mobHdMain.prepend($mobHdMainTemp);

        function _toggleClass($el, classN){
            $el.toggleClass(classN, ()=> {
                isMobHdOpen = $el.hasClass(classN);
            });
        }

        function destroySearch() {
            clearTimeout(hideSearchSubstrateTimer);
            searchShowSubstrate = false;
            $mobHeader.removeClass('_search');
        }

        $mobSubstrate.on('click', ()=>{
            $allToClose.removeClass('_show');
            isMobHdOpen = false;
        });

        $mobMenuBtns.on('click', ()=>{
            destroySearch();
            _toggleClass($mobMenu, '_show');
            $mobSubstrate.toggleClass('_show', $mobMenu.hasClass('_show'));
        });

        $userSubMenuBtn.on('click', ()=>{
            destroySearch();
            $mobSubstrate.addClass('_show');
            isMobHdOpen = true;
        });

        $userMenuBtnHide.on('click', ()=>{
            $userSubMenuAndSubstrate.removeClass('_show');
            isMobHdOpen = false;
        });

        $mobSearchBtn.on('click', ()=>{
            $mobHeader.toggleClass('_search');
            if( $mobHeader.hasClass('_search') ){
                setTimeout(()=>{
                    $mobSearchInp.focus();
                }, 500);
            } else {
                $mobSearchResAndSubstrate.removeClass('_show');
            }
        });

        mobileMainMenu($mobMainMenu);
        langAndUserMenuInit($mobHeader, true);
        searchInit($searchForm, $mobSearchInp, $mobSearchRes, $mobSubstrate);

        $win.on('resize.mobStickyHeader', ()=>{
            if(isMobile) {
                startHideTop = parseInt( $mobHeader.outerHeight() );
            }
        }).trigger('resize.mobStickyHeader');
    }

    $win.on('resize.mobileStickyHeader', ()=>{
        const isMob = $doc.width() < 1200;
        if(isMob){
            mobileInit();
            $win.off('resize.mobileStickyHeader');
        }
    }).trigger('resize');
});