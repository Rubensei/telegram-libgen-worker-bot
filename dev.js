const dotenv = require('dotenv');
const wrangler = require('wrangler');
const {tunnel} = require('cloudflared');
const {Telegraf} = require("telegraf");

const PORT = 8080;

dotenv.config({path: './.dev.vars'});

(async () => {
    const {url} = tunnel({'--url': `localhost:${PORT}`})
    await wrangler.unstable_dev('./dist/worker.js', {
        config: './wrangler.toml',
        port: PORT,
        logLevel: "info",
        vars: process.env,
        inspect: true,
    });
    const bot = new Telegraf(process.env.BOT_TOKEN);
    await bot.telegram.setWebhook(await url);
    await bot.telegram.getWebhookInfo().then(console.log);
})();