#! /usr/bin/env node

'use strict';
var fs = require('fs');

var argv = require('yargs')
            .usage('Usage: $0 --file [file path] OR $0 -stream [file path]')
            .example('$0 --file foo.html', 'Parse foo.html and show SEO errors')
            .option('file', {
                alias: 'f',
                describe: 'A valid HTML file path'
            })
            .option('stream', {
                alias: 's',
                describe: 'A valid HTML file path to stream content'
            })
            .option('config', {
                alias: 'c',
                describe: 'Rule config',
                default: '{}'
            })
            .option('out', {
                alias: 'o',
                describe: 'Program output. --out file OR --out console OR --out stream',
                choices: ['console', 'file', 'stream'],
                default: 'console'
            })
            .alias('h', 'help')
            .help('h').argv;
var Filter = require('./src/filter');
var filter = new Filter(argv.out, argv.config);

if (argv.stream) {
    var s = fs.createReadStream(argv.stream);
    filter.parseStream(s);
} else if (argv.file) {
    filter.parseFile(argv.file);
} else {
    console.log("Usage: tag-statistic --file [file path] OR index.js --stream [file path]");
}