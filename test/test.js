'use strict';
var expect = require('chai').expect;
var Filter = require('../src/filter');

describe('Validate default rules', function() {
    var filter = new Filter("text");

    it('<img /> should have alt attribute', function() {
        filter.parse("<img alt=''></img>");
        var result = filter.returnResult();
        expect(result).to.be.equal("");
    });

    it('<a /> should have rel attribute', function() {
        filter.parse("<a rel='' />");
        var result = filter.returnResult();
        expect(result).to.be.equal("");
    });

    it('<head> should have <title>, <meta name="description" /> & <meta name="keywords" /> tags', function() {
        filter.parse('<head><title>Dummy title</title><meta name="descriptions" content="Here is a precise description of my awesome webpage."><meta name="keywords" content="HTML,CSS,XML,JavaScript"></head>');
        var result = filter.returnResult();
        expect(result).to.be.equal("");
    });

    it('Detect there are less than 15 <strong> tags', function() {
        filter.parse("<strong>Strong text</strong><strong>Strong text</strong><strong>Strong text</strong>" +
                     "<strong>Strong text</strong><strong>Strong text</strong><strong>Strong text</strong>" +
                     "<strong>Strong text</strong><strong>Strong text</strong><strong>Strong text</strong>" +
                     "<strong>Strong text</strong><strong>Strong text</strong><strong>Strong text</strong>" +
                     "<strong>Strong text</strong><strong>Strong text</strong><strong>Strong text</strong>");
        var result = filter.returnResult();
        expect(result).that.is.not.empty;
    });

    it('Detect there are more than 1 <h1> tag', function() {
        filter.parse("<h1>Strong text</h1><h1>Strong text</h1>");
        var result = filter.returnResult();
        expect(result).that.is.not.empty;
    });
    
});

describe('Validate support of user defined rule', function() {
    var customFilter = new Filter("text");
    var settings = customFilter.getSettings();
    settings.filters = [
        {
            "isEnabled": true,
            "rules": [
                {
                    "parent": "head",
                    "tag": "meta",
                    "assessMode": "batch",
                    "condition": [
                        {
                            "method": "to.containSubset",
                            "args": [
                                {
                                    "name": "meta",
                                    "attribs": {
                                        "name": "robots"
                                    }
                                }
                            ]
                        }
                    ],
                    "error": "<head> without <meta name='robots'/> tag"
                },
            ]
        }];
    customFilter.setSettings(settings);

    it('<head> should have <meta name="robots" /> tag', function() {
        customFilter.parse('<head><meta name="robots"/></head>');
        var result1 = customFilter.returnResult();
        expect(result1).to.be.equal("");
    });
});

describe('Validate support of user defined combination rules', function() {
    var customFilter = new Filter("text");
    var settings = customFilter.getSettings();
    settings.filters = [
        {
            "isEnabled": true,
            "rules": [
                {
                    "tag": "a",
                    "assessMode": "single",
                    "condition": [
                        {
                            "method": "to.have.deep.property",
                            "args": "attribs.href"
                        },
                        {
                            "method": "that.is.not.match",
                            "args": /^#/
                        }
                    ],
                    "error": "There are %d <a> tag with # URLs"
                }
            ]
        }];
    customFilter.setSettings(settings);

    it('<a /> should not have "#" URLs', function() {
        customFilter.parse("<a href=\'#WHERE\' />");
        var result1 = customFilter.returnResult();
        expect(result1).that.is.not.empty;
    });
});

describe('Validate disabling default rule', function() {
    var customFilter = new Filter("text");
    var settings = customFilter.getSettings();
    settings.filters[2].isEnabled = false;
    customFilter.setSettings(settings);

    it('<meta> & <title> tag rule disabled', function() {
        customFilter.parse('<head><title>TEST</title><meta name="robots"/></head>');
        var result1 = customFilter.returnResult();
        expect(result1).to.be.equal("");
    });

});

describe('Validate overriding default rule', function() {
    var customFilter = new Filter("text");
    var settings = customFilter.getSettings();
    settings.filters[3].rules[0].condition[0].args = 2;
    customFilter.setSettings(settings);

    it('Detect there are more than 2 <strong> tags', function() {
        customFilter.parse("<strong>Strong text</strong><strong>Strong text</strong><strong>Strong text</strong>");
        var result = customFilter.returnResult();
        expect(result).that.is.not.empty;
    });
});