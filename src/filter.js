'use strict';

var fs = require('fs');
var cheerio = require('cheerio');
var sprintf = require("sprintf-js").sprintf;
var stream = require('stream');
var util = require('util');
var Readable = require('stream').Readable;
var Writable = require('stream').Writable;
//load default rules
var defaultRules = require("../config/default.json");
var condition = require('./condition');

/**
 * Creates a new Filter object.
 * @class Parser
 * @constructor
 * @param {Configuration|string} config A valid configuration options object or configuration as a JSON string.
 * @param {string} [output=console] Type of output. Supported output types are console, file & stream. For file type, result.txt will be created after successful execution.
 * @returns {Parser}
 * @since 0.0.1
 * @example
 *
 * var Parser = require('parser');
 *
 * var parser = new Parser({}, "console");
 *
 * parser.parseFile("home.html");
 * 
 *
 */
function Filter(output, config = {}) {

    if (typeof config === "string")
        config = JSON.parse(config);

    let defaultSettings = JSON.parse(JSON.stringify(defaultRules));

    var self = this;

    this.settings = Object.keys(config).length !== 0 ? config : defaultSettings;
    this.settings.output = (output == undefined || output == null ? "console" : output);

    if (this.settings.output == "stream") {
        this._outputReadStream; //stream on which result will be written, outputWriteStream will pipe the data
        this._outputWriteStream = this._createWritableStream();

        /**
        @property {Object} outputWriteStream Writable node stream on which output will be written.
        @readonly
        **/
        Object.defineProperty(this, 'outputWriteStream', {
            get: function() { 
                return self._outputWriteStream;
            }
        });
    }
}

Filter.prototype._createWritableStream = function() {
    this._outputReadStream = new Readable({
        objectMode: true,
        read() {}
    });

    var wStream = new Writable({
        objectMode: true,
        write: (data, _, done) => { //write on console by default, user need to override write
            console.log(data);
            done();
        }
    });

    this._outputReadStream.pipe(wStream);
    return wStream;
}

Filter.prototype._parseHTML = function(html) {
    var $ = cheerio.load(html, {
        normalizeWhitespace: true,
        xmlMode: true,
        lowerCaseTags: true,
        lowerCaseAttributeNames: true
    });
    return $;
}

/**
 * Parse HTML. 
 * @method parse
 * @public
 * @param {string} html - HTML content.
 * @memberof Parser.prototype
 * @since 0.0.1
 */
Filter.prototype.parse = function(html) {
    var self = this;
    var elements = this._parseHTML(html);
    let count = [];
    this.settings.filters.forEach(con => {
        if (con.isEnabled) {
            try {
                count.push(condition.parse(elements, con));
            }catch (err) {
                con.isEnabled = false;
            }
        }
    });

    this.results = count;
}

Filter.prototype.getSettings = function() {
    return this.settings;
}

Filter.prototype.setSettings = function(config) {
    if (typeof config === "string")
        config = JSON.parse(config);
    this.settings = config;
}

Filter.prototype.returnResult = function() {
    var self = this;

    var _fnOutputString = function() {
        var str = "";
        self.results.forEach(rule => {
            rule.forEach(ret => {
                if (ret.errorCount > 0) {
                    str += ret.errorMessage + '\n';
                }
            })
        });
        return str;
    }
    if (this.settings.output == "console") {
        console.log(_fnOutputString());
    } else if (this.settings.output == "text") { //for tests
        return _fnOutputString();
    } else if (this.settings.output == "stream") {
        this._outputReadStream.push(_fnOutputString());
    } else { //write file
        var fileName = this.settings.outputFile ? this.settings.outputFile : "result.txt";
        fs.writeFile(fileName, _fnOutputString(), function (err) {
            if (err) {
                return console.log(err);
            }
            console.log(sprintf("Parsed HTML and saved output in %s file", fileName));
        });
    }
}

/**
 * Parse HTML file. 
 * @method parseFile
 * @public
 * @param {string} file - Valid disk path of an HTML file.
 * @memberof Parser.prototype
 * @since 0.0.1
 */
Filter.prototype.parseFile = function(file) {
    var self = this;
    fs.readFile(file, function read(err, data) {
        if (err) {
            console.log("Invalid file path");
            return;
        }
        self.parse(data.toString().replace((/  |\r\n|\n|\r/gm),"")); //replace newlines and tabs
        self.returnResult();
    });
}

/**
 * Parse HTML from stream. 
 * @method parseStream
 * @public
 * @param {Object} stream - Valid node readable stream.
 * @memberof Parser.prototype
 * @since 0.0.1
 */
Filter.prototype.parseStream = function(stream) {
    if (typeof stream !== "object" && typeof stream.on !== "function") {
        return console.log("Invalid stream object");
    }
    var self = this;
    stream.on('data', function (buf) {
        self.parse(buf.toString().replace((/  |\r\n|\n|\r/gm),"")); //replace newlines and tabs
    });

    stream.on('end', function () {
        self.returnResult();
    });
}

module.exports = Filter;

