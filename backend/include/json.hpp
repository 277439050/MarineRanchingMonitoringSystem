#pragma once

#include <string>
#include <map>
#include <vector>
#include <sstream>
#include <stdexcept>
#include <cmath>
#include <algorithm>
#include <initializer_list>

namespace nlohmann {

class json {
public:
    enum class value_t { null_t, boolean, number_integer, number_float, string_t, array, object };

    json() : type_(value_t::null_t) {}
    json(std::nullptr_t) : type_(value_t::null_t) {}
    json(bool v) : type_(value_t::boolean), bool_val_(v) {}
    json(int v) : type_(value_t::number_integer), int_val_(v) {}
    json(long v) : type_(value_t::number_integer), int_val_(v) {}
    json(long long v) : type_(value_t::number_integer), int_val_(v) {}
    json(double v) : type_(value_t::number_float), float_val_(v) {}
    json(const char* v) : type_(value_t::string_t), str_val_(v) {}
    json(const std::string& v) : type_(value_t::string_t), str_val_(v) {}

    json(std::initializer_list<json> init) {
        if (init.size() > 0 && init.begin()->is_array_of_pairs()) {
            type_ = value_t::object;
            for (auto& el : init) {
                obj_val_[el.arr_val_[0].str_val_] = el.arr_val_[1];
            }
        } else {
            type_ = value_t::array;
            for (auto& el : init) arr_val_.push_back(el);
        }
    }

    static json object() { json j; j.type_ = value_t::object; return j; }
    static json array() { json j; j.type_ = value_t::array; return j; }

    bool is_array_of_pairs() const {
        if (type_ != value_t::array || arr_val_.size() != 2) return false;
        return arr_val_[0].type_ == value_t::string_t;
    }

    json& operator[](const std::string& key) {
        if (type_ == value_t::null_t) type_ = value_t::object;
        return obj_val_[key];
    }

    const json& operator[](const std::string& key) const {
        static json null_json;
        auto it = obj_val_.find(key);
        return it != obj_val_.end() ? it->second : null_json;
    }

    json& operator[](size_t idx) { return arr_val_[idx]; }
    const json& operator[](size_t idx) const { return arr_val_[idx]; }

    json& push_back(const json& v) {
        if (type_ == value_t::null_t) type_ = value_t::array;
        arr_val_.push_back(v);
        return arr_val_.back();
    }

    bool is_null() const { return type_ == value_t::null_t; }
    bool is_boolean() const { return type_ == value_t::boolean; }
    bool is_number() const { return type_ == value_t::number_integer || type_ == value_t::number_float; }
    bool is_string() const { return type_ == value_t::string_t; }
    bool is_array() const { return type_ == value_t::array; }
    bool is_object() const { return type_ == value_t::object; }

    bool as_bool() const { return bool_val_; }
    int as_int() const { return static_cast<int>(int_val_); }
    double as_double() const { return type_ == value_t::number_float ? float_val_ : static_cast<double>(int_val_); }
    std::string as_string() const { return str_val_; }

    size_t size() const {
        if (type_ == value_t::array) return arr_val_.size();
        if (type_ == value_t::object) return obj_val_.size();
        return 0;
    }

    bool contains(const std::string& key) const { return obj_val_.find(key) != obj_val_.end(); }

    std::string dump(int indent = -1) const {
        return serialize();
    }

    static json parse(const std::string& s) {
        size_t pos = 0;
        return parse_value(s, pos);
    }

private:
    value_t type_;
    bool bool_val_ = false;
    long long int_val_ = 0;
    double float_val_ = 0.0;
    std::string str_val_;
    std::vector<json> arr_val_;
    std::map<std::string, json> obj_val_;

    std::string serialize() const {
        switch (type_) {
            case value_t::null_t: return "null";
            case value_t::boolean: return bool_val_ ? "true" : "false";
            case value_t::number_integer: return std::to_string(int_val_);
            case value_t::number_float: {
                std::ostringstream oss;
                oss << float_val_;
                return oss.str();
            }
            case value_t::string_t: return "\"" + escape_string(str_val_) + "\"";
            case value_t::array: {
                std::string r = "[";
                for (size_t i = 0; i < arr_val_.size(); i++) {
                    if (i) r += ",";
                    r += arr_val_[i].serialize();
                }
                r += "]";
                return r;
            }
            case value_t::object: {
                std::string r = "{";
                bool first = true;
                for (auto& kv : obj_val_) {
                    if (!first) r += ",";
                    r += "\"" + escape_string(kv.first) + "\":" + kv.second.serialize();
                    first = false;
                }
                r += "}";
                return r;
            }
        }
        return "null";
    }

    static std::string escape_string(const std::string& s) {
        std::string r;
        for (char c : s) {
            if (c == '"') r += "\\\"";
            else if (c == '\\') r += "\\\\";
            else if (c == '\n') r += "\\n";
            else if (c == '\r') r += "\\r";
            else if (c == '\t') r += "\\t";
            else r += c;
        }
        return r;
    }

    static void skip_ws(const std::string& s, size_t& pos) {
        while (pos < s.size() && (s[pos] == ' ' || s[pos] == '\t' || s[pos] == '\n' || s[pos] == '\r')) pos++;
    }

    static json parse_value(const std::string& s, size_t& pos) {
        skip_ws(s, pos);
        if (pos >= s.size()) return json();
        char c = s[pos];
        if (c == '"') return parse_string(s, pos);
        if (c == '{') return parse_object(s, pos);
        if (c == '[') return parse_array(s, pos);
        if (c == 't' || c == 'f') return parse_bool(s, pos);
        if (c == 'n') { pos += 4; return json(); }
        return parse_number(s, pos);
    }

    static json parse_string(const std::string& s, size_t& pos) {
        pos++;
        std::string r;
        while (pos < s.size() && s[pos] != '"') {
            if (s[pos] == '\\') {
                pos++;
                if (pos < s.size()) {
                    switch (s[pos]) {
                        case '"': r += '"'; break;
                        case '\\': r += '\\'; break;
                        case 'n': r += '\n'; break;
                        case 'r': r += '\r'; break;
                        case 't': r += '\t'; break;
                        default: r += s[pos];
                    }
                }
            } else {
                r += s[pos];
            }
            pos++;
        }
        pos++;
        return json(r);
    }

    static json parse_number(const std::string& s, size_t& pos) {
        size_t start = pos;
        bool is_float = false;
        if (s[pos] == '-') pos++;
        while (pos < s.size() && (isdigit(s[pos]) || s[pos] == '.' || s[pos] == 'e' || s[pos] == 'E' || s[pos] == '+' || s[pos] == '-')) {
            if (s[pos] == '.' || s[pos] == 'e' || s[pos] == 'E') is_float = true;
            pos++;
        }
        std::string num = s.substr(start, pos - start);
        if (is_float) return json(std::stod(num));
        return json(std::stoll(num));
    }

    static json parse_bool(const std::string& s, size_t& pos) {
        if (s.substr(pos, 4) == "true") { pos += 4; return json(true); }
        pos += 5;
        return json(false);
    }

    static json parse_array(const std::string& s, size_t& pos) {
        json arr = json::array();
        pos++;
        skip_ws(s, pos);
        if (pos < s.size() && s[pos] == ']') { pos++; return arr; }
        while (true) {
            arr.push_back(parse_value(s, pos));
            skip_ws(s, pos);
            if (pos < s.size() && s[pos] == ',') { pos++; continue; }
            if (pos < s.size() && s[pos] == ']') { pos++; break; }
            break;
        }
        return arr;
    }

    static json parse_object(const std::string& s, size_t& pos) {
        json obj = json::object();
        pos++;
        skip_ws(s, pos);
        if (pos < s.size() && s[pos] == '}') { pos++; return obj; }
        while (true) {
            skip_ws(s, pos);
            json key = parse_string(s, pos);
            skip_ws(s, pos);
            pos++;
            json val = parse_value(s, pos);
            obj[key.as_string()] = val;
            skip_ws(s, pos);
            if (pos < s.size() && s[pos] == ',') { pos++; continue; }
            if (pos < s.size() && s[pos] == '}') { pos++; break; }
            break;
        }
        return obj;
    }
};

}
