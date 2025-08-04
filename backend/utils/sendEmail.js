const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', // or use your SMTP provider
    auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS  // App password (not your normal password)
    }
});

const sendEmail = async (to, subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text
    };

    return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
