import { decode } from "html-entities";

export default function htmlToPlainText(html: string, newline: boolean = true): string {
    if (!html) return "";

    let text = html.replace(/<script[\s\S]*?<\/script>/gi, "")
                   .replace(/<style[\s\S]*?<\/style>/gi, "");
    text = text.replace(/<br\s*\/?>/gi, newline ? "\n" : " ")
               .replace(/<\/(p|div|section|article|h[1-6]|li)>/gi, newline ? "\n" : " ");
    text = text.replace(/<[^>]+>/g, "");

    return decode(text);
}
