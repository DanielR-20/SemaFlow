/* SCRIPT 1: EJECUCIÓN DE CONSULTAS Y REPORTES (1-20)
   BASE DE DATOS: SemaFlow */

USE SemaFlow;
GO

/* CONSULTA 1
   Reportes de tráfico ACTIVOS con severidad ALTA, mostrando
   el usuario que reportó, la avenida y el tipo de incidente. */
SELECT
    tr.id                          AS Reporte_id,
    tr.reference_point             AS Punto_referencia,
    tr.severity_level              AS Severidad,
    tr.status                      AS Estado,
    tr.register_date               AS Fecha_registro,
    it.name                        AS Tipo_incidente,
    a.name                         AS Avenida,
    u.first_name + ' ' + u.last_name AS reportado_por
FROM traffic_reports tr
JOIN incident_types it ON tr.incident_type_id = it.id
JOIN avenues a          ON tr.avenue_id       = a.id
JOIN users u            ON tr.user_id         = u.id
WHERE tr.status = 'ACTIVO'
  AND tr.severity_level = 'ALTA'
ORDER BY tr.register_date DESC;
GO

/* CONSULTA 2
   Cantidad de reportes registrados por cada tipo de incidente,
   ordenados del tipo más reportado al menos reportado. */
SELECT
    it.name             AS Tipo_incidente,
    COUNT(tr.id)         AS Cantidad_reportes,
    AVG(tr.latitude)     AS Latitud_promedio
FROM incident_types it
LEFT JOIN traffic_reports tr ON tr.incident_type_id = it.id
GROUP BY it.name
ORDER BY cantidad_reportes DESC;
GO

/* CONSULTA 3
   Usuarios que han hecho 3 o más reportes de tráfico,
   junto con su reputación y el promedio de votos positivos */
SELECT
    u.id                                AS Usuario_id,
    u.first_name + ' ' + u.last_name AS Usuario,
    u.reputation_score                  AS Reputacion,
    COUNT(DISTINCT tr.id)               AS Total_reportes,
    (
        SELECT AVG(CAST(rv.is_upvote AS FLOAT))
        FROM report_votes rv
        JOIN traffic_reports tr2 ON rv.traffic_report_id = tr2.id
        WHERE tr2.user_id = u.id
    )                                    AS Promedio_votos_positivos
FROM users u
JOIN traffic_reports tr ON tr.user_id = u.id
GROUP BY u.id, u.first_name, u.last_name, u.reputation_score
HAVING COUNT(DISTINCT tr.id) >= 3
ORDER BY total_reportes DESC;
GO

/* CONSULTA 4
   Mostrar avenidas de doble sentido que sean consideradas vías rápidas. */
SELECT 
        id AS Avenida_id,
        name AS Avenida, 
        lane_count AS Cantidad_carriles, 
        speed_limit AS Limite_velocidad 
FROM avenues
WHERE is_two_way = 1 
AND speed_limit >= 60
GO

/* CONSULTA 5
   Mostrar cantidad de semáforos instalados por cada distrito. */
SELECT
        d.id AS Distrito_id,
        d.name AS Nombre_distrito,
        count(t.id) AS Cantidad_semaforos
FROM districts AS d
    left join zones AS z on d.id = z.district_id
    left join traffic_lights AS t on z.id = t.zone_id
GROUP BY d.id, d.name
GO

/* CONSULTA 6
   Enunciado: Crear una función o procedimiento que reciba como parámetro el ID de un usuario.
   El reporte debe mostrar el nombre del distrito y la cantidad total de reportes de 
   tráfico que ese usuario específico ha realizado en dicho distrito. 
   Los distritos donde el usuario no ha hecho ningún reporte deben aparecer con un monto de 0.
*/
SELECT * FROM dbo.FReportesPorUsuarioYDistrito(2);
GO

/* CONSULTA 7
   Mostrar las 5 avenidas con mayor cantidad de reportes registrados. */
SELECT TOP 5
    a.id AS Avenida_id,
    a.name AS Avenida,
    d.name AS Distrito,
    COUNT(tr.id) AS Total_reportes
FROM avenues AS a
JOIN zones AS z
    ON a.zone_id = z.id
JOIN districts AS d
    ON z.district_id = d.id
LEFT JOIN traffic_reports AS tr
    ON a.id = tr.avenue_id
GROUP BY
    a.id,
    a.name,
    d.name
ORDER BY Total_reportes DESC;
GO

/* CONSULTA 8
   Mostrar la cantidad de reportes registrados por distrito,
   clasificados según el estado del reporte. */
SELECT
    d.name AS Distrito,
    tr.status AS Estado_reporte,
    COUNT(tr.id) AS Cantidad_reportes
FROM districts AS d
JOIN zones AS z
    ON d.id = z.district_id
JOIN avenues AS a
    ON z.id = a.zone_id
LEFT JOIN traffic_reports AS tr
    ON a.id = tr.avenue_id
GROUP BY
    d.name,
    tr.status
ORDER BY
    d.name,
    Cantidad_reportes DESC;
GO

/* CONSULTA 9
   Mostrar la cantidad de semáforos según su estado operativo en cada distrito. */
SELECT
    d.id AS Distrito_id,
    d.name AS Nombre_distrito,
    CASE 
        WHEN t.operational_status = 1 THEN 'OPERATIVO'
        WHEN t.operational_status = 0 THEN 'NO OPERATIVO'
        ELSE 'SIN SEMAFOROS'
    END AS Estado_operativo,
    COUNT(t.id) AS Cantidad_semaforos
FROM districts AS d
LEFT JOIN zones AS z
    ON d.id = z.district_id
LEFT JOIN traffic_lights AS t
    ON z.id = t.zone_id
GROUP BY
    d.id,
    d.name,
    t.operational_status
ORDER BY
    d.name,
    Cantidad_semaforos DESC;
GO

/* CONSULTA 10
   Mostrar las zonas consideradas de alto riesgo (nivel 4 o 5)
   y la cantidad de reportes de tráfico 'ACTIVO' que poseen. */
SELECT
    d.name AS Distrito,
    z.name AS Zona,
    z.risk_level AS Nivel_riesgo,
    COUNT(tr.id) AS Incidentes_activos
FROM districts d
JOIN zones z 
    ON d.id = z.district_id
LEFT JOIN avenues a 
    ON z.id = a.zone_id
LEFT JOIN traffic_reports tr 
    ON a.id = tr.avenue_id AND tr.status = 'ACTIVO'
WHERE z.risk_level >= 4
GROUP BY 
    d.name, 
    z.name, 
    z.risk_level
ORDER BY 
    Incidentes_activos DESC, 
    z.risk_level DESC;
GO

/* CONSULTA 11
   Top 5 reportes de tráfico más útiles (con mayor cantidad de votos positivos). */
SELECT TOP 5
    tr.id AS Reporte_id,
    tr.reference_point AS Punto_Referencia,
    it.name AS Tipo_incidente,
    u.first_name + ' ' + u.last_name AS Autor,
    COUNT(rv.id) AS Total_Votos_Positivos
FROM traffic_reports tr
JOIN incident_types it 
    ON tr.incident_type_id = it.id
JOIN users u 
    ON tr.user_id = u.id
JOIN report_votes rv 
    ON tr.id = rv.traffic_report_id
WHERE rv.is_upvote = 1
GROUP BY 
    tr.id, 
    tr.reference_point, 
    it.name, 
    u.first_name, 
    u.last_name
ORDER BY 
    Total_Votos_Positivos DESC;
GO

/* CONSULTA 12
   Resumen de rutas sugeridas recomendadas por usuario. */
SELECT
    u.id AS Usuario_id,
    u.first_name + ' ' + u.last_name AS Usuario,
    COUNT(s.id) AS Cantidad_Sugerencias,
    AVG(s.estimated_time) AS Tiempo_Promedio_Minutos,
    CAST(AVG(s.distance) AS DECIMAL(10,2)) AS Distancia_Promedio_Km
FROM users u
JOIN routes r 
    ON u.id = r.user_id
JOIN suggestions s 
    ON r.id = s.route_id
WHERE s.is_recommended = 1
GROUP BY 
    u.id, 
    u.first_name, 
    u.last_name
ORDER BY 
    Cantidad_Sugerencias DESC;
GO

/* CONSULTA 13
   Mostrar la cantidad total de imágenes registradas como evidencia
   por cada tipo de incidente. */
SELECT
    it.id AS Tipo_id,
    it.name AS Tipo_Incidente,
    COUNT(ri.id) AS Cantidad_Imagenes
FROM incident_types AS it
LEFT JOIN traffic_reports AS tr
    ON it.id = tr.incident_type_id
LEFT JOIN report_images AS ri
    ON tr.id = ri.traffic_report_id
GROUP BY
    it.id,
    it.name
ORDER BY
    Cantidad_Imagenes DESC;
GO

/* CONSULTA 14
   Mostrar la cantidad de usuarios diferentes que han realizado
   al menos un reporte de tráfico en cada distrito. */
SELECT
    d.id AS Distrito_id,
    d.name AS Distrito,
    COUNT(DISTINCT tr.user_id) AS Cantidad_Usuarios
FROM districts AS d
LEFT JOIN zones AS z
    ON d.id = z.district_id
LEFT JOIN avenues AS a
    ON z.id = a.zone_id
LEFT JOIN traffic_reports AS tr
    ON a.id = tr.avenue_id
GROUP BY
    d.id,
    d.name
ORDER BY
    Cantidad_Usuarios DESC;
GO

/* CONSULTA 15
   Mostrar el nombre de cada zona junto con su nivel de riesgo,
   el promedio del tiempo estimado y el nivel de congestión promedio. */
SELECT
    z.name AS Zona,
    z.risk_level AS Nivel_Riesgo,
    AVG(s.estimated_time) AS Tiempo_Promedio_Minutos,
    AVG(s.congestion_level) AS Nivel_Congestion_Promedio
FROM zones z
JOIN suggestions s
    ON z.id = s.zone_id
WHERE s.is_recommended = 1
GROUP BY
    z.name,
    z.risk_level
ORDER BY
    z.risk_level DESC,
    Tiempo_Promedio_Minutos DESC;
GO

/* CONSULTA 16
   Enunciado: Crear una función que reciba el ID de un usuario y retorne un número entero con la cantidad total de votos positivos (1)
   que han recibido todos los reportes hechos por ese usuario. Si el usuario no tiene votos, debe retornar 0.
*/
SELECT dbo.FTotalVotosPositivos(2) AS Total_Positivos;
GO

/* CONSULTA 17
   Enunciado: Crear una función que reciba como parámetro el estado de un reporte. 
   La función debe listar el nombre de todos los tipos de incidente y la cantidad total de reportes 
   que se encuentran en ese estado específico. Los tipos de incidente que no tengan reportes en ese estado deben figurar con 0.
*/
SELECT * FROM dbo.FReportesPorEstadoYTipo('ACTIVO');
GO

/* CONSULTA 18
   Enunciado: Crear una función que reciba el ID de una zona.
   Debe mostrar el nombre de todas las avenidas que pertenecen a esa zona y la cantidad total de semáforos 
   que sí tienen cámara (1). 
   Las avenidas de esa zona que no tengan cámaras instaladas en sus semáforos (o que no tengan semáforos) deben salir con 0.
*/
SELECT * FROM dbo.FCamarasPorAvenidaEnZona(5);
GO

/* CONSULTA 19
   Enunciado: Crear una función que reciba el ID de un tipo de incidente. 
   Debe retornar el promedio de imágenes que se suben por cada reporte de ese tipo.
*/
SELECT dbo.FPromedioFotosPorIncidente(1) AS Promedio_Fotos;
GO

/* CONSULTA 20
   Enunciado: Crear una función que reciba dos parámetros: un ID de distrito y un año. 
   El reporte debe listar los nombres completos de todos los usuarios del sistema y la cantidad de reportes que hicieron en ese 
   distrito específico, durante ese año específico. Si un usuario no hizo reportes ahí o en ese año, debe aparecer con 0.
*/
SELECT * FROM dbo.FActividadUsuariosPorDistrito(1, 2026);
GO