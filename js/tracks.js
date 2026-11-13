/* ==========================================================================
   Focus tracks for the "Vorschläge" tab — a DRAFT that students can maintain.
   Each track says which elective modules fit it, in order of preference:
     b111      Wahlpflicht modules (B 1.1.1) that suit the track
     featured  Wahlbereich modules (B 1.1.2) most people with this focus take
     group     the Wahlbereich focus area (GROUPS.B112) the track belongs to
     kw        keywords that pick matching Seminare / Praktika (B 1.2) from the catalog
   Edit freely: codes must exist in js/catalog.js. When Notenspiegel data exists
   (js/gradestats.js), its result counts also count as "what most people take".
   ========================================================================== */
window.TRACKS = [
  {
    id: "ki", group: "KI", color: "B112",
    de: "Künstliche Intelligenz", en: "Artificial Intelligence",
    descDe: "Maschinelles Lernen, Deep Learning, Sprache und Bild.", descEn: "Machine learning, deep learning, language and vision.",
    b111: ["20-00-0014", "20-00-1156"],
    featured: ["20-00-0052", "20-00-0358", "20-00-1034", "20-00-0157", "20-00-0947", "20-00-1047", "20-00-0449", "20-00-1035"],
    kw: "lern|learning|\\bki\\b|künstlich|intellig|neural|deep|robot|vision|sprach|language|nlp|text|data|daten",
  },
  {
    id: "cyb", group: "CYB", color: "B112",
    de: "Cybersicherheit", en: "Cybersecurity",
    descDe: "IT-Sicherheit, Kryptographie, Netze und sichere Systeme.", descEn: "IT security, cryptography, networks and secure systems.",
    b111: ["20-00-0903", "20-00-0901"],
    featured: ["20-00-0219", "20-00-0085", "20-00-0512", "20-00-0581", "20-00-0993", "20-00-1010", "20-00-0063"],
    kw: "sicher|security|secure|krypt|crypt|privat|privacy|attack|angriff|bug|hack|blockchain|forensi|trust",
  },
  {
    id: "swhw", group: "SWHW", color: "B112",
    de: "Software & Hardware", en: "Software & Hardware",
    descDe: "Software-Engineering, Compiler, Grafik, HCI und parallele Systeme.", descEn: "Software engineering, compilers, graphics, HCI and parallel systems.",
    b111: ["20-00-0904", "20-00-0014"],
    featured: ["20-00-0040", "20-00-0794", "20-00-0701", "20-00-0419", "18-su-2010", "18-su-2020", "20-00-0160", "20-00-0535"],
    kw: "software|compiler|programm|hardware|embedded|graphi|visual|hci|interaktion|interaction|engineering|parallel|echtzeit|agile|app|game|spiel",
  },
  {
    id: "kvs", group: "KVS", color: "B112",
    de: "Netze & verteilte Systeme", en: "Networks & distributed systems",
    descDe: "Verteilte Systeme, Kommunikationsnetze, Mobile Computing, Daten-Management.", descEn: "Distributed systems, communication networks, mobile computing, data management.",
    b111: ["20-00-0903", "20-00-1156"],
    featured: ["20-00-0065", "18-sm-1010", "20-00-0748", "20-00-1017", "18-sm-2280", "20-00-0120", "20-00-1039"],
    kw: "netz|network|verteilt|distributed|cloud|iot|mobile|ubiquit|data management|datenbank|database|kommunikation|communication|peer",
  },
  {
    id: "theo", group: "THEO", color: "B112",
    de: "Theorie", en: "Theory",
    descDe: "Algorithmen, Optimierung, Verifikation und Quantencomputing.", descEn: "Algorithms, optimisation, verification and quantum computing.",
    b111: ["20-00-0901", "20-00-0904"],
    featured: ["20-00-0110", "20-00-0667", "20-00-1069", "20-00-1136", "20-00-0113", "20-00-0580", "20-00-0660"],
    kw: "theor|logik|logic|algorith|komplex|complex|formal|beweis|proof|verifi|semantik|semantic|graph|quant|optimier|concurrency",
  },
  {
    id: "broad", group: null, color: "B111",
    de: "Breit aufgestellt", en: "Broad mix",
    descDe: "Von allem etwas – gut, wenn du dich noch nicht festlegen willst.", descEn: "A bit of everything – good if you don't want to commit yet.",
    b111: ["20-00-0903", "20-00-0014", "20-00-0904"],
    featured: ["20-00-0052", "20-00-0219", "20-00-0040", "20-00-0065", "20-00-0110", "20-00-0358"],
    kw: "",
  },
];
