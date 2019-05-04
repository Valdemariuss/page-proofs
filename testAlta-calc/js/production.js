/**
 * Application:  Alta
 * Version:      0.9.0
 * Release date: 2016-09-25
 * Author:       Alta-Soft
 * Homepage:     http://alta.ru
 * License:      FSF
*/

(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["inputmask.dependencyLib"], factory);
	} else if (typeof exports === "object") {
		module.exports = factory(require("./inputmask.dependencyLib.jquery"));
	} else {
		factory(window.dependencyLib || jQuery);
	}
}
(function ($) {
	function Inputmask(alias, options) {
		//allow instanciating without new
		if (!(this instanceof Inputmask)) {
			return new Inputmask(alias, options);
		}

		if ($.isPlainObject(alias)) {
			options = alias;
		} else {
			options = options || {};
			options.alias = alias;
		}

		this.el = undefined;
		//init options
		this.opts = $.extend(true, {}, this.defaults, options);
		this.noMasksCache = options && options.definitions !== undefined;
		this.userOptions = options || {}; //user passed options
		this.events = {};
		resolveAlias(this.opts.alias, options, this.opts);
	}

	Inputmask.prototype = {
		//options default
		defaults: {
			placeholder: "_",
			optionalmarker: {
				start: "[",
				end: "]"
			},
			quantifiermarker: {
				start: "{",
				end: "}"
			},
			groupmarker: {
				start: "(",
				end: ")"
			},
			alternatormarker: "|",
			escapeChar: "\\",
			mask: null, //needs tobe null instead of undefined as the extend method does not consider props with the undefined value
			oncomplete: $.noop, //executes when the mask is complete
			onincomplete: $.noop, //executes when the mask is incomplete and focus is lost
			oncleared: $.noop, //executes when the mask is cleared
			repeat: 0, //repetitions of the mask: * ~ forever, otherwise specify an integer
			greedy: true, //true: allocated buffer for the mask and repetitions - false: allocate only if needed
			autoUnmask: false, //automatically unmask when retrieving the value with $.fn.val or value if the browser supports __lookupGetter__ or getOwnPropertyDescriptor
			removeMaskOnSubmit: false, //remove the mask before submitting the form.
			clearMaskOnLostFocus: true,
			insertMode: true, //insert the input or overwrite the input
			clearIncomplete: false, //clear the incomplete input on blur
			aliases: {}, //aliases definitions => see jquery.inputmask.extensions.js
			alias: null,
			onKeyDown: $.noop, //callback to implement autocomplete on certain keys for example. args => event, buffer, caretPos, opts
			onBeforeMask: null, //executes before masking the initial value to allow preprocessing of the initial value.	args => initialValue, opts => return processedValue
			onBeforePaste: function (pastedValue, opts) {
				return $.isFunction(opts.onBeforeMask) ? opts.onBeforeMask(pastedValue, opts) : pastedValue;
			}, //executes before masking the pasted value to allow preprocessing of the pasted value.	args => pastedValue, opts => return processedValue
			onBeforeWrite: null, //executes before writing to the masked element. args => event, opts
			onUnMask: null, //executes after unmasking to allow postprocessing of the unmaskedvalue.	args => maskedValue, unmaskedValue, opts
			showMaskOnFocus: true, //show the mask-placeholder when the input has focus
			showMaskOnHover: true, //show the mask-placeholder when hovering the empty input
			onKeyValidation: $.noop, //executes on every key-press with the result of isValid. Params: key, result, opts
			skipOptionalPartCharacter: " ", //a character which can be used to skip an optional part of a mask
			showTooltip: false, //show the activemask as tooltip
			tooltip: undefined, //tooltip to show
			numericInput: false, //numericInput input direction style (input shifts to the left while holding the caret position)
			rightAlign: false, //align to the right
			undoOnEscape: true, //pressing escape reverts the value to the value before focus
			//numeric basic properties
			radixPoint: "", //".", // | ","
			radixPointDefinitionSymbol: undefined, //set the radixPoint definitionSymbol ~ used for awareness of the radixpoint
			groupSeparator: "", //",", // | "."
			//numeric basic properties
			keepStatic: null, //try to keep the mask static while typing. Decisions to alter the mask will be posponed if possible - null see auto selection for multi masks
			positionCaretOnTab: true, //when enabled the caret position is set after the latest valid position on TAB
			tabThrough: false, //allows for tabbing through the different parts of the masked field
			supportsInputType: ["text", "tel", "password"], //list with the supported input types
			definitions: {
				"9": {
					validator: "[0-9]",
					cardinality: 1,
					definitionSymbol: "*"
				},
				"a": {
					validator: "[A-Za-z\u0410-\u044F\u0401\u0451\u00C0-\u00FF\u00B5]",
					cardinality: 1,
					definitionSymbol: "*"
				},
				"*": {
					validator: "[0-9A-Za-z\u0410-\u044F\u0401\u0451\u00C0-\u00FF\u00B5]",
					cardinality: 1
				}
			},
			//specify keyCodes which should not be considered in the keypress event, otherwise the preventDefault will stop their default behavior especially in FF
			ignorables: [8, 9, 13, 19, 27, 33, 34, 35, 36, 37, 38, 39, 40, 45, 46, 93, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123],
			isComplete: null, //override for isComplete - args => buffer, opts - return true || false
			canClearPosition: $.noop, //hook to alter the clear behavior in the stripValidPositions args => maskset, position, lastValidPosition, opts => return true|false
			postValidation: null, //hook to postValidate the result from isValid.	Usefull for validating the entry as a whole.	args => buffer, currentResult, opts => return true/false
			staticDefinitionSymbol: undefined, //specify a definitionSymbol for static content, used to make matches for alternators
			jitMasking: false, //just in time masking ~ only mask while typing, can n (number), true or false
			nullable: true, //return nothing instead of the buffertemplate when the user hasn't entered anything.
			inputEventOnly: false, //testing inputfallback behavior
			positionCaretOnClick: "lvp", //none, lvp (based on the last valid position (default), radixFocus (position caret to radixpoint on initial click)
			casing: null //mask-level casing. Options: null, "upper", "lower" or "title"
		},
		masksCache: {},
		mask: function (elems) {
			var that = this;
			if (typeof elems === "string") {
				elems = document.getElementById(elems) || document.querySelectorAll(elems);
			}
			elems = elems.nodeName ? [elems] : elems;
			$.each(elems, function (ndx, el) {
				var scopedOpts = $.extend(true, {}, that.opts);
				importAttributeOptions(el, scopedOpts, $.extend(true, {}, that.userOptions));
				var maskset = generateMaskSet(scopedOpts, that.noMasksCache);
				if (maskset !== undefined) {
					if (el.inputmask !== undefined) {
						el.inputmask.remove();
					}
					//store inputmask instance on the input with element reference
					el.inputmask = new Inputmask();
					el.inputmask.opts = scopedOpts;
					el.inputmask.noMasksCache = that.noMasksCache;
					el.inputmask.userOptions = $.extend(true, {}, that.userOptions);
					el.inputmask.el = el;
					el.inputmask.maskset = maskset;
					el.inputmask.isRTL = false;

					$.data(el, "_inputmask_opts", scopedOpts);

					maskScope({
						"action": "mask",
						"el": el
					});
				}
			});
			return elems && elems[0] ? (elems[0].inputmask || this) : this;
		},
		option: function (options, noremask) { //set extra options || retrieve value of a current option
			if (typeof options === "string") {
				return this.opts[options];
			} else if (typeof options === "object") {
				$.extend(this.userOptions, options); //user passed options
				//remask
				if (this.el && noremask !== true) {
					this.mask(this.el);
				}
				return this;
			}
		},
		unmaskedvalue: function (value) {
			return maskScope({
				"action": "unmaskedvalue",
				"el": this.el,
				"value": value
			}, this.el && this.el.inputmask ? this.el.inputmask.maskset : generateMaskSet(this.opts, this.noMasksCache), this.opts);
		},
		remove: function () {
			if (this.el) {
				maskScope({
					"action": "remove",
					"el": this.el
				});
				this.el.inputmask = undefined; //delete ~ undefined
				return this.el;
			}
		},
		getemptymask: function () { //return the default (empty) mask value, usefull for setting the default value in validation
			return maskScope({
				"action": "getemptymask"
			}, this.maskset || generateMaskSet(this.opts, this.noMasksCache), this.opts);
		},
		hasMaskedValue: function () { //check wheter the returned value is masked or not; currently only works reliable when using jquery.val fn to retrieve the value
			return !this.opts.autoUnmask;
		},
		isComplete: function () {
			return maskScope({
				"action": "isComplete",
				"el": this.el //optional
			}, this.maskset || generateMaskSet(this.opts, this.noMasksCache), this.opts);
		},
		getmetadata: function () { //return mask metadata if exists
			return maskScope({
				"action": "getmetadata"
			}, this.maskset || generateMaskSet(this.opts, this.noMasksCache), this.opts);
		},
		isValid: function (value) {
			return maskScope({
				"action": "isValid",
				"value": value
			}, this.maskset || generateMaskSet(this.opts, this.noMasksCache), this.opts);
		},
		format: function (value, metadata) {
			return maskScope({
				"action": "format",
				"value": value,
				"metadata": metadata //true/false getmetadata
			}, this.maskset || generateMaskSet(this.opts, this.noMasksCache), this.opts);
		}
	};

	//apply defaults, definitions, aliases
	Inputmask.extendDefaults = function (options) {
		$.extend(true, Inputmask.prototype.defaults, options);
	};
	Inputmask.extendDefinitions = function (definition) {
		$.extend(true, Inputmask.prototype.defaults.definitions, definition);
	};
	Inputmask.extendAliases = function (alias) {
		$.extend(true, Inputmask.prototype.defaults.aliases, alias);
	};
	//static fn on inputmask
	Inputmask.format = function (value, options, metadata) {
		return Inputmask(options).format(value, metadata);
	};
	Inputmask.unmask = function (value, options) {
		return Inputmask(options).unmaskedvalue(value);
	};
	Inputmask.isValid = function (value, options) {
		return Inputmask(options).isValid(value);
	};
	Inputmask.remove = function (elems) {
		$.each(elems, function (ndx, el) {
			if (el.inputmask) el.inputmask.remove();
		});
	};
	Inputmask.escapeRegex = function (str) {
		var specials = ["/", ".", "*", "+", "?", "|", "(", ")", "[", "]", "{", "}", "\\", "$", "^"];
		return str.replace(new RegExp("(\\" + specials.join("|\\") + ")", "gim"), "\\$1");
	};
	Inputmask.keyCode = {
		ALT: 18,
		BACKSPACE: 8,
		BACKSPACE_SAFARI: 127,
		CAPS_LOCK: 20,
		COMMA: 188,
		COMMAND: 91,
		COMMAND_LEFT: 91,
		COMMAND_RIGHT: 93,
		CONTROL: 17,
		DELETE: 46,
		DOWN: 40,
		END: 35,
		ENTER: 13,
		ESCAPE: 27,
		HOME: 36,
		INSERT: 45,
		LEFT: 37,
		MENU: 93,
		NUMPAD_ADD: 107,
		NUMPAD_DECIMAL: 110,
		NUMPAD_DIVIDE: 111,
		NUMPAD_ENTER: 108,
		NUMPAD_MULTIPLY: 106,
		NUMPAD_SUBTRACT: 109,
		PAGE_DOWN: 34,
		PAGE_UP: 33,
		PERIOD: 190,
		RIGHT: 39,
		SHIFT: 16,
		SPACE: 32,
		TAB: 9,
		UP: 38,
		WINDOWS: 91,
		X: 88
	};

	//helper functions
	function isInputEventSupported(eventName) {
		var el = document.createElement("input"),
			evName = "on" + eventName,
			isSupported = (evName in el);
		if (!isSupported) {
			el.setAttribute(evName, "return;");
			isSupported = typeof el[evName] == "function";
		}
		el = null;
		return isSupported;
	}

	function isElementTypeSupported(input, opts) {
		var elementType = input.getAttribute("type");
		var isSupported = (input.tagName === "INPUT" && $.inArray(elementType, opts.supportsInputType) !== -1) || input.isContentEditable || input.tagName === "TEXTAREA";
		if (!isSupported && input.tagName === "INPUT") {
			var el = document.createElement("input");
			el.setAttribute("type", elementType);
			isSupported = el.type === "text"; //apply mask only if the type is not natively supported
			el = null;
		}
		return isSupported;
	}

	function resolveAlias(aliasStr, options, opts) {
		var aliasDefinition = opts.aliases[aliasStr];
		if (aliasDefinition) {
			if (aliasDefinition.alias) resolveAlias(aliasDefinition.alias, undefined, opts); //alias is another alias
			$.extend(true, opts, aliasDefinition); //merge alias definition in the options
			$.extend(true, opts, options); //reapply extra given options
			return true;
		} else //alias not found - try as mask
		if (opts.mask === null) {
			opts.mask = aliasStr;
		}

		return false;
	}

	function importAttributeOptions(npt, opts, userOptions) {
		var attrOptions = npt.getAttribute("data-inputmask"),
			option, dataoptions, optionData, p;

		function importOption(option, optionData) {
			optionData = optionData !== undefined ? optionData : npt.getAttribute("data-inputmask-" + option);
			if (optionData !== null) {
				if (typeof optionData === "string") {
					if (option.indexOf("on") === 0) optionData = window[optionData]; //get function definition
					else if (optionData === "false") optionData = false;
					else if (optionData === "true") optionData = true;
				}
				userOptions[option] = optionData;
			}
		}

		if (attrOptions && attrOptions !== "") {
			attrOptions = attrOptions.replace(new RegExp("'", "g"), '"');
			dataoptions = JSON.parse("{" + attrOptions + "}");
		}

		//resolve aliases
		if (dataoptions) { //pickup alias from data-inputmask
			optionData = undefined;
			for (p in dataoptions) {
				if (p.toLowerCase() === "alias") {
					optionData = dataoptions[p];
					break;
				}
			}
		}
		importOption("alias", optionData); //pickup alias from data-inputmask-alias
		if (userOptions.alias) {
			resolveAlias(userOptions.alias, userOptions, opts);
		}

		for (option in opts) {
			if (dataoptions) {
				optionData = undefined;
				for (p in dataoptions) {
					if (p.toLowerCase() === option.toLowerCase()) {
						optionData = dataoptions[p];
						break;
					}
				}
			}
			importOption(option, optionData);
		}

		$.extend(true, opts, userOptions);
		return opts;
	}

	function generateMaskSet(opts, nocache) {
		var ms;

		function analyseMask(mask) {
			var tokenizer = /(?:[?*+]|\{[0-9\+\*]+(?:,[0-9\+\*]*)?\})|[^.?*+^${[]()|\\]+|./g,
				escaped = false,
				currentToken = new MaskToken(),
				match,
				m,
				openenings = [],
				maskTokens = [],
				openingToken,
				currentOpeningToken,
				alternator,
				lastMatch,
				groupToken;

			function MaskToken(isGroup, isOptional, isQuantifier, isAlternator) {
				this.matches = [];
				this.isGroup = isGroup || false;
				this.isOptional = isOptional || false;
				this.isQuantifier = isQuantifier || false;
				this.isAlternator = isAlternator || false;
				this.quantifier = {
					min: 1,
					max: 1
				};
			}

			//test definition => {fn: RegExp/function, cardinality: int, optionality: bool, newBlockMarker: bool, casing: null/upper/lower, def: definitionSymbol, placeholder: placeholder, mask: real maskDefinition}
			function insertTestDefinition(mtoken, element, position) {
				var maskdef = opts.definitions[element];
				position = position !== undefined ? position : mtoken.matches.length;
				var prevMatch = mtoken.matches[position - 1];
				if (maskdef && !escaped) {
					maskdef.placeholder = $.isFunction(maskdef.placeholder) ? maskdef.placeholder(opts) : maskdef.placeholder;
					var prevalidators = maskdef.prevalidator,
						prevalidatorsL = prevalidators ? prevalidators.length : 0;
					//handle prevalidators
					for (var i = 1; i < maskdef.cardinality; i++) {
						var prevalidator = prevalidatorsL >= i ? prevalidators[i - 1] : [],
							validator = prevalidator.validator,
							cardinality = prevalidator.cardinality;
						mtoken.matches.splice(position++, 0, {
							fn: validator ? typeof validator === "string" ? new RegExp(validator) : new function () {
								this.test = validator;
							} : new RegExp("."),
							cardinality: cardinality ? cardinality : 1,
							optionality: mtoken.isOptional,
							newBlockMarker: prevMatch === undefined || prevMatch.def !== (maskdef.definitionSymbol || element),
							casing: maskdef.casing,
							def: maskdef.definitionSymbol || element,
							placeholder: maskdef.placeholder,
							mask: element
						});
						prevMatch = mtoken.matches[position - 1];
					}
					mtoken.matches.splice(position++, 0, {
						fn: maskdef.validator ? typeof maskdef.validator == "string" ? new RegExp(maskdef.validator) : new function () {
							this.test = maskdef.validator;
						} : new RegExp("."),
						cardinality: maskdef.cardinality,
						optionality: mtoken.isOptional,
						newBlockMarker: prevMatch === undefined || prevMatch.def !== (maskdef.definitionSymbol || element),
						casing: maskdef.casing,
						def: maskdef.definitionSymbol || element,
						placeholder: maskdef.placeholder,
						mask: element
					});
				} else {
					mtoken.matches.splice(position++, 0, {
						fn: null,
						cardinality: 0,
						optionality: mtoken.isOptional,
						newBlockMarker: prevMatch === undefined || prevMatch.def !== element,
						casing: null,
						def: opts.staticDefinitionSymbol || element,
						placeholder: opts.staticDefinitionSymbol !== undefined ? element : undefined,
						mask: element
					});
					escaped = false;
				}
			}

			function verifyGroupMarker(lastMatch, isOpenGroup) {
				if (lastMatch.isGroup) { //this is not a group but a normal mask => convert
					lastMatch.isGroup = false;
					insertTestDefinition(lastMatch, opts.groupmarker.start, 0);
					if (isOpenGroup !== true) {
						insertTestDefinition(lastMatch, opts.groupmarker.end);
					}
				}
			}

			function maskCurrentToken(m, currentToken, lastMatch, extraCondition) {
				if (currentToken.matches.length > 0 && (extraCondition === undefined || extraCondition)) {
					lastMatch = currentToken.matches[currentToken.matches.length - 1];
					verifyGroupMarker(lastMatch);
				}
				insertTestDefinition(currentToken, m);
			}

			function defaultCase() {
				if (openenings.length > 0) {
					currentOpeningToken = openenings[openenings.length - 1];
					maskCurrentToken(m, currentOpeningToken, lastMatch, !currentOpeningToken.isAlternator);
					if (currentOpeningToken.isAlternator) { //handle alternator a | b case
						alternator = openenings.pop();
						for (var mndx = 0; mndx < alternator.matches.length; mndx++) {
							alternator.matches[mndx].isGroup = false; //don't mark alternate groups as group
						}
						if (openenings.length > 0) {
							currentOpeningToken = openenings[openenings.length - 1];
							currentOpeningToken.matches.push(alternator);
						} else {
							currentToken.matches.push(alternator);
						}
					}
				} else {
					maskCurrentToken(m, currentToken, lastMatch);
				}
			}

			function reverseTokens(maskToken) {
				function reverseStatic(st) {
					if (st === opts.optionalmarker.start) st = opts.optionalmarker.end;
					else if (st === opts.optionalmarker.end) st = opts.optionalmarker.start;
					else if (st === opts.groupmarker.start) st = opts.groupmarker.end;
					else if (st === opts.groupmarker.end) st = opts.groupmarker.start;

					return st;
				}

				maskToken.matches = maskToken.matches.reverse();
				for (var match in maskToken.matches) {
					var intMatch = parseInt(match);
					if (maskToken.matches[match].isQuantifier && maskToken.matches[intMatch + 1] && maskToken.matches[intMatch + 1].isGroup) { //reposition quantifier
						var qt = maskToken.matches[match];
						maskToken.matches.splice(match, 1);
						maskToken.matches.splice(intMatch + 1, 0, qt);
					}
					if (maskToken.matches[match].matches !== undefined) {
						maskToken.matches[match] = reverseTokens(maskToken.matches[match]);
					} else {
						maskToken.matches[match] = reverseStatic(maskToken.matches[match]);
					}
				}

				return maskToken;
			}

			while (match = tokenizer.exec(mask)) {
				m = match[0];

				if (escaped) {
					defaultCase();
					continue;
				}
				switch (m.charAt(0)) {
					case opts.escapeChar:
						escaped = true;
						break;
					case opts.optionalmarker.end:
					// optional closing
					case opts.groupmarker.end:
						// Group closing
						openingToken = openenings.pop();
						if (openingToken !== undefined) {
							if (openenings.length > 0) {
								currentOpeningToken = openenings[openenings.length - 1];
								currentOpeningToken.matches.push(openingToken);
								if (currentOpeningToken.isAlternator) { //handle alternator (a) | (b) case
									alternator = openenings.pop();
									for (var mndx = 0; mndx < alternator.matches.length; mndx++) {
										alternator.matches[mndx].isGroup = false; //don't mark alternate groups as group
									}
									if (openenings.length > 0) {
										currentOpeningToken = openenings[openenings.length - 1];
										currentOpeningToken.matches.push(alternator);
									} else {
										currentToken.matches.push(alternator);
									}
								}
							} else {
								currentToken.matches.push(openingToken);
							}
						} else defaultCase();
						break;
					case opts.optionalmarker.start:
						// optional opening
						openenings.push(new MaskToken(false, true));
						break;
					case opts.groupmarker.start:
						// Group opening
						openenings.push(new MaskToken(true));
						break;
					case opts.quantifiermarker.start:
						//Quantifier
						var quantifier = new MaskToken(false, false, true);

						m = m.replace(/[{}]/g, "");
						var mq = m.split(","),
							mq0 = isNaN(mq[0]) ? mq[0] : parseInt(mq[0]),
							mq1 = mq.length === 1 ? mq0 : (isNaN(mq[1]) ? mq[1] : parseInt(mq[1]));
						if (mq1 === "*" || mq1 === "+") {
							mq0 = mq1 === "*" ? 0 : 1;
						}
						quantifier.quantifier = {
							min: mq0,
							max: mq1
						};
						if (openenings.length > 0) {
							var matches = openenings[openenings.length - 1].matches;
							match = matches.pop();
							if (!match.isGroup) {
								groupToken = new MaskToken(true);
								groupToken.matches.push(match);
								match = groupToken;
							}
							matches.push(match);
							matches.push(quantifier);
						} else {
							match = currentToken.matches.pop();
							if (!match.isGroup) {
								groupToken = new MaskToken(true);
								groupToken.matches.push(match);
								match = groupToken;
							}
							currentToken.matches.push(match);
							currentToken.matches.push(quantifier);
						}
						break;
					case opts.alternatormarker:
						if (openenings.length > 0) {
							currentOpeningToken = openenings[openenings.length - 1];
							lastMatch = currentOpeningToken.matches.pop();
						} else {
							lastMatch = currentToken.matches.pop();
						}
						if (lastMatch.isAlternator) {
							openenings.push(lastMatch);
						} else {
							alternator = new MaskToken(false, false, false, true);
							alternator.matches.push(lastMatch);
							openenings.push(alternator);
						}
						break;
					default:
						defaultCase();
				}
			}

			while (openenings.length > 0) {
				openingToken = openenings.pop();
				verifyGroupMarker(openingToken, true);
				currentToken.matches.push(openingToken);
			}
			if (currentToken.matches.length > 0) {
				lastMatch = currentToken.matches[currentToken.matches.length - 1];
				verifyGroupMarker(lastMatch);
				maskTokens.push(currentToken);
			}

			if (opts.numericInput) {
				reverseTokens(maskTokens[0]);
			}
			//console.log(JSON.stringify(maskTokens));
			return maskTokens;
		}

		function generateMask(mask, metadata) {
			if (mask === null || mask === "") {
				return undefined;
			} else {
				if (mask.length === 1 && opts.greedy === false && opts.repeat !== 0) {
					opts.placeholder = "";
				} //hide placeholder with single non-greedy mask
				if (opts.repeat > 0 || opts.repeat === "*" || opts.repeat === "+") {
					var repeatStart = opts.repeat === "*" ? 0 : (opts.repeat === "+" ? 1 : opts.repeat);
					mask = opts.groupmarker.start + mask + opts.groupmarker.end + opts.quantifiermarker.start + repeatStart + "," + opts.repeat + opts.quantifiermarker.end;
				}

				// console.log(mask);
				var masksetDefinition;
				if (Inputmask.prototype.masksCache[mask] === undefined || nocache === true) {
					masksetDefinition = {
						"mask": mask,
						"maskToken": analyseMask(mask),
						"validPositions": {},
						"_buffer": undefined,
						"buffer": undefined,
						"tests": {},
						"metadata": metadata,
						maskLength: undefined
					};
					if (nocache !== true) {
						Inputmask.prototype.masksCache[opts.numericInput ? mask.split("").reverse().join("") : mask] = masksetDefinition;
						masksetDefinition = $.extend(true, {}, Inputmask.prototype.masksCache[opts.numericInput ? mask.split("").reverse().join("") : mask]);
					}
				} else masksetDefinition = $.extend(true, {}, Inputmask.prototype.masksCache[opts.numericInput ? mask.split("").reverse().join("") : mask]);

				return masksetDefinition;
			}
		}

		function preProcessMask(mask) {
			mask = mask.toString();
			// if (opts.numericInput) {
			// 	mask = mask.split('').reverse();
			// 	mask = mask.join('');
			// }
			return mask;
		}

		if ($.isFunction(opts.mask)) { //allow mask to be a preprocessing fn - should return a valid mask
			opts.mask = opts.mask(opts);
		}
		if ($.isArray(opts.mask)) {
			if (opts.mask.length > 1) {
				opts.keepStatic = opts.keepStatic === null ? true : opts.keepStatic; //enable by default when passing multiple masks when the option is not explicitly specified
				var altMask = "(";
				$.each(opts.numericInput ? opts.mask.reverse() : opts.mask, function (ndx, msk) {
					if (altMask.length > 1) {
						altMask += ")|(";
					}
					if (msk.mask !== undefined && !$.isFunction(msk.mask)) {
						altMask += preProcessMask(msk.mask);
					} else {
						altMask += preProcessMask(msk);
					}
				});
				altMask += ")";
				return generateMask(altMask, opts.mask);
			} else opts.mask = opts.mask.pop();
		}

		if (opts.mask) {
			if (opts.mask.mask !== undefined && !$.isFunction(opts.mask.mask)) {
				ms = generateMask(preProcessMask(opts.mask.mask), opts.mask);
			} else {
				ms = generateMask(preProcessMask(opts.mask), opts.mask);
			}
		}

		return ms;
	}

	var ua = navigator.userAgent,
		mobile = /mobile/i.test(ua),
		iemobile = /iemobile/i.test(ua),
		iphone = /iphone/i.test(ua) && !iemobile;
	//android = /android.*safari.*/i.test(ua) && !iemobile;

	//masking scope
	//actionObj definition see below
	function maskScope(actionObj, maskset, opts) {
		var isRTL = false,
			undoValue,
			el, $el,
			skipKeyPressEvent = false, //Safari 5.1.x - modal dialog fires keypress twice workaround
			skipInputEvent = false, //skip when triggered from within inputmask
			ignorable = false,
			maxLength,
			mouseEnter = true;

		//maskset helperfunctions
		function getMaskTemplate(baseOnInput, minimalPos, includeInput) {
			minimalPos = minimalPos || 0;
			var maskTemplate = [],
				ndxIntlzr, pos = 0,
				test, testPos, lvp = getLastValidPosition();
			maxLength = el !== undefined ? el.maxLength : undefined;
			if (maxLength === -1) maxLength = undefined;
			do {
				if (baseOnInput === true && getMaskSet().validPositions[pos]) {
					var validPos = getMaskSet().validPositions[pos];
					test = validPos.match;
					ndxIntlzr = validPos.locator.slice();
					maskTemplate.push(includeInput === true ? validPos.input : getPlaceholder(pos, test));
				} else {
					testPos = getTestTemplate(pos, ndxIntlzr, pos - 1);
					test = testPos.match;
					ndxIntlzr = testPos.locator.slice();
					if (opts.jitMasking === false || pos < lvp || (isFinite(opts.jitMasking) && opts.jitMasking > pos)) {
						maskTemplate.push(getPlaceholder(pos, test));
					}
				}
				pos++;
			} while ((maxLength === undefined || pos < maxLength) && (test.fn !== null || test.def !== "") || minimalPos > pos);
			if (maskTemplate[maskTemplate.length - 1] === "") {
				maskTemplate.pop(); //drop the last one which is empty
			}

			getMaskSet().maskLength = pos + 1;
			return maskTemplate;
		}

		function getMaskSet() {
			return maskset;
		}

		function resetMaskSet(soft) {
			var maskset = getMaskSet();
			maskset.buffer = undefined;
			if (soft !== true) {
				maskset._buffer = undefined;
				maskset.validPositions = {};
				maskset.p = 0;
			}
		}

		function getLastValidPosition(closestTo, strict, validPositions) {
			var before = -1,
				after = -1,
				valids = validPositions || getMaskSet().validPositions; //for use in valhook ~ context switch
			if (closestTo === undefined) closestTo = -1;
			for (var posNdx in valids) {
				var psNdx = parseInt(posNdx);
				if (valids[psNdx] && (strict || valids[psNdx].match.fn !== null)) {
					if (psNdx <= closestTo) before = psNdx;
					if (psNdx >= closestTo) after = psNdx;
				}
			}
			return (before !== -1 && (closestTo - before) > 1) || after < closestTo ? before : after;
		}

		function setValidPosition(pos, validTest, fromSetValid, isSelection) {
			if (isSelection || (opts.insertMode && getMaskSet().validPositions[pos] !== undefined && fromSetValid === undefined)) {
				//reposition & revalidate others
				var positionsClone = $.extend(true, {}, getMaskSet().validPositions),
					lvp = getLastValidPosition(),
					i;
				for (i = pos; i <= lvp; i++) { //clear selection
					delete getMaskSet().validPositions[i];
				}
				getMaskSet().validPositions[pos] = $.extend(true, {}, validTest);
				var valid = true,
					j, vps = getMaskSet().validPositions, needsValidation = false;
				for (i = (j = pos); i <= lvp; i++) {
					var t = positionsClone[i];
					if (t !== undefined) {
						var posMatch = j;
						while (posMatch < getMaskSet().maskLength && ((t.match.fn == null && vps[i] && (vps[i].match.optionalQuantifier === true || vps[i].match.optionality === true)) || t.match.fn != null)) {
							posMatch++;
							if (false && needsValidation === false && positionsClone[posMatch] && positionsClone[posMatch].match.def === t.match.def) { //obvious match
								getMaskSet().validPositions[posMatch] = $.extend(true, {}, positionsClone[posMatch]);
								getMaskSet().validPositions[posMatch].input = t.input;
								j = posMatch;
								valid = true;
							} else if (positionCanMatchDefinition(posMatch, t.match.def)) { //validated match
								var result = isValid(posMatch, t.input, true, true);
								valid = result !== false;
								j = (result.caret || result.insert) ? getLastValidPosition() : posMatch;
								needsValidation = true;
							} else {
								valid = t.generatedInput === true;
							}
							if (valid) break;
						}
					}
					if (!valid) break;
				}

				if (!valid) {
					getMaskSet().validPositions = $.extend(true, {}, positionsClone);
					resetMaskSet(true);
					return false;
				}
			}

			else
				getMaskSet().validPositions[pos] = $.extend(true, {}, validTest);
			;

			resetMaskSet(true);
			return true;
		}

		function stripValidPositions(start, end, nocheck, strict) {
			function IsEnclosedStatic(pos) {
				var posMatch = getMaskSet().validPositions[pos];
				if (posMatch !== undefined && posMatch.match.fn === null) {
					var prevMatch = getMaskSet().validPositions[pos - 1],
						nextMatch = getMaskSet().validPositions[pos + 1];
					return prevMatch !== undefined && nextMatch !== undefined;
				}
				return false;
			}

			var i, startPos = start,
				positionsClone = $.extend(true, {}, getMaskSet().validPositions), needsValidation = false;
			getMaskSet().p = start; //needed for alternated position after overtype selection

			for (i = end - 1; i >= startPos; i--) { //clear selection
				if (getMaskSet().validPositions[i] !== undefined) {
					if (nocheck === true ||
						(!IsEnclosedStatic(i) && opts.canClearPosition(getMaskSet(), i, getLastValidPosition(), strict, opts) !== false)) {
						delete getMaskSet().validPositions[i];
					}
				}
			}

			//clear buffer
			resetMaskSet(true);
			for (i = startPos + 1; i <= getLastValidPosition();) {
				while (getMaskSet().validPositions[startPos] !== undefined) startPos++;
				var s = getMaskSet().validPositions[startPos];
				if (i < startPos) i = startPos + 1;
				// while (getMaskSet().validPositions[i] == undefined) i++;
				if ((getMaskSet().validPositions[i] !== undefined || !isMask(i)) && s === undefined) {
					var t = getTestTemplate(i);
					if (needsValidation === false && positionsClone[startPos] && positionsClone[startPos].match.def === t.match.def) { //obvious match
						getMaskSet().validPositions[startPos] = $.extend(true, {}, positionsClone[startPos]);
						getMaskSet().validPositions[startPos].input = t.input;
						delete getMaskSet().validPositions[i];
						i++;
					} else if (positionCanMatchDefinition(startPos, t.match.def)) {
						if (isValid(startPos, t.input || getPlaceholder(i), true) !== false) {
							delete getMaskSet().validPositions[i];
							i++;
							needsValidation = true;
						}
					} else if (!isMask(i)) {
						i++;
						startPos--;
					}
					startPos++;
				} else i++;
			}

			resetMaskSet(true);
		}

		function determineTestTemplate(tests, guessNextBest) {
			var testPos,
				testPositions = tests,
				lvp = getLastValidPosition(),
				lvTest = getMaskSet().validPositions[lvp] || getTests(0)[0],
				lvTestAltArr = (lvTest.alternation !== undefined) ? lvTest.locator[lvTest.alternation].toString().split(",") : [];
			for (var ndx = 0; ndx < testPositions.length; ndx++) {
				testPos = testPositions[ndx];

				if (testPos.match &&
					(((opts.greedy && testPos.match.optionalQuantifier !== true) || (testPos.match.optionality === false || testPos.match.newBlockMarker === false) && testPos.match.optionalQuantifier !== true) &&
					((lvTest.alternation === undefined || lvTest.alternation !== testPos.alternation) ||
					(testPos.locator[lvTest.alternation] !== undefined && checkAlternationMatch(testPos.locator[lvTest.alternation].toString().split(","), lvTestAltArr))))) {

					if (guessNextBest !== true || (testPos.match.fn === null && !/[0-9a-bA-Z]/.test(testPos.match.def)))
						break;
				}
			}

			return testPos;
		}

		function getTestTemplate(pos, ndxIntlzr, tstPs) {
			return getMaskSet().validPositions[pos] || determineTestTemplate(getTests(pos, ndxIntlzr ? ndxIntlzr.slice() : ndxIntlzr, tstPs));
		}

		function getTest(pos) {
			if (getMaskSet().validPositions[pos]) {
				return getMaskSet().validPositions[pos];
			}
			return getTests(pos)[0];
		}

		function positionCanMatchDefinition(pos, def) {
			var valid = false,
				tests = getTests(pos);
			for (var tndx = 0; tndx < tests.length; tndx++) {
				if (tests[tndx].match && tests[tndx].match.def === def) {
					valid = true;
					break;
				}
			}
			return valid;
		}

		function selectBestMatch(pos, alternateNdx) {
			var bestMatch, indexPos;
			if (getMaskSet().tests[pos] || getMaskSet().validPositions[pos]) {
				$.each(getMaskSet().tests[pos] || [getMaskSet().validPositions[pos]], function (ndx, lmnt) {
					var ndxPos = lmnt.alternation ? lmnt.locator[lmnt.alternation].toString().indexOf(alternateNdx) : -1;
					if ((indexPos === undefined || ndxPos < indexPos) && ndxPos !== -1) {
						bestMatch = lmnt;
						indexPos = ndxPos;
					}
				});
			}
			return bestMatch;
		}

		function getTests(pos, ndxIntlzr, tstPs) {
			var maskTokens = getMaskSet().maskToken,
				testPos = ndxIntlzr ? tstPs : 0,
				ndxInitializer = ndxIntlzr ? ndxIntlzr.slice() : [0],
				matches = [],
				insertStop = false,
				latestMatch,
				cacheDependency = ndxIntlzr ? ndxIntlzr.join("") : "";

			function resolveTestFromToken(maskToken, ndxInitializer, loopNdx, quantifierRecurse) { //ndxInitializer contains a set of indexes to speedup searches in the mtokens
				function handleMatch(match, loopNdx, quantifierRecurse) {
					function isFirstMatch(latestMatch, tokenGroup) {
						var firstMatch = $.inArray(latestMatch, tokenGroup.matches) === 0;
						if (!firstMatch) {
							$.each(tokenGroup.matches, function (ndx, match) {
								if (match.isQuantifier === true) {
									firstMatch = isFirstMatch(latestMatch, tokenGroup.matches[ndx - 1]);
									if (firstMatch) return false;
								}
							});
						}
						return firstMatch;
					}

					function resolveNdxInitializer(pos, alternateNdx) {
						var bestMatch = selectBestMatch(pos, alternateNdx);
						return bestMatch ? bestMatch.locator.slice(bestMatch.alternation + 1) : undefined;
					}

					function staticCanMatchDefinition(source, target) {
						if (source.match.fn === null && target.match.fn !== null) {
							return target.match.fn.test(source.match.def, getMaskSet(), pos, false, opts, false);
						}
						return false;
					}

					if (testPos > 10000) {
						throw "Inputmask: There is probably an error in your mask definition or in the code. Create an issue on github with an example of the mask you are using. " + getMaskSet().mask;
					}
					if (testPos === pos && match.matches === undefined) {
						matches.push({
							"match": match,
							"locator": loopNdx.reverse(),
							"cd": cacheDependency
						});
						return true;
					} else if (match.matches !== undefined) {
						if (match.isGroup && quantifierRecurse !== match) { //when a group pass along to the quantifier
							match = handleMatch(maskToken.matches[$.inArray(match, maskToken.matches) + 1], loopNdx);
							if (match) return true;
						} else if (match.isOptional) {
							var optionalToken = match;
							match = resolveTestFromToken(match, ndxInitializer, loopNdx, quantifierRecurse);
							if (match) {
								latestMatch = matches[matches.length - 1].match;
								if (isFirstMatch(latestMatch, optionalToken)) {
									insertStop = true; //insert a stop
									testPos = pos; //match the position after the group
								} else return true;
							}
						} else if (match.isAlternator) {
							var alternateToken = match,
								malternateMatches = [],
								maltMatches,
								currentMatches = matches.slice(),
								loopNdxCnt = loopNdx.length;
							//console.log("before " + ndxInitializer);
							var altIndex = ndxInitializer.length > 0 ? ndxInitializer.shift() : -1;
							if (altIndex === -1 || typeof altIndex === "string") {
								var currentPos = testPos,
									ndxInitializerClone = ndxInitializer.slice(),
									altIndexArr = [],
									amndx;
								if (typeof altIndex == "string") {
									altIndexArr = altIndex.split(",");
								} else {
									for (amndx = 0; amndx < alternateToken.matches.length; amndx++) {
										altIndexArr.push(amndx);
									}
								}
								for (var ndx = 0; ndx < altIndexArr.length; ndx++) {
									amndx = parseInt(altIndexArr[ndx]);
									matches = [];
									//set the correct ndxInitializer
									ndxInitializer = resolveNdxInitializer(testPos, amndx) || ndxInitializerClone.slice();
									//console.log("resolved " + ndxInitializerClone + " vs " + resolveNdxInitializer(testPos, amndx));
									match = handleMatch(alternateToken.matches[amndx] || maskToken.matches[amndx], [amndx].concat(loopNdx), quantifierRecurse) || match;
									if (match !== true && match !== undefined && (altIndexArr[altIndexArr.length - 1] < alternateToken.matches.length)) { //no match in the alternations (length mismatch) => look further
										var ntndx = $.inArray(match, maskToken.matches) + 1;
										if (maskToken.matches.length > ntndx) {
											match = handleMatch(maskToken.matches[ntndx], [ntndx].concat(loopNdx.slice(1, loopNdx.length)), quantifierRecurse);
											if (match) {
												altIndexArr.push(ntndx.toString());
												$.each(matches, function (ndx, lmnt) {
													lmnt.alternation = loopNdx.length - 1;
												});
											}
										}
									}
									maltMatches = matches.slice();
									testPos = currentPos;
									matches = [];

									//fuzzy merge matches
									for (var ndx1 = 0; ndx1 < maltMatches.length; ndx1++) {
										var altMatch = maltMatches[ndx1], hasMatch = false;
										altMatch.alternation = altMatch.alternation || loopNdxCnt;
										for (var ndx2 = 0; ndx2 < malternateMatches.length; ndx2++) {
											var altMatch2 = malternateMatches[ndx2];
											//verify equality
											if (typeof altIndex !== "string" || $.inArray(altMatch.locator[altMatch.alternation].toString(), altIndexArr) !== -1) {
												if (altMatch.match.def === altMatch2.match.def || staticCanMatchDefinition(altMatch, altMatch2)) {
													hasMatch = altMatch.match.mask === altMatch2.match.mask;
													if (altMatch2.locator[altMatch.alternation].toString().indexOf(altMatch.locator[altMatch.alternation]) === -1) {
														altMatch2.locator[altMatch.alternation] = altMatch2.locator[altMatch.alternation] + "," + altMatch.locator[altMatch.alternation];
														altMatch2.alternation = altMatch.alternation; //we pass the alternation index => used in determineLastRequiredPosition
														if (altMatch.match.fn == null) { //staticCanMatchDefinition => set no alternate on match
															altMatch2.na = altMatch2.na || altMatch.locator[altMatch.alternation].toString();
															if (altMatch2.na.indexOf(altMatch.locator[altMatch.alternation]) === -1)
																altMatch2.na = altMatch2.na + "," + altMatch.locator[altMatch.alternation];
														}
													}
													break;
												}
											}
										}
										if (!hasMatch) {
											malternateMatches.push(altMatch);
										}
									}
								}
								if (typeof altIndex == "string") { //filter matches
									malternateMatches = $.map(malternateMatches, function (lmnt, ndx) {
										if (isFinite(ndx)) {
											var mamatch,
												alternation = lmnt.alternation,
												altLocArr = lmnt.locator[alternation].toString().split(",");
											lmnt.locator[alternation] = undefined;
											lmnt.alternation = undefined;

											for (var alndx = 0; alndx < altLocArr.length; alndx++) {
												mamatch = $.inArray(altLocArr[alndx], altIndexArr) !== -1;
												if (mamatch) { //rebuild the locator with valid entries
													if (lmnt.locator[alternation] !== undefined) {
														lmnt.locator[alternation] += ",";
														lmnt.locator[alternation] += altLocArr[alndx];
													} else lmnt.locator[alternation] = parseInt(altLocArr[alndx]);

													lmnt.alternation = alternation;
												}
											}

											if (lmnt.locator[alternation] !== undefined) return lmnt;
										}
									});
								}

								matches = currentMatches.concat(malternateMatches);
								testPos = pos;
								insertStop = matches.length > 0; //insert a stopelemnt when there is an alternate - needed for non-greedy option

								//cloneback
								ndxInitializer = ndxInitializerClone.slice();
							} else {
								// if (alternateToken.matches[altIndex]) { //if not in the initial alternation => look further
								match = handleMatch(alternateToken.matches[altIndex] || maskToken.matches[altIndex], [altIndex].concat(loopNdx), quantifierRecurse);
								// } else match = false;
							}
							if (match) return true;
						} else if (match.isQuantifier && quantifierRecurse !== maskToken.matches[$.inArray(match, maskToken.matches) - 1]) {
							var qt = match;
							for (var qndx = (ndxInitializer.length > 0) ? ndxInitializer.shift() : 0; (qndx < (isNaN(qt.quantifier.max) ? qndx + 1 : qt.quantifier.max)) && testPos <= pos; qndx++) {
								var tokenGroup = maskToken.matches[$.inArray(qt, maskToken.matches) - 1];
								match = handleMatch(tokenGroup, [qndx].concat(loopNdx), tokenGroup); //set the tokenGroup as quantifierRecurse marker
								if (match) {
									//get latest match
									latestMatch = matches[matches.length - 1].match;
									latestMatch.optionalQuantifier = qndx > (qt.quantifier.min - 1);
									if (isFirstMatch(latestMatch, tokenGroup)) { //search for next possible match
										if (qndx > (qt.quantifier.min - 1)) {
											insertStop = true;
											testPos = pos; //match the position after the group
											break; //stop quantifierloop
										} else return true;
									} else {
										return true;
									}
								}
							}
						} else {
							match = resolveTestFromToken(match, ndxInitializer, loopNdx, quantifierRecurse);
							if (match) return true;
						}
					}

					else
						testPos++;
				}

				for (var tndx = (ndxInitializer.length > 0 ? ndxInitializer.shift() : 0); tndx < maskToken.matches.length; tndx++) {
					if (maskToken.matches[tndx].isQuantifier !== true) {
						var match = handleMatch(maskToken.matches[tndx], [tndx].concat(loopNdx), quantifierRecurse);
						if (match && testPos === pos) {
							return match;
						} else if (testPos > pos) {
							break;
						}
					}
				}
			}

			function mergeLocators(tests) {
				var locator = [];
				if (!$.isArray(tests)) tests = [tests];
				if (tests.length > 0) {
					if (tests[0].alternation === undefined) {
						locator = determineTestTemplate(tests.slice()).locator.slice();
						if (locator.length === 0) locator = tests[0].locator.slice();
					}
					else {
						$.each(tests, function (ndx, tst) {
							if (tst.def !== "") {
								if (locator.length === 0) locator = tst.locator.slice();
								else {
									for (var i = 0; i < locator.length; i++) {
										if (tst.locator[i] && locator[i].toString().indexOf(tst.locator[i]) === -1) {
											locator[i] += "," + tst.locator[i];
										}
									}
								}
							}
						});
					}
				}
				return locator;
			}

			function filterTests(tests) {
				if (opts.keepStatic && pos > 0) {
					if (tests.length > 1 + (tests[tests.length - 1].match.def === "" ? 1 : 0)) {
						if (tests[0].match.optionality !== true &&
							tests[0].match.optionalQuantifier !== true &&
							tests[0].match.fn === null && !/[0-9a-bA-Z]/.test(tests[0].match.def)) {
							return [determineTestTemplate(tests)];
						}
					}
				}

				return tests;
			}

			if (pos > -1) {
				if (ndxIntlzr === undefined) { //determine index initializer
					var previousPos = pos - 1,
						test;
					while ((test = getMaskSet().validPositions[previousPos] || getMaskSet().tests[previousPos]) === undefined && previousPos > -1) {
						previousPos--;
					}
					if (test !== undefined && previousPos > -1) {
						ndxInitializer = mergeLocators(test);
						cacheDependency = ndxInitializer.join("");
						testPos = previousPos;
					}
				}
				if (getMaskSet().tests[pos] && getMaskSet().tests[pos][0].cd === cacheDependency) { //cacheDependency is set on all tests, just check on the first
					//console.log("cache hit " + pos + " - " + ndxIntlzr);
					return filterTests(getMaskSet().tests[pos]);
				}
				for (var mtndx = ndxInitializer.shift(); mtndx < maskTokens.length; mtndx++) {
					var match = resolveTestFromToken(maskTokens[mtndx], ndxInitializer, [mtndx]);
					if ((match && testPos === pos) || testPos > pos) {
						break;
					}
				}
			}
			if (matches.length === 0 || insertStop) {
				matches.push({
					match: {
						fn: null,
						cardinality: 0,
						optionality: true,
						casing: null,
						def: "",
						placeholder: ""
					},
					locator: [],
					cd: cacheDependency
				});
			}

			if (ndxIntlzr !== undefined && getMaskSet().tests[pos]) { //prioritize full tests for caching
				return filterTests($.extend(true, [], matches));
			}
			getMaskSet().tests[pos] = $.extend(true, [], matches); //set a clone to prevent overwriting some props
			//console.log(pos + " - " + JSON.stringify(matches));
			return filterTests(getMaskSet().tests[pos]);
		}

		function getBufferTemplate() {
			if (getMaskSet()._buffer === undefined) {
				//generate template
				getMaskSet()._buffer = getMaskTemplate(false, 1);
				if (getMaskSet().buffer === undefined) {
					getMaskSet()._buffer.slice();
				}
			}
			return getMaskSet()._buffer;
		}

		function getBuffer(noCache) {
			if (getMaskSet().buffer === undefined || noCache === true) {
				getMaskSet().buffer = getMaskTemplate(true, getLastValidPosition(), true);
			}
			return getMaskSet().buffer;
		}

		function refreshFromBuffer(start, end, buffer) {
			var i;
			if (start === true) {
				resetMaskSet();
				start = 0;
				end = buffer.length;
			} else {
				for (i = start; i < end; i++) {
					delete getMaskSet().validPositions[i];
				}
			}
			for (i = start; i < end; i++) {
				resetMaskSet(true); //prevents clobber from the buffer
				if (buffer[i] !== opts.skipOptionalPartCharacter) {
					isValid(i, buffer[i], true, true);
				}
			}
		}

		function casing(elem, test, pos) {
			switch (opts.casing || test.casing) {
				case "upper":
					elem = elem.toUpperCase();
					break;
				case "lower":
					elem = elem.toLowerCase();
					break;
				case "title":
					var posBefore = getMaskSet().validPositions[pos - 1];
					if (pos === 0 || posBefore && posBefore.input === String.fromCharCode(Inputmask.keyCode.SPACE)) {
						elem = elem.toUpperCase();
					} else {
						elem = elem.toLowerCase();
					}
					break;
			}

			return elem;
		}

		function checkAlternationMatch(altArr1, altArr2) {
			var altArrC = opts.greedy ? altArr2 : altArr2.slice(0, 1),
				isMatch = false;
			for (var alndx = 0; alndx < altArr1.length; alndx++) {
				if ($.inArray(altArr1[alndx], altArrC) !== -1) {
					isMatch = true;
					break;
				}
			}
			return isMatch;
		}

		function isValid(pos, c, strict, fromSetValid, fromAlternate) { //strict true ~ no correction or autofill
			function isSelection(posObj) {
				return isRTL ? (posObj.begin - posObj.end) > 1 || ((posObj.begin - posObj.end) === 1 && opts.insertMode) :
				(posObj.end - posObj.begin) > 1 || ((posObj.end - posObj.begin) === 1 && opts.insertMode);
			}

			strict = strict === true; //always set a value to strict to prevent possible strange behavior in the extensions

			var maskPos = pos;
			if (pos.begin !== undefined) { //position was a position object - used to handle a delete by typing over a selection
				maskPos = isRTL && !isSelection(pos) ? pos.end : pos.begin;
			}

			function _isValid(position, c, strict) {
				var rslt = false;
				$.each(getTests(position), function (ndx, tst) {
						var test = tst.match,
							loopend = c ? 1 : 0,
							chrs = "";
						for (var i = test.cardinality; i > loopend; i--) {
							chrs += getBufferElement(position - (i - 1));
						}
						if (c) {
							chrs += c;
						}

						//make sure the buffer is set and correct
						getBuffer(true);
						//return is false or a json object => { pos: ??, c: ??} or true
						rslt = test.fn != null ?
							test.fn.test(chrs, getMaskSet(), position, strict, opts, isSelection(pos)) : (c === test.def || c === opts.skipOptionalPartCharacter) && test.def !== "" ? //non mask
						{
							c: test.placeholder || test.def,
							pos: position
						} : false;

						if (rslt !== false) {
							var elem = rslt.c !== undefined ? rslt.c : c;
							elem = (elem === opts.skipOptionalPartCharacter && test.fn === null) ? (test.placeholder || test.def) : elem;

							var validatedPos = position,
								possibleModifiedBuffer = getBuffer();

							if (rslt.remove !== undefined) { //remove position(s)
								if (!$.isArray(rslt.remove)) rslt.remove = [rslt.remove];
								$.each(rslt.remove.sort(function (a, b) {
									return b - a;
								}), function (ndx, lmnt) {
									stripValidPositions(lmnt, lmnt + 1, true);
								});
							}
							if (rslt.insert !== undefined) { //insert position(s)
								if (!$.isArray(rslt.insert)) rslt.insert = [rslt.insert];
								$.each(rslt.insert.sort(function (a, b) {
									return a - b;
								}), function (ndx, lmnt) {
									isValid(lmnt.pos, lmnt.c, false, fromSetValid);
								});
							}

							if (rslt.refreshFromBuffer) {
								var refresh = rslt.refreshFromBuffer;
								strict = true;
								refreshFromBuffer(refresh === true ? refresh : refresh.start, refresh.end, possibleModifiedBuffer);
								if (rslt.pos === undefined && rslt.c === undefined) {
									rslt.pos = getLastValidPosition();
									return false; //breakout if refreshFromBuffer && nothing to insert
								}
								validatedPos = rslt.pos !== undefined ? rslt.pos : position;
								if (validatedPos !== position) {
									rslt = $.extend(rslt, isValid(validatedPos, elem, true, fromSetValid)); //revalidate new position strict
									return false;
								}

							} else if (rslt !== true && rslt.pos !== undefined && rslt.pos !== position) { //their is a position offset
								validatedPos = rslt.pos;
								refreshFromBuffer(position, validatedPos, getBuffer().slice());
								if (validatedPos !== position) {
									rslt = $.extend(rslt, isValid(validatedPos, elem, true)); //revalidate new position strict
									return false;
								}
							}

							if (rslt !== true && rslt.pos === undefined && rslt.c === undefined) {
								return false; //breakout if nothing to insert
							}

							if (ndx > 0) {
								resetMaskSet(true);
							}

							if (!setValidPosition(validatedPos, $.extend({}, tst, {
									"input": casing(elem, test, validatedPos)
								}), fromSetValid, isSelection(pos))) {
								rslt = false;
							}
							return false; //break from $.each
						}
					}
				);
				return rslt;
			}

			function alternate(pos, c, strict) {
				var validPsClone = $.extend(true, {}, getMaskSet().validPositions),
					lastAlt,
					alternation,
					isValidRslt = false,
					altPos, prevAltPos, i, validPos, lAltPos = getLastValidPosition(), altNdxs, decisionPos;
				//find last modified alternation
				prevAltPos = getMaskSet().validPositions[lAltPos];
				for (; lAltPos >= 0; lAltPos--) {
					altPos = getMaskSet().validPositions[lAltPos];
					if (altPos && altPos.alternation !== undefined) {
						lastAlt = lAltPos;
						alternation = getMaskSet().validPositions[lastAlt].alternation;
						if (prevAltPos.locator[altPos.alternation] !== altPos.locator[altPos.alternation]) {
							break;
						}
						prevAltPos = altPos;
					}
				}
				if (alternation !== undefined) {
					decisionPos = parseInt(lastAlt);
					var decisionTaker = prevAltPos.locator[prevAltPos.alternation || alternation] !== undefined ? prevAltPos.locator[prevAltPos.alternation || alternation] : altNdxs[0]; //no match in the alternations (length mismatch)
					if (decisionTaker.length > 0) { //no decision taken ~ take first one as decider
						decisionTaker = decisionTaker.split(",")[0];
					}
					var possibilityPos = getMaskSet().validPositions[decisionPos], prevPos = getMaskSet().validPositions[decisionPos - 1];
					$.each(getTests(decisionPos, prevPos ? prevPos.locator : undefined, decisionPos - 1), function (ndx, test) {
						altNdxs = test.locator[alternation] ? test.locator[alternation].toString().split(",") : [];
						for (var mndx = 0; mndx < altNdxs.length; mndx++) {
							var validInputs = [],
								staticInputsBeforePos = 0,
								staticInputsBeforePosAlternate = 0,
								verifyValidInput = false;
							if (decisionTaker < altNdxs[mndx] && (test.na === undefined || $.inArray(altNdxs[mndx], test.na.split(",")) === -1)) {
								getMaskSet().validPositions[decisionPos] = $.extend(true, {}, test);
								var possibilities = getMaskSet().validPositions[decisionPos].locator;
								getMaskSet().validPositions[decisionPos].locator[alternation] = parseInt(altNdxs[mndx]); //set forced decision
								if (test.match.fn == null) {
									if (possibilityPos.input !== test.match.def) {
										verifyValidInput = true; //verify that the new definition matches the input
										if (possibilityPos.generatedInput !== true) {
											validInputs.push(possibilityPos.input);
										}
									}
									staticInputsBeforePosAlternate++;
									getMaskSet().validPositions[decisionPos].generatedInput = !/[0-9a-bA-Z]/.test(test.match.def);
									getMaskSet().validPositions[decisionPos].input = test.match.def;
								} else {
									getMaskSet().validPositions[decisionPos].input = possibilityPos.input;
								}
								for (i = decisionPos + 1; i < getLastValidPosition(undefined, true) + 1; i++) {
									validPos = getMaskSet().validPositions[i];
									if (validPos && validPos.generatedInput !== true && /[0-9a-bA-Z]/.test(validPos.input)) {
										validInputs.push(validPos.input);
									} else if (i < pos) staticInputsBeforePos++;
									delete getMaskSet().validPositions[i];
								}
								if (verifyValidInput && validInputs[0] === test.match.def) {
									validInputs.shift();
								}
								resetMaskSet(true); //clear getbuffer
								isValidRslt = true;
								while (validInputs.length > 0) {
									var input = validInputs.shift();
									if (input !== opts.skipOptionalPartCharacter) {
										if (!(isValidRslt = isValid(getLastValidPosition(undefined, true) + 1, input, false, fromSetValid, true))) {
											break;
										}
									}
								}

								if (isValidRslt) {
									getMaskSet().validPositions[decisionPos].locator = possibilities; //reset forceddecision ~ needed for proper delete
									var targetLvp = getLastValidPosition(pos) + 1;
									for (i = decisionPos + 1; i < getLastValidPosition() + 1; i++) {
										validPos = getMaskSet().validPositions[i];
										if ((validPos === undefined || validPos.match.fn == null) && i < (pos + (staticInputsBeforePosAlternate - staticInputsBeforePos))) {
											staticInputsBeforePosAlternate++;
										}
									}
									pos = pos + (staticInputsBeforePosAlternate - staticInputsBeforePos);
									isValidRslt = isValid(pos > targetLvp ? targetLvp : pos, c, strict, fromSetValid, true);
								}
								if (!isValidRslt) {
									resetMaskSet();
									getMaskSet().validPositions = $.extend(true, {}, validPsClone);
								} else return false; //exit $.each
							}
						}
					});
				}

				return isValidRslt;
			}

//set alternator choice on previous skipped placeholder positions
			function trackbackAlternations(originalPos, newPos) {
				var vp = getMaskSet().validPositions[newPos],
					targetLocator = vp.locator,
					tll = targetLocator.length;

				for (var ps = originalPos; ps < newPos; ps++) {
					if (getMaskSet().validPositions[ps] === undefined && !isMask(ps, true)) {
						var tests = getTests(ps),
							bestMatch = tests[0],
							equality = -1;
						$.each(tests, function (ndx, tst) { //find best matching
							for (var i = 0; i < tll; i++) {
								if (tst.locator[i] !== undefined && checkAlternationMatch(tst.locator[i].toString().split(","), targetLocator[i].toString().split(","))) {
									if (equality < i) {
										equality = i;
										bestMatch = tst;
									}
								} else break;
							}
						});
						setValidPosition(ps, $.extend({}, bestMatch, {
							"input": bestMatch.match.placeholder || bestMatch.match.def
						}), true);
					}
				}
			}

			var result = false,
				positionsClone = $.extend(true, {}, getMaskSet().validPositions); //clone the currentPositions

//Check for a nonmask before the pos
//find previous valid
			for (var pndx = maskPos - 1; pndx > -1; pndx--) {
				if (getMaskSet().validPositions[pndx]) break;
			}
////fill missing nonmask and valid placeholders
			var testTemplate, generatedPos, testsFromPos;
			for (pndx++; pndx < maskPos; pndx++) {
				if (getMaskSet().validPositions[pndx] === undefined && (opts.jitMasking === false || opts.jitMasking > pndx)) {
					testsFromPos = getTests(pndx, getTestTemplate(pndx - 1).locator, pndx - 1).slice();
					if (testsFromPos[testsFromPos.length - 1].match.def === "") testsFromPos.pop();
					testTemplate = determineTestTemplate(testsFromPos);
					if (testTemplate && (testTemplate.match.def === opts.radixPointDefinitionSymbol || !isMask(pndx, true) ||
						($.inArray(opts.radixPoint, getBuffer()) < pndx && testTemplate.match.fn && testTemplate.match.fn.test(getPlaceholder(pndx), getMaskSet(), pndx, false, opts)))) {
						result = _isValid(pndx, testTemplate.match.placeholder || (testTemplate.match.fn == null ? testTemplate.match.def : (getPlaceholder(pndx) !== "" ? getPlaceholder(pndx) : getBuffer()[pndx])), true);
						if (result !== false) {
							getMaskSet().validPositions[result.pos || pndx].generatedInput = true;
						}
					}
				}
			}


			if (isSelection(pos)) {
				handleRemove(undefined, Inputmask.keyCode.DELETE, pos);
				maskPos = getMaskSet().p;
			}

			if (maskPos < getMaskSet().maskLength) {
				result = _isValid(maskPos, c, strict);
				if ((!strict || fromSetValid === true) && result === false) {
					var currentPosValid = getMaskSet().validPositions[maskPos];
					if (currentPosValid && currentPosValid.match.fn === null && (currentPosValid.match.def === c || c === opts.skipOptionalPartCharacter)) {
						result = {
							"caret": seekNext(maskPos)
						};
					} else if ((opts.insertMode || getMaskSet().validPositions[seekNext(maskPos)] === undefined) && !isMask(maskPos, true)) { //does the input match on a further position?
						testsFromPos = getTests(maskPos).slice();
						if (testsFromPos[testsFromPos.length - 1].match.def === "") testsFromPos.pop();
						var staticChar = determineTestTemplate(testsFromPos, true);
						if (staticChar) {
							staticChar = staticChar.match.placeholder || staticChar.match.def;
							_isValid(maskPos, staticChar, strict);
						}
						for (var nPos = maskPos + 1, snPos = seekNext(maskPos); nPos <= snPos; nPos++) {
							result = _isValid(nPos, c, strict);
							if (result !== false) {
								trackbackAlternations(maskPos, nPos);
								maskPos = nPos;
								break;
							}
						}
					}
				}
			}
			if (result === false && opts.keepStatic && !strict && fromAlternate !== true) { //try fuzzy alternator logic
				result = alternate(maskPos, c, strict);
			}
			if (result === true) {
				result = {
					"pos": maskPos
				};
			}
			if ($.isFunction(opts.postValidation) && result !== false && !strict && fromSetValid !== true) {
				result = opts.postValidation(getBuffer(true), result, opts) ? result : false;
			}

			if (result.pos === undefined) {
				result.pos = maskPos;
			}

			if (result === false) {
				resetMaskSet(true);
				getMaskSet().validPositions = $.extend(true, {}, positionsClone); //revert validation changes
			}

			return result;
		}

		function isMask(pos, strict) {
			var test;
			if (strict) {
				test = getTestTemplate(pos).match;
				if (test.def === "") test = getTest(pos).match;
			} else test = getTest(pos).match;

			if (test.fn != null) {
				return test.fn;
			} else if (strict !== true && pos > -1) {
				var tests = getTests(pos);
				return tests.length > 1 + (tests[tests.length - 1].match.def === "" ? 1 : 0);
			}
			return false;
		}

		function seekNext(pos, newBlock) {
			var maskL = getMaskSet().maskLength;
			if (pos >= maskL) return maskL;
			var position = pos;
			while (++position < maskL &&
			((newBlock === true && (getTest(position).match.newBlockMarker !== true || !isMask(position))) ||
			(newBlock !== true && !isMask(position)))) {
			}
			return position;
		}

		function seekPrevious(pos, newBlock) {
			var position = pos, tests;
			if (position <= 0) return 0;

			while (--position > 0 &&
			((newBlock === true && getTest(position).match.newBlockMarker !== true) ||
			(newBlock !== true && !isMask(position) &&
			(tests = getTests(position), tests.length < 2 || (tests.length === 2 && tests[1].match.def === ""))))) {
			}

			return position;
		}

		function getBufferElement(position) {
			return getMaskSet().validPositions[position] === undefined ? getPlaceholder(position) : getMaskSet().validPositions[position].input;
		}

		function writeBuffer(input, buffer, caretPos, event, triggerInputEvent) {
			if (event && $.isFunction(opts.onBeforeWrite)) {
				var result = opts.onBeforeWrite(event, buffer, caretPos, opts);
				if (result) {
					if (result.refreshFromBuffer) {
						var refresh = result.refreshFromBuffer;
						refreshFromBuffer(refresh === true ? refresh : refresh.start, refresh.end, result.buffer || buffer);
						buffer = getBuffer(true);
					}
					//only alter when intented !== undefined
					if (caretPos !== undefined) caretPos = result.caret !== undefined ? result.caret : caretPos;
				}
			}
			input.inputmask._valueSet(buffer.join(""));
			if (caretPos !== undefined && (event === undefined || event.type !== "blur")) {
				caret(input, caretPos);
			}
			if (triggerInputEvent === true) {
				skipInputEvent = true;
				$(input).trigger("input");
			}
		}

		function getPlaceholder(pos, test) {
			test = test || getTest(pos).match;
			if (test.placeholder !== undefined) {
				return test.placeholder;
			} else if (test.fn === null) {
				if (pos > -1 && getMaskSet().validPositions[pos] === undefined) {
					var tests = getTests(pos),
						staticAlternations = [],
						prevTest;
					if (tests.length > 1 + (tests[tests.length - 1].match.def === "" ? 1 : 0)) {
						for (var i = 0; i < tests.length; i++) {
							if (tests[i].match.optionality !== true && tests[i].match.optionalQuantifier !== true &&
								(tests[i].match.fn === null || (prevTest === undefined || tests[i].match.fn.test(prevTest.match.def, getMaskSet(), pos, true, opts) !== false))) {
								staticAlternations.push(tests[i]);
								if (tests[i].match.fn === null) prevTest = tests[i];
								if (staticAlternations.length > 1) {
									if (/[0-9a-bA-Z]/.test(staticAlternations[0].match.def)) {
										return opts.placeholder.charAt(pos % opts.placeholder.length);
									}
								}
							}
						}
					}
				}
				return test.def;
			}

			return opts.placeholder.charAt(pos % opts.placeholder.length);
		}

		function checkVal(input, writeOut, strict, nptvl, initiatingEvent, stickyCaret) {
			var inputValue = nptvl.slice(),
				charCodes = "",
				initialNdx = 0, result = undefined;

			function isTemplateMatch() {
				var isMatch = false;
				var charCodeNdx = getBufferTemplate().slice(initialNdx, seekNext(initialNdx)).join("").indexOf(charCodes);
				if (charCodeNdx !== -1 && !isMask(initialNdx)) {
					isMatch = true;
					var bufferTemplateArr = getBufferTemplate().slice(initialNdx, initialNdx + charCodeNdx);
					for (var i = 0; i < bufferTemplateArr.length; i++) {
						if (bufferTemplateArr[i] !== " ") {
							isMatch = false;
							break;
						}
					}
				}

				return isMatch;
			}

			resetMaskSet();
			getMaskSet().p = seekNext(-1);
			// if (writeOut) input.inputmask._valueSet(""); //initial clear

			if (!strict) {
				if (opts.autoUnmask !== true) {
					var staticInput = getBufferTemplate().slice(0, seekNext(-1)).join(""),
						matches = inputValue.join("").match(new RegExp("^" + Inputmask.escapeRegex(staticInput), "g"));
					if (matches && matches.length > 0) {
						inputValue.splice(0, matches.length * staticInput.length);
						initialNdx = seekNext(initialNdx);
					}
				} else {
					initialNdx = seekNext(initialNdx);
				}
			}


			$.each(inputValue, function (ndx, charCode) {
				if (charCode !== undefined) { //inputfallback strips some elements out of the inputarray.  $.each logically presents them as undefined
					var keypress = new $.Event("keypress");
					keypress.which = charCode.charCodeAt(0);
					charCodes += charCode;
					var lvp = getLastValidPosition(undefined, true),
						lvTest = getMaskSet().validPositions[lvp],
						nextTest = getTestTemplate(lvp + 1, lvTest ? lvTest.locator.slice() : undefined, lvp);
					if (!isTemplateMatch() || strict || opts.autoUnmask) {
						var pos = strict ? ndx : (nextTest.match.fn == null && nextTest.match.optionality && (lvp + 1) < getMaskSet().p ? lvp + 1 : getMaskSet().p);
						result = keypressEvent.call(input, keypress, true, false, strict, pos);
						initialNdx = pos + 1;
						charCodes = "";
					} else {
						result = keypressEvent.call(input, keypress, true, false, true, lvp + 1);
					}
					if (!strict && $.isFunction(opts.onBeforeWrite)) {
						result = opts.onBeforeWrite(keypress, getBuffer(), result.forwardPosition, opts);
						if (result && result.refreshFromBuffer) {
							var refresh = result.refreshFromBuffer;
							refreshFromBuffer(refresh === true ? refresh : refresh.start, refresh.end, result.buffer);
							resetMaskSet(true);
							if (result.caret) {
								getMaskSet().p = result.caret;
							}
						}
					}
				}
			});
			if (writeOut) {
				var caretPos = undefined, lvp = getLastValidPosition();
				if (document.activeElement === input && (initiatingEvent || result)) {
					caretPos = caret(input).begin - (stickyCaret === true ? 1 : 0);
					if (result && stickyCaret !== true && (caretPos < lvp + 1 || lvp === -1))
						caretPos = (opts.numericInput && result.caret === undefined) ? seekPrevious(result.forwardPosition) : result.forwardPosition;
				}
				writeBuffer(input, getBuffer(), caretPos, initiatingEvent || new $.Event("checkval"));
			}
		}

		function unmaskedvalue(input) {
			if (input && input.inputmask === undefined) {
				return input.value;
			}

			var umValue = [],
				vps = getMaskSet().validPositions;
			for (var pndx in vps) {
				if (vps[pndx].match && vps[pndx].match.fn != null) {
					umValue.push(vps[pndx].input);
				}
			}
			var unmaskedValue = umValue.length === 0 ? "" : (isRTL ? umValue.reverse() : umValue).join("");
			if ($.isFunction(opts.onUnMask)) {
				var bufferValue = (isRTL ? getBuffer().slice().reverse() : getBuffer()).join("");
				unmaskedValue = (opts.onUnMask(bufferValue, unmaskedValue, opts) || unmaskedValue);
			}
			return unmaskedValue;
		}

		function caret(input, begin, end, notranslate) {
			function translatePosition(pos) {
				if (notranslate !== true && isRTL && typeof pos === "number" && (!opts.greedy || opts.placeholder !== "")) {
					var bffrLght = getBuffer().join("").length; //join is needed because sometimes we get an empty buffer element which must not be counted for the caret position (numeric alias)
					pos = bffrLght - pos;
				}
				return pos;
			}

			var range;
			if (typeof begin === "number") {
				begin = translatePosition(begin);
				end = translatePosition(end);
				end = (typeof end == "number") ? end : begin;
				// if (!$(input).is(":visible")) {
				// 	return;
				// }

				var scrollCalc = parseInt(((input.ownerDocument.defaultView || window).getComputedStyle ? (input.ownerDocument.defaultView || window).getComputedStyle(input, null) : input.currentStyle).fontSize) * end;
				input.scrollLeft = scrollCalc > input.scrollWidth ? scrollCalc : 0;

				if (!mobile && opts.insertMode === false && begin === end) end++; //set visualization for insert/overwrite mode
				if (input.setSelectionRange) {
					input.selectionStart = begin;
					input.selectionEnd = end;
				} else if (window.getSelection) {
					range = document.createRange();
					if (input.firstChild === undefined || input.firstChild === null) {
						var textNode = document.createTextNode("");
						input.appendChild(textNode);
					}
					range.setStart(input.firstChild, begin < input.inputmask._valueGet().length ? begin : input.inputmask._valueGet().length);
					range.setEnd(input.firstChild, end < input.inputmask._valueGet().length ? end : input.inputmask._valueGet().length);
					range.collapse(true);
					var sel = window.getSelection();
					sel.removeAllRanges();
					sel.addRange(range);
					//input.focus();
				} else if (input.createTextRange) {
					range = input.createTextRange();
					range.collapse(true);
					range.moveEnd("character", end);
					range.moveStart("character", begin);
					range.select();

				}
			} else {
				if (input.setSelectionRange) {
					begin = input.selectionStart;
					end = input.selectionEnd;
				} else if (window.getSelection) {
					range = window.getSelection().getRangeAt(0);
					if (range.commonAncestorContainer.parentNode === input || range.commonAncestorContainer === input) {
						begin = range.startOffset;
						end = range.endOffset;
					}
				} else if (document.selection && document.selection.createRange) {
					range = document.selection.createRange();
					begin = 0 - range.duplicate().moveStart("character", -input.inputmask._valueGet().length);
					end = begin + range.text.length;
				}
				/*eslint-disable consistent-return */
				return {
					"begin": translatePosition(begin),
					"end": translatePosition(end)
				};
				/*eslint-enable consistent-return */
			}
		}

		function determineLastRequiredPosition(returnDefinition) {
			var buffer = getBuffer(),
				bl = buffer.length,
				pos, lvp = getLastValidPosition(),
				positions = {},
				lvTest = getMaskSet().validPositions[lvp],
				ndxIntlzr = lvTest !== undefined ? lvTest.locator.slice() : undefined,
				testPos;
			for (pos = lvp + 1; pos < buffer.length; pos++) {
				testPos = getTestTemplate(pos, ndxIntlzr, pos - 1);
				ndxIntlzr = testPos.locator.slice();
				positions[pos] = $.extend(true, {}, testPos);
			}

			var lvTestAlt = lvTest && lvTest.alternation !== undefined ? lvTest.locator[lvTest.alternation] : undefined;
			for (pos = bl - 1; pos > lvp; pos--) {
				testPos = positions[pos];
				if ((testPos.match.optionality ||
					testPos.match.optionalQuantifier ||
					(lvTestAlt && ((lvTestAlt !== positions[pos].locator[lvTest.alternation] && testPos.match.fn != null) ||
					(testPos.match.fn === null && testPos.locator[lvTest.alternation] && checkAlternationMatch(testPos.locator[lvTest.alternation].toString().split(","), lvTestAlt.toString().split(",")) && getTests(pos)[0].def !== "")))) && buffer[pos] === getPlaceholder(pos, testPos.match)) {
					bl--;
				} else break;
			}
			return returnDefinition ? {
				"l": bl,
				"def": positions[bl] ? positions[bl].match : undefined
			} : bl;
		}

		function clearOptionalTail(buffer) {
			var rl = determineLastRequiredPosition(),
				lmib = buffer.length - 1;
			for (; lmib > rl; lmib--) {
				if (isMask(lmib)) break; //fixme ismask is not good enough
			}
			buffer.splice(rl, lmib + 1 - rl);

			return buffer;
		}

		function isComplete(buffer) { //return true / false / undefined (repeat *)
			if ($.isFunction(opts.isComplete)) return opts.isComplete(buffer, opts);
			if (opts.repeat === "*") return undefined;
			var complete = false,
				lrp = determineLastRequiredPosition(true),
				aml = seekPrevious(lrp.l);

			if (lrp.def === undefined || lrp.def.newBlockMarker || lrp.def.optionality || lrp.def.optionalQuantifier) {
				complete = true;
				for (var i = 0; i <= aml; i++) {
					var test = getTestTemplate(i).match;
					if ((test.fn !== null && getMaskSet().validPositions[i] === undefined && test.optionality !== true && test.optionalQuantifier !== true) || (test.fn === null && buffer[i] !== getPlaceholder(i, test))) {
						complete = false;
						break;
					}
				}
			}
			return complete;
		}

		var EventRuler = {
			on: function (input, eventName, eventHandler) {
				var ev = function (e) {
					// console.log("triggered " + e.type);
					if (this.inputmask === undefined && this.nodeName !== "FORM") { //happens when cloning an object with jquery.clone
						var imOpts = $.data(this, "_inputmask_opts");
						if (imOpts)(new Inputmask(imOpts)).mask(this);
						else EventRuler.off(this);
					} else if (e.type !== "setvalue" && (this.disabled || (this.readOnly && !(e.type === "keydown" && (e.ctrlKey && e.keyCode === 67) || (opts.tabThrough === false && e.keyCode === Inputmask.keyCode.TAB))))) {
						e.preventDefault();
					} else {
						switch (e.type) {
							case "input":
								if (skipInputEvent === true) {
									skipInputEvent = false;
									return e.preventDefault();
								}
								break;
							case "keydown":
								//Safari 5.1.x - modal dialog fires keypress twice workaround
								skipKeyPressEvent = false;
								skipInputEvent = false;
								break;
							case "keypress":
								if (skipKeyPressEvent === true) {
									return e.preventDefault();
								}
								skipKeyPressEvent = true;
								break;
							case "click":
								if (iemobile) {
									var that = this;
									setTimeout(function () {
										eventHandler.apply(that, arguments);
									}, 0);
									return false;
								}
								break;
						}
						// console.log("executed " + e.type);
						var returnVal = eventHandler.apply(this, arguments);
						if (returnVal === false) {
							e.preventDefault();
							e.stopPropagation();
						}
						return returnVal;
					}
				};
				//keep instance of the event
				input.inputmask.events[eventName] = input.inputmask.events[eventName] || [];
				input.inputmask.events[eventName].push(ev);

				if ($.inArray(eventName, ["submit", "reset"]) !== -1) {
					if (input.form != null) $(input.form).on(eventName, ev);
				} else {
					$(input).on(eventName, ev);
				}
			},
			off: function (input, event) {
				if (input.inputmask && input.inputmask.events) {
					var events;
					if (event) {
						events = [];
						events[event] = input.inputmask.events[event];
					} else {
						events = input.inputmask.events;
					}
					$.each(events, function (eventName, evArr) {
						while (evArr.length > 0) {
							var ev = evArr.pop();
							if ($.inArray(eventName, ["submit", "reset"]) !== -1) {
								if (input.form != null) $(input.form).off(eventName, ev);
							} else {
								$(input).off(eventName, ev);
							}
						}
						delete input.inputmask.events[eventName];
					});
				}
			}
		};

		function patchValueProperty(npt) {
			var valueGet;
			var valueSet;

			function patchValhook(type) {
				if ($.valHooks && ($.valHooks[type] === undefined || $.valHooks[type].inputmaskpatch !== true)) {
					var valhookGet = $.valHooks[type] && $.valHooks[type].get ? $.valHooks[type].get : function (elem) {
						return elem.value;
					};
					var valhookSet = $.valHooks[type] && $.valHooks[type].set ? $.valHooks[type].set : function (elem, value) {
						elem.value = value;
						return elem;
					};

					$.valHooks[type] = {
						get: function (elem) {
							if (elem.inputmask) {
								if (elem.inputmask.opts.autoUnmask) {
									return elem.inputmask.unmaskedvalue();
								} else {
									var result = valhookGet(elem);
									return getLastValidPosition(undefined, undefined, elem.inputmask.maskset.validPositions) !== -1 || opts.nullable !== true ? result : "";
								}
							} else return valhookGet(elem);
						},
						set: function (elem, value) {
							var $elem = $(elem),
								result;
							result = valhookSet(elem, value);
							if (elem.inputmask) {
								$elem.trigger("setvalue");
							}
							return result;
						},
						inputmaskpatch: true
					};
				}
			}

			function getter() {
				if (this.inputmask) {
					return this.inputmask.opts.autoUnmask ?
						this.inputmask.unmaskedvalue() :
						(getLastValidPosition() !== -1 || opts.nullable !== true ?
							(document.activeElement === this && opts.clearMaskOnLostFocus ?
								(isRTL ? clearOptionalTail(getBuffer().slice()).reverse() : clearOptionalTail(getBuffer().slice())).join("") :
								valueGet.call(this)) :
							"");
				} else return valueGet.call(this);
			}

			function setter(value) {
				valueSet.call(this, value);
				if (this.inputmask) {
					$(this).trigger("setvalue");
				}
			}

			function installNativeValueSetFallback(npt) {
				EventRuler.on(npt, "mouseenter", function (event) {
					var $input = $(this),
						input = this,
						value = input.inputmask._valueGet();
					if (value !== getBuffer().join("") /*&& getLastValidPosition() > 0*/) {
						$input.trigger("setvalue");
					}
				});
			}

			if (!npt.inputmask.__valueGet) {
				if (Object.getOwnPropertyDescriptor) {
					if (typeof Object.getPrototypeOf !== "function") {
						Object.getPrototypeOf = typeof "test".__proto__ === "object" ? function (object) {
							return object.__proto__;
						} : function (object) {
							return object.constructor.prototype;
						};
					}

					var valueProperty = Object.getPrototypeOf ? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(npt), "value") : undefined;
					if (valueProperty && valueProperty.get && valueProperty.set) {
						valueGet = valueProperty.get;
						valueSet = valueProperty.set;
						Object.defineProperty(npt, "value", {
							get: getter,
							set: setter,
							configurable: true
						});
					} else if (npt.tagName !== "INPUT") {
						valueGet = function () {
							return this.textContent;
						};
						valueSet = function (value) {
							this.textContent = value;
						};
						Object.defineProperty(npt, "value", {
							get: getter,
							set: setter,
							configurable: true
						});
					}
				} else if (document.__lookupGetter__ && npt.__lookupGetter__("value")) {
					valueGet = npt.__lookupGetter__("value");
					valueSet = npt.__lookupSetter__("value");

					npt.__defineGetter__("value", getter);
					npt.__defineSetter__("value", setter);
				}
				npt.inputmask.__valueGet = valueGet; //store native property getter
				npt.inputmask._valueGet = function (overruleRTL) {
					return isRTL && overruleRTL !== true ? valueGet.call(this.el).split("").reverse().join("") : valueGet.call(this.el);
				};
				npt.inputmask.__valueSet = valueSet; //store native property setter
				npt.inputmask._valueSet = function (value, overruleRTL) { //null check is needed for IE8 => otherwise converts to "null"
					valueSet.call(this.el, (value === null || value === undefined) ? "" : ((overruleRTL !== true && isRTL) ? value.split("").reverse().join("") : value));
				};

				if (valueGet === undefined) { //jquery.val fallback
					valueGet = function () {
						return this.value;
					};
					valueSet = function (value) {
						this.value = value;
					};
					patchValhook(npt.type);
					installNativeValueSetFallback(npt);
				}
			}
		}

		function handleRemove(input, k, pos, strict) {
			function generalize() {
				if (opts.keepStatic) {
					var validInputs = [],
						lastAlt = getLastValidPosition(-1, true), positionsClone = $.extend(true, {}, getMaskSet().validPositions),
						prevAltPos = getMaskSet().validPositions[lastAlt];
					//find last alternation
					for (; lastAlt >= 0; lastAlt--) {
						var altPos = getMaskSet().validPositions[lastAlt];
						if (altPos) {
							if (altPos.generatedInput !== true && /[0-9a-bA-Z]/.test(altPos.input)) {
								validInputs.push(altPos.input);
							}
							delete getMaskSet().validPositions[lastAlt];
							if (altPos.alternation !== undefined && altPos.locator[altPos.alternation] !== prevAltPos.locator[altPos.alternation]) {
								break;
							}
							prevAltPos = altPos;
						}
					}

					if (lastAlt > -1) {
						getMaskSet().p = seekNext(getLastValidPosition(-1, true));
						while (validInputs.length > 0) {
							var keypress = new $.Event("keypress");
							keypress.which = validInputs.pop().charCodeAt(0);
							keypressEvent.call(input, keypress, true, false, false, getMaskSet().p);
						}
					} else getMaskSet().validPositions = $.extend(true, {}, positionsClone); //restore original positions
				}
			}

			if (opts.numericInput || isRTL) {
				if (k === Inputmask.keyCode.BACKSPACE) {
					k = Inputmask.keyCode.DELETE;
				} else if (k === Inputmask.keyCode.DELETE) {
					k = Inputmask.keyCode.BACKSPACE;
				}

				if (isRTL) {
					var pend = pos.end;
					pos.end = pos.begin;
					pos.begin = pend;
				}
			}

			if (k === Inputmask.keyCode.BACKSPACE && (pos.end - pos.begin < 1 || opts.insertMode === false)) {
				pos.begin = seekPrevious(pos.begin);
				if (getMaskSet().validPositions[pos.begin] !== undefined && (getMaskSet().validPositions[pos.begin].input === opts.groupSeparator || getMaskSet().validPositions[pos.begin].input === opts.radixPoint)) {
					pos.begin--;
				}
			} else if (k === Inputmask.keyCode.DELETE && pos.begin === pos.end) {
				pos.end = isMask(pos.end, true) ? pos.end + 1 : seekNext(pos.end) + 1;
				if (getMaskSet().validPositions[pos.begin] !== undefined && (getMaskSet().validPositions[pos.begin].input === opts.groupSeparator || getMaskSet().validPositions[pos.begin].input === opts.radixPoint)) {
					pos.end++;
				}
			}

			stripValidPositions(pos.begin, pos.end, false, strict);
			if (strict !== true) {
				generalize(); //revert the alternation
			}
			var lvp = getLastValidPosition(pos.begin, true);
			if (lvp < pos.begin) {
				//if (lvp === -1) resetMaskSet();
				getMaskSet().p = seekNext(lvp);
			} else if (strict !== true) {
				getMaskSet().p = pos.begin;
			}
		}

		function keydownEvent(e) {
			var input = this,
				$input = $(input),
				k = e.keyCode,
				pos = caret(input);

			//backspace, delete, and escape get special treatment
			if (k === Inputmask.keyCode.BACKSPACE || k === Inputmask.keyCode.DELETE || (iphone && k === Inputmask.keyCode.BACKSPACE_SAFARI) || (e.ctrlKey && k === Inputmask.keyCode.X && !isInputEventSupported("cut"))) { //backspace/delete
				e.preventDefault(); //stop default action but allow propagation
				handleRemove(input, k, pos);
				writeBuffer(input, getBuffer(true), getMaskSet().p, e, input.inputmask._valueGet() !== getBuffer().join(""));
				if (input.inputmask._valueGet() === getBufferTemplate().join("")) {
					$input.trigger("cleared");
				} else if (isComplete(getBuffer()) === true) {
					$input.trigger("complete");
				}
				if (opts.showTooltip) { //update tooltip
					input.title = opts.tooltip || getMaskSet().mask;
				}
			} else if (k === Inputmask.keyCode.END || k === Inputmask.keyCode.PAGE_DOWN) { //when END or PAGE_DOWN pressed set position at lastmatch
				e.preventDefault();
				var caretPos = seekNext(getLastValidPosition());
				if (!opts.insertMode && caretPos === getMaskSet().maskLength && !e.shiftKey) caretPos--;
				caret(input, e.shiftKey ? pos.begin : caretPos, caretPos, true);
			} else if ((k === Inputmask.keyCode.HOME && !e.shiftKey) || k === Inputmask.keyCode.PAGE_UP) { //Home or page_up
				e.preventDefault();
				caret(input, 0, e.shiftKey ? pos.begin : 0, true);
			} else if (((opts.undoOnEscape && k === Inputmask.keyCode.ESCAPE) || (k === 90 && e.ctrlKey)) && e.altKey !== true) { //escape && undo && #762
				checkVal(input, true, false, undoValue.split(""));
				$input.trigger("click");
			} else if (k === Inputmask.keyCode.INSERT && !(e.shiftKey || e.ctrlKey)) { //insert
				opts.insertMode = !opts.insertMode;
				caret(input, !opts.insertMode && pos.begin === getMaskSet().maskLength ? pos.begin - 1 : pos.begin);
			} else if (opts.tabThrough === true && k === Inputmask.keyCode.TAB) {
				if (e.shiftKey === true) {
					if (getTest(pos.begin).match.fn === null) {
						pos.begin = seekNext(pos.begin);
					}
					pos.end = seekPrevious(pos.begin, true);
					pos.begin = seekPrevious(pos.end, true);
				} else {
					pos.begin = seekNext(pos.begin, true);
					pos.end = seekNext(pos.begin, true);
					if (pos.end < getMaskSet().maskLength) pos.end--;
				}
				if (pos.begin < getMaskSet().maskLength) {
					e.preventDefault();
					caret(input, pos.begin, pos.end);
				}
			} else if (opts.insertMode === false && !e.shiftKey) {
				if (k === Inputmask.keyCode.RIGHT) {
					setTimeout(function () {
						var caretPos = caret(input);
						caret(input, caretPos.begin);
					}, 0);
				} else if (k === Inputmask.keyCode.LEFT) {
					setTimeout(function () {
						var caretPos = caret(input);
						caret(input, isRTL ? caretPos.begin + 1 : caretPos.begin - 1);
					}, 0);
				}
			}
			opts.onKeyDown.call(this, e, getBuffer(), caret(input).begin, opts);
			ignorable = $.inArray(k, opts.ignorables) !== -1;
		}

		function keypressEvent(e, checkval, writeOut, strict, ndx) {
			var input = this,
				$input = $(input),
				k = e.which || e.charCode || e.keyCode;

			if (checkval !== true && (!(e.ctrlKey && e.altKey) && (e.ctrlKey || e.metaKey || ignorable))) {
				if (k === Inputmask.keyCode.ENTER && undoValue !== getBuffer().join("")) {
					undoValue = getBuffer().join("");
					// e.preventDefault();
					setTimeout(function () {
						$input.trigger("change");
					}, 0);
				}
				return true;
			} else {
				if (k) {
					//special treat the decimal separator
					if (k === 46 && e.shiftKey === false && opts.radixPoint === ",") k = 44;
					var pos = checkval ? {
							begin: ndx,
							end: ndx
						} : caret(input),
						forwardPosition, c = String.fromCharCode(k);

					getMaskSet().writeOutBuffer = true;
					var valResult = isValid(pos, c, strict);
					if (valResult !== false) {
						resetMaskSet(true);
						forwardPosition = valResult.caret !== undefined ? valResult.caret : checkval ? valResult.pos + 1 : seekNext(valResult.pos);
						getMaskSet().p = forwardPosition; //needed for checkval
					}

					if (writeOut !== false) {
						var self = this;
						setTimeout(function () {
							opts.onKeyValidation.call(self, k, valResult, opts);
						}, 0);
						if (getMaskSet().writeOutBuffer && valResult !== false) {
							var buffer = getBuffer();
							writeBuffer(input, buffer, (opts.numericInput && valResult.caret === undefined) ? seekPrevious(forwardPosition) : forwardPosition, e, checkval !== true);
							if (checkval !== true) {
								setTimeout(function () { //timeout needed for IE
									if (isComplete(buffer) === true) $input.trigger("complete");
								}, 0);
							}
						}
					}

					if (opts.showTooltip) { //update tooltip
						input.title = opts.tooltip || getMaskSet().mask;
					}

					e.preventDefault();

					if (checkval) {
						valResult.forwardPosition = forwardPosition;
						return valResult;
					}
				}
			}
		}

		function pasteEvent(e) {
			var input = this,
				ev = e.originalEvent || e,
				$input = $(input),
				inputValue = input.inputmask._valueGet(true),
				caretPos = caret(input),
				tempValue;

			if (isRTL) {
				tempValue = caretPos.end;
				caretPos.end = caretPos.begin;
				caretPos.begin = tempValue;
			}

			var valueBeforeCaret = inputValue.substr(0, caretPos.begin),
				valueAfterCaret = inputValue.substr(caretPos.end, inputValue.length);

			if (valueBeforeCaret === (isRTL ? getBufferTemplate().reverse() : getBufferTemplate()).slice(0, caretPos.begin).join("")) valueBeforeCaret = "";
			if (valueAfterCaret === (isRTL ? getBufferTemplate().reverse() : getBufferTemplate()).slice(caretPos.end).join("")) valueAfterCaret = "";
			if (isRTL) {
				tempValue = valueBeforeCaret;
				valueBeforeCaret = valueAfterCaret;
				valueAfterCaret = tempValue;
			}

			if (window.clipboardData && window.clipboardData.getData) { // IE
				inputValue = valueBeforeCaret + window.clipboardData.getData("Text") + valueAfterCaret;
			} else if (ev.clipboardData && ev.clipboardData.getData) {
				inputValue = valueBeforeCaret + ev.clipboardData.getData("text/plain") + valueAfterCaret;
			} else return true; //allow native paste event as fallback ~ masking will continue by inputfallback

			var pasteValue = inputValue;
			if ($.isFunction(opts.onBeforePaste)) {
				pasteValue = opts.onBeforePaste(inputValue, opts);
				if (pasteValue === false) {
					return e.preventDefault();
				}
				if (!pasteValue) {
					pasteValue = inputValue;
				}
			}
			checkVal(input, false, false, isRTL ? pasteValue.split("").reverse() : pasteValue.toString().split(""));
			writeBuffer(input, getBuffer(), seekNext(getLastValidPosition()), e, undoValue !== getBuffer().join(""));
			if (isComplete(getBuffer()) === true) {
				$input.trigger("complete");
			}

			return e.preventDefault();
		}

		function inputFallBackEvent(e) { //fallback when keypress fails
			var input = this,
				inputValue = input.inputmask._valueGet();

			if (getBuffer().join("") !== inputValue) {
				var caretPos = caret(input);
				inputValue = inputValue.replace(new RegExp("(" + Inputmask.escapeRegex(getBufferTemplate().join("")) + ")*"), "");

				if (iemobile) { //iemobile just set the character at the end althought the caret position is correctly set
					var inputChar = inputValue.replace(getBuffer().join(""), "");
					if (inputChar.length === 1) {
						var keypress = new $.Event("keypress");
						keypress.which = inputChar.charCodeAt(0);
						keypressEvent.call(input, keypress, true, true, false, getMaskSet().validPositions[caretPos.begin - 1] ? caretPos.begin : caretPos.begin - 1);
						return false;
					}
				}

				if (caretPos.begin > inputValue.length) {
					caret(input, inputValue.length);
					caretPos = caret(input);
				}
				//detect & treat possible backspace
				if ((getBuffer().length - inputValue.length) === 1 && inputValue.charAt(caretPos.begin) !== getBuffer()[caretPos.begin] && inputValue.charAt(caretPos.begin + 1) !== getBuffer()[caretPos.begin] && !isMask(caretPos.begin)) {
					e.keyCode = Inputmask.keyCode.BACKSPACE;
					keydownEvent.call(input, e);
				} else {
					var lvp = getLastValidPosition() + 1;
					var bufferTemplate = getBuffer().slice(lvp).join('');
					while (inputValue.match(Inputmask.escapeRegex(bufferTemplate) + "$") === null) {
						bufferTemplate = bufferTemplate.slice(1);
					}
					inputValue = inputValue.replace(bufferTemplate, "");
					inputValue = inputValue.split("");

					checkVal(input, true, false, inputValue, e, caretPos.begin < lvp);

					if (isComplete(getBuffer()) === true) {
						$(input).trigger("complete");
					}
				}
				e.preventDefault();
			}
		}

		function setValueEvent(e) {
			var input = this,
				value = input.inputmask._valueGet();
			checkVal(input, true, false, ($.isFunction(opts.onBeforeMask) ? (opts.onBeforeMask(value, opts) || value) : value).split(""));
			undoValue = getBuffer().join("");
			if ((opts.clearMaskOnLostFocus || opts.clearIncomplete) && input.inputmask._valueGet() === getBufferTemplate().join("")) {
				input.inputmask._valueSet("");
			}
		}

		function focusEvent(e) {
			var input = this,
				nptValue = input.inputmask._valueGet();
			if (opts.showMaskOnFocus && (!opts.showMaskOnHover || (opts.showMaskOnHover && nptValue === ""))) {
				if (input.inputmask._valueGet() !== getBuffer().join("")) {
					writeBuffer(input, getBuffer(), seekNext(getLastValidPosition()));
				}
			} else if (mouseEnter === false) { //only executed on focus without mouseenter
				caret(input, seekNext(getLastValidPosition()));
			}
			if (opts.positionCaretOnTab === true) {
				setTimeout(function () {
					clickEvent.apply(this, [e]);
				}, 0);
			}
			undoValue = getBuffer().join("");
		}

		function mouseleaveEvent(e) {
			var input = this;
			mouseEnter = false;
			if (opts.clearMaskOnLostFocus && document.activeElement !== input) {
				var buffer = getBuffer().slice(),
					nptValue = input.inputmask._valueGet();
				if (nptValue !== input.getAttribute("placeholder") && nptValue !== "") {
					if (getLastValidPosition() === -1 && nptValue === getBufferTemplate().join("")) {
						buffer = [];
					} else { //clearout optional tail of the mask
						clearOptionalTail(buffer);
					}
					writeBuffer(input, buffer);
				}
			}
		}

		function clickEvent(e) {
			function doRadixFocus(clickPos) {
				if (opts.radixPoint !== "") {
					var vps = getMaskSet().validPositions;
					if (vps[clickPos] === undefined || (vps[clickPos].input === getPlaceholder(clickPos))) {
						if (clickPos < seekNext(-1)) return true;
						var radixPos = $.inArray(opts.radixPoint, getBuffer());
						if (radixPos !== -1) {
							for (var vp in vps) {
								if (radixPos < vp && vps[vp].input !== getPlaceholder(vp)) {
									return false;
								}
							}
							return true;
						}
					}
				}
				return false;
			}

			var input = this;
			setTimeout(function () { //needed for Chrome ~ initial selection clears after the clickevent
				if (document.activeElement === input) {
					var selectedCaret = caret(input);
					if (selectedCaret.begin === selectedCaret.end) {
						switch (opts.positionCaretOnClick) {
							case "none":
								break;
							case "radixFocus":
								if (doRadixFocus(selectedCaret.begin)) {
									caret(input, opts.numericInput ? seekNext($.inArray(opts.radixPoint, getBuffer())) : $.inArray(opts.radixPoint, getBuffer()));
									break;
								}
							default: //lvp:
								var clickPosition = selectedCaret.begin,
									lvclickPosition = getLastValidPosition(clickPosition, true),
									lastPosition = seekNext(lvclickPosition);

								if (clickPosition < lastPosition) {
									caret(input, !isMask(clickPosition) && !isMask(clickPosition - 1) ? seekNext(clickPosition) : clickPosition);
								} else {
									var placeholder = getPlaceholder(lastPosition);
									if ((placeholder !== "" && getBuffer()[lastPosition] !== placeholder && getTest(lastPosition).match.optionalQuantifier !== true) || (!isMask(lastPosition, true) && getTest(lastPosition).match.def === placeholder)) {
										lastPosition = seekNext(lastPosition);
									}
									caret(input, lastPosition);
								}
								break;
						}
					}
				}
			}, 0);
		}

		function dblclickEvent(e) {
			var input = this;
			setTimeout(function () {
				caret(input, 0, seekNext(getLastValidPosition()));
			}, 0);
		}

		function cutEvent(e) {
			var input = this,
				$input = $(input),
				pos = caret(input),
				ev = e.originalEvent || e;

			//correct clipboardData
			var clipboardData = window.clipboardData || ev.clipboardData,
				clipData = isRTL ? getBuffer().slice(pos.end, pos.begin) : getBuffer().slice(pos.begin, pos.end);
			clipboardData.setData("text", isRTL ? clipData.reverse().join("") : clipData.join(""));
			if (document.execCommand) document.execCommand("copy"); // copy selected content to system clipbaord

			handleRemove(input, Inputmask.keyCode.DELETE, pos);
			writeBuffer(input, getBuffer(), getMaskSet().p, e, undoValue !== getBuffer().join(""));

			if (input.inputmask._valueGet() === getBufferTemplate().join("")) {
				$input.trigger("cleared");
			}

			if (opts.showTooltip) { //update tooltip
				input.title = opts.tooltip || getMaskSet().mask;
			}
		}

		function blurEvent(e) {
			var $input = $(this),
				input = this;
			if (input.inputmask) {
				var nptValue = input.inputmask._valueGet(),
					buffer = getBuffer().slice();
				if (undoValue !== buffer.join("")) {
					setTimeout(function () { //change event should be triggered after the other buffer manipulations on blur
						$input.trigger("change");
						undoValue = buffer.join("");
					}, 0);
				}
				if (nptValue !== "") {
					if (opts.clearMaskOnLostFocus) {
						if (getLastValidPosition() === -1 && nptValue === getBufferTemplate().join("")) {
							buffer = [];
						} else { //clearout optional tail of the mask
							clearOptionalTail(buffer);
						}
					}
					if (isComplete(buffer) === false) {
						setTimeout(function () {
							$input.trigger("incomplete");
						}, 0);
						if (opts.clearIncomplete) {
							resetMaskSet();
							if (opts.clearMaskOnLostFocus) {
								buffer = [];
							} else {
								buffer = getBufferTemplate().slice();
							}
						}
					}

					writeBuffer(input, buffer, undefined, e);
				}
			}
		}

		function mouseenterEvent(e) {
			var input = this;
			mouseEnter = true;
			if (document.activeElement !== input && opts.showMaskOnHover) {
				if (input.inputmask._valueGet() !== getBuffer().join("")) {
					writeBuffer(input, getBuffer());
				}
			}
		}

		function submitEvent(e) { //trigger change on submit if any
			if (undoValue !== getBuffer().join("")) {
				$el.trigger("change");
			}
			if (opts.clearMaskOnLostFocus && getLastValidPosition() === -1 && el.inputmask._valueGet && el.inputmask._valueGet() === getBufferTemplate().join("")) {
				el.inputmask._valueSet(""); //clear masktemplete on submit and still has focus
			}
			if (opts.removeMaskOnSubmit) {
				el.inputmask._valueSet(el.inputmask.unmaskedvalue(), true);
				setTimeout(function () {
					writeBuffer(el, getBuffer());
				}, 0);
			}
		}

		function resetEvent(e) {
			setTimeout(function () {
				$el.trigger("setvalue");
			}, 0);
		}

		function mask(elem) {
			el = elem;
			$el = $(el);

			//show tooltip
			if (opts.showTooltip) {
				el.title = opts.tooltip || getMaskSet().mask;
			}

			if (el.dir === "rtl" || opts.rightAlign) {
				el.style.textAlign = "right";
			}

			if (el.dir === "rtl" || opts.numericInput) {
				el.dir = "ltr";
				el.removeAttribute("dir");
				el.inputmask.isRTL = true;
				isRTL = true;
			}

			//unbind all events - to make sure that no other mask will interfere when re-masking
			EventRuler.off(el);
			patchValueProperty(el);
			if (isElementTypeSupported(el, opts)) {
				//bind events
				EventRuler.on(el, "submit", submitEvent);
				EventRuler.on(el, "reset", resetEvent);

				EventRuler.on(el, "mouseenter", mouseenterEvent);
				EventRuler.on(el, "blur", blurEvent);
				EventRuler.on(el, "focus", focusEvent);
				EventRuler.on(el, "mouseleave", mouseleaveEvent);
				EventRuler.on(el, "click", clickEvent);
				EventRuler.on(el, "dblclick", dblclickEvent);
				EventRuler.on(el, "paste", pasteEvent);
				EventRuler.on(el, "dragdrop", pasteEvent);
				EventRuler.on(el, "drop", pasteEvent);
				EventRuler.on(el, "cut", cutEvent);
				EventRuler.on(el, "complete", opts.oncomplete);
				EventRuler.on(el, "incomplete", opts.onincomplete);
				EventRuler.on(el, "cleared", opts.oncleared);
				if (opts.inputEventOnly !== true) {
					EventRuler.on(el, "keydown", keydownEvent);
					EventRuler.on(el, "keypress", keypressEvent);
				}
				EventRuler.on(el, "input", inputFallBackEvent);
			}
			EventRuler.on(el, "setvalue", setValueEvent);

			//apply mask
			getBufferTemplate(); //initialize the buffer and getmasklength
			if (el.inputmask._valueGet() !== "" || opts.clearMaskOnLostFocus === false || document.activeElement === el) {
				var initialValue = $.isFunction(opts.onBeforeMask) ? (opts.onBeforeMask(el.inputmask._valueGet(), opts) || el.inputmask._valueGet()) : el.inputmask._valueGet();
				checkVal(el, true, false, initialValue.split(""));
				var buffer = getBuffer().slice();
				undoValue = buffer.join("");
				// Wrap document.activeElement in a try/catch block since IE9 throw "Unspecified error" if document.activeElement is undefined when we are in an IFrame.
				if (isComplete(buffer) === false) {
					if (opts.clearIncomplete) {
						resetMaskSet();
					}
				}
				if (opts.clearMaskOnLostFocus && document.activeElement !== el) {
					if (getLastValidPosition() === -1) {
						buffer = [];
					} else {
						clearOptionalTail(buffer);
					}
				}
				writeBuffer(el, buffer);
				if (document.activeElement === el) { //position the caret when in focus
					caret(el, seekNext(getLastValidPosition()));
				}
			}
		}

//action object
		var valueBuffer;
		if (actionObj !== undefined) {
			switch (actionObj.action) {
				case "isComplete":
					el = actionObj.el;
					return isComplete(getBuffer());
				case "unmaskedvalue":
					el = actionObj.el;

					if (el !== undefined && el.inputmask !== undefined) {
						maskset = el.inputmask.maskset;
						opts = el.inputmask.opts;
						isRTL = el.inputmask.isRTL;
					} else {
						valueBuffer = actionObj.value;

						if (opts.numericInput) {
							isRTL = true;
						}

						valueBuffer = ($.isFunction(opts.onBeforeMask) ? (opts.onBeforeMask(valueBuffer, opts) || valueBuffer) : valueBuffer).split("");
						checkVal(undefined, false, false, isRTL ? valueBuffer.reverse() : valueBuffer);
						if ($.isFunction(opts.onBeforeWrite)) opts.onBeforeWrite(undefined, getBuffer(), 0, opts);
					}
					return unmaskedvalue(el);
				case "mask":
					el = actionObj.el;
					maskset = el.inputmask.maskset;
					opts = el.inputmask.opts;
					isRTL = el.inputmask.isRTL;
					mask(el);
					break;
				case "format":
					if (opts.numericInput) {
						isRTL = true;
					}
					valueBuffer = ($.isFunction(opts.onBeforeMask) ? (opts.onBeforeMask(actionObj.value, opts) || actionObj.value) : actionObj.value).split("");
					checkVal(undefined, false, false, isRTL ? valueBuffer.reverse() : valueBuffer);
					if ($.isFunction(opts.onBeforeWrite)) opts.onBeforeWrite(undefined, getBuffer(), 0, opts);

					if (actionObj.metadata) {
						return {
							value: isRTL ? getBuffer().slice().reverse().join("") : getBuffer().join(""),
							metadata: maskScope({
								"action": "getmetadata"
							}, maskset, opts)
						};
					}

					return isRTL ? getBuffer().slice().reverse().join("") : getBuffer().join("");
				case "isValid":
					if (opts.numericInput) {
						isRTL = true;
					}
					if (actionObj.value) {
						valueBuffer = actionObj.value.split("");
						checkVal(undefined, false, true, isRTL ? valueBuffer.reverse() : valueBuffer);
					} else {
						actionObj.value = getBuffer().join("");
					}
					var buffer = getBuffer();
					var rl = determineLastRequiredPosition(),
						lmib = buffer.length - 1;
					for (; lmib > rl; lmib--) {
						if (isMask(lmib)) break;
					}
					buffer.splice(rl, lmib + 1 - rl);

					return isComplete(buffer) && actionObj.value === getBuffer().join("");
				case "getemptymask":
					return getBufferTemplate().join("");
				case "remove":
					el = actionObj.el;
					$el = $(el);
					maskset = el.inputmask.maskset;
					opts = el.inputmask.opts;
					//writeout the unmaskedvalue
					el.inputmask._valueSet(unmaskedvalue(el));
					//unbind all events
					EventRuler.off(el);
					//restore the value property
					var valueProperty;
					if (Object.getOwnPropertyDescriptor && Object.getPrototypeOf) {
						valueProperty = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value");
						if (valueProperty) {
							if (el.inputmask.__valueGet) {
								Object.defineProperty(el, "value", {
									get: el.inputmask.__valueGet,
									set: el.inputmask.__valueSet,
									configurable: true
								});
							}
						}
					} else if (document.__lookupGetter__ && el.__lookupGetter__("value")) {
						if (el.inputmask.__valueGet) {
							el.__defineGetter__("value", el.inputmask.__valueGet);
							el.__defineSetter__("value", el.inputmask.__valueSet);
						}
					}
					//clear data
					el.inputmask = undefined;
					break;
				case "getmetadata":
					if ($.isArray(maskset.metadata)) {
						//find last alternation
						var alternation, lvp = getLastValidPosition(undefined, true);
						for (var firstAlt = lvp; firstAlt >= 0; firstAlt--) {
							if (getMaskSet().validPositions[firstAlt] && getMaskSet().validPositions[firstAlt].alternation !== undefined) {
								alternation = getMaskSet().validPositions[firstAlt].alternation;
								break;
							}
						}
						return alternation !== undefined ? maskset.metadata[getMaskSet().validPositions[firstAlt].locator[alternation]] : [];
					}

					return maskset.metadata;
			}
		}
	}

//make inputmask available
	window.Inputmask = Inputmask;
	return Inputmask;
}));

$.fn.chromeSerialize = function(){

	var sz = $(':input:not(:checkbox)', this).serialize()

	$(':checkbox', this).each(function () {
		if ($(this).is(':checked')) sz += '&' + $(this).attr('name') + '=' + ($(this).prop('value') ? $(this).val() : 'on')
	})

	return sz
}
// https://github.com/carhartl/jquery-cookie
;(function(e){if(typeof define==="function"&&define.amd){define(["jquery"],e)}else if(typeof exports==="object"){e(require("jquery"))}else{e(jQuery)}})(function(e){function n(e){return u.raw?e:encodeURIComponent(e)}function r(e){return u.raw?e:decodeURIComponent(e)}function i(e){return n(u.json?JSON.stringify(e):String(e))}function s(e){if(e.indexOf('"')===0){e=e.slice(1,-1).replace(/\\"/g,'"').replace(/\\\\/g,"\\")}try{e=decodeURIComponent(e.replace(t," "));return u.json?JSON.parse(e):e}catch(n){}}function o(t,n){var r=u.raw?t:s(t);return e.isFunction(n)?n(r):r}var t=/\+/g;var u=e.cookie=function(t,s,a){if(arguments.length>1&&!e.isFunction(s)){a=e.extend({},u.defaults,a);if(typeof a.expires==="number"){var f=a.expires,l=a.expires=new Date;l.setTime(+l+f*864e5)}return document.cookie=[n(t),"=",i(s),a.expires?"; expires="+a.expires.toUTCString():"",a.path?"; path="+a.path:"",a.domain?"; domain="+a.domain:"",a.secure?"; secure":""].join("")}var c=t?undefined:{};var h=document.cookie?document.cookie.split("; "):[];for(var p=0,d=h.length;p<d;p++){var v=h[p].split("=");var m=r(v.shift());var g=v.join("=");if(t&&t===m){c=o(g,s);break}if(!t&&(g=o(g))!==undefined){c[m]=g}}return c};u.defaults={};e.removeCookie=function(t,n){if(e.cookie(t)===undefined){return false}e.cookie(t,"",e.extend({},n,{expires:-1}));return!e.cookie(t)}});
$.fn.jsForm = function () {
	return this.each(function (i) {

		var $this = $(this),
			prop = {
				method: $this.data('method') || 'get',
				action: $this.data('action') || '',
				type: $this.data('type') || 'ajax'
			};

		$('.jsForm_send', this).click(function () {

			if($(this).hasClass('loader')) return false;

			$(this).addClass('loader')
			$this.submit() // для запуска плагина валидации

			if ($('.roboForm_error:visible').length) {
				$(this).removeClass('loader')
				return false;
			}

			if(prop.type == 'redirect'){

				var serlz = $(':input', $this).serialize()

				window.location.href = prop.action + '?' + serlz

				return false;
			}

			$[prop.method](prop.action, $(':input', $this).serialize(), function (res) {

				try {

					res = $.parseJSON(res)

					if (res.success){
						$.miniNoty(res.success, 'success')
						$('.jFieldReset', $this).val('')
					}

				} catch (e) {
					console.log(e);
				}

				$this.trigger({
					type: 'ajax.success',
					response: res
				})

			});

			return false;
		})

		$(':input', this).keyup(function(e) {
			if(e.keyCode == 13) $('.jsForm_send', $this).click()
		});
	})
};
!function(a){var b={"class":"miniNoty",timeoutToHide:3e3,timeoutAnimEnd:500,view:"normal",autoHide:!0,message:"",buttons:[{isClose:1,name:"Close",link:"#",target:"",click:function(){return a(this).parent().click(),!1}}],allowButtonClose:!1,redirect:!1,blank:!1};a.miniNotyConfig={set:function(c){return c&&(b=a.extend(a.miniNotyConfig.get(),c)),b},get:function(){return a.extend(!0,{},b)}},a.miniNoty=function(b,c){if(!arguments.length||(b.constructor===String?!b:!b.message))return console.warn("Message empty?"),this;var d=a.miniNotyConfig.get(),e=a("body"),f=a("."+d["class"]);if(f.length||(f=a("<div/>",{"class":d["class"]}).appendTo(e)),b instanceof Object){var g=d.buttons;b.buttons&&b.allowButtonClose&&"true"===b.allowButtonClose.toString()&&(g=a.merge(b.buttons,d.buttons),b.buttons=g),d=a.extend(d,b)}else d.message=b;var h=d["class"]+"_message "+d["class"]+"_message-"+(c||d.view),i=a("<div/>",{"class":h,html:a("<div/>",{"class":d["class"]+"_text",html:d.message})});d.buttons.length&&a.each(d.buttons,function(){var c=function(){var b=a("<a/>",{"class":d["class"]+"_btn",text:this.name,href:this.link,target:this.target,click:this.click});i.append(b)};this.isClose&&b.allowButtonClose&&"true"===d.allowButtonClose.toString()?c.call(this):this.isClose||c.call(this)}),f.prepend(i);var j=function(){i.removeClass(d["class"]+"_message-show"),setTimeout(function(){i.addClass(d["class"]+"_message-remove"),setTimeout(function(){a("a",i).off(),i.off().remove()},d.timeoutAnimEnd)},d.timeoutAnimEnd)};i.click(function(b){a(b.target).is("a")||j()}).mouseenter(function(){k&&clearTimeout(k)}).mouseleave(function(){l()}),d.redirect&&i.click(function(b){a(b.target).is("a")||(d.blank?window.open(d.redirect):window.location=d.redirect)}),setTimeout(function(){i.addClass(d["class"]+"_message-show")},100);var k=null,l=function(){"true"===d.autoHide.toString()&&(k=setTimeout(j,d.timeoutToHide))};return l(),this}}(jQuery);
!function(a){a.popupSettings={prop:{fade:300,loadError:"Не удалось найти изображение. <br/>Ошибка 404",zIndex:100},get:function(){return a.extend({},this.prop)},set:function(b){a.extend(this.prop,b)}},a.fn.extend({popup:function(b){var c=a(this),b=a.extend(a.popupSettings.get(),b),d=a("#popup-bg");if(d.length||(d=a("<div/>",{id:"popup-bg",css:{zIndex:b.zIndex}}).appendTo("body"),getScrollbarWidth=function(){var a=document.createElement("div");a.style.overflowY="scroll",a.style.width="50px",a.style.height="50px",a.style.visibility="hidden",document.body.appendChild(a);var b=a.offsetWidth-a.clientWidth;return document.body.removeChild(a),b},getSlide=function(b,c){var d=this,e=a('a[rel="'+d.attr("rel")+'"]'),f=0,g=null;return a.each(e,function(b,d){return a(d)[0]===c.data("parent")[0]?(f=b,!1):void 0}),"prev"===b?(f--,g=e.eq(f).length?e.eq(f):e.last()):(f++,g=e.eq(f).length?e.eq(f):e.first()),g},raiseError=function(){a(".popup-loader",c).off().remove(),c.append('<div class="popup-404"><span>'+a.popupSettings.get().loadError+"</span></div>"),g.css("display","none").parent().find(".close").addClass("close-show"),i()}),c.is("a"))if("frame"===c.data("type")){var e=c,f={};e.data("width")&&(f.width=e.data("width")),e.data("height")&&(f.height=e.data("height")),c=a("<div/>",{"class":"popup popup-frame",css:f}).appendTo("body"),c.append(a("<iframe />",{src:e.attr("href")}))}else{var e=c,g=a("<img />").attr({alt:e.attr("title"),src:e.data("image")||e.attr("href")}).data("parent",e).css("visibility","hidden").on("click.close",function(){a(this).next().click()});if(c=a("<div/>",{"class":"popup popup-gallery"}).append('<div class="popup-loader"></div>').appendTo("body"),e.prop("rel")){a("<div/>",{"class":"popup-prev",on:{click:function(){g.css("display","inline");var a=getSlide.call(e,"prev",g);if(g.data("parent",a),g.attr("src")!==a.attr("href")){c.append('<div class="popup-loader"></div>');var b=a.data("image")||a.attr("href");g.attr("src",b)}}}}).appendTo(c),a("<div/>",{"class":"popup-next",on:{click:function(){g.css("display","inline");var a=getSlide.call(e,"next",g);if(g.data("parent",a),g.attr("src")!==a.attr("href")){c.append('<div class="popup-loader"></div>');var b=a.data("image")||a.attr("href");g.attr("src",b)}}}}).appendTo(c),g.off("click.next click.close").on("click.next",function(){a(this).parent().find(".popup-next").click()});var h=a('a[rel="'+e.attr("rel")+'"]');h.length>1&&a(".popup-next, .popup-prev",c).show()}c.prepend(g),g.load(function(){var b=g.clone();b.attr("class","popup_image_get_size"),a("body").append(b),c.height(b.height()),c.width(b.width()),b.off().remove(),a(".popup-loader, .popup-404").off().remove(),g.next().is(":visible")&&g.addClass("popup-cursor"),i(),setTimeout(function(){g.addClass("Show").parent().find(".close").addClass("close-show")},a.popupSettings.get().fade)}).error(raiseError)}c.css({zIndex:++b.zIndex,visibility:"visible"}).addClass("popup-show").find(".close").off().remove().end().append('<div class="close"></div>'),d.fadeIn(b.fade),a("#popup-bg, .popup .close").off("click.close").on("click.close",function(){return a.popupClose(),!1}),a(document).off("keydown.popup-close").on("keydown.popup-close",function(b){27==b.keyCode&&a.popupClose()});var i=function(){if(c.height()>a(window).height()&&c.width()>a(window).width())c.css({top:a(window).scrollTop(),left:0}).closest("html").css({marginRight:0}).removeClass("popup-lock");else if(c.height()>a(window).height())c.css({top:a(window).scrollTop(),left:a(window).width()/2-c.width()/2}).closest("html").css({marginRight:0}).removeClass("popup-lock");else if(c.width()>a(window).width())c.css({top:a(window).height()/2-c.height()/2+a(window).scrollTop(),left:a(window).scrollLeft()}).closest("html").css({marginRight:0}).removeClass("popup-lock");else{var b=window.innerWidth,e={w:b?window.innerWidth:a(window).width(),h:b?window.innerHeight:a(window).height()},f=a(window).scrollLeft()+e.w/2-c.width()/2,g=a(window).scrollTop()+e.h/2-c.height()/2;c.css({top:g>=0?g:0,left:f>=0?f:0}),a("html").css({marginRight:getScrollbarWidth()+"px"}).addClass("popup-lock")}d.height(a(document).height()),d.width(a(document).width())};return i(),a(window).off("resize.popup").on("resize.popup",i),this}}),a.popupClose=function(b,c){a(window).off(".popup"),a("html").css({marginRight:0}).removeClass("popup-lock"),a("#popup-bg").fadeOut(c?c:a.popupSettings.get().fade,function(){a("#popup-bg, .popup-gallery").off().remove()});var b=b?b:".popup";a(b).removeClass("popup-show"),setTimeout(function(){a(b).css({zIndex:-101,visibility:"hidden"})},a.popupSettings.get().fade)},a.popupAjax=function(b){var b=a.extend({url:"popup.html",getClass:".popup",callback:function(){}},a.popupSettings.get(),b);a("body").append('<div class="popup-loader popup-download"></div>');var c=a("<div/>",{"class":"popup_tmp"}).appendTo("body").load(b.url+" "+b.getClass,function(){var d=a(b.getClass,c);d.unwrap(),a(".popup-loader").off().remove(),b.callback.call(d.clone(!0),b),d.off().remove()})}}(jQuery);
$.fn.popupPrepare = function(callback){
	return this.each(function(){
		var _this = $(this),
			link = _this.attr('href');

		// if there is condition string
		if(!_this.data('image') && link && link.indexOf('/diploms/image/') !== -1){

			_this.addClass('loader')

			$.get(link, function(img){

				var wholeLink = img.match(/src="(.+)"\s/)[1]; // cut real link

				// set real link on data for popup of plugin
				_this.data('image', wholeLink)

				if(callback)
					callback(_this, wholeLink)

			})
		}
		else if (callback)
			callback(_this)
	})
}
!function(a){a.roboForm=function(b){var c={formCls:".roboForm",field:":input[data-roborules]:visible",errorElement:".roboForm_error",errorVisible:".roboForm_show",mess_noRequired:"Заполните поле",mess_noRequiredCheck:"Отметьте поле",mess_noEmail:"Укажите почту правильно",mess_noPhone:"Укажите номер правильно",mess_noPattern:"Заполните поле правильно",mess_noInteger:"Можно вводить только целое число",mess_noFloat:"Можно вводить только целое число или число с плавающей точкой",mess_noCyrillic:"Допускаются только символы кириллицы, цифры и символы -_.,?!",mess_range:"Укажите $1 цифр",isNotification:!0,isNotificationAjaxError:!1,isMyNoty:a.isFunction(a.miniNoty)},d=a(document);c.errorElementClass=c.errorElement.replace(".",""),c.errorVisibleClass=c.errorVisible.replace(".","");var b=a.extend(c,b);d.on("submit",b.formCls,function(){var c=a(this),d=!0;return a(b.field,this).each(function(){var c=a(this),g=c.next(),h=a.trim(c.val()),i=c.data("roborules");if(c.removeClass(b.errorElementClass),g.length&&g.hasClass(b.errorVisibleClass)&&g.removeClass(b.errorVisibleClass),f("required",i)&&""===h&&(d=e(c,b.mess_noRequired)),c.is(":checkbox, :radio")&&f("required",i)&&!c.is(":checked")&&(d=e(c,b.mess_noRequiredCheck)),f("email",i)&&(f("required",i)||""!==h)){var j=/^([a-z0-9_\-]+\.)*[a-z0-9_\-]+@([a-z0-9][a-z0-9\-]*[a-z0-9]\.)+[a-z]{2,4}$/i;j.test(h)||(d=e(c,b.mess_noEmail))}if(f("phone",i)&&(f("required",i)||""!==h)&&(/^((8|\+7)[\- ]?)?(\(?\d{3}\)?[\- ]?)?[\d\- ]{7,10}$/.test(h)||(d=e(c,b.mess_noPhone))),f("integer",i)&&(f("required",i)||""!==h)&&(/^\d+$/.test(h)||(d=e(c,b.mess_noInteger))),f("float",i)&&(f("required",i)||""!==h)&&(/^(\d|\.)+$/.test(h)||(d=e(c,b.mess_noFloat))),f("cyrillic",i)&&(f("required",i)||""!==h)&&(/^[а-яё\d\s-_.,\?!]+$/i.test(h)||(d=e(c,b.mess_noCyrillic))),f("range",i)&&(f("required",i)||""!==h)){var k=c.data("range").toString();if(-1!==k.indexOf("-"))k=k.split("-"),(h.length<parseInt(k[0])||h.length>parseInt(k[1]))&&(d=e(c,b.mess_range.replace("$1",c.data("range"))));else if(-1!==k.indexOf("|")){k=k.split("|");var l=!1;a.each(k,function(a,b){return b==h.length?(l=!0,!1):void 0}),l||(d=e(c,b.mess_range.replace("$1",c.data("range"))))}else h.length!==parseInt(k)&&(d=e(c,b.mess_range.replace("$1",c.data("range"))))}if(f("pattern",i)&&(f("required",i)||""!==h)){var j=new RegExp(c.data("robopattern"));j.test(h)||(d=e(c,b.mess_noPattern))}}),d?(d=a._roboFormRules(c,b),d&&c.trigger({type:"roboForm.valid.true"}),d&&a(this).data("ajax")?(a.ajax({type:a(this).attr("method")||"POST",data:a(this).serialize(),url:a(this).attr("action"),success:function(d){try{d=a.parseJSON(d)}catch(e){console.log(e)}if(b.isNotification)try{d.success?b.isMyNoty?a.miniNoty(d.success,"success"):alert(d.success):d.error&&(b.isMyNoty?a.miniNoty(d.error,"error"):alert(d.error))}catch(e){console.error(e,"jQuery.roboForm expects an JSON array")}c.trigger({type:"roboForm.ajax.success",response:d})},error:function(c){if(b.isNotificationAjaxError){var d=c.status+": "+c.statusText;b.isMyNoty?a.miniNoty(d,"error"):alert(d)}}}),!1):d):(c.trigger({type:"roboForm.valid.false"}),!1)}),d.on("click",b.errorElement,function(){a(this).removeClass(c.errorVisibleClass).prev().removeClass(c.errorElementClass)}),d.on("focus",b.field,function(){a(this).removeClass(c.errorElementClass).next().removeClass(c.errorVisibleClass)});var e=function(c,d){a('input[type="submit"], .createEvent[data-event="submit"]').removeClass("loader"),c.data("robomessage")&&(d=c.data("robomessage")),c.addClass(b.errorElementClass),console.error(d,c);var e=c.next();if(e.length&&e.hasClass(b.errorElementClass))e.html(d);else{var e=document.createElement("div");e.setAttribute("class",b.errorElementClass),e.innerHTML=d,c.after(e)}return b.isValid=!1,a(e).addClass(b.errorVisibleClass),!1},f=function(a,b){return void 0!==b&&-1!==b.indexOf(a)?!0:!1}},a._roboFormRules=function(){return!0},a.roboFormAddRule=function(b){return a._roboFormRules=b,this}}(jQuery);
/*! jQuery UI - v1.11.4 - 2015-10-22
* http://jqueryui.com
* Includes: core.js, widget.js, mouse.js, sortable.js, datepicker.js
* Copyright 2015 jQuery Foundation and other contributors; Licensed MIT */

(function(e){"function"==typeof define&&define.amd?define(["jquery"],e):e(jQuery)})(function(e){function t(t,s){var n,a,o,r=t.nodeName.toLowerCase();return"area"===r?(n=t.parentNode,a=n.name,t.href&&a&&"map"===n.nodeName.toLowerCase()?(o=e("img[usemap='#"+a+"']")[0],!!o&&i(o)):!1):(/^(input|select|textarea|button|object)$/.test(r)?!t.disabled:"a"===r?t.href||s:s)&&i(t)}function i(t){return e.expr.filters.visible(t)&&!e(t).parents().addBack().filter(function(){return"hidden"===e.css(this,"visibility")}).length}function s(e){for(var t,i;e.length&&e[0]!==document;){if(t=e.css("position"),("absolute"===t||"relative"===t||"fixed"===t)&&(i=parseInt(e.css("zIndex"),10),!isNaN(i)&&0!==i))return i;e=e.parent()}return 0}function n(){this._curInst=null,this._keyEvent=!1,this._disabledInputs=[],this._datepickerShowing=!1,this._inDialog=!1,this._mainDivId="ui-datepicker-div",this._inlineClass="ui-datepicker-inline",this._appendClass="ui-datepicker-append",this._triggerClass="ui-datepicker-trigger",this._dialogClass="ui-datepicker-dialog",this._disableClass="ui-datepicker-disabled",this._unselectableClass="ui-datepicker-unselectable",this._currentClass="ui-datepicker-current-day",this._dayOverClass="ui-datepicker-days-cell-over",this.regional=[],this.regional[""]={closeText:"Done",prevText:"Prev",nextText:"Next",currentText:"Today",monthNames:["January","February","March","April","May","June","July","August","September","October","November","December"],monthNamesShort:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],dayNames:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],dayNamesShort:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],dayNamesMin:["Su","Mo","Tu","We","Th","Fr","Sa"],weekHeader:"Wk",dateFormat:"mm/dd/yy",firstDay:0,isRTL:!1,showMonthAfterYear:!1,yearSuffix:""},this._defaults={showOn:"focus",showAnim:"fadeIn",showOptions:{},defaultDate:null,appendText:"",buttonText:"...",buttonImage:"",buttonImageOnly:!1,hideIfNoPrevNext:!1,navigationAsDateFormat:!1,gotoCurrent:!1,changeMonth:!1,changeYear:!1,yearRange:"c-10:c+10",showOtherMonths:!1,selectOtherMonths:!1,showWeek:!1,calculateWeek:this.iso8601Week,shortYearCutoff:"+10",minDate:null,maxDate:null,duration:"fast",beforeShowDay:null,beforeShow:null,onSelect:null,onChangeMonthYear:null,onClose:null,numberOfMonths:1,showCurrentAtPos:0,stepMonths:1,stepBigMonths:12,altField:"",altFormat:"",constrainInput:!0,showButtonPanel:!1,autoSize:!1,disabled:!1},e.extend(this._defaults,this.regional[""]),this.regional.en=e.extend(!0,{},this.regional[""]),this.regional["en-US"]=e.extend(!0,{},this.regional.en),this.dpDiv=a(e("<div id='"+this._mainDivId+"' class='ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all'></div>"))}function a(t){var i="button, .ui-datepicker-prev, .ui-datepicker-next, .ui-datepicker-calendar td a";return t.delegate(i,"mouseout",function(){e(this).removeClass("ui-state-hover"),-1!==this.className.indexOf("ui-datepicker-prev")&&e(this).removeClass("ui-datepicker-prev-hover"),-1!==this.className.indexOf("ui-datepicker-next")&&e(this).removeClass("ui-datepicker-next-hover")}).delegate(i,"mouseover",o)}function o(){e.datepicker._isDisabledDatepicker(d.inline?d.dpDiv.parent()[0]:d.input[0])||(e(this).parents(".ui-datepicker-calendar").find("a").removeClass("ui-state-hover"),e(this).addClass("ui-state-hover"),-1!==this.className.indexOf("ui-datepicker-prev")&&e(this).addClass("ui-datepicker-prev-hover"),-1!==this.className.indexOf("ui-datepicker-next")&&e(this).addClass("ui-datepicker-next-hover"))}function r(t,i){e.extend(t,i);for(var s in i)null==i[s]&&(t[s]=i[s]);return t}e.ui=e.ui||{},e.extend(e.ui,{version:"1.11.4",keyCode:{BACKSPACE:8,COMMA:188,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,LEFT:37,PAGE_DOWN:34,PAGE_UP:33,PERIOD:190,RIGHT:39,SPACE:32,TAB:9,UP:38}}),e.fn.extend({scrollParent:function(t){var i=this.css("position"),s="absolute"===i,n=t?/(auto|scroll|hidden)/:/(auto|scroll)/,a=this.parents().filter(function(){var t=e(this);return s&&"static"===t.css("position")?!1:n.test(t.css("overflow")+t.css("overflow-y")+t.css("overflow-x"))}).eq(0);return"fixed"!==i&&a.length?a:e(this[0].ownerDocument||document)},uniqueId:function(){var e=0;return function(){return this.each(function(){this.id||(this.id="ui-id-"+ ++e)})}}(),removeUniqueId:function(){return this.each(function(){/^ui-id-\d+$/.test(this.id)&&e(this).removeAttr("id")})}}),e.extend(e.expr[":"],{data:e.expr.createPseudo?e.expr.createPseudo(function(t){return function(i){return!!e.data(i,t)}}):function(t,i,s){return!!e.data(t,s[3])},focusable:function(i){return t(i,!isNaN(e.attr(i,"tabindex")))},tabbable:function(i){var s=e.attr(i,"tabindex"),n=isNaN(s);return(n||s>=0)&&t(i,!n)}}),e("<a>").outerWidth(1).jquery||e.each(["Width","Height"],function(t,i){function s(t,i,s,a){return e.each(n,function(){i-=parseFloat(e.css(t,"padding"+this))||0,s&&(i-=parseFloat(e.css(t,"border"+this+"Width"))||0),a&&(i-=parseFloat(e.css(t,"margin"+this))||0)}),i}var n="Width"===i?["Left","Right"]:["Top","Bottom"],a=i.toLowerCase(),o={innerWidth:e.fn.innerWidth,innerHeight:e.fn.innerHeight,outerWidth:e.fn.outerWidth,outerHeight:e.fn.outerHeight};e.fn["inner"+i]=function(t){return void 0===t?o["inner"+i].call(this):this.each(function(){e(this).css(a,s(this,t)+"px")})},e.fn["outer"+i]=function(t,n){return"number"!=typeof t?o["outer"+i].call(this,t):this.each(function(){e(this).css(a,s(this,t,!0,n)+"px")})}}),e.fn.addBack||(e.fn.addBack=function(e){return this.add(null==e?this.prevObject:this.prevObject.filter(e))}),e("<a>").data("a-b","a").removeData("a-b").data("a-b")&&(e.fn.removeData=function(t){return function(i){return arguments.length?t.call(this,e.camelCase(i)):t.call(this)}}(e.fn.removeData)),e.ui.ie=!!/msie [\w.]+/.exec(navigator.userAgent.toLowerCase()),e.fn.extend({focus:function(t){return function(i,s){return"number"==typeof i?this.each(function(){var t=this;setTimeout(function(){e(t).focus(),s&&s.call(t)},i)}):t.apply(this,arguments)}}(e.fn.focus),disableSelection:function(){var e="onselectstart"in document.createElement("div")?"selectstart":"mousedown";return function(){return this.bind(e+".ui-disableSelection",function(e){e.preventDefault()})}}(),enableSelection:function(){return this.unbind(".ui-disableSelection")},zIndex:function(t){if(void 0!==t)return this.css("zIndex",t);if(this.length)for(var i,s,n=e(this[0]);n.length&&n[0]!==document;){if(i=n.css("position"),("absolute"===i||"relative"===i||"fixed"===i)&&(s=parseInt(n.css("zIndex"),10),!isNaN(s)&&0!==s))return s;n=n.parent()}return 0}}),e.ui.plugin={add:function(t,i,s){var n,a=e.ui[t].prototype;for(n in s)a.plugins[n]=a.plugins[n]||[],a.plugins[n].push([i,s[n]])},call:function(e,t,i,s){var n,a=e.plugins[t];if(a&&(s||e.element[0].parentNode&&11!==e.element[0].parentNode.nodeType))for(n=0;a.length>n;n++)e.options[a[n][0]]&&a[n][1].apply(e.element,i)}};var h=0,l=Array.prototype.slice;e.cleanData=function(t){return function(i){var s,n,a;for(a=0;null!=(n=i[a]);a++)try{s=e._data(n,"events"),s&&s.remove&&e(n).triggerHandler("remove")}catch(o){}t(i)}}(e.cleanData),e.widget=function(t,i,s){var n,a,o,r,h={},l=t.split(".")[0];return t=t.split(".")[1],n=l+"-"+t,s||(s=i,i=e.Widget),e.expr[":"][n.toLowerCase()]=function(t){return!!e.data(t,n)},e[l]=e[l]||{},a=e[l][t],o=e[l][t]=function(e,t){return this._createWidget?(arguments.length&&this._createWidget(e,t),void 0):new o(e,t)},e.extend(o,a,{version:s.version,_proto:e.extend({},s),_childConstructors:[]}),r=new i,r.options=e.widget.extend({},r.options),e.each(s,function(t,s){return e.isFunction(s)?(h[t]=function(){var e=function(){return i.prototype[t].apply(this,arguments)},n=function(e){return i.prototype[t].apply(this,e)};return function(){var t,i=this._super,a=this._superApply;return this._super=e,this._superApply=n,t=s.apply(this,arguments),this._super=i,this._superApply=a,t}}(),void 0):(h[t]=s,void 0)}),o.prototype=e.widget.extend(r,{widgetEventPrefix:a?r.widgetEventPrefix||t:t},h,{constructor:o,namespace:l,widgetName:t,widgetFullName:n}),a?(e.each(a._childConstructors,function(t,i){var s=i.prototype;e.widget(s.namespace+"."+s.widgetName,o,i._proto)}),delete a._childConstructors):i._childConstructors.push(o),e.widget.bridge(t,o),o},e.widget.extend=function(t){for(var i,s,n=l.call(arguments,1),a=0,o=n.length;o>a;a++)for(i in n[a])s=n[a][i],n[a].hasOwnProperty(i)&&void 0!==s&&(t[i]=e.isPlainObject(s)?e.isPlainObject(t[i])?e.widget.extend({},t[i],s):e.widget.extend({},s):s);return t},e.widget.bridge=function(t,i){var s=i.prototype.widgetFullName||t;e.fn[t]=function(n){var a="string"==typeof n,o=l.call(arguments,1),r=this;return a?this.each(function(){var i,a=e.data(this,s);return"instance"===n?(r=a,!1):a?e.isFunction(a[n])&&"_"!==n.charAt(0)?(i=a[n].apply(a,o),i!==a&&void 0!==i?(r=i&&i.jquery?r.pushStack(i.get()):i,!1):void 0):e.error("no such method '"+n+"' for "+t+" widget instance"):e.error("cannot call methods on "+t+" prior to initialization; "+"attempted to call method '"+n+"'")}):(o.length&&(n=e.widget.extend.apply(null,[n].concat(o))),this.each(function(){var t=e.data(this,s);t?(t.option(n||{}),t._init&&t._init()):e.data(this,s,new i(n,this))})),r}},e.Widget=function(){},e.Widget._childConstructors=[],e.Widget.prototype={widgetName:"widget",widgetEventPrefix:"",defaultElement:"<div>",options:{disabled:!1,create:null},_createWidget:function(t,i){i=e(i||this.defaultElement||this)[0],this.element=e(i),this.uuid=h++,this.eventNamespace="."+this.widgetName+this.uuid,this.bindings=e(),this.hoverable=e(),this.focusable=e(),i!==this&&(e.data(i,this.widgetFullName,this),this._on(!0,this.element,{remove:function(e){e.target===i&&this.destroy()}}),this.document=e(i.style?i.ownerDocument:i.document||i),this.window=e(this.document[0].defaultView||this.document[0].parentWindow)),this.options=e.widget.extend({},this.options,this._getCreateOptions(),t),this._create(),this._trigger("create",null,this._getCreateEventData()),this._init()},_getCreateOptions:e.noop,_getCreateEventData:e.noop,_create:e.noop,_init:e.noop,destroy:function(){this._destroy(),this.element.unbind(this.eventNamespace).removeData(this.widgetFullName).removeData(e.camelCase(this.widgetFullName)),this.widget().unbind(this.eventNamespace).removeAttr("aria-disabled").removeClass(this.widgetFullName+"-disabled "+"ui-state-disabled"),this.bindings.unbind(this.eventNamespace),this.hoverable.removeClass("ui-state-hover"),this.focusable.removeClass("ui-state-focus")},_destroy:e.noop,widget:function(){return this.element},option:function(t,i){var s,n,a,o=t;if(0===arguments.length)return e.widget.extend({},this.options);if("string"==typeof t)if(o={},s=t.split("."),t=s.shift(),s.length){for(n=o[t]=e.widget.extend({},this.options[t]),a=0;s.length-1>a;a++)n[s[a]]=n[s[a]]||{},n=n[s[a]];if(t=s.pop(),1===arguments.length)return void 0===n[t]?null:n[t];n[t]=i}else{if(1===arguments.length)return void 0===this.options[t]?null:this.options[t];o[t]=i}return this._setOptions(o),this},_setOptions:function(e){var t;for(t in e)this._setOption(t,e[t]);return this},_setOption:function(e,t){return this.options[e]=t,"disabled"===e&&(this.widget().toggleClass(this.widgetFullName+"-disabled",!!t),t&&(this.hoverable.removeClass("ui-state-hover"),this.focusable.removeClass("ui-state-focus"))),this},enable:function(){return this._setOptions({disabled:!1})},disable:function(){return this._setOptions({disabled:!0})},_on:function(t,i,s){var n,a=this;"boolean"!=typeof t&&(s=i,i=t,t=!1),s?(i=n=e(i),this.bindings=this.bindings.add(i)):(s=i,i=this.element,n=this.widget()),e.each(s,function(s,o){function r(){return t||a.options.disabled!==!0&&!e(this).hasClass("ui-state-disabled")?("string"==typeof o?a[o]:o).apply(a,arguments):void 0}"string"!=typeof o&&(r.guid=o.guid=o.guid||r.guid||e.guid++);var h=s.match(/^([\w:-]*)\s*(.*)$/),l=h[1]+a.eventNamespace,u=h[2];u?n.delegate(u,l,r):i.bind(l,r)})},_off:function(t,i){i=(i||"").split(" ").join(this.eventNamespace+" ")+this.eventNamespace,t.unbind(i).undelegate(i),this.bindings=e(this.bindings.not(t).get()),this.focusable=e(this.focusable.not(t).get()),this.hoverable=e(this.hoverable.not(t).get())},_delay:function(e,t){function i(){return("string"==typeof e?s[e]:e).apply(s,arguments)}var s=this;return setTimeout(i,t||0)},_hoverable:function(t){this.hoverable=this.hoverable.add(t),this._on(t,{mouseenter:function(t){e(t.currentTarget).addClass("ui-state-hover")},mouseleave:function(t){e(t.currentTarget).removeClass("ui-state-hover")}})},_focusable:function(t){this.focusable=this.focusable.add(t),this._on(t,{focusin:function(t){e(t.currentTarget).addClass("ui-state-focus")},focusout:function(t){e(t.currentTarget).removeClass("ui-state-focus")}})},_trigger:function(t,i,s){var n,a,o=this.options[t];if(s=s||{},i=e.Event(i),i.type=(t===this.widgetEventPrefix?t:this.widgetEventPrefix+t).toLowerCase(),i.target=this.element[0],a=i.originalEvent)for(n in a)n in i||(i[n]=a[n]);return this.element.trigger(i,s),!(e.isFunction(o)&&o.apply(this.element[0],[i].concat(s))===!1||i.isDefaultPrevented())}},e.each({show:"fadeIn",hide:"fadeOut"},function(t,i){e.Widget.prototype["_"+t]=function(s,n,a){"string"==typeof n&&(n={effect:n});var o,r=n?n===!0||"number"==typeof n?i:n.effect||i:t;n=n||{},"number"==typeof n&&(n={duration:n}),o=!e.isEmptyObject(n),n.complete=a,n.delay&&s.delay(n.delay),o&&e.effects&&e.effects.effect[r]?s[t](n):r!==t&&s[r]?s[r](n.duration,n.easing,a):s.queue(function(i){e(this)[t](),a&&a.call(s[0]),i()})}}),e.widget;var u=!1;e(document).mouseup(function(){u=!1}),e.widget("ui.mouse",{version:"1.11.4",options:{cancel:"input,textarea,button,select,option",distance:1,delay:0},_mouseInit:function(){var t=this;this.element.bind("mousedown."+this.widgetName,function(e){return t._mouseDown(e)}).bind("click."+this.widgetName,function(i){return!0===e.data(i.target,t.widgetName+".preventClickEvent")?(e.removeData(i.target,t.widgetName+".preventClickEvent"),i.stopImmediatePropagation(),!1):void 0}),this.started=!1},_mouseDestroy:function(){this.element.unbind("."+this.widgetName),this._mouseMoveDelegate&&this.document.unbind("mousemove."+this.widgetName,this._mouseMoveDelegate).unbind("mouseup."+this.widgetName,this._mouseUpDelegate)},_mouseDown:function(t){if(!u){this._mouseMoved=!1,this._mouseStarted&&this._mouseUp(t),this._mouseDownEvent=t;var i=this,s=1===t.which,n="string"==typeof this.options.cancel&&t.target.nodeName?e(t.target).closest(this.options.cancel).length:!1;return s&&!n&&this._mouseCapture(t)?(this.mouseDelayMet=!this.options.delay,this.mouseDelayMet||(this._mouseDelayTimer=setTimeout(function(){i.mouseDelayMet=!0},this.options.delay)),this._mouseDistanceMet(t)&&this._mouseDelayMet(t)&&(this._mouseStarted=this._mouseStart(t)!==!1,!this._mouseStarted)?(t.preventDefault(),!0):(!0===e.data(t.target,this.widgetName+".preventClickEvent")&&e.removeData(t.target,this.widgetName+".preventClickEvent"),this._mouseMoveDelegate=function(e){return i._mouseMove(e)},this._mouseUpDelegate=function(e){return i._mouseUp(e)},this.document.bind("mousemove."+this.widgetName,this._mouseMoveDelegate).bind("mouseup."+this.widgetName,this._mouseUpDelegate),t.preventDefault(),u=!0,!0)):!0}},_mouseMove:function(t){if(this._mouseMoved){if(e.ui.ie&&(!document.documentMode||9>document.documentMode)&&!t.button)return this._mouseUp(t);if(!t.which)return this._mouseUp(t)}return(t.which||t.button)&&(this._mouseMoved=!0),this._mouseStarted?(this._mouseDrag(t),t.preventDefault()):(this._mouseDistanceMet(t)&&this._mouseDelayMet(t)&&(this._mouseStarted=this._mouseStart(this._mouseDownEvent,t)!==!1,this._mouseStarted?this._mouseDrag(t):this._mouseUp(t)),!this._mouseStarted)},_mouseUp:function(t){return this.document.unbind("mousemove."+this.widgetName,this._mouseMoveDelegate).unbind("mouseup."+this.widgetName,this._mouseUpDelegate),this._mouseStarted&&(this._mouseStarted=!1,t.target===this._mouseDownEvent.target&&e.data(t.target,this.widgetName+".preventClickEvent",!0),this._mouseStop(t)),u=!1,!1},_mouseDistanceMet:function(e){return Math.max(Math.abs(this._mouseDownEvent.pageX-e.pageX),Math.abs(this._mouseDownEvent.pageY-e.pageY))>=this.options.distance},_mouseDelayMet:function(){return this.mouseDelayMet},_mouseStart:function(){},_mouseDrag:function(){},_mouseStop:function(){},_mouseCapture:function(){return!0}}),e.widget("ui.sortable",e.ui.mouse,{version:"1.11.4",widgetEventPrefix:"sort",ready:!1,options:{appendTo:"parent",axis:!1,connectWith:!1,containment:!1,cursor:"auto",cursorAt:!1,dropOnEmpty:!0,forcePlaceholderSize:!1,forceHelperSize:!1,grid:!1,handle:!1,helper:"original",items:"> *",opacity:!1,placeholder:!1,revert:!1,scroll:!0,scrollSensitivity:20,scrollSpeed:20,scope:"default",tolerance:"intersect",zIndex:1e3,activate:null,beforeStop:null,change:null,deactivate:null,out:null,over:null,receive:null,remove:null,sort:null,start:null,stop:null,update:null},_isOverAxis:function(e,t,i){return e>=t&&t+i>e},_isFloating:function(e){return/left|right/.test(e.css("float"))||/inline|table-cell/.test(e.css("display"))},_create:function(){this.containerCache={},this.element.addClass("ui-sortable"),this.refresh(),this.offset=this.element.offset(),this._mouseInit(),this._setHandleClassName(),this.ready=!0},_setOption:function(e,t){this._super(e,t),"handle"===e&&this._setHandleClassName()},_setHandleClassName:function(){this.element.find(".ui-sortable-handle").removeClass("ui-sortable-handle"),e.each(this.items,function(){(this.instance.options.handle?this.item.find(this.instance.options.handle):this.item).addClass("ui-sortable-handle")})},_destroy:function(){this.element.removeClass("ui-sortable ui-sortable-disabled").find(".ui-sortable-handle").removeClass("ui-sortable-handle"),this._mouseDestroy();for(var e=this.items.length-1;e>=0;e--)this.items[e].item.removeData(this.widgetName+"-item");return this},_mouseCapture:function(t,i){var s=null,n=!1,a=this;return this.reverting?!1:this.options.disabled||"static"===this.options.type?!1:(this._refreshItems(t),e(t.target).parents().each(function(){return e.data(this,a.widgetName+"-item")===a?(s=e(this),!1):void 0}),e.data(t.target,a.widgetName+"-item")===a&&(s=e(t.target)),s?!this.options.handle||i||(e(this.options.handle,s).find("*").addBack().each(function(){this===t.target&&(n=!0)}),n)?(this.currentItem=s,this._removeCurrentsFromItems(),!0):!1:!1)},_mouseStart:function(t,i,s){var n,a,o=this.options;if(this.currentContainer=this,this.refreshPositions(),this.helper=this._createHelper(t),this._cacheHelperProportions(),this._cacheMargins(),this.scrollParent=this.helper.scrollParent(),this.offset=this.currentItem.offset(),this.offset={top:this.offset.top-this.margins.top,left:this.offset.left-this.margins.left},e.extend(this.offset,{click:{left:t.pageX-this.offset.left,top:t.pageY-this.offset.top},parent:this._getParentOffset(),relative:this._getRelativeOffset()}),this.helper.css("position","absolute"),this.cssPosition=this.helper.css("position"),this.originalPosition=this._generatePosition(t),this.originalPageX=t.pageX,this.originalPageY=t.pageY,o.cursorAt&&this._adjustOffsetFromHelper(o.cursorAt),this.domPosition={prev:this.currentItem.prev()[0],parent:this.currentItem.parent()[0]},this.helper[0]!==this.currentItem[0]&&this.currentItem.hide(),this._createPlaceholder(),o.containment&&this._setContainment(),o.cursor&&"auto"!==o.cursor&&(a=this.document.find("body"),this.storedCursor=a.css("cursor"),a.css("cursor",o.cursor),this.storedStylesheet=e("<style>*{ cursor: "+o.cursor+" !important; }</style>").appendTo(a)),o.opacity&&(this.helper.css("opacity")&&(this._storedOpacity=this.helper.css("opacity")),this.helper.css("opacity",o.opacity)),o.zIndex&&(this.helper.css("zIndex")&&(this._storedZIndex=this.helper.css("zIndex")),this.helper.css("zIndex",o.zIndex)),this.scrollParent[0]!==this.document[0]&&"HTML"!==this.scrollParent[0].tagName&&(this.overflowOffset=this.scrollParent.offset()),this._trigger("start",t,this._uiHash()),this._preserveHelperProportions||this._cacheHelperProportions(),!s)for(n=this.containers.length-1;n>=0;n--)this.containers[n]._trigger("activate",t,this._uiHash(this));return e.ui.ddmanager&&(e.ui.ddmanager.current=this),e.ui.ddmanager&&!o.dropBehaviour&&e.ui.ddmanager.prepareOffsets(this,t),this.dragging=!0,this.helper.addClass("ui-sortable-helper"),this._mouseDrag(t),!0},_mouseDrag:function(t){var i,s,n,a,o=this.options,r=!1;for(this.position=this._generatePosition(t),this.positionAbs=this._convertPositionTo("absolute"),this.lastPositionAbs||(this.lastPositionAbs=this.positionAbs),this.options.scroll&&(this.scrollParent[0]!==this.document[0]&&"HTML"!==this.scrollParent[0].tagName?(this.overflowOffset.top+this.scrollParent[0].offsetHeight-t.pageY<o.scrollSensitivity?this.scrollParent[0].scrollTop=r=this.scrollParent[0].scrollTop+o.scrollSpeed:t.pageY-this.overflowOffset.top<o.scrollSensitivity&&(this.scrollParent[0].scrollTop=r=this.scrollParent[0].scrollTop-o.scrollSpeed),this.overflowOffset.left+this.scrollParent[0].offsetWidth-t.pageX<o.scrollSensitivity?this.scrollParent[0].scrollLeft=r=this.scrollParent[0].scrollLeft+o.scrollSpeed:t.pageX-this.overflowOffset.left<o.scrollSensitivity&&(this.scrollParent[0].scrollLeft=r=this.scrollParent[0].scrollLeft-o.scrollSpeed)):(t.pageY-this.document.scrollTop()<o.scrollSensitivity?r=this.document.scrollTop(this.document.scrollTop()-o.scrollSpeed):this.window.height()-(t.pageY-this.document.scrollTop())<o.scrollSensitivity&&(r=this.document.scrollTop(this.document.scrollTop()+o.scrollSpeed)),t.pageX-this.document.scrollLeft()<o.scrollSensitivity?r=this.document.scrollLeft(this.document.scrollLeft()-o.scrollSpeed):this.window.width()-(t.pageX-this.document.scrollLeft())<o.scrollSensitivity&&(r=this.document.scrollLeft(this.document.scrollLeft()+o.scrollSpeed))),r!==!1&&e.ui.ddmanager&&!o.dropBehaviour&&e.ui.ddmanager.prepareOffsets(this,t)),this.positionAbs=this._convertPositionTo("absolute"),this.options.axis&&"y"===this.options.axis||(this.helper[0].style.left=this.position.left+"px"),this.options.axis&&"x"===this.options.axis||(this.helper[0].style.top=this.position.top+"px"),i=this.items.length-1;i>=0;i--)if(s=this.items[i],n=s.item[0],a=this._intersectsWithPointer(s),a&&s.instance===this.currentContainer&&n!==this.currentItem[0]&&this.placeholder[1===a?"next":"prev"]()[0]!==n&&!e.contains(this.placeholder[0],n)&&("semi-dynamic"===this.options.type?!e.contains(this.element[0],n):!0)){if(this.direction=1===a?"down":"up","pointer"!==this.options.tolerance&&!this._intersectsWithSides(s))break;this._rearrange(t,s),this._trigger("change",t,this._uiHash());break}return this._contactContainers(t),e.ui.ddmanager&&e.ui.ddmanager.drag(this,t),this._trigger("sort",t,this._uiHash()),this.lastPositionAbs=this.positionAbs,!1},_mouseStop:function(t,i){if(t){if(e.ui.ddmanager&&!this.options.dropBehaviour&&e.ui.ddmanager.drop(this,t),this.options.revert){var s=this,n=this.placeholder.offset(),a=this.options.axis,o={};a&&"x"!==a||(o.left=n.left-this.offset.parent.left-this.margins.left+(this.offsetParent[0]===this.document[0].body?0:this.offsetParent[0].scrollLeft)),a&&"y"!==a||(o.top=n.top-this.offset.parent.top-this.margins.top+(this.offsetParent[0]===this.document[0].body?0:this.offsetParent[0].scrollTop)),this.reverting=!0,e(this.helper).animate(o,parseInt(this.options.revert,10)||500,function(){s._clear(t)})}else this._clear(t,i);return!1}},cancel:function(){if(this.dragging){this._mouseUp({target:null}),"original"===this.options.helper?this.currentItem.css(this._storedCSS).removeClass("ui-sortable-helper"):this.currentItem.show();for(var t=this.containers.length-1;t>=0;t--)this.containers[t]._trigger("deactivate",null,this._uiHash(this)),this.containers[t].containerCache.over&&(this.containers[t]._trigger("out",null,this._uiHash(this)),this.containers[t].containerCache.over=0)}return this.placeholder&&(this.placeholder[0].parentNode&&this.placeholder[0].parentNode.removeChild(this.placeholder[0]),"original"!==this.options.helper&&this.helper&&this.helper[0].parentNode&&this.helper.remove(),e.extend(this,{helper:null,dragging:!1,reverting:!1,_noFinalSort:null}),this.domPosition.prev?e(this.domPosition.prev).after(this.currentItem):e(this.domPosition.parent).prepend(this.currentItem)),this},serialize:function(t){var i=this._getItemsAsjQuery(t&&t.connected),s=[];return t=t||{},e(i).each(function(){var i=(e(t.item||this).attr(t.attribute||"id")||"").match(t.expression||/(.+)[\-=_](.+)/);i&&s.push((t.key||i[1]+"[]")+"="+(t.key&&t.expression?i[1]:i[2]))}),!s.length&&t.key&&s.push(t.key+"="),s.join("&")},toArray:function(t){var i=this._getItemsAsjQuery(t&&t.connected),s=[];return t=t||{},i.each(function(){s.push(e(t.item||this).attr(t.attribute||"id")||"")}),s},_intersectsWith:function(e){var t=this.positionAbs.left,i=t+this.helperProportions.width,s=this.positionAbs.top,n=s+this.helperProportions.height,a=e.left,o=a+e.width,r=e.top,h=r+e.height,l=this.offset.click.top,u=this.offset.click.left,d="x"===this.options.axis||s+l>r&&h>s+l,c="y"===this.options.axis||t+u>a&&o>t+u,p=d&&c;return"pointer"===this.options.tolerance||this.options.forcePointerForContainers||"pointer"!==this.options.tolerance&&this.helperProportions[this.floating?"width":"height"]>e[this.floating?"width":"height"]?p:t+this.helperProportions.width/2>a&&o>i-this.helperProportions.width/2&&s+this.helperProportions.height/2>r&&h>n-this.helperProportions.height/2},_intersectsWithPointer:function(e){var t="x"===this.options.axis||this._isOverAxis(this.positionAbs.top+this.offset.click.top,e.top,e.height),i="y"===this.options.axis||this._isOverAxis(this.positionAbs.left+this.offset.click.left,e.left,e.width),s=t&&i,n=this._getDragVerticalDirection(),a=this._getDragHorizontalDirection();return s?this.floating?a&&"right"===a||"down"===n?2:1:n&&("down"===n?2:1):!1},_intersectsWithSides:function(e){var t=this._isOverAxis(this.positionAbs.top+this.offset.click.top,e.top+e.height/2,e.height),i=this._isOverAxis(this.positionAbs.left+this.offset.click.left,e.left+e.width/2,e.width),s=this._getDragVerticalDirection(),n=this._getDragHorizontalDirection();return this.floating&&n?"right"===n&&i||"left"===n&&!i:s&&("down"===s&&t||"up"===s&&!t)},_getDragVerticalDirection:function(){var e=this.positionAbs.top-this.lastPositionAbs.top;return 0!==e&&(e>0?"down":"up")},_getDragHorizontalDirection:function(){var e=this.positionAbs.left-this.lastPositionAbs.left;return 0!==e&&(e>0?"right":"left")},refresh:function(e){return this._refreshItems(e),this._setHandleClassName(),this.refreshPositions(),this},_connectWith:function(){var e=this.options;return e.connectWith.constructor===String?[e.connectWith]:e.connectWith},_getItemsAsjQuery:function(t){function i(){r.push(this)}var s,n,a,o,r=[],h=[],l=this._connectWith();if(l&&t)for(s=l.length-1;s>=0;s--)for(a=e(l[s],this.document[0]),n=a.length-1;n>=0;n--)o=e.data(a[n],this.widgetFullName),o&&o!==this&&!o.options.disabled&&h.push([e.isFunction(o.options.items)?o.options.items.call(o.element):e(o.options.items,o.element).not(".ui-sortable-helper").not(".ui-sortable-placeholder"),o]);for(h.push([e.isFunction(this.options.items)?this.options.items.call(this.element,null,{options:this.options,item:this.currentItem}):e(this.options.items,this.element).not(".ui-sortable-helper").not(".ui-sortable-placeholder"),this]),s=h.length-1;s>=0;s--)h[s][0].each(i);return e(r)},_removeCurrentsFromItems:function(){var t=this.currentItem.find(":data("+this.widgetName+"-item)");this.items=e.grep(this.items,function(e){for(var i=0;t.length>i;i++)if(t[i]===e.item[0])return!1;return!0})},_refreshItems:function(t){this.items=[],this.containers=[this];var i,s,n,a,o,r,h,l,u=this.items,d=[[e.isFunction(this.options.items)?this.options.items.call(this.element[0],t,{item:this.currentItem}):e(this.options.items,this.element),this]],c=this._connectWith();if(c&&this.ready)for(i=c.length-1;i>=0;i--)for(n=e(c[i],this.document[0]),s=n.length-1;s>=0;s--)a=e.data(n[s],this.widgetFullName),a&&a!==this&&!a.options.disabled&&(d.push([e.isFunction(a.options.items)?a.options.items.call(a.element[0],t,{item:this.currentItem}):e(a.options.items,a.element),a]),this.containers.push(a));for(i=d.length-1;i>=0;i--)for(o=d[i][1],r=d[i][0],s=0,l=r.length;l>s;s++)h=e(r[s]),h.data(this.widgetName+"-item",o),u.push({item:h,instance:o,width:0,height:0,left:0,top:0})},refreshPositions:function(t){this.floating=this.items.length?"x"===this.options.axis||this._isFloating(this.items[0].item):!1,this.offsetParent&&this.helper&&(this.offset.parent=this._getParentOffset());var i,s,n,a;for(i=this.items.length-1;i>=0;i--)s=this.items[i],s.instance!==this.currentContainer&&this.currentContainer&&s.item[0]!==this.currentItem[0]||(n=this.options.toleranceElement?e(this.options.toleranceElement,s.item):s.item,t||(s.width=n.outerWidth(),s.height=n.outerHeight()),a=n.offset(),s.left=a.left,s.top=a.top);if(this.options.custom&&this.options.custom.refreshContainers)this.options.custom.refreshContainers.call(this);else for(i=this.containers.length-1;i>=0;i--)a=this.containers[i].element.offset(),this.containers[i].containerCache.left=a.left,this.containers[i].containerCache.top=a.top,this.containers[i].containerCache.width=this.containers[i].element.outerWidth(),this.containers[i].containerCache.height=this.containers[i].element.outerHeight();return this},_createPlaceholder:function(t){t=t||this;var i,s=t.options;s.placeholder&&s.placeholder.constructor!==String||(i=s.placeholder,s.placeholder={element:function(){var s=t.currentItem[0].nodeName.toLowerCase(),n=e("<"+s+">",t.document[0]).addClass(i||t.currentItem[0].className+" ui-sortable-placeholder").removeClass("ui-sortable-helper");return"tbody"===s?t._createTrPlaceholder(t.currentItem.find("tr").eq(0),e("<tr>",t.document[0]).appendTo(n)):"tr"===s?t._createTrPlaceholder(t.currentItem,n):"img"===s&&n.attr("src",t.currentItem.attr("src")),i||n.css("visibility","hidden"),n},update:function(e,n){(!i||s.forcePlaceholderSize)&&(n.height()||n.height(t.currentItem.innerHeight()-parseInt(t.currentItem.css("paddingTop")||0,10)-parseInt(t.currentItem.css("paddingBottom")||0,10)),n.width()||n.width(t.currentItem.innerWidth()-parseInt(t.currentItem.css("paddingLeft")||0,10)-parseInt(t.currentItem.css("paddingRight")||0,10)))}}),t.placeholder=e(s.placeholder.element.call(t.element,t.currentItem)),t.currentItem.after(t.placeholder),s.placeholder.update(t,t.placeholder)},_createTrPlaceholder:function(t,i){var s=this;t.children().each(function(){e("<td>&#160;</td>",s.document[0]).attr("colspan",e(this).attr("colspan")||1).appendTo(i)})},_contactContainers:function(t){var i,s,n,a,o,r,h,l,u,d,c=null,p=null;for(i=this.containers.length-1;i>=0;i--)if(!e.contains(this.currentItem[0],this.containers[i].element[0]))if(this._intersectsWith(this.containers[i].containerCache)){if(c&&e.contains(this.containers[i].element[0],c.element[0]))continue;c=this.containers[i],p=i}else this.containers[i].containerCache.over&&(this.containers[i]._trigger("out",t,this._uiHash(this)),this.containers[i].containerCache.over=0);if(c)if(1===this.containers.length)this.containers[p].containerCache.over||(this.containers[p]._trigger("over",t,this._uiHash(this)),this.containers[p].containerCache.over=1);else{for(n=1e4,a=null,u=c.floating||this._isFloating(this.currentItem),o=u?"left":"top",r=u?"width":"height",d=u?"clientX":"clientY",s=this.items.length-1;s>=0;s--)e.contains(this.containers[p].element[0],this.items[s].item[0])&&this.items[s].item[0]!==this.currentItem[0]&&(h=this.items[s].item.offset()[o],l=!1,t[d]-h>this.items[s][r]/2&&(l=!0),n>Math.abs(t[d]-h)&&(n=Math.abs(t[d]-h),a=this.items[s],this.direction=l?"up":"down"));if(!a&&!this.options.dropOnEmpty)return;if(this.currentContainer===this.containers[p])return this.currentContainer.containerCache.over||(this.containers[p]._trigger("over",t,this._uiHash()),this.currentContainer.containerCache.over=1),void 0;a?this._rearrange(t,a,null,!0):this._rearrange(t,null,this.containers[p].element,!0),this._trigger("change",t,this._uiHash()),this.containers[p]._trigger("change",t,this._uiHash(this)),this.currentContainer=this.containers[p],this.options.placeholder.update(this.currentContainer,this.placeholder),this.containers[p]._trigger("over",t,this._uiHash(this)),this.containers[p].containerCache.over=1
}},_createHelper:function(t){var i=this.options,s=e.isFunction(i.helper)?e(i.helper.apply(this.element[0],[t,this.currentItem])):"clone"===i.helper?this.currentItem.clone():this.currentItem;return s.parents("body").length||e("parent"!==i.appendTo?i.appendTo:this.currentItem[0].parentNode)[0].appendChild(s[0]),s[0]===this.currentItem[0]&&(this._storedCSS={width:this.currentItem[0].style.width,height:this.currentItem[0].style.height,position:this.currentItem.css("position"),top:this.currentItem.css("top"),left:this.currentItem.css("left")}),(!s[0].style.width||i.forceHelperSize)&&s.width(this.currentItem.width()),(!s[0].style.height||i.forceHelperSize)&&s.height(this.currentItem.height()),s},_adjustOffsetFromHelper:function(t){"string"==typeof t&&(t=t.split(" ")),e.isArray(t)&&(t={left:+t[0],top:+t[1]||0}),"left"in t&&(this.offset.click.left=t.left+this.margins.left),"right"in t&&(this.offset.click.left=this.helperProportions.width-t.right+this.margins.left),"top"in t&&(this.offset.click.top=t.top+this.margins.top),"bottom"in t&&(this.offset.click.top=this.helperProportions.height-t.bottom+this.margins.top)},_getParentOffset:function(){this.offsetParent=this.helper.offsetParent();var t=this.offsetParent.offset();return"absolute"===this.cssPosition&&this.scrollParent[0]!==this.document[0]&&e.contains(this.scrollParent[0],this.offsetParent[0])&&(t.left+=this.scrollParent.scrollLeft(),t.top+=this.scrollParent.scrollTop()),(this.offsetParent[0]===this.document[0].body||this.offsetParent[0].tagName&&"html"===this.offsetParent[0].tagName.toLowerCase()&&e.ui.ie)&&(t={top:0,left:0}),{top:t.top+(parseInt(this.offsetParent.css("borderTopWidth"),10)||0),left:t.left+(parseInt(this.offsetParent.css("borderLeftWidth"),10)||0)}},_getRelativeOffset:function(){if("relative"===this.cssPosition){var e=this.currentItem.position();return{top:e.top-(parseInt(this.helper.css("top"),10)||0)+this.scrollParent.scrollTop(),left:e.left-(parseInt(this.helper.css("left"),10)||0)+this.scrollParent.scrollLeft()}}return{top:0,left:0}},_cacheMargins:function(){this.margins={left:parseInt(this.currentItem.css("marginLeft"),10)||0,top:parseInt(this.currentItem.css("marginTop"),10)||0}},_cacheHelperProportions:function(){this.helperProportions={width:this.helper.outerWidth(),height:this.helper.outerHeight()}},_setContainment:function(){var t,i,s,n=this.options;"parent"===n.containment&&(n.containment=this.helper[0].parentNode),("document"===n.containment||"window"===n.containment)&&(this.containment=[0-this.offset.relative.left-this.offset.parent.left,0-this.offset.relative.top-this.offset.parent.top,"document"===n.containment?this.document.width():this.window.width()-this.helperProportions.width-this.margins.left,("document"===n.containment?this.document.width():this.window.height()||this.document[0].body.parentNode.scrollHeight)-this.helperProportions.height-this.margins.top]),/^(document|window|parent)$/.test(n.containment)||(t=e(n.containment)[0],i=e(n.containment).offset(),s="hidden"!==e(t).css("overflow"),this.containment=[i.left+(parseInt(e(t).css("borderLeftWidth"),10)||0)+(parseInt(e(t).css("paddingLeft"),10)||0)-this.margins.left,i.top+(parseInt(e(t).css("borderTopWidth"),10)||0)+(parseInt(e(t).css("paddingTop"),10)||0)-this.margins.top,i.left+(s?Math.max(t.scrollWidth,t.offsetWidth):t.offsetWidth)-(parseInt(e(t).css("borderLeftWidth"),10)||0)-(parseInt(e(t).css("paddingRight"),10)||0)-this.helperProportions.width-this.margins.left,i.top+(s?Math.max(t.scrollHeight,t.offsetHeight):t.offsetHeight)-(parseInt(e(t).css("borderTopWidth"),10)||0)-(parseInt(e(t).css("paddingBottom"),10)||0)-this.helperProportions.height-this.margins.top])},_convertPositionTo:function(t,i){i||(i=this.position);var s="absolute"===t?1:-1,n="absolute"!==this.cssPosition||this.scrollParent[0]!==this.document[0]&&e.contains(this.scrollParent[0],this.offsetParent[0])?this.scrollParent:this.offsetParent,a=/(html|body)/i.test(n[0].tagName);return{top:i.top+this.offset.relative.top*s+this.offset.parent.top*s-("fixed"===this.cssPosition?-this.scrollParent.scrollTop():a?0:n.scrollTop())*s,left:i.left+this.offset.relative.left*s+this.offset.parent.left*s-("fixed"===this.cssPosition?-this.scrollParent.scrollLeft():a?0:n.scrollLeft())*s}},_generatePosition:function(t){var i,s,n=this.options,a=t.pageX,o=t.pageY,r="absolute"!==this.cssPosition||this.scrollParent[0]!==this.document[0]&&e.contains(this.scrollParent[0],this.offsetParent[0])?this.scrollParent:this.offsetParent,h=/(html|body)/i.test(r[0].tagName);return"relative"!==this.cssPosition||this.scrollParent[0]!==this.document[0]&&this.scrollParent[0]!==this.offsetParent[0]||(this.offset.relative=this._getRelativeOffset()),this.originalPosition&&(this.containment&&(t.pageX-this.offset.click.left<this.containment[0]&&(a=this.containment[0]+this.offset.click.left),t.pageY-this.offset.click.top<this.containment[1]&&(o=this.containment[1]+this.offset.click.top),t.pageX-this.offset.click.left>this.containment[2]&&(a=this.containment[2]+this.offset.click.left),t.pageY-this.offset.click.top>this.containment[3]&&(o=this.containment[3]+this.offset.click.top)),n.grid&&(i=this.originalPageY+Math.round((o-this.originalPageY)/n.grid[1])*n.grid[1],o=this.containment?i-this.offset.click.top>=this.containment[1]&&i-this.offset.click.top<=this.containment[3]?i:i-this.offset.click.top>=this.containment[1]?i-n.grid[1]:i+n.grid[1]:i,s=this.originalPageX+Math.round((a-this.originalPageX)/n.grid[0])*n.grid[0],a=this.containment?s-this.offset.click.left>=this.containment[0]&&s-this.offset.click.left<=this.containment[2]?s:s-this.offset.click.left>=this.containment[0]?s-n.grid[0]:s+n.grid[0]:s)),{top:o-this.offset.click.top-this.offset.relative.top-this.offset.parent.top+("fixed"===this.cssPosition?-this.scrollParent.scrollTop():h?0:r.scrollTop()),left:a-this.offset.click.left-this.offset.relative.left-this.offset.parent.left+("fixed"===this.cssPosition?-this.scrollParent.scrollLeft():h?0:r.scrollLeft())}},_rearrange:function(e,t,i,s){i?i[0].appendChild(this.placeholder[0]):t.item[0].parentNode.insertBefore(this.placeholder[0],"down"===this.direction?t.item[0]:t.item[0].nextSibling),this.counter=this.counter?++this.counter:1;var n=this.counter;this._delay(function(){n===this.counter&&this.refreshPositions(!s)})},_clear:function(e,t){function i(e,t,i){return function(s){i._trigger(e,s,t._uiHash(t))}}this.reverting=!1;var s,n=[];if(!this._noFinalSort&&this.currentItem.parent().length&&this.placeholder.before(this.currentItem),this._noFinalSort=null,this.helper[0]===this.currentItem[0]){for(s in this._storedCSS)("auto"===this._storedCSS[s]||"static"===this._storedCSS[s])&&(this._storedCSS[s]="");this.currentItem.css(this._storedCSS).removeClass("ui-sortable-helper")}else this.currentItem.show();for(this.fromOutside&&!t&&n.push(function(e){this._trigger("receive",e,this._uiHash(this.fromOutside))}),!this.fromOutside&&this.domPosition.prev===this.currentItem.prev().not(".ui-sortable-helper")[0]&&this.domPosition.parent===this.currentItem.parent()[0]||t||n.push(function(e){this._trigger("update",e,this._uiHash())}),this!==this.currentContainer&&(t||(n.push(function(e){this._trigger("remove",e,this._uiHash())}),n.push(function(e){return function(t){e._trigger("receive",t,this._uiHash(this))}}.call(this,this.currentContainer)),n.push(function(e){return function(t){e._trigger("update",t,this._uiHash(this))}}.call(this,this.currentContainer)))),s=this.containers.length-1;s>=0;s--)t||n.push(i("deactivate",this,this.containers[s])),this.containers[s].containerCache.over&&(n.push(i("out",this,this.containers[s])),this.containers[s].containerCache.over=0);if(this.storedCursor&&(this.document.find("body").css("cursor",this.storedCursor),this.storedStylesheet.remove()),this._storedOpacity&&this.helper.css("opacity",this._storedOpacity),this._storedZIndex&&this.helper.css("zIndex","auto"===this._storedZIndex?"":this._storedZIndex),this.dragging=!1,t||this._trigger("beforeStop",e,this._uiHash()),this.placeholder[0].parentNode.removeChild(this.placeholder[0]),this.cancelHelperRemoval||(this.helper[0]!==this.currentItem[0]&&this.helper.remove(),this.helper=null),!t){for(s=0;n.length>s;s++)n[s].call(this,e);this._trigger("stop",e,this._uiHash())}return this.fromOutside=!1,!this.cancelHelperRemoval},_trigger:function(){e.Widget.prototype._trigger.apply(this,arguments)===!1&&this.cancel()},_uiHash:function(t){var i=t||this;return{helper:i.helper,placeholder:i.placeholder||e([]),position:i.position,originalPosition:i.originalPosition,offset:i.positionAbs,item:i.currentItem,sender:t?t.element:null}}}),e.extend(e.ui,{datepicker:{version:"1.11.4"}});var d;e.extend(n.prototype,{markerClassName:"hasDatepicker",maxRows:4,_widgetDatepicker:function(){return this.dpDiv},setDefaults:function(e){return r(this._defaults,e||{}),this},_attachDatepicker:function(t,i){var s,n,a;s=t.nodeName.toLowerCase(),n="div"===s||"span"===s,t.id||(this.uuid+=1,t.id="dp"+this.uuid),a=this._newInst(e(t),n),a.settings=e.extend({},i||{}),"input"===s?this._connectDatepicker(t,a):n&&this._inlineDatepicker(t,a)},_newInst:function(t,i){var s=t[0].id.replace(/([^A-Za-z0-9_\-])/g,"\\\\$1");return{id:s,input:t,selectedDay:0,selectedMonth:0,selectedYear:0,drawMonth:0,drawYear:0,inline:i,dpDiv:i?a(e("<div class='"+this._inlineClass+" ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all'></div>")):this.dpDiv}},_connectDatepicker:function(t,i){var s=e(t);i.append=e([]),i.trigger=e([]),s.hasClass(this.markerClassName)||(this._attachments(s,i),s.addClass(this.markerClassName).keydown(this._doKeyDown).keypress(this._doKeyPress).keyup(this._doKeyUp),this._autoSize(i),e.data(t,"datepicker",i),i.settings.disabled&&this._disableDatepicker(t))},_attachments:function(t,i){var s,n,a,o=this._get(i,"appendText"),r=this._get(i,"isRTL");i.append&&i.append.remove(),o&&(i.append=e("<span class='"+this._appendClass+"'>"+o+"</span>"),t[r?"before":"after"](i.append)),t.unbind("focus",this._showDatepicker),i.trigger&&i.trigger.remove(),s=this._get(i,"showOn"),("focus"===s||"both"===s)&&t.focus(this._showDatepicker),("button"===s||"both"===s)&&(n=this._get(i,"buttonText"),a=this._get(i,"buttonImage"),i.trigger=e(this._get(i,"buttonImageOnly")?e("<img/>").addClass(this._triggerClass).attr({src:a,alt:n,title:n}):e("<button type='button'></button>").addClass(this._triggerClass).html(a?e("<img/>").attr({src:a,alt:n,title:n}):n)),t[r?"before":"after"](i.trigger),i.trigger.click(function(){return e.datepicker._datepickerShowing&&e.datepicker._lastInput===t[0]?e.datepicker._hideDatepicker():e.datepicker._datepickerShowing&&e.datepicker._lastInput!==t[0]?(e.datepicker._hideDatepicker(),e.datepicker._showDatepicker(t[0])):e.datepicker._showDatepicker(t[0]),!1}))},_autoSize:function(e){if(this._get(e,"autoSize")&&!e.inline){var t,i,s,n,a=new Date(2009,11,20),o=this._get(e,"dateFormat");o.match(/[DM]/)&&(t=function(e){for(i=0,s=0,n=0;e.length>n;n++)e[n].length>i&&(i=e[n].length,s=n);return s},a.setMonth(t(this._get(e,o.match(/MM/)?"monthNames":"monthNamesShort"))),a.setDate(t(this._get(e,o.match(/DD/)?"dayNames":"dayNamesShort"))+20-a.getDay())),e.input.attr("size",this._formatDate(e,a).length)}},_inlineDatepicker:function(t,i){var s=e(t);s.hasClass(this.markerClassName)||(s.addClass(this.markerClassName).append(i.dpDiv),e.data(t,"datepicker",i),this._setDate(i,this._getDefaultDate(i),!0),this._updateDatepicker(i),this._updateAlternate(i),i.settings.disabled&&this._disableDatepicker(t),i.dpDiv.css("display","block"))},_dialogDatepicker:function(t,i,s,n,a){var o,h,l,u,d,c=this._dialogInst;return c||(this.uuid+=1,o="dp"+this.uuid,this._dialogInput=e("<input type='text' id='"+o+"' style='position: absolute; top: -100px; width: 0px;'/>"),this._dialogInput.keydown(this._doKeyDown),e("body").append(this._dialogInput),c=this._dialogInst=this._newInst(this._dialogInput,!1),c.settings={},e.data(this._dialogInput[0],"datepicker",c)),r(c.settings,n||{}),i=i&&i.constructor===Date?this._formatDate(c,i):i,this._dialogInput.val(i),this._pos=a?a.length?a:[a.pageX,a.pageY]:null,this._pos||(h=document.documentElement.clientWidth,l=document.documentElement.clientHeight,u=document.documentElement.scrollLeft||document.body.scrollLeft,d=document.documentElement.scrollTop||document.body.scrollTop,this._pos=[h/2-100+u,l/2-150+d]),this._dialogInput.css("left",this._pos[0]+20+"px").css("top",this._pos[1]+"px"),c.settings.onSelect=s,this._inDialog=!0,this.dpDiv.addClass(this._dialogClass),this._showDatepicker(this._dialogInput[0]),e.blockUI&&e.blockUI(this.dpDiv),e.data(this._dialogInput[0],"datepicker",c),this},_destroyDatepicker:function(t){var i,s=e(t),n=e.data(t,"datepicker");s.hasClass(this.markerClassName)&&(i=t.nodeName.toLowerCase(),e.removeData(t,"datepicker"),"input"===i?(n.append.remove(),n.trigger.remove(),s.removeClass(this.markerClassName).unbind("focus",this._showDatepicker).unbind("keydown",this._doKeyDown).unbind("keypress",this._doKeyPress).unbind("keyup",this._doKeyUp)):("div"===i||"span"===i)&&s.removeClass(this.markerClassName).empty(),d===n&&(d=null))},_enableDatepicker:function(t){var i,s,n=e(t),a=e.data(t,"datepicker");n.hasClass(this.markerClassName)&&(i=t.nodeName.toLowerCase(),"input"===i?(t.disabled=!1,a.trigger.filter("button").each(function(){this.disabled=!1}).end().filter("img").css({opacity:"1.0",cursor:""})):("div"===i||"span"===i)&&(s=n.children("."+this._inlineClass),s.children().removeClass("ui-state-disabled"),s.find("select.ui-datepicker-month, select.ui-datepicker-year").prop("disabled",!1)),this._disabledInputs=e.map(this._disabledInputs,function(e){return e===t?null:e}))},_disableDatepicker:function(t){var i,s,n=e(t),a=e.data(t,"datepicker");n.hasClass(this.markerClassName)&&(i=t.nodeName.toLowerCase(),"input"===i?(t.disabled=!0,a.trigger.filter("button").each(function(){this.disabled=!0}).end().filter("img").css({opacity:"0.5",cursor:"default"})):("div"===i||"span"===i)&&(s=n.children("."+this._inlineClass),s.children().addClass("ui-state-disabled"),s.find("select.ui-datepicker-month, select.ui-datepicker-year").prop("disabled",!0)),this._disabledInputs=e.map(this._disabledInputs,function(e){return e===t?null:e}),this._disabledInputs[this._disabledInputs.length]=t)},_isDisabledDatepicker:function(e){if(!e)return!1;for(var t=0;this._disabledInputs.length>t;t++)if(this._disabledInputs[t]===e)return!0;return!1},_getInst:function(t){try{return e.data(t,"datepicker")}catch(i){throw"Missing instance data for this datepicker"}},_optionDatepicker:function(t,i,s){var n,a,o,h,l=this._getInst(t);return 2===arguments.length&&"string"==typeof i?"defaults"===i?e.extend({},e.datepicker._defaults):l?"all"===i?e.extend({},l.settings):this._get(l,i):null:(n=i||{},"string"==typeof i&&(n={},n[i]=s),l&&(this._curInst===l&&this._hideDatepicker(),a=this._getDateDatepicker(t,!0),o=this._getMinMaxDate(l,"min"),h=this._getMinMaxDate(l,"max"),r(l.settings,n),null!==o&&void 0!==n.dateFormat&&void 0===n.minDate&&(l.settings.minDate=this._formatDate(l,o)),null!==h&&void 0!==n.dateFormat&&void 0===n.maxDate&&(l.settings.maxDate=this._formatDate(l,h)),"disabled"in n&&(n.disabled?this._disableDatepicker(t):this._enableDatepicker(t)),this._attachments(e(t),l),this._autoSize(l),this._setDate(l,a),this._updateAlternate(l),this._updateDatepicker(l)),void 0)},_changeDatepicker:function(e,t,i){this._optionDatepicker(e,t,i)},_refreshDatepicker:function(e){var t=this._getInst(e);t&&this._updateDatepicker(t)},_setDateDatepicker:function(e,t){var i=this._getInst(e);i&&(this._setDate(i,t),this._updateDatepicker(i),this._updateAlternate(i))},_getDateDatepicker:function(e,t){var i=this._getInst(e);return i&&!i.inline&&this._setDateFromField(i,t),i?this._getDate(i):null},_doKeyDown:function(t){var i,s,n,a=e.datepicker._getInst(t.target),o=!0,r=a.dpDiv.is(".ui-datepicker-rtl");if(a._keyEvent=!0,e.datepicker._datepickerShowing)switch(t.keyCode){case 9:e.datepicker._hideDatepicker(),o=!1;break;case 13:return n=e("td."+e.datepicker._dayOverClass+":not(."+e.datepicker._currentClass+")",a.dpDiv),n[0]&&e.datepicker._selectDay(t.target,a.selectedMonth,a.selectedYear,n[0]),i=e.datepicker._get(a,"onSelect"),i?(s=e.datepicker._formatDate(a),i.apply(a.input?a.input[0]:null,[s,a])):e.datepicker._hideDatepicker(),!1;case 27:e.datepicker._hideDatepicker();break;case 33:e.datepicker._adjustDate(t.target,t.ctrlKey?-e.datepicker._get(a,"stepBigMonths"):-e.datepicker._get(a,"stepMonths"),"M");break;case 34:e.datepicker._adjustDate(t.target,t.ctrlKey?+e.datepicker._get(a,"stepBigMonths"):+e.datepicker._get(a,"stepMonths"),"M");break;case 35:(t.ctrlKey||t.metaKey)&&e.datepicker._clearDate(t.target),o=t.ctrlKey||t.metaKey;break;case 36:(t.ctrlKey||t.metaKey)&&e.datepicker._gotoToday(t.target),o=t.ctrlKey||t.metaKey;break;case 37:(t.ctrlKey||t.metaKey)&&e.datepicker._adjustDate(t.target,r?1:-1,"D"),o=t.ctrlKey||t.metaKey,t.originalEvent.altKey&&e.datepicker._adjustDate(t.target,t.ctrlKey?-e.datepicker._get(a,"stepBigMonths"):-e.datepicker._get(a,"stepMonths"),"M");break;case 38:(t.ctrlKey||t.metaKey)&&e.datepicker._adjustDate(t.target,-7,"D"),o=t.ctrlKey||t.metaKey;break;case 39:(t.ctrlKey||t.metaKey)&&e.datepicker._adjustDate(t.target,r?-1:1,"D"),o=t.ctrlKey||t.metaKey,t.originalEvent.altKey&&e.datepicker._adjustDate(t.target,t.ctrlKey?+e.datepicker._get(a,"stepBigMonths"):+e.datepicker._get(a,"stepMonths"),"M");break;case 40:(t.ctrlKey||t.metaKey)&&e.datepicker._adjustDate(t.target,7,"D"),o=t.ctrlKey||t.metaKey;break;default:o=!1}else 36===t.keyCode&&t.ctrlKey?e.datepicker._showDatepicker(this):o=!1;o&&(t.preventDefault(),t.stopPropagation())},_doKeyPress:function(t){var i,s,n=e.datepicker._getInst(t.target);return e.datepicker._get(n,"constrainInput")?(i=e.datepicker._possibleChars(e.datepicker._get(n,"dateFormat")),s=String.fromCharCode(null==t.charCode?t.keyCode:t.charCode),t.ctrlKey||t.metaKey||" ">s||!i||i.indexOf(s)>-1):void 0},_doKeyUp:function(t){var i,s=e.datepicker._getInst(t.target);if(s.input.val()!==s.lastVal)try{i=e.datepicker.parseDate(e.datepicker._get(s,"dateFormat"),s.input?s.input.val():null,e.datepicker._getFormatConfig(s)),i&&(e.datepicker._setDateFromField(s),e.datepicker._updateAlternate(s),e.datepicker._updateDatepicker(s))}catch(n){}return!0},_showDatepicker:function(t){if(t=t.target||t,"input"!==t.nodeName.toLowerCase()&&(t=e("input",t.parentNode)[0]),!e.datepicker._isDisabledDatepicker(t)&&e.datepicker._lastInput!==t){var i,n,a,o,h,l,u;i=e.datepicker._getInst(t),e.datepicker._curInst&&e.datepicker._curInst!==i&&(e.datepicker._curInst.dpDiv.stop(!0,!0),i&&e.datepicker._datepickerShowing&&e.datepicker._hideDatepicker(e.datepicker._curInst.input[0])),n=e.datepicker._get(i,"beforeShow"),a=n?n.apply(t,[t,i]):{},a!==!1&&(r(i.settings,a),i.lastVal=null,e.datepicker._lastInput=t,e.datepicker._setDateFromField(i),e.datepicker._inDialog&&(t.value=""),e.datepicker._pos||(e.datepicker._pos=e.datepicker._findPos(t),e.datepicker._pos[1]+=t.offsetHeight),o=!1,e(t).parents().each(function(){return o|="fixed"===e(this).css("position"),!o}),h={left:e.datepicker._pos[0],top:e.datepicker._pos[1]},e.datepicker._pos=null,i.dpDiv.empty(),i.dpDiv.css({position:"absolute",display:"block",top:"-1000px"}),e.datepicker._updateDatepicker(i),h=e.datepicker._checkOffset(i,h,o),i.dpDiv.css({position:e.datepicker._inDialog&&e.blockUI?"static":o?"fixed":"absolute",display:"none",left:h.left+"px",top:h.top+"px"}),i.inline||(l=e.datepicker._get(i,"showAnim"),u=e.datepicker._get(i,"duration"),i.dpDiv.css("z-index",s(e(t))+1),e.datepicker._datepickerShowing=!0,e.effects&&e.effects.effect[l]?i.dpDiv.show(l,e.datepicker._get(i,"showOptions"),u):i.dpDiv[l||"show"](l?u:null),e.datepicker._shouldFocusInput(i)&&i.input.focus(),e.datepicker._curInst=i))}},_updateDatepicker:function(t){this.maxRows=4,d=t,t.dpDiv.empty().append(this._generateHTML(t)),this._attachHandlers(t);var i,s=this._getNumberOfMonths(t),n=s[1],a=17,r=t.dpDiv.find("."+this._dayOverClass+" a");r.length>0&&o.apply(r.get(0)),t.dpDiv.removeClass("ui-datepicker-multi-2 ui-datepicker-multi-3 ui-datepicker-multi-4").width(""),n>1&&t.dpDiv.addClass("ui-datepicker-multi-"+n).css("width",a*n+"em"),t.dpDiv[(1!==s[0]||1!==s[1]?"add":"remove")+"Class"]("ui-datepicker-multi"),t.dpDiv[(this._get(t,"isRTL")?"add":"remove")+"Class"]("ui-datepicker-rtl"),t===e.datepicker._curInst&&e.datepicker._datepickerShowing&&e.datepicker._shouldFocusInput(t)&&t.input.focus(),t.yearshtml&&(i=t.yearshtml,setTimeout(function(){i===t.yearshtml&&t.yearshtml&&t.dpDiv.find("select.ui-datepicker-year:first").replaceWith(t.yearshtml),i=t.yearshtml=null},0))},_shouldFocusInput:function(e){return e.input&&e.input.is(":visible")&&!e.input.is(":disabled")&&!e.input.is(":focus")},_checkOffset:function(t,i,s){var n=t.dpDiv.outerWidth(),a=t.dpDiv.outerHeight(),o=t.input?t.input.outerWidth():0,r=t.input?t.input.outerHeight():0,h=document.documentElement.clientWidth+(s?0:e(document).scrollLeft()),l=document.documentElement.clientHeight+(s?0:e(document).scrollTop());return i.left-=this._get(t,"isRTL")?n-o:0,i.left-=s&&i.left===t.input.offset().left?e(document).scrollLeft():0,i.top-=s&&i.top===t.input.offset().top+r?e(document).scrollTop():0,i.left-=Math.min(i.left,i.left+n>h&&h>n?Math.abs(i.left+n-h):0),i.top-=Math.min(i.top,i.top+a>l&&l>a?Math.abs(a+r):0),i},_findPos:function(t){for(var i,s=this._getInst(t),n=this._get(s,"isRTL");t&&("hidden"===t.type||1!==t.nodeType||e.expr.filters.hidden(t));)t=t[n?"previousSibling":"nextSibling"];return i=e(t).offset(),[i.left,i.top]},_hideDatepicker:function(t){var i,s,n,a,o=this._curInst;!o||t&&o!==e.data(t,"datepicker")||this._datepickerShowing&&(i=this._get(o,"showAnim"),s=this._get(o,"duration"),n=function(){e.datepicker._tidyDialog(o)},e.effects&&(e.effects.effect[i]||e.effects[i])?o.dpDiv.hide(i,e.datepicker._get(o,"showOptions"),s,n):o.dpDiv["slideDown"===i?"slideUp":"fadeIn"===i?"fadeOut":"hide"](i?s:null,n),i||n(),this._datepickerShowing=!1,a=this._get(o,"onClose"),a&&a.apply(o.input?o.input[0]:null,[o.input?o.input.val():"",o]),this._lastInput=null,this._inDialog&&(this._dialogInput.css({position:"absolute",left:"0",top:"-100px"}),e.blockUI&&(e.unblockUI(),e("body").append(this.dpDiv))),this._inDialog=!1)},_tidyDialog:function(e){e.dpDiv.removeClass(this._dialogClass).unbind(".ui-datepicker-calendar")},_checkExternalClick:function(t){if(e.datepicker._curInst){var i=e(t.target),s=e.datepicker._getInst(i[0]);(i[0].id!==e.datepicker._mainDivId&&0===i.parents("#"+e.datepicker._mainDivId).length&&!i.hasClass(e.datepicker.markerClassName)&&!i.closest("."+e.datepicker._triggerClass).length&&e.datepicker._datepickerShowing&&(!e.datepicker._inDialog||!e.blockUI)||i.hasClass(e.datepicker.markerClassName)&&e.datepicker._curInst!==s)&&e.datepicker._hideDatepicker()}},_adjustDate:function(t,i,s){var n=e(t),a=this._getInst(n[0]);this._isDisabledDatepicker(n[0])||(this._adjustInstDate(a,i+("M"===s?this._get(a,"showCurrentAtPos"):0),s),this._updateDatepicker(a))},_gotoToday:function(t){var i,s=e(t),n=this._getInst(s[0]);this._get(n,"gotoCurrent")&&n.currentDay?(n.selectedDay=n.currentDay,n.drawMonth=n.selectedMonth=n.currentMonth,n.drawYear=n.selectedYear=n.currentYear):(i=new Date,n.selectedDay=i.getDate(),n.drawMonth=n.selectedMonth=i.getMonth(),n.drawYear=n.selectedYear=i.getFullYear()),this._notifyChange(n),this._adjustDate(s)},_selectMonthYear:function(t,i,s){var n=e(t),a=this._getInst(n[0]);a["selected"+("M"===s?"Month":"Year")]=a["draw"+("M"===s?"Month":"Year")]=parseInt(i.options[i.selectedIndex].value,10),this._notifyChange(a),this._adjustDate(n)},_selectDay:function(t,i,s,n){var a,o=e(t);e(n).hasClass(this._unselectableClass)||this._isDisabledDatepicker(o[0])||(a=this._getInst(o[0]),a.selectedDay=a.currentDay=e("a",n).html(),a.selectedMonth=a.currentMonth=i,a.selectedYear=a.currentYear=s,this._selectDate(t,this._formatDate(a,a.currentDay,a.currentMonth,a.currentYear)))},_clearDate:function(t){var i=e(t);this._selectDate(i,"")},_selectDate:function(t,i){var s,n=e(t),a=this._getInst(n[0]);i=null!=i?i:this._formatDate(a),a.input&&a.input.val(i),this._updateAlternate(a),s=this._get(a,"onSelect"),s?s.apply(a.input?a.input[0]:null,[i,a]):a.input&&a.input.trigger("change"),a.inline?this._updateDatepicker(a):(this._hideDatepicker(),this._lastInput=a.input[0],"object"!=typeof a.input[0]&&a.input.focus(),this._lastInput=null)},_updateAlternate:function(t){var i,s,n,a=this._get(t,"altField");a&&(i=this._get(t,"altFormat")||this._get(t,"dateFormat"),s=this._getDate(t),n=this.formatDate(i,s,this._getFormatConfig(t)),e(a).each(function(){e(this).val(n)}))},noWeekends:function(e){var t=e.getDay();return[t>0&&6>t,""]},iso8601Week:function(e){var t,i=new Date(e.getTime());return i.setDate(i.getDate()+4-(i.getDay()||7)),t=i.getTime(),i.setMonth(0),i.setDate(1),Math.floor(Math.round((t-i)/864e5)/7)+1},parseDate:function(t,i,s){if(null==t||null==i)throw"Invalid arguments";if(i="object"==typeof i?""+i:i+"",""===i)return null;var n,a,o,r,h=0,l=(s?s.shortYearCutoff:null)||this._defaults.shortYearCutoff,u="string"!=typeof l?l:(new Date).getFullYear()%100+parseInt(l,10),d=(s?s.dayNamesShort:null)||this._defaults.dayNamesShort,c=(s?s.dayNames:null)||this._defaults.dayNames,p=(s?s.monthNamesShort:null)||this._defaults.monthNamesShort,f=(s?s.monthNames:null)||this._defaults.monthNames,m=-1,g=-1,v=-1,y=-1,b=!1,_=function(e){var i=t.length>n+1&&t.charAt(n+1)===e;return i&&n++,i},x=function(e){var t=_(e),s="@"===e?14:"!"===e?20:"y"===e&&t?4:"o"===e?3:2,n="y"===e?s:1,a=RegExp("^\\d{"+n+","+s+"}"),o=i.substring(h).match(a);if(!o)throw"Missing number at position "+h;return h+=o[0].length,parseInt(o[0],10)},w=function(t,s,n){var a=-1,o=e.map(_(t)?n:s,function(e,t){return[[t,e]]}).sort(function(e,t){return-(e[1].length-t[1].length)});if(e.each(o,function(e,t){var s=t[1];return i.substr(h,s.length).toLowerCase()===s.toLowerCase()?(a=t[0],h+=s.length,!1):void 0}),-1!==a)return a+1;throw"Unknown name at position "+h},k=function(){if(i.charAt(h)!==t.charAt(n))throw"Unexpected literal at position "+h;h++};for(n=0;t.length>n;n++)if(b)"'"!==t.charAt(n)||_("'")?k():b=!1;else switch(t.charAt(n)){case"d":v=x("d");break;case"D":w("D",d,c);break;case"o":y=x("o");break;case"m":g=x("m");break;case"M":g=w("M",p,f);break;case"y":m=x("y");break;case"@":r=new Date(x("@")),m=r.getFullYear(),g=r.getMonth()+1,v=r.getDate();break;case"!":r=new Date((x("!")-this._ticksTo1970)/1e4),m=r.getFullYear(),g=r.getMonth()+1,v=r.getDate();break;case"'":_("'")?k():b=!0;break;default:k()}if(i.length>h&&(o=i.substr(h),!/^\s+/.test(o)))throw"Extra/unparsed characters found in date: "+o;if(-1===m?m=(new Date).getFullYear():100>m&&(m+=(new Date).getFullYear()-(new Date).getFullYear()%100+(u>=m?0:-100)),y>-1)for(g=1,v=y;;){if(a=this._getDaysInMonth(m,g-1),a>=v)break;g++,v-=a}if(r=this._daylightSavingAdjust(new Date(m,g-1,v)),r.getFullYear()!==m||r.getMonth()+1!==g||r.getDate()!==v)throw"Invalid date";return r},ATOM:"yy-mm-dd",COOKIE:"D, dd M yy",ISO_8601:"yy-mm-dd",RFC_822:"D, d M y",RFC_850:"DD, dd-M-y",RFC_1036:"D, d M y",RFC_1123:"D, d M yy",RFC_2822:"D, d M yy",RSS:"D, d M y",TICKS:"!",TIMESTAMP:"@",W3C:"yy-mm-dd",_ticksTo1970:1e7*60*60*24*(718685+Math.floor(492.5)-Math.floor(19.7)+Math.floor(4.925)),formatDate:function(e,t,i){if(!t)return"";var s,n=(i?i.dayNamesShort:null)||this._defaults.dayNamesShort,a=(i?i.dayNames:null)||this._defaults.dayNames,o=(i?i.monthNamesShort:null)||this._defaults.monthNamesShort,r=(i?i.monthNames:null)||this._defaults.monthNames,h=function(t){var i=e.length>s+1&&e.charAt(s+1)===t;return i&&s++,i},l=function(e,t,i){var s=""+t;if(h(e))for(;i>s.length;)s="0"+s;return s},u=function(e,t,i,s){return h(e)?s[t]:i[t]},d="",c=!1;if(t)for(s=0;e.length>s;s++)if(c)"'"!==e.charAt(s)||h("'")?d+=e.charAt(s):c=!1;else switch(e.charAt(s)){case"d":d+=l("d",t.getDate(),2);break;case"D":d+=u("D",t.getDay(),n,a);break;case"o":d+=l("o",Math.round((new Date(t.getFullYear(),t.getMonth(),t.getDate()).getTime()-new Date(t.getFullYear(),0,0).getTime())/864e5),3);break;case"m":d+=l("m",t.getMonth()+1,2);break;case"M":d+=u("M",t.getMonth(),o,r);break;case"y":d+=h("y")?t.getFullYear():(10>t.getYear()%100?"0":"")+t.getYear()%100;break;case"@":d+=t.getTime();break;case"!":d+=1e4*t.getTime()+this._ticksTo1970;break;case"'":h("'")?d+="'":c=!0;break;default:d+=e.charAt(s)}return d},_possibleChars:function(e){var t,i="",s=!1,n=function(i){var s=e.length>t+1&&e.charAt(t+1)===i;return s&&t++,s};for(t=0;e.length>t;t++)if(s)"'"!==e.charAt(t)||n("'")?i+=e.charAt(t):s=!1;else switch(e.charAt(t)){case"d":case"m":case"y":case"@":i+="0123456789";break;case"D":case"M":return null;case"'":n("'")?i+="'":s=!0;break;default:i+=e.charAt(t)}return i},_get:function(e,t){return void 0!==e.settings[t]?e.settings[t]:this._defaults[t]},_setDateFromField:function(e,t){if(e.input.val()!==e.lastVal){var i=this._get(e,"dateFormat"),s=e.lastVal=e.input?e.input.val():null,n=this._getDefaultDate(e),a=n,o=this._getFormatConfig(e);try{a=this.parseDate(i,s,o)||n}catch(r){s=t?"":s}e.selectedDay=a.getDate(),e.drawMonth=e.selectedMonth=a.getMonth(),e.drawYear=e.selectedYear=a.getFullYear(),e.currentDay=s?a.getDate():0,e.currentMonth=s?a.getMonth():0,e.currentYear=s?a.getFullYear():0,this._adjustInstDate(e)}},_getDefaultDate:function(e){return this._restrictMinMax(e,this._determineDate(e,this._get(e,"defaultDate"),new Date))},_determineDate:function(t,i,s){var n=function(e){var t=new Date;return t.setDate(t.getDate()+e),t},a=function(i){try{return e.datepicker.parseDate(e.datepicker._get(t,"dateFormat"),i,e.datepicker._getFormatConfig(t))}catch(s){}for(var n=(i.toLowerCase().match(/^c/)?e.datepicker._getDate(t):null)||new Date,a=n.getFullYear(),o=n.getMonth(),r=n.getDate(),h=/([+\-]?[0-9]+)\s*(d|D|w|W|m|M|y|Y)?/g,l=h.exec(i);l;){switch(l[2]||"d"){case"d":case"D":r+=parseInt(l[1],10);break;case"w":case"W":r+=7*parseInt(l[1],10);break;case"m":case"M":o+=parseInt(l[1],10),r=Math.min(r,e.datepicker._getDaysInMonth(a,o));break;case"y":case"Y":a+=parseInt(l[1],10),r=Math.min(r,e.datepicker._getDaysInMonth(a,o))}l=h.exec(i)}return new Date(a,o,r)},o=null==i||""===i?s:"string"==typeof i?a(i):"number"==typeof i?isNaN(i)?s:n(i):new Date(i.getTime());return o=o&&"Invalid Date"==""+o?s:o,o&&(o.setHours(0),o.setMinutes(0),o.setSeconds(0),o.setMilliseconds(0)),this._daylightSavingAdjust(o)},_daylightSavingAdjust:function(e){return e?(e.setHours(e.getHours()>12?e.getHours()+2:0),e):null},_setDate:function(e,t,i){var s=!t,n=e.selectedMonth,a=e.selectedYear,o=this._restrictMinMax(e,this._determineDate(e,t,new Date));e.selectedDay=e.currentDay=o.getDate(),e.drawMonth=e.selectedMonth=e.currentMonth=o.getMonth(),e.drawYear=e.selectedYear=e.currentYear=o.getFullYear(),n===e.selectedMonth&&a===e.selectedYear||i||this._notifyChange(e),this._adjustInstDate(e),e.input&&e.input.val(s?"":this._formatDate(e))},_getDate:function(e){var t=!e.currentYear||e.input&&""===e.input.val()?null:this._daylightSavingAdjust(new Date(e.currentYear,e.currentMonth,e.currentDay));return t},_attachHandlers:function(t){var i=this._get(t,"stepMonths"),s="#"+t.id.replace(/\\\\/g,"\\");t.dpDiv.find("[data-handler]").map(function(){var t={prev:function(){e.datepicker._adjustDate(s,-i,"M")},next:function(){e.datepicker._adjustDate(s,+i,"M")},hide:function(){e.datepicker._hideDatepicker()},today:function(){e.datepicker._gotoToday(s)},selectDay:function(){return e.datepicker._selectDay(s,+this.getAttribute("data-month"),+this.getAttribute("data-year"),this),!1},selectMonth:function(){return e.datepicker._selectMonthYear(s,this,"M"),!1},selectYear:function(){return e.datepicker._selectMonthYear(s,this,"Y"),!1}};e(this).bind(this.getAttribute("data-event"),t[this.getAttribute("data-handler")])})},_generateHTML:function(e){var t,i,s,n,a,o,r,h,l,u,d,c,p,f,m,g,v,y,b,_,x,w,k,T,D,S,N,M,C,P,A,I,H,z,F,E,W,O,L,j=new Date,R=this._daylightSavingAdjust(new Date(j.getFullYear(),j.getMonth(),j.getDate())),Y=this._get(e,"isRTL"),J=this._get(e,"showButtonPanel"),B=this._get(e,"hideIfNoPrevNext"),K=this._get(e,"navigationAsDateFormat"),U=this._getNumberOfMonths(e),V=this._get(e,"showCurrentAtPos"),q=this._get(e,"stepMonths"),G=1!==U[0]||1!==U[1],X=this._daylightSavingAdjust(e.currentDay?new Date(e.currentYear,e.currentMonth,e.currentDay):new Date(9999,9,9)),Q=this._getMinMaxDate(e,"min"),$=this._getMinMaxDate(e,"max"),Z=e.drawMonth-V,et=e.drawYear;
if(0>Z&&(Z+=12,et--),$)for(t=this._daylightSavingAdjust(new Date($.getFullYear(),$.getMonth()-U[0]*U[1]+1,$.getDate())),t=Q&&Q>t?Q:t;this._daylightSavingAdjust(new Date(et,Z,1))>t;)Z--,0>Z&&(Z=11,et--);for(e.drawMonth=Z,e.drawYear=et,i=this._get(e,"prevText"),i=K?this.formatDate(i,this._daylightSavingAdjust(new Date(et,Z-q,1)),this._getFormatConfig(e)):i,s=this._canAdjustMonth(e,-1,et,Z)?"<a class='ui-datepicker-prev ui-corner-all' data-handler='prev' data-event='click' title='"+i+"'><span class='ui-icon ui-icon-circle-triangle-"+(Y?"e":"w")+"'>"+i+"</span></a>":B?"":"<a class='ui-datepicker-prev ui-corner-all ui-state-disabled' title='"+i+"'><span class='ui-icon ui-icon-circle-triangle-"+(Y?"e":"w")+"'>"+i+"</span></a>",n=this._get(e,"nextText"),n=K?this.formatDate(n,this._daylightSavingAdjust(new Date(et,Z+q,1)),this._getFormatConfig(e)):n,a=this._canAdjustMonth(e,1,et,Z)?"<a class='ui-datepicker-next ui-corner-all' data-handler='next' data-event='click' title='"+n+"'><span class='ui-icon ui-icon-circle-triangle-"+(Y?"w":"e")+"'>"+n+"</span></a>":B?"":"<a class='ui-datepicker-next ui-corner-all ui-state-disabled' title='"+n+"'><span class='ui-icon ui-icon-circle-triangle-"+(Y?"w":"e")+"'>"+n+"</span></a>",o=this._get(e,"currentText"),r=this._get(e,"gotoCurrent")&&e.currentDay?X:R,o=K?this.formatDate(o,r,this._getFormatConfig(e)):o,h=e.inline?"":"<button type='button' class='ui-datepicker-close ui-state-default ui-priority-primary ui-corner-all' data-handler='hide' data-event='click'>"+this._get(e,"closeText")+"</button>",l=J?"<div class='ui-datepicker-buttonpane ui-widget-content'>"+(Y?h:"")+(this._isInRange(e,r)?"<button type='button' class='ui-datepicker-current ui-state-default ui-priority-secondary ui-corner-all' data-handler='today' data-event='click'>"+o+"</button>":"")+(Y?"":h)+"</div>":"",u=parseInt(this._get(e,"firstDay"),10),u=isNaN(u)?0:u,d=this._get(e,"showWeek"),c=this._get(e,"dayNames"),p=this._get(e,"dayNamesMin"),f=this._get(e,"monthNames"),m=this._get(e,"monthNamesShort"),g=this._get(e,"beforeShowDay"),v=this._get(e,"showOtherMonths"),y=this._get(e,"selectOtherMonths"),b=this._getDefaultDate(e),_="",w=0;U[0]>w;w++){for(k="",this.maxRows=4,T=0;U[1]>T;T++){if(D=this._daylightSavingAdjust(new Date(et,Z,e.selectedDay)),S=" ui-corner-all",N="",G){if(N+="<div class='ui-datepicker-group",U[1]>1)switch(T){case 0:N+=" ui-datepicker-group-first",S=" ui-corner-"+(Y?"right":"left");break;case U[1]-1:N+=" ui-datepicker-group-last",S=" ui-corner-"+(Y?"left":"right");break;default:N+=" ui-datepicker-group-middle",S=""}N+="'>"}for(N+="<div class='ui-datepicker-header ui-widget-header ui-helper-clearfix"+S+"'>"+(/all|left/.test(S)&&0===w?Y?a:s:"")+(/all|right/.test(S)&&0===w?Y?s:a:"")+this._generateMonthYearHeader(e,Z,et,Q,$,w>0||T>0,f,m)+"</div><table class='ui-datepicker-calendar'><thead>"+"<tr>",M=d?"<th class='ui-datepicker-week-col'>"+this._get(e,"weekHeader")+"</th>":"",x=0;7>x;x++)C=(x+u)%7,M+="<th scope='col'"+((x+u+6)%7>=5?" class='ui-datepicker-week-end'":"")+">"+"<span title='"+c[C]+"'>"+p[C]+"</span></th>";for(N+=M+"</tr></thead><tbody>",P=this._getDaysInMonth(et,Z),et===e.selectedYear&&Z===e.selectedMonth&&(e.selectedDay=Math.min(e.selectedDay,P)),A=(this._getFirstDayOfMonth(et,Z)-u+7)%7,I=Math.ceil((A+P)/7),H=G?this.maxRows>I?this.maxRows:I:I,this.maxRows=H,z=this._daylightSavingAdjust(new Date(et,Z,1-A)),F=0;H>F;F++){for(N+="<tr>",E=d?"<td class='ui-datepicker-week-col'>"+this._get(e,"calculateWeek")(z)+"</td>":"",x=0;7>x;x++)W=g?g.apply(e.input?e.input[0]:null,[z]):[!0,""],O=z.getMonth()!==Z,L=O&&!y||!W[0]||Q&&Q>z||$&&z>$,E+="<td class='"+((x+u+6)%7>=5?" ui-datepicker-week-end":"")+(O?" ui-datepicker-other-month":"")+(z.getTime()===D.getTime()&&Z===e.selectedMonth&&e._keyEvent||b.getTime()===z.getTime()&&b.getTime()===D.getTime()?" "+this._dayOverClass:"")+(L?" "+this._unselectableClass+" ui-state-disabled":"")+(O&&!v?"":" "+W[1]+(z.getTime()===X.getTime()?" "+this._currentClass:"")+(z.getTime()===R.getTime()?" ui-datepicker-today":""))+"'"+(O&&!v||!W[2]?"":" title='"+W[2].replace(/'/g,"&#39;")+"'")+(L?"":" data-handler='selectDay' data-event='click' data-month='"+z.getMonth()+"' data-year='"+z.getFullYear()+"'")+">"+(O&&!v?"&#xa0;":L?"<span class='ui-state-default'>"+z.getDate()+"</span>":"<a class='ui-state-default"+(z.getTime()===R.getTime()?" ui-state-highlight":"")+(z.getTime()===X.getTime()?" ui-state-active":"")+(O?" ui-priority-secondary":"")+"' href='#'>"+z.getDate()+"</a>")+"</td>",z.setDate(z.getDate()+1),z=this._daylightSavingAdjust(z);N+=E+"</tr>"}Z++,Z>11&&(Z=0,et++),N+="</tbody></table>"+(G?"</div>"+(U[0]>0&&T===U[1]-1?"<div class='ui-datepicker-row-break'></div>":""):""),k+=N}_+=k}return _+=l,e._keyEvent=!1,_},_generateMonthYearHeader:function(e,t,i,s,n,a,o,r){var h,l,u,d,c,p,f,m,g=this._get(e,"changeMonth"),v=this._get(e,"changeYear"),y=this._get(e,"showMonthAfterYear"),b="<div class='ui-datepicker-title'>",_="";if(a||!g)_+="<span class='ui-datepicker-month'>"+o[t]+"</span>";else{for(h=s&&s.getFullYear()===i,l=n&&n.getFullYear()===i,_+="<select class='ui-datepicker-month' data-handler='selectMonth' data-event='change'>",u=0;12>u;u++)(!h||u>=s.getMonth())&&(!l||n.getMonth()>=u)&&(_+="<option value='"+u+"'"+(u===t?" selected='selected'":"")+">"+r[u]+"</option>");_+="</select>"}if(y||(b+=_+(!a&&g&&v?"":"&#xa0;")),!e.yearshtml)if(e.yearshtml="",a||!v)b+="<span class='ui-datepicker-year'>"+i+"</span>";else{for(d=this._get(e,"yearRange").split(":"),c=(new Date).getFullYear(),p=function(e){var t=e.match(/c[+\-].*/)?i+parseInt(e.substring(1),10):e.match(/[+\-].*/)?c+parseInt(e,10):parseInt(e,10);return isNaN(t)?c:t},f=p(d[0]),m=Math.max(f,p(d[1]||"")),f=s?Math.max(f,s.getFullYear()):f,m=n?Math.min(m,n.getFullYear()):m,e.yearshtml+="<select class='ui-datepicker-year' data-handler='selectYear' data-event='change'>";m>=f;f++)e.yearshtml+="<option value='"+f+"'"+(f===i?" selected='selected'":"")+">"+f+"</option>";e.yearshtml+="</select>",b+=e.yearshtml,e.yearshtml=null}return b+=this._get(e,"yearSuffix"),y&&(b+=(!a&&g&&v?"":"&#xa0;")+_),b+="</div>"},_adjustInstDate:function(e,t,i){var s=e.drawYear+("Y"===i?t:0),n=e.drawMonth+("M"===i?t:0),a=Math.min(e.selectedDay,this._getDaysInMonth(s,n))+("D"===i?t:0),o=this._restrictMinMax(e,this._daylightSavingAdjust(new Date(s,n,a)));e.selectedDay=o.getDate(),e.drawMonth=e.selectedMonth=o.getMonth(),e.drawYear=e.selectedYear=o.getFullYear(),("M"===i||"Y"===i)&&this._notifyChange(e)},_restrictMinMax:function(e,t){var i=this._getMinMaxDate(e,"min"),s=this._getMinMaxDate(e,"max"),n=i&&i>t?i:t;return s&&n>s?s:n},_notifyChange:function(e){var t=this._get(e,"onChangeMonthYear");t&&t.apply(e.input?e.input[0]:null,[e.selectedYear,e.selectedMonth+1,e])},_getNumberOfMonths:function(e){var t=this._get(e,"numberOfMonths");return null==t?[1,1]:"number"==typeof t?[1,t]:t},_getMinMaxDate:function(e,t){return this._determineDate(e,this._get(e,t+"Date"),null)},_getDaysInMonth:function(e,t){return 32-this._daylightSavingAdjust(new Date(e,t,32)).getDate()},_getFirstDayOfMonth:function(e,t){return new Date(e,t,1).getDay()},_canAdjustMonth:function(e,t,i,s){var n=this._getNumberOfMonths(e),a=this._daylightSavingAdjust(new Date(i,s+(0>t?t:n[0]*n[1]),1));return 0>t&&a.setDate(this._getDaysInMonth(a.getFullYear(),a.getMonth())),this._isInRange(e,a)},_isInRange:function(e,t){var i,s,n=this._getMinMaxDate(e,"min"),a=this._getMinMaxDate(e,"max"),o=null,r=null,h=this._get(e,"yearRange");return h&&(i=h.split(":"),s=(new Date).getFullYear(),o=parseInt(i[0],10),r=parseInt(i[1],10),i[0].match(/[+\-].*/)&&(o+=s),i[1].match(/[+\-].*/)&&(r+=s)),(!n||t.getTime()>=n.getTime())&&(!a||t.getTime()<=a.getTime())&&(!o||t.getFullYear()>=o)&&(!r||r>=t.getFullYear())},_getFormatConfig:function(e){var t=this._get(e,"shortYearCutoff");return t="string"!=typeof t?t:(new Date).getFullYear()%100+parseInt(t,10),{shortYearCutoff:t,dayNamesShort:this._get(e,"dayNamesShort"),dayNames:this._get(e,"dayNames"),monthNamesShort:this._get(e,"monthNamesShort"),monthNames:this._get(e,"monthNames")}},_formatDate:function(e,t,i,s){t||(e.currentDay=e.selectedDay,e.currentMonth=e.selectedMonth,e.currentYear=e.selectedYear);var n=t?"object"==typeof t?t:this._daylightSavingAdjust(new Date(s,i,t)):this._daylightSavingAdjust(new Date(e.currentYear,e.currentMonth,e.currentDay));return this.formatDate(this._get(e,"dateFormat"),n,this._getFormatConfig(e))}}),e.fn.datepicker=function(t){if(!this.length)return this;e.datepicker.initialized||(e(document).mousedown(e.datepicker._checkExternalClick),e.datepicker.initialized=!0),0===e("#"+e.datepicker._mainDivId).length&&e("body").append(e.datepicker.dpDiv);var i=Array.prototype.slice.call(arguments,1);return"string"!=typeof t||"isDisabled"!==t&&"getDate"!==t&&"widget"!==t?"option"===t&&2===arguments.length&&"string"==typeof arguments[1]?e.datepicker["_"+t+"Datepicker"].apply(e.datepicker,[this[0]].concat(i)):this.each(function(){"string"==typeof t?e.datepicker["_"+t+"Datepicker"].apply(e.datepicker,[this].concat(i)):e.datepicker._attachDatepicker(this,t)}):e.datepicker["_"+t+"Datepicker"].apply(e.datepicker,[this[0]].concat(i))},e.datepicker=new n,e.datepicker.initialized=!1,e.datepicker.uuid=(new Date).getTime(),e.datepicker.version="1.11.4",e.datepicker});

;(function (factory) {
	if (typeof define === "function" && define.amd) {

		// AMD. Register as an anonymous module.
		define(["../datepicker"], factory);
	} else {

		// Browser globals
		factory(jQuery.datepicker);
	}
}(function (datepicker) {

	datepicker.regional['ru'] = {
		closeText         : 'Закрыть',
		nextText          : "►",
		prevText          : "◄",
		currentText       : 'Сегодня',
		monthNames        : ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
		monthNamesShort   : ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
			'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
		dayNames          : ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'],
		dayNamesShort     : ['вск', 'пнд', 'втр', 'срд', 'чтв', 'птн', 'сбт'],
		dayNamesMin       : ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
		weekHeader        : 'Нед',
		dateFormat        : 'dd.mm.yy',
		firstDay          : 1,
		isRTL             : false,
		showMonthAfterYear: false,
		yearSuffix        : ''
	};
	if (window.lang_url !== '/en')
		datepicker.setDefaults(datepicker.regional['ru']);

	return datepicker.regional['ru'];
}));
(function (factory) {
	if (typeof define === "function" && define.amd) {
		define(["jquery", "inputmask"], factory);
	} else if (typeof exports === "object") {
		module.exports = factory(require("jquery"), require("./inputmask"));
	} else {
		factory(jQuery, window.Inputmask);
	}
}
(function ($, Inputmask) {
	if ($.fn.inputmask === undefined) {
		//jquery plugin
		$.fn.inputmask = function (fn, options) {
			var nptmask, input = this[0];
			if (options === undefined) options = {};
			if (typeof fn === "string") {
				switch (fn) {
					case "unmaskedvalue":
						return input && input.inputmask ? input.inputmask.unmaskedvalue() : $(input).val();
					case "remove":
						return this.each(function () {
							if (this.inputmask) this.inputmask.remove();
						});
					case "getemptymask":
						return input && input.inputmask ? input.inputmask.getemptymask() : "";
					case "hasMaskedValue": //check wheter the returned value is masked or not; currently only works reliable when using jquery.val fn to retrieve the value
						return input && input.inputmask ? input.inputmask.hasMaskedValue() : false;
					case "isComplete":
						return input && input.inputmask ? input.inputmask.isComplete() : true;
					case "getmetadata": //return mask metadata if exists
						return input && input.inputmask ? input.inputmask.getmetadata() : undefined;
					case "setvalue":
						$(input).val(options);
						if (input && input.inputmask === undefined) { //reactivate jquery.clone
							$(input).triggerHandler("setvalue");
						}
						break;
					case "option":
						if (typeof options === "string") {
							if (input && input.inputmask !== undefined) {
								return input.inputmask.option(options);
							}
						} else {
							return this.each(function () {
								if (this.inputmask !== undefined) {
									return this.inputmask.option(options);
								}
							});
						}
						break;
					default:
						options.alias = fn;
						nptmask = new Inputmask(options);
						return this.each(function () {
							nptmask.mask(this);
						});
				}
			} else if (typeof fn == "object") {
				nptmask = new Inputmask(fn);
				if (fn.mask === undefined && fn.alias === undefined) {
					return this.each(function () {
						if (this.inputmask !== undefined) {
							return this.inputmask.option(fn);
						} else nptmask.mask(this);
					});
				} else {
					return this.each(function () {
						nptmask.mask(this);
					});
				}
			} else if (fn === undefined) {
				//look for data-inputmask atributes
				return this.each(function () {
					nptmask = new Inputmask(options);
					nptmask.mask(this);
				});
			}
		};
	}
	return $.fn.inputmask;
}));

!function(a,b){a.listNav=function(){var a={cls:{root:"jListNav",active:"jListNav_active",field:"jListNav_field",list:"jListNav_list"},whirls:!0,init:function(c){c=b(c).length?b(c):document,this.parent=b("."+a.cls.root,c),this.bind()},bind:function(){var c=this;this.parent.on("keyup","."+a.cls.field,function(a){a.preventDefault(),38===a.keyCode||40===a.keyCode?c.setActive(this,a.keyCode):13===a.keyCode&&c.pressEnter(this)}).on("mouseenter","."+a.cls.list+" li",function(){b(this).parent().find("li").removeClass(a.cls.active),b(this).addClass(a.cls.active)})},setActive:function(c,d){var c=b(c),e=c.closest("."+a.cls.root),f=b("."+a.cls.list+" li",e),g=f.filter("."+a.cls.active),h="next",i=":first";f.removeClass(a.cls.active),38===d&&(h="prev",i=":last");var j=g[h]().length;return j?g[h]().addClass(a.cls.active):this.whirls?f.filter(i).addClass(a.cls.active):g.length?g.addClass(a.cls.active):f.filter(":first").addClass(a.cls.active),c.trigger({type:"listNav."+(38===d?"up":"down"),parent:e,active:f.filter("."+a.cls.active)}),!j&&this.whirls&&c.trigger({type:"listNav."+i.replace(":",""),parent:e,active:f.filter("."+a.cls.active)}),this},pressEnter:function(c){c=b(c);var d=c.closest("."+a.cls.root),e=b("."+a.cls.active,d);c.trigger({type:"listNav.enter",parent:d,active:e})}};return b(function(){a.init()}),{setWhirls:function(b){a.whirls=b},getWhirls:function(){return a.whirls},init:function(b){return a.init(b),this}}}()}(window||{},jQuery);
!function(a,b,c){!function(a){"use strict";"function"==typeof define&&define.amd?define(["jquery"],a):jQuery&&!jQuery.fn.qtip&&a(jQuery)}(function(d){"use strict";function e(a,b,c,e){this.id=c,this.target=a,this.tooltip=z,this.elements={target:a},this._id=I+"-"+c,this.timers={img:{}},this.options=b,this.plugins={},this.cache={event:{},target:d(),disabled:y,attr:e,onTooltip:y,lastClass:""},this.rendered=this.destroyed=this.disabled=this.waiting=this.hiddenDuringWait=this.positioning=this.triggering=y}function f(a){return a===z||"object"!==d.type(a)}function g(a){return!(d.isFunction(a)||a&&a.attr||a.length||"object"===d.type(a)&&(a.jquery||a.then))}function h(a){var b,c,e,h;return f(a)?y:(f(a.metadata)&&(a.metadata={type:a.metadata}),"content"in a&&(b=a.content,f(b)||b.jquery||b.done?b=a.content={text:c=g(b)?y:b}:c=b.text,"ajax"in b&&(e=b.ajax,h=e&&e.once!==y,delete b.ajax,b.text=function(a,b){var f=c||d(this).attr(b.options.content.attr)||"Loading...",g=d.ajax(d.extend({},e,{context:b})).then(e.success,z,e.error).then(function(a){return a&&h&&b.set("content.text",a),a},function(a,c,d){b.destroyed||0===a.status||b.set("content.text",c+": "+d)});return h?f:(b.set("content.text",f),g)}),"title"in b&&(d.isPlainObject(b.title)&&(b.button=b.title.button,b.title=b.title.text),g(b.title||y)&&(b.title=y))),"position"in a&&f(a.position)&&(a.position={my:a.position,at:a.position}),"show"in a&&f(a.show)&&(a.show=a.show.jquery?{target:a.show}:a.show===x?{ready:x}:{event:a.show}),"hide"in a&&f(a.hide)&&(a.hide=a.hide.jquery?{target:a.hide}:{event:a.hide}),"style"in a&&f(a.style)&&(a.style={classes:a.style}),d.each(H,function(){this.sanitize&&this.sanitize(a)}),a)}function i(a,b){for(var c,d=0,e=a,f=b.split(".");e=e[f[d++]];)d<f.length&&(c=e);return[c||a,f.pop()]}function j(a,b){var c,d,e;for(c in this.checks)for(d in this.checks[c])(e=new RegExp(d,"i").exec(a))&&(b.push(e),("builtin"===c||this.plugins[c])&&this.checks[c][d].apply(this.plugins[c]||this,b))}function k(a){return L.concat("").join(a?"-"+a+" ":" ")}function l(a,b){return b>0?setTimeout(d.proxy(a,this),b):void a.call(this)}function m(a){this.tooltip.hasClass(S)||(clearTimeout(this.timers.show),clearTimeout(this.timers.hide),this.timers.show=l.call(this,function(){this.toggle(x,a)},this.options.show.delay))}function n(a){if(!this.tooltip.hasClass(S)&&!this.destroyed){var b=d(a.relatedTarget),c=b.closest(M)[0]===this.tooltip[0],e=b[0]===this.options.show.target[0];if(clearTimeout(this.timers.show),clearTimeout(this.timers.hide),this!==b[0]&&"mouse"===this.options.position.target&&c||this.options.hide.fixed&&/mouse(out|leave|move)/.test(a.type)&&(c||e))try{a.preventDefault(),a.stopImmediatePropagation()}catch(f){}else this.timers.hide=l.call(this,function(){this.toggle(y,a)},this.options.hide.delay,this)}}function o(a){!this.tooltip.hasClass(S)&&this.options.hide.inactive&&(clearTimeout(this.timers.inactive),this.timers.inactive=l.call(this,function(){this.hide(a)},this.options.hide.inactive))}function p(a){this.rendered&&this.tooltip[0].offsetWidth>0&&this.reposition(a)}function q(a,c,e){d(b.body).delegate(a,(c.split?c:c.join("."+I+" "))+"."+I,function(){var a=s.api[d.attr(this,K)];a&&!a.disabled&&e.apply(a,arguments)})}function r(a,c,f){var g,i,j,k,l,m=d(b.body),n=a[0]===b?m:a,o=a.metadata?a.metadata(f.metadata):z,p="html5"===f.metadata.type&&o?o[f.metadata.name]:z,q=a.data(f.metadata.name||"qtipopts");try{q="string"==typeof q?d.parseJSON(q):q}catch(r){}if(k=d.extend(x,{},s.defaults,f,"object"==typeof q?h(q):z,h(p||o)),i=k.position,k.id=c,"boolean"==typeof k.content.text){if(j=a.attr(k.content.attr),k.content.attr===y||!j)return y;k.content.text=j}if(i.container.length||(i.container=m),i.target===y&&(i.target=n),k.show.target===y&&(k.show.target=n),k.show.solo===x&&(k.show.solo=i.container.closest("body")),k.hide.target===y&&(k.hide.target=n),k.position.viewport===x&&(k.position.viewport=i.container),i.container=i.container.eq(0),i.at=new u(i.at,x),i.my=new u(i.my),a.data(I))if(k.overwrite)a.qtip("destroy",!0);else if(k.overwrite===y)return y;return a.attr(J,c),k.suppress&&(l=a.attr("title"))&&a.removeAttr("title").attr(U,l).attr("title",""),g=new e(a,k,c,!!j),a.data(I,g),g}var s,t,u,v,w,x=!0,y=!1,z=null,A="x",B="y",C="top",D="left",E="bottom",F="right",G="center",H={},I="qtip",J="data-hasqtip",K="data-qtip-id",L=["ui-widget","ui-tooltip"],M="."+I,N="click dblclick mousedown mouseup mousemove mouseleave mouseenter".split(" "),O=I+"-fixed",P=I+"-default",Q=I+"-focus",R=I+"-hover",S=I+"-disabled",T="_replacedByqTip",U="oldtitle",V={ie:function(){for(var a=4,c=b.createElement("div");(c.innerHTML="<!--[if gt IE "+a+"]><i></i><![endif]-->")&&c.getElementsByTagName("i")[0];a+=1);return a>4?a:0/0}(),iOS:parseFloat((""+(/CPU.*OS ([0-9_]{1,5})|(CPU like).*AppleWebKit.*Mobile/i.exec(navigator.userAgent)||[0,""])[1]).replace("undefined","3_2").replace("_",".").replace("_",""))||y};t=e.prototype,t._when=function(a){return d.when.apply(d,a)},t.render=function(a){if(this.rendered||this.destroyed)return this;var b,c=this,e=this.options,f=this.cache,g=this.elements,h=e.content.text,i=e.content.title,j=e.content.button,k=e.position,l=("."+this._id+" ",[]);return d.attr(this.target[0],"aria-describedby",this._id),f.posClass=this._createPosClass((this.position={my:k.my,at:k.at}).my),this.tooltip=g.tooltip=b=d("<div/>",{id:this._id,"class":[I,P,e.style.classes,f.posClass].join(" "),width:e.style.width||"",height:e.style.height||"",tracking:"mouse"===k.target&&k.adjust.mouse,role:"alert","aria-live":"polite","aria-atomic":y,"aria-describedby":this._id+"-content","aria-hidden":x}).toggleClass(S,this.disabled).attr(K,this.id).data(I,this).appendTo(k.container).append(g.content=d("<div />",{"class":I+"-content",id:this._id+"-content","aria-atomic":x})),this.rendered=-1,this.positioning=x,i&&(this._createTitle(),d.isFunction(i)||l.push(this._updateTitle(i,y))),j&&this._createButton(),d.isFunction(h)||l.push(this._updateContent(h,y)),this.rendered=x,this._setWidget(),d.each(H,function(a){var b;"render"===this.initialize&&(b=this(c))&&(c.plugins[a]=b)}),this._unassignEvents(),this._assignEvents(),this._when(l).then(function(){c._trigger("render"),c.positioning=y,c.hiddenDuringWait||!e.show.ready&&!a||c.toggle(x,f.event,y),c.hiddenDuringWait=y}),s.api[this.id]=this,this},t.destroy=function(a){function b(){if(!this.destroyed){this.destroyed=x;var a,b=this.target,c=b.attr(U);this.rendered&&this.tooltip.stop(1,0).find("*").remove().end().remove(),d.each(this.plugins,function(){this.destroy&&this.destroy()});for(a in this.timers)clearTimeout(this.timers[a]);b.removeData(I).removeAttr(K).removeAttr(J).removeAttr("aria-describedby"),this.options.suppress&&c&&b.attr("title",c).removeAttr(U),this._unassignEvents(),this.options=this.elements=this.cache=this.timers=this.plugins=this.mouse=z,delete s.api[this.id]}}return this.destroyed?this.target:(a===x&&"hide"!==this.triggering||!this.rendered?b.call(this):(this.tooltip.one("tooltiphidden",d.proxy(b,this)),!this.triggering&&this.hide()),this.target)},v=t.checks={builtin:{"^id$":function(a,b,c,e){var f=c===x?s.nextid:c,g=I+"-"+f;f!==y&&f.length>0&&!d("#"+g).length?(this._id=g,this.rendered&&(this.tooltip[0].id=this._id,this.elements.content[0].id=this._id+"-content",this.elements.title[0].id=this._id+"-title")):a[b]=e},"^prerender":function(a,b,c){c&&!this.rendered&&this.render(this.options.show.ready)},"^content.text$":function(a,b,c){this._updateContent(c)},"^content.attr$":function(a,b,c,d){this.options.content.text===this.target.attr(d)&&this._updateContent(this.target.attr(c))},"^content.title$":function(a,b,c){return c?(c&&!this.elements.title&&this._createTitle(),void this._updateTitle(c)):this._removeTitle()},"^content.button$":function(a,b,c){this._updateButton(c)},"^content.title.(text|button)$":function(a,b,c){this.set("content."+b,c)},"^position.(my|at)$":function(a,b,c){"string"==typeof c&&(this.position[b]=a[b]=new u(c,"at"===b))},"^position.container$":function(a,b,c){this.rendered&&this.tooltip.appendTo(c)},"^show.ready$":function(a,b,c){c&&(!this.rendered&&this.render(x)||this.toggle(x))},"^style.classes$":function(a,b,c,d){this.rendered&&this.tooltip.removeClass(d).addClass(c)},"^style.(width|height)":function(a,b,c){this.rendered&&this.tooltip.css(b,c)},"^style.widget|content.title":function(){this.rendered&&this._setWidget()},"^style.def":function(a,b,c){this.rendered&&this.tooltip.toggleClass(P,!!c)},"^events.(render|show|move|hide|focus|blur)$":function(a,b,c){this.rendered&&this.tooltip[(d.isFunction(c)?"":"un")+"bind"]("tooltip"+b,c)},"^(show|hide|position).(event|target|fixed|inactive|leave|distance|viewport|adjust)":function(){if(this.rendered){var a=this.options.position;this.tooltip.attr("tracking","mouse"===a.target&&a.adjust.mouse),this._unassignEvents(),this._assignEvents()}}}},t.get=function(a){if(this.destroyed)return this;var b=i(this.options,a.toLowerCase()),c=b[0][b[1]];return c.precedance?c.string():c};var W=/^position\.(my|at|adjust|target|container|viewport)|style|content|show\.ready/i,X=/^prerender|show\.ready/i;t.set=function(a,b){if(this.destroyed)return this;{var c,e=this.rendered,f=y,g=this.options;this.checks}return"string"==typeof a?(c=a,a={},a[c]=b):a=d.extend({},a),d.each(a,function(b,c){if(e&&X.test(b))return void delete a[b];var h,j=i(g,b.toLowerCase());h=j[0][j[1]],j[0][j[1]]=c&&c.nodeType?d(c):c,f=W.test(b)||f,a[b]=[j[0],j[1],c,h]}),h(g),this.positioning=x,d.each(a,d.proxy(j,this)),this.positioning=y,this.rendered&&this.tooltip[0].offsetWidth>0&&f&&this.reposition("mouse"===g.position.target?z:this.cache.event),this},t._update=function(a,b){var c=this,e=this.cache;return this.rendered&&a?(d.isFunction(a)&&(a=a.call(this.elements.target,e.event,this)||""),d.isFunction(a.then)?(e.waiting=x,a.then(function(a){return e.waiting=y,c._update(a,b)},z,function(a){return c._update(a,b)})):a===y||!a&&""!==a?y:(a.jquery&&a.length>0?b.empty().append(a.css({display:"block",visibility:"visible"})):b.html(a),this._waitForContent(b).then(function(a){c.rendered&&c.tooltip[0].offsetWidth>0&&c.reposition(e.event,!a.length)}))):y},t._waitForContent=function(a){var b=this.cache;return b.waiting=x,(d.fn.imagesLoaded?a.imagesLoaded():d.Deferred().resolve([])).done(function(){b.waiting=y}).promise()},t._updateContent=function(a,b){this._update(a,this.elements.content,b)},t._updateTitle=function(a,b){this._update(a,this.elements.title,b)===y&&this._removeTitle(y)},t._createTitle=function(){var a=this.elements,b=this._id+"-title";a.titlebar&&this._removeTitle(),a.titlebar=d("<div />",{"class":I+"-titlebar "+(this.options.style.widget?k("header"):"")}).append(a.title=d("<div />",{id:b,"class":I+"-title","aria-atomic":x})).insertBefore(a.content).delegate(".qtip-close","mousedown keydown mouseup keyup mouseout",function(a){d(this).toggleClass("ui-state-active ui-state-focus","down"===a.type.substr(-4))}).delegate(".qtip-close","mouseover mouseout",function(a){d(this).toggleClass("ui-state-hover","mouseover"===a.type)}),this.options.content.button&&this._createButton()},t._removeTitle=function(a){var b=this.elements;b.title&&(b.titlebar.remove(),b.titlebar=b.title=b.button=z,a!==y&&this.reposition())},t._createPosClass=function(a){return I+"-pos-"+(a||this.options.position.my).abbrev()},t.reposition=function(c,e){if(!this.rendered||this.positioning||this.destroyed)return this;this.positioning=x;var f,g,h,i,j=this.cache,k=this.tooltip,l=this.options.position,m=l.target,n=l.my,o=l.at,p=l.viewport,q=l.container,r=l.adjust,s=r.method.split(" "),t=k.outerWidth(y),u=k.outerHeight(y),v=0,w=0,z=k.css("position"),A={left:0,top:0},B=k[0].offsetWidth>0,I=c&&"scroll"===c.type,J=d(a),K=q[0].ownerDocument,L=this.mouse;if(d.isArray(m)&&2===m.length)o={x:D,y:C},A={left:m[0],top:m[1]};else if("mouse"===m)o={x:D,y:C},(!r.mouse||this.options.hide.distance)&&j.origin&&j.origin.pageX?c=j.origin:!c||c&&("resize"===c.type||"scroll"===c.type)?c=j.event:L&&L.pageX&&(c=L),"static"!==z&&(A=q.offset()),K.body.offsetWidth!==(a.innerWidth||K.documentElement.clientWidth)&&(g=d(b.body).offset()),A={left:c.pageX-A.left+(g&&g.left||0),top:c.pageY-A.top+(g&&g.top||0)},r.mouse&&I&&L&&(A.left-=(L.scrollX||0)-J.scrollLeft(),A.top-=(L.scrollY||0)-J.scrollTop());else{if("event"===m?c&&c.target&&"scroll"!==c.type&&"resize"!==c.type?j.target=d(c.target):c.target||(j.target=this.elements.target):"event"!==m&&(j.target=d(m.jquery?m:this.elements.target)),m=j.target,m=d(m).eq(0),0===m.length)return this;m[0]===b||m[0]===a?(v=V.iOS?a.innerWidth:m.width(),w=V.iOS?a.innerHeight:m.height(),m[0]===a&&(A={top:(p||m).scrollTop(),left:(p||m).scrollLeft()})):H.imagemap&&m.is("area")?f=H.imagemap(this,m,o,H.viewport?s:y):H.svg&&m&&m[0].ownerSVGElement?f=H.svg(this,m,o,H.viewport?s:y):(v=m.outerWidth(y),w=m.outerHeight(y),A=m.offset()),f&&(v=f.width,w=f.height,g=f.offset,A=f.position),A=this.reposition.offset(m,A,q),(V.iOS>3.1&&V.iOS<4.1||V.iOS>=4.3&&V.iOS<4.33||!V.iOS&&"fixed"===z)&&(A.left-=J.scrollLeft(),A.top-=J.scrollTop()),(!f||f&&f.adjustable!==y)&&(A.left+=o.x===F?v:o.x===G?v/2:0,A.top+=o.y===E?w:o.y===G?w/2:0)}return A.left+=r.x+(n.x===F?-t:n.x===G?-t/2:0),A.top+=r.y+(n.y===E?-u:n.y===G?-u/2:0),H.viewport?(h=A.adjusted=H.viewport(this,A,l,v,w,t,u),g&&h.left&&(A.left+=g.left),g&&h.top&&(A.top+=g.top),h.my&&(this.position.my=h.my)):A.adjusted={left:0,top:0},j.posClass!==(i=this._createPosClass(this.position.my))&&k.removeClass(j.posClass).addClass(j.posClass=i),this._trigger("move",[A,p.elem||p],c)?(delete A.adjusted,e===y||!B||isNaN(A.left)||isNaN(A.top)||"mouse"===m||!d.isFunction(l.effect)?k.css(A):d.isFunction(l.effect)&&(l.effect.call(k,this,d.extend({},A)),k.queue(function(a){d(this).css({opacity:"",height:""}),V.ie&&this.style.removeAttribute("filter"),a()})),this.positioning=y,this):this},t.reposition.offset=function(a,c,e){function f(a,b){c.left+=b*a.scrollLeft(),c.top+=b*a.scrollTop()}if(!e[0])return c;var g,h,i,j,k=d(a[0].ownerDocument),l=!!V.ie&&"CSS1Compat"!==b.compatMode,m=e[0];do"static"!==(h=d.css(m,"position"))&&("fixed"===h?(i=m.getBoundingClientRect(),f(k,-1)):(i=d(m).position(),i.left+=parseFloat(d.css(m,"borderLeftWidth"))||0,i.top+=parseFloat(d.css(m,"borderTopWidth"))||0),c.left-=i.left+(parseFloat(d.css(m,"marginLeft"))||0),c.top-=i.top+(parseFloat(d.css(m,"marginTop"))||0),g||"hidden"===(j=d.css(m,"overflow"))||"visible"===j||(g=d(m)));while(m=m.offsetParent);return g&&(g[0]!==k[0]||l)&&f(g,1),c};var Y=(u=t.reposition.Corner=function(a,b){a=(""+a).replace(/([A-Z])/," $1").replace(/middle/gi,G).toLowerCase(),this.x=(a.match(/left|right/i)||a.match(/center/)||["inherit"])[0].toLowerCase(),this.y=(a.match(/top|bottom|center/i)||["inherit"])[0].toLowerCase(),this.forceY=!!b;var c=a.charAt(0);this.precedance="t"===c||"b"===c?B:A}).prototype;Y.invert=function(a,b){this[a]=this[a]===D?F:this[a]===F?D:b||this[a]},Y.string=function(a){var b=this.x,c=this.y,d=b!==c?"center"===b||"center"!==c&&(this.precedance===B||this.forceY)?[c,b]:[b,c]:[b];return a!==!1?d.join(" "):d},Y.abbrev=function(){var a=this.string(!1);return a[0].charAt(0)+(a[1]&&a[1].charAt(0)||"")},Y.clone=function(){return new u(this.string(),this.forceY)},t.toggle=function(a,c){var e=this.cache,f=this.options,g=this.tooltip;if(c){if(/over|enter/.test(c.type)&&e.event&&/out|leave/.test(e.event.type)&&f.show.target.add(c.target).length===f.show.target.length&&g.has(c.relatedTarget).length)return this;e.event=d.event.fix(c)}if(this.waiting&&!a&&(this.hiddenDuringWait=x),!this.rendered)return a?this.render(1):this;if(this.destroyed||this.disabled)return this;var h,i,j,k=a?"show":"hide",l=this.options[k],m=(this.options[a?"hide":"show"],this.options.position),n=this.options.content,o=this.tooltip.css("width"),p=this.tooltip.is(":visible"),q=a||1===l.target.length,r=!c||l.target.length<2||e.target[0]===c.target;return(typeof a).search("boolean|number")&&(a=!p),h=!g.is(":animated")&&p===a&&r,i=h?z:!!this._trigger(k,[90]),this.destroyed?this:(i!==y&&a&&this.focus(c),!i||h?this:(d.attr(g[0],"aria-hidden",!a),a?(this.mouse&&(e.origin=d.event.fix(this.mouse)),d.isFunction(n.text)&&this._updateContent(n.text,y),d.isFunction(n.title)&&this._updateTitle(n.title,y),!w&&"mouse"===m.target&&m.adjust.mouse&&(d(b).bind("mousemove."+I,this._storeMouse),w=x),o||g.css("width",g.outerWidth(y)),this.reposition(c,arguments[2]),o||g.css("width",""),l.solo&&("string"==typeof l.solo?d(l.solo):d(M,l.solo)).not(g).not(l.target).qtip("hide",d.Event("tooltipsolo"))):(clearTimeout(this.timers.show),delete e.origin,w&&!d(M+'[tracking="true"]:visible',l.solo).not(g).length&&(d(b).unbind("mousemove."+I),w=y),this.blur(c)),j=d.proxy(function(){a?(V.ie&&g[0].style.removeAttribute("filter"),g.css("overflow",""),"string"==typeof l.autofocus&&d(this.options.show.autofocus,g).focus(),this.options.show.target.trigger("qtip-"+this.id+"-inactive")):g.css({display:"",visibility:"",opacity:"",left:"",top:""}),this._trigger(a?"visible":"hidden")},this),l.effect===y||q===y?(g[k](),j()):d.isFunction(l.effect)?(g.stop(1,1),l.effect.call(g,this),g.queue("fx",function(a){j(),a()})):g.fadeTo(90,a?1:0,j),a&&l.target.trigger("qtip-"+this.id+"-inactive"),this))},t.show=function(a){return this.toggle(x,a)},t.hide=function(a){return this.toggle(y,a)},t.focus=function(a){if(!this.rendered||this.destroyed)return this;var b=d(M),c=this.tooltip,e=parseInt(c[0].style.zIndex,10),f=s.zindex+b.length;return c.hasClass(Q)||this._trigger("focus",[f],a)&&(e!==f&&(b.each(function(){this.style.zIndex>e&&(this.style.zIndex=this.style.zIndex-1)}),b.filter("."+Q).qtip("blur",a)),c.addClass(Q)[0].style.zIndex=f),this},t.blur=function(a){return!this.rendered||this.destroyed?this:(this.tooltip.removeClass(Q),this._trigger("blur",[this.tooltip.css("zIndex")],a),this)},t.disable=function(a){return this.destroyed?this:("toggle"===a?a=!(this.rendered?this.tooltip.hasClass(S):this.disabled):"boolean"!=typeof a&&(a=x),this.rendered&&this.tooltip.toggleClass(S,a).attr("aria-disabled",a),this.disabled=!!a,this)},t.enable=function(){return this.disable(y)},t._createButton=function(){var a=this,b=this.elements,c=b.tooltip,e=this.options.content.button,f="string"==typeof e,g=f?e:"Close tooltip";b.button&&b.button.remove(),b.button=e.jquery?e:d("<a />",{"class":"qtip-close "+(this.options.style.widget?"":I+"-icon"),title:g,"aria-label":g}).prepend(d("<span />",{"class":"ui-icon ui-icon-close",html:"&times;"})),b.button.appendTo(b.titlebar||c).attr("role","button").click(function(b){return c.hasClass(S)||a.hide(b),y})},t._updateButton=function(a){if(!this.rendered)return y;var b=this.elements.button;a?this._createButton():b.remove()},t._setWidget=function(){var a=this.options.style.widget,b=this.elements,c=b.tooltip,d=c.hasClass(S);c.removeClass(S),S=a?"ui-state-disabled":"qtip-disabled",c.toggleClass(S,d),c.toggleClass("ui-helper-reset "+k(),a).toggleClass(P,this.options.style.def&&!a),b.content&&b.content.toggleClass(k("content"),a),b.titlebar&&b.titlebar.toggleClass(k("header"),a),b.button&&b.button.toggleClass(I+"-icon",!a)},t._storeMouse=function(a){return(this.mouse=d.event.fix(a)).type="mousemove",this},t._bind=function(a,b,c,e,f){if(a&&c&&b.length){var g="."+this._id+(e?"-"+e:"");return d(a).bind((b.split?b:b.join(g+" "))+g,d.proxy(c,f||this)),this}},t._unbind=function(a,b){return a&&d(a).unbind("."+this._id+(b?"-"+b:"")),this},t._trigger=function(a,b,c){var e=d.Event("tooltip"+a);return e.originalEvent=c&&d.extend({},c)||this.cache.event||z,this.triggering=a,this.tooltip.trigger(e,[this].concat(b||[])),this.triggering=y,!e.isDefaultPrevented()},t._bindEvents=function(a,b,c,e,f,g){var h=c.filter(e).add(e.filter(c)),i=[];h.length&&(d.each(b,function(b,c){var e=d.inArray(c,a);e>-1&&i.push(a.splice(e,1)[0])}),i.length&&(this._bind(h,i,function(a){var b=this.rendered?this.tooltip[0].offsetWidth>0:!1;(b?g:f).call(this,a)}),c=c.not(h),e=e.not(h))),this._bind(c,a,f),this._bind(e,b,g)},t._assignInitialEvents=function(a){function b(a){return this.disabled||this.destroyed?y:(this.cache.event=a&&d.event.fix(a),this.cache.target=a&&d(a.target),clearTimeout(this.timers.show),void(this.timers.show=l.call(this,function(){this.render("object"==typeof a||c.show.ready)},c.prerender?0:c.show.delay)))}var c=this.options,e=c.show.target,f=c.hide.target,g=c.show.event?d.trim(""+c.show.event).split(" "):[],h=c.hide.event?d.trim(""+c.hide.event).split(" "):[];this._bind(this.elements.target,["remove","removeqtip"],function(){this.destroy(!0)},"destroy"),/mouse(over|enter)/i.test(c.show.event)&&!/mouse(out|leave)/i.test(c.hide.event)&&h.push("mouseleave"),this._bind(e,"mousemove",function(a){this._storeMouse(a),this.cache.onTarget=x}),this._bindEvents(g,h,e,f,b,function(){return this.timers?void clearTimeout(this.timers.show):y}),(c.show.ready||c.prerender)&&b.call(this,a)},t._assignEvents=function(){var c=this,e=this.options,f=e.position,g=this.tooltip,h=e.show.target,i=e.hide.target,j=f.container,k=f.viewport,l=d(b),q=(d(b.body),d(a)),r=e.show.event?d.trim(""+e.show.event).split(" "):[],t=e.hide.event?d.trim(""+e.hide.event).split(" "):[];d.each(e.events,function(a,b){c._bind(g,"toggle"===a?["tooltipshow","tooltiphide"]:["tooltip"+a],b,null,g)}),/mouse(out|leave)/i.test(e.hide.event)&&"window"===e.hide.leave&&this._bind(l,["mouseout","blur"],function(a){/select|option/.test(a.target.nodeName)||a.relatedTarget||this.hide(a)}),e.hide.fixed?i=i.add(g.addClass(O)):/mouse(over|enter)/i.test(e.show.event)&&this._bind(i,"mouseleave",function(){clearTimeout(this.timers.show)}),(""+e.hide.event).indexOf("unfocus")>-1&&this._bind(j.closest("html"),["mousedown","touchstart"],function(a){var b=d(a.target),c=this.rendered&&!this.tooltip.hasClass(S)&&this.tooltip[0].offsetWidth>0,e=b.parents(M).filter(this.tooltip[0]).length>0;b[0]===this.target[0]||b[0]===this.tooltip[0]||e||this.target.has(b[0]).length||!c||this.hide(a)}),"number"==typeof e.hide.inactive&&(this._bind(h,"qtip-"+this.id+"-inactive",o,"inactive"),this._bind(i.add(g),s.inactiveEvents,o)),this._bindEvents(r,t,h,i,m,n),this._bind(h.add(g),"mousemove",function(a){if("number"==typeof e.hide.distance){var b=this.cache.origin||{},c=this.options.hide.distance,d=Math.abs;(d(a.pageX-b.pageX)>=c||d(a.pageY-b.pageY)>=c)&&this.hide(a)}this._storeMouse(a)}),"mouse"===f.target&&f.adjust.mouse&&(e.hide.event&&this._bind(h,["mouseenter","mouseleave"],function(a){return this.cache?void(this.cache.onTarget="mouseenter"===a.type):y}),this._bind(l,"mousemove",function(a){this.rendered&&this.cache.onTarget&&!this.tooltip.hasClass(S)&&this.tooltip[0].offsetWidth>0&&this.reposition(a)})),(f.adjust.resize||k.length)&&this._bind(d.event.special.resize?k:q,"resize",p),f.adjust.scroll&&this._bind(q.add(f.container),"scroll",p)},t._unassignEvents=function(){var c=this.options,e=c.show.target,f=c.hide.target,g=d.grep([this.elements.target[0],this.rendered&&this.tooltip[0],c.position.container[0],c.position.viewport[0],c.position.container.closest("html")[0],a,b],function(a){return"object"==typeof a});e&&e.toArray&&(g=g.concat(e.toArray())),f&&f.toArray&&(g=g.concat(f.toArray())),this._unbind(g)._unbind(g,"destroy")._unbind(g,"inactive")},d(function(){q(M,["mouseenter","mouseleave"],function(a){var b="mouseenter"===a.type,c=d(a.currentTarget),e=d(a.relatedTarget||a.target),f=this.options;b?(this.focus(a),c.hasClass(O)&&!c.hasClass(S)&&clearTimeout(this.timers.hide)):"mouse"===f.position.target&&f.position.adjust.mouse&&f.hide.event&&f.show.target&&!e.closest(f.show.target[0]).length&&this.hide(a),c.toggleClass(R,b)}),q("["+K+"]",N,o)}),s=d.fn.qtip=function(a,b,e){var f=(""+a).toLowerCase(),g=z,i=d.makeArray(arguments).slice(1),j=i[i.length-1],k=this[0]?d.data(this[0],I):z;return!arguments.length&&k||"api"===f?k:"string"==typeof a?(this.each(function(){var a=d.data(this,I);if(!a)return x;if(j&&j.timeStamp&&(a.cache.event=j),!b||"option"!==f&&"options"!==f)a[f]&&a[f].apply(a,i);else{if(e===c&&!d.isPlainObject(b))return g=a.get(b),y;a.set(b,e)}}),g!==z?g:this):"object"!=typeof a&&arguments.length?void 0:(k=h(d.extend(x,{},a)),this.each(function(a){var b,c;return c=d.isArray(k.id)?k.id[a]:k.id,c=!c||c===y||c.length<1||s.api[c]?s.nextid++:c,b=r(d(this),c,k),b===y?x:(s.api[c]=b,d.each(H,function(){"initialize"===this.initialize&&this(b)}),void b._assignInitialEvents(j))}))},d.qtip=e,s.api={},d.each({attr:function(a,b){if(this.length){var c=this[0],e="title",f=d.data(c,"qtip");if(a===e&&f&&"object"==typeof f&&f.options.suppress)return arguments.length<2?d.attr(c,U):(f&&f.options.content.attr===e&&f.cache.attr&&f.set("content.text",b),this.attr(U,b))}return d.fn["attr"+T].apply(this,arguments)},clone:function(a){var b=(d([]),d.fn["clone"+T].apply(this,arguments));return a||b.filter("["+U+"]").attr("title",function(){return d.attr(this,U)}).removeAttr(U),b}},function(a,b){if(!b||d.fn[a+T])return x;var c=d.fn[a+T]=d.fn[a];d.fn[a]=function(){return b.apply(this,arguments)||c.apply(this,arguments)}}),d.ui||(d["cleanData"+T]=d.cleanData,d.cleanData=function(a){for(var b,c=0;(b=d(a[c])).length;c++)if(b.attr(J))try{b.triggerHandler("removeqtip")}catch(e){}d["cleanData"+T].apply(this,arguments)}),s.version="2.2.1",s.nextid=0,s.inactiveEvents=N,s.zindex=15e3,s.defaults={prerender:y,id:y,overwrite:x,suppress:x,content:{text:x,attr:"title",title:y,button:y},position:{my:"top left",at:"bottom right",target:y,container:y,viewport:y,adjust:{x:0,y:0,mouse:x,scroll:x,resize:x,method:"flipinvert flipinvert"},effect:function(a,b){d(this).animate(b,{duration:200,queue:y})}},show:{target:y,event:"mouseenter",effect:x,delay:90,solo:y,ready:y,autofocus:y},hide:{target:y,event:"mouseleave",effect:x,delay:0,fixed:y,inactive:y,leave:"window",distance:y},style:{classes:"",widget:y,width:y,height:y,def:x},events:{render:z,move:z,show:z,hide:z,toggle:z,visible:z,hidden:z,focus:z,blur:z}}})}(window,document);
//# sourceMappingURL=//cdn.jsdelivr.net/qtip2/2.2.1//var/www/qtip2/build/tmp/tmp-6564t0090xs/jquery.qtip.min.map
;(function(e){function o(){try{return r in e&&e[r]}catch(t){return!1}}var t={},n=e.document,r="localStorage",i="script",s;t.disabled=!1,t.set=function(e,t){},t.get=function(e){},t.remove=function(e){},t.clear=function(){},t.transact=function(e,n,r){var i=t.get(e);r==null&&(r=n,n=null),typeof i=="undefined"&&(i=n||{}),r(i),t.set(e,i)},t.getAll=function(){},t.forEach=function(){},t.serialize=function(e){return JSON.stringify(e)},t.deserialize=function(e){if(typeof e!="string")return undefined;try{return JSON.parse(e)}catch(t){return e||undefined}};if(o())s=e[r],t.set=function(e,n){return n===undefined?t.remove(e):(s.setItem(e,t.serialize(n)),n)},t.get=function(e){return t.deserialize(s.getItem(e))},t.remove=function(e){s.removeItem(e)},t.clear=function(){s.clear()},t.getAll=function(){var e={};return t.forEach(function(t,n){e[t]=n}),e},t.forEach=function(e){for(var n=0;n<s.length;n++){var r=s.key(n);e(r,t.get(r))}};else if(n.documentElement.addBehavior){var u,a;try{a=new ActiveXObject("htmlfile"),a.open(),a.write("<"+i+">document.w=window</"+i+'><iframe src="/favicon.ico"></iframe>'),a.close(),u=a.w.frames[0].document,s=u.createElement("div")}catch(f){s=n.createElement("div"),u=n.body}function l(e){return function(){var n=Array.prototype.slice.call(arguments,0);n.unshift(s),u.appendChild(s),s.addBehavior("#default#userData"),s.load(r);var i=e.apply(t,n);return u.removeChild(s),i}}var c=new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]","g");function h(e){return e.replace(/^d/,"___$&").replace(c,"___")}t.set=l(function(e,n,i){return n=h(n),i===undefined?t.remove(n):(e.setAttribute(n,t.serialize(i)),e.save(r),i)}),t.get=l(function(e,n){return n=h(n),t.deserialize(e.getAttribute(n))}),t.remove=l(function(e,t){t=h(t),e.removeAttribute(t),e.save(r)}),t.clear=l(function(e){var t=e.XMLDocument.documentElement.attributes;e.load(r);for(var n=0,i;i=t[n];n++)e.removeAttribute(i.name);e.save(r)}),t.getAll=function(e){var n={};return t.forEach(function(e,t){n[e]=t}),n},t.forEach=l(function(e,n){var r=e.XMLDocument.documentElement.attributes;for(var i=0,s;s=r[i];++i)n(s.name,t.deserialize(e.getAttribute(s.name)))})}try{var p="__storejs__";t.set(p,p),t.get(p)!=p&&(t.disabled=!0),t.remove(p)}catch(f){t.disabled=!0}t.enabled=!t.disabled,typeof module!="undefined"&&module.exports&&this.module!==module?module.exports=t:typeof define=="function"&&define.amd?define(t):e.store=t})(Function("return this")());
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.
(function(){function n(n){function t(t,r,e,u,i,o){for(;i>=0&&o>i;i+=n){var a=u?u[i]:i;e=r(e,t[a],a,t)}return e}return function(r,e,u,i){e=b(e,i,4);var o=!k(r)&&m.keys(r),a=(o||r).length,c=n>0?0:a-1;return arguments.length<3&&(u=r[o?o[c]:c],c+=n),t(r,e,u,o,c,a)}}function t(n){return function(t,r,e){r=x(r,e);for(var u=O(t),i=n>0?0:u-1;i>=0&&u>i;i+=n)if(r(t[i],i,t))return i;return-1}}function r(n,t,r){return function(e,u,i){var o=0,a=O(e);if("number"==typeof i)n>0?o=i>=0?i:Math.max(i+a,o):a=i>=0?Math.min(i+1,a):i+a+1;else if(r&&i&&a)return i=r(e,u),e[i]===u?i:-1;if(u!==u)return i=t(l.call(e,o,a),m.isNaN),i>=0?i+o:-1;for(i=n>0?o:a-1;i>=0&&a>i;i+=n)if(e[i]===u)return i;return-1}}function e(n,t){var r=I.length,e=n.constructor,u=m.isFunction(e)&&e.prototype||a,i="constructor";for(m.has(n,i)&&!m.contains(t,i)&&t.push(i);r--;)i=I[r],i in n&&n[i]!==u[i]&&!m.contains(t,i)&&t.push(i)}var u=this,i=u._,o=Array.prototype,a=Object.prototype,c=Function.prototype,f=o.push,l=o.slice,s=a.toString,p=a.hasOwnProperty,h=Array.isArray,v=Object.keys,g=c.bind,y=Object.create,d=function(){},m=function(n){return n instanceof m?n:this instanceof m?void(this._wrapped=n):new m(n)};"undefined"!=typeof exports?("undefined"!=typeof module&&module.exports&&(exports=module.exports=m),exports._=m):u._=m,m.VERSION="1.8.3";var b=function(n,t,r){if(t===void 0)return n;switch(null==r?3:r){case 1:return function(r){return n.call(t,r)};case 2:return function(r,e){return n.call(t,r,e)};case 3:return function(r,e,u){return n.call(t,r,e,u)};case 4:return function(r,e,u,i){return n.call(t,r,e,u,i)}}return function(){return n.apply(t,arguments)}},x=function(n,t,r){return null==n?m.identity:m.isFunction(n)?b(n,t,r):m.isObject(n)?m.matcher(n):m.property(n)};m.iteratee=function(n,t){return x(n,t,1/0)};var _=function(n,t){return function(r){var e=arguments.length;if(2>e||null==r)return r;for(var u=1;e>u;u++)for(var i=arguments[u],o=n(i),a=o.length,c=0;a>c;c++){var f=o[c];t&&r[f]!==void 0||(r[f]=i[f])}return r}},j=function(n){if(!m.isObject(n))return{};if(y)return y(n);d.prototype=n;var t=new d;return d.prototype=null,t},w=function(n){return function(t){return null==t?void 0:t[n]}},A=Math.pow(2,53)-1,O=w("length"),k=function(n){var t=O(n);return"number"==typeof t&&t>=0&&A>=t};m.each=m.forEach=function(n,t,r){t=b(t,r);var e,u;if(k(n))for(e=0,u=n.length;u>e;e++)t(n[e],e,n);else{var i=m.keys(n);for(e=0,u=i.length;u>e;e++)t(n[i[e]],i[e],n)}return n},m.map=m.collect=function(n,t,r){t=x(t,r);for(var e=!k(n)&&m.keys(n),u=(e||n).length,i=Array(u),o=0;u>o;o++){var a=e?e[o]:o;i[o]=t(n[a],a,n)}return i},m.reduce=m.foldl=m.inject=n(1),m.reduceRight=m.foldr=n(-1),m.find=m.detect=function(n,t,r){var e;return e=k(n)?m.findIndex(n,t,r):m.findKey(n,t,r),e!==void 0&&e!==-1?n[e]:void 0},m.filter=m.select=function(n,t,r){var e=[];return t=x(t,r),m.each(n,function(n,r,u){t(n,r,u)&&e.push(n)}),e},m.reject=function(n,t,r){return m.filter(n,m.negate(x(t)),r)},m.every=m.all=function(n,t,r){t=x(t,r);for(var e=!k(n)&&m.keys(n),u=(e||n).length,i=0;u>i;i++){var o=e?e[i]:i;if(!t(n[o],o,n))return!1}return!0},m.some=m.any=function(n,t,r){t=x(t,r);for(var e=!k(n)&&m.keys(n),u=(e||n).length,i=0;u>i;i++){var o=e?e[i]:i;if(t(n[o],o,n))return!0}return!1},m.contains=m.includes=m.include=function(n,t,r,e){return k(n)||(n=m.values(n)),("number"!=typeof r||e)&&(r=0),m.indexOf(n,t,r)>=0},m.invoke=function(n,t){var r=l.call(arguments,2),e=m.isFunction(t);return m.map(n,function(n){var u=e?t:n[t];return null==u?u:u.apply(n,r)})},m.pluck=function(n,t){return m.map(n,m.property(t))},m.where=function(n,t){return m.filter(n,m.matcher(t))},m.findWhere=function(n,t){return m.find(n,m.matcher(t))},m.max=function(n,t,r){var e,u,i=-1/0,o=-1/0;if(null==t&&null!=n){n=k(n)?n:m.values(n);for(var a=0,c=n.length;c>a;a++)e=n[a],e>i&&(i=e)}else t=x(t,r),m.each(n,function(n,r,e){u=t(n,r,e),(u>o||u===-1/0&&i===-1/0)&&(i=n,o=u)});return i},m.min=function(n,t,r){var e,u,i=1/0,o=1/0;if(null==t&&null!=n){n=k(n)?n:m.values(n);for(var a=0,c=n.length;c>a;a++)e=n[a],i>e&&(i=e)}else t=x(t,r),m.each(n,function(n,r,e){u=t(n,r,e),(o>u||1/0===u&&1/0===i)&&(i=n,o=u)});return i},m.shuffle=function(n){for(var t,r=k(n)?n:m.values(n),e=r.length,u=Array(e),i=0;e>i;i++)t=m.random(0,i),t!==i&&(u[i]=u[t]),u[t]=r[i];return u},m.sample=function(n,t,r){return null==t||r?(k(n)||(n=m.values(n)),n[m.random(n.length-1)]):m.shuffle(n).slice(0,Math.max(0,t))},m.sortBy=function(n,t,r){return t=x(t,r),m.pluck(m.map(n,function(n,r,e){return{value:n,index:r,criteria:t(n,r,e)}}).sort(function(n,t){var r=n.criteria,e=t.criteria;if(r!==e){if(r>e||r===void 0)return 1;if(e>r||e===void 0)return-1}return n.index-t.index}),"value")};var F=function(n){return function(t,r,e){var u={};return r=x(r,e),m.each(t,function(e,i){var o=r(e,i,t);n(u,e,o)}),u}};m.groupBy=F(function(n,t,r){m.has(n,r)?n[r].push(t):n[r]=[t]}),m.indexBy=F(function(n,t,r){n[r]=t}),m.countBy=F(function(n,t,r){m.has(n,r)?n[r]++:n[r]=1}),m.toArray=function(n){return n?m.isArray(n)?l.call(n):k(n)?m.map(n,m.identity):m.values(n):[]},m.size=function(n){return null==n?0:k(n)?n.length:m.keys(n).length},m.partition=function(n,t,r){t=x(t,r);var e=[],u=[];return m.each(n,function(n,r,i){(t(n,r,i)?e:u).push(n)}),[e,u]},m.first=m.head=m.take=function(n,t,r){return null==n?void 0:null==t||r?n[0]:m.initial(n,n.length-t)},m.initial=function(n,t,r){return l.call(n,0,Math.max(0,n.length-(null==t||r?1:t)))},m.last=function(n,t,r){return null==n?void 0:null==t||r?n[n.length-1]:m.rest(n,Math.max(0,n.length-t))},m.rest=m.tail=m.drop=function(n,t,r){return l.call(n,null==t||r?1:t)},m.compact=function(n){return m.filter(n,m.identity)};var S=function(n,t,r,e){for(var u=[],i=0,o=e||0,a=O(n);a>o;o++){var c=n[o];if(k(c)&&(m.isArray(c)||m.isArguments(c))){t||(c=S(c,t,r));var f=0,l=c.length;for(u.length+=l;l>f;)u[i++]=c[f++]}else r||(u[i++]=c)}return u};m.flatten=function(n,t){return S(n,t,!1)},m.without=function(n){return m.difference(n,l.call(arguments,1))},m.uniq=m.unique=function(n,t,r,e){m.isBoolean(t)||(e=r,r=t,t=!1),null!=r&&(r=x(r,e));for(var u=[],i=[],o=0,a=O(n);a>o;o++){var c=n[o],f=r?r(c,o,n):c;t?(o&&i===f||u.push(c),i=f):r?m.contains(i,f)||(i.push(f),u.push(c)):m.contains(u,c)||u.push(c)}return u},m.union=function(){return m.uniq(S(arguments,!0,!0))},m.intersection=function(n){for(var t=[],r=arguments.length,e=0,u=O(n);u>e;e++){var i=n[e];if(!m.contains(t,i)){for(var o=1;r>o&&m.contains(arguments[o],i);o++);o===r&&t.push(i)}}return t},m.difference=function(n){var t=S(arguments,!0,!0,1);return m.filter(n,function(n){return!m.contains(t,n)})},m.zip=function(){return m.unzip(arguments)},m.unzip=function(n){for(var t=n&&m.max(n,O).length||0,r=Array(t),e=0;t>e;e++)r[e]=m.pluck(n,e);return r},m.object=function(n,t){for(var r={},e=0,u=O(n);u>e;e++)t?r[n[e]]=t[e]:r[n[e][0]]=n[e][1];return r},m.findIndex=t(1),m.findLastIndex=t(-1),m.sortedIndex=function(n,t,r,e){r=x(r,e,1);for(var u=r(t),i=0,o=O(n);o>i;){var a=Math.floor((i+o)/2);r(n[a])<u?i=a+1:o=a}return i},m.indexOf=r(1,m.findIndex,m.sortedIndex),m.lastIndexOf=r(-1,m.findLastIndex),m.range=function(n,t,r){null==t&&(t=n||0,n=0),r=r||1;for(var e=Math.max(Math.ceil((t-n)/r),0),u=Array(e),i=0;e>i;i++,n+=r)u[i]=n;return u};var E=function(n,t,r,e,u){if(!(e instanceof t))return n.apply(r,u);var i=j(n.prototype),o=n.apply(i,u);return m.isObject(o)?o:i};m.bind=function(n,t){if(g&&n.bind===g)return g.apply(n,l.call(arguments,1));if(!m.isFunction(n))throw new TypeError("Bind must be called on a function");var r=l.call(arguments,2),e=function(){return E(n,e,t,this,r.concat(l.call(arguments)))};return e},m.partial=function(n){var t=l.call(arguments,1),r=function(){for(var e=0,u=t.length,i=Array(u),o=0;u>o;o++)i[o]=t[o]===m?arguments[e++]:t[o];for(;e<arguments.length;)i.push(arguments[e++]);return E(n,r,this,this,i)};return r},m.bindAll=function(n){var t,r,e=arguments.length;if(1>=e)throw new Error("bindAll must be passed function names");for(t=1;e>t;t++)r=arguments[t],n[r]=m.bind(n[r],n);return n},m.memoize=function(n,t){var r=function(e){var u=r.cache,i=""+(t?t.apply(this,arguments):e);return m.has(u,i)||(u[i]=n.apply(this,arguments)),u[i]};return r.cache={},r},m.delay=function(n,t){var r=l.call(arguments,2);return setTimeout(function(){return n.apply(null,r)},t)},m.defer=m.partial(m.delay,m,1),m.throttle=function(n,t,r){var e,u,i,o=null,a=0;r||(r={});var c=function(){a=r.leading===!1?0:m.now(),o=null,i=n.apply(e,u),o||(e=u=null)};return function(){var f=m.now();a||r.leading!==!1||(a=f);var l=t-(f-a);return e=this,u=arguments,0>=l||l>t?(o&&(clearTimeout(o),o=null),a=f,i=n.apply(e,u),o||(e=u=null)):o||r.trailing===!1||(o=setTimeout(c,l)),i}},m.debounce=function(n,t,r){var e,u,i,o,a,c=function(){var f=m.now()-o;t>f&&f>=0?e=setTimeout(c,t-f):(e=null,r||(a=n.apply(i,u),e||(i=u=null)))};return function(){i=this,u=arguments,o=m.now();var f=r&&!e;return e||(e=setTimeout(c,t)),f&&(a=n.apply(i,u),i=u=null),a}},m.wrap=function(n,t){return m.partial(t,n)},m.negate=function(n){return function(){return!n.apply(this,arguments)}},m.compose=function(){var n=arguments,t=n.length-1;return function(){for(var r=t,e=n[t].apply(this,arguments);r--;)e=n[r].call(this,e);return e}},m.after=function(n,t){return function(){return--n<1?t.apply(this,arguments):void 0}},m.before=function(n,t){var r;return function(){return--n>0&&(r=t.apply(this,arguments)),1>=n&&(t=null),r}},m.once=m.partial(m.before,2);var M=!{toString:null}.propertyIsEnumerable("toString"),I=["valueOf","isPrototypeOf","toString","propertyIsEnumerable","hasOwnProperty","toLocaleString"];m.keys=function(n){if(!m.isObject(n))return[];if(v)return v(n);var t=[];for(var r in n)m.has(n,r)&&t.push(r);return M&&e(n,t),t},m.allKeys=function(n){if(!m.isObject(n))return[];var t=[];for(var r in n)t.push(r);return M&&e(n,t),t},m.values=function(n){for(var t=m.keys(n),r=t.length,e=Array(r),u=0;r>u;u++)e[u]=n[t[u]];return e},m.mapObject=function(n,t,r){t=x(t,r);for(var e,u=m.keys(n),i=u.length,o={},a=0;i>a;a++)e=u[a],o[e]=t(n[e],e,n);return o},m.pairs=function(n){for(var t=m.keys(n),r=t.length,e=Array(r),u=0;r>u;u++)e[u]=[t[u],n[t[u]]];return e},m.invert=function(n){for(var t={},r=m.keys(n),e=0,u=r.length;u>e;e++)t[n[r[e]]]=r[e];return t},m.functions=m.methods=function(n){var t=[];for(var r in n)m.isFunction(n[r])&&t.push(r);return t.sort()},m.extend=_(m.allKeys),m.extendOwn=m.assign=_(m.keys),m.findKey=function(n,t,r){t=x(t,r);for(var e,u=m.keys(n),i=0,o=u.length;o>i;i++)if(e=u[i],t(n[e],e,n))return e},m.pick=function(n,t,r){var e,u,i={},o=n;if(null==o)return i;m.isFunction(t)?(u=m.allKeys(o),e=b(t,r)):(u=S(arguments,!1,!1,1),e=function(n,t,r){return t in r},o=Object(o));for(var a=0,c=u.length;c>a;a++){var f=u[a],l=o[f];e(l,f,o)&&(i[f]=l)}return i},m.omit=function(n,t,r){if(m.isFunction(t))t=m.negate(t);else{var e=m.map(S(arguments,!1,!1,1),String);t=function(n,t){return!m.contains(e,t)}}return m.pick(n,t,r)},m.defaults=_(m.allKeys,!0),m.create=function(n,t){var r=j(n);return t&&m.extendOwn(r,t),r},m.clone=function(n){return m.isObject(n)?m.isArray(n)?n.slice():m.extend({},n):n},m.tap=function(n,t){return t(n),n},m.isMatch=function(n,t){var r=m.keys(t),e=r.length;if(null==n)return!e;for(var u=Object(n),i=0;e>i;i++){var o=r[i];if(t[o]!==u[o]||!(o in u))return!1}return!0};var N=function(n,t,r,e){if(n===t)return 0!==n||1/n===1/t;if(null==n||null==t)return n===t;n instanceof m&&(n=n._wrapped),t instanceof m&&(t=t._wrapped);var u=s.call(n);if(u!==s.call(t))return!1;switch(u){case"[object RegExp]":case"[object String]":return""+n==""+t;case"[object Number]":return+n!==+n?+t!==+t:0===+n?1/+n===1/t:+n===+t;case"[object Date]":case"[object Boolean]":return+n===+t}var i="[object Array]"===u;if(!i){if("object"!=typeof n||"object"!=typeof t)return!1;var o=n.constructor,a=t.constructor;if(o!==a&&!(m.isFunction(o)&&o instanceof o&&m.isFunction(a)&&a instanceof a)&&"constructor"in n&&"constructor"in t)return!1}r=r||[],e=e||[];for(var c=r.length;c--;)if(r[c]===n)return e[c]===t;if(r.push(n),e.push(t),i){if(c=n.length,c!==t.length)return!1;for(;c--;)if(!N(n[c],t[c],r,e))return!1}else{var f,l=m.keys(n);if(c=l.length,m.keys(t).length!==c)return!1;for(;c--;)if(f=l[c],!m.has(t,f)||!N(n[f],t[f],r,e))return!1}return r.pop(),e.pop(),!0};m.isEqual=function(n,t){return N(n,t)},m.isEmpty=function(n){return null==n?!0:k(n)&&(m.isArray(n)||m.isString(n)||m.isArguments(n))?0===n.length:0===m.keys(n).length},m.isElement=function(n){return!(!n||1!==n.nodeType)},m.isArray=h||function(n){return"[object Array]"===s.call(n)},m.isObject=function(n){var t=typeof n;return"function"===t||"object"===t&&!!n},m.each(["Arguments","Function","String","Number","Date","RegExp","Error"],function(n){m["is"+n]=function(t){return s.call(t)==="[object "+n+"]"}}),m.isArguments(arguments)||(m.isArguments=function(n){return m.has(n,"callee")}),"function"!=typeof/./&&"object"!=typeof Int8Array&&(m.isFunction=function(n){return"function"==typeof n||!1}),m.isFinite=function(n){return isFinite(n)&&!isNaN(parseFloat(n))},m.isNaN=function(n){return m.isNumber(n)&&n!==+n},m.isBoolean=function(n){return n===!0||n===!1||"[object Boolean]"===s.call(n)},m.isNull=function(n){return null===n},m.isUndefined=function(n){return n===void 0},m.has=function(n,t){return null!=n&&p.call(n,t)},m.noConflict=function(){return u._=i,this},m.identity=function(n){return n},m.constant=function(n){return function(){return n}},m.noop=function(){},m.property=w,m.propertyOf=function(n){return null==n?function(){}:function(t){return n[t]}},m.matcher=m.matches=function(n){return n=m.extendOwn({},n),function(t){return m.isMatch(t,n)}},m.times=function(n,t,r){var e=Array(Math.max(0,n));t=b(t,r,1);for(var u=0;n>u;u++)e[u]=t(u);return e},m.random=function(n,t){return null==t&&(t=n,n=0),n+Math.floor(Math.random()*(t-n+1))},m.now=Date.now||function(){return(new Date).getTime()};var B={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","`":"&#x60;"},T=m.invert(B),R=function(n){var t=function(t){return n[t]},r="(?:"+m.keys(n).join("|")+")",e=RegExp(r),u=RegExp(r,"g");return function(n){return n=null==n?"":""+n,e.test(n)?n.replace(u,t):n}};m.escape=R(B),m.unescape=R(T),m.result=function(n,t,r){var e=null==n?void 0:n[t];return e===void 0&&(e=r),m.isFunction(e)?e.call(n):e};var q=0;m.uniqueId=function(n){var t=++q+"";return n?n+t:t},m.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};var K=/(.)^/,z={"'":"'","\\":"\\","\r":"r","\n":"n","\u2028":"u2028","\u2029":"u2029"},D=/\\|'|\r|\n|\u2028|\u2029/g,L=function(n){return"\\"+z[n]};m.template=function(n,t,r){!t&&r&&(t=r),t=m.defaults({},t,m.templateSettings);var e=RegExp([(t.escape||K).source,(t.interpolate||K).source,(t.evaluate||K).source].join("|")+"|$","g"),u=0,i="__p+='";n.replace(e,function(t,r,e,o,a){return i+=n.slice(u,a).replace(D,L),u=a+t.length,r?i+="'+\n((__t=("+r+"))==null?'':_.escape(__t))+\n'":e?i+="'+\n((__t=("+e+"))==null?'':__t)+\n'":o&&(i+="';\n"+o+"\n__p+='"),t}),i+="';\n",t.variable||(i="with(obj||{}){\n"+i+"}\n"),i="var __t,__p='',__j=Array.prototype.join,"+"print=function(){__p+=__j.call(arguments,'');};\n"+i+"return __p;\n";try{var o=new Function(t.variable||"obj","_",i)}catch(a){throw a.source=i,a}var c=function(n){return o.call(this,n,m)},f=t.variable||"obj";return c.source="function("+f+"){\n"+i+"}",c},m.chain=function(n){var t=m(n);return t._chain=!0,t};var P=function(n,t){return n._chain?m(t).chain():t};m.mixin=function(n){m.each(m.functions(n),function(t){var r=m[t]=n[t];m.prototype[t]=function(){var n=[this._wrapped];return f.apply(n,arguments),P(this,r.apply(m,n))}})},m.mixin(m),m.each(["pop","push","reverse","shift","sort","splice","unshift"],function(n){var t=o[n];m.prototype[n]=function(){var r=this._wrapped;return t.apply(r,arguments),"shift"!==n&&"splice"!==n||0!==r.length||delete r[0],P(this,r)}}),m.each(["concat","join","slice"],function(n){var t=o[n];m.prototype[n]=function(){return P(this,t.apply(this._wrapped,arguments))}}),m.prototype.value=function(){return this._wrapped},m.prototype.valueOf=m.prototype.toJSON=m.prototype.value,m.prototype.toString=function(){return""+this._wrapped},"function"==typeof define&&define.amd&&define("underscore",[],function(){return m})}).call(this);
//# sourceMappingURL=underscore-min.map
"use strict";

window.appName         = 'AltaSoft';
window[window.appName] = {}; // application

window.Extends = function (child, parent)
{
    var tempConstructor         = function (){};
    tempConstructor.prototype   = parent.prototype;
    child.prototype             = new tempConstructor();
    child.prototype.constructor = child;
};

/**
 * @class: config
 * @desc: Основная глобальная конфигурация
 * Наследование CmyNewClass.prototype = new Cconfig()
 */

window.Cconfig = function (){}

_.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g,
    evaluate   : /\{\[(.+?)\]\}/g
};

// public variables
Cconfig.prototype.example    = 'Пример наследования!'; // speed animate
Cconfig.prototype.anim       = 500; // speed animate
Cconfig.prototype.debug      = true;
Cconfig.prototype.cookie     = { expires: 7, path: '/' }; // cookie settings
Cconfig.prototype.month      = [
    "январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"
]
Cconfig.prototype.datepicker = {
    nextText  : "",
    prevText  : "",
    dateFormat: 'dd.mm.yy',
    showAnim  : 'fadeIn',
    onSelect  : function (dateText, inst)
    {
        var _this = this;
        
        $(document).trigger(
            {
                type  : "datepicker.onSelect",
                date  : dateText,
                inst  : inst,
                parent: this
            }
        )
    }
}

if (window.lang_url !== '/en')
    Cconfig.prototype.datepicker['monthNames'] = Cconfig.prototype.month;


/**
 * Get number or name the month
 * @param num - number or name month on Rus
 * @returns {*} - number or name respectively
 */
Cconfig.prototype.getMonth = function (num)
{
    var res     = null,
        workNum = parseInt(num);
    
    if (isNaN(workNum)) // if param is name month
    {
        num = num.toLowerCase().slice(0, 3);
        $.each(
            this.month, function (i, month)
            {
                
                if (num === month.toLowerCase().slice(0, 3))
                {
                    res = ++i
                    return false;
                }
                
            }
        )
    }
    
    else
        res = this.month[--workNum];
    
    return res;
};


/**
 * Определяем браузер
 */
var userAgent                  = navigator.userAgent.toLowerCase()
Cconfig.prototype.browser_name = 'unknown';

if (userAgent.indexOf('chrome') !== -1) Cconfig.prototype.browser_name = 'chrome'
else
    if (userAgent.indexOf('firefox') !== -1) Cconfig.prototype.browser_name = 'firefox'
    else
        if (userAgent.indexOf('opera') !== -1) Cconfig.prototype.browser_name = 'opera'
        else
            if (userAgent.indexOf('safari') !== -1) Cconfig.prototype.browser_name = 'safari'
            
            else
                if (Function('/*@cc_on return document.documentMode===10@*/')())
                {
                    Cconfig.prototype.browser_name = 'ie10 browser_ie'
                }
                
                else
                    if (!(window.ActiveXObject) && "ActiveXObject" in window)
                    {
                        Cconfig.prototype.browser_name = 'ie11 browser_ie'
                    }

/**
 * Определяем операционную систему
 */
Cconfig.prototype.OSName = "OS_unknown";

if (navigator.appVersion.indexOf("Win") !== -1) Cconfig.prototype.OSName = "OS_windows";
else
    if (/iPad|iPhone|iPod/.test(navigator.platform)) Cconfig.prototype.OSName = "OS_ios";
    else
        if (navigator.appVersion.indexOf("Mac") !== -1) Cconfig.prototype.OSName = "OS_macos";
        else
            if (navigator.appVersion.indexOf("X11") !== -1) Cconfig.prototype.OSName = "OS_unix";
            else
                if (navigator.appVersion.indexOf("Linux") !== -1 && navigator.appVersion.indexOf(
                        "Android"
                    ) === -1) Cconfig.prototype.OSName = "OS_linux";
                else
                    if (navigator.appVersion.indexOf("Android") !== -1) Cconfig.prototype.OSName = "OS_android";

/**
 * Если в браузере нет консоли, то ставим заглушку
 */
if (!window.console) window.console = {
    log     : function ()
    {
    }, dir  : function ()
    {
    }, warn : function ()
    {
    }, error: function ()
    {
    }
}


window.it = function (data)
{
    console.log(data)
}

window.onerror = function (message, source, lineNr)
{
    //$.miniNoty(message, 'error')
    $('.loader').removeClass('loader');
    return false;
};

/**
 * Настройки ajax по-умолчанию
 */
$.ajaxSetup(
    {
        complete: function ()
        {
            $('.loader').removeClass('loader')
        }
    }
);

Cconfig.prototype.__init__ = function (cnf)
{
    
    /**
     * Публичные переменные после загрузки DOM
     */
    Cconfig.prototype.tagHtml = $('html')
    Cconfig.prototype.tagBody     = $('body')
    Cconfig.prototype.tagMainMenu = $('.mainMenu')
    Cconfig.prototype.tagHeader   = $('.template_header')
    Cconfig.prototype.tagFooter   = $('.template_footer')
};


Cconfig.prototype.validator = function (str)
{
    str = $.trim(str.toString())
    
    this.isEmail = function ()
    {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(str);
    }
    
    this.isEmpty = function ()
    {
        
        if (str === '') return true;
        else return false;
        
    }
    
    return str
}

/**
 * Функция обрабатывает искусственное нажатие на ссылку
 * @el_link - тег A или любой тег где есть аттрибут data-link
 */
Cconfig.prototype.redirect = function (el_link, _blank)
{
    
    if (!el_link || el_link === undefined || $.isEmptyObject(el_link))
    {
        console.error('Отсутствует обязательный агрумент или элемента не существует');
        return false;
    }
    
    if (typeof el_link !== 'string')
    {
        el_link = $(el_link)
        
        var link = el_link.prop('href') ? el_link.attr('href') : el_link.data('link')
    }
    
    else
    {
        
        if (_blank)
            window.open(el_link, '_blank');
        else
            window.location.href = el_link
        
        return el_link;
    }
    
    if (el_link.prop('target') == '_blank' || el_link.data('target') == '_blank' || _blank)
        window.open(link, '_blank');
    else
        window.location.href = link
    
    return link;
}

/**
 * Обрабатывает строку с датой в формате  0000-00-00
 * Возвращает только дату (не время!)
 */
Cconfig.prototype.formatDate = function (criteria, source)
{
    if (!criteria || !source) return false;
    
    if (!(source instanceof Date))
        source = source.match(/[\d-]+/)[0]
    
    return $.datepicker.formatDate(
        criteria, typeof source === 'string' ? new Date(
            source.match(/^(\d+)-/)[1], (source.match(/-(\d+)-/)[1] - 1), source.match(/(\d+)$/)[1]
        ) : source
    );
}

/**
 * Спустить скролл до нужного значения или элемента
 * @param value - значение до куда нужно проскролить, может принимать Integer или node-элемент
 * @param speed - скорость
 * @param callback - обратный вызов
 */
Cconfig.prototype.toScroll = function (value, speed, callback)
{
    
    var arg = arguments
    
    callback = $.isFunction(speed) ? speed : callback;
    speed    = $.isFunction(speed) ? config.anim : speed;
    
    if (typeof value !== 'number')
        value = $(value).first().offset().top
    
    $('html, body').animate(
        {
            scrollTop: value
        }, speed
    )
    
    // destroy doubled cell
    setTimeout(
        function ()
        {
            if (callback && $.isFunction(callback)) callback(arg)
        }, speed
    )
    
}

/**
 * Call this function to show|hide dark background for all window
 * Call event for document: blackout.off blackout.on
 * @returns {Cconfig}
 */
Cconfig.prototype.blackout = function ()
{
    var self     = this,
        blackout = $('.blackout'),
        speed    = 'slow';
    
    if (blackout.length)
    {
        blackout.stop(false, true).fadeOut(
            speed, function ()
            {
                blackout.remove()
            }
        )
        $(document).trigger(
            {
                type: 'blackout.off'
            }
        )
    }
    
    else
    {
        $(
            '<div/>', {
                'class': 'blackout',
                height : $(document).height(),
                width  : $(document).width()
            }
        )
            .hide()
            .appendTo('body')
            .fadeIn(speed)
        
        $(document).trigger(
            {
                type: 'blackout.on'
            }
        )
    }
    
    
    return this;
}

/**
 * Format link for foreign version of site
 * @param link - real link
 * @returns {string}
 */
Cconfig.prototype.foreignLink = function (link)
{
    link = link || '';
    
    if (!window.lang_url) return link;
    
    return window.lang_url + link;
}

/**
 * Add space in number
 * @param num - number, string or integer, float
 * @returns {string}
 */
Cconfig.prototype.numeral = function (num)
{
    return num.toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ')
}

/**
 * Declension of words
 * @param $n - number
 * @param $s - array words [яблоко, яблока, яблок]
 * @returns {string}
 */
Cconfig.prototype.formatWord = function ($n, $s)
{
    if (!$n) return false;
    
    var $m = $n % 10,
        $j = $n % 100;
    
    if ($m == 0 || $m >= 5 || ($j >= 10 && $j <= 20)) return $s[2];
    
    if ($m >= 2 && $m <= 4) return $s[1];
    
    return $s[0];
}

/**
 * Check INN
 * @param inn - string or number
 * @returns {boolean}
 */
Cconfig.prototype.innCheck = function (inn)
{
    inn = $.trim(inn.toString());
    var self = this,
        innLength = inn.length,
        result = false;
    
    if(innLength === 10){        
        result =  ( self.innControlNum(inn, 'n1_10') === Number(inn[9]) ); 
    } else if (innLength === 12) {
        result =  ( self.innControlNum(inn, 'n1_12') === Number(inn[11]) ) 
                && ( self.innControlNum(inn, 'n2_12') === Number(inn[10]) );     
    };
    return result;
}

Cconfig.prototype.innControlNum = function (inn, type)
{
    var result = false,
        multipliersSets = {
            'n2_12': [7, 2, 4, 10, 3, 5, 9, 4, 6, 8],
            'n1_12': [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8],
            'n1_10': [2, 4, 10, 3, 5, 9, 4, 6, 8], 
        },
        multipliers = multipliersSets[type],
        sum = 0;
    for (var i = 0, l = multipliers.length; i < l; i++) { 
        sum = sum + ( Number(inn[i]) * multipliers[i] );
    }
    return  sum % 11 % 10;    
}

/**
 * Check INN roboform rule
 */
$.roboFormAddRule(function(form, cnf){
    var result = true,
        hasRules = function(rules, source){
            if(source !== undefined && source.indexOf(rules) !== -1){
                return true;
            } else{
                return false;
            }
        },
        exceptionError = function(cnf, field, message){

            $('input[type="submit"], .createEvent[data-event="submit"]')
                .removeClass('loader')

            // if(field.data('robomessage'))
            //  message = field.data('robomessage')

            field.addClass(cnf.errorElementClass)
            console.error(message, field)

            var el_error = field.next()

            if(el_error.length && el_error.hasClass(cnf.errorElementClass))
            {
                el_error.html(message)
            }

            else
            {
                var el_error = document.createElement('div')
                el_error.setAttribute('class', cnf.errorElementClass)
                el_error.innerHTML = message

                field.after(el_error)
            }

            cnf.isValid = false
            $(el_error).addClass(cnf.errorVisibleClass)

            return false;
        };
        
    // пробераемся по полям форм
    $(cnf.field, form).each(function () {
        var _this = $(this),
            el_error = _this.next(),
            value = $.trim(_this.val()),
            rules = _this.data('roborules');

        if(hasRules('inn', rules) && (hasRules('required', rules) || value !== '')){         
            result = config.innCheck(value);
            var mes = (value && value.length == 12) ? 'ИНН не соответствует контрольным числам' : 'ИНН не соответствует контрольному числу';
            if(!result){                
                exceptionError(cnf, _this, mes);
            }           
        }
        if(hasRules('bank-account', rules) && (hasRules('required', rules) || value !== '')){    
            result = config.bankAccountCheck(value);
            var mes =  'Не соответствует контрольным числам';
            if(!result){
                exceptionError(cnf, _this, mes);
            }           
        }               
    });
    if(!result){
        form.trigger({
            type: 'roboForm.valid.false'
        });        
    }
    return result; // false if not valid that to prevent submit of event
})


Cconfig.prototype.bankAccountCheck = function (Str)
{
    var result = false;
    var Sum = 0;
    
    //весовые коэффициенты
    var v = [7,1,3,7,1,3,7,1,3,7,1,3,7,1,3,7,1,3,7,1,3,7,1];
    
    for (var i = 0; i <= 22; i++) 
    { 
        //вычисляем контрольную сумму
        Sum = Sum + ( Number(Str.charAt(i)) * v[i] ) % 10;
    }
    
    //сравниваем остаток от деления контрольной суммы на 10 с нулём
    if(Sum % 10 == 0)
    {
        result = true;
    }
        
    return result;  
}

window.config = new Cconfig;
window.Cexample = function (){}
Extends(Cexample, Cconfig);

Cexample.prototype.method = function()
{
    console.log('Пример класса!');
    console.log(this.example); // надо понимать откуда это взялось
};
window.EScalcForm = function (){}
Extends(EScalcForm, Cconfig);

EScalcForm.prototype._init = function(settings)
{
	var self = this;
	self.$form = $();
	self.goods = null; //
	$.extend(self, settings);
	self.$goodsBoks =  $('.EScalcForm__box', self.$form);
	self.$radioTabs =  $('.EScalcForm-radio-tabs__input', self.$form).on('change.EScalcForm', function(){ 
		self.showCurrentGods();
		self._setAllActiveGood();
	});
	self.$priceBox = $('.EScalcForm__price-box', self.$form);
	self._selectGoods();
	
	if(self.goods){
		self._createGoodsList(self.goods);
	}	
	self.$goods = $('.EScalcForm__good', self.$goodsBoks);
	self.$goodsInputs = $('.EScalcForm__good-input', self.$goodsBoks);
	self.showCurrentGods();
	self._setAllActiveGood();
};

EScalcForm.prototype._createGoodsList = function(goods){
	var self = this,
		html = '',
		additionalHtml = '',
		lastHtml = '';

	function creatGoodHtml(good){
		var html = '',
			isAdditional = good.parents ? true : false,
			isAdditionalClass = isAdditional ? ' EScalcForm__good-additional' : '',
			isLast = good.last ? true : false,
			isLastClass = isLast ? ' EScalcForm__good-last' : '',		
			dataParents = good.parents ? (' data-parents="'+ good.parents +'"') : '',
			type = good.type ? good.type : '',
			inputType = good.input_type ? good.input_type : 'checkbox';

		html += '<label class="EScalcForm__good'+ isAdditionalClass + isLastClass +'" data-type="'+ type +'">';
			// html += '<small class="EScalcForm__good-id">'+ good.price_id +' </small>';
			html += '<input class="EScalcForm__good-input" type="'+ inputType +'" name="goods[]" data-price="'+ good.price +'"'+dataParents+' id="good-'+ good.price_id +'"/>';
			html += '<strong class="EScalcForm__good-title">'+ good.name +'</strong><span class="EScalcForm__good-price"> '+ good.price +' руб</span>';
		html += '</label>';
		return html;	
	}

	$(goods).each(function(){
		var good = this,
			isLast = good.last ? true : false,
			isAdditional = good.parents ? true : false,
			goodHtml = creatGoodHtml(good);
		if(isAdditional){
			additionalHtml += goodHtml;	
		}else if(isLast){
			lastHtml += goodHtml;	
		} else{
			html += goodHtml;	
		}
	});
	self.$goodsBoks.html( (html + additionalHtml + lastHtml) );		
};

EScalcForm.prototype.showCurrentGods = function(){
	var self = this,
		type = self.$radioTabs.filter(':checked').val(),
		goods = self._getGoodsByType(type);
	//self._createGoodsList(goods);
	self.$goods.each(function(){
		var $good = $(this),
			goodTypeStr = $good.data('type'),
			goodType = goodTypeStr && goodTypeStr.split ? goodTypeStr.split(',') : goodTypeStr,
			isVisible = $.isArray(goodType) ? ($.inArray(type, goodType) !== -1) : (type == goodType);
		if(isVisible){
			$good.show();	
		} else{
			$good.hide();	
		}
	});
	self.calculatePrice();
	self.disableAdditionalGoods();		
};

EScalcForm.prototype.__goodsCash = [];

EScalcForm.prototype._getGoodsByType = function(type){
	var self = this,
		resultGoods = null;
	if(self.__goodsCash[type]){
		resultGoods = self.__goodsCash[type] 
	} else{
		resultGoods = $.grep(self.goods, function( good) {
			return $.isArray(good.type) ? ($.inArray(type*1, good.type) !== -1) : (type == good.type);
		});
		self.__goodsCash[type] = resultGoods;
	}

	return resultGoods;
};

EScalcForm.prototype.calculatePrice = function(){
	var self = this,
		$goods = $(".EScalcForm__good-input:checked:visible", self.$goodsBoks),
		price = 0;
	$goods.each(function(){
		var currPrice = $(this).data('price') || 0;
		price += (currPrice*1);
	});
	price = price ? self.numeral(price) + ' руб.' : '';
	self.$priceBox.html( price );
};

EScalcForm.prototype._selectGoods = function(){
	var self = this;
	self.$form.on('change.EScalcForm', '.EScalcForm__good-input', function(){ 
		self.calculatePrice();
		self.disableAdditionalGoods();
		self._setActiveGood( $(this) );
	});
};

EScalcForm.prototype._setAllActiveGood = function(){
	var self = this;
	self.$goods.each(function(){
		var $good = $(this),
			$input = $('.EScalcForm__good-input', $good);

		self._setActiveGood($input, $good);
	});
};	

EScalcForm.prototype._setActiveGood = function($input, $box){
	var self = this,
		$box = $box || $input.parent('.EScalcForm__good'),
		activeClass = 'EScalcForm__good_active';
	if( $input.is(':checked') ){
		$box.addClass(activeClass);
	} else{
		$box.removeClass(activeClass);
	}
};

EScalcForm.prototype.disableAdditionalGoods = function(){
	var self = this,
		$goodboxs = $(".EScalcForm__good-additional:visible", self.$goodsBoks),
		price = 0,
		disabledClass = "EScalcForm__good_disabled";

	$goodboxs.each(function(){
		var $box = $(this),
			$input = $('.EScalcForm__good-input', $box),
			parentsStr = $input.data('parents') || null,
			parents = parentsStr && parentsStr.split ? parentsStr.split(',') : (parentsStr ? [parentsStr+''] : null),
			isParentsCheked = false;

		if(parents){
			$.each(parents, function(){
				var  id = this,
					$parentInput = $(('#good-'+id), self.$goodsBoks),
					isVisible = $parentInput.is(":visible");
					isParentChecked = $parentInput.is(":checked");
				if(isVisible && isParentChecked){
					isParentsCheked = true;	
				}
			}); 
		}

		if(isParentsCheked){
			$box.removeClass(disabledClass);
			$input.prop('disabled', false);
		} else{
			$box.addClass(disabledClass);
			$input.prop('checked', false);
			$input.prop('disabled', true);
			self.calculatePrice();	
		}
	});
};

window.StepForm = function (){}
Extends(StepForm, Cconfig);

StepForm.prototype._init = function($form)
{
	var self =this;		
	self.$form = $form;
	self.$submitBtn = $('.stepForm__submit', $form);
    self._tabs();
    self._radioTabs();
    self._validate();
    self._isEdit();

    $('.stepForm__inputmask', $form).inputmask();   
};

StepForm.prototype._disableSubmit = function()
{
	var self = this;
	self.$submitBtn.addClass('btn-gray').removeClass('btn-green');
	self.$submitBtn.off('click.StepForm');
	self.$form.off('submit.StepForm').on('submit.StepForm', function(e){
		console.warn('stop submit form');
		e.preventDefault();   	
	});	
};

StepForm.prototype._enableSubmit = function()
{
	var self = this;
	self.$submitBtn.removeClass('btn-gray').addClass('btn-green');
	self.$form.off('submit.StepForm');
	self.$submitBtn.off('click.StepForm').on('click.StepForm', function(e){
		self.$form.submit();    	
	});		
};

StepForm.prototype._activeTab = null;
StepForm.prototype._tabs = function()
{
	var self = this,
		$form = self.$form,
		$tabs = $('.stepForm-tabs__item', $form),
		$blocks = $('.stepForm-tabs__block', $form),
		tabActivClass = 'stepForm-tabs__item_active',
		tabDisableClass = 'stepForm-tabs__item_disable',
		blockActivClass = 'stepForm-tabs__block_active';

	$tabs.on('click.StepForm', function(){
		var $tab = $(this);
		if( !$tab.hasClass(tabDisableClass) ){
			var i = $tab.index(),
				$block = $blocks.eq(i),
				$activeTab = $tabs.filter('.'+tabActivClass),
				$activeBlock = $blocks.filter('.'+blockActivClass);

			$activeTab.removeClass(tabActivClass);
			$tab.addClass(tabActivClass);

			$activeBlock.removeClass(blockActivClass);
			$block.addClass(blockActivClass);

		self._activeTab = i;
		}
	});

	self.$tabsItems = $tabs;

	$tabs.filter('.'+tabActivClass).trigger("click.StepForm");
};

StepForm.prototype._radioTabs = function()
{
	var self = this,
		$form = self.$form;

	$('.stepForm-radio-tabs__block').each(function(){
		var $block = $(this),
			$radios = $('.stepForm-radio-tabs__item', $block),
			$lines = $('.stepForm-radio-tabs__line', $block);		

		$radios.on('change.StepForm', function(){
			var $radio = $(this),
				linesStr = $radio.data('line') || '',
				lines = linesStr && linesStr.split ? linesStr.split(',') : [''];
			$lines.each(function(){
				var $line = $(this),
					type = $line.data('line') + '';

				if( $.inArray(type, lines) !== -1){
					$line.show();	
				} else {
					$line.hide();
				}

			});
		}).trigger('change.StepForm');			
	});

};

StepForm.prototype._validate = function()
{
	var self = this,
		$form = self.$form;
	$form.on('roboForm.valid.false', function(){
		self.isValidTab = false;
		self._validateTab(false);
	}).on('roboForm.valid.true', function(e){
		self.isValidTab = true;
		self._validateTab(true);		
	})		
};

StepForm.prototype._validateTab = function(valid)
{
	var self = this,
		validClass = 'stepForm-tabs__item_valid',
		notValidClass = 'stepForm-tabs__item_not-valid';
	if(self.isEdit){
		if(self._activeTab !==null && self.$tabsItems){
			var $activeTab = self.$tabsItems.eq(self._activeTab);
			if(valid){
				$activeTab.removeClass(notValidClass).addClass(validClass);
			} else {
				$activeTab.removeClass(validClass).addClass(notValidClass);
			}
			
		}
	} else{
		setTimeout(function(){
			self.$tabsItems.removeClass(notValidClass).removeClass(validClass);
		}, 100);		
	}		
};

StepForm.prototype._confirm = function()
{
	var self = this;

	self.$form.submit();

	if(!self.isEdit){
		if(self.isValidTab){
    		var $nextTab = self.$tabsItems.eq(self._activeTab + 1),
    			disabledClass = 'stepForm-tabs__item_disable';
    		if( $nextTab.get(0) ){
    			self.$tabsItems.addClass(disabledClass);
    			$nextTab.removeClass(disabledClass).trigger('click.StepForm');	
    		} else {
    			self._enableSubmit();
    		}
		} else{
			self._disableSubmit();
		}
	} else{
		var isValid = true;
		self.$tabsItems.each(function(){
			if( !$(this).hasClass('stepForm-tabs__item_valid') ){
				isValid = false;	
			}
		});
		if(isValid){
			self._enableSubmit();	
		} else{
			self._disableSubmit();	
		}
	}		
};

StepForm.prototype._stepsDisable = function()
{
	var self = this;
    if(self.isEdit){
    	self.$tabsItems.removeClass('stepForm-tabs__item_disable');
    } else{
    	self.$tabsItems.filter(':not(.stepForm-tabs__item_active)').addClass('stepForm-tabs__item_disable');
    }

    $('.stepForm__confirm', self.$form).on('click.StepForm', function(){
  		self._confirm();
    });   		
};

StepForm.prototype._isEdit = function()
{
	var self = this,
		$form = self.$form,
		$isEditRadios = $('.stepForm__is-edit', $form);
    self.isEdit = $isEditRadios.filter(':checked').val();
    $isEditRadios.on('change.StepForm', function(){
    	self.isEdit = $(this).val();
    	if(!self.isEdit){
    		self._activeTab = 0;
    		self.$tabsItems.removeClass('stepForm-tabs__item_active');
    		self.$tabsItems.eq(0).addClass('stepForm-tabs__item_active').trigger('click.StepForm');
    	}    	
    	self._validateTab();    	
    	self._stepsDisable();  	
    });
    self._stepsDisable();		
};

$(
    function ()
    {
        
        // конфигурации и инициализация сайта
        config.__init__();
    
        $.roboForm();
        
        var example = new Cexample();
        example.method();

        $('.stepForm').each(function(){
            var $form = $(this),
                stepForm = new StepForm();
            stepForm._init($form);
        });

        $('.EScalcForm').each(function(){
            var $form = $(this);
            $.getJSON( "data.json", function( data ) {
                var settings = {
                        $form : $form,
                        goods : data
                    },
                    esCalcForm = new EScalcForm();
                esCalcForm._init(settings);
            });            
        });        
    }
); // dom ready


// last
$(window).load(
    function ()
    {
        // last script(!)
        if (window.PIE)
        {
            
            $('input, textarea').placeholder();
            $('.pie, .boxSubstrate_ie, .module, .btn, .button, .boxSubstrate-cell, .mainMenu ul').each(
                function ()
                {
                    PIE.attach(this)
                }
            );
            
        }
        
        // проверяем снова для ие10
        if (config.tagHtml.hasClass('browser_ie'))
        {
            // фиксим подложки для осла
            
            var fix = function ()
            {
                var el_boxSubstrateIE = $('<div/>', { 'class': 'boxSubstrate_ie' })
                
                $('.boxSubstrate').each(
                    function ()
                    {
                        var _this  = $(this),
                            cls    = _this.attr('class'),
                            offset = 5
                        
                        try
                        {
                            offset = cls.indexOf('boxSubstrate-offset-') !== -1 ? parseInt(
                                cls.match(/boxSubstrate-offset-(\d)+/)[1]
                            ) : 5
                        }
                        catch (e)
                        {
                            offset = 0
                        }
                        
                        var bs = $('.boxSubstrate_ie', _this)
                        if (!bs.length)
                            var clone = el_boxSubstrateIE.clone()
                        else
                            clone = bs
                        
                        clone
                            .width(_this.outerWidth() - offset * 2)
                            .height(_this.outerHeight() - offset * 2)
                        
                        if (!bs.length) _this.prepend(clone)
                        
                    }
                )
                
                if (window.PIE) $('.boxSubstrate_ie').each(
                    function ()
                    {
                        PIE.attach(this)
                    }
                );
            }
            
            fix()
            // из-за того что шрифты не стандартные, придется постоянно рендерить подложку
            setTimeout(
                function ()
                {
                    fix()
                }, 300
            )
            setTimeout(
                function ()
                {
                    fix()
                }, 600
            )
            setInterval(fix, 1000)
        }
    }
)