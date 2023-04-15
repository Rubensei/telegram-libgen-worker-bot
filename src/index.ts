import {Markup, Telegraf} from "telegraf";
import {Application, Middleware, Router} from '@cfworker/web';
import createTelegrafMiddleware from 'cfworker-middleware-telegraf';
import {callbackQuery, message} from "telegraf/filters";
import {Libgen, Book, HOST} from './libgen';
import {buildBookListMessageAndKeyboard, CallbackPayload, PagePayload, prettyPrintBook} from "./utils";

// @ts-ignore
const TOKEN: string = BOT_TOKEN;
let LIBGEN_HOST = HOST;
const ALLOWED_COMMANDS = ["/author", "/isbn", "/title"];

const bot = new Telegraf(TOKEN);

// TODO: Remove image preview and use textual message to have fully interactive mode
// Add result number using index offset and page

bot.on(message('text'), async (ctx) => {
    const query = ctx.message.text;
    let searchingMsg;

    try {
        const command = query.toLowerCase().split(" ")[0];
        if (command === "/start") {
            return await ctx.replyWithHTML("Bot usage:\n" +
                "Enter any text to start searching or use the commands:\n" +
                "<b>/author</b>: Search by author\n" +
                "<b>/title</b>: Search by title\n" +
                "<b>/isbn</b>: Search by isbn");
        }

        if (query.startsWith("/") && !ALLOWED_COMMANDS.includes(command)) {
            return await ctx.reply("Unknown command");
        }

        searchingMsg = ctx.replyWithHTML("Searching ...");
        const column = command.startsWith("/") ? command.substring(1) : 'def';
        const [books, moreBooks] = await Libgen.searchBooks(LIBGEN_HOST, column, query);
        const msg = await searchingMsg;
        if (books.length == 0) {
            return await ctx.telegram.editMessageText(msg.chat.id, msg.message_id, undefined, "Couldn't find any results");
        }

        let [message, buttons] = buildBookListMessageAndKeyboard(books, column, query, 1, 1, moreBooks);

        let keyboard = Markup.inlineKeyboard([buttons]);
        await ctx.telegram.editMessageText(msg.chat.id, msg.message_id, undefined, message, {
            reply_markup: keyboard.reply_markup,
            parse_mode: 'HTML',
        });
    } catch (e) {
        if (searchingMsg !== undefined) {
            const msg = await searchingMsg;
            await ctx.telegram.editMessageText(msg.chat.id, msg.message_id, undefined, "Something went wrong");
        }
        console.log(e);
        return false;
    }
})

bot.on(callbackQuery('data'), async (ctx) => {
    const chatId = ctx.callbackQuery.message.chat.id;
    const messageId = ctx.callbackQuery.message.message_id;
    const payload: CallbackPayload = JSON.parse(ctx.callbackQuery.data);
    let query = (ctx.callbackQuery.message as any).text?.split("Searching for: ")?.[1];
    switch (payload.type) {
        case "b":
            const bookId = payload.i;

            const book: Book = await Libgen.getBookDetails(LIBGEN_HOST, bookId);
            const URL = `https://library.lol/main/${book.md5}`;
            const downloadButton = Markup.button.url(`Download (${book.extension})`, URL);
            const backPayload: PagePayload = {
                ...payload,
                type: "p",
            };
            if (book.coverurl != null) {
                backPayload.cov = 1;
                await ctx.replyWithPhoto(`https://library.lol/covers/${book.coverurl}`, {
                    reply_markup: Markup.inlineKeyboard([Markup.button.callback(`⬅️`, JSON.stringify(backPayload)), downloadButton]).reply_markup,
                    caption: query
                });
            } else {
                await ctx.replyWithHTML(prettyPrintBook(book), {
                    reply_markup: Markup.inlineKeyboard([Markup.button.callback(`⬅️`, JSON.stringify(backPayload)), downloadButton]).reply_markup,
                });
            }
            break;
        case "p":
            if (query == null) {
                query = (ctx.callbackQuery.message as any).caption;
            }
            if(query != null) {
                const [newBooks, moreBooks] = await Libgen.searchBooks(LIBGEN_HOST, payload.col, query, payload.page, payload.off);
                let [message, buttons] = buildBookListMessageAndKeyboard(newBooks, payload.col, query, payload.page, payload.off, moreBooks);
                let keyboard = Markup.inlineKeyboard([buttons]);
                if(payload.cov != null) {
                    await ctx.replyWithHTML(message, {
                        reply_markup: keyboard.reply_markup
                    })
                } else {
                    await ctx.telegram.editMessageText(chatId, messageId, undefined, message, {
                        reply_markup: keyboard.reply_markup,
                        parse_mode: 'HTML',
                    });
                }
            } else {
                await ctx.replyWithHTML(`It's not possible to continue the interactive search.\nSearch again in a new message`);
            }
            break;
    }
})

const router = new Router();
const hostUpdateMiddleware: Middleware = async ({req}, next) => {
    if (req.params['host']) {
        LIBGEN_HOST = req.params['host'];
        console.log(`Using host: ${LIBGEN_HOST}`);
    }
    await next();
};
const botMiddleware = createTelegrafMiddleware(bot);
router.post(`/`, botMiddleware)
router.post(`/:host`, hostUpdateMiddleware, botMiddleware);
new Application().use(router.middleware).listen();