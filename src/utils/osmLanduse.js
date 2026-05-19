/**
 * osmLanduse.js — Land type definitions, multilingual labels,
 * colour mapping, and response parsers for OSM Nominatim + Overpass APIs.
 *
 * Supports En / Hi (Hindi) / Gu (Gujarati).
 */

// ── Fill + stroke style per OSM tag ──────────────────────────────────────────
export const LAND_STYLE = {
  // Agricultural
  farmland:    { fill: 'rgba(168,220,140,0.40)', stroke: '#5DA845', warn: false },
  farm:        { fill: 'rgba(168,220,140,0.40)', stroke: '#5DA845', warn: false },
  meadow:      { fill: 'rgba(198,232,162,0.40)', stroke: '#7BBB50', warn: false },
  grass:       { fill: 'rgba(198,232,162,0.40)', stroke: '#7BBB50', warn: false },
  orchard:     { fill: 'rgba(122,198,102,0.40)', stroke: '#4A9040', warn: false },
  vineyard:    { fill: 'rgba(142,202,122,0.40)', stroke: '#5A9040', warn: false },
  allotments:  { fill: 'rgba(198,228,168,0.40)', stroke: '#6AB048', warn: false },
  // Residential / Urban
  residential: { fill: 'rgba(232,185,155,0.40)', stroke: '#C07050', warn: true  },
  commercial:  { fill: 'rgba(248,165,118,0.40)', stroke: '#D06040', warn: true  },
  industrial:  { fill: 'rgba(188,188,208,0.40)', stroke: '#7070A0', warn: true  },
  building:    { fill: 'rgba(168,168,168,0.44)', stroke: '#888888', warn: true  },
  // Natural
  wood:        { fill: 'rgba(48,118,48,0.40)',   stroke: '#1E6A1E', warn: false },
  forest:      { fill: 'rgba(48,118,48,0.40)',   stroke: '#1E6A1E', warn: false },
  water:       { fill: 'rgba(48,150,222,0.44)',  stroke: '#1E90D0', warn: false },
  wetland:     { fill: 'rgba(98,178,212,0.40)',  stroke: '#50A0C0', warn: false },
  scrub:       { fill: 'rgba(180,200,128,0.40)', stroke: '#8A9A50', warn: false },
  heath:       { fill: 'rgba(198,188,138,0.40)', stroke: '#A09050', warn: false },
  sand:        { fill: 'rgba(230,210,160,0.40)', stroke: '#C0A060', warn: false },
  bare_rock:   { fill: 'rgba(178,164,144,0.40)', stroke: '#907060', warn: false },
};

// ── Multilingual labels (en / hi / gu) ───────────────────────────────────────
export const LAND_LABEL = {
  farmland:    { en: 'Farming Land',          hi: 'कृषि भूमि',            gu: 'ખેતી ભૂમિ' },
  farm:        { en: 'Farm Area',             hi: 'खेत क्षेत्र',           gu: 'ખેત ક્ષેત્ર' },
  meadow:      { en: 'Meadow / Grassland',    hi: 'घास का मैदान',          gu: 'ઘાસ ભૂમિ' },
  grass:       { en: 'Green Grass Area',      hi: 'हरित घास क्षेत्र',       gu: 'લીલો ઘાસ' },
  orchard:     { en: 'Orchard / Garden',      hi: 'बगीचा',                 gu: 'બગીચો' },
  vineyard:    { en: 'Vineyard',              hi: 'अंगूर का बगीचा',         gu: 'દ્રાક્ષ ઉદ્યાન' },
  allotments:  { en: 'Allotment Plots',       hi: 'भूखंड',                  gu: 'ભૂખંડ' },
  residential: { en: 'Residential Area',      hi: 'रहवासी क्षेत्र',         gu: 'રહેણાંક વિસ્તાર' },
  commercial:  { en: 'Commercial Area',       hi: 'व्यावसायिक क्षेत्र',      gu: 'વ્યાવસાયિક ક્ષેત્ર' },
  industrial:  { en: 'Industrial Area',       hi: 'औद्योगिक क्षेत्र',       gu: 'ઔદ્યોગિક ક્ષેત્ર' },
  building:    { en: 'Building / House',      hi: 'इमारत / घर',              gu: 'ઇમારત / ઘર' },
  wood:        { en: 'Trees / Forest',        hi: 'पेड़ / वन',               gu: 'ઝાડ / જંગલ' },
  forest:      { en: 'Forest Area',           hi: 'वन क्षेत्र',              gu: 'જંગલ ક્ષેત્ર' },
  water:       { en: 'Water Body',            hi: 'जल क्षेत्र',              gu: 'પાણી વિસ્તાર' },
  wetland:     { en: 'Wetland',               hi: 'आर्द्रभूमि',               gu: 'ભીની ભૂમિ' },
  scrub:       { en: 'Scrub Land',            hi: 'झाड़ी भूमि',              gu: 'ઝાડ ભૂમિ' },
  heath:       { en: 'Heath Land',            hi: 'मूरलैंड',                gu: 'ઉજ્જડ ભૂમિ' },
  sand:        { en: 'Sandy / Empty Land',    hi: 'रेतीली / खाली जमीन',    gu: 'ખાલી જમીન' },
  bare_rock:   { en: 'Rocky / Barren Land',   hi: 'चट्टानी / बंजर जमीन',   gu: 'ખડકાળ / ઉજ્જડ' },
  highway:     { en: 'Road',                  hi: 'सड़क',                   gu: 'રસ્તો' },
  road:        { en: 'Road',                  hi: 'सड़क',                   gu: 'રસ્તો' },
  settlement:  { en: 'Village / Settlement',  hi: 'गांव / बस्ती',            gu: 'ગામ / વસ્તી' },
  unknown:     { en: 'Open Area',             hi: 'खुला क्षेत्र',             gu: 'ખુલ્લો વિસ્તાર' },
};

// ── Static legend items shown in the legend card ─────────────────────────────
export const LEGEND_ITEMS = [
  { fill: 'rgba(168,220,140,0.88)', label: { en: 'Farm / Crops',      hi: 'कृषि / फसल',     gu: 'ખેતી ભૂમિ' }       },
  { fill: 'rgba(230,210,160,0.88)', label: { en: 'Empty Soil',        hi: 'खाली मिट्टी',    gu: 'ખાલી જમીન' }       },
  { fill: 'rgba(232,185,155,0.88)', label: { en: 'Residential Area',  hi: 'रहवासी क्षेत्र', gu: 'રહેણાંક વિસ્તાર' }  },
  { fill: 'rgba(168,168,168,0.88)', label: { en: 'Buildings',         hi: 'इमारतें',         gu: 'ઇમારતો' }          },
  { fill: 'rgba(48,150,222,0.88)',  label: { en: 'Water Body',        hi: 'जल क्षेत्र',      gu: 'પાણી' }            },
  { fill: 'rgba(48,118,48,0.88)',   label: { en: 'Trees / Forest',    hi: 'पेड़ / वन',       gu: 'ઝાડ' }             },
];

// ── Parse Overpass API JSON into drawable polygon objects ─────────────────────
export function parseOverpassPolygons(data) {
  const { elements = [] } = data;

  // Build node ID → {latitude, longitude} map
  const nodes = {};
  elements
    .filter(e => e.type === 'node')
    .forEach(n => { nodes[n.id] = { latitude: n.lat, longitude: n.lon }; });

  const polygons = [];
  elements
    .filter(e => e.type === 'way' && Array.isArray(e.nodes) && e.nodes.length >= 3)
    .slice(0, 80)   // cap at 80 to keep rendering performant
    .forEach(way => {
      const coords = way.nodes.map(id => nodes[id]).filter(Boolean);
      if (coords.length < 3) return;

      const tags     = way.tags ?? {};
      const landType =
        tags.landuse ?? tags.natural ?? (tags.building ? 'building' : null);
      if (!landType) return;

      const style = LAND_STYLE[landType];
      if (!style) return;

      polygons.push({
        id:     String(way.id),
        coords,
        fill:   style.fill,
        stroke: style.stroke,
        warn:   style.warn,
        type:   landType,
      });
    });

  return polygons;
}

// ── Parse Nominatim reverse-geocode response into a typed land info object ────
export function parseLandTypeFromNominatim(data) {
  if (!data || data.error) return { type: 'unknown', label: LAND_LABEL.unknown };

  const cls  = data.class;
  const type = data.type;

  if (cls === 'building')                                             return { type: 'building',   label: LAND_LABEL.building   };
  if (cls === 'highway')                                              return { type: 'road',        label: LAND_LABEL.road       };
  if (cls === 'waterway' || (cls === 'natural' && type === 'water')) return { type: 'water',        label: LAND_LABEL.water      };
  if (cls === 'natural' && (type === 'wood' || type === 'forest'))   return { type: 'forest',       label: LAND_LABEL.forest     };
  if (cls === 'natural' && type === 'scrub')                         return { type: 'scrub',        label: LAND_LABEL.scrub      };
  if (cls === 'natural' && type === 'sand')                          return { type: 'sand',         label: LAND_LABEL.sand       };
  if (cls === 'landuse' && LAND_LABEL[type])                         return { type,                 label: LAND_LABEL[type]      };
  if (cls === 'place')                                               return { type: 'settlement',  label: LAND_LABEL.settlement };

  return { type: 'unknown', label: LAND_LABEL.unknown };
}

// ── Calculate bounding box from an array of {latitude, longitude} coords ─────
export function getBboxFromCoords(coords) {
  const lats = coords.map(c => c.latitude);
  const lons = coords.map(c => c.longitude);
  return {
    south: Math.min(...lats),
    north: Math.max(...lats),
    west:  Math.min(...lons),
    east:  Math.max(...lons),
  };
}
