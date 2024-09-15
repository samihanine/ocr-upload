import { NextResponse } from "next/server";
import axios from "axios";
import Form from "form-data";
import JSZip from "jszip";
import { google } from "googleapis";
import { sendEmail } from "@/server/email";
import streamifier from "streamifier";

const OCR_API_URL =
  "http://www.ocrwebservice.com/restservices/processDocument?language=french&outputformat=xlsx";
const USERNAME = process.env.OCRWEBSERVICE_USERNAME;
const LICENSE_CODE = process.env.OCRWEBSERVICE_API_KEY;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const RECIPIENT_EMAIL =
  process.env.RECIPIENT_EMAIL || "sami.hanine22@gmail.com";

const googleAuth = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI,
);
googleAuth.setCredentials({ refresh_token: REFRESH_TOKEN });
const drive = google.drive({ version: "v3", auth: googleAuth });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    await processDocument(formData);

    return NextResponse.json({ success: true });
  } catch (e) {
    const error = e as Error;
    console.error(`Error during processing: ${error.message}`);
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}

async function processDocument(formData: FormData) {
  const formDataEntryValues = Array.from(formData.values());
  const zip = new JSZip();

  for (const formDataEntryValue of formDataEntryValues) {
    if (
      typeof formDataEntryValue === "object" &&
      "arrayBuffer" in formDataEntryValue
    ) {
      const file = formDataEntryValue as unknown as Blob;
      const buffer = await file.arrayBuffer();

      const formData = new Form();
      formData.append("file", Buffer.from(buffer), {
        filename: file.name,
        contentType: file.type,
      });

      const ocrResponse = await axios.post(OCR_API_URL, formData, {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Basic ${Buffer.from(
            `${USERNAME}:${LICENSE_CODE}`,
          ).toString("base64")}`,
        },
        responseType: "json",
      });

      if (ocrResponse.data.ErrorMessage) {
        console.error(`OCR Error: ${ocrResponse.data.ErrorMessage}`);
        continue;
      }

      const { data: outputFileBuffer } = await axios.get(
        ocrResponse.data.OutputFileUrl,
        {
          responseType: "arraybuffer",
        },
      );

      zip.file(`${file.name.replace(/\.[^/.]+$/, "")}.xlsx`, outputFileBuffer, {
        binary: true,
      });
    }
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  const fileMetadata = {
    name: "document.zip",
    mimeType: "application/zip",
  };

  const media = {
    mimeType: "application/zip",
    body: streamifier.createReadStream(zipBuffer),
  };

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: "id",
  });

  const permissions = {
    role: "reader",
    type: "anyone",
  };

  await drive.permissions.create({
    fileId: file.data.id as string,
    requestBody: permissions,
  });

  const fileLink = `https://drive.google.com/uc?id=${file.data.id}&export=download`;

  console.log(`Files processed and uploaded to Google Drive: ${fileLink}`);
  await sendEmail({
    to: RECIPIENT_EMAIL,
    subject: "Fichiers traités",
    text: `Veuillez trouver ici le lien pour télécharger les fichiers traités : ${fileLink}`,
  });
}
