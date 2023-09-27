const express = require('express')
const ejs = require('ejs')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid')
const fs = require('fs/promises')
const url = require('url')
const app = express()
const port = 3000

//Per configurar imatges rebudas
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

// Configurar el motor de plantilles
app.set('view engine', 'ejs')

// Publicar arxius carpeta ‘public’ 
app.use(express.static('public'))


// Retornar una pàgina dinàmica de item
app.get('/item', getItem)
async function getItem (req, res) {
   let dades = {}
   res.render('sites/item', dades)
}


// Configurar direcció ‘/terradas’ 
app.get('/ieti', getIeti)
async function getIeti (req, res) {
 res.send(`IETI`)
}

// Configurar direcció ‘/llistat’ i paràmetres URL
app.get('/search', getSearch)
async function getSearch (req, res) {
  let query = url.parse(req.url, true).query;
  let noms = []
  if (query.country) {
    // 'llista' conté un array amb les naus del país
    llista = dades.filter(nau => (nau.pais == query.country))
    // 'noms' conté un array amb els noms de les naus anteriors
    noms = llista.map(nau => { return nau.nom })
    res.render('sites/search', { llista: noms })
  } else if (query.word) {
    // 'llista' conté els noms de les naus que la descripció conté la paraula
    llista = dades.filter(nau => ((nau.descripcio).toLowerCase().indexOf(query.word.toLocaleLowerCase()) != -1))
    // 'noms' conté un array amb els noms de les naus anteriors ‘
    noms = llista.map(nau => { return nau.nom })
    res.render('sites/search', { llista: noms })
  } else {
    // 'noms' conté un array amb els noms de totes les naus ‘
    noms = dades.map(nau => { return nau.nom })
    res.render('sites/search', { llista: noms })
  }
}


async function getSearch (req, res) {
  let query = url.parse(req.url, true).query;
  let noms = []
  try {
    // Llegir el fitxer JSON
    let dadesArxiu = await fs.readFile("./private/coets.json", { encoding: 'utf8'})
    let dades = JSON.parse(dadesArxiu)
    if (query.country) {
      // 'llista' conté un array amb les naus del país
      llista = dades.filter(nau => (nau.pais == query.country))
      // 'noms' conté un array amb els noms de les naus
      noms = llista.map(nau => { return nau.nom })
      res.render('sites/search', { llista: noms })
    } else if (query.word) {
      llista = dades.filter(nau => ((nau.descripcio).toLowerCase().indexOf(query.word.toLocaleLowerCase()) != -1))
      noms = llista.map(nau => { return nau.nom })
      res.render('sites/search', { llista: noms })
    } else {
      // 'noms' conté un array amb els noms de totes les naus ‘
      noms = dades.map(nau => { return nau.nom })
      res.render('sites/search', { llista: noms })
    }
  } catch (error) {
    console.error(error)
    res.send('Error al llegir el fitxer JSON')
  }
}
   

async function getItem (req, res) {
  let query = url.parse(req.url, true).query;
  try {
    // Llegir el fitxer JSON
    let dadesArxiu = await fs.readFile("./private/coets.json", { encoding: 'utf8'})
    console.log(dadesArxiu)
    let dades = JSON.parse(dadesArxiu)
    console.log(dades)
    // Buscar la nau per nom
    let infoNau = dades.find(nau => (nau.nom == query.nom))
    if (infoNau) {
      // Retornar la pàgina segons la nau trobada
      // Fa servir la plantilla 'sites/item.ejs'
      res.render('sites/item', { infoNau: infoNau })
    } else {
      res.send('Paràmetres incorrectes')
    }
  } catch (error) {
    console.error(error)
    res.send('Error al llegir el fitxer JSON')
  }
}
  

// Configurar direcció ‘/llistat’ i paràmetres URL 
app.get('/llistat', getLlistat)
async function getLlistat (req, res) {
 let query = url.parse(req.url, true).query;
  if (query.cerca && query.color) {
   res.send(`Aquí tens el llistat de ${query.cerca} de color ${query.color}`)
  } else {
   res.send('Paràmetres incorrectes')
  }
}

app.post('/add', upload.array('files'), actionAdd)
async function actionAdd (req, res) {
  let arxiu = "./private/productes.json"
  let postData = await getPostObject(req)
  try { 
    // Llegir el fitxer JSON
    let dadesArxiu = await fs.readFile(arxiu, { encoding: 'utf8'})
    let dades = JSON.parse(dadesArxiu)
    let max = Math.max(...dades.map(dades => dades.id))
    console.log(max)
 
    // Guardem la imatge a la carpeta 'public' amb un nom únic
    if (postData.files && postData.files.length > 0) {
      let fileObj = postData.files[0];
      const uniqueID = uuidv4()
      const fileExtension = fileObj.name.split('.').pop()
      let filePath = `${uniqueID}.${fileExtension}`
      await fs.writeFile('./public/'+filePath, fileObj.content);
      // Guardem el nom de l'arxiu a la propietat 'imatge' de l'objecte
      postData.imatge = filePath;
      console.log(postData.files)
      // Eliminem el camp 'files' perquè no es guardi al JSON
      delete postData.files;
      postData.id = max + 1;
      }
      dades.push(postData) // Afegim el nou objecte (que ja té el nou nom d’imatge)
      let textDades = JSON.stringify(dades, null, 4) // Ho transformem a cadena de text (per guardar-ho en un arxiu)
      await fs.writeFile(arxiu, textDades, { encoding: 'utf8'}) // Guardem la informació a l’arxiu
      res.send(`S'han afegit les dades ${textDades}`)
  } catch (error) {
    console.error(error)
    res.send('Error al afegir les dades')
  }
}

async function getPostObject (req) {
  return new Promise(async (resolve, reject) => {
    let objPost = { };
    // Process files
    if (req.files.length > 0) { objPost.files = [] }
    req.files.forEach(file => {
      objPost.files.push({
        name: file.originalname,
        content: file.buffer
      })
    })
    // Process other form fields
    for (let key in req.body) {
      let value = req.body[key]
      if (!isNaN(value)) { // Check if is a number (example: "2ABC" is not a 2)
        let valueInt = parseInt(value)
        let valueFlt = parseFloat(value)
        if (valueInt && valueFlt) {
          if (valueInt == valueFlt) objPost[key] = valueInt
          else objPost[key] = valueFlt
        }
      } else {
        objPost[key] = value
      }
    }
    resolve(objPost)
  })
}  

// Activar el servidor 
app.listen(port, appListen)
function appListen () {
  console.log(`Example app listening on: http://localhost:${port}`)
}
