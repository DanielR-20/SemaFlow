// ============================================================================
// 10 CONSULTAS FUNCIONALES PARA LA BASE DE DATOS SEMAFLOW
// Sistema de Reportes de Tráfico y Gestión Vial Inteligente
// Cada consulta responde a una necesidad real de la plataforma.
// ============================================================================

db = db.getSiblingDB("SEMAFLOW");

// ============================================================================
// CONSULTA 1: INCIDENTES ACTIVOS DE ALTA SEVERIDAD (PANEL DE EMERGENCIAS)
// Propósito: Obtener en tiempo real los reportes activos más graves para que
//            los operadores del centro de control prioricen la atención vial.
// ============================================================================
print("\n========== CONSULTA 1: Incidentes activos de alta severidad ==========");

const consulta1 = db.traffic_reports.find(
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
).sort({ register_date: -1 });

consulta1.forEach(doc => printjson(doc));

// ============================================================================
// CONSULTA 2: RANKING DE DISTRITOS CON MÁS INCIDENTES (MAPA DE CALOR)
// Propósito: Identificar las zonas urbanas con mayor concentración de
//            problemas viales para focalizar intervención municipal.
// ============================================================================
print("\n========== CONSULTA 2: Ranking de distritos con más incidentes ==========");

const consulta2 = db.traffic_reports.aggregate([
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
]);

consulta2.forEach(doc => printjson(doc));

// ============================================================================
// CONSULTA 3: USUARIOS CON MAYOR REPUTACIÓN Y CONTRIBUCIÓN ACTIVA
// Propósito: Premiar y destacar a los usuarios más confiables de la
//            comunidad que aportan reportes verificados frecuentemente.
// ============================================================================
print("\n========== CONSULTA 3: Top 10 usuarios con mayor reputación activos ==========");

const consulta3 = db.users.find(
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
).sort({ reputation_score: -1 }).limit(10);

consulta3.forEach(doc => printjson(doc));

// ============================================================================
// CONSULTA 4: TIPOS DE INCIDENTES MÁS REPORTADOS (ANÁLISIS DE CAUSAS)
// Propósito: Determinar cuáles son las causas más comunes de congestión
//            vial para que las autoridades planifiquen acciones preventivas.
// ============================================================================
print("\n========== CONSULTA 4: Tipos de incidentes más reportados ==========");

const consulta4 = db.traffic_reports.aggregate([
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
]);

consulta4.forEach(doc => printjson(doc));

// ============================================================================
// CONSULTA 5: RUTAS MÁS CONGESTIONADAS CONSULTADAS POR USUARIOS
// Propósito: Detectar los corredores viales donde los usuarios buscan
//            alternativas con frecuencia, señal de congestión recurrente.
// ============================================================================
print("\n========== CONSULTA 5: Rutas con sugerencias de congestión alta ==========");

const consulta5 = db.routes.aggregate([
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
]);

consulta5.forEach(doc => printjson(doc));

// ============================================================================
// CONSULTA 6: REPORTES SIN VERIFICAR EN LAS ÚLTIMAS 24 HORAS
// Propósito: Listar los reportes recientes que aún no han sido validados
//            por la comunidad para agilizar el proceso de moderación.
// ============================================================================
print("\n========== CONSULTA 6: Reportes pendientes de verificación recientes ==========");

const hace24h = new Date();
hace24h.setDate(hace24h.getDate() - 1);

const consulta6 = db.traffic_reports.find(
  {
    status: { $in: ["Activo", "En Revisión"] },
    register_date: { $gte: hace24h }
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
).sort({ register_date: -1 });

consulta6.forEach(doc => printjson(doc));
print(`(Nota: Si no hay resultados, los datos de ejemplo pueden tener fechas fuera del rango de 24h.)`);

// ============================================================================
// CONSULTA 7: EFECTIVIDAD DE VOTOS POR REPORTE (CREDIBILIDAD COMUNITARIA)
// Propósito: Analizar la proporción de votos positivos vs negativos de cada
//            reporte para medir la confianza de la comunidad en la información.
// ============================================================================
print("\n========== CONSULTA 7: Análisis de credibilidad por votos ==========");

const consulta7 = db.traffic_reports.aggregate([
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
]);

consulta7.forEach(doc => printjson(doc));

// ============================================================================
// CONSULTA 8: HORAS PICO DE REPORTES (PATRONES TEMPORALES)
// Propósito: Identificar en qué franjas horarias se concentran más los
//            incidentes para asignar recursos de tránsito de forma eficiente.
// ============================================================================
print("\n========== CONSULTA 8: Distribución horaria de incidentes (horas pico) ==========");

const consulta8 = db.traffic_reports.aggregate([
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
]);

consulta8.forEach(doc => printjson(doc));

// ============================================================================
// CONSULTA 9: HISTORIAL COMPLETO DE REPORTES DE UN USUARIO ESPECÍFICO
// Propósito: Consultar el perfil completo de un usuario junto con todos los
//            reportes que ha generado, útil para auditoría y soporte.
// ============================================================================
print("\n========== CONSULTA 9: Perfil y reportes del usuario 'Carlos Mendoza' ==========");

const consulta9_usuario = db.users.findOne(
  { first_name: "Carlos", last_name: "Mendoza" },
  { password_hash: 0 }
);

if (consulta9_usuario) {
  print("--- Perfil del usuario ---");
  printjson(consulta9_usuario);

  print("--- Reportes de tráfico generados ---");
  const consulta9_reportes = db.traffic_reports.find(
    { "user.first_name": consulta9_usuario.first_name },
    {
      _id: 0,
      reference_point: 1,
      severity_level: 1,
      status: 1,
      "incident_type.name": 1,
      register_date: 1
    }
  ).sort({ register_date: -1 });
  consulta9_reportes.forEach(doc => printjson(doc));
} else {
  print("Usuario no encontrado.");
}

// ============================================================================
// CONSULTA 10: RESUMEN EJECUTIVO GENERAL DE LA PLATAFORMA (DASHBOARD)
// Propósito: Generar un resumen estadístico completo del estado actual de
//            SemaFlow para el panel de control administrativo (KPIs).
// ============================================================================
print("\n========== CONSULTA 10: Resumen ejecutivo / Dashboard ==========");

const totalUsuarios = db.users.countDocuments();
const usuariosActivos = db.users.countDocuments({ is_active: true });
const totalReportes = db.traffic_reports.countDocuments();
const reportesActivos = db.traffic_reports.countDocuments({ status: "Activo" });
const reportesVerificados = db.traffic_reports.countDocuments({ status: "Verificado" });
const reportesResueltos = db.traffic_reports.countDocuments({ status: "Resuelto" });
const totalRutas = db.routes.countDocuments();

const promedioReputacion = db.users.aggregate([
  { $match: { is_active: true } },
  { $group: { _id: null, promedio: { $avg: "$reputation_score" } } }
]).toArray();

print("╔══════════════════════════════════════════════════╗");
print("║         DASHBOARD EJECUTIVO - SEMAFLOW           ║");
print("╠══════════════════════════════════════════════════╣");
print(`║  Usuarios registrados:        ${totalUsuarios}`);
print(`║  Usuarios activos:            ${usuariosActivos}`);
print(`║  Reputación promedio:         ${promedioReputacion.length > 0 ? promedioReputacion[0].promedio.toFixed(1) : "N/A"}`);
print("╠══════════════════════════════════════════════════╣");
print(`║  Total reportes de tráfico:   ${totalReportes}`);
print(`║    - Activos:                 ${reportesActivos}`);
print(`║    - Verificados:             ${reportesVerificados}`);
print(`║    - Resueltos:               ${reportesResueltos}`);
print("╠══════════════════════════════════════════════════╣");
print(`║  Consultas de rutas:          ${totalRutas}`);
print("╚══════════════════════════════════════════════════╝\n");
