require("dotenv").config();
const nodemailer =require("nodemailer");
const path =require ("path");
const ejs = require("ejs");


interface EmailOptions{

    email: string,
    subject: string,
    template: string,
    data:{[key:string]:any}

}

const sendMail = async (options: EmailOptions): Promise<void> => {
    
    const transporter = nodemailer.createTransport({
        host: process.env.SMPT_HOST,
        port: Number(process.env.SMPT_PORT),
        auth: {
            user: process.env.SMPT_MAIL,
            pass: process.env.SMPT_PASSWORD,
        },
    });


    // Absolute path of the template
    const templatePath = path.join(__dirname, "../mails", options.template);

    // Render HTML
    const html = await ejs.renderFile(templatePath, options.data);
    
    const mailOptions = {
        
        from: process.env.SMPT_MAIL,
        to: options.email,
        subject: options.subject,
        html,

    };

    await transporter.sendMail(mailOptions);

};

module.exports = sendMail;

