/**
 * 🐛 ɴᴇxᴜs ᴄʀᴀsʜᴇʀ — Shutdown Command
 * Owner only: stops the bot process (no auto-restart, unlike .restart).
 * By PRINCE TECH
 */
'use strict';

const antiban = require('../../utils/antiban');
const config  = require('../../config');

module.exports = async (sock, msg, args, { isOwner, jid }) => {
  if (!isOwner) {
    return antiban.sendHuman(sock, jid, { text: '❌ Owner only command.' }, { quoted: msg });
  }

  await antiban.sendHuman(sock, jid, {
    text: `🛑 *Shutting down ${config.botName}...*\n\n_This will NOT restart automatically. Use your host's start command to bring it back up._`,
  }, { quoted: msg });

  setTimeout(() => {
    process.exit(0);
  }, 1500);
};
