PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone TEXT DEFAULT '',
    role TEXT NOT NULL DEFAULT 'operator' CHECK(role IN ('admin', 'operator', 'viewer')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    did TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK(type IN ('sensor', 'camera', 'controller', 'weather')),
    sim_imei TEXT DEFAULT '',
    sim_date TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'offline' CHECK(status IN ('online', 'offline')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sensor_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    did TEXT NOT NULL,
    ph REAL,
    salt REAL,
    o2 REAL,
    nh3 REAL,
    health REAL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (did) REFERENCES devices(did)
);

CREATE INDEX IF NOT EXISTS idx_sensor_data_did_ts ON sensor_data(did, timestamp);

CREATE TABLE IF NOT EXISTS control_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    did TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    result TEXT NOT NULL CHECK(result IN ('success', 'failed')),
    operator_id INTEGER NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (did) REFERENCES devices(did),
    FOREIGN KEY (operator_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    did TEXT NOT NULL,
    level TEXT NOT NULL CHECK(level IN ('I', 'II', 'III')),
    metric TEXT NOT NULL,
    value REAL NOT NULL,
    threshold REAL NOT NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'acknowledged', 'resolved')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (did) REFERENCES devices(did)
);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);

CREATE TABLE IF NOT EXISTS alert_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric TEXT NOT NULL,
    level TEXT NOT NULL CHECK(level IN ('I', 'II', 'III')),
    operator TEXT NOT NULL CHECK(operator IN ('>', '<', '>=', '<=')),
    threshold REAL NOT NULL,
    auto_action TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS device_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    permission TEXT NOT NULL CHECK(permission IN ('view', 'view_and_control')),
    shared_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS encryption_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    algorithm TEXT NOT NULL,
    operation TEXT NOT NULL CHECK(operation IN ('encrypt', 'decrypt')),
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT OR IGNORE INTO users (id, username, password_hash, role) VALUES
(1, 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin');

INSERT OR IGNORE INTO devices (id, name, did, type, sim_imei, sim_date, status) VALUES
(1, '水质浮漂集成传感器', '861106074432561', 'sensor', '898604681524D0221278', '2026-12-01', 'online'),
(2, '水质联动控制箱', '864068079363984', 'controller', '', '2025-06-27', 'online'),
(3, '牧场1号摄像头', 'GK2177243', 'camera', '', '', 'online'),
(4, '气象监测站', 'WS001', 'weather', '', '2026-06-01', 'online');

INSERT OR IGNORE INTO alert_rules (id, metric, level, operator, threshold, auto_action) VALUES
(1, 'o2', 'III', '<', 4.5, 'open_oxygen_pump'),
(2, 'o2', 'II', '<', 3.5, 'open_oxygen_pump'),
(3, 'o2', 'I', '<', 2.0, 'open_oxygen_pump'),
(4, 'nh3', 'III', '>', 5.0, NULL),
(5, 'ph', 'III', '>', 9.0, NULL),
(6, 'ph', 'III', '<', 6.5, NULL);
