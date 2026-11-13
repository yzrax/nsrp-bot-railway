const { SlashCommandBuilder } = require('discord.js');
const { getStatus, statusEmbed } = require('../lib/fivem');

module.exports = {
  data: new SlashCommandBuilder().setName('status').setDescription('Show the NSRP FiveM server status'),
  async execute(interaction) {
    await interaction.deferReply();
    await interaction.editReply({ embeds: [statusEmbed(await getStatus())] });
  },
};
