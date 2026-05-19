/**
 * Land type classification config for farm boundary validation.
 *
 * NON_AG_TAGS   — OSM landuse values that disqualify an area as farmland.
 * OVERLAP_THRESHOLD — fraction of the drawn polygon that must overlap a
 *   non-agricultural zone before the warning fires (0.15 = 15%).
 */

export const NON_AG_TAGS = [
  'residential',
  'commercial',
  'industrial',
  'retail',
  'construction',
  'military',
  'cemetery',
  'recreation_ground',
];

export const AG_TAGS = [
  'farmland',
  'farmyard',
  'orchard',
  'vineyard',
  'meadow',
  'allotments',
  'plant_nursery',
  'greenhouse_horticulture',
  'grass',
];

// Overlap fraction that triggers the warning modal
export const OVERLAP_THRESHOLD = 0.15;

// Stroke + fill per non-ag land type (used by InvalidAreaOverlay)
export const NON_AG_STYLE = {
  residential:       { stroke: '#EF4444', fill: 'rgba(239,68,68,0.25)'   },
  commercial:        { stroke: '#F97316', fill: 'rgba(249,115,22,0.25)'  },
  industrial:        { stroke: '#A855F7', fill: 'rgba(168,85,247,0.25)'  },
  retail:            { stroke: '#F97316', fill: 'rgba(249,115,22,0.20)'  },
  construction:      { stroke: '#EAB308', fill: 'rgba(234,179,8,0.22)'   },
  military:          { stroke: '#6B7280', fill: 'rgba(107,114,128,0.25)' },
  cemetery:          { stroke: '#6B7280', fill: 'rgba(107,114,128,0.20)' },
  recreation_ground: { stroke: '#3B82F6', fill: 'rgba(59,130,246,0.20)'  },
  _default:          { stroke: '#EF4444', fill: 'rgba(239,68,68,0.22)'   },
};

// Human-readable labels for the warning modal (en / hi / gu)
export const NON_AG_LABEL = {
  residential:       { en: 'Residential Area',      hi: 'रहवासी क्षेत्र',    gu: 'રહેણાંક વિસ્તાર' },
  commercial:        { en: 'Commercial Zone',        hi: 'व्यावसायिक क्षेत्र', gu: 'વ્યાવસાયિક ઝોન'  },
  industrial:        { en: 'Industrial Area',        hi: 'औद्योगिक क्षेत्र',  gu: 'ઔદ્યોગિક ક્ષેત્ર' },
  retail:            { en: 'Market / Retail',        hi: 'बाज़ार',             gu: 'બજાર'             },
  construction:      { en: 'Under Construction',     hi: 'निर्माणाधीन',        gu: 'નિર્માણ હેઠળ'     },
  military:          { en: 'Restricted / Military',  hi: 'प्रतिबंधित क्षेत्र', gu: 'પ્રતિબંધિત ઝોન'   },
  cemetery:          { en: 'Cemetery',               hi: 'कब्रिस्तान',         gu: 'કબ્રસ્તાન'         },
  recreation_ground: { en: 'Recreation Ground',      hi: 'खेल का मैदान',       gu: 'મેદાન'            },
  _default:          { en: 'Non-Agricultural Area',  hi: 'गैर-कृषि क्षेत्र',   gu: 'બિન-ખેતી ક્ષેત્ર' },
};
