// Script de verificación - Base de datos SEMAFLOW
// Compatible con MongoDB for VS Code Playground y mongosh

use("SEMAFLOW");
db = db.getSiblingDB("SEMAFLOW");

print("\n--- Colecciones en SEMAFLOW ---\n");
const colecciones = db.getCollectionNames();
print("Colecciones encontradas (" + colecciones.length + "): " + colecciones.join(", "));

print("\n--- Conteo de documentos ---\n");
const conteos = {};
colecciones.forEach((col) => {
  const conteo = db[col].countDocuments();
  conteos[col] = conteo;
  print("  " + col + ": " + conteo + " documento(s)");
});

print("\n--- Índices creados ---\n");
const indices = {};
colecciones.forEach((col) => {
  const idxList = db[col].getIndexes().map(idx => idx.name);
  indices[col] = idxList;
  print("  " + col + ": " + idxList.join(", "));
});

print("\n--- Muestras impresas en consola ---\n");
print("Usuario de muestra:");
printjson(db.users.findOne());

print("\nReporte de muestra:");
printjson(db.traffic_reports.findOne());

print("\nRuta de muestra:");
printjson(db.routes.findOne());

print("\nVerificación completada.\n");

// Valor de retorno final para que se muestre claramente en Playground Result de VS Code:
({
  status: "Verificación completada exitosamente",
  database: "SEMAFLOW",
  collectionsCount: colecciones.length,
  collections: colecciones,
  documentCounts: conteos,
  indexes: indices,
  samples: {
    userSample: db.users.findOne(),
    reportSample: db.traffic_reports.findOne(),
    routeSample: db.routes.findOne()
  }
});
