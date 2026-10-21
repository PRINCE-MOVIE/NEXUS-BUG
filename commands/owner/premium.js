/**
 * 🐛 ɴᴇxᴜs ᴄʀᴀsʜᴇʀ — Premium Command
 * Owner only (addpremium/rmpremium): grants or revokes premium.
 * Anyone (buyprem): shows the available plans.
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

module.exports = async (sock, msg, args, { isOwner, jid, sender }) => {
  const [cmdWord] = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '')
    .slice(config.prefix.length).trim().split(/\s+/);
  const word = (cmdWord || '').toLowerCase();

  // ── Anyone: show plans ───────────────────────────────────────────────────
  if (word === 'buyprem') {
    const plans = config.premiumPlans.map((p) =>
      `  ❯ *${p.name}* — ${p.price}\n     ↳ _${p.perks.join(', ')}_`
    ).join('\n\n');
    return antiban.sendHuman(sock, jid, {
      text: [
        `💎 *Premium Plans — ${config.botName}*`,
        ``,
        plans,
        ``,
        `_Contact the owner to upgrade: wa.me/${config.ownerNumber[0]}_`,
      ].join('\n'),
    }, { quoted: msg });
  }

  // ── Owner only: grant / revoke ───────────────────────────────────────────
  if (!isOwner) {
    return antiban.sendHuman(sock, jid, { text: '❌ Owner only command.' }, { quoted: msg });
  }

  const isRemove = word === 'rmpremium';
  const target = targetJid(msg, args);
  if (!target) {
    return antiban.sendHuman(sock, jid, {
      text: `💎 *${isRemove ? 'Remove' : 'Add'} Premium*\n\n*Usage:* ${config.prefix}${word} <number or @mention>${isRemove ? '' : ' [days]'}\n*Example:* ${config.prefix}${word} 243860885022${isRemove ? '' : ' 30'}`,
    }, { quoted: msg });
  }

  if (isRemove) {
    db.removePremium(target);
    return antiban.sendHuman(sock, jid, { text: `✅ *Premium removed:* @${target.split('@')[0]}`, mentions: [target] }, { quoted: msg });
  }

  const days = Math.max(1, parseInt(args[1], 10) || 30);
  db.addPremium(target, days);
  await antiban.sendHuman(sock, jid, {
    text: `💎 *Premium granted:* @${target.split('@')[0]}\n⏳ *Duration:* ${days} day(s)`,
    mentions: [target],
  }, { quoted: msg });
};
