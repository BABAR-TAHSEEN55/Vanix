import { NextResponse } from "next/server";

import { db } from "@/index";
import { MessagesTable } from "@/db/schema";
import { PostBodyType } from "@/types/common";
import { getExpirationTime, getMaxViewsHelper } from "@/lib/Helper";

export const GET = () => {
  return NextResponse.json({ msg: "Done" });
};

export const POST = async (req: Request) => {
  try {
    const body = (await req.json()) as PostBodyType;

    const { settings, res } = body;
    console.log(settings);

    if (!res?.encrypted || !res.iv || !res.lookupLink) {
      return NextResponse.json(
        { error: "Missing required encryption data" },
        { status: 400 },
      );
    }

    // Use this
    // const encryptionType = settings.encryption;
    const maxViews = getMaxViewsHelper(settings.views);
    const expriration = getExpirationTime(settings.expiration);

    //This adds it up

    await db.insert(MessagesTable).values({
      message: res.encrypted,
      link: res.lookupLink,
      expiresAt: expriration,
      maxViews,
      iv: res.iv,
    });

    return NextResponse.json({
      success: true,
      link: res.lookupLink,
      fullUrl: res.GENERATE_URL,
    });
  } catch (err) {
    console.error("POST /api/message error:", err);
    return NextResponse.json(
      { error: "Internal Server error" },
      { status: 500 },
    );
  }
};
