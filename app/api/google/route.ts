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
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline", // Important pour recevoir un refresh token
      scope: "https://www.googleapis.com/auth/drive.file", // Modifier selon les besoins
      prompt: "consent", // Force le consentement pour s'assurer de recevoir un refresh token
    });

    // Redirige l'utilisateur vers l'URL d'authentification
    return NextResponse.redirect(url);
  } catch (e) {
    const error = e as Error;
    console.error(`Error during processing: ${error.message}`);
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
