/*jslint browser: true */
/*global moment */
(function ($) {
    "use strict";
    var TRANSL = {};

    /*
     * handy common stuff
     * =======================================================================
    function isEmpty(a) {
        return (a === null || a === undefined || (a.hasOwnProperty("length") && a.length === 0));
    }

    function isString(s) {
        return Object.prototype.toString.call(s) === '[object String]';
    }
    */

    /*
     * geo stuff
     * =======================================================================
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
        } //else
        if (fmt === "dist") {
            return function (dist) { return dist + " km"; };
        } // else
        return function (dist, crdn) { return dist + " km " + crdn; };
    }
    */


    /* assumes
    <script src="http://maps.google.com/maps/api/js?sensor=true&libraries=geometry"
            type="text/javascript" charset="utf-8"></script>

    function calculateDisplacement(from, to, fmt) {
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
    */

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
                var $grp, $lst, $scroll, $items, $prev, $next, lstCount,
                    itemOff, itemWidth, itemHeight = 0, pos = 0;
                $grp  = $(this);
                $lst  = $("*[role='vctrl-list']", $grp);
                $scroll = $lst.parent();
                $items = $("*[role='vctrl-item']", $lst);
                $prev = $("*[role='vctrl-prev']", $grp);
                $next = $("*[role='vctrl-next']", $grp);
                lstCount  = $items.length;
                itemOff = Math.ceil($items.eq(0).position().left);
                itemWidth = Math.ceil($items.eq(1).position().left - itemOff);


                function scrollPos() {
                    // scroll to left side of this desired position
                    $scroll.scrollLeft(pos * itemWidth);
                    // recalibrate position to actual scroll position
                    pos = Math.floor(($scroll.scrollLeft() - itemOff) / itemWidth);
                    // scroll to left of actual calibrated position
                    $scroll.scrollLeft(pos * itemWidth);
                }
                function nav(offset) {
                    pos = Math.min(Math.max((pos + offset), 0), (lstCount - 1));
                    scrollPos();
                    return -1;
                }
                $prev.click(function () {nav(-1); });
                $next.click(function () {nav(+1); });

                function repos() {
                    //align heights
                    $items.each(function () { $(this).css('height', 'auto'); });
                    itemHeight = 0;
                    $items.each(function () { itemHeight = Math.max(itemHeight, $(this).height()); });
                    $items.each(function () { $(this).height(itemHeight); });
                    //soft jump to leftmost to recalibrate
                    $scroll.scrollLeft($items.eq(0).position().left);
                    itemOff = Math.ceil($items.eq(0).position().left);
                    itemWidth = Math.ceil($items.eq(1).position().left - itemOff);
                    scrollPos();
                }

                $(window).resize(function () {repos(); });
                $(window).on('load', function () {repos(); });
                repos();
            });
        }());



        /*
         * make the media previews work
         * =======================================================================
         */
        (function () {
            var $mediaview, $btnOff, $btnPrev, $btnNext, $ctnt, initTop,
                $medialink, $embedlink,
                medias = [], showNdx = 0, player = null;
            function showView() {
                $mediaview.animate({"top": 0}, 500);
            }
            function pauseCurrentMedia() {
                if (player !== null) {
                    player.pause();
                }
            }
            function hideView() {
                pauseCurrentMedia();
                $mediaview.animate({"top": initTop}, 500);
            }
            $mediaview = $('#media-player');
            $ctnt = $('[role="content"]', $mediaview);
            $btnOff = $('.btn[role="close"]', $mediaview);
            $btnPrev = $('.btn[role="vctrl-prev"]', $mediaview);
            $btnNext = $('.btn[role="vctrl-next"]', $mediaview);
            initTop = $mediaview.css('top');
            $btnOff.click(hideView);

            // links in media section at bottom
            $medialink = $('a[role="medialink"]');
            // links embedded in text: filter those that have href first char #
            $embedlink = $('a', $('.media-content'))
                .filter(function () {return ($(this).attr('href').charAt(0) === '#'); });

            function media2html(media) {
                var $tmpl = $('#' + media.id);
                return $tmpl.html();
            }


            // map the media objects
            medias[0] = {html: $content.html()};
            $medialink.each(function () {
                var $ml = $(this),
                    href = $ml.attr('href'),
                    anchor = href.slice(1),
                    index = Number(anchor.split('-')[1]),
                    hash = href.charAt(0),
                    media = $ml.data('media');
                media.id = anchor;
                media.icon = $ml.data('icon');
                if (hash === '#') {
                    media.html = media2html(media);
                    medias[index] = media;
                }
            });

            // decorate with svg icon
            $embedlink.each(function () {
                var $el = $(this),
                    href = $el.attr('href'),
                    anchor = href.slice(1),
                    index = Number(anchor.split('-')[1]),
                    iconlink = medias[index].icon;

                $(this).append("<img class='img-font' src='" + iconlink + "'>");
            });

            function showIndex(ndx) {
                var mediaToShow;
                showNdx = ndx;
                mediaToShow = medias[showNdx];
                $ctnt.html(mediaToShow.html);
                if (mediaToShow.type === 'video') {
                    player = $("video", $ctnt).get(0);
                } else if (mediaToShow.type === 'audio') {
                    player = $("audio", $ctnt).get(0);
                } else {
                    player = null;
                }
                showView();
                return false;
            }

            // call show link when link is present
            function showMedia($ml) {
                var anchor = $ml.attr('href').slice(1),
                    index = Number(anchor.split('-')[1]);
                return showIndex(index);
            }

            $medialink.click(function () { return showMedia($(this)); });
            $embedlink.click(function () { return showMedia($(this)); });

            //make the ctrl buttons work
            function showOffset(offset) {
                pauseCurrentMedia();
                showIndex(Math.max(Math.min(showNdx + offset, medias.length), 1));
            }
            $btnPrev.click(function () { showOffset(-1); });
            $btnNext.click(function () { showOffset(+1); });

        }());



        /*
         * adjust the jub-calendar display - focus on next - calculate days
         * =======================================================================
         */
        (function () {
            var $jubcal, $calitems, firstOn = false, now = moment();
            $jubcal = $("#jub-cal");

            if ($jubcal.length < 1) { return; }
            //else
            $calitems = $('[role="item"]', $jubcal);
            $calitems.hide();
            $calitems.each(function () {
                var $this = $(this),
                    it = $this.data("item"),
                    date = moment(it.date),
                    diff = date.diff(now, 'days'),
                    difftext,
                    $cnt = $('[role="countdown"]', $this);
                if (diff === 0) {
                    difftext = TRANSL.dict.today;
                } else if (diff < 0) {
                    difftext = TRANSL.dict.ago.replace("%", diff);
                } else {
                    difftext = TRANSL.dict.still.replace("%", diff);
                }
                $cnt.html(difftext);
                if (!firstOn && diff > 0) {
                    $this.show();
                    firstOn = true;
                }
            });
        }());
    });
    
    /*
     * Build up the group page 'history-timeline'
     * =======================================================================
     */
    $(function () {
        var $groupList = $('#vd-group-kalender'),
            $items = $('.vd-group-kalender-item', $groupList),
            $grid,
            now = moment(),
            $tl = $("<div class='timeline'>");

        $tl.append($("<div class='timeline-line'>"));

        // hide items that have passed
        $items.each(function () {
            var $this = $(this),
                it = $this.data('item'),
                date = moment(it.date),
                diff = date.diff(now, "days");
            if (diff < 0) {
                $this.remove();
            }
        });
        $items = $('.vd-group-kalender-item', $groupList);
        
        function allNonSpacerItems(fn) {
            $items.each(function () {
                var $it = $(this);
                if ($it.hasClass('vd-group-item-spacer')) {
                    return;
                } //else
                return fn($it, $it.data('tl-dot'));
            });
        }


        $groupList.prepend($tl);
        allNonSpacerItems(function ($it) {
            var $dot = $('<span class="timeline-dot"><span>&nbsp;</span></span>');
            $tl.append($dot);
            $it.data('tl-dot', $dot);
        });

        function startMasonry() {
            $grid = $groupList.isotope({ // apply the masonry (default) layout.
                // options
                itemSelector: '.vd-group-timeline-item',
                columnWidth: '.vd-group-timeline-item',
                percentPosition: true
            });


            function postlayout() { // full signature is postlayout(event, items)
                var tloff = $tl.offset();
                allNonSpacerItems(function ($it, $dot) {
                    var itpos = $it.position(), itoff = $it.offset(), dh = Number($dot.css("height").replace(/\D/g, "")) || 0;
                    $it.removeClass('timeline-left').removeClass('timeline-right');
                    // note the extra -1 is required because the timeline is
                    // sometimes positione at fraction through 50%
                    if (itoff.left < (tloff.left - 1)) {
                        $it.addClass('timeline-left');
                    } else {
                        $it.addClass('timeline-right');
                    }
                    $dot.css("top", (itpos.top + dh) + "px");
                });
            }

            $grid.on('layoutComplete', postlayout);
            postlayout();
        }
        $(window).on("load", function () {
            setTimeout(startMasonry, 0);
        });
        
    });

}(window.jQuery));
