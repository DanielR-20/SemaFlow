// Script de creación de estructura - Base de datos SEMAFLOW (MongoDB v7.x)
// Compatible con MongoDB for VS Code Playground y mongosh
// Solo crea colecciones, validaciones de esquema e índices. No inserta datos.

use("SEMAFLOW");
db = db.getSiblingDB("SEMAFLOW");

print("Creando estructura de base de datos SEMAFLOW...\n");

// Eliminar colecciones previas si existen
const coleccionesExistentes = db.getCollectionNames();
["users", "traffic_reports", "routes"].forEach((col) => {
  if (coleccionesExistentes.includes(col)) {
    print("  Eliminando colección existente: " + col);
    db[col].drop();
  }
});

// --- Colección: users ---
print("  Creando colección 'users'...");

db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      title: "Esquema de validación para users",
      required: ["first_name", "last_name", "email", "is_active"],
      additionalProperties: false,
      properties: {
        _id: {
          bsonType: ["string", "objectId"],
          description: "ID único del usuario"
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
          description: "Fecha de registro (YYYY-MM-DD)"
        },
        reports: {
          bsonType: "array",
          description: "Historial resumido de reportes creados",
          items: {
            bsonType: "object",
            properties: {
              report_id: {
                bsonType: ["double", "int", "long"],
                description: "ID del reporte"
              },
              severity_level: {
                bsonType: "string",
                description: "Nivel de severidad"
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

// --- Colección: traffic_reports ---
print("  Creando colección 'traffic_reports'...");

db.createCollection("traffic_reports", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      title: "Esquema de validación para traffic_reports",
      required: ["reference_point", "latitude", "longitude", "severity_level", "status"],
      additionalProperties: false,
      properties: {
        _id: {
          bsonType: "objectId",
          description: "ID del reporte de tráfico"
        },
        reference_point: {
          bsonType: "string",
          description: "Punto de referencia del incidente"
        },
        latitude: {
          bsonType: ["double", "int", "long"],
          description: "Latitud geográfica"
        },
        longitude: {
          bsonType: ["double", "int", "long"],
          description: "Longitud geográfica"
        },
        severity_level: {
          bsonType: "string",
          description: "Nivel de severidad"
        },
        description: {
          bsonType: "string",
          description: "Descripción del incidente"
        },
        status: {
          bsonType: "string",
          description: "Estado del reporte"
        },
        register_date: {
          bsonType: "date",
          description: "Fecha y hora de registro"
        },
        user: {
          bsonType: "object",
          description: "Datos del usuario que reportó",
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
              description: "Reputación del usuario"
            }
          }
        },
        incident_type: {
          bsonType: "object",
          description: "Tipo de incidente",
          additionalProperties: false,
          properties: {
            id: {
              bsonType: ["int", "long", "double"],
              description: "ID del tipo de incidente"
            },
            name: {
              bsonType: "string",
              description: "Nombre del tipo de incidente"
            },
            default_severity: {
              bsonType: "string",
              description: "Severidad por defecto"
            }
          }
        },
        avenue: {
          bsonType: "object",
          description: "Avenida y distrito",
          additionalProperties: false,
          properties: {
            id: {
              bsonType: ["int", "long", "double"],
              description: "ID de la avenida"
            },
            name: {
              bsonType: "string",
              description: "Nombre de la avenida"
            },
            district: {
              bsonType: "string",
              description: "Distrito"
            }
          }
        },
        images: {
          bsonType: "array",
          description: "Imágenes adjuntas",
          items: {
            bsonType: "object",
            properties: {
              image_url: {
                bsonType: "string",
                description: "URL de la imagen"
              },
              file_size: {
                bsonType: ["int", "long", "double"],
                description: "Tamaño en bytes"
              },
              uploaded_date: {
                bsonType: "date",
                description: "Fecha de subida"
              }
            }
          }
        },
        votes: {
          bsonType: "array",
          description: "Votos de confirmación/rechazo",
          items: {
            bsonType: "object",
            properties: {
              user_id: {
                bsonType: ["int", "long", "double"],
                description: "ID del usuario votante"
              },
              is_upvote: {
                bsonType: "bool",
                description: "True = a favor, False = en contra"
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

// --- Colección: routes ---
print("  Creando colección 'routes'...");

db.createCollection("routes", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      title: "Esquema de validación para routes",
      required: ["consulted_date", "origin", "destination"],
      additionalProperties: false,
      properties: {
        _id: {
          bsonType: "objectId",
          description: "ID de la consulta de ruta"
        },
        consulted_date: {
          bsonType: "date",
          description: "Fecha y hora de consulta"
        },
        user: {
          bsonType: "object",
          description: "Usuario que consultó la ruta",
          additionalProperties: false,
          properties: {
            id: {
              bsonType: ["int", "long", "double"],
              description: "ID del usuario"
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
              description: "Latitud"
            },
            longitude: {
              bsonType: ["double", "int", "long"],
              description: "Longitud"
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
              description: "Latitud"
            },
            longitude: {
              bsonType: ["double", "int", "long"],
              description: "Longitud"
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
                description: "Distancia en kilómetros"
              },
              congestion_level: {
                bsonType: "string",
                description: "Nivel de congestión"
              },
              is_recommended: {
                bsonType: "bool",
                description: "Si es la ruta recomendada"
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

// --- Índices ---
print("  Creando índices...");

db.users.createIndex({ email: 1 }, { unique: true, name: "idx_users_email_unique" });
db.users.createIndex({ is_active: 1 }, { name: "idx_users_active" });

db.traffic_reports.createIndex({ status: 1, severity_level: 1 }, { name: "idx_traffic_status_severity" });
db.traffic_reports.createIndex({ register_date: -1 }, { name: "idx_traffic_register_date" });
db.traffic_reports.createIndex({ "avenue.district": 1 }, { name: "idx_traffic_district" });

db.routes.createIndex({ consulted_date: -1 }, { name: "idx_routes_consulted_date" });
db.routes.createIndex({ "user.id": 1 }, { name: "idx_routes_user_id" });

print("\nEstructura de SEMAFLOW creada correctamente.\n");

// Valor de retorno final para que se muestre claramente en Playground Result de VS Code:
({
  status: "Estructura de SEMAFLOW creada exitosamente (sin documentos)",
  database: "SEMAFLOW",
  collections: db.getCollectionNames(),
  indexes: {
    users: db.users.getIndexes().map(i => i.name),
    traffic_reports: db.traffic_reports.getIndexes().map(i => i.name),
    routes: db.routes.getIndexes().map(i => i.name)
  }
});
