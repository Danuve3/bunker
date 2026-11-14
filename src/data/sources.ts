/**
 * Bibliografía. Los módulos de datos y las fichas "Dato real" citan estas fuentes por id.
 * Si un valor es una simplificación de juego, el comentario junto al valor lo indica.
 */
export interface Source {
  org: string;
  title: string;
  url: string;
}

export const SOURCES = {
  fema_water: {
    org: 'FEMA / Ready.gov',
    title: 'Water (Build a Kit): 1 galón (~3,8 L) por persona y día',
    url: 'https://www.ready.gov/water',
  },
  cdc_water: {
    org: 'CDC',
    title: 'How to Make Water Safe in an Emergency',
    url: 'https://www.cdc.gov/water-emergency/about/',
  },
  kearny_nwss: {
    org: 'C. H. Kearny, Oak Ridge National Laboratory',
    title: 'Nuclear War Survival Skills (1987)',
    url: 'https://www.oism.org/nwss/',
  },
  glasstone: {
    org: 'Glasstone & Dolan (DoD/ERDA)',
    title: 'The Effects of Nuclear Weapons, 3.ª ed. (1977)',
    url: 'https://www.osti.gov/biblio/6852629',
  },
  fema_nuclear: {
    org: 'FEMA / Ready.gov',
    title: 'Nuclear Explosion: ponerse a cubierto, permanecer dentro',
    url: 'https://www.ready.gov/nuclear-explosion',
  },
  cdc_ars: {
    org: 'CDC',
    title: 'Acute Radiation Syndrome: Information for Clinicians',
    url: 'https://www.cdc.gov/radiation-emergencies/hcp/clinical-guidance/ars.html',
  },
  afrri: {
    org: 'AFRRI (Armed Forces Radiobiology Research Institute)',
    title: 'Medical Management of Radiological Casualties',
    url: 'https://afrri.usuhs.edu/',
  },
  who_ki: {
    org: 'OMS',
    title: 'Iodine thyroid blocking: guidelines for use in planning for radiation emergencies',
    url: 'https://www.who.int/publications/i/item/9789240089556',
  },
  niosh_co2: {
    org: 'NIOSH',
    title: 'Pocket Guide to Chemical Hazards: Carbon dioxide',
    url: 'https://www.cdc.gov/niosh/npg/npgd0103.html',
  },
  nasa_bvad: {
    org: 'NASA',
    title: 'Life Support Baseline Values and Assumptions Document',
    url: 'https://ntrs.nasa.gov/citations/20180001338',
  },
  cdc_co: {
    org: 'CDC',
    title: 'Carbon Monoxide Poisoning: generadores y espacios cerrados',
    url: 'https://www.cdc.gov/carbon-monoxide/',
  },
  niosh_cold: {
    org: 'NIOSH / CDC',
    title: 'Cold Stress: hipotermia',
    url: 'https://www.cdc.gov/niosh/cold-stress/',
  },
  efsa_energy: {
    org: 'EFSA',
    title: 'Scientific Opinion on Dietary Reference Values for energy (2013)',
    url: 'https://www.efsa.europa.eu/en/efsajournal/pub/3005',
  },
  pa_compendium: {
    org: 'Compendium of Physical Activities',
    title: 'Gasto energético (MET) por actividad',
    url: 'https://pacompendium.com/',
  },
  who_ors: {
    org: 'OMS / UNICEF',
    title: 'Sales de rehidratación oral (SRO) para la diarrea',
    url: 'https://www.who.int/news-room/fact-sheets/detail/diarrhoeal-disease',
  },
  who_dehydration: {
    org: 'OMS',
    title: 'Diarrhoeal disease: deshidratación y pérdida de líquidos',
    url: 'https://www.who.int/news-room/fact-sheets/detail/diarrhoeal-disease',
  },
  niosh_n95: {
    org: 'NIOSH / norma EN 149',
    title: 'Respiradores N95 (≥95 %) y FFP2 (≥94 %)',
    url: 'https://www.cdc.gov/niosh/npptl/topics/respirators/disp_part/',
  },
  doe_hepa: {
    org: 'U.S. DOE',
    title: 'DOE-STD-3020: filtros HEPA, 99,97 % a 0,3 µm',
    url: 'https://www.standards.doe.gov/standards-documents/3000/3020-astd-2015',
  },
  proteccion_civil: {
    org: 'Protección Civil (España)',
    title: 'Autoprotección: mochila y kit de emergencia (72 h)',
    url: 'https://www.proteccioncivil.es/',
  },
  sanidad_lejia: {
    org: 'Ministerio de Sanidad (España)',
    title: 'Lejía "apta para la desinfección del agua de bebida"',
    url: 'https://www.sanidad.gob.es/',
  },
  noaa_swpc: {
    org: 'NOAA Space Weather Prediction Center',
    title: 'NOAA Space Weather Scales (G1–G5)',
    url: 'https://www.swpc.noaa.gov/noaa-scales-explanation',
  },
  cdc_flu: {
    org: 'CDC',
    title: 'Influenza: periodo de incubación y transmisión',
    url: 'https://www.cdc.gov/flu/about/',
  },
  ashrae_ground: {
    org: 'ASHRAE / geotermia somera',
    title: 'La temperatura del subsuelo a >2-3 m ≈ media anual del aire',
    url: 'https://www.energy.gov/energysaver/geothermal-heat-pumps',
  },
  cdc_botulism: {
    org: 'CDC',
    title: 'Botulism: no consumir latas abombadas, con fugas o que salpican al abrir',
    url: 'https://www.cdc.gov/botulism/prevention/',
  },
  ine_precios: {
    org: 'Precios orientativos de mercado en España (2025)',
    title: 'Supermercados, ferreterías y gasolineras: valores medios aproximados',
    url: 'https://www.ine.es/',
  },
} as const satisfies Record<string, Source>;

export type SourceId = keyof typeof SOURCES;
