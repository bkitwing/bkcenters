import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

interface EmailRequestBody {
  name: string;
  email: string;
  phone?: string;
  message: string;
  contactType: 'Feedback' | 'Query' | 'LearnMeditation';
  centerEmail: string;
  centerName: string;
  userAgent: string;
  pageUrl: string;
}

export async function POST(request: Request) {
  try {
    const body: EmailRequestBody = await request.json();
    
    // Basic validation
    if (!body.name || !body.email || !body.message || !body.centerEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Extract email info
    const { name, email, phone, message, contactType, centerEmail, centerName, userAgent, pageUrl } = body;
    
    // Get credentials from environment variables
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    
    // Check if email credentials are configured
    if (!gmailUser || !gmailAppPassword) {
      console.error('Gmail credentials are not configured');
      return NextResponse.json(
        { error: 'Email service is not properly configured. Please contact the administrator.' }, 
        { status: 500 }
      );
    }
    
    // Create transporter using app password
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword
      }
    });
    
    // Format the email
    const emailSubject = `[${contactType}] ${name} - ${centerName}`;
    
    // Include system information in message
    const emailHtml = `
      <h2>${contactType} from ${name}</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
      <h3>Message:</h3>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr>
      <h4>System Information:</h4>
      <p><strong>Page URL:</strong> ${pageUrl}</p>
      <p><strong>User Agent:</strong> ${userAgent}</p>
      <p><em>This email was sent from Brahma Kumaris website contact form.</em></p>
    `;
    
    // Send email
    await transporter.sendMail({
      from: `"Brahma Kumaris Contact Form" <${gmailUser}>`,
      to: centerEmail,
      cc: 'contact@brahmakumaris.com',
      replyTo: email,
      subject: emailSubject,
      html: emailHtml,
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email. Please try again later.' }, 
      { status: 500 }
    );
  }
} 