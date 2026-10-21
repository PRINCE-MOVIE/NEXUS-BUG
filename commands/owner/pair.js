/**
 * 🐛 ɴᴇxᴜs ᴄʀᴀsʜᴇʀ — Pair Command
 * Owner only: requests a pairing code for another number from chat,
 * without going through the website.
 * By PRINCE TECH
 */
'use strict';

const antiban        = require('../../utils/antiban');
const config          = require('../../config');
const sessionManager  = require('../../sessionManager');

module.exports = async (sock, msg, args, { isOwner, jid }) => {
  if (!isOwner) {
    return antiban.sendHuman(sock, jid, { text: '❌ Owner only command.' }, { quoted: msg });
  }

  const phone = (args[0] || '').replace(/\D/g, '');

  if (!phone || phone.length < 10 || phone.length > 15) {
    return antiban.sendHuman(sock, jid, {
      text: `🔗 *Pair Command*\n\n*Usage:* ${config.prefix}pair <phone number>\n*Example:* ${config.prefix}pair 243860885022\n\n_Digits only, 10 to 15 characters, no + or spaces._`,
    }, { quoted: msg });
  }

  await antiban.sendHuman(sock, jid, {
    text: `🔗 *Requesting pairing code for ${sessionManager.maskPhone(phone)}...*`,
  }, { quoted: msg });

  try {
    const code = await Promise.race([
      sessionManager.requestPairCode(phone),
      new Promise((_, rej) => setTimeout(() => rej(new Error('Pairing timeout (60s). Try again.')), 60000)),
    ]);

    await antiban.sendHuman(sock, jid, {
      text: [
        `✅ *Pairing Code Ready*`,
        ``,
        `📱 *Number:* ${sessionManager.maskPhone(phone)}`,
        `🔑 *Code:* ${code}`,
        ``,
        `_WhatsApp → Linked devices → Link with phone number, then enter this code before it expires._`,
      ].join('\n'),
    }, { quoted: msg });
  } catch (e) {
    await antiban.sendHuman(sock, jid, { text: `❌ *Pairing failed:* ${e.message}` }, { quoted: msg });
  }
};
