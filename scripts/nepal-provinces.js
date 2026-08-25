/**
 * Nepal administrative helpers for Strapi sync.
 * PAD "state" often stores districts / old zones / cities — map to the official 7 provinces.
 * Sources: Constitution of Nepal Schedule 4 / standard district→province lists.
 */

const NEPAL_PROVINCES = [
  'Koshi',
  'Madhesh',
  'Bagmati',
  'Gandaki',
  'Lumbini',
  'Karnali',
  'Sudurpashchim',
];

/** Official district (or common spelling) → province. Keys UPPERCASE. */
const DISTRICT_TO_PROVINCE = {
  // Koshi (Province 1)
  BHOJPUR: 'Koshi',
  DHANKUTA: 'Koshi',
  ILAM: 'Koshi',
  JHAPA: 'Koshi',
  KHOTANG: 'Koshi',
  MORANG: 'Koshi',
  OKHALDHUNGA: 'Koshi',
  PANCHTHAR: 'Koshi',
  SANKHUWASABHA: 'Koshi',
  SOLUKHUMBU: 'Koshi',
  SUNSARI: 'Koshi',
  TAPLEJUNG: 'Koshi',
  TERHATHUM: 'Koshi',
  TEHRATHUM: 'Koshi',
  UDAYAPUR: 'Koshi',

  // Madhesh (Province 2)
  BARA: 'Madhesh',
  DHANUSA: 'Madhesh',
  DHANUSHA: 'Madhesh',
  MAHOTTARI: 'Madhesh',
  PARSA: 'Madhesh',
  RAUTAHAT: 'Madhesh',
  SAPTARI: 'Madhesh',
  SARLAHI: 'Madhesh',
  SIRAHA: 'Madhesh',

  // Bagmati (Province 3)
  BHAKTAPUR: 'Bagmati',
  CHITWAN: 'Bagmati',
  CHITAWAN: 'Bagmati',
  DHADING: 'Bagmati',
  DOLAKHA: 'Bagmati',
  DOLKHA: 'Bagmati',
  KAVREPALANCHOK: 'Bagmati',
  KAVERPALANCHOK: 'Bagmati',
  KABHREPALANCHOK: 'Bagmati',
  KATHMANDU: 'Bagmati',
  LALITPUR: 'Bagmati',
  MAKWANPUR: 'Bagmati',
  MAKAWANPUR: 'Bagmati',
  NUWAKOT: 'Bagmati',
  RAMECHHAP: 'Bagmati',
  RASUWA: 'Bagmati',
  SINDHULI: 'Bagmati',
  SINDHUPALCHOK: 'Bagmati',
  SINDHUPALCHOWK: 'Bagmati',

  // Gandaki (Province 4)
  BAGLUNG: 'Gandaki',
  GORKHA: 'Gandaki',
  KASKI: 'Gandaki',
  LAMJUNG: 'Gandaki',
  MANANG: 'Gandaki',
  MUSTANG: 'Gandaki',
  MYAGDI: 'Gandaki',
  NAWALPUR: 'Gandaki',
  PARBAT: 'Gandaki',
  SYANGJA: 'Gandaki',
  TANAHU: 'Gandaki',
  TANAHUN: 'Gandaki',

  // Lumbini (Province 5)
  ARGHAKHANCHI: 'Lumbini',
  BANKE: 'Lumbini',
  BARDIYA: 'Lumbini',
  DANG: 'Lumbini',
  GULMI: 'Lumbini',
  KAPILVASTU: 'Lumbini',
  KAPILBASTU: 'Lumbini',
  NAWALPARASI: 'Lumbini', // pre-split / west side default
  PARASI: 'Lumbini',
  PALPA: 'Lumbini',
  PYUTHAN: 'Lumbini',
  ROLPA: 'Lumbini',
  'RUKUM EAST': 'Lumbini',
  RUKUMEAST: 'Lumbini',
  RUPANDEHI: 'Lumbini',

  // Karnali (Province 6)
  DAILEKH: 'Karnali',
  DOLPA: 'Karnali',
  HUMLA: 'Karnali',
  JAJARKOT: 'Karnali',
  JUMLA: 'Karnali',
  KALIKOT: 'Karnali',
  MUGU: 'Karnali',
  'RUKUM WEST': 'Karnali',
  RUKUMWEST: 'Karnali',
  RUKUM: 'Karnali', // ambiguous; majority west/karnali in PAD sample
  SALYAN: 'Karnali',
  SURKHET: 'Karnali',

  // Sudurpashchim (Province 7)
  ACHHAM: 'Sudurpashchim',
  BAITADI: 'Sudurpashchim',
  BAJHANG: 'Sudurpashchim',
  BAJURA: 'Sudurpashchim',
  DADELDHURA: 'Sudurpashchim',
  DARCHULA: 'Sudurpashchim',
  DOTI: 'Sudurpashchim',
  KAILALI: 'Sudurpashchim',
  KANCHANPUR: 'Sudurpashchim',
};

/** Old zones / province labels / misc PAD state values → province. Keys UPPERCASE. */
const STATE_ALIASES_TO_PROVINCE = {
  KOSHI: 'Koshi',
  'PROVINCE NO. 1': 'Koshi',
  'PROVINCE NO 1': 'Koshi',
  'PROVINCE 1': 'Koshi',
  MECHI: 'Koshi',
  SAGARMATHA: 'Koshi',

  MADHESH: 'Madhesh',
  MADESH: 'Madhesh',
  'PROVINCE NO. 2': 'Madhesh',
  'PROVINCE 2': 'Madhesh',
  JANAKPUR: 'Madhesh',

  BAGMATI: 'Bagmati',
  'PROVINCE NO. 3': 'Bagmati',
  'PROVINCE 3': 'Bagmati',
  NARAYANI: 'Bagmati',

  GANDAKI: 'Gandaki',
  'PROVINCE NO. 4': 'Gandaki',
  'PROVINCE 4': 'Gandaki',
  DHAWALAGIRI: 'Gandaki',
  DHAULAGIRI: 'Gandaki',

  LUMBINI: 'Lumbini',
  'PROVINCE NO. 5': 'Lumbini',
  'PROVINCE 5': 'Lumbini',

  KARNALI: 'Karnali',
  'PROVINCE NO. 6': 'Karnali',
  'PROVINCE 6': 'Karnali',
  BHERI: 'Karnali',

  SUDURPASHCHIM: 'Sudurpashchim',
  SUDURPASCHIM: 'Sudurpashchim',
  'SUDUR PASHCHIM': 'Sudurpashchim',
  'PROVINCE NO. 7': 'Sudurpashchim',
  'PROVINCE 7': 'Sudurpashchim',
  SETI: 'Sudurpashchim',
  'SETI ZONE': 'Sudurpashchim',
  MAHAKALI: 'Sudurpashchim',
};

/** Locality / city names seen as PAD district or state → province. */
const LOCALITY_TO_PROVINCE = {
  // Kathmandu valley localities
  BANSBARI: 'Bagmati',
  CHABAHIL: 'Bagmati',
  GAUCHAR: 'Bagmati',
  KALIMATI: 'Bagmati',
  MANMAIJU: 'Bagmati',
  SANKHU: 'Bagmati',
  'SARBOCHCHA ADALAT': 'Bagmati',
  THIMI: 'Bagmati',
  DUBAKOT: 'Bagmati',
  LUBHU: 'Bagmati',
  BANEPA: 'Bagmati',
  KHOPASI: 'Bagmati',
  PANCHKHAL: 'Bagmati',
  HETAUDA: 'Bagmati',
  HATIYA: 'Bagmati',
  NARAYANGARH: 'Bagmati',
  BHANDARA: 'Bagmati',
  JUTPANI: 'Bagmati',
  KHAIRAHANI: 'Bagmati',
  PATIHANI: 'Bagmati',
  RAMPUR: 'Bagmati', // also exists elsewhere; Bagmati Chitwan uses this often
  RATNANAGAR: 'Bagmati',
  BARABISE: 'Bagmati',
  JIRI: 'Bagmati',
  GAJURI: 'Bagmati',
  KHANIKHOLA: 'Bagmati',
  MALEKHU: 'Bagmati',

  // Koshi localities
  'BIRATNAGAR BAZAR': 'Koshi',
  JHORAHAT: 'Koshi',
  MADHUMALLA: 'Koshi',
  RANGELI: 'Koshi',
  URLABARI: 'Koshi',
  BIRTAMOD: 'Koshi',
  CHANDRAGADHI: 'Koshi',
  DAMAK: 'Koshi',
  DHULABARI: 'Koshi',
  GAURIGUNJ: 'Koshi',
  GOLDHAP: 'Koshi',
  KANKARBHITTA: 'Koshi',
  CHATARA: 'Koshi',
  DUHABI: 'Koshi',
  INARAUWA: 'Koshi',
  ITAHARI: 'Koshi',
  BELTAR: 'Koshi',
  KATARI: 'Koshi',
  CHAINPUR: 'Koshi',

  // Madhesh localities
  BAYALBAS: 'Madhesh',
  HARIAUN: 'Madhesh',
  LALBANDI: 'Madhesh',
  LAHAN: 'Madhesh',
  SUKHIPUR: 'Madhesh',
  BARIYARPUR: 'Madhesh',
  'JEETPUR (BHAVANIPUR)': 'Madhesh',
  NIJGADH: 'Madhesh',
  SIMARA: 'Madhesh',
  BARDIBAS: 'Madhesh',
  GAUSHALA: 'Madhesh',
  CHHINNAMASTA: 'Madhesh',
  PATO: 'Madhesh',
  PHATTEPUR: 'Madhesh',
  'CHANDRA NIGAHAPUR': 'Madhesh',
  'SAKHUWA MAHENDRANAGAR': 'Madhesh',
  YADUKUHA: 'Madhesh',

  // Gandaki localities
  'AANBU KHAIRENİ': 'Gandaki',
  'AANBU KHAIRENI': 'Gandaki',
  BANDIPUR: 'Gandaki',
  DEVGHAT: 'Gandaki',
  DUMRE: 'Gandaki',
  KHAIRENITAR: 'Gandaki',
  GALYANG: 'Gandaki',
  JHARKHAM: 'Gandaki',
  GALKOT: 'Gandaki',
  MANAKAMANA: 'Gandaki',
  'SUNDAR BAZAR': 'Gandaki',
  GAINDAKOT: 'Gandaki', // Nawalpur (Gandaki)

  // Lumbini localities
  AMUWA: 'Lumbini',
  BUTWAL: 'Lumbini',
  LUMBINI: 'Lumbini',
  MANIGRAM: 'Lumbini',
  PARROHA: 'Lumbini',
  SALJHANDI: 'Lumbini',
  'SAURAHA PHARSA': 'Lumbini',
  KOHALPUR: 'Lumbini',
  CHANAUTA: 'Lumbini',
  KRISHNANAGAR: 'Lumbini',
  PIPARA: 'Lumbini',
  ARYABHANJYANG: 'Lumbini',
  MADANPOKHARA: 'Lumbini',
  CHANDRAKOT: 'Lumbini',
  RIDI: 'Lumbini',
  WAMI: 'Lumbini',
  GHORAHI: 'Lumbini',
  LAMAHI: 'Lumbini',
  TULSIPUR: 'Lumbini',
  MOTIPUR: 'Lumbini',
  SANOSHRI: 'Lumbini',
  DUMKAULI: 'Lumbini',
  MAHESHPUR: 'Lumbini',
  MAKAR: 'Lumbini',
  SEMARI: 'Lumbini',
  SUNAWAL: 'Lumbini',
  TRIBENI: 'Lumbini',
  BIJUWAR: 'Lumbini',

  // Karnali localities
  // (mostly district-named)

  // Sudurpashchim localities
  MASURIYA: 'Sudurpashchim',
  MUNUWA: 'Sudurpashchim',
  TIKAPUR: 'Sudurpashchim',
  ATARIYA: 'Sudurpashchim',
  ABHAY: 'Sudurpashchim',
};

function normKey(value) {
  return (value || '')
    .toUpperCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Resolve official province for a PAD Nepal center.
 * Order: existing province label → state-as-district → district field → locality hints.
 */
function resolveNepalProvince(state, district) {
  const s = normKey(state);
  const d = normKey(district);

  if (NEPAL_PROVINCES.some((p) => p.toUpperCase() === s)) {
    return NEPAL_PROVINCES.find((p) => p.toUpperCase() === s);
  }

  // Split districts: locality decides province before the broad Nawalparasi/Rukum default
  if ((s === 'NAWALPARASI' || s === 'RUKUM') && LOCALITY_TO_PROVINCE[d]) {
    return LOCALITY_TO_PROVINCE[d];
  }

  // If PAD "state" is already an admin district name, trust it over locality names
  // that collide with other districts (e.g. Saptari / Kanchanpur locality).
  if (DISTRICT_TO_PROVINCE[s]) return DISTRICT_TO_PROVINCE[s];

  // Locality hints (cities/towns) and district-field admin names
  if (LOCALITY_TO_PROVINCE[d]) return LOCALITY_TO_PROVINCE[d];
  if (DISTRICT_TO_PROVINCE[d]) return DISTRICT_TO_PROVINCE[d];
  if (LOCALITY_TO_PROVINCE[s]) return LOCALITY_TO_PROVINCE[s];

  // Old zones / province labels (broad — use last)
  if (STATE_ALIASES_TO_PROVINCE[s]) return STATE_ALIASES_TO_PROVINCE[s];

  for (const [key, province] of Object.entries(DISTRICT_TO_PROVINCE)) {
    if (key.length >= 5 && (s.includes(key) || d.includes(key))) return province;
  }

  return null;
}

module.exports = {
  NEPAL_PROVINCES,
  resolveNepalProvince,
};
