import {PAGE_SIZE} from "./utils";

const DEFAULT_HOST = 'libgen.is';

interface Book {
    id: string;
    title: string;
    author: string;
    year: string;
    edition?: string;
    publisher?: string;
    pages?: string;
    language?: string;
    extension: string;
    md5: string;
    coverurl?: string;
    ipfs_cid?: string;
}

class Libgen {
    static async searchBooks(host: string, column: string, query: string, page: number = 1, offset: number = 1): Promise<[Book[], boolean]> {
        let searchUrl = new URL(`https://${host}/search.php`);
        let searchParams = searchUrl.searchParams;
        searchParams.append('column', column);
        searchParams.append('req', query);
        searchParams.append('page', page.toString());
        searchParams.append('res', '25');
        searchParams.append('view', 'simple');
        const [ids, moreBooks] = await fetch(searchUrl)
            .then(response => response.text())
            .then(text => {
                let ids = Array.from(text.matchAll(new RegExp("<td>(\\d+)<\\/td>", "g"))).map((id) => id[1]);
                let moreBooksInPage = (offset * PAGE_SIZE) < Math.floor(ids.length / PAGE_SIZE);
                let moreBooks = moreBooksInPage;
                if (!moreBooksInPage) {
                    moreBooks = text.match(new RegExp(`<a.+page=${page+1}.+\\/a>`)) != null;
                }
                return [ids.slice(PAGE_SIZE * (offset - 1), PAGE_SIZE * offset), moreBooks] as [string[], boolean];
            });
        if (ids.length == 0) {
            return [[], false];
        }
        return [await Libgen.getBooksDetails(host, ...ids), moreBooks];
    }

    static async getBooksDetails(host: string, ...ids: string[]): Promise<Book[]> {
        let detailUrl = new URL(`https://${host}/json.php`);
        let detailParams = detailUrl.searchParams;
        detailParams.append('ids', ids.join(","));
        detailParams.append('fields', '*');
        return await fetch(detailUrl).then((response) => response.json());
    }

    static async getBookDetails(host: string, id: string): Promise<Book> {
        return (await Libgen.getBooksDetails(host, id))[0];
    }

    static async getMirrors(): Promise<string[]> {
        return await fetch('https://library.lol')
            .then((response) => response.text())
            .then((response) => {
                return Array.from(response.matchAll(new RegExp('<a.+?href="([^"]+)".+?<\/a>', "g")))
                    .map((match) => match[1])
                    .map((url) => new URL(url).host);
            })
    }
}

export {
    Libgen,
    Book,
    DEFAULT_HOST
}