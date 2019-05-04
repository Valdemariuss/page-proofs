(function (document, uses, requestAnimationFrame, CACHE, LTEIE8, IE9TO11) {
    function embed(svg, g) {
        if (g) {
            var
            viewBox = g.getAttribute('viewBox'),
            fragment = document.createDocumentFragment(),
            clone = g.cloneNode(true);

            if (viewBox) {
                svg.setAttribute('viewBox', viewBox);
            }

            while (clone.childNodes.length) {
                fragment.appendChild(clone.childNodes[0]);
            }

            svg.appendChild(fragment);
        }
    }

    function onload() {
        var xhr = this, x = document.createElement('x'), s = xhr.s;

        x.innerHTML = xhr.responseText;

        xhr.onload = function () {
            s.splice(0).map(function (array) {
                embed(array[0], x.querySelector('#' + array[1].replace(/(\W)/g, '\\$1')));
            });
        };

        xhr.onload();
    }

    function removeByTag(tagName, context){
        var context = context ? context : document.body;
            elems = context.getElementsByTagName(tagName);
        for (var i = 0, l = elems.length; i < l; i++) {
            var el = elems[i];
            el.parentNode.removeChild(el);
        }
    }

    function onframe() {
        var use;

        while ((use = uses[0])) {
            if (LTEIE8) {
                var
                img = new Image();

                //img.src = use.getAttribute('xlink:href').replace('#', '.').replace(/^\./, '') + '.png';
                var xlinkPath = use.getAttribute('xlink:href'),
                    newSrc = xlinkPath ? xlinkPath.split('#') : '',
                    parentBox = use.parentNode,
                    svgEl = parentBox.getElementsByTagName('svg')[0];
                newSrc = newSrc && newSrc[1] ? ('assets/images/icons/' + newSrc[1] + '.png') : 'assets/images/icons/star.png';
                img.src = newSrc;
                img.className  = svgEl.className ;

                //alert(parentBox.getElementsByTagName('//svg').length + '-');
                parentBox.removeChild(svgEl);
                parentBox.replaceChild(img, use);
                removeByTag('/svg', parentBox);
                removeByTag('/use', parentBox);
            } else {
                var
                svg = use.parentNode,
                url = use.getAttribute('xlink:href').split('#'),
                url_root = url[0],
                url_hash = url[1];

                svg.removeChild(use);

                if (url_root.length) {
                    var xhr = CACHE[url_root] = CACHE[url_root] || new XMLHttpRequest();

                    if (!xhr.s) {
                        xhr.s = [];

                        xhr.open('GET', url_root);

                        xhr.onload = onload;

                        xhr.send();
                    }

                    xhr.s.push([svg, url_hash]);

                    if (xhr.readyState === 4) {
                        xhr.onload();
                    }

                } else {
                    embed(svg, document.getElementById(url_hash));
                }
            }
        }

        requestAnimationFrame(onframe);
    }

    if (LTEIE8 || IE9TO11) {
        onframe();
    }
})(
    document,
    document.getElementsByTagName('use'),
    window.requestAnimationFrame || window.setTimeout,
    {},
    /MSIE\s[1-8]\b/.test(navigator.userAgent),
    /Trident\/[567]\b/.test(navigator.userAgent),
    document.createElement('svg'),
    document.createElement('use')
);