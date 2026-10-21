/**
 * 🐛 ɴᴇxᴜs ᴄʀᴀsʜᴇʀ — Image Caption (Vision AI)
 * By PRINCE TECH
 */
'use strict';
const antiban = require('../../utils/antiban');
const config  = require('../../config');

module.exports = async (sock, msg, args, { jid }) => {
  await antiban.sendHuman(sock, jid, {
    text: `👁️ *Vision AI*\n\n_Send an image with caption ${config.prefix}caption and I will describe it._\n\n⚠️ This feature requires an image to be sent with the command.`,
  }, { quoted: msg });
};
