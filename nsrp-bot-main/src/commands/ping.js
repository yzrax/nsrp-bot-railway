const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Check that the bot is responding'),
  async execute(interaction) {
    await interaction.reply({ content: `Pong! ${interaction.client.ws.ping} ms`, flags: MessageFlags.Ephemeral });
  },
};
