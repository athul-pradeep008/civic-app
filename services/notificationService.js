const nodemailer = require('nodemailer');
const config = require('../config/config');

// Create transporter
let transporter = null;

if (config.email.host && config.email.user && config.email.password) {
    transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: false,
        auth: {
            user: config.email.user,
            pass: config.email.password
        }
    });
}

/**
 * Send email notification
 */
exports.sendEmail = async (to, subject, html) => {
    if (!transporter) {
        console.log('Email not configured. Skipping notification.');
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: config.email.from,
            to,
            subject,
            html
        });

        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Email error:', error);
    }
};

/**
 * Notify user about issue status update
 */
exports.notifyIssueStatusUpdate = async (user, issue, newStatus) => {
    const subject = `Issue Status Updated: ${issue.title}`;
    const html = `
    <h2>Your Issue Status Has Been Updated</h2>
    <p>Hello ${user.username},</p>
    <p>Your reported issue has been updated:</p>
    <ul>
      <li><strong>Title:</strong> ${issue.title}</li>
      <li><strong>New Status:</strong> ${newStatus}</li>
      <li><strong>Location:</strong> ${issue.address}</li>
    </ul>
    <p>Thank you for helping improve our community!</p>
  `;

    await exports.sendEmail(user.email, subject, html);
};

/**
 * Notify admin about new issue
 */
exports.notifyAdminNewIssue = async (issue) => {
    const subject = `New Issue Reported: ${issue.title}`;
    const html = `
    <h2>New Issue Reported</h2>
    <ul>
      <li><strong>Title:</strong> ${issue.title}</li>
      <li><strong>Category:</strong> ${issue.category}</li>
      <li><strong>Location:</strong> ${issue.address}</li>
      <li><strong>Description:</strong> ${issue.description}</li>
    </ul>
    <p>Please review and take appropriate action.</p>
  `;

    await exports.sendEmail(config.admin.email, subject, html);
};
