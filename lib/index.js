module.exports = async (config = {}) => {
    if (!config.default)
        config.default = {};

    config.default.title = config.default.title || 'Report';
    config.default.orientation = config.default.orientation = 'portrait';
    config.default.fileName = config.default.fileName || 'report.html';

    const timeout = config.timeout || 1000 * 60 * 60,
        strategy = 'in-process',
        jsreport = require('jsreport-core')({
            tasks: { strategy },
            templatingEngines: { strategy, timeout },
            extensions: {
                scripts: { timeout },
                "chrome-pdf": { timeout },
                express: { renderTimeout: timeout }
            },
            chrome: { timeout },
            wkhtmltopdf: { allowLocalFilesAccess: true }
        }),
        reportToPdf = require('./middlewares/reportToPdf'),
        reportToDocx = require('./middlewares/reportToDocx'),
        reportToXlsx = require('./middlewares/reportToXlsx');

    // HTML TO PDF
    jsreport.use(require('jsreport-wkhtmltopdf')({ allowLocalFilesAccess: true }));

    // HTML TO DOCX
    jsreport.use(require('jsreport-html-embedded-in-docx')());

    // HTML TO XLSX
    jsreport.use(require('jsreport-html-to-xlsx')({
        timeout,
        chrome: {
            launchOptions: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--headless',
                    '--disable-gpu',
                    '--disable-dev-shm-usage',
                    '--disable-setuid-sandbox'
                ]
            }
        }
    }));

    await jsreport.init();

    return {
        pdf: reportToPdf(jsreport, config),
        docx: reportToDocx(jsreport, config),
        xlsx: reportToXlsx(jsreport, config)
    };
};

/*

const report = require('devbox-report')({
    default: {
        title: '',
        orientation: 'portrait|landscape',
        fileName: '',
        header: '',
        footer: ''
    },
    css: ["", ""]
});

app.use(report.pdf);
app.use(report.docx);
app.use(report.xlsx);

*/
