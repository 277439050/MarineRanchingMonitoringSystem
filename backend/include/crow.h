#pragma once

#include <string>
#include <functional>
#include <map>
#include <vector>
#include <sstream>
#include <winsock2.h>
#include <ws2tcpip.h>

#pragma comment(lib, "ws2_32.lib")

namespace crow {

struct request {
    std::string method;
    std::string url;
    std::string body;
    std::map<std::string, std::string> headers;
    std::map<std::string, std::string> url_params;
};

struct response {
    int code = 200;
    std::string body;
    std::map<std::string, std::string> headers;

    response() {}
    response(int c) : code(c) {}
    response(int c, const std::string& b) : code(c), body(b) {}

    void set_header(const std::string& key, const std::string& value) {
        headers[key] = value;
    }

    void write(const std::string& s) { body += s; }
    void end() {}
    void end(const std::string& s) { body = s; }

    std::string dump() {
        std::ostringstream oss;
        oss << "HTTP/1.1 " << code << " OK\r\n";
        oss << "Content-Type: application/json\r\n";
        oss << "Content-Length: " << body.size() << "\r\n";
        for (auto& h : headers) {
            oss << h.first << ": " << h.second << "\r\n";
        }
        oss << "\r\n" << body;
        return oss.str();
    }
};

using handler_t = std::function<void(const request&, response&)>;

class App {
    struct Route {
        std::string method;
        std::string pattern;
        handler_t handler;
    };

    std::vector<Route> routes;
    std::vector<std::function<void(request&, response&, std::function<void()>)>> middlewares_;

public:
    App& use(std::function<void(request&, response&, std::function<void()>)> mw) {
        middlewares_.push_back(mw);
        return *this;
    }

    App& route(const std::string& method, const std::string& pattern, handler_t h) {
        routes.push_back({method, pattern, h});
        return *this;
    }

    App& get(const std::string& pattern, handler_t h) { return route("GET", pattern, h); }
    App& post(const std::string& pattern, handler_t h) { return route("POST", pattern, h); }
    App& put(const std::string& pattern, handler_t h) { return route("PUT", pattern, h); }
    App& del(const std::string& pattern, handler_t h) { return route("DELETE", pattern, h); }

    bool match_route(const std::string& method, const std::string& url, Route*& matched, request& req) {
        for (auto& r : routes) {
            if (r.method != method) continue;
            std::vector<std::string> pat_parts, url_parts;
            std::istringstream ps(r.pattern), us(url);
            std::string seg;
            while (std::getline(ps, seg, '/')) if (!seg.empty()) pat_parts.push_back(seg);
            while (std::getline(us, seg, '/')) if (!seg.empty()) url_parts.push_back(seg);
            if (pat_parts.size() != url_parts.size()) continue;
            bool ok = true;
            for (size_t i = 0; i < pat_parts.size(); i++) {
                if (pat_parts[i].size() > 0 && pat_parts[i][0] == ':') {
                    req.url_params[pat_parts[i].substr(1)] = url_parts[i];
                } else if (pat_parts[i] != url_parts[i]) {
                    ok = false; break;
                }
            }
            if (ok) { matched = &r; return true; }
        }
        return false;
    }

    void handle_request(const request& raw_req, response& res) {
        request req = raw_req;
        Route* matched = nullptr;
        if (!match_route(req.method, req.url, matched, req)) {
            res.code = 404;
            res.body = R"({"code":404,"message":"未找到接口"})";
            return;
        }
        size_t mw_idx = 0;
        std::function<void()> next;
        next = [&]() {
            if (mw_idx < middlewares_.size()) {
                auto& mw = middlewares_[mw_idx++];
                mw(req, res, next);
            } else {
                matched->handler(req, res);
            }
        };
        next();
    }

    void port(int p) { port_ = p; }
    void multithreaded(int n) {}
    void loglevel(crow::LogLevel level) {}

    enum class LogLevel { Debug, Info, Warning, Error };

    void run() {
        WSADATA wsa;
        if (WSAStartup(MAKEWORD(2, 2), &wsa) != 0) return;
        SOCKET s = socket(AF_INET, SOCK_STREAM, 0);
        int opt = 1;
        setsockopt(s, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));
        sockaddr_in addr;
        addr.sin_family = AF_INET;
        addr.sin_addr.s_addr = INADDR_ANY;
        addr.sin_port = htons(port_);
        if (bind(s, (sockaddr*)&addr, sizeof(addr)) == SOCKET_ERROR) {
            closesocket(s); WSACleanup(); return;
        }
        listen(s, 10);
        printf("Server running on port %d\n", port_);
        while (true) {
            sockaddr_in cli; int clilen = sizeof(cli);
            SOCKET cs = accept(s, (sockaddr*)&cli, &clilen);
            if (cs == INVALID_SOCKET) continue;
            char buf[8192] = {};
            int n = recv(cs, buf, sizeof(buf) - 1, 0);
            if (n <= 0) { closesocket(cs); continue; }
            std::string raw(buf, n);
            request req;
            size_t sp1 = raw.find(' '), sp2 = raw.find(' ', sp1 + 1);
            req.method = raw.substr(0, sp1);
            req.url = raw.substr(sp1 + 1, sp2 - sp1 - 1);
            size_t body_start = raw.find("\r\n\r\n");
            if (body_start != std::string::npos) {
                req.body = raw.substr(body_start + 4);
            }
            response res;
            handle_request(req, res);
            std::string resp = res.dump();
            send(cs, resp.c_str(), resp.size(), 0);
            closesocket(cs);
        }
    }

private:
    int port_ = 8080;
};

}
