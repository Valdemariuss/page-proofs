$(document).ready(()=>{
    const $footer = $('.footer:eq(0)'),
        $menus = $('.footer-menu', $footer),
        $doc = $(document),
        $goDesktop = $('.footer__go-desktop'),
        $metaViewport = $('head meta[name=viewport]'),
        $formBox = $('.footer-subscription-form', $footer),
        $form = $('.footer-subscription-form__form', $formBox),
        $formInp = $('.footer-subscription-form__inp', $formBox),
        $formError = $('.footer-subscription-form__error', $formBox),
        $formSuccess = $('.footer-subscription-form__success', $formBox);
        // isTouch = ('ontouchstart' in window) || navigator.msMaxTouchPoints;

    // if(isTouch){
    //     $formInp.attr('type', 'email');
    // }

    $menus.each( function() {
        const $ul = $(this),
            $hd = $('.footer-menu__hd', $ul),
            $li = $('.footer-menu__item', $ul);

        $hd.on('click', (e) => {
            if( $doc.width() <= 590 ){
                $li.slideToggle(400);
                $ul.toggleClass('_open');
            }
        });
    });

    $goDesktop.on('click', ()=>{
        $metaViewport.attr('content', 'width=1200');
    });

    $form.on('submit.subscriptionForm', (e)=>{
        const val = $.trim($formInp.val()),
            emailReg = /^[\w]{1}[\w-\.]*@[\w-]+\.[a-z]{2,4}$/i,
            isValid = new RegExp(emailReg).test(val);

        if(isValid){
            $form.hide();
            $formError.hide();
            $formSuccess.show();
        } else {
            $formError.show();
            $formSuccess.hide();
        }

        e.preventDefault();
        return false;
    });
});