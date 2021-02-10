const path = require('path'),
    fs = require('fs'),
    vash = require('vash'),
    utils = require('../common/util'),
    { performance } = require('perf_hooks');

module.exports = (jsreport, config) => {
    let css = Array.isArray(config.css) ? config.css : [];
    let js = Array.isArray(config.js) ? config.js : [];

    return (req, res, next) => {
        res.pdf = async (origin, options) => {
            options.checkOs = options.checkOs || config.checkOs;
            options.title = options.title || config.default.title;
            options.orientation = options.orientation || config.default.orientation;
            options.fileName = path.join(origin, options.fileName || config.default.fileName);
            options.header = typeof options.header == 'boolean' ? options.header : (options.header || config.default.header);
            options.footer = typeof options.footer == 'boolean' ? options.footer : (options.footer || config.default.footer);
            options.css = css.concat(Array.isArray(options.css) ? options.css : []).map(x => `<link href="${x}" rel="stylesheet">`).join('');
            options.js = js.concat(Array.isArray(options.js) ? options.js : []).map(x => `<script src="${x}"></script>`).join('');
            options.file = fs.readFileSync(options.fileName, 'utf8');
            if (options.header)
                options.header = fs.readFileSync(options.header, 'utf8');
            if (options.footer)
                options.footer = fs.readFileSync(options.footer, 'utf8');

            options.data = options.data || {};
            utils.applyCommonVars(options.data);

            let pdf = await createReport(jsreport, options);

            res.setHeader('Content-Type', 'application/pdf');
            res.write(pdf.content);
            res.status(200).end();
        };

        if (next)
            next();
    };
};

async function createReport(jsreport, options) {
    utils.log("Creating report...");
    let reportStart = performance.now();

    let pdf = await jsreport.render({
        template: {
            content: body(options),
            engine: 'none',
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

                windowStatus: options.windowStatus,

                loadErrorHandling: 'ignore'
            }
        }
    });

    utils.log(`Report "${options.title}" ready! Time: ${((performance.now() - reportStart) / 1000).toFixed(2)} seconds.`);
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

    const fixSizeLinux = typeof(options.checkOs) === 'undefined' || options.checkOs
        ? 'style="transform-origin: 0 0; -webkit-transform-origin: 0 0; transform: scale(0.654545); -webkit-transform: scale(0.654545);"'
        : '';
        
    return `<!DOCTYPE html><html>
        <head>
            <title>Report</title>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
            ${options.css}
            ${options.js}
        </head>
        <body ${process.platform === 'linux' ? fixSizeLinux : ''}>
            ${content}
        </body>
    </html>`;
}

function readPeaceReport(file, css, js, content, bodyStyle = '') {
    return fs.readFileSync(path.join(__dirname, '../views', file + '.html'), 'utf8')
        .replace(/\$css/g, css)
        .replace(/\$js/g, js)
        .replace(/\$content/g, content)
        .replace(/\$bodyStyle/g, bodyStyle);
}
