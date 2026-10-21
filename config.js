/**
 * 🐛 ɴᴇxᴜs ᴄʀᴀsʜᴇʀ v2.5.0.5.7 — Configuration
 * Edit values here OR set them as environment variables.
 * ENV vars always take priority over hardcoded values.
 * By PRINCE TECH
 */
'use strict';

module.exports = {
  // ── Owner ──────────────────────────────────────────────────────────────────
  ownerNumber: (process.env.OWNER_NUMBER || '243860885022').split(',').map(n => n.trim()),
  ownerName:   process.env.OWNER_NAME   || '𝐏ʀɪɴᴄᴇ 𝐓ᴇᴄʜx',

  // ── Bot ────────────────────────────────────────────────────────────────────
  botName:    process.env.BOT_NAME    || 'ɴᴇxᴜs ᴄʀᴀsʜᴇʀ',
  botVersion: '2.5.0.5.7',
  prefix:     process.env.PREFIX      || '.',
  timezone:   process.env.TZ          || 'Africa/Harare',

  // ── Session ────────────────────────────────────────────────────────────────
  sessionDir: process.env.SESSION_DIR  || './session',
  sessionID:  process.env.SESSION_ID   || '',

  // ── Web / Pairing server ───────────────────────────────────────────────────
  port: parseInt(process.env.PORT || '3000', 10),

  // ── Menu image ────────────────────────────────────────────────────────────
  menuImageUrl: process.env.MENU_IMAGE_URL || 'https://files.catbox.moe/mp1sly.jpeg',

  // ── WhatsApp Channel (auto-follow + auto-react) ────────────────────────────
  channel: {
    inviteCode:  process.env.CHANNEL_INVITE      || '0029Vb8KrLcJpe8piGeSfH0i',
    autoFollow:  process.env.CHANNEL_AUTO_FOLLOW !== 'false',
    autoReact:   process.env.CHANNEL_AUTO_REACT  !== 'false',
    reactEmoji:  process.env.CHANNEL_REACT_EMOJI || '❤️',
  },

  // ── Auto-features ─────────────────────────────────────────────────────────
  autoRead:       process.env.AUTO_READ        !== 'false',
  autoTyping:     process.env.AUTO_TYPING      !== 'false',
  autoReact:      process.env.AUTO_REACT       !== 'false',
  autoStatusView: process.env.AUTO_STATUS_VIEW !== 'false',
  antiSpam:       process.env.ANTI_SPAM        !== 'false',

  antiSpamLimit:  parseInt(process.env.ANTI_SPAM_LIMIT  || '8',  10),
  antiSpamWindow: parseInt(process.env.ANTI_SPAM_WINDOW || '10', 10),

  maxWarnings: parseInt(process.env.MAX_WARNINGS || '3', 10),

  // ── Premium pricing ────────────────────────────────────────────────────────
  premiumPlans: [
    { name: 'Basic',    price: '$2/month',  perks: ['20 downloads/day', 'Priority support'] },
    { name: 'Pro',      price: '$5/month',  perks: ['Unlimited downloads', 'VIP badge'] },
  ],

  // ── Admin Panel ──────────────────────────────────────────────────────────
  adminUsername: process.env.ADMIN_USERNAME || 'Prince',
  adminPassword: process.env.ADMIN_PASSWORD || 'Nexus1234',
  adminSecret:   process.env.ADMIN_SECRET   || 'nexus-prince-secret-2026',

  // ── WA Protection ─────────────────────────────────────────────────────────
  waProtect: process.env.WAPROTECT === 'true',

  // ── Download limits (per day) ─────────────────────────────────────────────
  limits: {
    free:    { play: 3,  video: 2,  tiktok: 3  },
    premium: { play: 20, video: 15, tiktok: 20 },
  },

  // ── Keyword auto-replies ───────────────────────────────────────────────────
  autoReplyKeywords: [
    { keyword: 'hi bot',          reply: '👋 *Hey there!* ɴᴇxᴜs ᴄʀᴀsʜᴇʀ at your service.\nType *.menu* to see what I can do 🐛' },
    { keyword: 'hello bot',       reply: '🐛 *Hello!* How can ɴᴇxᴜs assist you today?\nType *.menu* for commands.' },
    { keyword: 'hey bot',         reply: '👋 *Hey!* You called? Type *.menu* to get started.' },
    { keyword: 'good morning',    reply: '🌅 *Good Morning!* Rise and shine — have an amazing day ahead! ☀️' },
    { keyword: 'good afternoon',  reply: '☀️ *Good Afternoon!* Hope your day is going great! 💪' },
    { keyword: 'good evening',    reply: '🌆 *Good Evening!* Time to wind down and relax. 🌟' },
    { keyword: 'good night',      reply: '🌙 *Good Night!* Rest well and sleep tight. 💤' },
    { keyword: 'who made you',    reply: '👑 I was crafted by *PRINCE TECH* — powered by 🐛 ɴᴇxᴜs ᴄʀᴀsʜᴇʀ.' },
    { keyword: 'who created you', reply: '👑 *PRINCE TECH* built me! I am ɴᴇxᴜs ᴄʀᴀsʜᴇʀ v2.5.0.5.7 🐛' },
    { keyword: 'what can you do', reply: '🐛 I can do a lot! Type *.menu* to see all my commands.' },
    { keyword: 'are you a bot',   reply: '🤖 Yes! I am *ɴᴇxᴜs ᴄʀᴀsʜᴇʀ* — your intelligent WhatsApp bot. 🐛' },
    { keyword: 'nice bot',        reply: '😊 *Thank you!* I appreciate the love. 🐛' },
    { keyword: 'buy premium',     reply: '💎 *Want Premium?*\nType *.buyprem* to see all plans and pricing!' },
  ],
};
