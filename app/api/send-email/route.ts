import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

// Add this export to tell Next.js that this route is dynamic and should be server-rendered
export const dynamic = 'force-dynamic';

interface EmailRequestBody {
  name: string;
  email: string;
  phone?: string;
  message: string;
  contactType: 'LearnMeditation' | 'Query' | 'AttendEvent' | 'Feedback' | 'Others';
  centerEmail: string;
  centerName: string;
  userAgent: string;
  pageUrl: string;
}

// Modern HTML template for center notification
const getCenterEmailTemplate = (data: EmailRequestBody) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.contactType} from ${data.name}</title>
  <style>
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .header {
      background: linear-gradient(135deg, #6b46c1 0%, #4299e1 100%);
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
    }
    .content {
      padding: 20px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0 0 8px 8px;
    }
    .info-block {
      margin: 15px 0;
      padding: 15px;
      background: #f7fafc;
      border-radius: 6px;
    }
    .message-block {
      margin: 20px 0;
      padding: 20px;
      background: #edf2f7;
      border-radius: 6px;
      border-left: 4px solid #4299e1;
    }
    .footer {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 0.875rem;
      color: #718096;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h2 style="margin:0">${data.contactType} from ${data.name}</h2>
    </div>
    <div class="content">
      <div class="info-block">
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> <a href="mailto:${data.email}" style="color: #4299e1;">${data.email}</a></p>
        ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
      </div>
      
      <div class="message-block">
        <h3 style="margin-top:0">Message:</h3>
        <p>${data.message.replace(/\n/g, '<br>')}</p>
      </div>
      
       <div class="info-block">
         <h4 style="margin-top:0">System Information:</h4>
         <p><strong>Page URL:</strong> ${data.pageUrl}</p>
         <p><strong>User Agent:</strong> ${data.userAgent}</p>
         ${data.centerEmail && data.centerEmail.includes('@') 
           ? `<p><strong>Center Email:</strong> <a href="mailto:${data.centerEmail}" style="color: #4299e1;">${data.centerEmail}</a></p>` 
           : ''}
       </div>
      
      <div class="footer">
        <p>This email was sent from Brahma Kumaris website contact form on behalf of ${data.name} (${data.email}).</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// Acknowledgment email template for the sender
const getAcknowledgmentTemplate = (name: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank you for contacting Brahma Kumaris</title>
  <style>
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .header {
      background: linear-gradient(135deg, #6b46c1 0%, #4299e1 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      padding: 30px 20px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0 0 8px 8px;
      text-align: center;
    }
    .message {
      margin: 20px 0;
      font-size: 1.1em;
      color: #2d3748;
    }
    .quote {
      margin: 30px 0;
      padding: 20px;
      background: #f7fafc;
      border-radius: 8px;
      font-style: italic;
      color: #4a5568;
    }
    .button-container {
      margin: 30px 0;
      display: block;
    }
    .button {
      display: inline-block;
      margin: 10px;
      padding: 12px 24px;
      background: #4299e1;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      transition: background 0.3s ease;
    }
    .button:hover {
      background: #3182ce;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1 style="margin:0">Thank You, ${name}!</h1>
    </div>
    <div class="content">
      <div class="message">
        <p>We have received your message and will get back to you soon.</p>
      </div>
      
      <div class="quote">
        <p>"Start your day with a breeze of positivity and stay motivated with these daily affirmations"</p>
      </div>
      
      <div class="button-container">
        <a href="https://www.brahmakumaris.com/join-sse/" class="button">Join in English</a>
        <a href="https://www.brahmakumaris.com/join-ssh/" class="button">हिंदी में जुड़ें</a>
      </div>
      
      <p style="color: #718096; font-size: 0.875rem;">
        Om Shanti,<br>
        Brahma Kumaris
      </p>
    </div>
  </div>
</body>
</html>
`;

export async function POST(request: Request) {
  try {
    console.log('Email API route called');
    const body: EmailRequestBody = await request.json();
    
    // Basic validation
    if (!body.name || !body.email || !body.message || !body.centerEmail) {
      console.error('Missing required fields in email request:', { body });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Extract email info
    const { name, email, phone, message, contactType, centerEmail, centerName, userAgent, pageUrl } = body;
    console.log('Processing email request for center:', centerName);
    
    // Get credentials from environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.OAUTH_REFRESH_TOKEN;
    const emailFrom = process.env.EMAIL_FROM || 'admin@bkitwing.org';
    
    // Check if email credentials are configured
    if (!clientId || !clientSecret || !refreshToken) {
      console.error('OAuth credentials are not configured', { 
        hasClientId: !!clientId, 
        hasClientSecret: !!clientSecret, 
        hasRefreshToken: !!refreshToken 
      });
      return NextResponse.json(
        { error: 'Email service is not properly configured. Please contact the administrator.' }, 
        { status: 500 }
      );
    }
    
    // Configure OAuth2 client
    const OAuth2 = google.auth.OAuth2;
    const oauth2Client = new OAuth2(
      clientId,
      clientSecret,
      'https://developers.google.com/oauthplayground'
    );
    
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
    
    try {
      console.log('Attempting to get OAuth access token');
      // Get access token
      const accessToken = await new Promise<string>((resolve, reject) => {
        oauth2Client.getAccessToken((err: Error | null, token: string | null | undefined) => {
          if (err) {
            console.error('Error getting access token:', err);
            reject(err);
          }
          if (!token) {
            console.error('Access token is null or undefined');
            reject(new Error('Access token is null or undefined'));
            return;
          }
          console.log('Successfully obtained access token');
          resolve(token);
        });
      });
      
      console.log('Creating email transporter');
      // Create transporter using OAuth2
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          type: 'OAuth2',
          user: emailFrom,
          clientId,
          clientSecret,
          refreshToken,
          accessToken
        }
      });
      
      // Format the email subject
      const emailSubject = `[${contactType}] ${name} <${email}> - ${centerName}`;
      
      console.log('Sending email to contact@brahmakumaris.com');
      // Send email to central contact instead of center
      await transporter.sendMail({
        from: `"${name} via Contact Form" <${emailFrom}>`,
        to: 'contact@brahmakumaris.com',
        replyTo: email,
        subject: emailSubject,
        html: getCenterEmailTemplate(body),
      });

      console.log('Sending acknowledgment email to sender:', email);
      // Send acknowledgment email to the sender
      await transporter.sendMail({
        from: `"Brahma Kumaris" <${emailFrom}>`,
        to: email,
        replyTo: 'contact@brahmakumaris.com',
        subject: 'Thank you for contacting Brahma Kumaris',
        html: getAcknowledgmentTemplate(name),
      });
      
      console.log('Email sent successfully');
      return NextResponse.json({ success: true });
    } catch (authError) {
      console.error('OAuth authentication error:', authError);
      return NextResponse.json(
        { error: 'Email authentication failed. Please contact the administrator.' }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email. Please try again later.' }, 
      { status: 500 }
    );
  }
}