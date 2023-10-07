const express = require('express')
const app = express()
const url = require('url')
const port = 3000
const ejs = require('ejs')
const fs = require('fs').promises
const { log } = require('console')
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
    let id_nom = []
    try {
        let dadesArxiu = await fs.readFile("./private/productes.json", { encoding: 'utf8' })
        let dades = JSON.parse(dadesArxiu)
        if (dades.length === 0) {
            res.send('No products')
            
        }
        let infoProd = dades.find(prod => prod.nom)
        if (infoProd) {
            nom = dades.map(prod => { return prod.nom })
            id = dades.map(prod => { return prod.id })
            res.render('sites/list', { llistaId: id, llistaNom: nom })
        } 
    }
    catch (error) {
        console.error(error)
        res.send('Error al llegir el fitxer JSON')
    }
}

app.get('/edit', getEdit)
async function getEdit(req, res) {
    let query = url.parse(req.url, true).query;
    try {
        let dadesArxiu = await fs.readFile("./private/productes.json", { encoding: 'utf8' })
        let dades = JSON.parse(dadesArxiu)
        let infoProd = dades.find(prod => (prod.id == query.id))
        if (infoProd) {
            res.render('sites/products_edit', { infoProd: infoProd })
        }
        else {
            res.send('Paràmetres incorrectes')
        }
    } catch (error) {
        console.log(error)
        res.send('Incorrecto')
    }
}


app.get('/add', getAdd)
async function getAdd(req, res) {
    res.send('Add product')
}

app.get('/delete', getDelete)
async function getDelete(req, res) {
    let query = url.parse(req.url, true).query;
    try {
        
        let dadesArxiu = await fs.readFile("./private/productes.json", { encoding: 'utf8' })
        let dades = JSON.parse(dadesArxiu)
        let infoProd = dades.find(prod => (prod.id == query.id))
        if (infoProd) {
            res.render('sites/products_delete', { infoProd: infoProd })
        }
        else {
            res.send('Paràmetres incorrectes')
        }
    } catch (error) {
        console.log(error)
        res.send('Incorrecto')
    }
}

app.get ('/actionDelete', getActionDelete)
async function getActionDelete(req,res) {
    let arxiu = "./private/productes.json"
    let query = url.parse(req.url, true).query;
    try {
        let dadesArxiu = await fs.readFile(arxiu, { encoding: 'utf8' })
        let dades = JSON.parse(dadesArxiu)
        const dadesFiltrades = dades.filter((item) => item.id !== parseInt(query.id))
        console.log(query)
        const updateFile = JSON.stringify(dadesFiltrades)
        await fs.writeFile(arxiu, updateFile)
        res.redirect('/')
    } catch (error) {
        console.error(error)
        res.send('Error al eliminar el producte')
    }
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

