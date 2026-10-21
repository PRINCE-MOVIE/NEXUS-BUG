/**
 * 🐛 ɴᴇxᴜs ᴄʀᴀsʜᴇʀ — Coin Toss
 * By PRINCE TECH
 */
'use strict';
const antiban = require('../../utils/antiban');

module.exports = async (sock, msg, args, { jid }) => {
  const result = Math.random() < 0.5 ? '🪙 *Heads!*' : '🪙 *Tails!*';
  await antiban.sendHuman(sock, jid, { text: `${result}\n\n_Flipped by 🐛 ɴᴇxᴜs ᴄʀᴀsʜᴇʀ_` }, { quoted: msg });
};
