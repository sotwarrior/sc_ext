'use strict';
namespace SitecoreExtensions {
    export class HTMLHelpers {
        static createElement<T>(tagName, attributes?, dataset?): T {
            var element = document.createElement(tagName);
            for (var attr in attributes) {
                if (attributes.hasOwnProperty(attr)) {
                    element.setAttribute(attr, attributes[attr]);
                }
            }
            for (var d in dataset) {
                element.dataset[d] = dataset[d];
            }
            return <any> element;
        }

        static addProxy(operand, functionName, proxyFn) {
            if (typeof operand == "function") {
                return this.addProxyToFunction(operand, functionName, proxyFn);
            } else {
                return this.addProxyToObject(operand, functionName, proxyFn);
            }
        }

        private static addProxyToFunction(fn, functionName, proxyFn) {
            var proxied = fn.prototype[functionName];
            fn.prototype[functionName] = function () {
                var result = proxied.apply(this, arguments);
                proxyFn(arguments);
                return result;
            };
        }

        private static addProxyToObject(obj, functionName, proxyFn) {
            var proxied = obj[functionName];
            obj[functionName] = function () {
                var result = proxied.apply(this, arguments);
                proxyFn(arguments);
                return result;
            };
        }
    }
}

