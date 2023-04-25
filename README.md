# Telegram libgen bot
Telegram bot to search in libgenesis

## Setup
The bot requires the following wrangler secrets:
 * **BOT_TOKEN**: Telegram bot token
 * **OWNER_ID**: (Optional) Enables the restricted `/mirror` command, allowing only the telegram user identified with `OWNER_ID` to use it

### Local development
For local development you can set wrangler secrets in `.dev.vars`
```
BOT_TOKEN=...
OWNER_ID=...
```

To run locally use `npm run dev`. This will use `cloudflared` to create a tunnel and set the webhook to that url.

**This will overwrite the previous webhook. Usage of a different bot & token is recommended for development**

## Features

You can send any text to start a general search, otr you can use the specific search commands:

| Command            | Action                                            |
|--------------------|---------------------------------------------------|
| `/title <title>`   | Search by title                                   |
| `/author <author>` | Search by author                                  |
| `/isbn <isbn>`     | Search by isb                                     |
| `/mirror`          | Display current mirror list and allow changing it |

**The mirror command is only enabled if `BOT_OWNER` environment variable is set**
