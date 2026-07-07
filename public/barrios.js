// =====================================
// BARRIOS TUNJA
// =====================================

const barriosTunja = [

    {
        nombre:"Centro",

        minLat:5.5310,
        maxLat:5.5395,

        minLng:-73.3720,
        maxLng:-73.3630
    },

    {
        nombre:"Maldonado",

        minLat:5.5450,
        maxLat:5.5525,

        minLng:-73.3500,
        maxLng:-73.3400
    },

    {
        nombre:"Santa Inés",

        minLat:5.5530,
        maxLat:5.5595,

        minLng:-73.3470,
        maxLng:-73.3380
    },

    {
        nombre:"Mesopotamia",

        minLat:5.5580,
        maxLat:5.5650,

        minLng:-73.3440,
        maxLng:-73.3350
    },

    {
        nombre:"Los Cojines",

        minLat:5.5480,
        maxLat:5.5550,

        minLng:-73.3550,
        maxLng:-73.3450
    }

];

// =====================================
// DETECTAR BARRIO
// =====================================

function detectarBarrio(
    latitud,
    longitud
){

    for(const barrio of barriosTunja){

        const dentroLat =

        latitud >= barrio.minLat &&
        latitud <= barrio.maxLat;

        const dentroLng =

        longitud >= barrio.minLng &&
        longitud <= barrio.maxLng;

        if(
            dentroLat &&
            dentroLng
        ){

            return barrio.nombre;

        }

    }

    return "Otros";

}
module.exports = {
    detectarBarrio
}