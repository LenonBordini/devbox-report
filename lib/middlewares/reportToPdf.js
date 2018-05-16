const path = require('path'),
    fs = require('fs'),
    vash = require('vash'),
    { performance } = require('perf_hooks'),
    jsreport = require('jsreport-core')({
        tasks: { strategy: 'in-process' },
        extensions: {
            wkhtmltopdf: {
                zoom: process.platform === 'linux' ? 0.78125 : 1
            }
        }
    });

jsreport.use(require('jsreport-jsrender')());
jsreport.use(require('jsreport-wkhtmltopdf')());

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

async function jsReport(options) {
    log("Creating report...");
    let reportStart = performance.now();

    await jsreport.init();
    let pdf = await jsreport.render({
        template: {
            content: body(options),
            engine: 'jsrender',
            recipe: 'wkhtmltopdf',
            wkhtmltopdf: {
                title: options.title,
                orientation: options.orientation,

                header: header_footer(options, 'header'),
                headerHeight: options.headerHeight,

                footer: header_footer(options, 'footer'),
                footerHeight: options.footerHeight,

                marginTop: options.marginTop || 5,
                marginBottom: options.marginBottom || 5,
                marginLeft: options.marginLeft || 5,
                marginRight: options.marginRight || 5,

                windowStatus: options.windowStatus
            }
        }
    });

    log(`Report "${options.title}" ready! Time: ${((performance.now() - reportStart) / 1000).toFixed(2)} seconds.`);
    return pdf;
}

function header_footer(options, type) {
    if (!type || !options[type])
        return '';

    let content = vash.compile(options[type])(options.data);
    return readPeaceReport(type, options.css, options.js, content);
}

function body(options) {
    let content = vash.compile(options.file)(options.data).replace(/\$break/g, '<div style="page-break-before: always;"></div>');
    return readPeaceReport('body', options.css, options.js, content, process.platform === 'linux'
        ? 'style="transform-origin: 0 0; -webkit-transform-origin: 0 0; transform: scale(0.654545); -webkit-transform: scale(0.654545);"'
        : '');
}

function readPeaceReport(file, css, js, content, bodyStyle = '') {
    return fs.readFileSync(path.join(__dirname, '../views', file + '.html'), 'utf8')
        .replace('$css', css)
        .replace('$js', js)
        .replace('$content', content)
        .replace('$bodyStyle', bodyStyle);
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
