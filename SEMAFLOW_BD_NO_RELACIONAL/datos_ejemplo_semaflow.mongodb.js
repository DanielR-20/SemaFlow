// Script de inserción de datos de ejemplo - SEMAFLOW
// Compatible con MongoDB for VS Code Playground y mongosh
// Inserta 130 documentos: 40 users + 50 traffic_reports + 40 routes

use("SEMAFLOW");
db = db.getSiblingDB("SEMAFLOW");

print("Limpiando datos previos...\n");
db.users.deleteMany({});
db.traffic_reports.deleteMany({});
db.routes.deleteMany({});

// --- Insertando 40 usuarios ---
print("Insertando 40 usuarios...");

const nombres = ["Carlos", "Ana", "Luis", "María", "Jorge", "Lucía", "Diego", "Sofía", "Fernando", "Valeria",
                 "Mateo", "Camila", "Sebastián", "Valentina", "Gabriel", "Mariana", "Alejandro", "Ximena", "Daniel", "Paula",
                 "Rodrigo", "Gabriela", "Andrés", "Daniela", "Hugo", "Elena", "Ricardo", "Adriana", "Marcos", "Rosa",
                 "Esteban", "Natalia", "Javier", "Victoria", "Óscar", "Claudia", "Emilio", "Lorena", "Gonzalo", "Isabel"];

const apellidos = ["Mendoza", "García", "Rodríguez", "López", "Martínez", "Sánchez", "Pérez", "Gómez", "Torres", "Flores",
                   "Vásquez", "Ramos", "Castro", "Rojas", "Chávez", "Quispe", "Huamán", "Salazar", "Mejía", "Cortez",
                   "Paredes", "Espinoza", "Silva", "Delgado", "Cabrera", "Alva", "León", "Reyes", "Vargas", "Ortiz",
                   "Ríos", "Aguilar", "Campos", "Herrera", "Maldonado", "Romero", "Cruz", "Palomino", "Soto", "Morales"];

const usuarios = [];
for (let i = 0; i < 40; i++) {
  const hexIndex = (i + 1).toString(16).padStart(2, "0");
  const userId = `64b0000000000000000000${hexIndex}`;

  usuarios.push({
    _id: userId,
    first_name: nombres[i],
    last_name: apellidos[i],
    email: `${nombres[i].toLowerCase()}.${apellidos[i].toLowerCase()}_${i + 1}@semaflow.com`,
    password_hash: `$2b$10$hashSeguroSemaFlow${i + 1}xyz`,
    reputation_score: 50 + ((i * 7) % 51),
    is_active: i !== 13 && i !== 27,
    register_date: `2026-06-${((i % 28) + 1).toString().padStart(2, "0")}`,
    reports: [
      {
        report_id: 1000 + i,
        severity_level: i % 3 === 0 ? "Alta" : (i % 2 === 0 ? "Media" : "Baja"),
        status: i % 4 === 0 ? "Resuelto" : "Verificado",
        register_date: `2026-07-${((i % 10) + 1).toString().padStart(2, "0")}`
      }
    ]
  });
}

db.users.insertMany(usuarios);
print("  -> " + db.users.countDocuments() + " usuarios insertados.");

// --- Insertando 50 reportes de tráfico ---
print("\nInsertando 50 reportes de tráfico...");

const puntosReferencia = [
  "Cruce Av. Javier Prado con Av. Arequipa",
  "Óvalo Monitor Huáscar",
  "Cruce Av. Universitaria con Av. La Marina",
  "Av. Brasil cuadra 15",
  "Av. Salaverry cerca de Real Plaza",
  "Intersección Vía Expresa con Av. Benavides",
  "Av. Tomás Marsano con Av. Angamos",
  "Av. Elmer Faucett frente al Aeropuerto",
  "Óvalo Higuereta",
  "Cruce Av. Colonial con Av. Faucett",
  "Av. Canadá con Av. Aviación",
  "Av. Túpac Amaru estación Naranjal",
  "Av. Próceres de la Independencia cuadra 20",
  "Cruce Av. Primavera con Av. Encalada",
  "Av. Tacna con Av. Emancipación"
];

const avenidas = [
  { id: 501, name: "Av. Javier Prado", district: "San Isidro" },
  { id: 502, name: "Av. Arequipa", district: "Miraflores" },
  { id: 503, name: "Av. La Marina", district: "San Miguel" },
  { id: 504, name: "Av. Brasil", district: "Jesús María" },
  { id: 505, name: "Av. Salaverry", district: "Lince" },
  { id: 506, name: "Av. Benavides", district: "Surco" },
  { id: 507, name: "Av. Angamos", district: "Surquillo" },
  { id: 508, name: "Av. Elmer Faucett", district: "Callao" },
  { id: 509, name: "Av. Aviación", district: "San Borja" },
  { id: 510, name: "Av. Tacna", district: "Cercado de Lima" }
];

const tiposIncidente = [
  { id: 10, name: "Semáforo Averiado", default_severity: "Alta" },
  { id: 11, name: "Congestión Severa", default_severity: "Alta" },
  { id: 12, name: "Obras en la Vía", default_severity: "Media" },
  { id: 13, name: "Accidente Vehicular", default_severity: "Crítica" },
  { id: 14, name: "Vehículo Varado", default_severity: "Media" },
  { id: 15, name: "Desvío Temporal", default_severity: "Baja" }
];

const nivelesSeveridad = ["Baja", "Media", "Alta", "Crítica"];
const estadosReporte = ["Activo", "Verificado", "En Revisión", "Resuelto"];

const reportes = [];
for (let i = 0; i < 50; i++) {
  const refIdx = i % puntosReferencia.length;
  const avIdx = i % avenidas.length;
  const incIdx = i % tiposIncidente.length;
  const sevIdx = i % 4;
  const estIdx = Math.floor(i / 2) % 4;
  const userIdx = i % 40;

  const latBase = -12.0800 + ((i % 10) * -0.005);
  const lngBase = -77.0300 + ((i % 8) * -0.004);

  const dia = ((i % 10) + 1).toString().padStart(2, "0");
  const hora = ((i % 14) + 7).toString().padStart(2, "0");
  const min = ((i * 13) % 60).toString().padStart(2, "0");

  reportes.push({
    reference_point: puntosReferencia[refIdx] + " (Punto #" + (i + 1) + ")",
    latitude: Number(latBase.toFixed(4)),
    longitude: Number(lngBase.toFixed(4)),
    severity_level: nivelesSeveridad[sevIdx],
    description: "Incidente reportado en " + avenidas[avIdx].name + ": " + tiposIncidente[incIdx].name + ". Tránsito lento en la zona.",
    status: estadosReporte[estIdx],
    register_date: new Date("2026-07-" + dia + "T" + hora + ":" + min + ":00Z"),
    user: {
      id: userIdx + 1,
      first_name: nombres[userIdx],
      reputation_score: 50 + ((userIdx * 7) % 51)
    },
    incident_type: tiposIncidente[incIdx],
    avenue: avenidas[avIdx],
    images: [
      {
        image_url: "https://media.semaflow.com/reports/2026/07/img_" + (2000 + i) + ".jpg",
        file_size: 150000 + ((i * 11000) % 300000),
        uploaded_date: new Date("2026-07-" + dia + "T" + hora + ":" + min + ":15Z")
      }
    ],
    votes: [
      {
        user_id: ((userIdx + 1) % 40) + 1,
        is_upvote: true,
        voted_date: new Date("2026-07-" + dia + "T" + hora + ":" + min + ":45Z")
      },
      {
        user_id: ((userIdx + 2) % 40) + 1,
        is_upvote: i % 5 !== 0,
        voted_date: new Date("2026-07-" + dia + "T" + hora + ":" + min + ":55Z")
      }
    ]
  });
}

db.traffic_reports.insertMany(reportes);
print("  -> " + db.traffic_reports.countDocuments() + " reportes insertados.");

// --- Insertando 40 consultas de rutas ---
print("\nInsertando 40 consultas de rutas...");

const zonas = [
  "San Isidro Centro Financiero",
  "Miraflores Óvalo Gutiérrez",
  "Vía Expresa Paseo de la República",
  "Av. Arequipa Corredor Azul",
  "San Borja Sur",
  "Surco Chacarilla",
  "Jesús María Centro",
  "Callao Aeropuerto Corredor"
];

const rutas = [];
for (let i = 0; i < 40; i++) {
  const userIdx = i % 40;
  const dia = ((i % 10) + 1).toString().padStart(2, "0");
  const hora = ((i % 12) + 8).toString().padStart(2, "0");

  const origLat = -12.0900 + ((i % 5) * -0.004);
  const origLng = -77.0350 + ((i % 6) * 0.003);
  const destLat = -12.1150 + ((i % 4) * 0.005);
  const destLng = -77.0250 + ((i % 5) * -0.004);

  rutas.push({
    consulted_date: new Date("2026-07-" + dia + "T" + hora + ":15:00Z"),
    user: {
      id: userIdx + 1,
      first_name: nombres[userIdx]
    },
    origin: {
      latitude: Number(origLat.toFixed(4)),
      longitude: Number(origLng.toFixed(4))
    },
    destination: {
      latitude: Number(destLat.toFixed(4)),
      longitude: Number(destLng.toFixed(4))
    },
    suggestions: [
      {
        estimated_time: 15 + (i % 25),
        distance: Number((3.5 + (i % 8) * 0.7).toFixed(1)),
        congestion_level: i % 3 === 0 ? "Alta" : "Media",
        is_recommended: true,
        zone: zonas[i % zonas.length]
      },
      {
        estimated_time: 22 + (i % 30),
        distance: Number((4.1 + (i % 8) * 0.8).toFixed(1)),
        congestion_level: "Alta",
        is_recommended: false,
        zone: zonas[(i + 1) % zonas.length]
      }
    ]
  });
}

db.routes.insertMany(rutas);
print("  -> " + db.routes.countDocuments() + " consultas de rutas insertadas.");

const totalDocs = db.users.countDocuments() + db.traffic_reports.countDocuments() + db.routes.countDocuments();
print("\nSeeding completado. Total de documentos: " + totalDocs + "\n");

// Valor de retorno final para que se muestre claramente en Playground Result de VS Code:
({
  status: "Seeding completado exitosamente",
  database: "SEMAFLOW",
  insertedCounts: {
    users: db.users.countDocuments(),
    traffic_reports: db.traffic_reports.countDocuments(),
    routes: db.routes.countDocuments(),
    total: totalDocs
  }
});
