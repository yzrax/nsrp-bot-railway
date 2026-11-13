const { SlashCommandBuilder } = require('discord.js');
const { TYPES, buildForm } = require('../lib/applications');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('apply')
    .setDescription('Apply for the whitelist or a department')
    .addStringOption((o) => o
      .setName('type')
      .setDescription('What are you applying for?')
      .setRequired(true)
      .addChoices(...Object.entries(TYPES).map(([value, t]) => ({ name: t.name, value })))),
  async execute(interaction) {
    await interaction.showModal(buildForm(interaction.options.getString('type', true)));
  },
};
