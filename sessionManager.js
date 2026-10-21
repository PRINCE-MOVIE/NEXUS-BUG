/**
 * 🐛 ɴᴇxᴜs ᴄʀᴀsʜᴇʀ v2.5.0.5.7 — Multi-User Session Manager
 *
 * Manages multiple independent Baileys bot instances.
 * Each user has their own isolated session directory, socket, and state.
 *
 * sessions/<phone>/   <- Baileys auth state files
 *
 * By PRINCE TECH
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const pino = require('pino');

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
} = require('baileys');

const config    = require('./config');
const antiban   = require('./utils/antiban');
const handler   = require('./handler');
const { decodeSession, clearSession } = require('./utils/session');
const welcomeMod  = require('./commands/group/welcome');
const autoProtect = require('./utils/autoprotect');
const channelUtil = require('./utils/channel');

// ── Root directory for all user sessions ─────────────────────────────────────
const SESSIONS_ROOT = path.resolve(process.env.SESSIONS_ROOT || './sessions');
if (!fs.existsSync(SESSIONS_ROOT)) fs.mkdirSync(SESSIONS_ROOT, { recursive: true });

const PAIR_TIMEOUT_MS = 60 * 1000;
const QR_TIMEOUT_MS   = 30 * 1000;

// ── WA version cache ─────────────────────────────────────────────────────────
// If the lookup fails we return `undefined` so Baileys uses the version bundled
// with the library. The old hard-coded fallback ([2, 24, 6]) is rejected by
// WhatsApp servers: the socket never opens and pairing codes are refused.
let _cachedVersion    = null;
let _versionFetchedAt = 0;
const VERSION_TTL_MS   = 6 * 60 * 60 * 1000;
const VERSION_RETRY_MS = 5 * 60 * 1000;

async function _getVersion() {
  if (Date.now() - _versionFetchedAt < VERSION_TTL_MS) return _cachedVersion || undefined;
  try {
    const { version } = await fetchLatestBaileysVersion();
    _cachedVersion    = version;
    _versionFetchedAt = Date.now();
    _log('WA version:', version.join('.'));
  } catch (e) {
    // Retry sooner than the normal TTL, keep the last good version if any.
    _versionFetchedAt = Date.now() - VERSION_TTL_MS + VERSION_RETRY_MS;
    _log('fetchLatestBaileysVersion failed, using Baileys default:', e.message);
  }
  return _cachedVersion || undefined;
}

// ── In-memory registry ───────────────────────────────────────────────────────
const _bots = new Map();

// ── Helpers ───────────────────────────────────────────────────────────────────
function _log(...args) { console.log('[SessionManager]', ...args); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function _sessionDir(phone) {
  return path.join(SESSIONS_ROOT, phone);
}

function maskPhone(phone) {
  if (!phone) return '—';
  const s = String(phone);
  if (s.length <= 6) return '+' + s;
  return '+' + s.slice(0, 3) + '***' + s.slice(-4);
}

// Digits only, 8–15 long. A "+", spaces or dashes make WhatsApp return a
// code that does not match the number, so we always normalise here.
function _cleanPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) throw new Error('Numéro invalide');
  return digits;
}

// A session is really paired once WhatsApp has sent us the account identity.
// (`creds.me` is NOT enough: Baileys fills it in as soon as a code is requested.)
function _isPaired(creds) {
  return !!(creds && (creds.registered === true || creds.account));
}

function _isPairedOnDisk(dir) {
  try {
    const creds = JSON.parse(fs.readFileSync(path.join(dir, 'creds.json'), 'utf8'));
    return _isPaired(creds);
  } catch {
    return false;
  }
}

function _newBot(phone) {
  return {
    phone,
    sessionDir: _sessionDir(phone),
    connected: false,
    socketReady: false,
    number: phone,
    socket: null,
    qr: null,
    qrResolve: null,
    qrReject: null,
    pairCodeResolve: null,
    pairCodeReject: null,
    pairCodeRequested: false,
    reconnectTimer: null,
    startedAt: Date.now(),
    attempt: 0,
    destroyed: false,
  };
}

// Promise that resolves when `bot[kind + 'Resolve']` is called, and rejects on
// timeout / session close (so the HTTP request never hangs forever).
function _waitFor(bot, kind, ms, timeoutMessage) {
  const p = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
      if (!bot.connected) _dropBot(bot, { wipe: true });
    }, ms);
    bot[kind + 'Resolve'] = (v) => { clearTimeout(timer); resolve(v); };
    bot[kind + 'Reject']  = (e) => { clearTimeout(timer); reject(e); };
  });
  p.catch(() => {}); // avoid "unhandled rejection" if nobody is awaiting any more
  return p;
}

function _rejectPending(bot, err) {
  if (bot.pairCodeReject) bot.pairCodeReject(err);
  if (bot.qrReject)       bot.qrReject(err);
  bot.pairCodeResolve = bot.pairCodeReject = null;
  bot.qrResolve = bot.qrReject = null;
}

// Fully stop a bot: no more reconnects, socket closed, removed from registry.
function _dropBot(bot, { wipe = false } = {}) {
  bot.destroyed   = true;
  bot.connected   = false;
  bot.socketReady = false;
  clearTimeout(bot.reconnectTimer);
  _rejectPending(bot, new Error('Session fermée, réessaie.'));
  _closeSocket(bot);
  if (_bots.get(bot.phone) === bot) _bots.delete(bot.phone);
  if (wipe) {
    try { fs.rmSync(bot.sessionDir, { recursive: true, force: true }); } catch {}
  }
}

function _closeSocket(bot) {
  const sock = bot.socket;
  if (!sock) return;
  bot.socket = null;
  try { sock.ev.removeAllListeners(); } catch {}
  try { sock.end(undefined); } catch {}
}

function _scheduleReconnect(bot, fast = false) {
  if (bot.destroyed) return;
  clearTimeout(bot.reconnectTimer);
  const delay = fast ? 500 : antiban.reconnectDelay(bot.attempt);
  _log(`Reconnecting ${maskPhone(bot.phone)} in ${Math.round(delay / 1000)}s (attempt ${bot.attempt})`);
  bot.reconnectTimer = setTimeout(async () => {
    try {
      await _connectSocket(bot);
    } catch (e) {
      _log(`Reconnect failed for ${maskPhone(bot.phone)}:`, e.message);
      _scheduleReconnect(bot);
    }
  }, delay);
}

// ── Boot all previously-saved sessions on startup ─────────────────────────────
async function bootSavedSessions() {
  await _getVersion();

  if (!fs.existsSync(SESSIONS_ROOT)) return;
  const dirs = fs.readdirSync(SESSIONS_ROOT).filter((d) =>
    fs.statSync(path.join(SESSIONS_ROOT, d)).isDirectory()
  );

  _log(`Found ${dirs.length} saved session(s)`);

  for (const phone of dirs) {
    const dir = path.join(SESSIONS_ROOT, phone);

    // Leftovers of a pairing that was never completed: they can never connect,
    // they only create sockets that loop forever and show up as "offline".
    if (!_isPairedOnDisk(dir)) {
      _log(`Removing unpaired session ${maskPhone(phone)}`);
      try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
      continue;
    }

    try {
      await createBot(phone);
    } catch (e) {
      _log(`Failed to boot session ${maskPhone(phone)}:`, e.message);
    }
    await sleep(800); // stagger connections, WhatsApp dislikes bursts
  }
}

// ── Create / connect a bot instance (no pairing, just boot) ──────────────────
async function createBot(phone) {
  // A live bot (connected or currently reconnecting) must never get a second
  // socket on the same credentials: the two kick each other out forever.
  const existing = _bots.get(phone);
  if (existing && !existing.destroyed) return existing;

  const sessionDir = _sessionDir(phone);
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  const bot = _newBot(phone);
  _bots.set(phone, bot);

  try {
    await _connectSocket(bot);
  } catch (e) {
    _log(`Initial connect failed for ${maskPhone(phone)}:`, e.message);
    _scheduleReconnect(bot);
  }
  return bot;
}

// Prepare a clean slate for a new pairing (code or QR).
async function _prepareFresh(phone) {
  const existing = _bots.get(phone);

  // Never wipe a live session: otherwise anyone typing someone else's number
  // would disconnect that person's bot.
  if (existing && existing.connected && !existing.destroyed) {
    throw new Error('Ce numéro est déjà connecté.');
  }

  if (existing) {
    _dropBot(existing);
    await sleep(600); // let any in-flight credential write finish before wiping
  }

  const sessionDir = _sessionDir(phone);
  fs.rmSync(sessionDir, { recursive: true, force: true });
  fs.mkdirSync(sessionDir, { recursive: true });

  const bot = _newBot(phone);
  _bots.set(phone, bot);
  return bot;
}

// ── Request pairing code for a phone number ──────────────────────────────────
// Resolves with the 8-char pairing code
async function requestPairCode(phone) {
  phone = _cleanPhone(phone);
  const bot = await _prepareFresh(phone);

  const codePromise = _waitFor(
    bot, 'pairCode', PAIR_TIMEOUT_MS,
    "WhatsApp n'a pas renvoyé de code à temps, réessaie."
  );

  try {
    await _connectSocket(bot);
  } catch (e) {
    _dropBot(bot, { wipe: true });
    throw e;
  }
  return codePromise;
}

// ── Request QR for a phone number ────────────────────────────────────────────
// Resolves with the QR string
async function requestQR(phone) {
  phone = _cleanPhone(phone);
  const bot = await _prepareFresh(phone);

  const qrPromise = _waitFor(bot, 'qr', QR_TIMEOUT_MS, 'QR generation timeout');

  try {
    await _connectSocket(bot);
  } catch (e) {
    _dropBot(bot, { wipe: true });
    throw e;
  }
  return qrPromise;
}

// ── Internal socket connection ───────────────────────────────────────────────
async function _connectSocket(bot) {
  if (bot.destroyed) return;

  // Make sure the previous socket (if any) is fully gone before opening a new one.
  _closeSocket(bot);

  bot.attempt++;
  const version = await _getVersion();
  if (bot.destroyed) return;
  const { state, saveCreds } = await useMultiFileAuthState(bot.sessionDir);
  if (bot.destroyed) return;

  const logger = pino({ level: 'silent' });

  const options = {
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: Browsers.ubuntu('Chrome'),
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
    emitOwnEvents: true,
    fireInitQueries: true,
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
    markOnlineOnConnect: true,
  };
  if (version) options.version = version;

  const sock = makeWASocket(options);
  bot.socket = sock;

  // Events from a socket that has since been replaced or dropped are ignored.
  const stale = () => bot.destroyed || bot.socket !== sock;

  // ── Credentials update ─────────────────────────────────────────────────────
  sock.ev.on('creds.update', () => {
    if (stale()) return;
    saveCreds();
  });

  // ── Connection update ──────────────────────────────────────────────────────
  sock.ev.on('connection.update', async (update) => {
    if (stale()) return;
    const { connection, lastDisconnect, qr } = update;

    // ── QR generated ─────────────────────────────────────────────────────────
    if (qr) {
      bot.qr = qr;
      _log(`QR generated for ${maskPhone(bot.phone)}`);

      if (bot.qrResolve) {
        bot.qrResolve(qr);
        bot.qrResolve = null;
        bot.qrReject  = null;
      }

      // ── Pairing code request ─────────────────────────────────────────────
      // Requested once per bot, as soon as the socket reaches the 'qr' stage
      // (handshake done). Asking twice invalidates the first code.
      if (bot.pairCodeResolve && !bot.pairCodeRequested && !_isPaired(state.creds)) {
        bot.pairCodeRequested = true;
        try {
          const code = await sock.requestPairingCode(bot.phone);
          if (stale()) return;
          _log(`✅ Pairing code for ${maskPhone(bot.phone)} generated`);
          if (bot.pairCodeResolve) bot.pairCodeResolve(code);
          bot.pairCodeResolve = null;
          bot.pairCodeReject  = null;
        } catch (e) {
          _log(`❌ Pairing code failed for ${maskPhone(bot.phone)}:`, e.message);
          if (bot.pairCodeReject) bot.pairCodeReject(e);
          _dropBot(bot, { wipe: true });
          return;
        }
      }
    }

    // ── Connected ────────────────────────────────────────────────────────────
    if (connection === 'open') {
      bot.connected   = true;
      bot.socketReady = true;
      bot.qr          = null;
      bot.attempt     = 0;
      const me = sock.user?.id?.split(':')[0] || bot.phone;
      bot.number = me;
      _log(`✅ Connected: ${maskPhone(me)}`);

      // Auto-follow the configured WhatsApp channel
      channelUtil.followChannel(sock).catch(() => {});
    }

    // ── Disconnected ─────────────────────────────────────────────────────────
    if (connection === 'close') {
      bot.connected   = false;
      bot.socketReady = false;

      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const paired     = _isPaired(state.creds);
      _log(`Connection closed for ${maskPhone(bot.phone)} (code ${statusCode ?? 'n/a'}, paired: ${paired})`);

      // The user removed the bot from "Linked devices" → session is dead.
      if (statusCode === DisconnectReason.loggedOut) {
        _log(`Session logged out: ${maskPhone(bot.phone)}`);
        _dropBot(bot);
        clearSession(bot.sessionDir);
        return;
      }

      // The same session was opened somewhere else (another server, a second
      // process...). Reconnecting would start an endless kick-out loop.
      if (statusCode === DisconnectReason.connectionReplaced) {
        _log(`Session ${maskPhone(bot.phone)} opened elsewhere, stopping this instance`);
        _dropBot(bot);
        return;
      }

      // WhatsApp asks for a restart right after a successful pairing: reconnect now.
      if (statusCode === DisconnectReason.restartRequired) {
        _scheduleReconnect(bot, true);
        return;
      }

      // Pairing never completed (code expired / not entered): clean up, the
      // user must request a new code. Reconnecting would only produce a code
      // that no longer matches the one displayed on the site.
      if (!paired) {
        _log(`Pairing not completed for ${maskPhone(bot.phone)}, discarding session`);
        _dropBot(bot, { wipe: true });
        return;
      }

      _scheduleReconnect(bot);
    }
  });

  // ── Message handler ────────────────────────────────────────────────────────
  sock.ev.on('messages.upsert', async (m) => {
    if (stale()) return;
    if (!m.messages || !m.messages.length) return;

    const channelJid = await channelUtil.resolveChannelJid(sock).catch(() => null);

    for (const msg of m.messages) {
      if (!msg.message) continue;

      // New post on the followed WhatsApp channel → auto-react, skip the
      // normal command handler (channel posts aren't bot commands).
      if (channelUtil.isChannelMessage(msg, channelJid)) {
        channelUtil.reactToMessage(sock, msg).catch(() => {});
        continue;
      }

      if (msg.key.fromMe) continue;
      try {
        await handler(sock, msg, bot);
      } catch (e) {
        console.error('[Handler Error]', e.message);
      }
    }
  });

  // ── Group participants update (welcome/goodbye) ────────────────────────────
  sock.ev.on('group-participants.update', async (update) => {
    if (stale()) return;
    try {
      await welcomeMod.handleGroupUpdate(sock, update);
    } catch {}
  });
}

// ── Destroy a session ────────────────────────────────────────────────────────
async function destroySession(phone) {
  const bot = _bots.get(phone);
  if (!bot) return false;
  _dropBot(bot);
  clearSession(bot.sessionDir);
  _log(`Destroyed session: ${maskPhone(phone)}`);
  return true;
}

// ── Public getters ───────────────────────────────────────────────────────────
function getBot(phone)  { return _bots.get(phone) || null; }
function getAllBots()    { return Array.from(_bots.values()); }

module.exports = {
  bootSavedSessions,
  createBot,
  destroySession,
  requestPairCode,
  requestQR,
  getBot,
  getAllBots,
  maskPhone,
};
