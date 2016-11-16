/*jslint browser: true */
(function ($) {
    "use strict";
    var TRANSL = {};

    /*
     * handy common stuff
     * =======================================================================
     */
    function isEmpty(a) {
        return (a === null || a === undefined || (a.hasOwnProperty("length") && a.length === 0));
    }

    function isString(s) {
        return Object.prototype.toString.call(s) === '[object String]';
    }

    /*
     * geo stuff
     * =======================================================================
     */
    function parseLatLon(geom) {
        if (isEmpty(geom)) { return null; }
        var parts = geom.replace(/\s+/gi, '').split(',');
        return {
            "lat" : parts[0],
            "lon" : parts[1]
        };
    }

    function displacementLabelFormatter(fmt) {
        if (!isString(fmt)) {
            return;
        } else if (fmt === "dist") {
            return function (dist, crdn) { return dist + " km"; };
        } else {
            return function (dist, crdn) { return dist + " km " + crdn; };
        }
    }

    function calculateDisplacement(from, to, fmt) {
    /* assumes
        <script src="http://maps.google.com/maps/api/js?sensor=true&libraries=geometry"
                type="text/javascript" charset="utf-8"></script>
    */
        if (!window.hasOwnProperty('google') || !window.google || !window.google.maps) { return null; }

        var geoFrom = new window.google.maps.LatLng(from.lat, from.lon),
            geoTo   = new window.google.maps.LatLng(to.lat, to.lon),
            dist = Math.round(
                window.google.maps.geometry.spherical.computeDistanceBetween(geoFrom, geoTo)
            ),
            degr,
            crdn,
            cardinalDirections = TRANSL.directions,
            numParts = cardinalDirections.length,
            partSize = 360 / numParts;

        if (isNaN(dist) || dist === 0) { return null; }

        dist = Math.round(dist / 100) / 10;
        degr = window.google.maps.geometry.spherical.computeHeading(geoFrom, geoTo);
        crdn = cardinalDirections[Math.floor((degr + 360 + partSize / 2) / 45) % 8];
        fmt = displacementLabelFormatter(fmt);

        return {
            "distance": dist,
            "degree"  : degr,
            "cardinal": crdn,
            "label"   : fmt(dist, crdn)
        };
    }

    /*
     * image rotation stuff
     * ---------------------------------------------------------------
     */
    function imgLoadAndRotate(imgs, time, fn) {
        time = time || 5000 * (1 + Math.random(5000));
        if (imgs === null || imgs === undefined || !imgs.length) {
            return;
        }
        var imgcnt = imgs.length, imgndx = imgs.length;

        function loaded() {
            imgndx -= 1;
            if (imgndx === 0) {
                setInterval(function () {
                    imgndx = (imgndx + 1) % imgcnt;
                    fn(imgs[imgndx]);
                }, time);
            }
        }

        if (imgcnt > 1) {
            imgs.forEach(function (img) {
                $('<img src=' + img + '>').load(loaded);
            });
        }
    }

    /*
     * Read and initialize TRANSL
     * =======================================================================
     */
    $(function () {
        /*
         * Read available translation data in the current language
         * =======================================================================
         */
        TRANSL = $('body').data('translations');
    });


    $(function () {
        var $content = $('#content'), $logo, logos, logobase;

        /*
         * make forms nested in the menu work and show ok
         * =======================================================================
         */
        $('.dropdown-menu').find('form').click(function (e) {
            e.stopPropagation();
        });

        /*
         * Make external links go _blank
         * =======================================================================
         */
        $content.find("a[href^='http']").attr('target', '_blank');

        /*
         * Apply template-styled links to matching uri
         * =======================================================================
         */
        $(".template.link-style > a").each(function () {
            var $lnk = $(this), tgt;

            if ($lnk.length === 1) {
                tgt = $lnk.attr('href');
                $content.find("a[href='" + tgt + "']").each(function () {
                    var $a = $(this);
                    $lnk.clone().insertBefore($a);
                    $a.remove();
                });
            }
        });

        /*
         * give unstyled content-images a basic style
         * =======================================================================
         */
        $content.find("img:not([class])").addClass("img-responsive img-rounded");


        /*
         * make first header in the content stand out
         * =======================================================================
         */
        $('h1', $content).eq(0).addClass('page-header');

        /*
         * make the logo change images
         * =======================================================================
         */
        $logo = $('img#logo');
        logobase = $logo.data('imgbase');
        logos = $logo.data('imgs').map(function (imgref) {
            return logobase + imgref;
        });
        imgLoadAndRotate(logos, 5000, function (imgref) {$logo.attr('src', imgref); });


        /*
         * make the callout form appear when called for
         * =======================================================================
         */
        (function () {
            var $btnOn, $btnOff, $callout, select, initTop;
            function showForm() {
                $callout.animate({"top": 0}, 500);
            }
            function hideForm() {
                $callout.animate({"top": initTop}, 500);
            }
            $btnOn = $('.vd-callout-btn');
            if ($btnOn.length > 0) {
                select = $btnOn.data('calloutselect');
                $callout = $(select);
                $btnOff = $('.btn[role="close"]', $callout);
                initTop = $callout.css('top');
                $btnOn.click(showForm);
                $btnOff.click(hideForm);
            }
        }());


        /*
         * make 404 adapt to language
         * =======================================================================
         */
        (function () {
            var lang = "nl", paths = window.location.pathname.split('/'), text = document.title;
            if (document.title.indexOf("404") === 0) {
                if (paths.length > 2 && paths[1].length === 2) {
                    lang = paths[1];
                }
                $("a.navbar-brand").attr("href", "/" + lang + "/");
                text = "404 - " + TRANSL.lost[lang];
                $("h1").html(text);
                document.title = text;
            }
        }());

        /**
         * make vdctrl links work ok
         * =======================================================================
         */
        (function () {
            $("*[role='vctrl']").each(function () {
                var $grp, $lst, $scroll, $items, $prev, $next, lstWidth, lstCount, itemWidth, pos = 0;
                $grp  = $(this);
                $lst  = $("*[role='vctrl-list']", $grp);
                $scroll = $lst.parent();
                $items = $("*[role='vctrl-item']", $lst);
                $prev = $("*[role='vctrl-prev']", $grp);
                $next = $("*[role='vctrl-next']", $grp);
                lstWidth  = $lst.width();
                lstCount  = $items.length;
                itemWidth = Math.ceil($items.eq(1).position().left);

                function scrollPos() {
                    $scroll.scrollLeft(pos * itemWidth);
                    pos = Math.floor($scroll.scrollLeft() / itemWidth);
                }
                function nav(offset) {
                    pos = Math.min(Math.max((pos + offset), 0), (lstCount - 1));
                    scrollPos();
                    return -1;
                }
                $prev.click(function () {nav(-1); });
                $next.click(function () {nav(+1); });
                scrollPos(0);
            });
        }());
    });


}(window.jQuery));
