import { nanoid } from "nanoid";

type PasswordEncTypes = {
  content: string;
  password: string;
};

type EncryptedPayload = {
  salt: string;
  iv: string;
  cipher: string;
  urlSalt?: string;
};
type DecrytTypes = {
  encryptedData: EncryptedPayload;
  password: string;
};

export class PasswordBased {
  private readonly ITERATIONS = 100_000;
  private readonly KEY_LENGTH = 256;
  private readonly SALT_LENGTH = 16;
  private readonly IV_LENGTH = 12;

  constructor() {
    if (!crypto?.subtle) {
      throw new Error("WebCrypto not supported");
    }
    console.log("Welcome to Password based encryption");
  }

  public passwordEnc = async ({
    content,
    password,
  }: PasswordEncTypes): Promise<EncryptedPayload> => {
    const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));

    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

    const key = await this.getKey(password, salt);
    const contentBytes = this.stringToBytes(content);

    const cipherBytes = new Uint8Array(
      await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, contentBytes),
    );

    return {
      salt: this.bytesToBase64(salt),
      iv: this.bytesToBase64(iv),
      cipher: this.bytesToBase64(cipherBytes),
      urlSalt: this.bytesToBase64Url(salt),
    };
  };
  public passwordDec = async ({ encryptedData, password }: DecrytTypes) => {
    try {
      const salt = this.base64ToBytes(encryptedData.salt);
      const key = await this.getKey(password, salt);
      const iv = this.base64ToBytes(encryptedData.iv);
      const cipher = this.base64ToBytes(encryptedData.cipher);
      const contentBytes = new Uint8Array(
        await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher),
      );
      return this.bytesToString(contentBytes);
    } catch (err) {
      throw err;
    }
  };

  private base64ToBytes = (base64: string) => {
    console.log(typeof base64);
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  };
  private getKey = async (
    password: string,
    salt: Uint8Array<ArrayBuffer>,
  ): Promise<CryptoKey> => {
    const passwordBytes = this.stringToBytes(password);

    const baseKey = await crypto.subtle.importKey(
      "raw",
      passwordBytes,
      "PBKDF2",
      false,
      ["deriveKey"],
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: this.ITERATIONS,
        hash: "SHA-256",
      },
      baseKey,
      { name: "AES-GCM", length: this.KEY_LENGTH },
      false,
      ["encrypt", "decrypt"],
    );
  };

  private stringToBytes = (str: string) => new TextEncoder().encode(str);
  public bytesToString = (bytes: Uint8Array<ArrayBuffer>) => {
    console.log(typeof bytes);
    return new TextDecoder().decode(bytes);
  };

  private bytesToBase64 = (bytes: Uint8Array): string =>
    btoa(String.fromCharCode(...bytes));

  private bytesToBase64Url = (bytes: Uint8Array): string =>
    btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
}

const PassSec = new PasswordBased();

export const BrowserBasedPasswordEncryption = async (
  content: string,
  password: string,
) => {
  try {
    const encData = await PassSec.passwordEnc({ content, password });
    console.log(encData);
    const id = nanoid(8);
    const GENERATE_URL = `${id}/${encData.urlSalt}`;
    return {
      lookupLink: id,
      GENERATE_URL,
      encrypted: encData.cipher,
      iv: encData.iv,
      salt: encData.salt,
    };
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export const BrowserBasedPasswordDecryption = async (
  encryptedData: EncryptedPayload,
  password: string,
): Promise<string> => {
  return PassSec.passwordDec({ encryptedData, password });
};

// Testing
// const encrypted = await BrowserBasedPasswordEncryption(
//   "Secret message",
//   "myPassword123",
// );
// const decrypted = await BrowserBasedPasswordDecryption(
//   { salt: encrypted.salt, iv: encrypted.iv, cipher: encrypted.encrypted },
//   "myPassword123",
// );

// console.log(JSON.stringify(decrypted));
