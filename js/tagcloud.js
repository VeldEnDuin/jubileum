/*jslint browser: true bitwise: true */
/*global d3 */
(function ($) {
    "use strict";

    /*
     * Build up the group page 'tagcloud'
     * =======================================================================
     */
    $(function () {
        function vd_kleur_fill(n) {
            var pallet = ["#B8BA8A", "#4F5137", "#8B9448", "#8FB742", "#569F98", "#e8B64F", "#cb2027"];
            return pallet[n % pallet.length];
        }

        var $w = $(window),
            interval = 15000,
            $groupList = $('#vd-group-troeven'),
            $container = $groupList.parent(),
            $items = $('.vd-group-tag-item', $groupList),
            troeven = [],
            num_angles = 4,
            fill = vd_kleur_fill,
            redoHandle;

        $groupList.hide(); // best to cover hiding by css, but for sure we hide here again

        $items.each(function () {
            troeven.push($(this).data('title'));
        });

        function regen() {

            if (redoHandle !== undefined) {
                clearTimeout(redoHandle);
                redoHandle = undefined;
            }
            $("svg.tagcloud").remove();

            var set,
                cw = Math.min(1600, $container.width() * 0.95),
                ch = Math.min(800, $w.height() - 250),
                fs = 60 * Math.sqrt(Math.max(cw, ch) / 1600);

            set = troeven.slice(0, Math.ceil((cw * ch / 5000)));

console.log("ch = " + ch + " | cw = " + " | fs = " + fs);
            function draw(words) {
                d3.select($container.get(0)).append("svg")
                    .attr("class", "tagcloud")
                    .attr("width", cw)
                    .attr("height", ch)
                    .append("g")
                    .attr("transform", "translate(" + (cw / 2) + "," + (ch / 2) + ")")
                    .selectAll("text")
                    .data(words)
                    .enter().append("text")
                    .style("font-size", function (d) { return d.size + "px"; })
                    .style("font-family", "Impact")
                    .style("fill", function (d, i) { return fill(i); })
                    .attr("text-anchor", "middle")
                    .attr("transform", function (d) {
                        return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                    })
                    .text(function (d) { return d.text; });

                //$("svg.tagcloud")[0].scrollIntoView(true);
            }

            d3.layout.cloud().size([cw, ch])
                .words(set.map(function (d) {
                    return {text: d, size: fs * (0.3 + Math.random() * 0.7)};
                }))
                .rotate(function () { return Math.floor((Math.random() - 0.5) * num_angles) * (180 / num_angles); })
                .spiral("rectangular")
                .font("Impact")
                .fontSize(function (d) { return d.size; })
                .on("end", draw)
                .start();

            redoHandle = setTimeout(regen, interval);
        }

        $w.resize(regen).trigger("resize");
    });

}(window.jQuery));
