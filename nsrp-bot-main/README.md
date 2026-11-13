# NSRP Bot

Discord bot for **Nevada State Roleplay**. Node.js + discord.js v14, built to run on Railway.

## Features

| Command | Who | What it does |
|---|---|---|
| `/apply type:Whitelist\|NDLE` | Everyone | Opens a form. Submissions go to the review channel with **Approve** / **Deny** buttons. Approving gives the role; denying asks staff for an optional reason. The applicant gets a DM either way. |
| `/status` | Everyone | FiveM server status: online/offline, players, connect code. |
| `/announce` | Staff | Posts an orange embed to the announcements channel, optionally pinging `@everyone`. |
| `/ping` | Everyone | Health check. |

Also, if `STATUS_CHANNEL_ID` is set, the bot keeps one status message in that channel updated every 60 seconds.

Application questions live in `src/lib/applications.js` (`TYPES`). Edit them there. Discord allows at most 5 questions per form, with labels up to 45 characters. To add a department (e.g. Fire/EMS), add another entry to `TYPES` and a matching `roles` entry in `src/config.js`.

## 1. Create the Discord application

1. In the [Developer Portal](https://discord.com/developers/applications), go to **Teams** and create a team with your co-owner. Then create the application **under that team**, so you both own it.
2. **Bot** tab: reset and copy the token. No privileged intents are needed.
3. **OAuth2 → URL Generator**: scopes `bot` + `applications.commands`. Permissions: *Send Messages*, *Embed Links*, *Read Message History*, *Manage Roles*. Open the URL to invite the bot.
4. In Server Settings → Roles, drag the bot's role **above** the Whitelisted and NDLE roles, or it can't assign them.
5. Turn on Developer Mode (User Settings → Advanced). Then right-click to copy the server, channel and role IDs for the variables below.

## 2. Deploy on Railway

1. Push this folder to a new GitHub repo, e.g. `nsrp-bot`.
2. Railway → **New Project → Deploy from GitHub repo**. Use a separate project from the Nixon site.
3. **Variables** tab: add everything from `.env.example`. `DISCORD_TOKEN` and `DISCORD_GUILD_ID` are required; the rest switch features on.
4. Don't generate a domain. The bot only makes outgoing connections.

`railway.json` already sets the start command and **restart policy: Always**. Slash commands register themselves each time the bot starts.

## Run locally

```bash
cp .env.example .env   # fill in values
npm install
npm run dev
```

Don't run it locally and on Railway with the same token at the same time, or both will answer every command.

## Notes

- **FiveM status** reads the server's public `/dynamic.json` and `/players.json` on its HTTP port (default 30120). Until `FIVEM_ENDPOINT` is set, it shows "in development".
- **Cost:** an idle bot uses roughly $1–2 a month of Railway usage, which the Hobby plan's $5 credit covers.
- **If commands fail with Cloudflare "Error 1015"**, Railway's shared outbound IP has been rate-limited by Discord. Don't spam restarts. Try switching the service's region, or move the bot to a VPS with its own IP.
