import { v4 as uuidv4 } from "uuid";

export const generateUUID = (prefix?: string) => {
    return prefix? `${prefix}_${uuidv4()}` : uuidv4();
}