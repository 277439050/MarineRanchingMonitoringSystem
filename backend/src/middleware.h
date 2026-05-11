#pragma once

#include "crow.h"
#include "json.hpp"
#include "jwt.h"
#include <string>

using json = nlohmann::json;

inline void cors_middleware(crow::request& req, crow::response& res, std::function<void()> next) {
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.set_header("Access-Control-Allow-Headers", "Content-Type,Authorization");
    if (req.method == "OPTIONS") {
        res.code = 204;
        return;
    }
    next();
}

inline void auth_middleware(crow::request& req, crow::response& res, std::function<void()> next) {
    std::string url = req.url;
    if (url.find("/api/auth/login") != std::string::npos ||
        url.find("/api/iot/") != std::string::npos ||
        req.method == "OPTIONS") {
        return next();
    }
    auto it = req.headers.find("Authorization");
    if (it == req.headers.end()) {
        res.code = 401;
        res.body = json::object();
        json r;
        r["code"] = 401;
        r["message"] = "未提供认证令牌";
        res.body = r.dump();
        return;
    }
    std::string auth = it->second;
    if (auth.substr(0, 7) != "Bearer ") {
        res.code = 401;
        json r;
        r["code"] = 401;
        r["message"] = "认证格式错误";
        res.body = r.dump();
        return;
    }
    std::string token = auth.substr(7);
    jwt::payload p = jwt::verify(token, "ocean-ranch-secret-key-2024");
    if (p.claims.empty()) {
        res.code = 401;
        json r;
        r["code"] = 401;
        r["message"] = "令牌无效或已过期";
        res.body = r.dump();
        return;
    }
    req.url_params["user_id"] = p.get("id");
    req.url_params["username"] = p.get("username");
    req.url_params["role"] = p.get("role");
    next();
}
