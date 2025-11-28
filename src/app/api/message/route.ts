import { NextResponse } from "next/server";

import dotenv from "dotenv";
import { Decryption, Encryption } from "@/lib/encryption";

dotenv.config();

export const GET = () => {
  return NextResponse.json({ msg: "Done" });
};

export const POST = async (req: Request) => {
  const { input } = await req.json();
  // const enc = sec.encrypt(input);
  const enc = Encryption(input);
  const dec = Decryption(enc!);

  console.log(enc);
  console.log(dec);

  return NextResponse.json({ input, enc, dec });
};
