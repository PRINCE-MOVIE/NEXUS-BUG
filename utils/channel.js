/**
 * WhatsApp Channel — Auto-follow + Auto-react
 * Resolves the configured channel invite code to its JID, follows it
 * automatically on connect, and reacts to every new post on it.
 */
'use strict';

const config = require('../config');

// Cached per-process since there's only one target channel.
let cachedJid = null;

/**
 * Resolve the channel's JID from its invite code (cached after first call).
 */
async function resolveChannelJid(sock) {
  if (cachedJid) return cachedJid;
  if (!config.channel.inviteCode) return null;

  try {
    const meta = await sock.newsletterMetadata('invite', config.channel.inviteCode);
    if (meta?.id) {
      cachedJid = meta.id;
      return cachedJid;
    }
  } catch (e) {
    console.error('[Channel] Failed to resolve channel JID:', e.message);
  }
  return null;
}

/**
 * Follow the configured channel. Call once the socket connection is open.
 */
async function followChannel(sock) {
  if (!config.channel.autoFollow) return;

  try {
    const jid = await resolveChannelJid(sock);
    if (!jid) return;
    await sock.newsletterFollow(jid);
    console.log(`✅ Followed WhatsApp channel: ${jid}`);
  } catch (e) {
    // Already following, or a transient error — not fatal.
    console.error('[Channel] Follow failed:', e.message);
  }
}

/**
 * Whether a given message was posted on the followed channel.
 */
function isChannelMessage(msg, channelJid) {
  return !!channelJid && msg?.key?.remoteJid === channelJid;
}

/**
 * React to a channel post with the configured emoji.
 */
async function reactToMessage(sock, msg) {
  if (!config.channel.autoReact) return;

  try {
    await sock.sendMessage(msg.key.remoteJid, {
      react: { text: config.channel.reactEmoji, key: msg.key },
    });
  } catch (e) {
    console.error('[Channel] Auto-react failed:', e.message);
  }
}

module.exports = { resolveChannelJid, followChannel, isChannelMessage, reactToMessage };
