const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');
const config = require('./config');
const applications = require('./lib/applications');
const statusBoard = require('./lib/statusBoard');

// Only the Guilds intent: no privileged intents needed for anything this bot does.
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
for (const file of fs.readdirSync(path.join(__dirname, 'commands')).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(__dirname, 'commands', file));
  client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, async (c) => {
  console.log(`Logged in as ${c.user.tag}`);
  // Guild commands update instantly, so registering on every start keeps them in sync.
  const guild = await c.guilds.fetch(config.guildId).catch(() => null);
  if (!guild) {
    console.error(`Bot is not in guild ${config.guildId}. Invite it, then restart.`);
  } else {
    await guild.commands.set(client.commands.map((cmd) => cmd.data.toJSON()));
    console.log(`Registered ${client.commands.size} commands in ${guild.name}`);
  }
  await statusBoard.start(c);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      await client.commands.get(interaction.commandName)?.execute(interaction);
    } else if ((interaction.isButton() || interaction.isModalSubmit()) && interaction.customId.startsWith('app:')) {
      await applications.handle(interaction);
    }
  } catch (err) {
    console.error(`Interaction ${interaction.customId || interaction.commandName} failed:`, err);
    const reply = { content: 'Something went wrong. Please try again or tell a staff member.', flags: MessageFlags.Ephemeral };
    if (interaction.isRepliable()) {
      await (interaction.replied || interaction.deferred ? interaction.followUp(reply) : interaction.reply(reply)).catch(() => {});
    }
  }
});

client.on(Events.Error, (err) => console.error('Client error:', err.message));
process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));

// Railway sends SIGTERM on redeploy: close the gateway connection cleanly.
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, async () => {
    console.log(`${sig} received, shutting down`);
    await client.destroy();
    process.exit(0);
  });
}

client.login(config.token);
