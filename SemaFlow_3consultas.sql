/* ============================================================
   CONSULTAS SQL — BASE DE DATOS: SemaFlow
   Motor: SQL Server
   ============================================================ */

USE SemaFlow;
GO

/* ============================================================
   CONSULTA 1
   Reportes de tráfico ACTIVOS con severidad ALTA, mostrando
   el usuario que reportó, la avenida y el tipo de incidente.
   (JOIN de 4 tablas + filtros)
   ============================================================ */

SELECT
    tr.id                          AS Reporte_id,
    tr.reference_point             AS Punto_referencia,
    tr.severity_level              AS Severidad,
    tr.status                      AS Estado,
    tr.register_date               AS Fecha_registro,
    it.name                        AS Tipo_incidente,
    a.name                         AS Avenida,
    CONCAT(u.first_name, ' ', u.last_name) AS reportado_por
FROM traffic_reports tr
JOIN incident_types it ON tr.incident_type_id = it.id
JOIN avenues a          ON tr.avenue_id       = a.id
JOIN users u            ON tr.user_id         = u.id
WHERE tr.status = 'ACTIVO'
  AND tr.severity_level = 'ALTA'
ORDER BY tr.register_date DESC;
GO


/* ============================================================
   CONSULTA 2
   Cantidad de reportes registrados por cada tipo de incidente,
   ordenados del tipo más reportado al menos reportado.
   (JOIN + GROUP BY + agregación)
   ============================================================ */

SELECT
    it.name             AS Tipo_incidente,
    COUNT(tr.id)         AS Cantidad_reportes,
    AVG(tr.latitude)     AS Latitud_promedio   -- solo referencial, no representa nada real
FROM incident_types it
LEFT JOIN traffic_reports tr ON tr.incident_type_id = it.id
GROUP BY it.name
ORDER BY cantidad_reportes DESC;
GO


/* ============================================================
   CONSULTA 3
   Usuarios que han hecho 3 o más reportes de tráfico,
   junto con su reputación y el promedio de votos positivos
   que reciben sus reportes. Ordenado por cantidad de reportes.
   (JOIN + GROUP BY + HAVING + subconsulta)
   ============================================================ */

SELECT
    u.id                                AS Usuario_id,
    CONCAT(u.first_name, ' ', u.last_name) AS Usuario,
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

/*
CONSULTA 4
Mostrar avenidas de doble sentido que sean consideradas vías rápidas.
Mostrar nombre, cantidad de carriles y el límite de velocidad.
Se considera vía rápida cuando su límite es mayor o igual a 60

avenues: id, name, road_type, lane_count, speed_limit, is_two_way
*/

SELECT 
        id AS Avenida_id,
        name AS Avenida, 
        lane_count AS Cantidad_carriles, 
        speed_limit AS Limite_velocidad 
FROM avenues
WHERE is_two_way = 1 
AND speed_limit >= 60
GO

/*
CONSULTA 5
Mostrar cantidad de semáforos instalados por cada distrito.
Mostrar su nombre y cantidad total de semáforos operativos o en mantenimiento
Los que no tengan semáforos registrados en ninguna zona también figuran como 0

districts: id, name
zones: id, district_id
traffic_lights: id, zone_id
*/

SELECT
        d.id AS Distrito_id,
        d.name AS Nombre_distrito,
        count(t.id) AS Cantidad_semaforos
FROM districts AS d
    left join zones AS z on d.id = z.district_id
    left join traffic_lights AS t on z.id = t.zone_id
GROUP BY d.id, d.name
GO

/*
CONSULTA 6
Crear una función o procedimiento que reciba como parámetro el ID de un usuario.
El reporte debe mostrar el nombre del distrito y la cantidad total de reportes de 
tráfico que ese usuario específico ha realizado en dicho distrito. 
Los distritos donde el usuario no ha hecho ningún reporte deben aparecer 
obligatoriamente con un monto de 0.

districts: id, name
zones: id, district_id
avenues: id, name, zone_id
traffic_reports: id, user_id, avenue_id
*/


CREATE FUNCTION dbo.FReportesPorUsuarioYDistrito (@user_id int)
RETURNS TABLE
AS
RETURN (
    SELECT 
        d.id AS Distrito_id,
        d.name AS Nombre_distrito,
        COUNT(tr.id) AS Cantidad_reportes
    FROM districts AS d
    LEFT JOIN zones AS z ON d.id = z.district_id
    LEFT JOIN avenues AS a ON z.id = a.zone_id
    LEFT JOIN traffic_reports AS tr ON a.id = tr.avenue_id AND tr.user_id = @user_id
    GROUP BY d.id, d.name
)
GO

SELECT * FROM dbo.FReportesPorUsuarioYDistrito(2);
GO


/*
CONSULTA 7
Mostrar las 5 avenidas con mayor cantidad de reportes registrados.
El reporte debe mostrar el nombre de la avenida, el distrito al que pertenece
y la cantidad total de reportes asociados a cada una.
Solo deben mostrarse las 5 avenidas con mayor cantidad de reportes.

districts: id, name
zones: id, district_id
avenues: id, name, zone_id
traffic_reports: id, avenue_id
*/

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


/*
CONSULTA 8
Mostrar la cantidad de reportes registrados por distrito,
clasificados según el estado del reporte (ACTIVO, RESUELTO o VENCIDO).
Debe mostrarse el nombre del distrito, el estado del reporte
y la cantidad total de reportes registrados para cada estado.

districts: id, name
zones: id, district_id
avenues: id, zone_id
traffic_reports: id, avenue_id, status
*/

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


/*
CONSULTA 9
Mostrar la cantidad de semáforos según su estado operativo
en cada distrito. El reporte debe mostrar el nombre del distrito,
el estado operativo del semáforo y la cantidad total registrada.
Los distritos sin semáforos también deben aparecer con cantidad 0.

districts: id, name
zones: id, district_id
traffic_lights: id, zone_id, operational_status
*/

SELECT
    d.id AS Distrito_id,
    d.name AS Nombre_distrito,
    ISNULL(t.operational_status, 'SIN SEMAFOROS') AS Estado_operativo,
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