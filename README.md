# ɴᴇxᴜs ᴄʀᴀsʜᴇʀ

> Multi-User WhatsApp Bot • By PRINCE TECH

## ⚡ Features

### 🤖 AI Commands
- `.ask` / `.ai` / `.chat` / `.gpt` — Chat with Bug AI
- `.imagine` — AI image generation
- `.tts` / `.voice` — Text to speech
- `.roast` — AI roasts a user
- `.summarize` / `.tldr` — Summarize text

### 📥 Downloads
- `.tiktok` — TikTok no-watermark download
- `.song` / `.play` — YouTube MP3
- `.video` / `.ytmp4` — YouTube MP4
- `.ig` / `.insta` — Instagram reels/posts
- `.fb` — Facebook video
- `.pin` — Pinterest images

### 🔧 Tools & Fun
- `.ping`, `.weather`, `.translate`, `.define`, `.calc`, `.qr`
- `.sticker`, `.joke`, `.fact`, `.quote`, `.toss`, `.8ball`
- `.dice`, `.password`, `.aesthetic`, `.reverse`

### 👥 Group Management
- `.antilink`, `.antiword`, `.welcome`, `.kick`, `.mute`
- `.tagall`, `.promote`, `.demote`, `.warn`, `.rules`

### 👑 Owner Commands
- `.broadcast`, `.restart`, `.setprefix`, `.sysinfo`, `.clearcache`

### 🔍 Search
- `.wiki`, `.lyrics`, `.movie`, `.news`, `.gif`, `.ytsearch`, `.github`, `.npm`, `.crypto`, `.anime`, `.recipe`

### 📡 WhatsApp Channel
- Auto-follows the configured channel as soon as the bot connects
- Auto-reacts to every new post on that channel
- Configurable via `CHANNEL_INVITE`, `CHANNEL_AUTO_FOLLOW`, `CHANNEL_AUTO_REACT`, `CHANNEL_REACT_EMOJI`

---

## 🚀 Deployment

### Manual Deploy
```bash
npm install
cp .env.example .env
# Edit .env with your settings
node index.js
```

### Render
Use the included `render.yaml` as a blueprint, or create a new Web Service manually and set the environment variables listed below.

---

## ⚙️ Configuration

All settings can be configured via environment variables or by editing `config.js`.

| Variable | Default | Description |
|----------|---------|-------------|
| `OWNER_NUMBER` | `243860885022` | Your WhatsApp number |
| `OWNER_NAME` | `𝐏ʀɪɴᴄᴇ 𝐓ᴇᴄʜx` | Owner display name |
| `BOT_NAME` | `ɴᴇxᴜs ᴄʀᴀsʜᴇʀ` | Bot display name |
| `PREFIX` | `.` | Command prefix |
| `PORT` | `3000` | Web server port |
| `TZ` | `Africa/Harare` | Timezone |
| `MENU_IMAGE_URL` | catbox image | Image shown on `.menu` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_SECRET` | see `.env.example` | Web dashboard login |
| `CHANNEL_INVITE` | WhatsApp channel invite code | Channel to auto-follow |
| `CHANNEL_AUTO_FOLLOW` | `true` | Auto-follow the channel on connect |
| `CHANNEL_AUTO_REACT` | `true` | Auto-react to new channel posts |
| `CHANNEL_REACT_EMOJI` | `❤️` | Emoji used for auto-react |

---

## 📊 Architecture

```
nexus-crasher/
├── index.js           # Entry point
├── config.js          # Configuration
├── handler.js         # Message router
├── database.js        # JSON flat-file database
├── sessionManager.js  # Multi-user session manager
├── server.js          # Express web server + dashboard
├── commands/
│   ├── free/          # 🔧 General commands
│   ├── downloads/     # 📥 Media downloaders
│   ├── group/         # 👥 Group management
│   ├── owner/         # 👑 Owner-only commands
│   └── search/        # 🔍 Search commands
├── utils/
│   ├── antiban.js     # Human-like behaviour engine
│   ├── api.js         # API call helpers
│   ├── autoDownload.js
│   ├── autofeatures.js
│   ├── autoprotect.js
│   ├── channel.js     # WhatsApp channel auto-follow/auto-react
│   ├── session.js
│   └── waprotect.js
└── assets/            # Static assets
```

---

## 👑 Credits

**PRINCE TECH** — Creator & Developer

---

*ɴᴇxᴜs ᴄʀᴀsʜᴇʀ — Your Bot. Your Rules.*
