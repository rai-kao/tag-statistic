# Tag Statistic
## Node.js package to parse HTML and show rule defects

#### Installation

Install Tag Statistic globally using [npm](https://www.npmjs.com/): 

```bash
npm install -g tag-statistic
```

To install the latest version on npm locally and save it in your package's package.json file:

```bash
npm install --save-dev tag-statistic
```

#### Usage & Examples

```
var Filter = require('tag-statistic');

//simple HTML file parsing and printing defects on console
var filter = new Filter("console");
filter.parseFile("home.html");


//input stream and parse data by reading stream. Print results on console
var fs = require('fs');
var filter = new Filter("console");
var s = fs.createReadStream("home.html");
filter.parseStream(s);


//simple HTML file parsing and write result in output file
var filter = new Filter("file");
var settings = filter.getSettings();
settings.outputFile = "output.txt";
filter.setSettings(settings);
filter.parseFile("home.html");


//simple HTML file parsing and get result on write stream
var filter = new Filter("stream");
var wStream = filter.outputWriteStream;
wStream.write = function(data, _, done) {
    console.log(data);
    done();
}
filter.parseFile("home.html");


//Disable, Override, Define new rules and match conditions
var filter = new Filter("console");
var settings = filter.getSettings();
settings.filters[0].isEnabled = false; //disable default rule
settings.filters[3].rules[0].condition[0].args = 3; //Overwrite default rule
settings.filters[3].rules[0].error = "There are more than 3 <strong> tag in HTML";
settings.filters.push( //add custom rule
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
    });
filter.setSettings(settings); //apply new settings
filter.parseFile("home.html");


//Use your fully customized rules at first
var filter = new Filter("console",
    {
        "output": "console",
        "outputFile": "result.txt",
        "filters": [
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
            }
        ]
    });
filter.parseFile("home.html");
```

#### Development

Copy git repository and run:

```bash
npm install
```

This should setup development environment.

Once satisfied with code changes, update tests and run:

```bash
npm test
```

To update the documentation, edit jsDoc comments and run:

```bash
npm run-script doc
```

#### License

MIT


