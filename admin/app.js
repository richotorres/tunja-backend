const SUPABASE_URL = "https://oszjlipttlqvyqwffrdc.supabase.co";

const SUPABASE_KEY = "sb_publishable_h6eJ8aNbQHBXZjwoP5F9zA_9y4k4maI";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

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

  const tabla = document.getElementById("tablaReportes");

  tabla.innerHTML = "";

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

  data.forEach(reporte => {

    const fila = document.createElement("tr");

    fila.innerHTML = `

      <td>${reporte.id}</td>

      <td>${reporte.telefono || "No disponible"}</td>

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

  });

}

async function cambiarEstado(id, nuevoEstado) {

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

  alert("Estado actualizado");

}

cargarReportes();


// ===============================
// REALTIME AUTOMÁTICO
// ===============================

supabaseClient
  .channel('realtime-reportes')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'reportes'
    },
    (payload) => {

      console.log("Nuevo reporte recibido:");
      console.log(payload);

      location.reload();

    }
  )
  .subscribe();