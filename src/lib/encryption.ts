import * as crypto from "crypto";
import { nanoid } from "nanoid";
import dotenv from "dotenv";
dotenv.config();

function splitEncryptedText(encryptedText: string) {
  return {
    ivString: encryptedText.slice(0, 32),
    encryptedDataString: encryptedText.slice(32),
  };
}

export default class Security {
  constructor() {
    if (!process.env.CRYPTO_KEY) {
      throw new Error("CRYPTO_KEY environemnt is not set");
    }
  }
  encoding: BufferEncoding = "hex";

  key = Buffer.from(process.env.CRYPTO_KEY!, "base64");

  encrypt(plaintext: string) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv("aes-256-cbc", this.key, iv);

      const encrypted = Buffer.concat([
        cipher.update(plaintext, "utf-8"),
        cipher.final(),
      ]);

      return iv.toString(this.encoding) + encrypted.toString(this.encoding);
    } catch (e) {
      console.error("Encryption error:", e);
    }
  }

  decrypt(cipherText: string) {
    try {
      const { ivString, encryptedDataString } = splitEncryptedText(cipherText);

      const iv = Buffer.from(ivString, this.encoding);
      const encryptedText = Buffer.from(encryptedDataString, this.encoding);

      const decipher = crypto.createDecipheriv("aes-256-cbc", this.key, iv);

      const decrypted = Buffer.concat([
        decipher.update(encryptedText),
        decipher.final(),
      ]);

      return decrypted.toString("utf-8");
    } catch (e) {
      console.error("Decryption error:", e);
    }
  }
}
const sec = new Security();

export const Encryption = (input: string) => {
  const enc = sec.encrypt(input);
  if (!enc) {
    throw new Error("Enc is empty.");
  }
  const id = nanoid(8);
  const GENERATE_URL = `${id}`;

  return { enc, GENERATE_URL };
};

export const Decryption = (enc: string) => {
  const dec = sec.decrypt(enc);
  return dec;
};

console.log(process.env.CRYPTO_KEY);
