/**
 * Created by jamesonnyeholt2 on 9/4/14.
 */

'use strict';

angular.module('pdxStreetcarApp')

    .directive('psFullHeightLeftCol', ['$parse', '$timeout',
        function () {
            return function (scope, element) {
                var resize;
                resize = function () {
                    var calculatedHeight,
                        windowHeight,
                        navHeader = 52,
                        search = 60,
                        tabs = 80;
                    windowHeight = $(window).height();
                    calculatedHeight = windowHeight - navHeader - search - tabs;
                    return element.css({
                        'min-height': calculatedHeight,
                        'max-height': calculatedHeight,
                        'height': calculatedHeight
                    });
                };
                resize();
                $(window).bind('DOMMouseScroll', function () {
                    return resize();
                });
                return $(window).resize(function () {
                    return resize();
                });
            };
        }
    ])

    .directive('psFullHeightRightCol', ['$parse', '$timeout',
        function () {
            return function (scope, element) {
                var resize;
                resize = function () {
                    var calculatedHeight,
                        windowHeight,
                        navHeader = 52,
                        offset = 20;
                    windowHeight = $(window).height();
                    calculatedHeight = windowHeight - navHeader - offset;
                    return element.css({
                        'min-height': calculatedHeight,
                        'max-height': calculatedHeight,
                        'height': calculatedHeight
                    });
                };
                resize();
                $(window).bind('DOMMouseScroll', function () {
                    return resize();
                });
                return $(window).resize(function () {
                    return resize();
                });
            };
        }
    ]);
