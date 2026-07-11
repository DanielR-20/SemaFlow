// 10 Consultas funcionales para SEMAFLOW
// Compatible tanto con consola (mongosh) como con VS Code Playground Result
// Cada una responde a una necesidad real del sistema de gestión de tráfico.

use("SEMAFLOW");
db = db.getSiblingDB("SEMAFLOW");

// --- Consulta 1: Incidentes activos de alta severidad ---
print("\n--- Consulta 1: Incidentes activos de alta severidad ---\n");
const q1 = db.traffic_reports.find(
  {
    status: { $in: ["Activo", "Verificado"] },
    severity_level: { $in: ["Alta", "Crítica"] }
  },
  {
    _id: 0,
    reference_point: 1,
    severity_level: 1,
    status: 1,
    "incident_type.name": 1,
    "avenue.name": 1,
    "avenue.district": 1,
    register_date: 1
  }
).sort({ register_date: -1 }).toArray();
q1.forEach(doc => printjson(doc));


// --- Consulta 2: Ranking de distritos con más incidentes ---
print("\n--- Consulta 2: Ranking de distritos con más incidentes ---\n");
const q2 = db.traffic_reports.aggregate([
  {
    $group: {
      _id: "$avenue.district",
      total_incidentes: { $sum: 1 },
      incidentes_criticos: {
        $sum: { $cond: [{ $in: ["$severity_level", ["Alta", "Crítica"]] }, 1, 0] }
      },
      tipos_frecuentes: { $addToSet: "$incident_type.name" }
    }
  },
  { $sort: { total_incidentes: -1 } },
  {
    $project: {
      distrito: "$_id",
      _id: 0,
      total_incidentes: 1,
      incidentes_criticos: 1,
      tipos_frecuentes: 1
    }
  }
]).toArray();
q2.forEach(doc => printjson(doc));


// --- Consulta 3: Top 10 usuarios con mayor reputación ---
print("\n--- Consulta 3: Top 10 usuarios con mayor reputación ---\n");
const q3 = db.users.find(
  {
    is_active: true,
    reputation_score: { $gte: 80 }
  },
  {
    _id: 0,
    first_name: 1,
    last_name: 1,
    email: 1,
    reputation_score: 1,
    register_date: 1
  }
).sort({ reputation_score: -1 }).limit(10).toArray();
q3.forEach(doc => printjson(doc));


// --- Consulta 4: Tipos de incidentes más reportados ---
print("\n--- Consulta 4: Tipos de incidentes más reportados ---\n");
const q4 = db.traffic_reports.aggregate([
  {
    $group: {
      _id: "$incident_type.name",
      total: { $sum: 1 },
      severidad_predominante: { $first: "$incident_type.default_severity" },
      distritos_afectados: { $addToSet: "$avenue.district" }
    }
  },
  { $sort: { total: -1 } },
  {
    $project: {
      tipo_incidente: "$_id",
      _id: 0,
      total: 1,
      severidad_predominante: 1,
      cantidad_distritos: { $size: "$distritos_afectados" }
    }
  }
]).toArray();
q4.forEach(doc => printjson(doc));


// --- Consulta 5: Rutas con congestión alta ---
print("\n--- Consulta 5: Rutas con congestión alta ---\n");
const q5 = db.routes.aggregate([
  { $unwind: "$suggestions" },
  { $match: { "suggestions.congestion_level": "Alta" } },
  {
    $project: {
      _id: 0,
      consulted_date: 1,
      "user.first_name": 1,
      zona: "$suggestions.zone",
      tiempo_estimado_min: "$suggestions.estimated_time",
      distancia_km: "$suggestions.distance",
      es_recomendada: "$suggestions.is_recommended"
    }
  },
  { $sort: { tiempo_estimado_min: -1 } },
  { $limit: 15 }
]).toArray();
q5.forEach(doc => printjson(doc));


// --- Consulta 6: Reportes pendientes de verificación (últimos 7 días) ---
print("\n--- Consulta 6: Reportes pendientes de verificación (últimos 7 días) ---\n");
const hace7dias = new Date("2026-07-04T00:00:00Z");
const q6 = db.traffic_reports.find(
  {
    status: { $in: ["Activo", "En Revisión"] },
    register_date: { $gte: hace7dias }
  },
  {
    _id: 0,
    reference_point: 1,
    severity_level: 1,
    status: 1,
    "user.first_name": 1,
    "user.reputation_score": 1,
    register_date: 1
  }
).sort({ register_date: -1 }).toArray();
q6.forEach(doc => printjson(doc));


// --- Consulta 7: Análisis de credibilidad por votos ---
print("\n--- Consulta 7: Análisis de credibilidad por votos ---\n");
const q7 = db.traffic_reports.aggregate([
  { $unwind: "$votes" },
  {
    $group: {
      _id: "$reference_point",
      severidad: { $first: "$severity_level" },
      estado: { $first: "$status" },
      votos_positivos: {
        $sum: { $cond: ["$votes.is_upvote", 1, 0] }
      },
      votos_negativos: {
        $sum: { $cond: ["$votes.is_upvote", 0, 1] }
      },
      total_votos: { $sum: 1 }
    }
  },
  {
    $addFields: {
      porcentaje_confianza: {
        $round: [{ $multiply: [{ $divide: ["$votos_positivos", "$total_votos"] }, 100] }, 1]
      }
    }
  },
  { $sort: { porcentaje_confianza: -1 } },
  { $limit: 10 }
]).toArray();
q7.forEach(doc => printjson(doc));


// --- Consulta 8: Distribución horaria de incidentes ---
print("\n--- Consulta 8: Distribución horaria de incidentes ---\n");
const q8 = db.traffic_reports.aggregate([
  {
    $group: {
      _id: { $hour: "$register_date" },
      total_reportes: { $sum: 1 },
      severidades: { $push: "$severity_level" }
    }
  },
  {
    $addFields: {
      criticos_en_franja: {
        $size: {
          $filter: {
            input: "$severidades",
            cond: { $in: ["$$this", ["Alta", "Crítica"]] }
          }
        }
      }
    }
  },
  {
    $project: {
      hora: "$_id",
      _id: 0,
      total_reportes: 1,
      criticos_en_franja: 1
    }
  },
  { $sort: { total_reportes: -1 } }
]).toArray();
q8.forEach(doc => printjson(doc));


// --- Consulta 9: Perfil y reportes del usuario 'Carlos Mendoza' ---
print("\n--- Consulta 9: Perfil y reportes del usuario 'Carlos Mendoza' ---\n");
const usuario = db.users.findOne(
  { first_name: "Carlos", last_name: "Mendoza" },
  { password_hash: 0 }
);

let q9_reportes = [];
if (usuario) {
  print("Perfil:");
  printjson(usuario);

  print("\nReportes de tráfico generados:");
  q9_reportes = db.traffic_reports.find(
    { "user.first_name": usuario.first_name },
    {
      _id: 0,
      reference_point: 1,
      severity_level: 1,
      status: 1,
      "incident_type.name": 1,
      register_date: 1
    }
  ).sort({ register_date: -1 }).toArray();
  q9_reportes.forEach(doc => printjson(doc));
} else {
  print("Usuario no encontrado.");
}


// --- Consulta 10: Dashboard ejecutivo ---
print("\n--- Consulta 10: Dashboard ejecutivo ---\n");

const totalUsuarios = db.users.countDocuments();
const usuariosActivos = db.users.countDocuments({ is_active: true });
const totalReportes = db.traffic_reports.countDocuments();
const reportesActivos = db.traffic_reports.countDocuments({ status: "Activo" });
const reportesVerificados = db.traffic_reports.countDocuments({ status: "Verificado" });
const reportesEnRevision = db.traffic_reports.countDocuments({ status: "En Revisión" });
const reportesResueltos = db.traffic_reports.countDocuments({ status: "Resuelto" });
const totalRutas = db.routes.countDocuments();

const promedioReputacion = db.users.aggregate([
  { $match: { is_active: true } },
  { $group: { _id: null, promedio: { $avg: "$reputation_score" } } }
]).toArray();

const q10 = {
  kpis_usuarios: {
    total_registrados: totalUsuarios,
    activos: usuariosActivos,
    reputacion_promedio: promedioReputacion.length > 0 ? Number(promedioReputacion[0].promedio.toFixed(1)) : null
  },
  kpis_reportes_trafico: {
    total: totalReportes,
    activos: reportesActivos,
    verificados: reportesVerificados,
    en_revision: reportesEnRevision,
    resueltos: reportesResueltos
  },
  kpis_rutas: {
    total_consultadas: totalRutas
  }
};

printjson(q10);

// Valor de retorno final: Un objeto con el resultado de las 10 consultas
// para que se renderice interactivamente en la pestaña Playground Result de VS Code:
({
  resumen_ejecutivo: q10,
  consulta_1_incidentes_activos_graves: q1,
  consulta_2_ranking_distritos: q2,
  consulta_3_top_usuarios_reputacion: q3,
  consulta_4_tipos_incidente_frecuentes: q4,
  consulta_5_rutas_congestionadas: q5,
  consulta_6_pendientes_verificacion: q6,
  consulta_7_credibilidad_votos: q7,
  consulta_8_distribucion_horaria: q8,
  consulta_9_usuario_y_sus_reportes: { usuario: usuario, reportes: q9_reportes }
});
