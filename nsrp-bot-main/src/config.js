// Every setting comes from environment variables (Railway → Variables, or .env locally).
const list = (v) => (v || '').split(',').map((s) => s.trim()).filter(Boolean);
const opt = (v) => (v && v.trim()) || null;

const config = {
  token: opt(process.env.DISCORD_TOKEN),
  guildId: opt(process.env.DISCORD_GUILD_ID),
  staffRoleIds: list(process.env.STAFF_ROLE_IDS),

  reviewChannelId: opt(process.env.APPLICATION_REVIEW_CHANNEL_ID),
  roles: {
    whitelist: opt(process.env.WHITELIST_ROLE_ID),
    ndle: opt(process.env.NDLE_ROLE_ID),
  },

  announceChannelId: opt(process.env.ANNOUNCE_CHANNEL_ID),

  fivem: {
    endpoint: opt(process.env.FIVEM_ENDPOINT),
    statusChannelId: opt(process.env.STATUS_CHANNEL_ID),
    connectCode: opt(process.env.FIVEM_CONNECT_CODE),
  },

  colors: { orange: 0xff8a1f, blue: 0x0a84ff, red: 0xed4245, green: 0x3ba55d },
};

const missing = ['token', 'guildId'].filter((k) => !config[k]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.map((k) => (k === 'token' ? 'DISCORD_TOKEN' : 'DISCORD_GUILD_ID')).join(', ')}`);
  process.exit(1);
}

module.exports = config;
