/**
 * 🐛 ɴᴇxᴜs ᴄʀᴀsʜᴇʀ v2.5.0.5.7 — Express Web Server
 * Provides: health check, pairing endpoint, QR endpoint, admin panel, dashboard.
 * By PRINCE TECH
 */
'use strict';

const express        = require('express');
const path           = require('path');
const qrcode         = require('qrcode');
const config         = require('./config');
const sessionManager = require('./sessionManager');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Health check (for Render / Railway) ──────────────────────────────────────
app.get('/', (req, res) => {
  const bots = sessionManager.getAllBots();
  const connected = bots.filter(b => b.connected).length;
  res.json({
    bot: config.botName,
    version: config.botVersion,
    status: 'running',
    bots: { total: bots.length, connected },
    uptime: Math.floor(process.uptime()) + 's',
  });
});

app.get('/health', (req, res) => res.sendStatus(200));

// ── Pairing page (GET) ──────────────────────────────────────────────────────
app.get('/pair', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Pairing code endpoint (POST) ─────────────────────────────────────────────
app.post('/pair', async (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^\d{10,15}$/.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number. Use digits only (10-15).' });
  }

  try {
    const code = await Promise.race([
      sessionManager.requestPairCode(phone),
      new Promise((_, rej) => setTimeout(() => rej(new Error('Pairing timeout (60s). Try again.')), 60000)),
    ]);
    res.json({ success: true, code });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── QR code endpoint (POST) ──────────────────────────────────────────────────
app.post('/qr', async (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^\d{10,15}$/.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number. Use digits only (10-15).' });
  }

  try {
    // Check if already connected
    const existing = sessionManager.getBot(phone);
    if (existing && existing.connected) {
      return res.json({ success: false, connected: true });
    }

    const qrData = await Promise.race([
      sessionManager.requestQR(phone),
      new Promise((_, rej) => setTimeout(() => rej(new Error('QR generation timeout (30s). Try again.')), 35000)),
    ]);

    if (!qrData) {
      return res.status(500).json({ error: 'Could not generate QR code.' });
    }

    // Convert QR string to data URL image
    const qrImage = await qrcode.toDataURL(qrData, { width: 300, margin: 2 });
    res.json({ success: true, qr: qrImage });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── QR page (GET - direct link) ──────────────────────────────────────────────
app.get('/qr', (req, res) => {
  res.redirect('/pair');
});

// ── Bot status list ──────────────────────────────────────────────────────────
app.get('/bots', (req, res) => {
  const bots = sessionManager.getAllBots().map(b => ({
    phone: sessionManager.maskPhone(b.phone),
    connected: b.connected,
    uptime: Math.floor((Date.now() - b.startedAt) / 1000) + 's',
  }));
  res.json({ bots });
});

// ── Admin: destroy session ───────────────────────────────────────────────────
app.post('/admin/destroy', async (req, res) => {
  const { phone, secret } = req.body;
  if (secret !== config.adminSecret) return res.status(403).json({ error: 'Unauthorized' });
  if (!phone) return res.status(400).json({ error: 'Phone required' });
  const ok = await sessionManager.destroySession(phone);
  res.json({ success: ok });
});

// ── Dashboard page ───────────────────────────────────────────────────────────
app.get('/dashboard', (req, res) => {
  const bots = sessionManager.getAllBots();
  const connected = bots.filter(b => b.connected).length;
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>ɴᴇxᴜs ᴄʀᴀsʜᴇʀ - Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #0a0a0a; color: #e0e0e0; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .header h1 { color: #00ff88; font-size: 2rem; }
    .header p { color: #888; margin-top: 5px; }
    .stats { display: flex; gap: 15px; justify-content: center; margin-bottom: 30px; flex-wrap: wrap; }
    .stat { background: #1a1a1a; border: 1px solid #333; border-radius: 10px; padding: 15px 25px; text-align: center; }
    .stat .num { font-size: 2rem; color: #00ff88; font-weight: bold; }
    .stat .label { color: #888; font-size: 0.85rem; }
    .bots { max-width: 600px; margin: 0 auto; }
    .bot { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
    .bot .phone { font-weight: 600; }
    .bot .status { padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; }
    .bot .online { background: #00ff8822; color: #00ff88; }
    .bot .offline { background: #ff444422; color: #ff4444; }
    .actions { text-align: center; margin-top: 30px; }
    .actions a { display: inline-block; padding: 12px 24px; background: #00ff88; color: #0a0a0a; border-radius: 8px; text-decoration: none; font-weight: 700; margin: 5px; }
    .actions a:hover { background: #00cc6a; }
    .footer { text-align: center; margin-top: 40px; color: #555; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🐛 ɴᴇxᴜs ᴄʀᴀsʜᴇʀ</h1>
    <p>Multi-User WhatsApp Bot Dashboard</p>
  </div>
  <div class="stats">
    <div class="stat"><div class="num">${bots.length}</div><div class="label">Total Bots</div></div>
    <div class="stat"><div class="num">${connected}</div><div class="label">Connected</div></div>
    <div class="stat"><div class="num">${Math.floor(process.uptime())}s</div><div class="label">Uptime</div></div>
  </div>
  <div class="bots">
    ${bots.map(b => `<div class="bot"><span class="phone">${sessionManager.maskPhone(b.phone)}</span><span class="status ${b.connected ? 'online' : 'offline'}">${b.connected ? 'Online' : 'Offline'}</span></div>`).join('')}
    ${bots.length === 0 ? '<p style="text-align:center;color:#666;">No bots connected yet.</p>' : ''}
  </div>
  <div class="actions">
    <a href="/pair">🔗 Pair New Device</a>
  </div>
  <div class="footer">ɴᴇxᴜs ᴄʀᴀsʜᴇʀ v${config.botVersion} · By PRINCE TECH</div>
</body>
</html>`;
  res.send(html);
});

module.exports = app;
