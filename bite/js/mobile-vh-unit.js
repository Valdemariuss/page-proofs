/**
 * Fix vh unit size on iPhone, iPad devices where toolbar covers part of the
 * content with height of 100vh
 *
 * Should be used only if using together with non-scrollable content (eg. full screen slides)
 */

// import $ from 'jquery';


const PROPERTIES = ['min-height', 'height', 'max-height'];
const REGEX_VH = /(\d+)vh/;
const REGEX_CAMEL = /-([a-z])/g;


function each (arr, fn) {
    for (let i = 0, ii = arr.length; i < ii; i++) {
        fn(arr[i], i);
    }
}

function camelCase (str) {
    return str.replace(REGEX_CAMEL, (t, chr) => {
        return chr.toUpperCase();
    });
}

function traverseCSSRules (rules, cssRules) {
    each(cssRules, (cssRule) => {
        if (cssRule.cssText.indexOf('vh') !== -1) {
            let properties = [];

            if (cssRule.style) {
                each(PROPERTIES, (property) => {
                    if (cssRule.style[property]) {
                        const rule  = cssRule.style[property];
                        const match = rule.match(REGEX_VH);

                        if (match) {
                            properties.push({
                                'name': camelCase(property),
                                'rule': rule.replace(match[0], '%value%'),
                                'value': parseFloat(match[1])
                            });
                        }
                    }
                });

                if (properties.length) {
                    rules.push({
                        'rule': cssRule,
                        'properties': properties
                    });
                }
            } else if (cssRule.cssRules) {
                // Eg. CSSMediaRule
                traverseCSSRules (rules, cssRule.cssRules);
            }
        }
    });
}

function getMatchingCSSRules () {
    const rules = [];

    each(document.styleSheets, (stylesheet) => {
        if (stylesheet.cssRules) {
            traverseCSSRules(rules, stylesheet.cssRules);
        }
    });

    return rules;
}

function updateCSSRules (rules, height) {
    each(rules, (rule) => {
        each(rule.properties, (property) => {
            const size = Math.round(height * property.value / 100) + 'px';
            rule.rule.style[property.name] = property.rule.replace('%value%', size);
        });
    });
}

function repeatFor (fn, duration) {
    let timer = null;

    const reset = function () {
        timer = null;
    };

    const tick = function () {
        if (timer) {
            fn();
            requestAnimationFrame(tick);
        }
    };

    return function () {
        if (!timer) {
            timer = setTimeout(reset, duration);
            requestAnimationFrame(tick);
        }
    };
}


$(() => {
    // iOS and Android only
    if (/iPad|iPhone|iPod|Android/.test(navigator.userAgent) && !window.MSStream) {
        const rules = getMatchingCSSRules();
        let height = window.innerHeight;

        updateCSSRules(rules, height);

        const handleResize = function () {
            let newHeight = window.innerHeight;

            if (newHeight !== height) {
                height = newHeight;
                updateCSSRules(rules, newHeight);
            }
        };

        const update = repeatFor(handleResize, 1000);
        $(window).on('resize', update);
        $(document).on('touchmove', update);

        setTimeout(handleResize, 16);
        handleResize();
    }
});
