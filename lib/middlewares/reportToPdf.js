const path = require('path'),
    fs = require('fs'),
    vash = require('vash'),
    report = require('jsreport-core')({ tasks: { strategy: 'in-process', timeout: 6000000 } }),
    { performance } = require('perf_hooks');

report.use(require('jsreport-jsrender')());
report.use(require('jsreport-wkhtmltopdf')());

function log(text) { console.log(`[${new Date().toShortTimeString()}] DEVBOX-REPORT: ${text}`); }

module.exports = (config) => {
    let css = Array.isArray(config.css) ? config.css : [];
    let js = Array.isArray(config.js) ? config.js : [];

    return (req, res, next) => {
        res.pdf = async (origin, options) => {
            options.title = options.title || config.default.title;
            options.orientation = options.orientation || config.default.orientation;
            options.fileName = path.join(origin, options.fileName || config.default.fileName);
            options.header = typeof options.header == "boolean" ? options.header : (options.header || config.default.header);
            options.footer = typeof options.footer == "boolean" ? options.footer : (options.footer || config.default.footer);
            options.css = css.concat(Array.isArray(options.css) ? options.css : []).map(x => `<link href="${x}" rel="stylesheet">`).join('');
            options.js = js.concat(Array.isArray(options.js) ? options.js : []).map(x => `<script src="${x}"></script>`).join('');
            options.file = fs.readFileSync(options.fileName, 'utf8');
            if (options.header)
                options.header = fs.readFileSync(options.header, 'utf8');
            if (options.footer)
                options.footer = fs.readFileSync(options.footer, 'utf8');

            options.data = options.data || {};
            applyCommonVars(options.data);

            let pdf = await jsReport(options);

            res.setHeader('Content-Type', 'application/pdf');
            res.write(pdf.content);
            res.status(200).end();
        };

        if (next)
            next();
    };
};

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

function readPeaceReport(file, css, js, content, bodyClass = '') {
    return fs.readFileSync(path.join(__dirname, '../views', file + '.html'), 'utf8')
        .replace('$css', css)
        .replace('$js', js)
        .replace('$content', content)
        .replace('$bodyClass', bodyClass);
}

function header_footer(options, type) {
    if (!type || !options[type])
        return '';

    let content = vash.compile(options[type])(options.data);
    return readPeaceReport(type, options.css, options.js, content);
}

function body(options) {
    let content = vash.compile(options.file)(options.data).replace(/\$break/g, '<div class="break"></div>');
    return readPeaceReport('body', options.css, options.js, content, options.header ? 'has-header' : '');
}

async function jsReport(options) {
    log("Creating report...");
    let reportStart = performance.now();

    await report.init();
    let pdf = await report.render({
        template: {
            content: body(options),
            wkhtmltopdf: {
                title: options.title,
                orientation: options.orientation,

                header: header_footer(options, 'header'),
                headerHeight: options.headerHeight,

                footer: header_footer(options, 'footer'),
                footerHeight: options.footerHeight,

                marginTop: options.header ? options.marginTop || 10 : 5,
                marginBottom: options.footer ? options.marginBottom || 10 : 5,
                marginLeft: 5,
                marginRight: 5,

                windowStatus: options.windowStatus
            },
            engine: 'jsrender',
            recipe: 'wkhtmltopdf',
        }
    });

    log(`Report "${options.title}" ready! Time: ${((performance.now() - reportStart) / 1000).toFixed(2)} seconds.`);
    return pdf;
}
