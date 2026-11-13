const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const config = require('../config');
const { isStaff } = require('../lib/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Post an announcement (staff only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((o) => o.setName('title').setDescription('Headline').setRequired(true).setMaxLength(256))
    .addStringOption((o) => o.setName('message').setDescription('Body text (use \\n for new lines)').setRequired(true).setMaxLength(4000))
    .addBooleanOption((o) => o.setName('ping').setDescription('Ping @everyone?')),
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: 'Only staff can post announcements.', flags: MessageFlags.Ephemeral });
    }
    const channel = config.announceChannelId && await interaction.client.channels.fetch(config.announceChannelId).catch(() => null);
    if (!channel?.isTextBased()) {
      return interaction.reply({ content: 'ANNOUNCE_CHANNEL_ID isn’t set or is invalid.', flags: MessageFlags.Ephemeral });
    }
    const ping = interaction.options.getBoolean('ping') ?? false;
    const embed = new EmbedBuilder()
      .setColor(config.colors.orange)
      .setTitle(interaction.options.getString('title', true))
      .setDescription(interaction.options.getString('message', true).replaceAll('\\n', '\n'))
      .setFooter({ text: `Nevada State Roleplay · ${interaction.user.username}` })
      .setTimestamp();
    await channel.send({
      content: ping ? '@everyone' : undefined,
      embeds: [embed],
      allowedMentions: { parse: ping ? ['everyone'] : [] },
    });
    await interaction.reply({ content: `Posted in <#${channel.id}>.`, flags: MessageFlags.Ephemeral });
  },
};
