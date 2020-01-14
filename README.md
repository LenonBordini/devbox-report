# devbox-report

Framework para geração de relatórios utilizando:

1. [jsReport](https://jsreport.net/) + [wkhtmltopdf](https://wkhtmltopdf.org/)
2. [vash](https://www.npmjs.com/package/vash) como compilador
3. Um [mini-framework](https://github.com/LenonBordini/devbox-report/blob/master/lib/css/style.css) css para dar agilidade (opcional)

> Para o título dos relatórios funcionar, você deve instalar no seu ambiente o [wkhtmltopdf.exe](https://github.com/LenonBordini/devbox-report/blob/master/lib/wkhtmltopdf/wkhtmltopdf.exe)

## Instalação

```bash
npm i devbox-report --save
```

## Uso + Documentação

Todos os arquivos HTML não precisam de corpo (html, head e body), o pacote já envolve eles em um.

### app.js

```js
const devboxReport = require('devbox-report');

let config = {
    css: ['http://example.com.br/style.css', '...'],
    js: ['http://example.com.br/script.js', '...'],

    default: {
        title: 'Report',
        orientation: 'portrait', // landscape
        fileName: 'report.html',

        header: path.join('...'),
        footer: path.join('...')
    }
};

let report = devboxReport(config);

// Middleware (Ex: express)
app.use(report.pdf);
app.use(report.xlsx);
```

### controller.js

```js
module.exports = async function(req, res, next) {
    // Stuff...

    // Html to PDF
    return res.pdf(__dirname, {
        title: 'Title',
        orientation: 'landscape',
        fileName: 'graphReport.html',
        css: ['.../myFramework.css'],
        js: ['.../chart.js'],

        data: {}, // data using vash

        header: false,
        footer: false,

        // Wait for Js (window.status = 'flag')
        windowStatus: 'flag'
    });

    // Html to XLSX
    return res.xlsx(__dirname, {
        title: 'Title',
        data: {} // data using vash
    });
};
```
