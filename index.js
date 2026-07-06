require('dotenv').config()

const express = require('express')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const app = express()

app.use(express.json())

// ===============================
// ARCHIVOS ESTÁTICOS
// ===============================

app.use(express.static(path.join(__dirname, 'public')))

app.use('/admin', express.static(path.join(__dirname, 'admin')))


// ======================================================
// VARIABLES .ENV
// ======================================================

const VERIFY_TOKEN =
  process.env.VERIFY_TOKEN

const TOKEN =
  process.env.TOKEN

const SUPABASE_URL =
  process.env.SUPABASE_URL

const SUPABASE_KEY =
  process.env.SUPABASE_KEY

const PHONE_NUMBER_ID =
  process.env.PHONE_NUMBER_ID

// ======================================================
// SUPABASE
// ======================================================

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
)

const SUPABASE_TABLE =
  `${SUPABASE_URL}/rest/v1/reportes`

// ======================================================
// MEMORIA TEMPORAL
// ======================================================

const usuarios = {}

// ======================================================
// ENVIAR MENSAJES
// ======================================================

async function enviarMensaje(numero, texto) {

  await axios.post(
    `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to: numero,
      text: {
        body: texto
      }
    },
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  )

}

// ======================================================
// DESCARGAR IMAGEN DESDE META
// ======================================================

async function descargarImagenMeta(mediaId) {

  try {

    console.log('📥 OBTENIENDO URL DE META...')

    const mediaInfo = await axios.get(
      `https://graph.facebook.com/v25.0/${mediaId}`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`
        }
      }
    )

    const imageUrl = mediaInfo.data.url

    console.log('✅ URL OBTENIDA')

    const response = await axios.get(
      imageUrl,
      {
        responseType: 'arraybuffer',
        headers: {
          Authorization: `Bearer ${TOKEN}`
        }
      }
    )

    // CREAR CARPETA TEMP SI NO EXISTE
    const tempDir =
      path.join(__dirname, 'temp')

    if (!fs.existsSync(tempDir)) {

      fs.mkdirSync(tempDir)

    }

    const fileName =
      `reporte_${Date.now()}.jpg`

    const tempPath =
      path.join(tempDir, fileName)

    fs.writeFileSync(tempPath, response.data)

    console.log('✅ IMAGEN DESCARGADA')

    return {
      tempPath,
      fileName
    }

  } catch (error) {

    console.log('❌ ERROR DESCARGANDO IMAGEN')

    if (error.response) {

      console.log(error.response.data)

    } else {

      console.log(error.message)

    }

    return null

  }

}

// ======================================================
// SUBIR IMAGEN A STORAGE
// ======================================================

async function subirImagenSupabase(tempPath, fileName) {

  try {

    console.log('☁️ SUBIENDO IMAGEN...')

    const fileBuffer =
      fs.readFileSync(tempPath)

    const { error } = await supabase.storage
      .from('reportes')
      .upload(fileName, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      })

    if (error) {

      console.log('❌ ERROR STORAGE')
      console.log(error)

      return null

    }

    const { data } = supabase.storage
      .from('reportes')
      .getPublicUrl(fileName)

    console.log('✅ URL PÚBLICA GENERADA')

    return data.publicUrl

  } catch (error) {

    console.log('❌ ERROR GENERAL STORAGE')
    console.log(error)

    return null

  }

}

// ======================================================
// RUTA PRINCIPAL
// ======================================================

app.get('/', (req, res) => {

    res.sendFile(
        path.join(__dirname, 'public', 'index.html')
    )

})
// ======================================================
// LOGIN ADMIN
// ======================================================

app.get('/login', (req, res) => {

    res.sendFile(
        path.join(__dirname, 'admin', 'login.html')
    )

})

// ======================================================
// DASHBOARD ADMIN
// ======================================================

app.get('/dashboard', (req, res) => {

    res.sendFile(
        path.join(__dirname, 'admin', 'index.html')
    )

})


// ======================================================
// VERIFICAR WEBHOOK
// ======================================================

app.get('/webhook', (req, res) => {

  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode && token) {

    if (
      mode === 'subscribe' &&
      token === VERIFY_TOKEN
    ) {

      console.log('✅ WEBHOOK VERIFICADO')

      return res.status(200).send(challenge)

    }

    return res.sendStatus(403)

  }

  res.send('Webhook activo 🚀')

})

// ======================================================
// RECIBIR MENSAJES
// ======================================================

app.post('/webhook', async (req, res) => {

  try {

    console.log(
      JSON.stringify(req.body, null, 2)
    )

    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]

    if (!message) {

      return res.sendStatus(200)

    }

    const from = message.from

    const text =
      message.text?.body?.trim().toLowerCase()

    const image = message.image

    const location = message.location

    // ======================================================
    // CREAR USUARIO
    // ======================================================

    if (!usuarios[from]) {

      usuarios[from] = {
        paso: 'inicio',
        ultimaActividad: Date.now()
      }

    }

    const usuario = usuarios[from]

    usuario.ultimaActividad = Date.now()

    let respuesta = ''

    // ======================================================
    // INICIO AUTOMÁTICO
    // ======================================================

    if (
      usuario.paso === 'inicio'
    ) {

      usuario.paso = 'autorizacion'

      respuesta =
`👋 ¡Hola!

Bienvenido a *Tunja Sin Huecos* 🚧

Sistema ciudadano organizado por YAMIR LOPEZ para reportar daños en las vías de Tunja.

📌 Antes de continuar necesitamos autorización para el tratamiento de datos personales.

Responde:

1️⃣ Aceptar
2️⃣ No aceptar`

    }

    // ======================================================
    // ACEPTAR
    // ======================================================

    else if (
      usuario.paso === 'autorizacion' &&
      text === '1'
    ) {

      usuario.paso = 'menu'

      respuesta =
`🚧 *MENÚ PRINCIPAL*

Selecciona una opción:

1️⃣ Reportar hueco
2️⃣ Consultar reporte
3️⃣ Información`

    }

    // ======================================================
    // NO ACEPTAR
    // ======================================================

    else if (
      usuario.paso === 'autorizacion' &&
      text === '2'
    ) {

      respuesta =
`👋 Gracias por comunicarte con Tunja Sin Huecos.

Para utilizar el sistema es necesario aceptar el tratamiento de datos.`

      delete usuarios[from]

    }

    // ======================================================
    // REPORTAR HUECO
    // ======================================================

    else if (
      usuario.paso === 'menu' &&
      text === '1'
    ) {

      usuario.paso = 'nombre'

      respuesta =
`👤 Escribe tu nombre completo.`

    }

    // ======================================================
    // NOMBRE
    // ======================================================

    else if (
      usuario.paso === 'nombre'
    ) {

      usuario.nombre = text

      usuario.paso = 'ubicacion'

      respuesta =
`📍 Comparte tu ubicación GPS desde WhatsApp.

También puedes escribir una dirección.`

    }

    // ======================================================
    // UBICACIÓN
    // ======================================================

    else if (
      usuario.paso === 'ubicacion'
    ) {

      if (location) {

        usuario.latitud =
          location.latitude

        usuario.longitud =
          location.longitude

        usuario.ubicacion =
          `https://maps.google.com/?q=${location.latitude},${location.longitude}`

      } else {

        usuario.ubicacion = text

      }

      usuario.paso = 'foto'

      respuesta =
`📸 Ahora envía una fotografía del hueco.`

    }

    // ======================================================
    // FOTO
    // ======================================================

    else if (
      usuario.paso === 'foto'
    ) {

      if (image) {

        console.log('📸 FOTO RECIBIDA')

        const mediaId = image.id

        const descarga =
          await descargarImagenMeta(mediaId)

        if (descarga) {

          const urlPublica =
            await subirImagenSupabase(
              descarga.tempPath,
              descarga.fileName
            )

          usuario.foto =
            urlPublica || 'sin_imagen'

        } else {

          usuario.foto = 'sin_imagen'

        }

      } else {

        usuario.foto = 'sin_imagen'

      }

      usuario.paso = 'telefono'

      respuesta =
`📱 Escribe tu número celular.

⚠️ Debe tener exactamente 10 dígitos.`

    }

    // ======================================================
    // TELÉFONO
    // ======================================================

    else if (
      usuario.paso === 'telefono'
    ) {

      const telefono =
        text.replace(/\D/g, '')

      if (telefono.length !== 10) {

        respuesta =
`⚠️ Número inválido.

Por favor escribe un número colombiano válido de 10 dígitos.`

      } else {

        usuario.telefono = telefono

        // ======================================================
        // GUARDAR EN SUPABASE
        // ======================================================

        await axios.post(
          SUPABASE_TABLE,
          {
            nombre: usuario.nombre,
            telefono: usuario.telefono,
            direccion: usuario.ubicacion,
            foto_url: usuario.foto,
            latitud: usuario.latitud || null,
            longitud: usuario.longitud || null,
            estado: 'pendiente'
          },
          {
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal'
            }
          }
        )

        respuesta =
`✅ *Reporte registrado correctamente*

📍 Ubicación guardada
📸 Fotografía guardada
📱 Contacto registrado

🆔 Código:
TH-${Date.now()}

🙏 Gracias por ayudar a mejorar las vías de Tunja.`

        delete usuarios[from]

      }

    }

    // ======================================================
    // CONSULTAR
    // ======================================================

    else if (
      usuario.paso === 'menu' &&
      text === '2'
    ) {

      respuesta =
`📋 Próximamente podrás consultar el estado de tus reportes.`

    }

    // ======================================================
    // INFORMACIÓN
    // ======================================================

    else if (
      usuario.paso === 'menu' &&
      text === '3'
    ) {

      respuesta =
`🚧 Tunja Sin Huecos es una iniciativa ciudadana enfocada en mejorar la seguridad vial mediante reportes ciudadanos en tiempo real.`

    }

    // ======================================================
    // DEFAULT
    // ======================================================

    else {

      usuario.paso = 'autorizacion'

      respuesta =
`👋 Bienvenido nuevamente a *Tunja Sin Huecos* 🚧

Responde:

1️⃣ Aceptar
2️⃣ No aceptar`

    }

    // ======================================================
    // ENVIAR RESPUESTA
    // ======================================================

    await enviarMensaje(
      from,
      respuesta
    )

    console.log('✅ MENSAJE ENVIADO')

    res.sendStatus(200)

  } catch (error) {

    console.log('❌ ERROR GENERAL')

    if (error.response) {

      console.log(error.response.data)

    } else {

      console.log(error.message)

    }

    res.sendStatus(500)

  }

})

// ======================================================
// CERRAR CONVERSACIONES INACTIVAS
// ======================================================

setInterval(async () => {

  const ahora = Date.now()

  for (const numero in usuarios) {

    const usuario = usuarios[numero]

    const tiempoInactivo =
      ahora - usuario.ultimaActividad

    // 5 MINUTOS
    if (tiempoInactivo > 300000) {

      try {

        await enviarMensaje(
          numero,
`⏰ Tiempo de espera finalizado.

La conversación fue cerrada automáticamente.

Puedes volver a escribir en cualquier momento 🚀`
        )

        delete usuarios[numero]

        console.log(
          `🛑 Conversación finalizada: ${numero}`
        )

      } catch (error) {

        console.log(
          `❌ Error cerrando conversación ${numero}`
        )

      }

    }

  }

}, 60000)

// ======================================================
// SERVIDOR
// ======================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`🚀 Servidor funcionando en puerto ${PORT}`);

});