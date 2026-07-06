const SUPABASE_URL = "https://oszjlipttlqvyqwffrdc.supabase.co";

const SUPABASE_KEY = "sb_publishable_h6eJ8aNbQHBXZjwoP5F9zA_9y4k4maI";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// =====================================
// VARIABLES GLOBALES
// =====================================

let filtroActual = "todos";

let reportesGlobal = [];

// =====================================
// CARGAR REPORTES
// =====================================

async function cargarReportes() {

  console.log("Cargando reportes...");

  const { data, error } = await supabaseClient
    .from("reportes")
    .select("*")
    .order("id", { ascending: false });

  if (error) {

    console.log("ERROR:");
    console.log(error);

    return;
  }

  console.log("DATOS:");
  console.log(data);

  reportesGlobal = data;

  renderizarReportes(data);

}

// =====================================
// RENDERIZAR REPORTES
// =====================================

function renderizarReportes(data) {

  const tabla =
    document.getElementById("tablaReportes");

  tabla.innerHTML = "";

  // ===============================
  // VALIDAR DATOS
  // ===============================

  if (!data || data.length === 0) {

    tabla.innerHTML = `
      <tr>
        <td colspan="6">
          No hay reportes todavía
        </td>
      </tr>
    `;

    return;
  }

  // ===============================
  // KPIs
  // ===============================

  let pendientes = 0;
  let revision = 0;
  let solucionados = 0;

  data.forEach(reporte => {

    if (reporte.estado === "pendiente") {
      pendientes++;
    }

    if (reporte.estado === "revision") {
      revision++;
    }

    if (reporte.estado === "solucionado") {
      solucionados++;
    }

  });

  // ===============================
  // FILTRO ESTADO
  // ===============================

  let reportesFiltrados = [...data];

  if (filtroActual !== "todos") {

    reportesFiltrados =
      reportesFiltrados.filter(
        reporte =>
          reporte.estado === filtroActual
      );

  }

  // ===============================
  // FILTRO BUSCADOR
  // ===============================

  const textoBusqueda =
    document
      .getElementById("buscador")
      .value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  if (textoBusqueda !== "") {

    reportesFiltrados =
      reportesFiltrados.filter(reporte => {

        const telefono =
          String(reporte.telefono || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        const direccion =
          String(reporte.direccion || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        const estado =
          String(reporte.estado || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        return (
          telefono.includes(textoBusqueda) ||
          direccion.includes(textoBusqueda) ||
          estado.includes(textoBusqueda)
        );

      });

  }

  // ===============================
  // LIMPIAR MAPA
  // ===============================

  if (window.markersLayer) {

    markersLayer.clearLayers();

  }

  // ===============================
  // NO HAY RESULTADOS
  // ===============================

  if (reportesFiltrados.length === 0) {

    tabla.innerHTML = `
      <tr>
        <td colspan="6"
          style="
            padding:30px;
            font-size:18px;
            font-weight:bold;
          "
        >
          🚫 No se encontraron reportes
        </td>
      </tr>
    `;

  }

  // ===============================
  // TABLA + MAPA
  // ===============================

  reportesFiltrados.forEach(reporte => {

    // ===========================
    // BADGE
    // ===========================

    let badgeClass = "";

    if (reporte.estado === "pendiente") {
      badgeClass = "badge-pendiente";
    }

    if (reporte.estado === "revision") {
      badgeClass = "badge-revision";
    }

    if (reporte.estado === "solucionado") {
      badgeClass = "badge-solucionado";
    }

    // ===========================
    // CREAR FILA
    // ===========================

    const fila = document.createElement("tr");

    fila.innerHTML = `

      <td>${reporte.id}</td>

      <td>
        ${reporte.telefono || "No disponible"}
      </td>

      <td style="
        max-width:300px;
        word-break:break-word;
      ">
        ${reporte.direccion || "Sin dirección"}
      </td>

      <td>

        ${
          reporte.foto_url &&
          reporte.foto_url !== "sin_imagen" &&
          reporte.foto_url !== "imagen_recibida"

          ? `
            <img
              src="${reporte.foto_url}"
              width="120"
              style="
                border-radius:12px;
                box-shadow:0 4px 10px rgba(0,0,0,0.35);
              "
            />
          `

          : "Sin foto"
        }

      </td>

      <td>

        ${
          reporte.latitud && reporte.longitud

          ? `
            <a
              target="_blank"
              href="https://maps.google.com/?q=${reporte.latitud},${reporte.longitud}"
              style="
                background:#2563eb;
                color:white;
                padding:8px 14px;
                border-radius:8px;
                text-decoration:none;
                font-weight:bold;
              "
            >
              📍 Ver mapa
            </a>
          `

          : "Sin ubicación"
        }

      </td>

      <td>

        <div
          class="badge ${badgeClass}"
          style="margin-bottom:10px;"
        >
          ${reporte.estado}
        </div>

        <br>

        <select
          onchange="cambiarEstado(${reporte.id}, this.value)"
          style="
            padding:8px;
            border-radius:8px;
            font-weight:bold;
          "
        >

          <option
            value="pendiente"
            ${reporte.estado === "pendiente" ? "selected" : ""}
          >
            🔴 Pendiente
          </option>

          <option
            value="revision"
            ${reporte.estado === "revision" ? "selected" : ""}
          >
            🟡 En revisión
          </option>

          <option
            value="solucionado"
            ${reporte.estado === "solucionado" ? "selected" : ""}
          >
            🟢 Solucionado
          </option>

        </select>

      </td>

    `;

    tabla.appendChild(fila);

    // ===========================
    // MAPA LEAFLET
    // ===========================

    if (
      reporte.latitud &&
      reporte.longitud &&
      window.markersLayer
    ) {

      const marker = L.marker([
        reporte.latitud,
        reporte.longitud
      ]).addTo(markersLayer);

      marker.bindPopup(`

        <div style="
          width:280px;
          max-width:280px;
          font-family:Arial;
        ">

          <h3 style="
            margin:0 0 12px 0;
            color:#2563eb;
            font-size:22px;
          ">
            🚧 Reporte #${reporte.id}
          </h3>

          <p style="
            margin-bottom:12px;
            line-height:1.5;
          ">
            <b>📍 Dirección:</b><br>
            ${reporte.direccion || "Sin dirección"}
          </p>

          <p style="
            margin-bottom:12px;
          ">
            <b>📱 Teléfono:</b><br>
            ${reporte.telefono || "No disponible"}
          </p>

          <p style="
            margin-bottom:12px;
          ">
            <b>📌 Estado:</b><br>
            ${reporte.estado}
          </p>

          ${
            reporte.foto_url &&
            reporte.foto_url !== "sin_imagen" &&
            reporte.foto_url !== "imagen_recibida"

            ? `

              <div
                style="
                  margin-top:15px;
                  text-align:center;
                "
              >

                <img
                  src="${reporte.foto_url}"

                  onclick="
                    window.open(
                      '${reporte.foto_url}',
                      '_blank'
                    )
                  "

                  style="
                    width:100%;
                    height:180px;
                    object-fit:cover;
                    border-radius:16px;
                    cursor:pointer;
                    border:3px solid #e2e8f0;
                    box-shadow:
                    0 6px 18px rgba(0,0,0,0.25);
                  "
                >

                <div
                  style="
                    margin-top:12px;
                  "
                >

                  <button
                    onclick="
                      window.open(
                        '${reporte.foto_url}',
                        '_blank'
                      )
                    "

                    style="
                      background:#2563eb;
                      color:white;
                      border:none;
                      padding:12px 18px;
                      border-radius:10px;
                      cursor:pointer;
                      font-weight:bold;
                      width:100%;
                    "
                  >

                    🖼️ Ver imagen completa

                  </button>

                </div>

              </div>

            `

            : `

              <div style="
                margin-top:15px;
                padding:20px;
                border-radius:16px;
                background:#f1f5f9;
                text-align:center;
                color:#64748b;
                font-weight:bold;
              ">

                📷 Sin imagen disponible

              </div>

            `
          }

          <div
            style="
              margin-top:15px;
            "
          >

            <a
              target="_blank"
              href="https://maps.google.com/?q=${reporte.latitud},${reporte.longitud}"

              style="
                display:block;
                background:#16a34a;
                color:white;
                text-decoration:none;
                text-align:center;
                padding:12px;
                border-radius:12px;
                font-weight:bold;
              "
            >

              📍 Abrir en Google Maps

            </a>

          </div>

        </div>

      `);

    }

  });

  // ===============================
  // ACTUALIZAR KPIs
  // ===============================

  document.getElementById(
    "totalReportes"
  ).innerText = data.length;

  document.getElementById(
    "totalPendientes"
  ).innerText = pendientes;

  document.getElementById(
    "totalRevision"
  ).innerText = revision;

  document.getElementById(
    "totalSolucionados"
  ).innerText = solucionados;

}

// =====================================
// CAMBIAR ESTADO
// =====================================

async function cambiarEstado(
  id,
  nuevoEstado
) {

  const { error } = await supabaseClient
    .from("reportes")
    .update({
      estado: nuevoEstado
    })
    .eq("id", id);

  if (error) {

    console.log(error);

    alert("Error actualizando estado");

    return;
  }

  alert("✅ Estado actualizado");

  cargarReportes();

}

// =====================================
// FILTROS
// =====================================

function filtrarEstado(estado) {

  filtroActual = estado;

  renderizarReportes(reportesGlobal);

}

// =====================================
// BUSCADOR
// =====================================

function buscarReportes() {

  renderizarReportes(reportesGlobal);

}

// =====================================
// LOGOUT
// =====================================

function logout() {

  localStorage.removeItem(
    "adminLogueado"
  );

  window.location.href =
    "/login";

}

// =====================================
// INICIAR
// =====================================

cargarReportes();

// =====================================
// REALTIME
// =====================================

supabaseClient
  .channel('realtime-reportes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'reportes'
    },
    (payload) => {

      console.log("Cambio detectado:");

      console.log(payload);

      cargarReportes();

    }
  )
  .subscribe();