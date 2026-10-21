/**
 * 🐛 ɴᴇxᴜs ᴄʀᴀsʜᴇʀ — Bot Stats Command
 * Owner only: usage stats across all connected sub-bots.
 * By PRINCE TECH
 */
'use strict';

const antiban         = require('../../utils/antiban');
const config           = require('../../config');
const db               = require('../../database');
const sessionManager   = require('../../sessionManager');

module.exports = async (sock, msg, args, { isOwner, jid }) => {
  if (!isOwner) {
    return antiban.sendHuman(sock, jid, { text: '❌ Owner only command.' }, { quoted: msg });
  }

  const stats = db.getStats();
  const bots  = sessionManager.getAllBots();
  const connected = bots.filter((b) => b.connected).length;
  const upMs  = Date.now() - (stats.startTime || Date.now());
  const upStr = `${Math.floor(upMs / 3600000)}h ${Math.floor((upMs % 3600000) / 60000)}m`;

  await antiban.sendHuman(sock, jid, {
    text: [
      `📊 *Bot Stats — ${config.botName}*`,
      ``,
      `👥 *Sessions:* ${connected}/${bots.length} connected`,
      `💬 *Commands run:* ${stats.totalCommands || 0}`,
      `⏱️ *Since:* ${upStr} ago`,
      ``,
      bots.length
        ? bots.map((b) => `  ╰┈➤ ${sessionManager.maskPhone(b.phone)} — ${b.connected ? '🟢 online' : '🔴 offline'}`).join('\n')
        : '_No sessions yet._',
    ].join('\n'),
  }, { quoted: msg });
};
