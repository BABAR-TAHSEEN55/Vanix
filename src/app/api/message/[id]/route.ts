import { MessagesTable } from "@/db/schema";
import { db } from "@/index";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;
  const now = new Date();

  const row = await db
    .select()
    .from(MessagesTable)
    .where(eq(MessagesTable.link, id));

  if (row.length === 0) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const messageRecord = row[0];
  const encryptedMessage = messageRecord.message; // This is encrypted data

  // Check expiration
  if (messageRecord.expiresAt && messageRecord.expiresAt <= now) {
    console.log(`Message ${id} expired, deleting...`);
    await deleteMessage(id);
    return NextResponse.json({ error: "Message has expired" }, { status: 404 });
  }

  // Check view limit BEFORE incrementing
  const currentViews = messageRecord.currentViews || 0;
  const maxViews = messageRecord.maxViews;

  if (maxViews !== -1 && currentViews >= maxViews!) {
    console.log(`Message ${id} hit view limit, already deleted`);
    await deleteMessage(id);
    return NextResponse.json(
      { error: "Message has exceeded view limit" },
      { status: 404 },
    );
  }

  // Increment view count
  const newViewCount = currentViews + 1;
  await db
    .update(MessagesTable)
    .set({ currentViews: newViewCount })
    .where(eq(MessagesTable.link, id));

  // Check if this was the last allowed view
  const isLastView = maxViews !== -1 && newViewCount >= maxViews!;

  // Delete after last view (burn after reading)
  if (isLastView) {
    console.log(
      `Message ${id} reached view limit, deleting after this view...`,
    );
    await deleteMessage(id);
  }

  return NextResponse.json({
    encrypted: encryptedMessage,
    iv: messageRecord.iv,

    isLastView,
    message: "Message retrieved successfully",
  });
};

const deleteMessage = async (link: string) => {
  try {
    await db.delete(MessagesTable).where(eq(MessagesTable.link, link));
    console.log("Deleting successfully");
  } catch (err) {
    console.log(`Error while deleting ${err}`);
  }
};

//Todo:
// to read: diff cryptographic methods
// Password based
// Delete when a certain condition is met
