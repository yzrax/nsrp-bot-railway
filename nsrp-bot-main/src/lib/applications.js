const {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder,
  ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags,
} = require('discord.js');
const config = require('../config');
const { isStaff } = require('./permissions');

// Edit the questions here. Discord allows at most 5 per form, labels up to 45 characters.
const TYPES = {
  whitelist: {
    name: 'Whitelist',
    color: config.colors.orange,
    questions: [
      { id: 'character', label: 'Character name and short backstory', style: TextInputStyle.Paragraph, max: 1000 },
      { id: 'age', label: 'Your age (OOC)', style: TextInputStyle.Short, max: 3 },
      { id: 'experience', label: 'Previous roleplay experience', style: TextInputStyle.Paragraph, max: 1000 },
      { id: 'why', label: 'Why do you want to join NSRP?', style: TextInputStyle.Paragraph, max: 1000 },
    ],
  },
  ndle: {
    name: 'NDLE',
    color: config.colors.blue,
    questions: [
      { id: 'character', label: 'Character name', style: TextInputStyle.Short, max: 100 },
      { id: 'experience', label: 'Previous law enforcement RP experience', style: TextInputStyle.Paragraph, max: 1000 },
      { id: 'availability', label: 'Weekly availability (days / times + TZ)', style: TextInputStyle.Short, max: 200 },
      { id: 'why', label: 'Why do you want to join the NDLE?', style: TextInputStyle.Paragraph, max: 1000 },
      { id: 'scenario', label: 'Traffic stop turns hostile. What do you do?', style: TextInputStyle.Paragraph, max: 1000 },
    ],
  },
};

// Custom IDs: "app:<action>:<type>:<userId>"
const id = (...parts) => ['app', ...parts].join(':');

function buildForm(type) {
  const t = TYPES[type];
  const modal = new ModalBuilder().setCustomId(id('submit', type)).setTitle(`${t.name} Application`);
  modal.addComponents(t.questions.map((q) => new ActionRowBuilder().addComponents(
    new TextInputBuilder().setCustomId(q.id).setLabel(q.label).setStyle(q.style).setMaxLength(q.max).setRequired(true),
  )));
  return modal;
}

function reviewButtons(type, userId, disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(id('approve', type, userId)).setLabel('Approve').setStyle(ButtonStyle.Success).setDisabled(disabled),
    new ButtonBuilder().setCustomId(id('deny', type, userId)).setLabel('Deny').setStyle(ButtonStyle.Danger).setDisabled(disabled),
  );
}

async function onSubmit(interaction, type) {
  const t = TYPES[type];
  const channel = config.reviewChannelId && await interaction.client.channels.fetch(config.reviewChannelId).catch(() => null);
  if (!channel?.isTextBased()) {
    return interaction.reply({ content: 'Applications aren’t set up yet. Please tell a staff member.', flags: MessageFlags.Ephemeral });
  }
  const embed = new EmbedBuilder()
    .setColor(t.color)
    .setTitle(`${t.name} Application`)
    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
    .setDescription(`Applicant: <@${interaction.user.id}> (\`${interaction.user.id}\`)`)
    .addFields(t.questions.map((q) => ({ name: q.label, value: interaction.fields.getTextInputValue(q.id).slice(0, 1024) })))
    .setFooter({ text: 'Status: Pending' })
    .setTimestamp();
  await channel.send({ embeds: [embed], components: [reviewButtons(type, interaction.user.id)] });
  await interaction.reply({ content: `Your ${t.name} application was submitted. You’ll get a DM when it’s reviewed.`, flags: MessageFlags.Ephemeral });
}

async function finish(interaction, type, userId, approved, reason) {
  const t = TYPES[type];
  const embed = EmbedBuilder.from(interaction.message.embeds[0])
    .setColor(approved ? config.colors.green : config.colors.red)
    .setFooter({ text: `Status: ${approved ? 'Approved' : 'Denied'} by ${interaction.user.tag}` });
  if (reason) embed.addFields({ name: 'Denial reason', value: reason.slice(0, 1024) });

  let note = '';
  if (approved) {
    const roleId = config.roles[type];
    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    if (!member) note = '\n⚠️ Applicant is no longer in the server; no role given.';
    else if (!roleId) note = `\n⚠️ No role configured for ${t.name}; give it manually.`;
    else await member.roles.add(roleId, `${t.name} application approved by ${interaction.user.tag}`)
      .catch((err) => { note = `\n⚠️ Couldn’t add role: ${err.message}`; });
  }

  await interaction.update({ embeds: [embed], components: [reviewButtons(type, userId, true)] });
  if (note) await interaction.followUp({ content: note.trim(), flags: MessageFlags.Ephemeral });

  const user = await interaction.client.users.fetch(userId).catch(() => null);
  const dm = approved
    ? `✅ Your **${t.name}** application for Nevada State Roleplay was approved!`
    : `❌ Your **${t.name}** application for Nevada State Roleplay was denied.${reason ? `\nReason: ${reason}` : ''}`;
  await user?.send(dm).catch(() => {}); // DMs may be closed
}

// Routes every interaction whose customId starts with "app:".
async function handle(interaction) {
  const [, action, type, userId] = interaction.customId.split(':');
  if (!TYPES[type]) return;

  if (action === 'submit') return onSubmit(interaction, type);

  if (!isStaff(interaction.member)) {
    return interaction.reply({ content: 'Only staff can review applications.', flags: MessageFlags.Ephemeral });
  }
  if (action === 'approve') return finish(interaction, type, userId, true);
  if (action === 'deny') {
    const modal = new ModalBuilder().setCustomId(id('denyreason', type, userId)).setTitle('Deny application');
    modal.addComponents(new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('reason').setLabel('Reason (sent to the applicant)')
        .setStyle(TextInputStyle.Paragraph).setMaxLength(500).setRequired(false),
    ));
    return interaction.showModal(modal);
  }
  if (action === 'denyreason') {
    return finish(interaction, type, userId, false, interaction.fields.getTextInputValue('reason') || null);
  }
}

module.exports = { TYPES, buildForm, handle };
