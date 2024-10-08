"use server";

import { resendApiKey, resendFromEmail } from "@/lib/constants";
import { Resend } from "resend";

const resend = new Resend(resendApiKey);

export const buildHtmlTemplate = (props: {
  title: string;
  content: string;
  actionUrl?: string;
  actionText?: string;
}): string => {
  return `<!DOCTYPE html>
  <html>
  <head>
      <title>${props.title}</title>
  </head>
  <body style="background-color: #fafafa; font-family: Arial, sans-serif; color: #333; margin: 0; padding: 40px;">
      <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
              <td align="center">
                  <table width="600px" cellspacing="0" cellpadding="20" style="background-color: #ffffff; border-radius: 20px">
                      <tr>
                          <td align="center" style="font-size: 24px; font-weight: bold; color: #33A852;">
                              ${props.title}
                          </td>
                      </tr>
                      <tr>
                          <td style="font-size: 16px; color: #404040;">
                              ${props.content}
                          </td>
                      </tr>
                      ${
                        props.actionUrl
                          ? `<tr>
                          <td align="center" style="padding-top: 20px;">
                              <a href="${
                                props.actionUrl
                              }" style="background-color: #f97415; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                ${props.actionText || "Cliquez ici"}
                              </a>
                          </td>
                      </tr>`
                          : ""
                      }
                  </table>
              </td>
          </tr>
      </table>
  </body>
  </html>`;
};

export const sendEmail = async (props: {
  to: string;
  subject: string;
  text: string;
}) => {
  console.log("ok");
  const html = await buildHtmlTemplate({
    title: props.subject,
    content: props.text,
  });

  const result = await resend.emails.send({
    from: `Otopio <${resendFromEmail}>`,
    to: props.to,
    subject: props.subject,
    html,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  console.log(result);
};
