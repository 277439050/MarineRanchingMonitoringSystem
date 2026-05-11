#pragma once

#include <string>
#include <vector>
#include <map>
#include "sqlite3.h"

struct Device {
    int id;
    std::string name;
    std::string type;
    std::string location;
    std::string status;
    std::string ip_address;
    int port;
    std::string last_heartbeat;
    std::string created_at;
    std::string updated_at;
};

struct SensorData {
    int id;
    int device_id;
    double temperature;
    double salinity;
    double ph;
    double dissolved_oxygen;
    double turbidity;
    double depth;
    double wave_height;
    double current_speed;
    std::string recorded_at;
};

struct Alert {
    int id;
    int device_id;
    std::string alert_type;
    std::string severity;
    std::string message;
    bool is_acknowledged;
    int acknowledged_by;
    std::string acknowledged_at;
    std::string created_at;
};

struct AlertRule {
    int id;
    std::string name;
    std::string metric;
    std::string op;
    double threshold;
    std::string severity;
    bool is_enabled;
    std::string created_at;
};

struct ControlCommand {
    int id;
    int device_id;
    std::string command_type;
    std::string parameters;
    std::string status;
    int issued_by;
    std::string result;
    std::string created_at;
    std::string executed_at;
};

struct User {
    int id;
    std::string username;
    std::string password_hash;
    std::string role;
    std::string real_name;
    std::string phone;
    std::string email;
    std::string created_at;
    std::string updated_at;
};

class Database {
public:
    static Database& instance();
    bool init(const std::string& db_path, const std::string& sql_path);
    void close();

    sqlite3* db() { return db_; }

    User get_user_by_username(const std::string& username);
    User get_user_by_id(int id);
    std::vector<Device> get_all_devices();
    Device get_device_by_id(int id);
    bool insert_device(const Device& d, int& out_id);
    bool update_device(int id, const Device& d);
    bool delete_device(int id);
    std::vector<SensorData> get_latest_sensor_data(int device_id);
    std::vector<SensorData> get_sensor_history(int device_id, const std::string& start, const std::string& end, int limit);
    bool insert_sensor_data(const SensorData& s, int& out_id);
    std::vector<Alert> get_alerts(bool acknowledged_only, const std::string& severity, int limit);
    bool acknowledge_alert(int alert_id, int user_id);
    std::vector<AlertRule> get_alert_rules();
    bool insert_alert_rule(const AlertRule& r, int& out_id);
    bool insert_alert(int device_id, const std::string& type, const std::string& severity, const std::string& message);
    bool insert_command(int device_id, const std::string& cmd_type, const std::string& params, int issued_by, int& out_id);
    std::vector<ControlCommand> get_command_logs(int device_id, int limit);

private:
    Database() : db_(nullptr) {}
    ~Database() { close(); }
    Database(const Database&) = delete;
    Database& operator=(const Database&) = delete;

    sqlite3* db_;
    static std::string col_text(sqlite3_stmt* stmt, int col);
    static int col_int(sqlite3_stmt* stmt, int col);
    static double col_double(sqlite3_stmt* stmt, int col);
};
