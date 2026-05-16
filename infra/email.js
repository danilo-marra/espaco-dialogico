const nodemailer = require("nodemailer");
const { ServiceError } = require("./errors.js");

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

let transporter;
try {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    auth: {
      user: process.env.EMAIL_SMTP_USER,
      pass: process.env.EMAIL_SMTP_PASSWORD,
    },
    secure,
  });
} catch (error) {
  throw new Error(`Failed to initialize email transporter: ${error.message}`);
}

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

async function send(mailOptions) {
  validateMailOptions(mailOptions);
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ServiceError({
      message: "Não foi possível enviar o email",
      action: "Verifique se o serviço de email está disponível",
      cause: error,
      context: mailOptions,
    });
  }
}

module.exports = {
  send,
};
