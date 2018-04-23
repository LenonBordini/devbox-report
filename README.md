# devbox-report

Framework para geração de relatórios utilizando:

1. [jsReport]() + [wkhtmltopdf]()
2. [vash]() como compilador
3. Um [mini-framework]() css para dar agilidade (opcional)

> Para o título dos relatórios funcionar, você deve instalar no seu ambiente o [wkhtmltopdf.exe]()

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
    // Estilos para serem usados no report
    css: [ 'http://example.com.br/style.css', '...' ],

    // Scripts para serem usados no report (como Chart.js por exemplo)
    js: [ 'http://example.com.br/script.js', '...' ],

    default: {
        title: 'Título default dos reports', // default: 'Report'
        orientation: 'Orientação dos reports', // default: 'portrait' (portrait | landscape)
        fileName: 'Nome default do arquivo dos reports', // default: 'report.html'

        // default: undefined
        header: path.join('Caminho de um arquivo html para usar como header em todos os reports'),
        footer: path.join('Caminho de um arquivo html para usar como footer em todos os reports')
    }
};

devboxReport(config);

// Middleware (EX: express)
app.use(devboxReport.pdf);
```

### controller.js

```js
module.exports = async function (req, res, next) {
    await res.pdf(__dirname, { 
        data: {}, // model do report (usando vash dentro do report.html)

        // Opções para o report em questão (caso não informado, pega o default)
        title: 'Título',
        orientation: 'landscape',
        fileName: 'graphReport.html',
        css: [ '.../myFramework.css' ],
        js: [ '.../chart.js' ],

        header: false, // Exclui o header ou muda default passando outro path
        footer: false, // Exclui o footer ou muda default passando outro path

        // Possibilita a execução de javascript dentro do report até setar a flag lá dentro
        // window.status = 'flag';
        windowStatus: 'flag'
    });
};
```
