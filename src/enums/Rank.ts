export enum Rank {
    Unregistered = 0,
    Registered = 1,
    Moderator = 3,
    Administrator = 2
}
export enum LoginRankRes {
    Admin = 1,
    Mod = 3
}

// not an enum but i mean ¯\_(ツ)_/¯
export function RankIDToText(id: Rank): string {
    let out: string;
    // this is bullshit but works
    out = id === Rank.Administrator ? "Administrator" : id === Rank.Moderator ? "Moderator" : id === Rank.Registered ? "Registered" : "Unregistered";
    return out;
}
