import { NextResponse } from "next/server";

import dotenv from "dotenv";
import { Decryption, Encryption } from "@/lib/encryption";
import { db } from "@/index";
import { MessagesTable } from "@/db/schema";

dotenv.config();

export const GET = () => {
  return NextResponse.json({ msg: "Done" });
};

export const POST = async (req: Request) => {
  const { input } = await req.json();
  // const enc = sec.encrypt(input);
  const { enc, GENERATE_URL } = Encryption(input);
  const dec = Decryption(enc!);

  //This adds it up
  try {
    await db.insert(MessagesTable).values({ message: enc, link: GENERATE_URL });
  } catch (err) {
    console.error("POST /api/message error:", err);
    return NextResponse.json(
      { error: "Internal Server error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ input, enc, GENERATE_URL });
};
