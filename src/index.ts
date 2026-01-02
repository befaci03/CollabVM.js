import * as guac from "./utils/GuacUtil.js";
export const Guacamole = {
    encode: (...data: string[]) => { return guac.encode(...data) },
    decode: (data: string) => { return guac.decode(data) },
}
export {Client} from "./classes/Client.js";

// export some other utilities stuff like enums
export {Rank, RankIDToText} from "./enums/Rank.js";
export {OPCodeClient, OPCodeServer} from "./enums/AdminOpcodes.js";
export {User} from "./interfaces/User.js";
