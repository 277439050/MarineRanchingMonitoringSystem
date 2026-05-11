#include "database.h"
#include <fstream>
#include <sstream>
#include <cstring>

Database& Database::instance() {
    static Database db;
    return db;
}

std::string Database::col_text(sqlite3_stmt* stmt, int col) {
    const unsigned char* t = sqlite3_column_text(stmt, col);
    return t ? reinterpret_cast<const char*>(t) : "";
}

int Database::col_int(sqlite3_stmt* stmt, int col) {
    return sqlite3_column_int(stmt, col);
}

double Database::col_double(sqlite3_stmt* stmt, int col) {
    return sqlite3_column_double(stmt, col);
}

bool Database::init(const std::string& db_path, const std::string& sql_path) {
    int rc = sqlite3_open(db_path.c_str(), &db_);
    if (rc != SQLITE_OK) return false;

    sqlite3_exec(db_, "PRAGMA journal_mode=WAL;", nullptr, nullptr, nullptr);
    sqlite3_exec(db_, "PRAGMA foreign_keys=ON;", nullptr, nullptr, nullptr);

    std::ifstream ifs(sql_path);
    if (!ifs.is_open()) return true;
    std::stringstream ss;
    ss << ifs.rdbuf();
    std::string sql = ss.str();

    char* err = nullptr;
    rc = sqlite3_exec(db_, sql.c_str(), nullptr, nullptr, &err);
    if (err) sqlite3_free(err);
    return rc == SQLITE_OK;
}

void Database::close() {
    if (db_) {
        sqlite3_close(db_);
        db_ = nullptr;
    }
}

User Database::get_user_by_username(const std::string& username) {
    User u = {};
    sqlite3_stmt* stmt = nullptr;
    if (sqlite3_prepare_v2(db_, "SELECT id,username,password_hash,role,real_name,phone,email,created_at,updated_at FROM users WHERE username=?", -1, &stmt, nullptr) != SQLITE_OK) return u;
    sqlite3_bind_text(stmt, 1, username.c_str(), -1, SQLITE_TRANSIENT);
    if (sqlite3_step(stmt) == SQLITE_ROW) {
        u.id = col_int(stmt, 0);
        u.username = col_text(stmt, 1);
        u.password_hash = col_text(stmt, 2);
        u.role = col_text(stmt, 3);
        u.real_name = col_text(stmt, 4);
        u.phone = col_text(stmt, 5);
        u.email = col_text(stmt, 6);
        u.created_at = col_text(stmt, 7);
        u.updated_at = col_text(stmt, 8);
    }
    sqlite3_finalize(stmt);
    return u;
}

User Database::get_user_by_id(int id) {
    User u = {};
    sqlite3_stmt* stmt = nullptr;
    if (sqlite3_prepare_v2(db_, "SELECT id,username,password_hash,role,real_name,phone,email,created_at,updated_at FROM users WHERE id=?", -1, &stmt, nullptr) != SQLITE_OK) return u;
    sqlite3_bind_int(stmt, 1, id);
    if (sqlite3_step(stmt) == SQLITE_ROW) {
        u.id = col_int(stmt, 0);
        u.username = col_text(stmt, 1);
        u.password_hash = col_text(stmt, 2);
        u.role = col_text(stmt, 3);
        u.real_name = col_text(stmt, 4);
        u.phone = col_text(stmt, 5);
        u.email = col_text(stmt, 6);
        u.created_at = col_text(stmt, 7);
        u.updated_at = col_text(stmt, 8);
    }
    sqlite3_finalize(stmt);
    return u;
}

std::vector<Device> Database::get_all_devices() {
    std::vector<Device> result;
    sqlite3_stmt* stmt = nullptr;
    if (sqlite3_prepare_v2(db_, "SELECT id,name,type,location,status,ip_address,port,last_heartbeat,created_at,updated_at FROM devices ORDER BY id", -1, &stmt, nullptr) != SQLITE_OK) return result;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        Device d;
        d.id = col_int(stmt, 0);
        d.name = col_text(stmt, 1);
        d.type = col_text(stmt, 2);
        d.location = col_text(stmt, 3);
        d.status = col_text(stmt, 4);
        d.ip_address = col_text(stmt, 5);
        d.port = col_int(stmt, 6);
        d.last_heartbeat = col_text(stmt, 7);
        d.created_at = col_text(stmt, 8);
        d.updated_at = col_text(stmt, 9);
        result.push_back(d);
    }
    sqlite3_finalize(stmt);
    return result;
}

Device Database::get_device_by_id(int id) {
    Device d = {};
    sqlite3_stmt* stmt = nullptr;
    if (sqlite3_prepare_v2(db_, "SELECT id,name,type,location,status,ip_address,port,last_heartbeat,created_at,updated_at FROM devices WHERE id=?", -1, &stmt, nullptr) != SQLITE_OK) return d;
    sqlite3_bind_int(stmt, 1, id);
    if (sqlite3_step(stmt) == SQLITE_ROW) {
        d.id = col_int(stmt, 0);
        d.name = col_text(stmt, 1);
        d.type = col_text(stmt, 2);
        d.location = col_text(stmt, 3);
        d.status = col_text(stmt, 4);
        d.ip_address = col_text(stmt, 5);
        d.port = col_int(stmt, 6);
        d.last_heartbeat = col_text(stmt, 7);
        d.created_at = col_text(stmt, 8);
        d.updated_at = col_text(stmt, 9);
    }
    sqlite3_finalize(stmt);
    return d;
}

bool Database::insert_device(const Device& d, int& out_id) {
    sqlite3_stmt* stmt = nullptr;
    if (sqlite3_prepare_v2(db_, "INSERT INTO devices (name,type,location,ip_address,port) VALUES (?,?,?,?,?)", -1, &stmt, nullptr) != SQLITE_OK) return false;
    sqlite3_bind_text(stmt, 1, d.name.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, d.type.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, d.location.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 4, d.ip_address.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 5, d.port);
    bool ok = sqlite3_step(stmt) == SQLITE_DONE;
    if (ok) out_id = (int)sqlite3_last_insert_rowid(db_);
    sqlite3_finalize(stmt);
    return ok;
}

bool Database::update_device(int id, const Device& d) {
    sqlite3_stmt* stmt = nullptr;
    if (sqlite3_prepare_v2(db_, "UPDATE devices SET name=?,type=?,location=?,ip_address=?,port=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?", -1, &stmt, nullptr) != SQLITE_OK) return false;
    sqlite3_bind_text(stmt, 1, d.name.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, d.type.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, d.location.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 4, d.ip_address.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 5, d.port);
    sqlite3_bind_text(stmt, 6, d.status.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 7, id);
    bool ok = sqlite3_step(stmt) == SQLITE_DONE;
    sqlite3_finalize(stmt);
    return ok;
}

bool Database::delete_device(int id) {
    sqlite3_stmt* stmt = nullptr;
    if (sqlite3_prepare_v2(db_, "DELETE FROM devices WHERE id=?", -1, &stmt, nullptr) != SQLITE_OK) return false;
    sqlite3_bind_int(stmt, 1, id);
    bool ok = sqlite3_step(stmt) == SQLITE_DONE;
    sqlite3_finalize(stmt);
    return ok;
}

std::vector<SensorData> Database::get_latest_sensor_data(int device_id) {
    std::vector<SensorData> result;
    sqlite3_stmt* stmt = nullptr;
    if (device_id > 0) {
        if (sqlite3_prepare_v2(db_, "SELECT id,device_id,temperature,salinity,ph,dissolved_oxygen,turbidity,depth,wave_height,current_speed,recorded_at FROM sensor_data WHERE device_id=? ORDER BY recorded_at DESC LIMIT 1", -1, &stmt, nullptr) != SQLITE_OK) return result;
        sqlite3_bind_int(stmt, 1, device_id);
    } else {
        if (sqlite3_prepare_v2(db_, "SELECT id,device_id,temperature,salinity,ph,dissolved_oxygen,turbidity,depth,wave_height,current_speed,recorded_at FROM sensor_data ORDER BY recorded_at DESC LIMIT 10", -1, &stmt, nullptr) != SQLITE_OK) return result;
    }
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        SensorData s;
        s.id = col_int(stmt, 0);
        s.device_id = col_int(stmt, 1);
        s.temperature = col_double(stmt, 2);
        s.salinity = col_double(stmt, 3);
        s.ph = col_double(stmt, 4);
        s.dissolved_oxygen = col_double(stmt, 5);
        s.turbidity = col_double(stmt, 6);
        s.depth = col_double(stmt, 7);
        s.wave_height = col_double(stmt, 8);
        s.current_speed = col_double(stmt, 9);
        s.recorded_at = col_text(stmt, 10);
        result.push_back(s);
    }
    sqlite3_finalize(stmt);
    return result;
}

std::vector<SensorData> Database::get_sensor_history(int device_id, const std::string& start, const std::string& end, int limit) {
    std::vector<SensorData> result;
    std::string sql = "SELECT id,device_id,temperature,salinity,ph,dissolved_oxygen,turbidity,depth,wave_height,current_speed,recorded_at FROM sensor_data WHERE 1=1";
    if (device_id > 0) sql += " AND device_id=?";
    if (!start.empty()) sql += " AND recorded_at>=?";
    if (!end.empty()) sql += " AND recorded_at<=?";
    sql += " ORDER BY recorded_at DESC LIMIT ?";

    sqlite3_stmt* stmt = nullptr;
    if (sqlite3_prepare_v2(db_, sql.c_str(), -1, &stmt, nullptr) != SQLITE_OK) return result;
    int idx = 1;
    if (device_id > 0) sqlite3_bind_int(stmt, idx++, device_id);
    if (!start.empty()) sqlite3_bind_text(stmt, idx++, start.c_str(), -1, SQLITE_TRANSIENT);
    if (!end.empty()) sqlite3_bind_text(stmt, idx++, end.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, idx++, limit);

    while (sqlite3_step(stmt) == SQLITE_ROW) {
        SensorData s;
        s.id = col_int(stmt, 0);
        s.device_id = col_int(stmt, 1);
        s.temperature = col_double(stmt, 2);
        s.salinity = col_double(stmt, 3);
        s.ph = col_double(stmt, 4);
        s.dissolved_oxygen = col_double(stmt, 5);
        s.turbidity = col_double(stmt, 6);
        s.depth = col_double(stmt, 7);
        s.wave_height = col_double(stmt, 8);
        s.current_speed = col_double(stmt, 9);
        s.recorded_at = col_text(stmt, 10);
        result.push_back(s);
    }
    sqlite3_finalize(stmt);
    return result;
}

bool Database::insert_sensor_data(const SensorData& s, int& out_id) {
    sqlite3_stmt* stmt = nullptr;
    if (sqlite3_prepare_v2(db_, "INSERT INTO sensor_data (device_id,temperature,salinity,ph,dissolved_oxygen,turbidity,depth,wave_height,current_speed) VALUES (?,?,?,?,?,?,?,?,?)", -1, &stmt, nullptr) != SQLITE_OK) return false;
    sqlite3_bind_int(stmt, 1, s.device_id);
    sqlite3_bind_double(stmt, 2, s.temperature);
    sqlite3_bind_double(stmt, 3, s.salinity);
    sqlite3_bind_double(stmt, 4, s.ph);
    sqlite3_bind_double(stmt, 5, s.dissolved_oxygen);
    sqlite3_bind_double(stmt, 6, s.turbidity);
    sqlite3_bind_double(stmt, 7, s.depth);
    sqlite3_bind_double(stmt, 8, s.wave_height);
    sqlite3_bind_double(stmt, 9, s.current_speed);
    bool ok = sqlite3_step(stmt) == SQLITE_DONE;
    if (ok) out_id = (int)sqlite3_last_insert_rowid(db_);
    sqlite3_finalize(stmt);
    return ok;
}

std::vector<Alert> Database::get_alerts(bool acknowledged_only, const std::string& severity, int limit) {
    std::vector<Alert> result;
    std::string sql = "SELECT id,device_id,alert_type,severity,message,is_acknowledged,acknowledged_by,acknowledged_at,created_at FROM alerts WHERE 1=1";
    if (acknowledged_only) sql += " AND is_acknowledged=0";
    if (!severity.empty()) sql += " AND severity=?";
    sql += " ORDER BY created_at DESC LIMIT ?";

    sqlite3_stmt* stmt = nullptr;
    if (sqlite3_prepare_v2(db_, sql.c_str(), -1, &stmt, nullptr) != SQLITE_OK) return result;
    int idx = 1;
    if (!severity.empty()) sqlite3_bind_text(stmt, idx++, severity.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, idx++, limit);

    while (sqlite3_step(stmt) == SQLITE_ROW) {
        Alert a;
        a.id = col_int(stmt, 0);
        a.device_id = col_int(stmt, 1);
        a.alert_type = col_text(stmt, 2);
        a.severity = col_text(stmt, 3);
        a.message = col_text(stmt, 4);
        a.is_acknowledged = col_int(stmt, 5) != 0;
        a.acknowledged_by = col_int(stmt, 6);
        a.acknowledged_at = col_text(stmt, 7);
        a.created_at = col_text(stmt, 8);
        result.push_back(a);
    }
    sqlite3_finalize(stmt);
    return result;
}

bool Database::acknowledge_alert(int alert_id, int user_id) {
    sqlite3_stmt* stmt = nullptr;
    if (sqlite3_prepare_v2(db_, "UPDATE alerts SET is_acknowledged=1,acknowledged_by=?,acknowledged_at=CURRENT_TIMESTAMP WHERE id=?", -1, &stmt, nullptr) != SQLITE_OK) return false;
    sqlite3_bind_int(stmt, 1, user_id);
    sqlite3_bind_int(stmt, 2, alert_id);
    bool ok = sqlite3_step(stmt) == SQLITE_DONE;
    sqlite3_finalize(stmt);
    return ok;
}

std::vector<AlertRule> Database::get_alert_rules() {
    std::vector<AlertRule> result;
    sqlite3_stmt* stmt = nullptr;
    if (sqlite3_prepare_v2(db_, "SELECT id,name,metric,operator,threshold,severity,is_enabled,created_at FROM alert_rules ORDER BY id", -1, &stmt, nullptr) != SQLITE_OK) return result;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        AlertRule r;
        r.id = col_int(stmt, 0);
        r.name = col_text(stmt, 1);
        r.metric = col_text(stmt, 2);
        r.op = col_text(stmt, 3);
        r.threshold = col_double(stmt, 4);
        r.severity = col_text(stmt, 5);
        r.is_enabled = col_int(stmt, 6) != 0;
        r.created_at = col_text(stmt, 7);
        result.push_back(r);
    }
    sqlite3_finalize(stmt);
    return result;
}

bool Database::insert_alert_rule(const AlertRule& r, int& out_id) {
    sqlite3_stmt* stmt = nullptr;
    if (sqlite3_prepare_v2(db_, "INSERT INTO alert_rules (name,metric,operator,threshold,severity) VALUES (?,?,?,?,?)", -1, &stmt, nullptr) != SQLITE_OK) return false;
    sqlite3_bind_text(stmt, 1, r.name.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, r.metric.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, r.op.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_double(stmt, 4, r.threshold);
    sqlite3_bind_text(stmt, 5, r.severity.c_str(), -1, SQLITE_TRANSIENT);
    bool ok = sqlite3_step(stmt) == SQLITE_DONE;
    if (ok) out_id = (int)sqlite3_last_insert_rowid(db_);
    sqlite3_finalize(stmt);
    return ok;
}

bool Database::insert_alert(int device_id, const std::string& type, const std::string& severity, const std::string& message) {
    sqlite3_stmt* stmt = nullptr;
    if (sqlite3_prepare_v2(db_, "INSERT INTO alerts (device_id,alert_type,severity,message) VALUES (?,?,?,?)", -1, &stmt, nullptr) != SQLITE_OK) return false;
    sqlite3_bind_int(stmt, 1, device_id);
    sqlite3_bind_text(stmt, 2, type.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, severity.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 4, message.c_str(), -1, SQLITE_TRANSIENT);
    bool ok = sqlite3_step(stmt) == SQLITE_DONE;
    sqlite3_finalize(stmt);
    return ok;
}

bool Database::insert_command(int device_id, const std::string& cmd_type, const std::string& params, int issued_by, int& out_id) {
    sqlite3_stmt* stmt = nullptr;
    if (sqlite3_prepare_v2(db_, "INSERT INTO control_commands (device_id,command_type,parameters,issued_by) VALUES (?,?,?,?)", -1, &stmt, nullptr) != SQLITE_OK) return false;
    sqlite3_bind_int(stmt, 1, device_id);
    sqlite3_bind_text(stmt, 2, cmd_type.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, params.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 4, issued_by);
    bool ok = sqlite3_step(stmt) == SQLITE_DONE;
    if (ok) out_id = (int)sqlite3_last_insert_rowid(db_);
    sqlite3_finalize(stmt);
    return ok;
}

std::vector<ControlCommand> Database::get_command_logs(int device_id, int limit) {
    std::vector<ControlCommand> result;
    std::string sql = "SELECT id,device_id,command_type,parameters,status,issued_by,result,created_at,executed_at FROM control_commands WHERE 1=1";
    if (device_id > 0) sql += " AND device_id=?";
    sql += " ORDER BY created_at DESC LIMIT ?";

    sqlite3_stmt* stmt = nullptr;
    if (sqlite3_prepare_v2(db_, sql.c_str(), -1, &stmt, nullptr) != SQLITE_OK) return result;
    int idx = 1;
    if (device_id > 0) sqlite3_bind_int(stmt, idx++, device_id);
    sqlite3_bind_int(stmt, idx++, limit);

    while (sqlite3_step(stmt) == SQLITE_ROW) {
        ControlCommand c;
        c.id = col_int(stmt, 0);
        c.device_id = col_int(stmt, 1);
        c.command_type = col_text(stmt, 2);
        c.parameters = col_text(stmt, 3);
        c.status = col_text(stmt, 4);
        c.issued_by = col_int(stmt, 5);
        c.result = col_text(stmt, 6);
        c.created_at = col_text(stmt, 7);
        c.executed_at = col_text(stmt, 8);
        result.push_back(c);
    }
    sqlite3_finalize(stmt);
    return result;
}
