const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        type: 'OAuth2',
        user: process.env.emailer_user,
        clientId: process.env.emailer_clientId,
        clientSecret: process.env.emailer_clientSecret,
        refreshToken: process.env.emailer_refreshToken,
    }
});

let createEmailMessge = (to, subject, html) => {
    return {
        from: process.env.emailer_user,
        to: to,
        subject: subject,
        html: html
    };
};

const sendMail = async (message) => {
    return new Promise((resolve, reject) => {
        transporter.sendMail(message, (err) => {
            if (err) {
                console.log("Errore SendMail: ", err);
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
};

exports.createEmailMessage = (to, subject, html) => createEmailMessge(to, subject, html);
exports.sendMail = (message) => sendMail(message);