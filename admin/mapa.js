const map = L.map('map').setView([5.5446, -73.3570], 13);

L.tileLayer(
  'https://api.maptiler.com/maps/dataviz-dark/{z}/{x}/{y}.png?key=a0aoBR7WAQOMxSa8H1Em',
  {
    attribution: '&copy; OpenStreetMap contributors',
  }
).addTo(map);

async function cargarMapa() {

  const { data, error } = await supabaseClient
    .from("reportes")
    .select("*");

  if (error) {
    console.log(error);
    return;
  }

  const puntos = [];

  data.forEach(reporte => {

    if (!reporte.latitud || !reporte.longitud) return;

    puntos.push([
      reporte.latitud,
      reporte.longitud
    ]);

    let color = "red";

    if (reporte.estado === "revision") {
      color = "orange";
    }

    if (reporte.estado === "solucionado") {
      color = "lime";
    }

    const icono = L.divIcon({
      className: "custom-marker",
      html: `

        <div style="
          width:22px;
          height:22px;
          background:${color};
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 0 18px ${color};
        "></div>

      `,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });

    const marker = L.marker(
      [reporte.latitud, reporte.longitud],
      {
        icon: icono
      }
    ).addTo(map);

    marker.bindPopup(`

      <div style="
        width:260px;
        font-family:Arial;
        color:#111827;
      ">

        <div style="
          background:${color};
          color:white;
          padding:12px;
          border-radius:14px 14px 0 0;
          font-weight:bold;
          text-align:center;
          font-size:16px;
        ">
          🚧 Reporte #${reporte.id}
        </div>

        <div style="
          background:white;
          padding:15px;
          border-radius:0 0 14px 14px;
          box-shadow:0 4px 20px rgba(0,0,0,0.35);
        ">

          <p>
            <b>Estado:</b>
            ${reporte.estado}
          </p>

          <p>
            <b>Teléfono:</b>
            ${reporte.telefono || "No disponible"}
          </p>

          <p style="
            word-break:break-word;
          ">
            <b>Ubicación:</b><br>
            ${reporte.direccion || "Sin dirección"}
          </p>

          ${
            reporte.foto_url &&
            reporte.foto_url !== "sin_imagen"

            ? `
              <img
                src="${reporte.foto_url}"
                style="
                  width:100%;
                  border-radius:12px;
                  margin-top:10px;
                  box-shadow:0 4px 12px rgba(0,0,0,0.35);
                "
              />
            `

            : ""
          }

          <a
            href="https://maps.google.com/?q=${reporte.latitud},${reporte.longitud}"
            target="_blank"
            style="
              display:block;
              margin-top:15px;
              background:#2563eb;
              color:white;
              text-align:center;
              padding:12px;
              border-radius:10px;
              text-decoration:none;
              font-weight:bold;
            "
          >
            📍 Abrir en Google Maps
          </a>

        </div>

      </div>

    `);

  });

  // AUTOZOOM
  if (puntos.length > 0) {
    map.fitBounds(puntos, {
      padding: [50, 50]
    });
  }

}

cargarMapa();