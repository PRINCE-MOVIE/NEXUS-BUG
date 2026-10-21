/**
 * 🐛 ɴᴇxᴜs ᴄʀᴀsʜᴇʀ — Broadcast Command
 * Owner only: sends a message to every user the bot has seen (DB-tracked),
 * unlike .announce which only posts in the current chat.
 * By PRINCE TECH
 */
'use strict';

const fs      = require('fs');
const path    = require('path');
const antiban = require('../../utils/antiban');
const config  = require('../../config');

const USERS_FILE = path.join(__dirname, '../../database/users.json');

module.exports = async (sock, msg, args, { isOwner, jid }) => {
  if (!isOwner) {
    return antiban.sendHuman(sock, jid, { text: '❌ Owner only command.' }, { quoted: msg });
  }

  const message = args.join(' ').trim();
  if (!message) {
    return antiban.sendHuman(sock, jid, {
      text: `📢 *Broadcast Command*\n\n*Usage:* ${config.prefix}broadcast <message>\n*Example:* ${config.prefix}broadcast New update is live, type .menu to see what's new!\n\n_Sends to every user the bot has recorded. Use sparingly — WhatsApp can flag accounts that send too many messages too fast._`,
    }, { quoted: msg });
  }

  let users = {};
  try { users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch {}
  const targets = Object.keys(users);

  if (!targets.length) {
    return antiban.sendHuman(sock, jid, { text: '⚠️ No known users to broadcast to yet.' }, { quoted: msg });
  }

  await antiban.sendHuman(sock, jid, {
    text: `📢 *Broadcasting to ${targets.length} user(s)...*\n_This may take a while to avoid spam flags._`,
  }, { quoted: msg });

  const text = [
    `╔═══════════════════════════════════╗`,
    `║  📢  *B R O A D C A S T*          ║`,
    `║  🐛  ${config.botName}  ║`,
    `╚═══════════════════════════════════╝`,
    ``,
    message,
    ``,
    `_👑 Sent by the owner · ${config.botName}_`,
  ].join('\n');

  let sent = 0, failed = 0;
  for (const target of targets) {
    try {
      await sock.sendMessage(target, { text });
      sent++;
    } catch {
      failed++;
    }
    // Slow, human-like pacing: broadcasting fast is the #1 cause of bans.
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1500));
  }

  await antiban.sendHuman(sock, jid, {
    text: `✅ *Broadcast done.*\n\n📤 Sent: ${sent}\n❌ Failed: ${failed}`,
  }, { quoted: msg });
};
