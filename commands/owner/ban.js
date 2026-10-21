/**
 * 🐛 ɴᴇxᴜs ᴄʀᴀsʜᴇʀ — Ban / Unban Command
 * Owner only: blocks a user from using the bot's commands.
 * By PRINCE TECH
 */
'use strict';

const antiban = require('../../utils/antiban');
const config  = require('../../config');
const db      = require('../../database');

function targetJid(msg, args) {
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if (mentioned) return mentioned;
  const raw = (args[0] || '').replace(/\D/g, '');
  return raw ? `${raw}@s.whatsapp.net` : null;
}

module.exports = async (sock, msg, args, { isOwner, jid }) => {
  if (!isOwner) {
    return antiban.sendHuman(sock, jid, { text: '❌ Owner only command.' }, { quoted: msg });
  }

  const [cmdWord] = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '')
    .slice(config.prefix.length).trim().split(/\s+/);
  const isUnban = (cmdWord || '').toLowerCase() === 'unban';

  const target = targetJid(msg, args);
  if (!target) {
    return antiban.sendHuman(sock, jid, {
      text: `🚫 *${isUnban ? 'Unban' : 'Ban'} Command*\n\n*Usage:* ${config.prefix}${isUnban ? 'unban' : 'ban'} <number or @mention>\n*Example:* ${config.prefix}${isUnban ? 'unban' : 'ban'} 243860885022`,
    }, { quoted: msg });
  }

  if (isUnban) {
    db.unban(target);
    return antiban.sendHuman(sock, jid, { text: `✅ *Unbanned:* @${target.split('@')[0]}`, mentions: [target] }, { quoted: msg });
  }

  db.ban(target);
  await antiban.sendHuman(sock, jid, { text: `🚫 *Banned:* @${target.split('@')[0]}`, mentions: [target] }, { quoted: msg });
};
