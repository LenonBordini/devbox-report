const fs = require('fs'),
    path = require('path');

module.exports = {
    log,
    applyCommonVars,
    readPeaceReport
};

function log(text) {
    console.log(`[${new Date().toShortTimeString()}] DEVBOX-REPORT: ${text}`);
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

function readPeaceReport(file, css, js, content, bodyStyle = '') {
    return fs.readFileSync(path.join(__dirname, '../views', file + '.html'), 'utf8')
        .replace('$css', css)
        .replace('$js', js)
        .replace('$content', content)
        .replace('$bodyStyle', bodyStyle);
}
