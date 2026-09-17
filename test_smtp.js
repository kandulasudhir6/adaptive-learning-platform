import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'kvsreddy124@gmail.com',
    pass: 'jfqi qriu rmhm ibfn'
  }
});

transporter.verify(function (error, success) {
  if (error) {
    console.log('ERROR:', error);
  } else {
    console.log('Server is ready to take our messages');
  }
});
