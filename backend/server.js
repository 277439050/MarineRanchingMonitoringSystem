const express = require('express');
const Database = require('better-sqlite3');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const CryptoJS = require('crypto-js');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = 8080;
const JWT_SECRET = 'ocean-ranch-secret-key-2026';
const DB_PATH = path.join(__dirname, 'data', 'ocean_ranch.db');
const SQL_INIT_PATH = path.join(__dirname, 'sql', 'init.sql');

app.use(cors());
app.use(express.json());

function initDatabase() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    const sql = fs.readFileSync(SQL_INIT_PATH, 'utf-8');
    db.exec(sql);
    return db;
}

const db = initDatabase();

function generateToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ code: 401, message: '未提供认证令牌' });
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ code: 401, message: '令牌无效或已过期' });
    }
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function generateMockSensorData(did) {
    return {
        did: did,
        ph: +(7.5 + Math.random() * 1.0).toFixed(2),
        salt: +(15 + Math.random() * 5).toFixed(2),
        o2: +(5 + Math.random() * 4).toFixed(2),
        nh3: +(0.5 + Math.random() * 3).toFixed(3),
        health: +(85 + Math.random() * 15).toFixed(1),
        timestamp: new Date().toISOString()
    };
}

function generateMockAlerts() {
    const now = new Date();
    return [
        { id: 1, did: '861106074432561', level: 'III', metric: 'o2', value: 4.2, threshold: 4.5, message: '溶解氧低于阈值', status: 'active', created_at: new Date(now.getTime() - 3600000).toISOString(), resolved_at: null },
        { id: 2, did: '861106074432561', level: 'II', metric: 'nh3', value: 5.8, threshold: 5.0, message: '氨氮超过阈值', status: 'active', created_at: new Date(now.getTime() - 1800000).toISOString(), resolved_at: null },
        { id: 3, did: '861106074432561', level: 'I', metric: 'o2', value: 1.8, threshold: 2.0, message: '溶解氧严重不足', status: 'acknowledged', created_at: new Date(now.getTime() - 7200000).toISOString(), resolved_at: null },
        { id: 4, did: '864068079363984', level: 'III', metric: 'ph', value: 6.2, threshold: 6.5, message: 'pH值偏低', status: 'resolved', created_at: new Date(now.getTime() - 14400000).toISOString(), resolved_at: new Date(now.getTime() - 10800000).toISOString() }
    ];
}

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }
    const passwordHash = hashPassword(password);
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password_hash = ?').get(username, passwordHash);
    if (!user) {
        return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }
    const token = generateToken(user);
    res.json({
        code: 200,
        message: '登录成功',
        data: {
            token,
            user: { id: user.id, username: user.username, role: user.role, phone: user.phone }
        }
    });
});

app.post('/api/auth/logout', authMiddleware, (req, res) => {
    res.json({ code: 200, message: '退出成功' });
});

app.get('/api/auth/profile', authMiddleware, (req, res) => {
    const user = db.prepare('SELECT id, username, role, phone, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
        return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    res.json({ code: 200, data: user });
});

app.get('/api/devices', authMiddleware, (req, res) => {
    const { type, status, page = 1, pageSize = 20 } = req.query;
    let sql = 'SELECT * FROM devices WHERE 1=1';
    const params = [];
    if (type) { sql += ' AND type = ?'; params.push(type); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY id';
    const devices = db.prepare(sql).all(...params);
    const total = devices.length;
    const start = (parseInt(page) - 1) * parseInt(pageSize);
    const paged = devices.slice(start, start + parseInt(pageSize));
    res.json({ code: 200, data: { list: paged, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

app.get('/api/devices/:id', authMiddleware, (req, res) => {
    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
    if (!device) {
        return res.status(404).json({ code: 404, message: '设备不存在' });
    }
    res.json({ code: 200, data: device });
});

app.post('/api/devices', authMiddleware, (req, res) => {
    const { name, did, type, sim_imei, sim_date } = req.body;
    if (!name || !did || !type) {
        return res.status(400).json({ code: 400, message: '设备名称、编号和类型不能为空' });
    }
    try {
        const result = db.prepare('INSERT INTO devices (name, did, type, sim_imei, sim_date, status) VALUES (?, ?, ?, ?, ?, ?)').run(name, did, type, sim_imei || '', sim_date || '', 'offline');
        const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(result.lastInsertRowid);
        res.json({ code: 200, message: '设备添加成功', data: device });
    } catch (e) {
        if (e.message.includes('UNIQUE')) {
            return res.status(400).json({ code: 400, message: '设备编号已存在' });
        }
        throw e;
    }
});

app.put('/api/devices/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
    if (!existing) {
        return res.status(404).json({ code: 404, message: '设备不存在' });
    }
    const { name, did, type, sim_imei, sim_date, status } = req.body;
    db.prepare('UPDATE devices SET name=?, did=?, type=?, sim_imei=?, sim_date=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(
        name || existing.name, did || existing.did, type || existing.type,
        sim_imei !== undefined ? sim_imei : existing.sim_imei,
        sim_date !== undefined ? sim_date : existing.sim_date,
        status || existing.status, id
    );
    const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
    res.json({ code: 200, message: '设备更新成功', data: device });
});

app.delete('/api/devices/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
    if (!existing) {
        return res.status(404).json({ code: 404, message: '设备不存在' });
    }
    db.prepare('DELETE FROM devices WHERE id = ?').run(id);
    res.json({ code: 200, message: '设备删除成功' });
});

app.get('/api/devices/:deviceId/shares', authMiddleware, (req, res) => {
    const shares = db.prepare('SELECT ds.*, u.username, d.name as device_name FROM device_shares ds JOIN users u ON ds.user_id = u.id JOIN devices d ON ds.device_id = d.id WHERE ds.device_id = ?').all(req.params.deviceId);
    res.json({ code: 200, data: shares });
});

app.post('/api/devices/:deviceId/shares', authMiddleware, (req, res) => {
    const { user_id, permission } = req.body;
    if (!user_id || !permission) {
        return res.status(400).json({ code: 400, message: '用户和权限不能为空' });
    }
    const result = db.prepare('INSERT INTO device_shares (device_id, user_id, permission) VALUES (?, ?, ?)').run(req.params.deviceId, user_id, permission);
    res.json({ code: 200, message: '分享成功', data: { id: result.lastInsertRowid } });
});

app.delete('/api/devices/:deviceId/shares/:shareId', authMiddleware, (req, res) => {
    db.prepare('DELETE FROM device_shares WHERE id = ? AND device_id = ?').run(req.params.shareId, req.params.deviceId);
    res.json({ code: 200, message: '取消分享成功' });
});

app.get('/api/sensor/realtime', authMiddleware, (req, res) => {
    const { did } = req.query;
    const sensorDevices = db.prepare("SELECT did FROM devices WHERE type = 'sensor'").all();
    const results = [];
    for (const d of sensorDevices) {
        if (did && d.did !== did) continue;
        const row = db.prepare('SELECT * FROM sensor_data WHERE did = ? ORDER BY timestamp DESC LIMIT 1').get(d.did);
        if (row) {
            results.push(row);
        } else {
            results.push(generateMockSensorData(d.did));
        }
    }
    if (results.length === 0) {
        results.push(generateMockSensorData(did || '861106074432561'));
    }
    res.json({ code: 200, data: did ? results[0] : results });
});

app.get('/api/sensor/history', authMiddleware, (req, res) => {
    const { did, start, end, metric, page = 1, pageSize = 20 } = req.query;
    let sql = 'SELECT * FROM sensor_data WHERE 1=1';
    const params = [];
    if (did) { sql += ' AND did = ?'; params.push(did); }
    if (start) { sql += ' AND timestamp >= ?'; params.push(start); }
    if (end) { sql += ' AND timestamp <= ?'; params.push(end); }
    sql += ' ORDER BY timestamp DESC';
    let rows = db.prepare(sql).all(...params);
    if (rows.length === 0) {
        const now = new Date();
        const targetDid = did || '861106074432561';
        for (let i = 0; i < 50; i++) {
            const t = new Date(now.getTime() - i * 3600000);
            rows.push({
                id: i + 1, did: targetDid,
                ph: +(7.5 + Math.random() * 1.0).toFixed(2),
                salt: +(15 + Math.random() * 5).toFixed(2),
                o2: +(5 + Math.random() * 4).toFixed(2),
                nh3: +(0.5 + Math.random() * 3).toFixed(3),
                health: +(85 + Math.random() * 15).toFixed(1),
                timestamp: t.toISOString()
            });
        }
        rows.reverse();
    }
    const total = rows.length;
    const startIdx = (parseInt(page) - 1) * parseInt(pageSize);
    const paged = rows.slice(startIdx, startIdx + parseInt(pageSize));
    res.json({ code: 200, data: { list: paged, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

app.get('/api/sensor/export', authMiddleware, (req, res) => {
    const { did, start, end, format } = req.query;
    let sql = 'SELECT * FROM sensor_data WHERE 1=1';
    const params = [];
    if (did) { sql += ' AND did = ?'; params.push(did); }
    if (start) { sql += ' AND timestamp >= ?'; params.push(start); }
    if (end) { sql += ' AND timestamp <= ?'; params.push(end); }
    sql += ' ORDER BY timestamp DESC LIMIT 1000';
    const rows = db.prepare(sql).all(...params);
    if (format === 'csv') {
        let csv = '时间,设备编号,pH,盐度,溶解氧,氨氮,健康度\n';
        for (const r of rows) {
            csv += `${r.timestamp},${r.did},${r.ph},${r.salt},${r.o2},${r.nh3},${r.health}\n`;
        }
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=sensor_data.csv');
        return res.send('\uFEFF' + csv);
    }
    res.json({ code: 200, data: rows });
});

app.post('/api/control/command', authMiddleware, (req, res) => {
    const { did, action, target } = req.body;
    if (!did || !action || !target) {
        return res.status(400).json({ code: 400, message: '设备编号、操作和目标不能为空' });
    }
    const device = db.prepare('SELECT * FROM devices WHERE did = ?').get(did);
    if (!device) {
        return res.status(404).json({ code: 404, message: '设备不存在' });
    }
    db.prepare('INSERT INTO control_logs (did, action, target, result, operator_id) VALUES (?, ?, ?, ?, ?)').run(
        did, action, target, 'success', req.user.id
    );
    res.json({ code: 200, message: '控制指令已发送', data: { did, action, target, result: 'success' } });
});

app.get('/api/control/logs', authMiddleware, (req, res) => {
    const { did, page = 1, pageSize = 20 } = req.query;
    let sql = 'SELECT cl.*, u.username as operator FROM control_logs cl JOIN users u ON cl.operator_id = u.id WHERE 1=1';
    const params = [];
    if (did) { sql += ' AND cl.did = ?'; params.push(did); }
    sql += ' ORDER BY cl.timestamp DESC';
    const rows = db.prepare(sql).all(...params);
    if (rows.length === 0) {
        const now = new Date();
        const mockLogs = [];
        const actions = ['open', 'close'];
        const targets = ['oxygen_pump', 'feeder'];
        for (let i = 0; i < 10; i++) {
            mockLogs.push({
                id: i + 1, did: did || '864068079363984',
                action: actions[i % 2], target: targets[Math.floor(i / 2) % 2],
                result: 'success', operator: 'admin',
                timestamp: new Date(now.getTime() - i * 3600000).toISOString()
            });
        }
        return res.json({ code: 200, data: { list: mockLogs, total: mockLogs.length, page: 1, pageSize: 20 } });
    }
    const total = rows.length;
    const startIdx = (parseInt(page) - 1) * parseInt(pageSize);
    const paged = rows.slice(startIdx, startIdx + parseInt(pageSize));
    res.json({ code: 200, data: { list: paged, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

app.get('/api/control/status', authMiddleware, (req, res) => {
    const { did } = req.query;
    res.json({
        code: 200,
        data: {
            did: did || '864068079363984',
            oxygen_pump: 'off',
            feeder: 'off',
            auto_oxygen: false,
            auto_oxygen_threshold: 4.5,
            auto_oxygen_duration: 120
        }
    });
});

app.get('/api/alerts', authMiddleware, (req, res) => {
    const { status, level, page = 1, pageSize = 20 } = req.query;
    let sql = 'SELECT * FROM alerts WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (level) { sql += ' AND level = ?'; params.push(level); }
    sql += ' ORDER BY created_at DESC';
    let rows = db.prepare(sql).all(...params);
    if (rows.length === 0) {
        rows = generateMockAlerts();
        if (status) rows = rows.filter(r => r.status === status);
        if (level) rows = rows.filter(r => r.level === level);
    }
    const total = rows.length;
    const startIdx = (parseInt(page) - 1) * parseInt(pageSize);
    const paged = rows.slice(startIdx, startIdx + parseInt(pageSize));
    res.json({ code: 200, data: { list: paged, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

app.put('/api/alerts/:id/acknowledge', authMiddleware, (req, res) => {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
    if (!existing) {
        db.prepare('UPDATE alerts SET status = ? WHERE id = ?').run('acknowledged', id);
        return res.json({ code: 200, message: '预警已确认' });
    }
    db.prepare('UPDATE alerts SET status = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?').run('acknowledged', id);
    res.json({ code: 200, message: '预警已确认' });
});

app.get('/api/alerts/rules', authMiddleware, (req, res) => {
    const rules = db.prepare('SELECT * FROM alert_rules ORDER BY id').all();
    res.json({ code: 200, data: rules });
});

app.post('/api/alerts/rules', authMiddleware, (req, res) => {
    const { metric, level, operator, threshold, auto_action } = req.body;
    if (!metric || !level || !operator || threshold === undefined) {
        return res.status(400).json({ code: 400, message: '规则参数不完整' });
    }
    const result = db.prepare('INSERT INTO alert_rules (metric, level, operator, threshold, auto_action) VALUES (?, ?, ?, ?, ?)').run(metric, level, operator, threshold, auto_action || null);
    const rule = db.prepare('SELECT * FROM alert_rules WHERE id = ?').get(result.lastInsertRowid);
    res.json({ code: 200, message: '规则添加成功', data: rule });
});

app.put('/api/alerts/rules/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const { metric, level, operator, threshold, auto_action } = req.body;
    db.prepare('UPDATE alert_rules SET metric=?, level=?, operator=?, threshold=?, auto_action=? WHERE id=?').run(
        metric, level, operator, threshold, auto_action || null, id
    );
    const rule = db.prepare('SELECT * FROM alert_rules WHERE id = ?').get(id);
    res.json({ code: 200, message: '规则更新成功', data: rule });
});

app.delete('/api/alerts/rules/:id', authMiddleware, (req, res) => {
    db.prepare('DELETE FROM alert_rules WHERE id = ?').run(req.params.id);
    res.json({ code: 200, message: '规则删除成功' });
});

app.post('/api/encryption/encrypt', authMiddleware, (req, res) => {
    const { plaintext, algorithm } = req.body;
    if (!plaintext) {
        return res.status(400).json({ code: 400, message: '加密数据不能为空' });
    }
    const passphrase = 'ocean-ranch-aes-secret-key';
    const encrypted = CryptoJS.AES.encrypt(plaintext, passphrase).toString();
    db.prepare('INSERT INTO encryption_logs (user_id, algorithm, operation) VALUES (?, ?, ?)').run(req.user.id, algorithm || 'aes-256-cbc', 'encrypt');
    res.json({
        code: 200,
        data: {
            ciphertext: encrypted,
            algorithm: algorithm || 'aes-256-cbc'
        }
    });
});

app.post('/api/encryption/decrypt', authMiddleware, (req, res) => {
    const { ciphertext, algorithm } = req.body;
    if (!ciphertext) {
        return res.status(400).json({ code: 400, message: '解密数据不能为空' });
    }
    try {
        const passphrase = 'ocean-ranch-aes-secret-key';
        const bytes = CryptoJS.AES.decrypt(ciphertext, passphrase);
        const plaintext = bytes.toString(CryptoJS.enc.Utf8);
        db.prepare('INSERT INTO encryption_logs (user_id, algorithm, operation) VALUES (?, ?, ?)').run(req.user.id, algorithm || 'aes-256-cbc', 'decrypt');
        res.json({ code: 200, data: { plaintext, algorithm: algorithm || 'aes-256-cbc' } });
    } catch (e) {
        res.status(400).json({ code: 400, message: '解密失败，密钥可能不正确' });
    }
});

app.get('/api/encryption/history', authMiddleware, (req, res) => {
    const { page = 1, pageSize = 20 } = req.query;
    const logs = db.prepare('SELECT el.*, u.username FROM encryption_logs el JOIN users u ON el.user_id = u.id ORDER BY el.timestamp DESC').all();
    const total = logs.length;
    const startIdx = (parseInt(page) - 1) * parseInt(pageSize);
    const paged = logs.slice(startIdx, startIdx + parseInt(pageSize));
    res.json({ code: 200, data: { list: paged, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
});

app.get('/api/prediction', authMiddleware, (req, res) => {
    const { did, metric, hours = 24 } = req.query;
    const hrs = parseInt(hours);
    const metricName = metric || 'o2';
    const now = new Date();
    const predictions = [];
    const baseValues = { o2: 7.0, ph: 7.9, nh3: 1.5, salt: 18.0, health: 92.0 };
    const amplitudes = { o2: 1.5, ph: 0.3, nh3: 0.8, salt: 2.0, health: 5.0 };
    const base = baseValues[metricName] || 7.0;
    const amp = amplitudes[metricName] || 1.0;
    for (let i = 1; i <= hrs; i++) {
        const t = new Date(now.getTime() + i * 3600000);
        const trend = -0.02 * i;
        const seasonal = Math.sin((i / 24) * Math.PI * 2) * amp * 0.3;
        const noise = (Math.random() - 0.5) * amp * 0.15;
        const predicted = +(base + trend + seasonal + noise).toFixed(2);
        const lower = +(predicted - amp * 0.1 * (1 + i / hrs)).toFixed(2);
        const upper = +(predicted + amp * 0.1 * (1 + i / hrs)).toFixed(2);
        predictions.push({ timestamp: t.toISOString(), value: predicted, lower_bound: lower, upper_bound: upper });
    }
    const lastVal = predictions[predictions.length - 1].value;
    const firstVal = predictions[0].value;
    const trendDir = lastVal > firstVal + 0.1 ? '上升' : lastVal < firstVal - 0.1 ? '下降' : '稳定';
    const metricLabels = { o2: '溶解氧', ph: 'pH值', nh3: '氨氮', salt: '盐度', health: '健康度' };
    let suggestion = '';
    if (metricName === 'o2' && trendDir === '下降') {
        suggestion = '预计未来' + hrs + '小时溶解氧将持续下降，建议提前启动增氧设备，确保溶氧量维持在安全水平。';
    } else if (metricName === 'nh3' && trendDir === '上升') {
        suggestion = '预计未来' + hrs + '小时氨氮浓度将上升，建议加强水质循环和换水操作。';
    } else if (metricName === 'ph' && (trendDir === '上升' || trendDir === '下降')) {
        suggestion = '预计未来' + hrs + '小时pH值将' + trendDir + '，建议关注水质变化，必要时调节酸碱度。';
    } else {
        suggestion = metricLabels[metricName] + '指标未来' + hrs + '小时趋势' + trendDir + '，当前无需特别干预，请持续关注。';
    }
    res.json({
        code: 200,
        data: {
            metric: metricName,
            predictions,
            summary: { trend: trendDir, predicted_end_value: lastVal, confidence: +(0.92 - hrs * 0.002).toFixed(2) },
            suggestion
        }
    });
});

app.post('/api/iot/login', (req, res) => {
    res.json({ code: 200, message: '物联网平台登录成功', data: { token: 'iot-proxy-token-' + Date.now(), expires_in: 7200 } });
});

app.post('/api/iot/devices', (req, res) => {
    const devices = db.prepare('SELECT * FROM devices').all();
    res.json({ code: 200, data: devices });
});

app.post('/api/iot/data', (req, res) => {
    const { did, ph, salt, o2, nh3, health } = req.body;
    if (!did) {
        return res.status(400).json({ code: 400, message: '设备编号不能为空' });
    }
    db.prepare('INSERT INTO sensor_data (did, ph, salt, o2, nh3, health) VALUES (?, ?, ?, ?, ?, ?)').run(
        did, ph || null, salt || null, o2 || null, nh3 || null, health || null
    );
    const rules = db.prepare('SELECT * FROM alert_rules').all();
    const metricMap = { ph, salt, o2, nh3, health };
    for (const rule of rules) {
        const val = metricMap[rule.metric];
        if (val !== undefined && val !== null) {
            let triggered = false;
            if (rule.operator === '>' && val > rule.threshold) triggered = true;
            if (rule.operator === '<' && val < rule.threshold) triggered = true;
            if (rule.operator === '>=' && val >= rule.threshold) triggered = true;
            if (rule.operator === '<=' && val <= rule.threshold) triggered = true;
            if (triggered) {
                const metricLabels = { o2: '溶解氧', nh3: '氨氮', ph: 'pH值', salt: '盐度', health: '健康度' };
                const opLabels = { '>': '超过', '<': '低于', '>=': '不低于', '<=': '不高于' };
                db.prepare('INSERT INTO alerts (did, level, metric, value, threshold, message) VALUES (?, ?, ?, ?, ?, ?)').run(
                    did, rule.level, rule.metric, val, rule.threshold,
                    `${metricLabels[rule.metric] || rule.metric}${opLabels[rule.operator]}阈值: ${val}`
                );
            }
        }
    }
    res.json({ code: 200, message: '数据上报成功' });
});

app.post('/api/iot/op', (req, res) => {
    res.json({ code: 200, message: '操作成功', data: { status: 'ok' } });
});

app.post('/api/iot/cmd', (req, res) => {
    res.json({ code: 200, message: '命令已转发', data: { command_id: 'cmd-' + Date.now(), status: 'sent' } });
});

app.post('/api/iot/history', (req, res) => {
    const { did, limit = 50 } = req.body;
    let sql = 'SELECT * FROM sensor_data WHERE 1=1';
    const params = [];
    if (did) { sql += ' AND did = ?'; params.push(did); }
    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);
    const rows = db.prepare(sql).all(...params);
    res.json({ code: 200, data: rows });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
});

app.listen(PORT, () => {
    console.log(`海洋智能牧场监测预测系统后端服务已启动`);
    console.log(`服务地址: http://localhost:${PORT}`);
    console.log(`数据库路径: ${DB_PATH}`);
});
