// ============================================================================
// SCRIPT DE ESTRUCTURA DE BASE DE DATOS MONGODB: SEMAFLOW (SOLO ESTRUCTURA)
// Basado en el modelo Hackolade (MongoDB v7.x)
// ============================================================================

// 1. SELECCIONAR O CREAR LA BASE DE DATOS SEMAFLOW
db = db.getSiblingDB("SEMAFLOW");

print("==========================================================");
print("Creando estructura de base de datos: SEMAFLOW");
print("==========================================================");

// 2. ELIMINAR COLECCIONES PREVIAS SI EXISTEN
const coleccionesExistentes = db.getCollectionNames();
["users", "traffic_reports", "routes"].forEach((col) => {
  if (coleccionesExistentes.includes(col)) {
    print(`Eliminando colección existente: ${col}...`);
    db[col].drop();
  }
});

// ============================================================================
// 3. CREACIÓN DE COLECCIONES CON VALIDACIÓN DE ESQUEMA ($jsonSchema)
// ============================================================================

// ----------------------------------------------------------------------------
// 3.1 COLECCIÓN: users
// ----------------------------------------------------------------------------
print("Creando colección 'users' con validación de esquema...");

db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      title: "Validación de esquema para colección 'users'",
      required: ["first_name", "last_name", "email", "is_active"],
      additionalProperties: false,
      properties: {
        _id: {
          bsonType: ["string", "objectId"],
          description: "ID único del usuario (String hexadecimal de 24 caracteres u ObjectId)"
        },
        first_name: {
          bsonType: "string",
          description: "Nombre del usuario"
        },
        last_name: {
          bsonType: "string",
          description: "Apellido del usuario"
        },
        email: {
          bsonType: "string",
          description: "Correo electrónico del usuario"
        },
        password_hash: {
          bsonType: "string",
          description: "Hash de la contraseña"
        },
        reputation_score: {
          bsonType: ["double", "int", "long"],
          description: "Puntuación de reputación del usuario"
        },
        is_active: {
          bsonType: "bool",
          description: "Indica si el usuario está activo"
        },
        register_date: {
          bsonType: "string",
          description: "Fecha de registro en formato de cadena (YYYY-MM-DD o ISO)"
        },
        reports: {
          bsonType: "array",
          description: "Historial resumido de reportes creados por el usuario",
          items: {
            bsonType: "object",
            properties: {
              report_id: {
                bsonType: ["double", "int", "long"],
                description: "ID o identificador numérico del reporte"
              },
              severity_level: {
                bsonType: "string",
                description: "Nivel de severidad del reporte"
              },
              status: {
                bsonType: "string",
                description: "Estado del reporte"
              },
              register_date: {
                bsonType: "string",
                description: "Fecha de registro del reporte"
              }
            }
          }
        }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

// ----------------------------------------------------------------------------
// 3.2 COLECCIÓN: traffic_reports
// ----------------------------------------------------------------------------
print("Creando colección 'traffic_reports' con validación de esquema...");

db.createCollection("traffic_reports", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      title: "Validación de esquema para colección 'traffic_reports'",
      required: ["reference_point", "latitude", "longitude", "severity_level", "status"],
      additionalProperties: false,
      properties: {
        _id: {
          bsonType: "objectId",
          description: "Identificador único ObjectId del reporte de tráfico"
        },
        reference_point: {
          bsonType: "string",
          description: "Punto de referencia del incidente de tráfico"
        },
        latitude: {
          bsonType: ["double", "int", "long"],
          description: "Latitud geográfica del reporte"
        },
        longitude: {
          bsonType: ["double", "int", "long"],
          description: "Longitud geográfica del reporte"
        },
        severity_level: {
          bsonType: "string",
          description: "Nivel de severidad (ej. Baja, Media, Alta, Crítica)"
        },
        description: {
          bsonType: "string",
          description: "Descripción detallada del incidente"
        },
        status: {
          bsonType: "string",
          description: "Estado del reporte (ej. Activo, Verificado, Resuelto)"
        },
        register_date: {
          bsonType: "date",
          description: "Fecha y hora de registro del reporte"
        },
        user: {
          bsonType: "object",
          description: "Datos embebidos del usuario que reportó",
          additionalProperties: false,
          properties: {
            id: {
              bsonType: ["int", "long", "double"],
              description: "ID numérico del usuario"
            },
            first_name: {
              bsonType: "string",
              description: "Nombre del usuario"
            },
            reputation_score: {
              bsonType: ["int", "long", "double"],
              description: "Reputación del usuario al momento de reportar"
            }
          }
        },
        incident_type: {
          bsonType: "object",
          description: "Tipo de incidente reportado",
          additionalProperties: false,
          properties: {
            id: {
              bsonType: ["int", "long", "double"],
              description: "ID del tipo de incidente"
            },
            name: {
              bsonType: "string",
              description: "Nombre del tipo de incidente (ej. Congestión, Accidente, Obras)"
            },
            default_severity: {
              bsonType: "string",
              description: "Severidad por defecto del tipo de incidente"
            }
          }
        },
        avenue: {
          bsonType: "object",
          description: "Avenida y distrito del reporte",
          additionalProperties: false,
          properties: {
            id: {
              bsonType: ["int", "long", "double"],
              description: "ID de la avenida"
            },
            name: {
              bsonType: "string",
              description: "Nombre de la avenida o vía"
            },
            district: {
              bsonType: "string",
              description: "Distrito al que pertenece"
            }
          }
        },
        images: {
          bsonType: "array",
          description: "Imágenes adjuntas al reporte",
          items: {
            bsonType: "object",
            properties: {
              image_url: {
                bsonType: "string",
                description: "URL o ruta de la imagen"
              },
              file_size: {
                bsonType: ["int", "long", "double"],
                description: "Tamaño del archivo en bytes"
              },
              uploaded_date: {
                bsonType: "date",
                description: "Fecha de subida de la imagen"
              }
            }
          }
        },
        votes: {
          bsonType: "array",
          description: "Votos de confirmación o rechazo del reporte",
          items: {
            bsonType: "object",
            properties: {
              user_id: {
                bsonType: ["int", "long", "double"],
                description: "ID numérico del usuario votante"
              },
              is_upvote: {
                bsonType: "bool",
                description: "True si es voto a favor, False si es en contra"
              },
              voted_date: {
                bsonType: "date",
                description: "Fecha del voto"
              }
            }
          }
        }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

// ----------------------------------------------------------------------------
// 3.3 COLECCIÓN: routes
// ----------------------------------------------------------------------------
print("Creando colección 'routes' con validación de esquema...");

db.createCollection("routes", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      title: "Validación de esquema para colección 'routes'",
      required: ["consulted_date", "origin", "destination"],
      additionalProperties: false,
      properties: {
        _id: {
          bsonType: "objectId",
          description: "Identificador único ObjectId de la consulta de ruta"
        },
        consulted_date: {
          bsonType: "date",
          description: "Fecha y hora de consulta de la ruta"
        },
        user: {
          bsonType: "object",
          description: "Usuario que consultó la ruta",
          additionalProperties: false,
          properties: {
            id: {
              bsonType: ["int", "long", "double"],
              description: "ID numérico del usuario"
            },
            first_name: {
              bsonType: "string",
              description: "Nombre del usuario"
            }
          }
        },
        origin: {
          bsonType: "object",
          description: "Coordenadas de origen",
          additionalProperties: false,
          properties: {
            latitude: {
              bsonType: ["double", "int", "long"],
              description: "Latitud del origen"
            },
            longitude: {
              bsonType: ["double", "int", "long"],
              description: "Longitud del origen"
            }
          }
        },
        destination: {
          bsonType: "object",
          description: "Coordenadas de destino",
          additionalProperties: false,
          properties: {
            latitude: {
              bsonType: ["double", "int", "long"],
              description: "Latitud del destino"
            },
            longitude: {
              bsonType: ["double", "int", "long"],
              description: "Longitud del destino"
            }
          }
        },
        suggestions: {
          bsonType: "array",
          description: "Rutas sugeridas",
          items: {
            bsonType: "object",
            properties: {
              estimated_time: {
                bsonType: ["int", "long", "double"],
                description: "Tiempo estimado en minutos"
              },
              distance: {
                bsonType: ["double", "int", "long"],
                description: "Distancia estimada en kilómetros"
              },
              congestion_level: {
                bsonType: "string",
                description: "Nivel de congestión en la ruta sugerida"
              },
              is_recommended: {
                bsonType: "bool",
                description: "Indica si es la ruta recomendada"
              },
              zone: {
                bsonType: "string",
                description: "Zona por la que transita"
              }
            }
          }
        }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});

// ============================================================================
// 4. CREACIÓN DE ÍNDICES
// ============================================================================
print("Creando índices estructurales...");

db.users.createIndex({ email: 1 }, { unique: true, name: "idx_users_email_unique" });
db.users.createIndex({ is_active: 1 }, { name: "idx_users_active" });

db.traffic_reports.createIndex({ status: 1, severity_level: 1 }, { name: "idx_traffic_status_severity" });
db.traffic_reports.createIndex({ register_date: -1 }, { name: "idx_traffic_register_date" });
db.traffic_reports.createIndex({ "avenue.district": 1 }, { name: "idx_traffic_district" });

db.routes.createIndex({ consulted_date: -1 }, { name: "idx_routes_consulted_date" });
db.routes.createIndex({ "user.id": 1 }, { name: "idx_routes_user_id" });

print("==========================================================");
print("Estructura de 'SEMAFLOW' creada correctamente (0 documentos).");
print("==========================================================");
