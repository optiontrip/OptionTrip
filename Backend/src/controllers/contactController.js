import nodemailer from 'nodemailer';

const RECIPIENT = process.env.CONTACT_EMAIL || 'info@optiontrip.com';
const createTransporter = () => nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });

export const sendContactMessage = async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) return res.status(400).json({ success:false, message:'All fields are required.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success:false, message:'Invalid email address.' });
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return res.status(500).json({ success:false, message:'Email service not configured.' });
  try {
    const transporter=createTransporter();
    await transporter.sendMail({from:`"OptionTrip Contact" <${process.env.SMTP_USER}>`,to:RECIPIENT,replyTo:`"${name}" <${email}>`,subject:`[Contact] ${subject}`,text:`Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`});
    await transporter.sendMail({from:`"OptionTrip" <${process.env.SMTP_USER}>`,to:email,subject:`We received your OptionTrip message`,text:`Hi ${name},\n\nThank you for contacting OptionTrip. Your message was received by our contact system.\n\nSubject: ${subject}\n\nBest regards,\nThe OptionTrip Team`});
    return res.status(200).json({success:true,message:'Message sent successfully!'});
  } catch(error) { console.error('[Contact] Email send error:',error.message); return res.status(500).json({success:false,message:'Failed to send message. Please try again.'}); }
};
