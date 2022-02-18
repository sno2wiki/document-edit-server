import { customAlphabet } from "nanoid";

const generator = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 12);
export const generateLineId = () => generator();
