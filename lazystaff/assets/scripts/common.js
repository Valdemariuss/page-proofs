$(function () {
	'use strict';

	function checkboxsRadios($box) {
		if ($box) {
			setTimeout(function () {
				var $inp = $('input[type="radio"]', $box),
					$label = $('label', $box),
					isRadio = $box.hasClass('radio-item'),
					typePrefix = isRadio ? 'radio' : 'checkbox',
					id = typePrefix + '-' + new Date().getTime();
				$box.removeClass(typePrefix + '-item').addClass(typePrefix);
				$inp.insertBefore($label).addClass(typePrefix + '__input').attr('id', id);
				$label.addClass(typePrefix + '__label').attr('for', id);
			}, 0);
		}
	}

	jQuery.fn.checkboxsRadios = function (settings) {
		return this.each(function () {
			checkboxsRadios($(this), settings);
		});
	};

});

$(document).ready(function () {
	$('.radio-item, .checkbox-item').checkboxsRadios();
});
