

CREATE DATABASE SemaFlow;
GO

USE SemaFlow;
GO

/* TABLAS SIN DEPENDENCIAS (o con dependencias mínimas) */

CREATE TABLE districts
(
  id                 INT           IDENTITY(1,1) NOT NULL,
  name               VARCHAR(100)  NOT NULL,
  postal_code        VARCHAR(20)   NOT NULL,
  central_latitude   DECIMAL(9,6)  NOT NULL,
  central_longitude  DECIMAL(9,6)  NOT NULL,
  boundary_polygon   VARCHAR(MAX)  NOT NULL,  -- GeoJSON o WKT del polígono del distrito
  CONSTRAINT PK_districts PRIMARY KEY (id),
  CONSTRAINT UQ_districts_name UNIQUE (name)
);
GO

CREATE TABLE incident_types
(
  id                INT           IDENTITY(1,1) NOT NULL,
  name              VARCHAR(100)  NOT NULL,
  description       VARCHAR(500)  NOT NULL,
  icon_url          VARCHAR(500)  NOT NULL,
  default_severity  INT           NOT NULL DEFAULT 1,
  is_active         BIT           NOT NULL DEFAULT 1,
  CONSTRAINT PK_incident_types PRIMARY KEY (id),
  CONSTRAINT UQ_incident_types_name UNIQUE (name),
  CONSTRAINT UQ_incident_types_icon_url UNIQUE (icon_url),
  CONSTRAINT CK_incident_types_severity CHECK (default_severity BETWEEN 1 AND 5)
);
GO

CREATE TABLE users
(
  id                INT           IDENTITY(1,1) NOT NULL,
  first_name        VARCHAR(100)  NOT NULL,
  last_name         VARCHAR(100)  NOT NULL,
  email             VARCHAR(150)  NOT NULL,
  password          VARCHAR(255)  NOT NULL,   -- almacenar SIEMPRE el hash, nunca el password en texto plano
  reputation_score  INT           NOT NULL DEFAULT 0,
  is_active         BIT           NOT NULL DEFAULT 1,
  register_date     DATE          NOT NULL DEFAULT CAST(GETDATE() AS DATE),
  CONSTRAINT PK_users PRIMARY KEY (id),
  CONSTRAINT UQ_users_email UNIQUE (email)
);
GO

/* TABLAS QUE DEPENDEN DE districts */

CREATE TABLE zones
(
  id            INT           IDENTITY(1,1) NOT NULL,
  name          VARCHAR(100)  NOT NULL,
  risk_level    INT           NOT NULL,
  is_monitored  BIT           NOT NULL DEFAULT 0,
  district_id   INT           NOT NULL,
  CONSTRAINT PK_zones PRIMARY KEY (id),
  CONSTRAINT CK_zones_risk_level CHECK (risk_level BETWEEN 1 AND 5)
);
GO

/* TABLAS QUE DEPENDEN DE zones */

CREATE TABLE avenues
(
  id           INT           IDENTITY(1,1) NOT NULL,
  name         VARCHAR(100)  NOT NULL,
  road_type    VARCHAR(50)   NOT NULL,
  lane_count   INT           NOT NULL,
  speed_limit  INT           NOT NULL,
  is_two_way   BIT           NOT NULL DEFAULT 1,
  zone_id      INT           NOT NULL,
  CONSTRAINT PK_avenues PRIMARY KEY (id),
  CONSTRAINT CK_avenues_lane_count CHECK (lane_count > 0),
  CONSTRAINT CK_avenues_speed_limit CHECK (speed_limit > 0)
);
GO

CREATE TABLE traffic_lights
(
  id                     INT           IDENTITY(1,1) NOT NULL,
  latitude               DECIMAL(9,6)  NOT NULL,
  longitude              DECIMAL(9,6)  NOT NULL,
  has_camera             BIT           NOT NULL DEFAULT 0,
  operational_status     BIT           NOT NULL DEFAULT 1,
  last_maintenance_date  DATE          NOT NULL,
  zone_id                INT           NOT NULL,
  CONSTRAINT PK_traffic_lights PRIMARY KEY (id)
);
GO

/* TABLAS QUE DEPENDEN DE users */

CREATE TABLE routes
(
  id                     INT           IDENTITY(1,1) NOT NULL,
  origin_latitude        DECIMAL(9,6)  NOT NULL,
  origin_longitude       DECIMAL(9,6)  NOT NULL,
  destination_latitude   DECIMAL(9,6)  NOT NULL,
  destination_longitude  DECIMAL(9,6)  NOT NULL,
  consulted_date         DATE          NOT NULL DEFAULT CAST(GETDATE() AS DATE),
  user_id                INT           NOT NULL,
  CONSTRAINT PK_routes PRIMARY KEY (id)
);
GO

/* TABLAS QUE DEPENDEN DE avenues, incident_types, users */

CREATE TABLE traffic_reports
(
  id                INT           IDENTITY(1,1) NOT NULL,
  reference_point   VARCHAR(150)  NOT NULL,
  latitude          DECIMAL(9,6)  NOT NULL,
  longitude         DECIMAL(9,6)  NOT NULL,
  severity_level    VARCHAR(10)   NOT NULL DEFAULT 'MEDIA',
  description       VARCHAR(300)  NOT NULL,
  status            VARCHAR(20)   NOT NULL DEFAULT 'ACTIVO',
  register_date     DATE          NOT NULL DEFAULT CAST(GETDATE() AS DATE),
  incident_type_id  INT           NOT NULL,
  user_id           INT           NOT NULL,
  avenue_id         INT           NOT NULL,
  CONSTRAINT PK_traffic_reports PRIMARY KEY (id),
  CONSTRAINT CK_traffic_reports_severity CHECK (severity_level IN ('BAJA', 'MEDIA', 'ALTA')),
  CONSTRAINT CK_traffic_reports_status CHECK (status IN ('ACTIVO', 'RESUELTO', 'FALSO'))
);
GO

/* TABLAS QUE DEPENDEN DE traffic_reports / users */

CREATE TABLE report_images
(
  id                 INT           IDENTITY(1,1) NOT NULL,
  image_url          VARCHAR(500)  NOT NULL,
  file_size          INT           NOT NULL,
  uploaded_date      DATE          NOT NULL DEFAULT CAST(GETDATE() AS DATE),
  traffic_report_id  INT           NOT NULL,
  CONSTRAINT PK_report_images PRIMARY KEY (id),
  CONSTRAINT CK_report_images_file_size CHECK (file_size > 0)
);
GO

CREATE TABLE report_votes
(
  id                 INT  IDENTITY(1,1) NOT NULL,
  is_upvote          BIT  NOT NULL DEFAULT 1,
  voted_date         DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
  user_id            INT  NOT NULL,
  traffic_report_id  INT  NOT NULL,
  CONSTRAINT PK_report_votes PRIMARY KEY (id),
  CONSTRAINT UQ_report_votes_user_report UNIQUE (user_id, traffic_report_id)
  -- evita que el mismo usuario vote 2 veces el mismo reporte
);
GO

/*  TABLAS QUE DEPENDEN DE zones / routes */

CREATE TABLE suggestions
(
  id                INT            IDENTITY(1,1) NOT NULL,
  estimated_time    INT            NULL,          -- en minutos; puede no estar calculado aún
  distance          DECIMAL(10,2)  NOT NULL,       -- en kilómetros
  congestion_level  INT            NOT NULL,
  is_recommended    BIT            NOT NULL DEFAULT 0,
  zone_id           INT            NOT NULL,
  route_id          INT            NOT NULL,
  CONSTRAINT PK_suggestions PRIMARY KEY (id),
  CONSTRAINT CK_suggestions_congestion CHECK (congestion_level BETWEEN 1 AND 5)
);
GO

/*  LLAVES FORÁNEAS */

ALTER TABLE zones
  ADD CONSTRAINT FK_districts_TO_zones
    FOREIGN KEY (district_id)
    REFERENCES districts (id);
GO

ALTER TABLE avenues
  ADD CONSTRAINT FK_zones_TO_avenues
    FOREIGN KEY (zone_id)
    REFERENCES zones (id);
GO

ALTER TABLE traffic_lights
  ADD CONSTRAINT FK_zones_TO_traffic_lights
    FOREIGN KEY (zone_id)
    REFERENCES zones (id);
GO

ALTER TABLE routes
  ADD CONSTRAINT FK_users_TO_routes
    FOREIGN KEY (user_id)
    REFERENCES users (id);
GO

ALTER TABLE traffic_reports
  ADD CONSTRAINT FK_incident_types_TO_traffic_reports
    FOREIGN KEY (incident_type_id)
    REFERENCES incident_types (id);
GO

ALTER TABLE traffic_reports
  ADD CONSTRAINT FK_users_TO_traffic_reports
    FOREIGN KEY (user_id)
    REFERENCES users (id);
GO

ALTER TABLE traffic_reports
  ADD CONSTRAINT FK_avenues_TO_traffic_reports
    FOREIGN KEY (avenue_id)
    REFERENCES avenues (id);
GO

ALTER TABLE report_images
  ADD CONSTRAINT FK_traffic_reports_TO_report_images
    FOREIGN KEY (traffic_report_id)
    REFERENCES traffic_reports (id);
GO

ALTER TABLE report_votes
  ADD CONSTRAINT FK_users_TO_report_votes
    FOREIGN KEY (user_id)
    REFERENCES users (id);
GO

ALTER TABLE report_votes
  ADD CONSTRAINT FK_traffic_reports_TO_report_votes
    FOREIGN KEY (traffic_report_id)
    REFERENCES traffic_reports (id);
GO

ALTER TABLE suggestions
  ADD CONSTRAINT FK_zones_TO_suggestions
    FOREIGN KEY (zone_id)
    REFERENCES zones (id);
GO

ALTER TABLE suggestions
  ADD CONSTRAINT FK_routes_TO_suggestions
    FOREIGN KEY (route_id)
    REFERENCES routes (id);
GO

/* ÍNDICES SOBRE LLAVES FORANEAS
   (SQL Server no las indexa automáticamente, a diferencia
   de MySQL. Estas columnas se van a filtrar/unir seguido.) */


CREATE INDEX IX_zones_district_id            ON zones (district_id);
CREATE INDEX IX_avenues_zone_id              ON avenues (zone_id);
CREATE INDEX IX_traffic_lights_zone_id       ON traffic_lights (zone_id);
CREATE INDEX IX_routes_user_id               ON routes (user_id);
CREATE INDEX IX_traffic_reports_incident_id  ON traffic_reports (incident_type_id);
CREATE INDEX IX_traffic_reports_user_id      ON traffic_reports (user_id);
CREATE INDEX IX_traffic_reports_avenue_id    ON traffic_reports (avenue_id);
CREATE INDEX IX_report_images_report_id      ON report_images (traffic_report_id);
CREATE INDEX IX_report_votes_report_id       ON report_votes (traffic_report_id);
CREATE INDEX IX_suggestions_zone_id          ON suggestions (zone_id);
CREATE INDEX IX_suggestions_route_id         ON suggestions (route_id);
GO
