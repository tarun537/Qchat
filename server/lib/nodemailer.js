import nodemailer from "nodemailer";

export const getTransporter = () => {
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;

    if (!user || !pass) {
        return null;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
            user,
            pass,
        },
    });
};

export const sendResetOtpEmail = async (toEmail, otp) => {
    const transporter = getTransporter();
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;

    if (!transporter) {
        console.log(`\n======================================================`);
        console.log(`[PASSWORD RESET OTP] For ${toEmail}: ${otp}`);
        console.log(`(Configure SMTP_USER & SMTP_PASS in server/.env to send real emails)`);
        console.log(`======================================================\n`);
        return { delivered: false, simulated: true };
    }

    const mailOptions = {
        from: `"QuickChat Support" <${user}>`,
        to: toEmail,
        subject: "Your QuickChat Password Reset OTP",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 25px; border-radius: 10px; border: 1px solid #e0e0e0; background-color: #ffffff;">
                <h2 style="color: #6366f1; text-align: center; margin-bottom: 20px;">QuickChat Password Reset</h2>
                <p style="font-size: 15px; color: #333333;">Hello,</p>
                <p style="font-size: 15px; color: #555555;">You requested to reset your password for your QuickChat account. Use the OTP code below to set a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4f46e5; background-color: #f3f4f6; padding: 12px 24px; border-radius: 8px; border: 1px dashed #6366f1;">
                        ${otp}
                    </span>
                </div>
                <p style="font-size: 13px; color: #777777;">This code is valid for <strong>15 minutes</strong>. If you did not request this password reset, you can safely ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eeeeee; margin: 25px 0;" />
                <p style="font-size: 12px; color: #999999; text-align: center;">QuickChat Inc. &bull; Secure Messaging</p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
    return { delivered: true, simulated: false };
};

