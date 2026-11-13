const { PermissionFlagsBits } = require('discord.js');
const config = require('../config');

// Staff = has one of STAFF_ROLE_IDS, or Administrator as a fallback.
function isStaff(member) {
  if (!member) return false;
  if (member.permissions?.has(PermissionFlagsBits.Administrator)) return true;
  const roles = member.roles?.cache;
  return config.staffRoleIds.some((id) => roles?.has(id));
}

module.exports = { isStaff };
