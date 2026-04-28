// Mapping des principales villes françaises vers (région, département)
// Utilisé pour enrichir les profils musiciens / groupes qui n'ont pas de
// région/département saisis explicitement.

const CITY_TO_LOCATION = {
  // Île-de-France
  "paris": { region: "Île-de-France", department: "75" },
  "boulogne-billancourt": { region: "Île-de-France", department: "92" },
  "saint-denis": { region: "Île-de-France", department: "93" },
  "argenteuil": { region: "Île-de-France", department: "95" },
  "montreuil": { region: "Île-de-France", department: "93" },
  "nanterre": { region: "Île-de-France", department: "92" },
  "vitry-sur-seine": { region: "Île-de-France", department: "94" },
  "créteil": { region: "Île-de-France", department: "94" },
  "creteil": { region: "Île-de-France", department: "94" },
  "aubervilliers": { region: "Île-de-France", department: "93" },
  "versailles": { region: "Île-de-France", department: "78" },
  "asnières-sur-seine": { region: "Île-de-France", department: "92" },
  "asnieres-sur-seine": { region: "Île-de-France", department: "92" },
  "colombes": { region: "Île-de-France", department: "92" },
  "rueil-malmaison": { region: "Île-de-France", department: "92" },
  "courbevoie": { region: "Île-de-France", department: "92" },
  "champigny-sur-marne": { region: "Île-de-France", department: "94" },
  "saint-maur-des-fossés": { region: "Île-de-France", department: "94" },
  "saint-maur-des-fosses": { region: "Île-de-France", department: "94" },
  "évry": { region: "Île-de-France", department: "91" },
  "evry": { region: "Île-de-France", department: "91" },
  "cergy": { region: "Île-de-France", department: "95" },
  "issy-les-moulineaux": { region: "Île-de-France", department: "92" },
  "levallois-perret": { region: "Île-de-France", department: "92" },

  // Auvergne-Rhône-Alpes
  "lyon": { region: "Auvergne-Rhône-Alpes", department: "69" },
  "villeurbanne": { region: "Auvergne-Rhône-Alpes", department: "69" },
  "saint-étienne": { region: "Auvergne-Rhône-Alpes", department: "42" },
  "saint-etienne": { region: "Auvergne-Rhône-Alpes", department: "42" },
  "grenoble": { region: "Auvergne-Rhône-Alpes", department: "38" },
  "clermont-ferrand": { region: "Auvergne-Rhône-Alpes", department: "63" },
  "annecy": { region: "Auvergne-Rhône-Alpes", department: "74" },
  "chambéry": { region: "Auvergne-Rhône-Alpes", department: "73" },
  "chambery": { region: "Auvergne-Rhône-Alpes", department: "73" },
  "valence": { region: "Auvergne-Rhône-Alpes", department: "26" },
  "vichy": { region: "Auvergne-Rhône-Alpes", department: "03" },
  "moulins": { region: "Auvergne-Rhône-Alpes", department: "03" },
  "aurillac": { region: "Auvergne-Rhône-Alpes", department: "15" },
  "le puy-en-velay": { region: "Auvergne-Rhône-Alpes", department: "43" },

  // Provence-Alpes-Côte d'Azur
  "marseille": { region: "Provence-Alpes-Côte d'Azur", department: "13" },
  "nice": { region: "Provence-Alpes-Côte d'Azur", department: "06" },
  "toulon": { region: "Provence-Alpes-Côte d'Azur", department: "83" },
  "aix-en-provence": { region: "Provence-Alpes-Côte d'Azur", department: "13" },
  "avignon": { region: "Provence-Alpes-Côte d'Azur", department: "84" },
  "antibes": { region: "Provence-Alpes-Côte d'Azur", department: "06" },
  "cannes": { region: "Provence-Alpes-Côte d'Azur", department: "06" },
  "fréjus": { region: "Provence-Alpes-Côte d'Azur", department: "83" },
  "frejus": { region: "Provence-Alpes-Côte d'Azur", department: "83" },
  "hyères": { region: "Provence-Alpes-Côte d'Azur", department: "83" },
  "hyeres": { region: "Provence-Alpes-Côte d'Azur", department: "83" },
  "gap": { region: "Provence-Alpes-Côte d'Azur", department: "05" },
  "digne-les-bains": { region: "Provence-Alpes-Côte d'Azur", department: "04" },

  // Occitanie
  "toulouse": { region: "Occitanie", department: "31" },
  "montpellier": { region: "Occitanie", department: "34" },
  "nîmes": { region: "Occitanie", department: "30" },
  "nimes": { region: "Occitanie", department: "30" },
  "perpignan": { region: "Occitanie", department: "66" },
  "béziers": { region: "Occitanie", department: "34" },
  "beziers": { region: "Occitanie", department: "34" },
  "albi": { region: "Occitanie", department: "81" },
  "carcassonne": { region: "Occitanie", department: "11" },
  "tarbes": { region: "Occitanie", department: "65" },
  "rodez": { region: "Occitanie", department: "12" },
  "cahors": { region: "Occitanie", department: "46" },
  "auch": { region: "Occitanie", department: "32" },
  "mende": { region: "Occitanie", department: "48" },
  "foix": { region: "Occitanie", department: "09" },
  "narbonne": { region: "Occitanie", department: "11" },
  "sète": { region: "Occitanie", department: "34" },
  "sete": { region: "Occitanie", department: "34" },

  // Nouvelle-Aquitaine
  "bordeaux": { region: "Nouvelle-Aquitaine", department: "33" },
  "limoges": { region: "Nouvelle-Aquitaine", department: "87" },
  "poitiers": { region: "Nouvelle-Aquitaine", department: "86" },
  "la rochelle": { region: "Nouvelle-Aquitaine", department: "17" },
  "pau": { region: "Nouvelle-Aquitaine", department: "64" },
  "bayonne": { region: "Nouvelle-Aquitaine", department: "64" },
  "biarritz": { region: "Nouvelle-Aquitaine", department: "64" },
  "niort": { region: "Nouvelle-Aquitaine", department: "79" },
  "agen": { region: "Nouvelle-Aquitaine", department: "47" },
  "périgueux": { region: "Nouvelle-Aquitaine", department: "24" },
  "perigueux": { region: "Nouvelle-Aquitaine", department: "24" },
  "bergerac": { region: "Nouvelle-Aquitaine", department: "24" },
  "brive-la-gaillarde": { region: "Nouvelle-Aquitaine", department: "19" },
  "tulle": { region: "Nouvelle-Aquitaine", department: "19" },
  "guéret": { region: "Nouvelle-Aquitaine", department: "23" },
  "gueret": { region: "Nouvelle-Aquitaine", department: "23" },
  "mont-de-marsan": { region: "Nouvelle-Aquitaine", department: "40" },
  "angoulême": { region: "Nouvelle-Aquitaine", department: "16" },
  "angouleme": { region: "Nouvelle-Aquitaine", department: "16" },
  "arcachon": { region: "Nouvelle-Aquitaine", department: "33" },

  // Pays de la Loire
  "nantes": { region: "Pays de la Loire", department: "44" },
  "angers": { region: "Pays de la Loire", department: "49" },
  "le mans": { region: "Pays de la Loire", department: "72" },
  "saint-nazaire": { region: "Pays de la Loire", department: "44" },
  "cholet": { region: "Pays de la Loire", department: "49" },
  "la roche-sur-yon": { region: "Pays de la Loire", department: "85" },
  "laval": { region: "Pays de la Loire", department: "53" },

  // Bretagne
  "rennes": { region: "Bretagne", department: "35" },
  "brest": { region: "Bretagne", department: "29" },
  "quimper": { region: "Bretagne", department: "29" },
  "lorient": { region: "Bretagne", department: "56" },
  "vannes": { region: "Bretagne", department: "56" },
  "saint-brieuc": { region: "Bretagne", department: "22" },
  "saint-malo": { region: "Bretagne", department: "35" },

  // Normandie
  "le havre": { region: "Normandie", department: "76" },
  "rouen": { region: "Normandie", department: "76" },
  "caen": { region: "Normandie", department: "14" },
  "cherbourg-en-cotentin": { region: "Normandie", department: "50" },
  "cherbourg": { region: "Normandie", department: "50" },
  "évreux": { region: "Normandie", department: "27" },
  "evreux": { region: "Normandie", department: "27" },
  "alençon": { region: "Normandie", department: "61" },
  "alencon": { region: "Normandie", department: "61" },

  // Hauts-de-France
  "lille": { region: "Hauts-de-France", department: "59" },
  "amiens": { region: "Hauts-de-France", department: "80" },
  "roubaix": { region: "Hauts-de-France", department: "59" },
  "tourcoing": { region: "Hauts-de-France", department: "59" },
  "dunkerque": { region: "Hauts-de-France", department: "59" },
  "calais": { region: "Hauts-de-France", department: "62" },
  "valenciennes": { region: "Hauts-de-France", department: "59" },
  "boulogne-sur-mer": { region: "Hauts-de-France", department: "62" },
  "lens": { region: "Hauts-de-France", department: "62" },
  "arras": { region: "Hauts-de-France", department: "62" },
  "beauvais": { region: "Hauts-de-France", department: "60" },
  "compiègne": { region: "Hauts-de-France", department: "60" },
  "compiegne": { region: "Hauts-de-France", department: "60" },
  "laon": { region: "Hauts-de-France", department: "02" },

  // Grand Est
  "strasbourg": { region: "Grand Est", department: "67" },
  "reims": { region: "Grand Est", department: "51" },
  "metz": { region: "Grand Est", department: "57" },
  "mulhouse": { region: "Grand Est", department: "68" },
  "nancy": { region: "Grand Est", department: "54" },
  "colmar": { region: "Grand Est", department: "68" },
  "troyes": { region: "Grand Est", department: "10" },
  "charleville-mézières": { region: "Grand Est", department: "08" },
  "charleville-mezieres": { region: "Grand Est", department: "08" },
  "épinal": { region: "Grand Est", department: "88" },
  "epinal": { region: "Grand Est", department: "88" },
  "chaumont": { region: "Grand Est", department: "52" },
  "bar-le-duc": { region: "Grand Est", department: "55" },
  "châlons-en-champagne": { region: "Grand Est", department: "51" },
  "chalons-en-champagne": { region: "Grand Est", department: "51" },

  // Bourgogne-Franche-Comté
  "dijon": { region: "Bourgogne-Franche-Comté", department: "21" },
  "besançon": { region: "Bourgogne-Franche-Comté", department: "25" },
  "besancon": { region: "Bourgogne-Franche-Comté", department: "25" },
  "belfort": { region: "Bourgogne-Franche-Comté", department: "90" },
  "auxerre": { region: "Bourgogne-Franche-Comté", department: "89" },
  "nevers": { region: "Bourgogne-Franche-Comté", department: "58" },
  "mâcon": { region: "Bourgogne-Franche-Comté", department: "71" },
  "macon": { region: "Bourgogne-Franche-Comté", department: "71" },
  "chalon-sur-saône": { region: "Bourgogne-Franche-Comté", department: "71" },
  "chalon-sur-saone": { region: "Bourgogne-Franche-Comté", department: "71" },
  "vesoul": { region: "Bourgogne-Franche-Comté", department: "70" },
  "lons-le-saunier": { region: "Bourgogne-Franche-Comté", department: "39" },

  // Centre-Val de Loire
  "tours": { region: "Centre-Val de Loire", department: "37" },
  "orléans": { region: "Centre-Val de Loire", department: "45" },
  "orleans": { region: "Centre-Val de Loire", department: "45" },
  "bourges": { region: "Centre-Val de Loire", department: "18" },
  "blois": { region: "Centre-Val de Loire", department: "41" },
  "chartres": { region: "Centre-Val de Loire", department: "28" },
  "châteauroux": { region: "Centre-Val de Loire", department: "36" },
  "chateauroux": { region: "Centre-Val de Loire", department: "36" },

  // Corse
  "ajaccio": { region: "Corse", department: "2A" },
  "bastia": { region: "Corse", department: "2B" },
};

/**
 * Enrichit un objet groupe / musicien avec sa région et son département
 * en se basant sur sa ville quand ces champs sont manquants ou vides.
 */
export function enrichWithLocation(item) {
  if (!item || typeof item !== "object") return item;

  const hasRegion = !!(item.region && String(item.region).trim());
  const hasDepartment = !!(item.department && String(item.department).trim());
  if (hasRegion && hasDepartment) return item;

  const city = item.city ? String(item.city).trim().toLowerCase() : "";
  if (!city) return item;

  const match = CITY_TO_LOCATION[city];
  if (!match) return item;

  return {
    ...item,
    region: hasRegion ? item.region : match.region,
    department: hasDepartment ? item.department : match.department,
  };
}

export default CITY_TO_LOCATION;
