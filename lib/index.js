const reportToPdf = require('./middlewares/reportToPdf'),
    reportToXlsx = require('./middlewares/reportToXlsx');

module.exports = (config = {}) => {
    if (!config.default)
        config.default = {};

    config.default.title = config.default.title || 'Report';
    config.default.orientation = config.default.orientation = 'portrait';
    config.default.fileName = config.default.fileName || 'report.html';

    return {
        pdf: reportToPdf(config),
        xlsx: reportToXlsx(config)
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
