/**
 *
 * jQuery gridSlider plugin v1.0.0 - 2014-10-12
 * Author: Vladimir Sartakov  https://vladimirsartakov.moikrug.ru/
 * License: MIT
 * Dependencies: jQuery, jQuery UI Slider
 *
 */

$(function () {
	'use strict';

	function GridSlider($block, settings){
		// settings
		this.$block = $block;
		this.$box = $('.slider__box', $block).eq(0);
		this.$input = $('input', $block).eq(0);
		this.$labels = $('.slider__item', $block);
		this.values = [0, 1, 2, 3];
		this.positions = [0, 20, 49.5, 100]; // %
		this.index = this.$input.val();
		this.accuracy = 200;
		this.labelActiveClass = 'slider__item_active';

		// callbacks
		this.onChange = function(val){};
		this.onCreate = function(val){};

		if(typeof settings === 'number'){ settings = {index: settings}; } // simple init

		$.extend(this, settings); // allow decorator, mixins

		this._create();

		return this;
	}

	GridSlider.prototype = {
		_create : function(){
			var self = this,
				$box = self.$box,
				lazyChange = self._debounce(function(e, ui){
					self._onChange(e, ui);
				}, 1000, true);

			if(self._checkElements($box)){
				$box.slider({
					animate: true,
					min: 0,
					max: self.accuracy,
					value: self._normalizePositionForUiSlider(self.positions[self.index]),
					create: function(e, ui){
						self._setGridPosition(self.positions[self.index]);
					},
					stop: function(e, ui){
						self._onStop(e, ui);
					},
					change : function(e, ui){
						lazyChange(e, ui);
					}
				});
			}
			self._dataLabels();
			self.onCreate(self.values[self.index]);
		},
		_debounce: function(func, wait, immediate){
			var args,
				result,
				thisArg,
				timeoutId;

			function delayed() {
				timeoutId = null;
				if (!immediate) {
					result = func.apply(thisArg, args);
				}
			}

			return function() {
				var isImmediate = immediate && !timeoutId;
				args = arguments;
				thisArg = this;

				clearTimeout(timeoutId);
				timeoutId = setTimeout(delayed, wait);

				if (isImmediate) {
					result = func.apply(thisArg, args);
				}
				return result;
			};
		},
		_getGridPosition : function(pos){
			var self = this,
				positions = self.positions,
				res = 0,
				lastPoint = positions[0] === 0 ? positions[0]-1 : positions[0]; // page-proofs fix
			for (var i= 0, l = positions.length; i < l; i++) {
				var gridPos = positions[i],
					point = gridPos;
				if( (pos >= lastPoint) && (pos <= point) ){
					var average = (lastPoint + point)/2;
					res = pos > average ? gridPos : (positions[Math.abs(i-1)]);
					break;
				}
				lastPoint = gridPos;
			}
			return res;
		},
		_getIndexByGridPos : function(gridPos){
			var self = this,
				positions = self.positions,
				index = 0;
			for (var i= 0, l = positions.length; i < l; i++) {
				if(positions[i] === gridPos){
					index = i;
					break;
				}
			}
			return index;
		},
		_getValueByGridPos : function(gridPos){
			var self = this,
				values = self.values,
				index = self._getIndexByGridPos(gridPos),
				value = values[index];
			return value;
		},
		_normalizePositionUiSlider : function(value){
			var self = this,
				position = value / (self.accuracy/100);
			return position;
		},
		_normalizePositionForUiSlider : function(value){
			var self = this,
				position = value * (self.accuracy/100);
			return position;
		},
		_setGridPosition : function(gridPos){
			var self = this,
				$box = self.$box,
				position = $box.slider('value');
			if(position !== gridPos){
				$box.slider('value', self._normalizePositionForUiSlider(gridPos));
				self._setActiveLabel(gridPos);
				var value = self._getValueByGridPos(gridPos);
				self._setFormValue(value);
			}
		},
		_onStop : function(e, ui){
			var self = this,
				position = self._normalizePositionUiSlider(ui.value),
				gridPos = self._getGridPosition(position),
				$handle = $(ui.handle);
			$handle.animate({left: gridPos+'%'}, 200, null, function(){
				self._setGridPosition(gridPos);
			});
		},
		_onChange : function(e, ui){
			var self = this,
				position = self._normalizePositionUiSlider(ui.value),
				gridPos = self._getGridPosition(position),
				value = self._getValueByGridPos(gridPos);
			self._setFormValue(value);
		},
		_checkElements : function($elements){
			var res = false;
			if($elements && $elements[0]){
				res = true;
			}
			return res;
		},
		_dataLabels : function(){
			var self = this,
				$labels = self.$labels;
			if( self._checkElements($labels) ){
				var positions = self.positions,
					activeClass = self.labelActiveClass;

				$labels.on('click.gridSlider', function(){
					var $label = $(this);
					if(!$label.hasClass(activeClass)){
						var index =  $labels.index($label);
						self._setGridPosition(positions[index]);
					}
				});

				$labels.each(function(){
					var $label = $(this),
						index = $labels.index($label),
						count = positions.length;

					if( index !== (count-2) && index < (count-2) ){
						var width = positions[index+1] - positions[index];
						$label.width(width + '%');
					}
				});

			}
		},
		_$activeLabel : null,
		_setActiveLabel : function(gridPos){
			var self = this,
				$labels = self.$labels;
			if( self._checkElements($labels) ){
				setTimeout(function(){
					var index = self._getIndexByGridPos(gridPos),
						_$activeLabel = $($labels[index]),
						$oldActiveLabel = self._$activeLabel,
						activeClass = self.labelActiveClass;
					if($oldActiveLabel){
						$oldActiveLabel.removeClass(activeClass);
					}
					_$activeLabel.addClass(activeClass);
					self._$activeLabel = _$activeLabel;
				}, 0);
			}
		},
		_value : null,
		_setFormValue : function(value){
			var self = this,
				$input = self.$input;
			if(self._value !== value){
				if( self._checkElements($input) ){
					$input.attr('value', value);
				}
				self._value = value;
				self.onChange(value);
			}
		}
	};

	jQuery.fn.gridSlider = function(settings){
		return this.each(function(){
			this.gridSlider = new GridSlider($(this), settings);
		});
	};

});
