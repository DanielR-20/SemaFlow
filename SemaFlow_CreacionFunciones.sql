/* SCRIPT 2: CREACIÓN DE FUNCIONES 
   BASE DE DATOS: SemaFlow */

USE SemaFlow;
GO

/* Función para la Consulta 6 */

DROP FUNCTION IF EXISTS dbo.FReportesPorUsuarioYDistrito;
GO

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

/* Función para la Consulta 16 */

DROP FUNCTION IF EXISTS dbo.FTotalVotosPositivos;
GO

CREATE FUNCTION dbo.FTotalVotosPositivos (@user_id int)
RETURNS int
AS
BEGIN
    DECLARE @total_votos int;

    SELECT @total_votos = COUNT(rv.id)
    FROM traffic_reports tr
    JOIN report_votes rv ON tr.id = rv.traffic_report_id
    WHERE tr.user_id = @user_id 
      AND rv.is_upvote = 1;

    RETURN ISNULL(@total_votos, 0);
END
GO

/* Función para la Consulta 17 */

DROP FUNCTION IF EXISTS dbo.FReportesPorEstadoYTipo;
GO

CREATE FUNCTION dbo.FReportesPorEstadoYTipo (@estado varchar(20))
RETURNS TABLE
AS
RETURN (
    SELECT 
        it.name AS Tipo_Incidente,
        COUNT(tr.id) AS Cantidad_Reportes
    FROM incident_types it
    LEFT JOIN traffic_reports tr 
        ON it.id = tr.incident_type_id 
       AND tr.status = @estado
    GROUP BY 
        it.id, 
        it.name
)
GO

/* Función para la Consulta 18 */

DROP FUNCTION IF EXISTS dbo.FCamarasPorAvenidaEnZona;
GO

CREATE FUNCTION dbo.FCamarasPorAvenidaEnZona (@zone_id int)
RETURNS TABLE
AS
RETURN (
    SELECT 
        a.name AS Avenida,
        COUNT(tl.id) AS Cantidad_Camaras
    FROM avenues a
    LEFT JOIN traffic_lights tl 
        ON a.zone_id = tl.zone_id 
       AND tl.has_camera = 1
    WHERE a.zone_id = @zone_id
    GROUP BY 
        a.id, 
        a.name
)
GO

/* Función para la Consulta 19 */

DROP FUNCTION IF EXISTS dbo.FPromedioFotosPorIncidente;
GO

CREATE FUNCTION dbo.FPromedioFotosPorIncidente (@tipo_id int)
RETURNS decimal(10,2)
AS
BEGIN
    DECLARE @total_reportes int;
    DECLARE @total_imagenes int;
    DECLARE @promedio decimal(10,2) = 0.00;

    SELECT @total_reportes = COUNT(id)
    FROM traffic_reports
    WHERE incident_type_id = @tipo_id;

    SELECT @total_imagenes = COUNT(ri.id)
    FROM traffic_reports tr
    JOIN report_images ri ON tr.id = ri.traffic_report_id
    WHERE tr.incident_type_id = @tipo_id;

    IF @total_reportes > 0
    BEGIN
        SET @promedio = CAST(@total_imagenes AS decimal(10,2)) / @total_reportes;
    END

    RETURN @promedio;
END
GO

/* Función para la Consulta 20 */


DROP FUNCTION IF EXISTS dbo.FActividadUsuariosPorDistrito;
GO

CREATE FUNCTION dbo.FActividadUsuariosPorDistrito (@district_id int, @anio int)
RETURNS TABLE
AS
RETURN (
    SELECT 
        u.first_name + ' ' + u.last_name AS Usuario,
        COUNT(tr_filtrado.id) AS Cantidad_Reportes
    FROM users u
    LEFT JOIN (
        SELECT tr.id, tr.user_id
        FROM traffic_reports tr
        JOIN avenues a ON tr.avenue_id = a.id
        JOIN zones z ON a.zone_id = z.id
        WHERE z.district_id = @district_id 
          AND YEAR(tr.register_date) = @anio
    ) AS tr_filtrado ON u.id = tr_filtrado.user_id
    GROUP BY 
        u.id, 
        u.first_name, 
        u.last_name
)
GO