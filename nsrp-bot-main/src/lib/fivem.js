const { EmbedBuilder } = require('discord.js');
const config = require('../config');

// FiveM servers expose public JSON endpoints on their HTTP port (default 30120).
async function getJson(path) {
  const res = await fetch(`http://${config.fivem.endpoint}${path}`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function getStatus() {
  if (!config.fivem.endpoint) return { configured: false };
  try {
    const [dynamic, players] = await Promise.all([getJson('/dynamic.json'), getJson('/players.json')]);
    return {
      configured: true,
      online: true,
      players: Array.isArray(players) ? players.length : Number(dynamic.clients) || 0,
      maxPlayers: Number(dynamic.sv_maxclients) || null,
    };
  } catch (err) {
    return { configured: true, online: false, error: err.message };
  }
}

function statusEmbed(s) {
  const e = new EmbedBuilder().setTitle('Nevada State Roleplay · Server Status').setTimestamp();
  if (!s.configured) {
    return e.setColor(config.colors.blue).setDescription('The server is in development. Watch announcements for launch.');
  }
  if (!s.online) {
    return e.setColor(config.colors.red).setDescription('🔴 **Offline** (or not responding)');
  }
  e.setColor(config.colors.green).setDescription('🟢 **Online**').addFields({
    name: 'Players',
    value: s.maxPlayers ? `${s.players} / ${s.maxPlayers}` : String(s.players),
    inline: true,
  });
  if (config.fivem.connectCode) {
    e.addFields({ name: 'Connect', value: `\`connect ${config.fivem.connectCode}\``, inline: true });
  }
  return e;
}

module.exports = { getStatus, statusEmbed };
