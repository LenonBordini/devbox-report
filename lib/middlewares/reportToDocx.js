const path = require('path'),
    fs = require('fs'),
    vash = require('vash'),
    utils = require('../common/util'),
    { performance } = require('perf_hooks');

module.exports = (jsreport, config) => {
    let css = Array.isArray(config.css) ? config.css : [];
    let js = Array.isArray(config.js) ? config.js : [];

    return (req, res, next) => {
        res.docx = async (origin, options) => {
            options.fileName = path.join(origin, options.fileName || config.default.fileName);
            options.file = fs.readFileSync(options.fileName, 'utf8');
            options.css = css.concat(Array.isArray(options.css) ? options.css : []).map(x => `<link href="${x}" rel="stylesheet">`).join('');
            options.js = js.concat(Array.isArray(options.js) ? options.js : []).map(x => `<script src="${x}"></script>`).join('');

            options.data = options.data || {};
            utils.applyCommonVars(options.data);

            let docx = await createReport(jsreport, options);

            if (!options.title)
                options.title = 'report';

            res.setHeader('Content-Disposition', `attachment;filename=${options.title}.docx`);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.write(docx.content);
            res.status(200).end();
        };

        if (next)
            next();
    };
};

async function createReport(jsreport, options) {
    utils.log("Creating report...");
    let reportStart = performance.now();

    let xlsx = await jsreport.render({
        template: {
            content: body(options),
            engine: 'none',
            recipe: 'html-embedded-in-docx'
        }
    });

    utils.log(`Report "${options.title}" ready! Time: ${((performance.now() - reportStart) / 1000).toFixed(2)} seconds.`);
    return xlsx;
}

function body(options) {
    let content = vash.compile(options.file)(options.data).replace(/\$break/g, '<div style="page-break-before: always;"></div>');
    return utils.readPeaceReport('body', options.css, options.js, content, process.platform === 'linux'
        ? 'style="transform-origin: 0 0; -webkit-transform-origin: 0 0; transform: scale(0.654545); -webkit-transform: scale(0.654545);"'
        : '');
}
