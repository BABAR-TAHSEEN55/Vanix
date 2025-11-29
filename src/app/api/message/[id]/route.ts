import { MessagesTable } from "@/db/schema";
import { db } from "@/index";
import { Decryption } from "@/lib/encryption";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;
  const row = await db
    .select()
    .from(MessagesTable)
    .where(eq(MessagesTable.link, id));
  const Message = row[0].message;
  if (!Message) {
    return NextResponse.json({ error: "Error not found" }, { status: 404 });
  }
  try {
    const DecryptedMessage = Decryption(Message);
    return NextResponse.json({ decryptedMessage: DecryptedMessage });
  } catch (error) {
    console.log("API /api/message/[id] error", error);
    return NextResponse.json(
      { error: "Error during decryption" },
      { status: 404 },
    );
  }
};

//Todo:
// to read: diff cryptographic methods
// Password based
// Delete when a certain condition is met
// QR based
