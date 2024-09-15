import { NextResponse } from "next/server";
import { google } from "googleapis";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI,
);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code") as string;

    const { tokens } = await oauth2Client.getToken(code);
    console.log(tokens);
    return NextResponse.redirect("/");
  } catch (e) {
    const error = e as Error;
    console.error(`Error during processing: ${error.message}`);
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
