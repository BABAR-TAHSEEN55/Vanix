import { nanoid } from "nanoid";

export default class NewSecurity {
  // constructor() {
  //   // console.log("Hurray I'm called");
  // }

  // Key to be present in the URL ( BASE64 -> Binary data representation )
  public generateKey = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  };

  public encryptInBrowser = async (message: string, keyString: string) => {
    try {
      const keyBase64 = keyString.replace(/-/g, "+").replace(/_/g, "/");
      const padding = "=".repeat((4 - (keyBase64.length % 4)) % 4);
      const keyBytes = Uint8Array.from(atob(keyBase64 + padding), (c) =>
        c.charCodeAt(0),
      );
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "AES-GCM" },
        false,
        ["encrypt"],
      );
      const encoder = new TextEncoder();
      const data = encoder.encode(message);

      const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        cryptoKey,
        data,
      );
      return {
        encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
        iv: btoa(String.fromCharCode(...iv)),
      };
    } catch (err) {
      console.error("Encryption failed:", err);
      throw new Error("Failed to encrypt message");
    }
  };

  public decryptInBrowser = async (
    encryptedData: string,
    iv: string,
    keyString: string,
  ): Promise<string> => {
    try {
      const keyBase64 = keyString.replace(/-/g, "+").replace(/_/g, "/");

      const padding = "=".repeat((4 - (keyBase64.length % 4)) % 4);
      const keyBytes = Uint8Array.from(atob(keyBase64 + padding), (c) =>
        c.charCodeAt(0),
      );

      const encryptedBytes = Uint8Array.from(atob(encryptedData), (c) =>
        c.charCodeAt(0),
      );
      const ivBytes = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));

      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "AES-GCM" },
        false,
        ["decrypt"],
      );

      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: ivBytes },
        cryptoKey,
        encryptedBytes,
      );

      const decoder = new TextDecoder();
      // console.log("I AM DEC", decoder.decode(decrypted));
      return decoder.decode(decrypted);
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Failed to decrypt - invalid key or corrupted data");
    }
  };
}

// Testing Function
// const { encryptInBrowser, decryptInBrowser, generateKey } = new NewSecurity();

// const Test = async () => {
//   const testMessage = "Hello, this is a secret message!";
//   const key = generateKey();
//   console.log(key);

//   console.log("Original:", testMessage);

//   const encrypted = await encryptInBrowser(testMessage, key);

//   console.log("Encrypted:", encrypted.encrypted);
//   const decrypted = await decryptInBrowser(
//     encrypted.encrypted,
//     encrypted.iv,
//     key,
//   );
//   console.log("Decrypted:", decrypted);
// };

// Test();

const sec = new NewSecurity();

export const NewEncryption = async (input: string) => {
  try {
    const key = sec.generateKey();
    const encData = sec.encryptInBrowser(input, key);

    const id = nanoid(8);
    const GENERATE_URL = `${id}#${key}`;
    return {
      lookupLink: id,
      GENERATE_URL,
      encrypted: (await encData).encrypted,
      iv: (await encData).iv,
    };
  } catch {
    throw new Error("Erro while ENC ");
  }
};

export const NewDecryption = (
  encryptedData: string,
  iv: string,
  key: string,
) => {
  const dec = sec.decryptInBrowser(encryptedData, iv, key);
  return dec;
};
