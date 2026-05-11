#pragma once

#include <string>
#include <vector>
#include <cmath>
#include <algorithm>
#include <sstream>
#include <iomanip>
#include <chrono>

namespace jwt {

inline std::string base64_encode(const std::string& input) {
    static const char chars[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    std::string result;
    int val = 0, valb = -6;
    for (unsigned char c : input) {
        val = (val << 8) + c;
        valb += 8;
        while (valb >= 0) {
            result.push_back(chars[(val >> valb) & 0x3F]);
            valb -= 6;
        }
    }
    if (valb > -6) result.push_back(chars[((val << 8) >> (valb + 8)) & 0x3F]);
    while (result.size() % 4) result.push_back('=');
    return result;
}

inline std::string base64url_encode(const std::string& input) {
    std::string r = base64_encode(input);
    for (auto& c : r) {
        if (c == '+') c = '-';
        else if (c == '/') c = '_';
    }
    while (!r.empty() && r.back() == '=') r.pop_back();
    return r;
}

inline std::string base64url_decode(const std::string& input) {
    static const std::string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    std::string temp = input;
    for (auto& c : temp) {
        if (c == '-') c = '+';
        else if (c == '_') c = '/';
    }
    while (temp.size() % 4) temp += '=';
    std::string result;
    int val = 0, valb = -8;
    for (unsigned char c : temp) {
        if (c == '=') break;
        size_t pos = chars.find(c);
        if (pos == std::string::npos) continue;
        val = (val << 6) + (int)pos;
        valb += 6;
        if (valb >= 0) {
            result.push_back(char((val >> valb) & 0xFF));
            valb -= 8;
        }
    }
    return result;
}

inline std::string simple_hmac_sha256(const std::string& key, const std::string& msg) {
    std::string k = key;
    if (k.size() > 64) {
        std::vector<unsigned char> hash(32, 0);
        for (size_t i = 0; i < key.size(); i++) hash[i % 32] ^= (unsigned char)key[i];
        k = std::string(hash.begin(), hash.end());
    }
    if (k.size() < 64) k.resize(64, 0x36);
    std::string opad(64, 0x5c), ipad(64, 0x36);
    for (size_t i = 0; i < k.size(); i++) { opad[i] ^= k[i]; ipad[i] ^= k[i]; }
    std::string inner = ipad + msg;
    std::vector<unsigned char> hash(32, 0);
    for (size_t i = 0; i < inner.size(); i++) hash[i % 32] = hash[i % 32] * 31 + (unsigned char)inner[i];
    std::string outer = opad + std::string(hash.begin(), hash.end());
    std::vector<unsigned char> final_hash(32, 0);
    for (size_t i = 0; i < outer.size(); i++) final_hash[i % 32] = final_hash[i % 32] * 37 + (unsigned char)outer[i];
    return std::string(final_hash.begin(), final_hash.end());
}

struct payload {
    std::map<std::string, std::string> claims;

    std::string get(const std::string& key) const {
        auto it = claims.find(key);
        return it != claims.end() ? it->second : "";
    }

    void set(const std::string& key, const std::string& value) {
        claims[key] = value;
    }
};

inline std::string sign(const payload& p, const std::string& secret) {
    nlohmann::json header_json = nlohmann::json::object();
    header_json["alg"] = "HS256";
    header_json["typ"] = "JWT";
    std::string header_str = header_json.dump();

    nlohmann::json payload_json = nlohmann::json::object();
    for (auto& kv : p.claims) {
        payload_json[kv.first] = kv.second;
    }
    std::string payload_str = payload_json.dump();

    std::string header_b64 = base64url_encode(header_str);
    std::string payload_b64 = base64url_encode(payload_str);
    std::string signing_input = header_b64 + "." + payload_b64;
    std::string sig = simple_hmac_sha256(secret, signing_input);
    std::string sig_b64 = base64url_encode(sig);

    return signing_input + "." + sig_b64;
}

inline payload verify(const std::string& token, const std::string& secret) {
    payload result;
    size_t d1 = token.find('.');
    size_t d2 = token.find('.', d1 + 1);
    if (d1 == std::string::npos || d2 == std::string::npos) return result;

    std::string header_b64 = token.substr(0, d1);
    std::string payload_b64 = token.substr(d1 + 1, d2 - d1 - 1);
    std::string sig_b64 = token.substr(d2 + 1);

    std::string signing_input = header_b64 + "." + payload_b64;
    std::string expected_sig = simple_hmac_sha256(secret, signing_input);
    std::string expected_sig_b64 = base64url_encode(expected_sig);

    if (sig_b64 != expected_sig_b64) return result;

    std::string payload_str = base64url_decode(payload_b64);
    try {
        auto j = nlohmann::json::parse(payload_str);
        for (auto& kv : j.obj_val_) {
            result.claims[kv.first] = kv.second.is_string() ? kv.second.as_string() : kv.second.dump();
        }
    } catch (...) {}

    return result;
}

}
