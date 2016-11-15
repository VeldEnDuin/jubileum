/*
This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>
*/

/**************************************************************************
 * Name:   gcse
 * Copyright (c) 2015
 * Author: Marc Portier <marc.portier@gmail.com>
 **************************************************************************
 * Small thingy to retrieve google-search-results using a configured google cse (custom-search-engine)
 * Get and manage your own at: https://cse.google.com/cse/all
 * See API dox at: https://developers.google.com/custom-search/docs/xml_results?hl=nl&csw=1
 * and https://developers.google.com/custom-search/json-api/v1/using_rest
 */

/*jslint regexp: true */

(function ($) {
    "use strict";


    /*
     * handy common stuff
     * =======================================================================
     */
    function isEmpty(a) {
        return (a === null || a === undefined || (a.hasOwnProperty("length") && a.length === 0));
    }


    /*
     * jquery stuff I like to use
     * =======================================================================
     */
    function jqMerge(defs, vals) {
        return $.extend($.extend({}, defs), vals);
    }

    /*
     * URL handling stuff in both ways
     * =======================================================================
     */
    function qryParams() {
        var params, match, done = false,
            pl     = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
            query  = window.location.search.substring(1);

        params = {};
        while (!done) {
            match = search.exec(query);
            if (match) {
                params[decode(match[1])] = decode(match[2]);
            } else {
                done = true;
            }
        }
        return params;
    }

    function updateLocation(qry) {
        var uri = '', join = '?', state = {"q": qry.q, "start": qry.start};
        Object.keys(qry).forEach(function (name) {
            var val = qry[name];
            if (!isEmpty(val)) {
                uri += join + name + '=' + encodeURIComponent(val);
                join = '&';
            }
        });

        window.history.pushState(state, "Zoeken '" + qry.q + "'", uri);
    }

    function getAPIUri(qry, cnf) {
        var lang = cnf.lang || "en", params = [], join = '?',
            uri = "https://www.googleapis.com/customsearch/v1";

        if (isEmpty(cnf.key) || isEmpty(cnf.cx)) {
            throw 'API-uri invalid without key or cx params';
        }

        params.push({"name": "key",      "value": cnf.key});
        params.push({"name": "cx",       "value": cnf.cx});
        params.push({"name": "q",        "value": qry.q});
        params.push({"name": "hl",       "value": lang});
        params.push({"name": "lr",       "value": "lang_" + lang});
        params.push({"name": "start",    "value": qry.start || 1});

        params.forEach(function (p) {
            var name = p.name, val = p.value;
            if (!isEmpty(val)) {
                uri += join + name + '=' + encodeURIComponent(val);
                join = '&';
            }
        });
        uri += join + 'callback=?';

        return uri;
    }

    var NOBUILD = {};
    function getElmForRole($container, role, elm) {
        elm = elm || 'div';
        role = isEmpty(role) ? 'jq.gcse' : 'jq.gcse.' + role;
        if (isEmpty(role)) {return; }
        var select = '[role="' + role + '"]',
            $div = $(select, $container);

        if (isEmpty($div) && elm !== NOBUILD) { // build it and add it.
            $div = $('<' + elm + '></' + elm + '>').attr('role', role).addClass(role.replace(/\./g, '-'));
            $container.append($div);
        }
        return $div;
    }

    $(function () {
        var $gcse, conf, qry, $clonebox, $form, $input,
            $pager, $results, $template, striplink, stripRE,
            $info, $first, $last, $total, $time,
            msg, $msg;

        $gcse = getElmForRole($('body'), '', NOBUILD).eq(0); // only grab the first
        if (isEmpty($gcse)) { return; }

        qry = qryParams();
        conf = $gcse.data('gcse');
        msg = conf.msg;
        striplink = conf.striplink;
        if (!isEmpty(striplink)) {
            stripRE = new RegExp(striplink);
        }

        $msg = getElmForRole($gcse, 'msg');
        $msg.html('<div class="alert alert-info">' + msg.wait + '</div>');

        $pager = getElmForRole($gcse, 'pager');
        $info = getElmForRole($gcse, 'info', NOBUILD).hide();
        $time = getElmForRole($info, 'time', NOBUILD);
        $first = getElmForRole($info, 'first', 'span');
        $last = getElmForRole($info, 'last', 'span');
        $total = getElmForRole($info, 'total', 'span');
        $clonebox = getElmForRole($gcse, 'search.clone', NOBUILD);

        if (isEmpty($clonebox)) {
            $form = $('form[role="jq.gcse.form"]'); // don't clone it
        } else {
            $form = $('form[role="jq.gcse.form"]').clone().attr("role", "jq.gcse.form-clone");
            $clonebox.append($form);
        }
        $input = $("input[name=q]", $form);
        $input.val(qry.q);

        $results = getElmForRole($gcse, 'results');
        $template = getElmForRole($results, 'template').hide();

        function updateResults(n, isPop) {
            isPop = isPop || false;
            qry.start = n;
            qry.q = $input.val();

            if (!isPop) {
                updateLocation(qry);
            }

            // initialise
            $msg.html('');
            $results.html('');
            $pager.html('');
            $info.hide();


            if (isEmpty(qry.q)) {
                $msg.html('<div class="alert alert-primary">' + msg.use + '<div>');
            } else {
                $.getJSON(getAPIUri(qry, conf), function (response) {
                    var results = "", pager = "",
                        infoSet = response.searchInformation,
                        request = response.queries.request[0],
                        pageStart = 1, pageNum = 1, active, activeNum,
                        prevStart, nextStart, last, activeEnd, size = 10;

                    if (Number(infoSet.totalResults) === 0 || isEmpty(response.items)) {
                        $msg.html('<div class="alert alert-warning">' + msg.empty + " '" + qry.q + "'<div>");
                    } else {
                        /*--------------- pager --------------*/
                        last = request.totalResults;
                        active = request.startIndex;
                        activeNum = Math.floor(active / size) + 1;
                        prevStart = ((activeNum - 2) * size) + 1;
                        activeEnd = Math.min(last, active + size);
                        nextStart = (activeNum * size) + 1;

                        pager += '<nav><ul class="pagination">';
                        pager += '<li';
                        if (pageNum === activeNum) {
                            pager += ' class="disabled"';
                        }
                        pager += '><a data-start="' + prevStart + '" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a></li>';

                        while (pageStart < last) {
                            pager += '<li';
                            if (pageStart <= active && pageStart + size > active) {
                                pager += ' class="active"';
                            }
                            pager += '><a href="#" data-start="' + pageStart + '">' + pageNum + '</a></li>';

                            pageStart += size;
                            pageNum += 1;
                        }
                        pager += '<li';
                        pageStart -= size; // backup one page to calculate:
                        pageNum -= 1;
                        if (pageNum === activeNum) {
                            pager += ' class="disabled"';
                        }
                        pager += '><a data-start="' + nextStart + '" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a></li>';
                        pager += '</ul></nav>';

                        $pager.html(pager);
                        $('li', $pager).not('[class*="disabled"]').children('a').each(function () {
                            var $a = $(this);
                            $a.click(function () {
                                updateResults($a.data('start'));
                                return false;
                            });
                        });

                        /*--------------- info ---------------*/
                        $time.html(infoSet.formattedSearchTime);
                        $first.html(active);
                        $last.html(activeEnd);
                        $total.html(infoSet.formattedTotalResults);
                        $info.show();

                        /*--------------- items --------------*/
                        response.items.forEach(function (item) {
                            var $res, $title, $link, url, $snippet, $img, tmb;

                            $res = $template.clone();
                            $title = getElmForRole($res, 'title');
                            $link = getElmForRole($res, 'link');
                            $snippet = getElmForRole($res, 'snippet');
                            $img = getElmForRole($res, 'img', NOBUILD);

                            url = item.formattedUrl;
                            if (stripRE) {
                                url = url.replace(stripRE, '');
                            }

                            $title.html('<a href="' + item.link + '">' + item.htmlTitle + '</a>');
                            $link.html('<a href="' + item.link + '">' + url + '</a>');
                            $snippet.html(item.htmlSnippet);

                            if (isEmpty($img) || isEmpty(item.pagemap) || isEmpty(item.pagemap.cse_thumbnail)) {
                                $img.hide();
                            } else {
                                tmb = item.pagemap.cse_thumbnail[0];
                                $img.html('<img class="img-responsive img-rounded" src="' +
                                    tmb.src + '" height="' + tmb.height + '" width="' + tmb.width + '" >');
                            }

                            $results.append($res.show());
                        });
                    }
                });
            }
        }

        function refresh() {
            updateResults(1);
            return false;
        }
        $form.removeAttr('action').submit(refresh);
        $input.change(refresh);
        window.onpopstate = function (event) {
            var state = event.state;
            $input.val(state.q);
            updateResults(state.start, true);
        };

        refresh();
    });
}(window.jQuery));
