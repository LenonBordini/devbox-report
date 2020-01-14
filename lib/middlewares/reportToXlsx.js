const path = require('path'),
    fs = require('fs'),
    vash = require('vash'),
    { performance } = require('perf_hooks');

module.exports = (jsreport, config) => {
    let css = Array.isArray(config.css) ? config.css : [];
    let js = Array.isArray(config.js) ? config.js : [];

    return (req, res, next) => {
        res.xlsx = async (origin, options) => {
            options.fileName = path.join(origin, options.fileName || config.default.fileName);
            options.file = fs.readFileSync(options.fileName, 'utf8');
            options.css = css.concat(Array.isArray(options.css) ? options.css : []).map(x => `<link href="${x}" rel="stylesheet">`).join('');
            options.js = js.concat(Array.isArray(options.js) ? options.js : []).map(x => `<script src="${x}"></script>`).join('');

            options.data = options.data || {};
            applyCommonVars(options.data);

            let xlsx = await createReport(jsreport, options);

            if (options.title)
                res.setHeader('Content-Disposition', `attachment;filename=${options.title}.xlsx`);
            
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.write(xlsx.content);
            res.status(200).end();
        };

        if (next)
            next();
    };
};

async function createReport(jsreport, options) {
    log("Creating report...");
    let reportStart = performance.now();

    let xlsx = await jsreport.render({
        template: {
            content: options.css + options.js + vash.compile(options.file)(options.data),
            engine: 'none',
            recipe: 'html-to-xlsx',
            htmlToXlsx: {
                waitForJS: options.waitForJS || false
            }
        }
    });

    log(`Report "${options.title}" ready! Time: ${((performance.now() - reportStart) / 1000).toFixed(2)} seconds.`);
    return xlsx;
}

function applyCommonVars(obj) {
    let padLeft = (str) => {
        str = str.toString();
        while (str.length < 2)
            str = '0' + str;
        return str;
    };

    let now = new Date();
    obj._date = padLeft(now.getDate()) + "/" + padLeft(now.getMonth() + 1) + "/" + now.getFullYear().toString().substr(2);
    obj._dateFullYear = padLeft(now.getDate()) + "/" + padLeft(now.getMonth() + 1) + "/" + now.getFullYear().toString();
    obj._time = padLeft(now.getHours()) + ":" + padLeft(now.getMinutes()) + ":" + padLeft(now.getSeconds());
    obj._dateTime = obj._date + " " + obj._time;
    obj._dateTimeFullYear = obj._dateFullYear + " " + obj._time;
}

function log(text) { console.log(`[${new Date().toShortTimeString()}] DEVBOX-REPORT: ${text}`); }
