// Additional functions for extension of standards.
if ((typeof $) != 'object' || (typeof $) != 'function') {
    function $(id) {
        if(!id) return false;
        else {
            var obj = id;
            switch(typeof id) {
                case 'string': obj = document.getElementById(id); break;
            }
        return obj;
        }
    }
}

/*
*	Track — id of parent elenemt
*	Tracker — id of tracked element
*	OnUpdate — function whitch calls on each value change
*	OnComplete — function whitch calls on end of the drag
*	FingerOffset — distance between mouse pointer and corner tracker's edge
*	FormatNumbers — lead numders in hairlines with spaces
*	Min & Max — range of vaues
*	MinSpace — minimum difference between Min & Max
*	RoundTo — values will be rounded to this value
*	Margins — indent between Track & Tracker
*	AllowedValues — force Tracker to stick to the values
*
*	OnUpdate — function whitch called each time, when Tracker moved
*	OnComplete — function whitch called when user stop draging
*/
var TrackBars = [];


function cDoubleTrackBar(Track, Tracker, Settings) {
	switch (typeof Track) {
		case 'string': this.Track = document.getElementById(Track); break;
		case 'object': this.Track = Track; break;
	}
	switch (typeof Tracker) {
		case 'string': this.Tracker = document.getElementById(Tracker); break;
		case 'object': this.Tracker = Tracker; break;
	}
	if (!Track || !Tracker)
		return false;
	this.OnUpdate = Settings.OnUpdate;
	this.OnComplete = Settings.OnComplete;
	this.FingerOffset = Settings.FingerOffset || 0;
	this.FormatNumbers = Settings.FormatNumbers || false;
	this.Min = Settings.Min || 0;
	this.Max = Settings.Max || 100;
	this.MinSpace = Settings.MinSpace || 0;
	this.RoundTo = Settings.RoundTo || 1;
	this.Margins = Settings.Margins || 0;
	this.IsContinuous = Settings.IsContinuous || false;
	this.AllowedValues = Settings.AllowedValues || false;
	this.Disabled = (typeof Settings.Disabled != 'undefined') ? Settings.Disabled : false;

	if (this.Min >= this.Max)
		this.Max = this.Min + 1;
	this.MinPos = this.Min;
	this.MaxPos = this.Max;
	if (this.Max - this.Min < this.MinSpace)
		this.MinSpace = this.Max - this.Min;
	if (this.Max - this.Min < this.RoundTo)
		this.RoundTo = this.Max - this.Min;
	this.MinSpace = Math.ceil(this.MinSpace / this.RoundTo) * this.RoundTo;

	if (this.IsContinuous) {
		this.ExpRoundTo = Settings.ExpRoundTo || 1;
		this.ScaleRoundTo = Settings.ScaleRoundTo || 1;
		this.ExpMultiplier = Settings.ExpMultiplier || 5;
		this.MinExpValue = this.Min;
		this.MaxExpValue = this.Max;
		this.Range = this.Max - this.Min;
		this.CMax = this.Max - this.Min;
		this.MaxExp = Math.exp(this.ExpMultiplier);
	}

	this.Track.style.width = (this.Track.clientWidth || this.Track.offsetWidth) + 'px';
	this.OnTrackMouseDown = this.bindAsEventListener(this.TrackMouseDown);
	this.OnDocumentMouseMove = this.bindAsEventListener(this.DocumentMouseMove);
	this.OnDocumentMouseUp = this.bindAsEventListener(this.DocumentMouseUp);

	this.bindEvent(this.Track, 'mousedown', this.OnTrackMouseDown);

	this.TrackerLeft = 0;
	this.UpdateTracker(this.Track.offsetWidth + this.FingerOffset);
	
	if (Settings.LeftInput) {
		switch (typeof Settings.LeftInput) {
		case 'string': this.LeftInput = $(Settings.LeftInput); break;
		case 'object': this.LeftInput = Settings.LeftInput;
		}
		if(this.LeftInput.value && this.LeftInput.value > 0 && this.LeftInput.value < this.Max)
		    this.SetTrackerValue('left', this.LeftInput.value);
	}

	if (Settings.RightInput) {
		switch (typeof Settings.RightInput) {
		case 'string': this.RightInput = $(Settings.RightInput); break;
		case 'object': this.RightInput = Settings.RightInput;
		}
		var leftValue = (Settings.LeftInput && Settings.LeftInput.value) ? Settings.LeftInput.value : 0;
		if(this.RightInput.value && this.RightInput.value > leftValue && this.RightInput.value < this.Max)
		    this.SetTrackerValue('right', this.RightInput.value);
    }

	if (typeof this.OnUpdate == 'function') {
		this.OnUpdate.call(this);
	}
}

cDoubleTrackBar.prototype = {

	TrackMouseDown: function(event) {
		this.TrackerLeft = this.Tracker.offsetLeft - this.Margins;
		this.TrackerRight = this.TrackerLeft + this.Tracker.offsetWidth;

		this.TrackerOffsets = this.getOffsets(this.Track);

		var X = event.clientX + document.documentElement.scrollLeft;
		X -= this.TrackerOffsets[0];

		this.Left = Math.abs(this.TrackerLeft - X + this.Margins) <= Math.abs(this.TrackerRight - X + this.Margins);

		if (typeof this.Disabled == 'function') {
			if (this.Disabled.call(this))
				return true;
		} else if (this.Disabled)
			return true;

		this.UpdateTracker(X);

		this.bindEvent(document, 'mousemove', this.OnDocumentMouseMove);
		this.bindEvent(document, 'mouseup', this.OnDocumentMouseUp);

		return this.stopEvent(event);
	},
	DocumentMouseMove: function(event) {
		this.UpdateTracker(event.clientX + document.documentElement.scrollLeft - this.TrackerOffsets[0]);
		return this.stopEvent(event);
	},
	DocumentMouseUp: function(event) {
		this.unbindEvent(document, 'mousemove', this.OnDocumentMouseMove);
		this.unbindEvent(document, 'mouseup', this.OnDocumentMouseUp);

		if (typeof this.OnComplete == 'function') {
			this.OnComplete.call(this);
		}
		return this.stopEvent(event);
	},
	UpdateTracker: function(X) {
		var _LogicWidth = this.Track.offsetWidth - this.Margins * 2 - 1;
		var _minSpace = Math.floor(_LogicWidth * this.MinSpace / (this.Max - this.Min));
		var _oldMin = this.MinPos;
		var _oldMax = this.MaxPos;

		X -= this.Margins;
		if (this.Left) {
			X += this.FingerOffset;
			this.TrackerLeft = Math.max(0, Math.min(this.TrackerRight - _minSpace - 1, X));
			this.MinPos = Math.round((this.Min + this.TrackerLeft * (this.Max - this.Min) / _LogicWidth) / this.RoundTo) * this.RoundTo;
			if (this.MinSpace >= this.MaxPos - this.MinPos) {
				this.MinPos = this.MaxPos - this.MinSpace;
			}
			if (this.AllowedValues) {
				this.TrackerLeft = Math.round(_LogicWidth * (this.MinPos - this.Min) / (this.Max - this.Min));
			}
			if (this.IsContinuous) {
				this.MinExpValue = Math.round(((Math.exp(((this.MinPos - this.Min) / this.CMax) * this.ExpMultiplier) - 1) / (this.MaxExp - 1) * this.CMax + this.Min) / this.ExpRoundTo) * this.ExpRoundTo;
			}
		} else {
			X -= this.FingerOffset;
			this.TrackerRight = Math.max(this.TrackerLeft + _minSpace + 1, Math.min(_LogicWidth + 1, X));
			this.MaxPos = Math.round((this.Min + (this.TrackerRight - 1) * (this.Max - this.Min) / _LogicWidth) / this.RoundTo) * this.RoundTo;
			if (this.MinSpace >= this.MaxPos - this.MinPos) {
				this.MaxPos = this.MinPos + this.MinSpace;
			}
			if (this.AllowedValues) {
				this.TrackerRight = Math.round(_LogicWidth * (this.MaxPos - this.Min) / (this.Max - this.Min)) + 1;
			}
			if (this.IsContinuous) {
				this.MaxExpValue = Math.round(((Math.exp(((this.MaxPos - this.Min) / this.CMax) * this.ExpMultiplier) - 1) / (this.MaxExp - 1) * this.CMax + this.Min) / this.ExpRoundTo) * this.ExpRoundTo;
			}
		}
		this.Tracker.style.width = (this.TrackerRight - this.TrackerLeft) + 'px';
		this.Tracker.style.left = (this.Margins + this.TrackerLeft) + 'px';

		if (typeof this.OnUpdate == 'function')
			if (!this.AllowedValues || (this.AllowedValues && (_oldMax != this.MaxPos || _oldMin != this.MinPos)))
			this.OnUpdate.call(this);
	},
	AddHairline: function(pos) {
		var _Touch = this.Track.appendChild(document.createElement('div'));
		var _LogicWidth = this.Track.offsetWidth - this.Margins * 2 - 1;
		_Touch.style.left = this.Margins + _LogicWidth / (this.Max - this.Min) * (pos - this.Min)  + 'px';



		/* Arhangel */			
		var classText = 'touch'; if( pos == this.Max ) classText+= ' Rtouch';  else if ( pos == this.Min ) classText+= ' Ltouch';
		_Touch.className = classText;
		/* End Arhangel */
		
		
		if (this.IsContinuous) pos = Math.round(((Math.exp(((pos - this.Min) / this.CMax) * this.ExpMultiplier) - 1) / (this.MaxExp - 1) * this.CMax + this.Min) / this.ScaleRoundTo) * this.ScaleRoundTo;
		_Touch.innerHTML = "<span>" + (this.FormatNumbers ? this.leadSpaces(pos) : pos) + "</span>";		
	},
	AutoHairline: function(num) {
		if (num >= 1)
			this.AddHairline(this.Min);
		if (num >= 2)
			this.AddHairline(this.Max);
		if (num >= 3) {
			num--;
			var diff = this.Max - this.Min;
			var roundTo = [10, 20, 50, 100, 250, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 250000, 500000, 1000000];
			var DoRound = 1;
			for (var i = 0; roundTo[i]; i++) {
				DoRound = roundTo[i] / 10;
				if (roundTo[i] > diff)
					break;
			}
			for (var i = 1; i < num; i++) {
				var val = this.Min + diff / num * i;
				val = Math.round(val / DoRound) * DoRound;
				this.AddHairline(val);
			}
		}
	},
	SetTrackerValue: function(type, value) {
		if (!type) return false;
		else {
			if (!value) value = '';
			else value = parseInt(value);

			var _LogicWidth = this.Track.offsetWidth - this.Margins * 2 - 1;

			switch (type) {
				case 'left':
					if (value == '') this.MinPos = this.Min;

					if (!this.IsContinuous && (this.Min <= value && value <= this.MaxPos)) {
						this.MinPos = value;
					}
					else {
						var position = (Math.log(1 + (value - this.Min) / this.CMax * (this.MaxExp - 1)) / this.ExpMultiplier * this.CMax + this.Min) || this.Min;
						if (this.Min <= position && position <= this.MaxPos) { this.MinPos = position; this.MinExpValue = value; }
						else if (this.Min >= position) { this.MinPos = this.Min; this.MinExpValue = this.Min; }
					}

					this.TrackerLeft = Math.round(_LogicWidth * (this.MinPos - this.Min) / (this.Max - this.Min));
					break;
				case 'right':
					if (value == '') this.MaxPos = this.Max;

					if (!this.IsContinuous && (this.Max >= value && value >= this.MinPos)) {
						this.MaxPos = value;
					}
					else {
						var position = (Math.log(1 + ((value - this.Min) / this.CMax) * (this.MaxExp - 1)) / this.ExpMultiplier * this.CMax + this.Min) || this.Max;
						if (this.Max >= position && position >= this.MinPos) { this.MaxPos = position; this.MaxExpValue = value; }
						else if (this.Max <= position) { this.MaxPos = this.Max; this.MaxExpValue = this.Max; }
					}
					this.TrackerRight = Math.round(_LogicWidth * (this.MaxPos - this.Min) / (this.Max - this.Min)) + 1;
					break;
			}

			this.Tracker.style.width = (this.TrackerRight - this.TrackerLeft) + 'px';
			this.Tracker.style.left = (this.Margins + this.TrackerLeft) + 'px';

			this.OnUpdate.call(this);
		}
	},
	getOffsets: function(element) {
		var valueT = 0, valueL = 0;
		do {
			valueT += element.offsetTop || 0;
			valueL += element.offsetLeft || 0;
			element = element.offsetParent;
		} while (element);
		return [valueL, valueT];
	},
	leadSpaces: function(numb) {
		var res = '';
		numb = numb.toString();
		var l = numb.length;
		for (var i = l; i > 0; i--)
			if ((l - i) % 3 == 2)
			res = '&nbsp;' + numb.charAt(i - 1) + res;
		else
			res = numb.charAt(i - 1) + res;
		return res;
	},
	bindEvent: function(element, event, callBack) {
		if (element.addEventListener) {
			element.addEventListener(event, callBack, false);
		} else {
			element.attachEvent('on' + event, callBack);
		}
	},
	unbindEvent: function(element, event, callBack) {
		if (element.removeEventListener) {
			element.removeEventListener(event, callBack, false);
		} else if (element.detachEvent) {
			element.detachEvent('on' + event, callBack);
		}
	},
	bindAsEventListener: function(callBack) {
		var _object = this;
		return function(event) {
			return callBack.call(_object, event || window.event);
		}
	},
	stopEvent: function(event) {
		if (event.preventDefault) {
			event.preventDefault();
			event.stopPropagation();
		} else {
			event.returnValue = false;
			event.cancelBubble = true;
		}
		return false;
	}
}

function createDefaultDoubleTrackBar(Settings) {
	if (!Settings || !Settings.DoubleTrackBarName || !Settings.Max || !Settings.Step) return false;
	else {
		try {
			$(Settings.DoubleTrackBarName).DoubleTrackBar = new cDoubleTrackBar(Settings.DoubleTrackBarName, Settings.DoubleTrackBarName + '-Tracker', {
				OnUpdate: function() {
					this.Tracker.style.backgroundPosition = -this.TrackerLeft + 'px center';
					if (this.fix)
						for (var i in this.fix)
							if (this.fix[i].style) this.fix[i].style.left = (this.TrackerRight - this.TrackerLeft) + this.fixCorrection + 'px';
					var minValue = this.IsContinuous ? this.MinExpValue : this.MinPos;
					var maxValue = this.IsContinuous ? this.MaxExpValue : this.MaxPos;
					if (this.LeftInput) this.LeftInput.value = (minValue > this.Min) ? minValue : '';
					if (this.RightInput) this.RightInput.value = (maxValue < this.Max) ? maxValue : '';
				},
				OnComplete: function() {
					if (this.FilterUpdate) YFilter.setOnChange(YFilter);
				},
				IsContinuous: Settings.IsContinuous || false,
				Min: Settings.Min || 0,
				Max: Settings.Max,
				FingerOffset: 5,
				MinSpace: 0,
				RoundTo: Settings.Step,
				Margins: Settings.Margins || 30,
				FormatNumbers: true,
				AllowedValues: true,
				LeftInput: Settings.LeftInput,
				RightInput: Settings.RightInput,
				ScaleRoundTo: Settings.ScaleRoundTo || Settings.Step,
				ExpRoundTo: Settings.ExpRoundTo || Settings.Step,
				ExpMultiplier: Settings.ExpMultiplier
			});
			var curTrackBar = $(Settings.DoubleTrackBarName).DoubleTrackBar;
			curTrackBar.AutoHairline(Settings.Hairlines || 6);
			if (!Settings.FixDisabled) {
				curTrackBar.fix = classFilter(curTrackBar.Tracker.getElementsByTagName('*'), 'flr');
				curTrackBar.fixCorrection = Settings.FixCorrection || 0;
			}
			curTrackBar.FilterUpdate = Settings.FilterUpdate || false;
			if (Settings.LeftInput) AddInputHandler(Settings.LeftInput, 'left', curTrackBar);
			if (Settings.RightInput) AddInputHandler(Settings.RightInput, 'right', curTrackBar);

			return curTrackBar;
		} catch (e) { }
	}
}

function AddInputHandler(input, type, curTrackBar) {
	var curInput = null;
	switch (typeof input) {
		case 'string': curInput = $(input); break;

		case 'object': curInput = input; break;
	}
	try {
		addHandler(curInput, 'change', function() { curTrackBar.SetTrackerValue(type, curInput.value) }, false);
	} catch (e) { }
}











function initTrackBars(go, mode) {
    if(!go) return false;
    else {
        var TrackBarsSettings = [];
		var curTrackBar = null;
		switch (go.toString()) {
			case '1':
			case '2':
			case '3':
				TrackBarsSettings.push({ name: 'Rooms', min: 1, max: 5, step: 1, isContinuous: false, hairlines: 5 });
				TrackBarsSettings.push({ name: 'SAll', min: 0, max: 100, step: 5, isContinuous: false, hairlines: 6 });

				//TrackBarsSettings.push({ name: 'SLiving', min: 0, max: 100, step: 5, isContinuous: false, hairlines: 6 });
				TrackBarsSettings.push({ name: 'SKitchen', min: 0, max: 25, step: 5, isContinuous: false, hairlines: 6 });
				TrackBarsSettings.push({ name: 'TotalPrice', min: 0, max: 20000, step: 50, isContinuous: true, hairlines: 7, expmultiplier: 4,
					exproundto: 100, scaleroundto: 1000
				});
				break;
			case '4':
				if (!mode) {
					TrackBarsSettings.push({ name: 'SLandInAr', min: 0, max: 1000, step: 1, isContinuous: true, hairlines: 6, expmultiplier: 7,
						exproundto: 2, scaleroundto: 5
					});
					TrackBarsSettings.push({ name: 'SLiving', min: 0, max: 500, step: 50, isContinuous: false, hairlines: 6 });
				}
				else if (mode = 'land') {
					TrackBarsSettings.push({ name: 'SLandInAr', min: 0, max: 1000, step: 1, isContinuous: true, hairlines: 6, expmultiplier: 7,
						scaleroundto: 5 });
				}
				TrackBarsSettings.push({ name: 'FromCity', min: 0, max: 500, step: 10, isContinuous: false, hairlines: 8 });
				TrackBarsSettings.push({ name: 'TotalPrice', min: 0, max: 100000, step: 50, isContinuous: true, hairlines: 7, expmultiplier: 4,
					exproundto: 100, scaleroundto: 1000
				});
				break;
			case '6001':
				TrackBarsSettings.push({ name: 'SAll', min: 0, max: 100, step: 5, isContinuous: false, hairlines: 6 });
				TrackBarsSettings.push({ name: 'SLandInAr', min: 0, max: 1000, step: 1, isContinuous: true, hairlines: 6, expmultiplier: 7,
					exproundto: 2, scaleroundto: 5 });
				TrackBarsSettings.push({ name: 'TotalPrice', min: 0, max: 20000, step: 50, isContinuous: true, hairlines: 7, expmultiplier: 4,
					exproundto: 100, scaleroundto: 1000
				});
				break;
		}
		
		for (var i = 0; i < TrackBarsSettings.length; i++) {
			curTrackBar = createDoubleTrackBar(TrackBarsSettings[i].name, TrackBarsSettings[i].min, TrackBarsSettings[i].max, TrackBarsSettings[i].step,
			TrackBarsSettings[i].isContinuous, TrackBarsSettings[i].hairlines, TrackBarsSettings[i].expmultiplier,
			TrackBarsSettings[i].exproundto, TrackBarsSettings[i].scaleroundto);
			TrackBars.push(curTrackBar);
        }
    }
}

function createDoubleTrackBar(Name, Min, Max, Step, IsContinuous, Hairlines, ExpMultiplier, ExpRoundTo, ScaleRoundTo) {
	return createDefaultDoubleTrackBar({
		DoubleTrackBarName: 'TrackBar-' + Name,
		Min: Min,
		Max: Max,
		Step: Step,
		IsContinuous: IsContinuous,
		LeftInput: Name + '[min]',
		RightInput: Name + '[max]',
		ScaleRoundTo: ScaleRoundTo,
		ExpRoundTo: ExpRoundTo,
		Hairlines: Hairlines,
		Margins: '0',
		FixCorrection: -7,
		FilterUpdate: true,
		ExpMultiplier: ExpMultiplier
	});
}

function resetTrackBars() {
	if (TrackBars.length > 0) {
		for (var i = 0; i < TrackBars.length; i++) {
			TrackBars[i].SetTrackerValue('left', TrackBars[i].Min);
			TrackBars[i].SetTrackerValue('right', TrackBars[i].Max);
		}
	}
}

function setClassName(obj, className, isClassAdding) {
	if (!obj) return false;
	else {
		if (!className) obj.className = obj.fixedClassName || '';
		else {
			if(!obj.fixedClassName) obj.fixedClassName = obj.className;
			//obj.className = (isClassAdding && obj.className) ? (obj.className + ' ' + className) : className;
			if(isClassAdding) obj.className = obj.fixedClassName ? (obj.fixedClassName + ' ' + className) : className;
			else obj.className = className;
		}
	}
}









window.onload=function()
{
	initTrackBars(4);
    //alert(document.body.offsetWidth+"|"+document.body.style.fontSize);
    //alert(document.getElementById('wraper').style.pixelWidth*);
}