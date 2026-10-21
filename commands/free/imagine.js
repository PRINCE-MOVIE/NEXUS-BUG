/**
 * 🐛 ɴᴇxᴜs ᴄʀᴀsʜᴇʀ — AI Image Generation
 * By PRINCE TECH
 */
'use strict';
const antiban = require('../../utils/antiban');
const config  = require('../../config');

module.exports = async (sock, msg, args, { jid }) => {
  const prompt = args.join(' ').trim();
  if (!prompt) {
    return antiban.sendHuman(sock, jid, { text: `🎨 *Usage:* ${config.prefix}imagine <prompt>\n*Example:* ${config.prefix}imagine futuristic city at night` }, { quoted: msg });
  }

  await antiban.sendHuman(sock, jid, { text: '🎨 _Generating image..._' }, { quoted: msg });

  try {
    const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true`;
    await antiban.sendHuman(sock, jid, {
      image: { url: imgUrl },
      caption: `🎨 *AI Image*\n\n📝 *Prompt:* ${prompt}\n\n_🐛 ɴᴇxᴜs ᴄʀᴀsʜᴇʀ_`,
    }, { quoted: msg });
  } catch {
    await antiban.sendHuman(sock, jid, { text: '❌ Image generation failed. Try again.' }, { quoted: msg });
  }
};
