const nodemailer = require("nodemailer");
const { Resend } = require("resend");
const { ServiceError } = require("./errors.js");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function extractAddress(field) {
  if (typeof field !== "string") return "";
  const match = field.match(/<([^>]+)>/);
  return match ? match[1] : field;
}

function validateMailOptions(mailOptions) {
  if (!mailOptions || typeof mailOptions !== "object") {
    throw new Error("mailOptions must be a non-null object");
  }

  const missing = [];
  for (const field of ["from", "to", "subject"]) {
    if (!mailOptions[field]) missing.push(field);
  }
  if (!mailOptions.text && !mailOptions.html) {
    missing.push("text or html");
  }
  if (missing.length > 0) {
    throw new Error(
      `mailOptions missing required fields: ${missing.join(", ")}`,
    );
  }

  const fromAddr = extractAddress(mailOptions.from);
  const toRaw = Array.isArray(mailOptions.to)
    ? mailOptions.to[0]
    : mailOptions.to;
  const toAddr = extractAddress(toRaw);

  if (!EMAIL_REGEX.test(fromAddr)) {
    throw new Error(`Invalid email address in 'from': ${fromAddr}`);
  }
  if (!EMAIL_REGEX.test(toAddr)) {
    throw new Error(`Invalid email address in 'to': ${toAddr}`);
  }
}

function getEmailProvider() {
  const configuredProvider = process.env.EMAIL_PROVIDER?.toLowerCase().trim();

  if (configuredProvider) {
    if (configuredProvider !== "smtp" && configuredProvider !== "resend") {
      throw new Error(
        `EMAIL_PROVIDER must be either "smtp" or "resend", got: ${process.env.EMAIL_PROVIDER}`,
      );
    }
    return configuredProvider;
  }

  if (process.env.RESEND_API_KEY) {
    return "resend";
  }

  return "smtp";
}

function getSmtpTransporter() {
  const smtpHost = process.env.EMAIL_SMTP_HOST;
  const smtpPort = parseInt(process.env.EMAIL_SMTP_PORT, 10);

  if (!smtpHost) {
    throw new Error("EMAIL_SMTP_HOST is required but not set");
  }

  if (!Number.isFinite(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
    throw new Error(
      `EMAIL_SMTP_PORT must be a valid port number (1-65535), got: ${process.env.EMAIL_SMTP_PORT}`,
    );
  }

  const emailSecureEnv = process.env.EMAIL_SECURE;
  const secure =
    emailSecureEnv !== undefined
      ? emailSecureEnv === "true" || emailSecureEnv === "1"
      : process.env.NODE_ENV === "production";

  try {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      auth: {
        user: process.env.EMAIL_SMTP_USER,
        pass: process.env.EMAIL_SMTP_PASSWORD,
      },
      secure,
    });
  } catch (error) {
    throw new Error(`Failed to initialize SMTP transporter: ${error.message}`);
  }
}

function getResendClient() {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is required when EMAIL_PROVIDER=resend");
  }

  return new Resend(resendApiKey);
}

function toAddressList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function sendWithSmtp(mailOptions) {
  const transporter = getSmtpTransporter();
  await transporter.sendMail(mailOptions);
}

async function sendWithResend(mailOptions) {
  const resend = getResendClient();
  const response = await resend.emails.send({
    from: mailOptions.from,
    to: toAddressList(mailOptions.to),
    cc: toAddressList(mailOptions.cc),
    bcc: toAddressList(mailOptions.bcc),
    replyTo: toAddressList(mailOptions.replyTo),
    subject: mailOptions.subject,
    html: mailOptions.html,
    text: mailOptions.text,
  });

  if (response?.error) {
    throw new Error(response.error.message || "Resend API returned an error");
  }
}

async function send(mailOptions) {
  validateMailOptions(mailOptions);

  const provider = getEmailProvider();

  try {
    if (provider === "resend") {
      await sendWithResend(mailOptions);
      return;
    }

    await sendWithSmtp(mailOptions);
  } catch (error) {
    throw new ServiceError({
      message: "Não foi possível enviar o email",
      action: "Verifique se o serviço de email está disponível",
      cause: error,
      context: {
        provider,
        mailOptions,
      },
    });
  }
}

module.exports = {
  send,
  getEmailProvider,
};
