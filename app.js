const express = require('express')
const app = express()
const url = require('url')
const port = 3000
const ejs = require('ejs')
const fs = require('fs/promises')
app.set('view engine', 'ejs')

// Configurar el motor de plantilles
app.set('view engine', 'ejs')

// Arxius carpeta 'public'
app.use(express.static('public'))

// Configurar direcció ‘/’ 
app.get('/', getProd)
async function getProd(req, res) {
  let query = url.parse(req.url, true).query;
  let id = []
  let nom = []
    try {
        let dadesArxiu = await fs.readFile("./private/productes.json", { encoding: 'utf8' })
        console.log(dadesArxiu)
        let dades = JSON.parse(dadesArxiu)
        console.log(dades)  
        let infoProd = dades.find(prod => prod.nom)
        if (infoProd) {
            nom = dades.map(prod => {return prod.nom})
            id = dades.map(prod => {return prod.id})
            res.render('sites/list', {llista: id})
        }
    }
    catch (error) {
        console.error(error)
        res.send('Error al llegir el fitxer JSON')
    }
}

app.get('/edit',getEdit)
async function getEdit(req,res) {

}


app.get('/add', getAdd)
async function getAdd(req, res) {
    res.send('Add product')
}

// Activar el servidor
const httpServer = app.listen(port, appListen)
function appListen() {
    console.log(`Example app listening on: http://localhost:${port}`)
}

// Aturar el servidor correctament
process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);
function shutDown() {
    console.log('Received kill signal, shutting down gracefully');
    httpServer.close()
    process.exit(0);
}

