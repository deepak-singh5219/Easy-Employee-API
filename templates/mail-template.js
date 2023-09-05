const websiteName = process.env.WEBSITE_NAME || 'Book Keeping';

class MailTemplate{
    forgotPassword = (name,otp) =>
    {
        const subject = `Recover your ${websiteName} password`;
        const text = `Hey ${name}😎\nHow is your day? It will be fantastic I guess!😁\nDid you forgot your password! Don't worry we are here to help you.\nUse this OTP (One Time Password) to choose a new one. \n\n ${otp} \n\n If you didn't make this request, you can safely ignore this email :)`;
        return {subject,text};
    }

}

module.exports = new MailTemplate();