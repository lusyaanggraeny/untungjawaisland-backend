import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
) => {
  try {

    const response = await resend.emails.send({
      from: "Booking <onboarding@resend.dev>",
      to: to,
      subject: subject,
      html: html,
    });

    console.log("Email sent:", response);

    return response;

  } catch (error) {

    console.error("Email sending failed:", error);
    throw error;

  }
};