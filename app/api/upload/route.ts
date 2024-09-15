import { NextResponse } from "next/server";
import axios from "axios";
import Form from "form-data";
import JSZip from "jszip";

const OCR_API_URL =
  "http://www.ocrwebservice.com/restservices/processDocument?language=french&outputformat=xlsx";
const USERNAME = process.env.OCRWEBSERVICE_USERNAME;
const LICENSE_CODE = process.env.OCRWEBSERVICE_API_KEY;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
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

        zip.file(
          `${file.name.replace(/\.[^/.]+$/, "")}.xlsx`,
          outputFileBuffer,
          { binary: true },
        );
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    console.log("Zip file generated successfully.");

    return new Response(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="processed_files.zip"`,
      },
    });
  } catch (e) {
    const error = e as Error;
    console.error(`Error during processing: ${error.message}`);
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
