const express = require('express')
const app = express()
const url = require('url')
const port = 3000
const ejs = require('ejs')
const fs = require('fs').promises
const { log } = require('console')
app.set('view engine', 'ejs')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

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

app.get('/add', getAdd)
async function getAdd(req, res) {
    let query = url.parse(req.url, true).query;
    try {
        let dadesArxiu = await fs.readFile("./private/productes.json", { encoding: 'utf8' })
        let dades = JSON.parse(dadesArxiu)
        res.render('sites/products_add')
    } catch (error) {
        console.log(error)
        res.send('Incorrecto')
    }

}

app.post('/actionAdd', upload.array('files'), actionAdd)
async function actionAdd(req, res) {
    let arxiu = "./private/productes.json"
    let postData = await getPostObject(req)
    try {
        // Llegir el fitxer JSON
        let dadesArxiu = await fs.readFile(arxiu, { encoding: 'utf8' })
        let dades = JSON.parse(dadesArxiu)
        let max = Math.max(...dades.map(dades => dades.id))
        console.log(max)

        // Guardem la imatge a la carpeta 'public' amb un nom únic
        if (postData.files && postData.files.length > 0) {
            let fileObj = postData.files[0];
            const uniqueID = uuidv4()
            const fileExtension = fileObj.name.split('.').pop()
            let filePath = `${uniqueID}.${fileExtension}`
            await fs.writeFile('./public/images/' + filePath, fileObj.content);
            // Guardem el nom de l'arxiu a la propietat 'imatge' de l'objecte
            postData.imatge = '/images/'+filePath;
            console.log(postData.files)
            // Eliminem el camp 'files' perquè no es guardi al JSON
            delete postData.files;
            postData.id = max + 1;
        }
        dades.push(postData) // Afegim el nou objecte (que ja té el nou nom d’imatge)
        let textDades = JSON.stringify(dades, null, 4) // Ho transformem a cadena de text (per guardar-ho en un arxiu)
        await fs.writeFile(arxiu, textDades, { encoding: 'utf8' }) // Guardem la informació a l’arxiu
        res.redirect('/')
    } catch (error) {
        console.error(error)
        res.send('Error al afegir les dades')
    }
}


async function getPostObject(req) {
    return new Promise(async (resolve, reject) => {
        let objPost = {};
        if (req.files.length > 0) {
            objPost.files = [];
        }
        req.files.forEach((file) => {
            objPost.files.push({ name: file.originalname, content: file.buffer });
        });
        for (let key in req.body) {
            let value = req.body[key];
            if (!isNaN(value)) {
                let valueInt = parseInt(value);
                let valueFlt = parseFloat(value);
                if (valueInt && valueFlt) {
                    if (valueInt == valueFlt) objPost[key] = valueInt;
                    else objPost[key] = valueFlt;
                }
            } else {
                objPost[key] = value;
            }
        }
        resolve(objPost);
    });
}

app.get("/edit", getItem);
async function getItem(req, res) {
    let arxiu = "./private/productes.json";
    let dadesArxiu = await fs.readFile(arxiu, { encoding: "utf8" });
    let dades = JSON.parse(dadesArxiu);
    let query = url.parse(req.url, true).query;
    // Buscar el producto por id
    let infoProd = dades.find((prod) => prod.id == query.id);
    if (infoProd) {
        // Retornar la página según el producto encontrado
        res.render("sites/products_edit", { id: query.id, infoProd });
    } else {
        res.send("Parámetros incorrectos");
    }
}

app.post('/actionEdit', upload.array('foto', 1), getActionEdit);
async function getActionEdit(req, res) {
    let arxiu = "./private/productes.json";
    let postData = await getPostObject(req);
    try {
        // Llegir el fitxer JSON
        let dadesArxiu = await fs.readFile(arxiu, { encoding: 'utf8' })
        let dades = JSON.parse(dadesArxiu)

        
        // Guardem la imatge a la carpeta 'public' amb un nom únic
        if (postData.files && postData.files.length > 0) {
            let fileObj = postData.files[0];
            const uniqueID = uuidv4()
            const fileExtension = fileObj.name.split('.').pop()
            let filePath = `${uniqueID}.${fileExtension}`
            await fs.writeFile('./public/images/' + filePath, fileObj.content);
            // Guardem el nom de l'arxiu a la propietat 'imatge' de l'objecte
            postData.imatge = '/images/'+filePath;
            // Eliminem el camp 'files' perquè no es guardi al JSON
            delete postData.files;
        }
        
        console.log(postData)
        for (let i = 0; i < dades.length; i++) {
            if (dades[i].id == postData.id) {
                dades[i] = postData; 
            }
        }
        let textDades = JSON.stringify(dades, null, 4);
        await fs.writeFile(arxiu, textDades, { encoding: "utf8" }); 
        res.redirect("/");
    } catch (error) {
        console.error(error);
        res.send("Error al afegir les dades");
    }
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

app.get('/actionDelete', getActionDelete)
async function getActionDelete(req, res) {
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
