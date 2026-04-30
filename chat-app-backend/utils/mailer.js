import SibApiV3Sdk from "sib-api-v3-sdk";

const client = SibApiV3Sdk.ApiClient.instance;

client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

export const sendOtp = async (email, otp) => {
  try {
    const response = await emailApi.sendTransacEmail({
      sender: {
        email: process.env.SENDER_EMAIL, // 🔥 don’t hardcode
        name: "Mu Social"
      },
      to: [{ email }],
      subject: "Your OTP Code",
      htmlContent: `
        <h2>Email Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This code is valid for 10 minutes.</p>
      `
    });

    console.log("OTP email sent ✅", response.messageId);
  } catch (err) {
    console.error("Email send failed ❌", err.response?.body || err.message);
    throw new Error("Failed to send OTP");
  }
};