'use strict';

var htmlparser = require('htmlparser');
var sprintf = require("sprintf-js").sprintf;
var assume = require('./assume');
var chaiSubset = require('chai-subset');
assume.chaiUse(chaiSubset);
var defaultRules = require("../config/default.json");

var Condition = {
    findElements: function(elements, tag) {
        var ret = elements.html(elements(tag));

        var handler = new htmlparser.DefaultHandler(function (error, dom) {});
        var parser = new htmlparser.Parser(handler);
        parser.parseComplete(ret);
        return handler.dom;
    },
    parse: function(elements, condition) {
        var self = this;
        var result = [];

        condition.rules.forEach(con => {
            result.push(this.runCondition(elements, con));
        });

        return result;
    },
    runCondition: function(elements, condition) {
        let conditionResult = [];
        let totalErrorCount = 0;

        let targetTag = condition.parent ? condition.parent : condition.tag;

        let rootElements = this.findElements(elements, targetTag);
        if (condition.parent) {
            rootElements.forEach(targetElements => {
                let childElements = targetElements.children;
                totalErrorCount += this.runAssess(childElements, condition);
            })
        } else {
            totalErrorCount += this.runAssess(rootElements, condition);
        }

        return {
            errorCount: totalErrorCount,
            errorMessage: sprintf(condition.error, totalErrorCount)
        };
    },
    runAssess: function(elements, condition) {
        let errorCount = 0;
        let assessMode = condition.assessMode == "batch" ? "batch" : "single";
        if (assessMode == "single") {
            elements.forEach(element => {
                errorCount += this.runRule(element, condition.condition);
            });
        } else {
            errorCount += this.runRule(elements, condition.condition);
        }

        return errorCount;
    },
    runRule: function(elements, conditions) {

        let errorCount = 0;
        assume.overwriteNotify(function (_super) {
            return function (err, context) {
                errorCount++;
            };
        });

        var testElements = assume(elements);
        for (let condition of conditions) {
            var props = condition.method.split(".");
            for(var i=0; i<props.length; i++) {
                if (i == props.length-1) {
                    if (typeof testElements[props[i]] !== "function") {
                        throw "Invalid rule";
                    }
                    testElements = testElements[props[i]](condition.args);
                } else {
                    testElements = testElements[props[i]];
                }
            }
        }

        return errorCount;
    },
};

module.exports = Condition;