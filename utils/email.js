const nodemailer = require("nodemailer");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.firstName;
    this.url = url;
    this.from = `fresam123ab@gmail.com`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      // Sendgrid
      // return nodemailer.createTransport({
      //   service: "SendGrid",
      //   auth: {
      //     user: process.env.SENDGRID_USERNAME,
      //     pass: process.env.SENDGRID_PASSWORD,
      //   },
      // });
      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "fresam123ab@gmail.com",
          pass: "frehiwot234SAM@",
        },
        port: 465,
        host: "smtp.gmail.com",
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Send the actual email
  async send(subject) {
    // // 1) Render HTML based on a ejs template
    // const html = ejs.renderFile(`${__dirname}/../views/${template}.ejs`, {
    //   firstName: this.firstName,
    //   url: this.url,
    //   subject,
    // });

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      // html,
      // html,
      text: this.url,
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to the Voting Platform!");
  }

  async sendPasswordReset() {
    await this.send(
      // "resetPassword",
      "Your password reset token (valid for only 10 minutes)"
    );
  }
};
