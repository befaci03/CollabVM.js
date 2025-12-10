import * as guac from "./utils/GuacUtil.js";
export const Guacamole = {
    encode: (...data: string[]) => { return guac.encode(...data) },
    decode: (data: string) => { return guac.decode(data) },
};
export {Client} from "./classes/Client.js";
