const config = require('../config');
const { getStatus, statusEmbed } = require('./fivem');

const INTERVAL_MS = 60_000;
let message = null;

// Keeps one status message in STATUS_CHANNEL_ID up to date. On restart it finds and
// reuses the bot's previous status message instead of posting a new one.
async function start(client) {
  const channelId = config.fivem.statusChannelId;
  if (!channelId) return;
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased()) {
    console.warn(`Status board: channel ${channelId} not found or not a text channel`);
    return;
  }
  const recent = await channel.messages.fetch({ limit: 20 }).catch(() => null);
  message = recent?.find(
    (m) => m.author.id === client.user.id && m.embeds[0]?.title?.includes('Server Status'),
  ) || null;

  const tick = async () => {
    try {
      const embed = statusEmbed(await getStatus());
      if (message) await message.edit({ embeds: [embed] });
      else message = await channel.send({ embeds: [embed] });
    } catch (err) {
      console.error('Status board update failed:', err.message);
      if (err.code === 10008) message = null; // message deleted: post a fresh one next tick
    }
  };
  await tick();
  setInterval(tick, INTERVAL_MS).unref();
}

module.exports = { start };
