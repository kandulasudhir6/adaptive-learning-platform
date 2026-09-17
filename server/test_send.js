import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'kvsreddy124@gmail.com',
    pass: 'jfqi qriu rmhm ibfn'
  }
});

transporter.sendMail({
  from: 'kvsreddy124@gmail.com',
  to: 'kvsreddy124@gmail.com',
  subject: 'Test Email',
  text: 'Testing SMTP delivery'
}, (err, info) => {
  if (err) console.error(err);
  else console.log(info);
  process.exit(0);
});
