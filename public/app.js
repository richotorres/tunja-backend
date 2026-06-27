const SUPABASE_URL =
"https://oszjlipttlqvyqwffrdc.supabase.co";

const SUPABASE_KEY =
"sb_publishable_h6eJ8aNbQHBXZjwoP5F9zA_9y4k4maI";

const supabaseClient =
window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// =====================================
// MAPA
// =====================================

const map = L.map("map").setView(
    [5.5353, -73.3678],
    13
);

L.tileLayer(
    "https://api.maptiler.com/maps/dataviz-light/{z}/{x}/{y}.png?key=a0aoBR7WAQOMxSa8H1Em",
    {
        attribution:
        "&copy; OpenStreetMap & MapTiler"
    }
).addTo(map);

// =====================================
// VARIABLES
// =====================================

let markers = [];

let heatLayer = null;

let graficaEstados = null;

let graficaBarrios = null;

// =====================================
// KPIs + CONTADOR GIGANTE
// =====================================

function actualizarKPIs(data){

    // =====================================
    // KPIs NORMALES
    // =====================================

    document.getElementById(
        "totalReportes"
    ).innerText = data.length;

    const resueltos = data.filter(
        r => r.estado === "solucionado"
    ).length;

    const pendientes = data.filter(
        r => r.estado !== "solucionado"
    ).length;

    document.getElementById(
        "reportesResueltos"
    ).innerText = resueltos;

    document.getElementById(
        "reportesPendientes"
    ).innerText = pendientes;

    // =====================================
    // CONTADOR GIGANTE
    // =====================================

    const contadorGigante =
    document.getElementById(
        "contadorGigante"
    );

    if(contadorGigante){

        contadorGigante.innerText =
        data.length;

    }

    // =====================================
    // BARRIOS AFECTADOS
    // =====================================

    const barrios = {};

    data.forEach(reporte => {

        const barrio =
        reporte.barrio || "Otros";

        barrios[barrio] = true;

    });

    const totalBarrios =
    Object.keys(barrios).length;

    const contadorBarrios =
    document.getElementById(
        "contadorBarrios"
    );

    if(contadorBarrios){

        contadorBarrios.innerText =
        totalBarrios;

    }

    // =====================================
    // CASOS PENDIENTES
    // =====================================

    const contadorPendientes =
    document.getElementById(
        "contadorPendientes"
    );

    if(contadorPendientes){

        contadorPendientes.innerText =
        pendientes;

    }

}

// =====================================
// COLOR ESTADO
// =====================================

function obtenerColorEstado(estado){

    if(estado === "solucionado"){

        return "#16a34a";

    }

    if(estado === "revision"){

        return "#2563eb";

    }

    return "#ff5a1f";

}

// =====================================
// MAPA + HEATMAP
// =====================================

function renderMapa(data){

    markers.forEach(marker => {

        map.removeLayer(marker);

    });

    markers = [];

    if(heatLayer){

        map.removeLayer(heatLayer);

    }

    const heatPoints = [];

    data.forEach(reporte => {

        if(
            !reporte.latitud ||
            !reporte.longitud
        ) return;

        // =====================================
        // HEATMAP
        // =====================================

        heatPoints.push([
            reporte.latitud,
            reporte.longitud,
            1
        ]);

        // =====================================
        // COLOR
        // =====================================

        const color =
        obtenerColorEstado(
            reporte.estado
        );

        // =====================================
        // ICONO
        // =====================================

        const icono = L.divIcon({

            className: "",

            html: `

            <div
                style="
                    background:${color};
                    width:20px;
                    height:20px;
                    border-radius:50%;
                    border:4px solid white;
                    box-shadow:0 0 18px ${color};
                "
            ></div>

            `,

            iconSize:[20,20]

        });

        // =====================================
        // MARKER
        // =====================================

        const marker = L.marker(
            [
                reporte.latitud,
                reporte.longitud
            ],
            {
                icon: icono
            }
        ).addTo(map);

        // =====================================
        // POPUP PREMIUM
        // =====================================

        marker.bindPopup(`

            <div style="
                width:280px;
                max-width:280px;
                font-family:Arial;
            ">

                <h3 style="
                    font-size:24px;
                    margin-bottom:12px;
                    color:#0f172a;
                ">
                    ${reporte.nombre || "Ciudadano"}
                </h3>

                <p style="
                    margin-bottom:12px;
                    color:#475569;
                    line-height:1.5;
                    font-size:15px;
                ">
                    📍
                    ${reporte.barrio || reporte.direccion || ""}
                </p>

                <span style="
                    background:${color};
                    color:white;
                    padding:8px 14px;
                    border-radius:20px;
                    font-size:12px;
                    font-weight:bold;
                    display:inline-block;
                    margin-bottom:15px;
                ">
                    ${reporte.estado || "pendiente"}
                </span>

                ${
                    reporte.foto_url &&
                    reporte.foto_url !== "sin_imagen" &&
                    reporte.foto_url !== "imagen_recibida"

                    ? `

                        <div
                            style="
                                margin-top:10px;
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
                                    0 6px 18px rgba(0,0,0,0.20);
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
                                    margin-top:12px;
                                    width:100%;
                                    background:#2563eb;
                                    color:white;
                                    border:none;
                                    padding:12px;
                                    border-radius:12px;
                                    font-weight:bold;
                                    cursor:pointer;
                                "
                            >

                                🖼️ Ver imagen completa

                            </button>

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

                <a
                    target="_blank"
                    href="https://maps.google.com/?q=${reporte.latitud},${reporte.longitud}"

                    style="
                        display:block;
                        margin-top:15px;
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

        `);

        markers.push(marker);

    });

    // =====================================
    // HEATMAP
    // =====================================

    heatLayer = L.heatLayer(
        heatPoints,
        {
            radius:35,
            blur:25,
            maxZoom:17,
            gradient:{
                0.2:"#22c55e",
                0.4:"#eab308",
                0.7:"#f97316",
                1:"#dc2626"
            }
        }
    ).addTo(map);

}

// =====================================
// FEED
// =====================================

function renderFeed(data){

    const container =
    document.getElementById(
        "feedReportes"
    );

    container.innerHTML = "";

    data.forEach(reporte => {

        const color =
        obtenerColorEstado(
            reporte.estado
        );

        const fecha =
        new Date(
            reporte.created_at
        ).toLocaleDateString();

        container.innerHTML += `

        <div
            class="feed-card"
            style="
                border-left:6px solid ${color};
            "
        >

            <div class="feed-top">

                <h3>
                    ${reporte.nombre || "Ciudadano"}
                </h3>

                <span
                    class="estado-badge"
                    style="
                        background:${color};
                    "
                >
                    ${reporte.estado || "pendiente"}
                </span>

            </div>

            <p class="feed-direccion">

                📍
                ${reporte.barrio || reporte.direccion || "Sin dirección"}

            </p>

            ${
                reporte.foto_url &&
                reporte.foto_url !== "sin_imagen" &&
                reporte.foto_url !== "imagen_recibida"

                ? `

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
                            height:220px;
                            object-fit:cover;
                            border-radius:18px;
                            margin-top:15px;
                            cursor:pointer;
                            border:3px solid rgba(255,255,255,0.08);
                        "
                    >

                `

                : ""

            }

            <a
                target="_blank"
                href="https://maps.google.com/?q=${reporte.latitud},${reporte.longitud}"

                style="
                    display:block;
                    margin-top:15px;
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

            <div class="feed-footer">

                📅 ${fecha}

            </div>

        </div>

        `;

    });

}

// =====================================
// BARRIOS
// =====================================

function renderBarrios(data){

    const container =
    document.getElementById(
        "barriosContainer"
    );

    if(!container) return;

    const conteoBarrios = {};

    data.forEach(reporte => {

        const barrio =
        reporte.barrio || "Otros";

        if(!conteoBarrios[barrio]){

            conteoBarrios[barrio] = 0;

        }

        conteoBarrios[barrio]++;

    });

    const barriosOrdenados =
    Object.entries(conteoBarrios)
    .sort((a,b) => b[1]-a[1]);

    container.innerHTML = "";

    barriosOrdenados.forEach(barrio => {

        container.innerHTML += `

        <div class="barrio-card">

            <h3>
                ${barrio[0]}
            </h3>

            <p>
                🚧 ${barrio[1]} reportes
            </p>

        </div>

        `;

    });

}

// =====================================
// TOP BARRIOS PREMIUM
// =====================================

function renderTopBarrios(data){

    const container =
    document.getElementById(
        "topBarrios"
    );

    if(!container) return;

    const conteoBarrios = {};

    data.forEach(reporte => {

        const barrio =
        reporte.barrio || "Otros";

        if(!conteoBarrios[barrio]){

            conteoBarrios[barrio] = 0;

        }

        conteoBarrios[barrio]++;

    });

    const barriosOrdenados =
    Object.entries(conteoBarrios)
    .sort((a,b) => b[1]-a[1])
    .slice(0,5);

    container.innerHTML = "";

    barriosOrdenados.forEach((barrio,index) => {

        let medal = "🏅";

        if(index === 0){

            medal = "🥇";

        }

        else if(index === 1){

            medal = "🥈";

        }

        else if(index === 2){

            medal = "🥉";

        }

        container.innerHTML += `

        <div class="top-barrio-card">

            <div class="top-left">

                <span class="top-medal">
                    ${medal}
                </span>

                <span class="top-name">
                    ${barrio[0]}
                </span>

            </div>

            <div class="top-count">

                ${barrio[1]} reportes

            </div>

        </div>

        `;

    });

}

// =====================================
// ALERTA
// =====================================

function renderZonaCritica(data){

    const alerta =
    document.getElementById(
        "alertaCritica"
    );

    if(!alerta) return;

    const conteoBarrios = {};

    data.forEach(reporte => {

        const barrio =
        reporte.barrio || "Otros";

        if(!conteoBarrios[barrio]){

            conteoBarrios[barrio] = 0;

        }

        conteoBarrios[barrio]++;

    });

    const barriosOrdenados =
    Object.entries(conteoBarrios)
    .sort((a,b)=> b[1]-a[1]);

    if(barriosOrdenados.length === 0){

        alerta.innerHTML =
        "🚧 No hay datos";

        return;

    }

    const topBarrio =
    barriosOrdenados[0];

    alerta.innerHTML = `

        🚨 Zona crítica detectada

        <br><br>

        ${topBarrio[0]}
        →
        ${topBarrio[1]} reportes activos

    `;

}

// =====================================
// GRAFICAS SMART CITY
// =====================================

function renderGraficas(data){

    let pendientes = 0;

    let revision = 0;

    let solucionados = 0;

    data.forEach(reporte => {

        const estado =
        (reporte.estado || "")
        .toLowerCase();

        if(
            estado.includes("pend")
        ){

            pendientes++;

        }

        else if(
            estado.includes("revi")
        ){

            revision++;

        }

        else{

            solucionados++;

        }

    });

    const ctxEstados =
    document
    .getElementById(
        "graficaEstados"
    )
    .getContext("2d");

    if(graficaEstados){

        graficaEstados.destroy();

    }

    graficaEstados =
    new Chart(
        ctxEstados,
        {

            type:"doughnut",

            data:{

                labels:[
                    "Pendientes",
                    "En revisión",
                    "Solucionados"
                ],

                datasets:[{

                    data:[
                        pendientes,
                        revision,
                        solucionados
                    ],

                    backgroundColor:[
                        "#ef4444",
                        "#f59e0b",
                        "#22c55e"
                    ],

                    borderWidth:0

                }]

            },

            options:{

                responsive:true,

                plugins:{

                    legend:{

                        labels:{
                            color:"white"
                        }

                    }

                }

            }

        }
    );

    const conteoBarrios = {};

    data.forEach(reporte => {

        const barrio =
        reporte.barrio || "Otros";

        if(!conteoBarrios[barrio]){

            conteoBarrios[barrio] = 0;

        }

        conteoBarrios[barrio]++;

    });

    const topBarrios =
    Object.entries(conteoBarrios)
    .sort((a,b)=> b[1]-a[1])
    .slice(0,7);

    const labels =
    topBarrios.map(
        b => b[0]
    );

    const valores =
    topBarrios.map(
        b => b[1]
    );

    const ctxBarrios =
    document
    .getElementById(
        "graficaBarrios"
    )
    .getContext("2d");

    if(graficaBarrios){

        graficaBarrios.destroy();

    }

    graficaBarrios =
    new Chart(
        ctxBarrios,
        {

            type:"bar",

            data:{

                labels,

                datasets:[{

                    label:"Reportes",

                    data:valores,

                    backgroundColor:"#3b82f6",

                    borderRadius:10

                }]

            },

            options:{

                responsive:true,

                scales:{

                    x:{

                        ticks:{
                            color:"white"
                        },

                        grid:{
                            color:
                            "rgba(255,255,255,0.05)"
                        }

                    },

                    y:{

                        ticks:{
                            color:"white"
                        },

                        grid:{
                            color:
                            "rgba(255,255,255,0.05)"
                        }

                    }

                },

                plugins:{

                    legend:{

                        labels:{
                            color:"white"
                        }

                    }

                }

            }

        }
    );

}

// =====================================
// CARGAR REPORTES
// =====================================

async function cargarReportes(){

    const { data, error } =
    await supabaseClient
    .from("reportes")
    .select("*")
    .order("created_at", {
        ascending:false
    });

    if(error){

        console.log(error);

        return;
    }

    for(const reporte of data){

        if(
            !reporte.barrio &&
            reporte.latitud &&
            reporte.longitud
        ){

            const barrioDetectado =
            detectarBarrio(
                reporte.latitud,
                reporte.longitud
            );

            await supabaseClient
            .from("reportes")
            .update({
                barrio:barrioDetectado
            })
            .eq(
                "id",
                reporte.id
            );

            reporte.barrio =
            barrioDetectado;

        }

    }

    actualizarKPIs(data);

    renderMapa(data);

    renderFeed(data);

    renderBarrios(data);

    renderTopBarrios(data);

    renderZonaCritica(data);

    renderGraficas(data);

}

// =====================================
// REALTIME
// =====================================

supabaseClient
.channel("realtime-public")
.on(
    "postgres_changes",
    {
        event:"*",
        schema:"public",
        table:"reportes"
    },
    () => {

        cargarReportes();

    }
)
.subscribe();

// =====================================
// INIT
// =====================================

cargarReportes();