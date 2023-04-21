import {Book} from "./libgen";
import {Markup} from "telegraf";

const PAGE_SIZE: number = 5;

type BookIdPayload = {
    type: "b",
    i: string,
    page: number,
    off: number,
    col: string,
};
type PagePayload = {
    type: "p",
    page: number,
    off: number,
    col: string,
};
type MirrorPayload = {
    type: "m",
    mirror: string,
}
type CallbackPayload = BookIdPayload | PagePayload | MirrorPayload;

function buildBookListMessageAndKeyboard(books: Book[], column: string, query: string, page: number, offset: number, moreBooks: boolean): [string, any[]] {
    let message = "Books:\n";
    let buttons = [];
    if (page > 1 || (page == 1 && offset > 1)) {
        let newOffset;
        let newPage;
        if (offset == 1) {
            newOffset = PAGE_SIZE;
            newPage = page - 1;
        } else {
            newOffset = offset - 1;
            newPage = page;
        }
        let pagePayload: PagePayload = {
            page: newPage,
            off: newOffset,
            col: column,
            type: "p",
        };
        buttons.push(Markup.button.callback("⬅️", JSON.stringify(pagePayload)))
    }
    for (const [i, book] of books.entries()) {
        const edition = book.edition ? ` (${book.edition} .ed)` : '';
        message += line(" ", `${i + 1}`, `<b>${book.title}${edition}</b>`);
        message += line(" ", '👤', book.author);
        if(book.language) {
            message += line(" ", '🌐', book.language);
        }
        message += line(" ", 'Year:', book.year, ', Type:', book.extension);
        let bookPayload: BookIdPayload = {
            i: book.id,
            page: page,
            off: offset,
            col: column,
            type: "b"
        };
        buttons.push(Markup.button.callback((i + 1).toString(), JSON.stringify(bookPayload)));
    }

    message += `\nPage ${offset + (page - 1) * 5} - Searching for: <i>${query}</i>`;

    if (moreBooks) {
        let newOffset;
        let newPage;
        if (offset == PAGE_SIZE) {
            newOffset = 1;
            newPage = page + 1;
        } else {
            newOffset = offset + 1;
            newPage = page;
        }
        let pagePayload: PagePayload = {
            page: newPage,
            off: newOffset,
            col: column,
            type: "p",
        };
        buttons.push(Markup.button.callback("➡️", JSON.stringify(pagePayload)))
    }
    return [message, buttons];
}

function prettyPrintBook(book: Book): string {
    let message = line(" ",`<b>${book.title}</b>`, book.edition ? `<i>${book.edition} .ed</i>` : '');
    message += line(" - ", book.author, book.year, book.publisher);
    message += line(" ", book.language, ...(book.pages ? ['-', book.pages, 'pages'] : []));
    return message;
}

function line(separator: string, ...items: string[]): string {
    return items.filter((item) => item !== undefined && item.length > 0).join(separator) + '\n';
}

export {
    CallbackPayload, BookIdPayload, PagePayload, MirrorPayload,
    buildBookListMessageAndKeyboard,
    prettyPrintBook,
    PAGE_SIZE,
}