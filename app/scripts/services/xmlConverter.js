'use strict';
angular.module('pdxStreetcarApp')
    .factory('xmlConverter', function () {
        // Service logic
        // ...
        var meaningOfLife = 42;

        function xmlToJson(xml) {

            // Create the return object
            var obj = {};
            if (xml.nodeType == 1) { // element
                // do attributes
                if (xml.attributes.length > 0) {
                    obj["@attributes"] = {};
                    for (var j = 0; j < xml.attributes.length; j++) {
                        var attribute = xml.attributes.item(j);
                        obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
                    }
                }
            } else if (xml.nodeType == 3) { // text
                obj = xml.nodeValue;
            }
            // do children
            if (xml.hasChildNodes()) {
                for (var i = 0; i < xml.childNodes.length; i++) {
                    var item = xml.childNodes.item(i);
                    var nodeName = item.nodeName;
                    if (typeof(obj[nodeName]) == "undefined") {
                        obj[nodeName] = xmlToJson(item);
                    } else {
                        if (typeof(obj[nodeName].push) == "undefined") {
                            var old = obj[nodeName];
                            obj[nodeName] = [];
                            obj[nodeName].push(old);
                        }
                        obj[nodeName].push(xmlToJson(item));
                    }
                }
            }
            return obj;
        }

        function stringToXmlDocument(string) {
            try {
                var xml = null;
                if (window.DOMParser) {
                    var parser = new DOMParser();
                    xml = parser.parseFromString(string, "text/xml");
                    var found = xml.getElementsByTagName("parsererror");
                    if (!found || !found.length || !found[ 0 ].childNodes.length) {
                        return xml;
                    }
                    return null;
                } else {
                    xml = new ActiveXObject("Microsoft.XMLDOM");
                    xml.async = false;
                    xml.loadXML(string);
                    return xml;
                }
            } catch (e) {
                // suppress
            }
        }

        // Public API here
        return {
            someMethod: function () {
                return meaningOfLife;
            },
            convertXmlToJson: function (xml) {
                return xmlToJson(xml)
            },
            convertStringToXml: function (string) {
                return stringToXmlDocument(string);
            }
        };
    });
