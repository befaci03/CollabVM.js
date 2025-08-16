export async function wait(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms));
}
export function generateRandomString(length: number = 12, chars: string = 'azertyuiopqsdfghjklmwxcvbnAZERTYUIOPQSDFGHJKLMWXCVBN0123456789-_.') {
    if (typeof chars !== "string") throw new TypeError("chars must be a string");
    let output = "";
    for (let i = 0; i < length; i++) {
        output += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return output;
}
