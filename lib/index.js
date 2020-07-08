const jsreport = require('jsreport-core')({ 
        tasks: { strategy: 'in-process' },
        templatingEngines: { timeout: 1000 * 60 * 60 }
    }),
    reportToPdf = require('./middlewares/reportToPdf'),
    reportToXlsx = require('./middlewares/reportToXlsx');

module.exports = async (config = {}) => {
    if (!config.default)
        config.default = {};

    config.default.title = config.default.title || 'Report';
    config.default.orientation = config.default.orientation = 'portrait';
    config.default.fileName = config.default.fileName || 'report.html';

    jsreport.use(require('jsreport-wkhtmltopdf')());
    jsreport.use(require('jsreport-html-to-xlsx')({
        timeout: config.timeout || 1000 * 60 * 60,
        chrome: {
            launchOptions: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--headless',
                    '--disable-gpu',
                    '--disable-dev-shm-usage'
                ]
            }
        }
    }));

    await jsreport.init();

    return {
        pdf: reportToPdf(jsreport, config),
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
app.use(report.xlsx);

*/
