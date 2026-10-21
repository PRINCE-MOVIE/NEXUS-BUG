/**
 * 🐛 ɴᴇxᴜs ᴄʀᴀsʜᴇʀ — Set Name Command
 * Owner only: changes the bot's display name at runtime.
 * By PRINCE TECH
 */
'use strict';

const antiban = require('../../utils/antiban');
const config  = require('../../config');

module.exports = async (sock, msg, args, { isOwner, jid }) => {
  if (!isOwner) {
    return antiban.sendHuman(sock, jid, { text: '❌ Owner only command.' }, { quoted: msg });
  }

  const newName = args.join(' ').trim();

  if (!newName) {
    return antiban.sendHuman(sock, jid, {
      text: `✏️ *Set Name*\n\n*Usage:* ${config.prefix}setname <new name>\n*Example:* ${config.prefix}setname Nexus Crasher\n\n_Current name: *${config.botName}*_`,
    }, { quoted: msg });
  }

  const oldName = config.botName;
  config.botName = newName;

  try {
    await sock.updateProfileName(newName);
  } catch {
    // Not fatal: WhatsApp profile name update can fail (rate limit, no
    // permission); the in-memory bot name below still changes either way.
  }

  await antiban.sendHuman(sock, jid, {
    text: [
      `✏️ *Bot Name Updated!*`,
      ``,
      `🔄 *Old name:* ${oldName}`,
      `✅ *New name:* ${newName}`,
      ``,
      `_⚠️ This change is temporary until bot restarts._`,
      `_To make permanent, update BOT_NAME in your .env file._`,
    ].join('\n'),
  }, { quoted: msg });
};
