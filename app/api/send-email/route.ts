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
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.OAUTH_REFRESH_TOKEN;
    const emailFrom = process.env.EMAIL_FROM || 'admin@bkitwing.org';
    
    // Check if email credentials are configured
    if (!clientId || !clientSecret || !refreshToken) {
      console.error('OAuth credentials are not configured');
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
      'https://developers.google.com/oauthplayground' // Redirect URL used to get the refresh token
    );
    
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
    
    try {
      // Get access token
      const accessToken = await new Promise<string>((resolve, reject) => {
        oauth2Client.getAccessToken((err: Error | null, token: string | null | undefined) => {
          if (err) {
            console.error('Error getting access token:', err);
            reject(err);
          }
          if (!token) {
            reject(new Error('Access token is null or undefined'));
            return;
          }
          resolve(token);
        });
      });
      
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
      
      // Format the email subject to include user's email
      const emailSubject = `[${contactType}] ${name} <${email}> - ${centerName}`;
      
      // Include system information in message with prominent user email display
      const emailHtml = `
        <h2>${contactType} from ${name} &lt;${email}&gt;</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        <h3>Message:</h3>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <h4>System Information:</h4>
        <p><strong>Page URL:</strong> ${pageUrl}</p>
        <p><strong>User Agent:</strong> ${userAgent}</p>
        <p><em>This email was sent from Brahma Kumaris website contact form on behalf of ${name} (${email}).</em></p>
      `;
      
      // Send email - using user's name but admin email (limitation of Gmail OAuth)
      await transporter.sendMail({
        from: `"${name} via Contact Form" <${emailFrom}>`,
        to: centerEmail,
        cc: 'contact@brahmakumaris.com',
        replyTo: email, // This ensures replies go directly to the user
        subject: emailSubject,
        html: emailHtml,
      });
      
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