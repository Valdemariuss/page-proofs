$(document).ready(()=> {
    // desktop
    (()=>{
        const $menu = $('.main-menu'),
            $items = $('.main-menu__item', $menu),
            $substrate = $('.sticky-header__substrate');

        $items.hover(()=>{
            $substrate.addClass("_show");
        }, ()=>{
            $substrate.removeClass("_show");
        })

    })();
});
