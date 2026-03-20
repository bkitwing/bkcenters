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
  centerAddress?: { line1?: string; line2?: string; line3?: string; city?: string; pincode?: string };
  centerContact?: string;
  centerMobile?: string;
  centerState?: string;
  centerDistrict?: string;
  centerRegion?: string;
  userAgent: string;
  pageUrl: string;
}

// Format center address from address object
function formatCenterAddress(addr?: EmailRequestBody['centerAddress'], state?: string): string {
  if (!addr) return '';
  const parts = [addr.line1, addr.line2, addr.line3, addr.city, addr.pincode, state].filter(Boolean);
  return parts.join(', ');
}

// Parse phone string with multiple numbers into array of {display, tel} objects
function parsePhoneNumbers(raw?: string): { display: string; tel: string }[] {
  if (!raw) return [];
  // Split on comma, slash, pipe, or semicolon
  return raw.split(/[,\/|;]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(num => ({
      display: num,
      tel: num.replace(/[^0-9+]/g, ''),
    }));
}

// Render phone numbers as individually clickable inline links for email HTML
function renderPhoneLinks(phones: { display: string; tel: string }[], style: string): string {
  return phones.map((p, i) => 
    `<a href="tel:${p.tel}" style="${style}">${p.display}</a>`
  ).join('<span style="color:#C0B49E;margin:0 4px;">&#183;</span>');
}

// Render separate Call buttons for each phone number
function renderCallButtons(phones: { display: string; tel: string }[]): string {
  return phones.map(p => 
    `<td style="padding-right:6px;padding-bottom:4px;">
      <a href="tel:${p.tel}" style="display:inline-block;padding:9px 16px;background:#FAF7F2;color:#8B6914;font-size:12px;font-weight:600;text-decoration:none;border-radius:6px;border:1px solid #ECCE8E;">Call ${p.display}</a>
    </td>`
  ).join('');
}

// Contact type labels for display
const contactTypeLabels: Record<string, string> = {
  LearnMeditation: 'Learn Meditation',
  Query: 'General Query',
  AttendEvent: 'Attend Event',
  Feedback: 'Feedback',
  Others: 'Other Inquiry',
};

// Modern HTML template for center notification
const getCenterEmailTemplate = (data: EmailRequestBody) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${contactTypeLabels[data.contactType] || data.contactType} — ${data.name}</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF7F2;font-family:'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF7F2;padding:24px 0;">
    <tr>
      <td align="center">
        <!-- Main card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#8B6914 0%,#B8860B 40%,#D4A84B 100%);padding:32px 28px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.7);">New Inquiry</p>
                    <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#FFFFFF;line-height:1.3;">${contactTypeLabels[data.contactType] || data.contactType}</h1>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:rgba(255,255,255,0.2);border-radius:20px;padding:6px 14px;">
                          <span style="font-size:13px;color:#FFFFFF;font-weight:500;">from ${data.name}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Center Info Banner -->
          <tr>
            <td style="background:#4A3609;padding:14px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.6);font-weight:600;">Center</p>
                    <p style="margin:4px 0 0;font-size:15px;color:#FBBF24;font-weight:600;">${data.centerName}</p>
                  </td>
                  <td align="right" style="vertical-align:top;">
                    ${data.centerEmail && data.centerEmail.includes('@')
                      ? `<a href="mailto:${data.centerEmail}" style="font-size:13px;color:#FDE68A;text-decoration:none;">${data.centerEmail}</a>`
                      : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="background:#FFFFFF;padding:28px;">
              
              <!-- Visitor Contact Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF5E6;border:1px solid #F5E6CC;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 14px;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:#8B6914;font-weight:700;">Visitor Details</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;vertical-align:top;width:28px;">
                          <div style="width:22px;height:22px;background:#F5E6CC;border-radius:6px;text-align:center;line-height:22px;font-size:12px;color:#8B6914;font-weight:bold;">&#9673;</div>
                        </td>
                        <td style="padding:6px 0;">
                          <p style="margin:0;font-size:15px;font-weight:600;color:#2D2A26;">${data.name}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;vertical-align:top;width:28px;">
                          <div style="width:22px;height:22px;background:#F5E6CC;border-radius:6px;text-align:center;line-height:22px;font-size:13px;color:#8B6914;">&#9993;</div>
                        </td>
                        <td style="padding:6px 0;">
                          <a href="mailto:${data.email}" style="font-size:14px;color:#A67C00;text-decoration:none;font-weight:500;">${data.email}</a>
                        </td>
                      </tr>
                      ${data.phone ? `
                      <tr>
                        <td style="padding:6px 0;vertical-align:top;width:28px;">
                          <div style="width:22px;height:22px;background:#F5E6CC;border-radius:6px;text-align:center;line-height:22px;font-size:12px;color:#8B6914;">&#9742;</div>
                        </td>
                        <td style="padding:6px 0;">
                          <a href="tel:${data.phone}" style="font-size:14px;color:#A67C00;text-decoration:none;font-weight:500;">${data.phone}</a>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Quick Reply Buttons -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding-right:8px;">
                    <a href="mailto:${data.email}?subject=Re: Your inquiry to ${data.centerName}&body=Dear ${data.name},%0D%0A%0D%0AThank you for reaching out to ${data.centerName}.%0D%0A%0D%0AOm Shanti" style="display:inline-block;padding:10px 20px;background:#B8860B;color:#FFFFFF;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;">Reply to ${data.name}</a>
                  </td>
                  ${data.phone ? `
                  <td>
                    <a href="tel:${data.phone}" style="display:inline-block;padding:10px 20px;background:#FAF7F2;color:#8B6914;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;border:1px solid #ECCE8E;">Call ${data.phone}</a>
                  </td>
                  ` : ''}
                </tr>
              </table>

              <!-- Message -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="border-left:4px solid #D4A84B;padding:20px;background:#FFFBEB;border-radius:0 12px 12px 0;">
                    <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:#8B6914;font-weight:700;">Message</p>
                    <p style="margin:0;font-size:14px;line-height:1.7;color:#504840;">${data.message.replace(/\n/g, '<br>')}</p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="border-top:1px solid #F0EBE1;"></td>
                </tr>
              </table>

              <!-- System Info (collapsible feel - smaller text) -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;border-radius:10px;border:1px solid #F0EBE1;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0 0 10px;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#A09890;font-weight:700;">Source &amp; System</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:12px;color:#6B6560;">
                      <tr>
                        <td style="padding:3px 0;font-weight:600;width:90px;vertical-align:top;color:#8B6914;">Page</td>
                        <td style="padding:3px 0;"><a href="${data.pageUrl}" style="color:#A67C00;text-decoration:none;word-break:break-all;">${data.pageUrl}</a></td>
                      </tr>
                      <tr>
                        <td style="padding:3px 0;font-weight:600;width:90px;vertical-align:top;color:#8B6914;">Timestamp</td>
                        <td style="padding:3px 0;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}</td>
                      </tr>
                      <tr>
                        <td style="padding:3px 0;font-weight:600;width:90px;vertical-align:top;color:#8B6914;">Device</td>
                        <td style="padding:3px 0;word-break:break-all;">${data.userAgent}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#FAF7F2;border-top:1px solid #F0EBE1;padding:20px 28px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#A09890;">Sent via <strong style="color:#8B6914;">Brahma Kumaris Centers</strong> contact form</p>
              <p style="margin:0;font-size:11px;color:#C0B49E;">brahmakumaris.com/centers</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Acknowledgment email template for the sender
const getAcknowledgmentTemplate = (data: EmailRequestBody) => {
  const centerAddress = formatCenterAddress(data.centerAddress, data.centerState);
  const phoneNumbers = parsePhoneNumbers(data.centerMobile || data.centerContact);
  const hasPhone = phoneNumbers.length > 0;
  // Google Maps directions link
  const mapsUrl = centerAddress
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(centerAddress)}`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank you for contacting Brahma Kumaris</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF7F2;font-family:'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF7F2;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header with warm gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#8B6914 0%,#B8860B 40%,#D4A84B 100%);padding:40px 28px 32px;text-align:center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 12px;font-size:32px;line-height:1;">&#10022;</p>
                    <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#FFFFFF;line-height:1.3;">Om Shanti, ${data.name}!</h1>
                    <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.85);font-weight:400;">Thank you for your interest in Rajyoga Meditation</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main body -->
          <tr>
            <td style="background:#FFFFFF;padding:32px 28px;">
              
              <!-- Confirmation message -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="text-align:center;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
                      <tr>
                        <td style="width:48px;height:48px;background:#FBF5E6;border-radius:50%;text-align:center;vertical-align:middle;font-size:24px;">&#10003;</td>
                      </tr>
                    </table>
                    <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#2D2A26;">Your message has been received!</p>
                    <p style="margin:0;font-size:14px;color:#6B6560;line-height:1.6;">Your <strong style="color:#8B6914;">${contactTypeLabels[data.contactType] || data.contactType}</strong> inquiry for <strong style="color:#8B6914;">${data.centerName}</strong> has been noted. Here is everything you need to know about the center.</p>
                  </td>
                </tr>
              </table>

              <!-- ===== CENTER DETAILS CARD ===== -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF5E6;border:1px solid #F5E6CC;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 14px;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:#8B6914;font-weight:700;">Center Details</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:top;width:40px;">
                          <div style="width:36px;height:36px;background:#B8860B;border-radius:8px;text-align:center;line-height:36px;font-size:16px;color:#FFFFFF;">&#8962;</div>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0 0 2px;font-size:16px;font-weight:700;color:#2D2A26;">${data.centerName}</p>
                          <p style="margin:0;font-size:12px;color:#8B6914;">Brahma Kumaris Rajyoga Meditation Center</p>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Address, Phone, Email rows -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                      ${centerAddress ? `
                      <tr>
                        <td style="padding:5px 0;vertical-align:top;width:26px;">
                          <div style="width:20px;height:20px;background:#F5E6CC;border-radius:5px;text-align:center;line-height:20px;font-size:11px;color:#8B6914;">&#9670;</div>
                        </td>
                        <td style="padding:5px 0;">
                          <p style="margin:0;font-size:13px;color:#504840;line-height:1.5;">${centerAddress}</p>
                        </td>
                      </tr>
                      ` : ''}
                      ${hasPhone ? `
                      <tr>
                        <td style="padding:5px 0;vertical-align:top;width:26px;">
                          <div style="width:20px;height:20px;background:#F5E6CC;border-radius:5px;text-align:center;line-height:20px;font-size:11px;color:#8B6914;">&#9742;</div>
                        </td>
                        <td style="padding:5px 0;">
                          ${renderPhoneLinks(phoneNumbers, 'font-size:13px;color:#A67C00;text-decoration:none;font-weight:500;')}
                        </td>
                      </tr>
                      ` : ''}
                      ${data.centerEmail && data.centerEmail.includes('@') ? `
                      <tr>
                        <td style="padding:5px 0;vertical-align:top;width:26px;">
                          <div style="width:20px;height:20px;background:#F5E6CC;border-radius:5px;text-align:center;line-height:20px;font-size:11px;color:#8B6914;">&#9993;</div>
                        </td>
                        <td style="padding:5px 0;">
                          <a href="mailto:${data.centerEmail}" style="font-size:13px;color:#A67C00;text-decoration:none;font-weight:500;">${data.centerEmail}</a>
                        </td>
                      </tr>
                      ` : ''}
                    </table>

                    <!-- Action buttons -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                      <tr>
                        <td style="padding-right:8px;">
                          <a href="${data.pageUrl}" style="display:inline-block;padding:9px 18px;background:#B8860B;color:#FFFFFF;font-size:12px;font-weight:600;text-decoration:none;border-radius:6px;">View Center Page</a>
                        </td>
                        ${mapsUrl ? `
                        <td style="padding-right:8px;">
                          <a href="${mapsUrl}" style="display:inline-block;padding:9px 18px;background:#FAF7F2;color:#8B6914;font-size:12px;font-weight:600;text-decoration:none;border-radius:6px;border:1px solid #ECCE8E;">Get Directions</a>
                        </td>
                        ` : ''}
                        ${hasPhone ? renderCallButtons(phoneNumbers) : ''}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ===== FREE 7-DAY RAJYOGA COURSE ===== -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:top;width:40px;">
                          <div style="width:36px;height:36px;background:#F59E0B;border-radius:8px;text-align:center;line-height:36px;font-size:16px;color:#FFFFFF;font-weight:bold;">7</div>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#2D2A26;">Free 7-Day Rajyoga Meditation Course</p>
                          <p style="margin:0;font-size:12px;color:#92400E;">Available at ${data.centerName}</p>
                        </td>
                      </tr>
                    </table>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
                      <tr>
                        <td style="padding:4px 0;vertical-align:top;width:22px;font-size:12px;color:#D97706;">&#10148;</td>
                        <td style="padding:4px 0;font-size:13px;color:#504840;"><strong>Day 1:</strong> Soul Consciousness — Who am I?</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;vertical-align:top;width:22px;font-size:12px;color:#D97706;">&#10148;</td>
                        <td style="padding:4px 0;font-size:13px;color:#504840;"><strong>Day 2:</strong> God — The Supreme Soul</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;vertical-align:top;width:22px;font-size:12px;color:#D97706;">&#10148;</td>
                        <td style="padding:4px 0;font-size:13px;color:#504840;"><strong>Day 3:</strong> Three Worlds — Soul World, Subtle World, Physical World</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;vertical-align:top;width:22px;font-size:12px;color:#D97706;">&#10148;</td>
                        <td style="padding:4px 0;font-size:13px;color:#504840;"><strong>Day 4:</strong> The Wheel of Time — World Cycle</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;vertical-align:top;width:22px;font-size:12px;color:#D97706;">&#10148;</td>
                        <td style="padding:4px 0;font-size:13px;color:#504840;"><strong>Day 5:</strong> Law of Karma — Action &amp; Reaction</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;vertical-align:top;width:22px;font-size:12px;color:#D97706;">&#10148;</td>
                        <td style="padding:4px 0;font-size:13px;color:#504840;"><strong>Day 6:</strong> The Tree of Humanity</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;vertical-align:top;width:22px;font-size:12px;color:#D97706;">&#10148;</td>
                        <td style="padding:4px 0;font-size:13px;color:#504840;"><strong>Day 7:</strong> Inculcation &amp; Lifestyle — Living with Values</td>
                      </tr>
                    </table>
                    <p style="margin:14px 0 0;font-size:12px;color:#92400E;line-height:1.5;">This introductory course is <strong>completely free</strong> and offered daily at Brahma Kumaris centers across India. No registration required — simply walk in!</p>
                  </td>
                </tr>
              </table>

              <!-- ===== KEY INFORMATION (FAQ) ===== -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="margin:0 0 14px;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:#8B6914;font-weight:700;">Good to Know</p>
                  </td>
                </tr>
              </table>
              
              <!-- FAQ Item 1 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;border:1px solid #F0EBE1;border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="padding:14px 16px;background:#FAF7F2;">
                    <p style="margin:0;font-size:13px;font-weight:700;color:#2D2A26;">Can anyone visit a Brahma Kumaris center?</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;background:#FFFFFF;">
                    <p style="margin:0;font-size:13px;color:#6B6560;line-height:1.6;">Yes! Every soul is welcome. Whether young or old, student, professional, or homemaker — the doors are open for all. You can sit in silence, experience peace, and learn meditation in a pure atmosphere.</p>
                  </td>
                </tr>
              </table>
              
              <!-- FAQ Item 2 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;border:1px solid #F0EBE1;border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="padding:14px 16px;background:#FAF7F2;">
                    <p style="margin:0;font-size:13px;font-weight:700;color:#2D2A26;">Is there any fee for courses or meditation?</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;background:#FFFFFF;">
                    <p style="margin:0;font-size:13px;color:#6B6560;line-height:1.6;">No, there are absolutely no fees. All courses, meditation sessions, and services are offered free of charge. Brahma Kumaris is a voluntary spiritual organization.</p>
                  </td>
                </tr>
              </table>
              
              <!-- FAQ Item 3 -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #F0EBE1;border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="padding:14px 16px;background:#FAF7F2;">
                    <p style="margin:0;font-size:13px;font-weight:700;color:#2D2A26;">What is Rajyoga Meditation?</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;background:#FFFFFF;">
                    <p style="margin:0;font-size:13px;color:#6B6560;line-height:1.6;">Rajyoga is an open-eye meditation that connects you with the Supreme Soul. It brings inner peace, mental clarity, and emotional strength. No mantras, postures, or rituals — just a pure connection with God.</p>
                  </td>
                </tr>
              </table>

              <!-- ===== GUIDED MEDITATION & APP ===== -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF5E6;border:1px solid #F5E6CC;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:top;width:40px;">
                          <div style="width:36px;height:36px;background:#B8860B;border-radius:8px;text-align:center;line-height:36px;font-size:16px;color:#FFFFFF;">&#9835;</div>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#2D2A26;">Practice Guided Meditation</p>
                          <p style="margin:0;font-size:12px;color:#6B6560;line-height:1.5;">Audio commentaries by experienced BK teachers — for all ages and life situations</p>
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                      <!-- Web Portal -->
                      <tr>
                        <td style="padding-bottom:8px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #F0EBE1;border-radius:8px;">
                            <tr>
                              <td style="padding:12px;width:36px;vertical-align:middle;">
                                <div style="width:32px;height:32px;background:#FBF5E6;border-radius:6px;text-align:center;line-height:32px;font-size:14px;color:#B8860B;">&#9678;</div>
                              </td>
                              <td style="padding:12px 0;">
                                <p style="margin:0;font-size:13px;font-weight:600;color:#2D2A26;">Listen Online</p>
                                <p style="margin:2px 0 0;font-size:11px;color:#A09890;">brahmakumaris.com/meditation</p>
                              </td>
                              <td style="padding:12px;text-align:right;">
                                <a href="https://www.brahmakumaris.com/meditation" style="display:inline-block;padding:7px 14px;background:#B8860B;color:#FFFFFF;font-size:11px;font-weight:600;text-decoration:none;border-radius:5px;">Open</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <!-- Android App -->
                      <tr>
                        <td style="padding-bottom:8px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #F0EBE1;border-radius:8px;">
                            <tr>
                              <td style="padding:12px;width:36px;vertical-align:middle;">
                                <div style="width:32px;height:32px;background:#FBF5E6;border-radius:6px;text-align:center;line-height:32px;font-size:14px;color:#B8860B;">&#9654;</div>
                              </td>
                              <td style="padding:12px 0;">
                                <p style="margin:0;font-size:13px;font-weight:600;color:#2D2A26;">Android App</p>
                                <p style="margin:2px 0 0;font-size:11px;color:#A09890;">Google Play Store</p>
                              </td>
                              <td style="padding:12px;text-align:right;">
                                <a href="https://play.google.com/store/apps/details?id=com.official.brahmakumaris" style="display:inline-block;padding:7px 14px;background:#B8860B;color:#FFFFFF;font-size:11px;font-weight:600;text-decoration:none;border-radius:5px;">Install</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <!-- iOS App -->
                      <tr>
                        <td>
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #F0EBE1;border-radius:8px;">
                            <tr>
                              <td style="padding:12px;width:36px;vertical-align:middle;">
                                <div style="width:32px;height:32px;background:#FBF5E6;border-radius:6px;text-align:center;line-height:32px;font-size:14px;color:#B8860B;">&#9679;</div>
                              </td>
                              <td style="padding:12px 0;">
                                <p style="margin:0;font-size:13px;font-weight:600;color:#2D2A26;">iOS App</p>
                                <p style="margin:2px 0 0;font-size:11px;color:#A09890;">Apple App Store</p>
                              </td>
                              <td style="padding:12px;text-align:right;">
                                <a href="https://apps.apple.com/us/app/time-for-meditation/id6759336524" style="display:inline-block;padding:7px 14px;background:#B8860B;color:#FFFFFF;font-size:11px;font-weight:600;text-decoration:none;border-radius:5px;">Install</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:14px 0 0;font-size:11px;color:#A09890;text-align:center;line-height:1.5;">Free guided meditation in Hindi &amp; English — curated for peace, sleep, focus &amp; more</p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="border-top:1px solid #F0EBE1;"></td>
                </tr>
              </table>

              <!-- Spiritual quote -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="border-left:4px solid #D4A84B;padding:20px;background:#FFFBEB;border-radius:0 12px 12px 0;text-align:center;">
                    <p style="margin:0 0 8px;font-size:20px;line-height:1;">&#10022;</p>
                    <p style="margin:0 0 8px;font-size:15px;font-style:italic;line-height:1.7;color:#504840;">"I am a peaceful soul. I radiate peace and goodwill to the world around me. My every thought is filled with purity, love, and light."</p>
                    <p style="margin:0;font-size:12px;color:#A09890;font-weight:500;">— Daily Affirmation</p>
                  </td>
                </tr>
              </table>

              <!-- CTA: Join Soul Sustenance -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="text-align:center;">
                    <p style="margin:0 0 16px;font-size:14px;color:#6B6560;">Receive daily spiritual inspiration on WhatsApp:</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                      <tr>
                        <td style="padding-right:10px;">
                          <a href="https://www.brahmakumaris.com/join-sse/" style="display:inline-block;padding:12px 24px;background:#B8860B;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">Join in English</a>
                        </td>
                        <td>
                          <a href="https://www.brahmakumaris.com/join-ssh/" style="display:inline-block;padding:12px 24px;background:#FAF7F2;color:#8B6914;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;border:1px solid #ECCE8E;">&#2361;&#2367;&#2306;&#2342;&#2368; &#2350;&#2375;&#2306; &#2332;&#2369;&#2337;&#2364;&#2375;&#2306;</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#4A3609;padding:24px 28px;text-align:center;">
              <p style="margin:0 0 8px;font-size:14px;color:#FBBF24;font-weight:600;">Om Shanti &#10022;</p>
              <p style="margin:0 0 12px;font-size:13px;color:rgba(255,255,255,0.7);">Brahma Kumaris — Rajyoga Meditation</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="padding:0 8px;">
                    <a href="https://www.brahmakumaris.com/centers" style="font-size:12px;color:#FDE68A;text-decoration:none;">Find a Center</a>
                  </td>
                  <td style="color:rgba(255,255,255,0.3);">|</td>
                  <td style="padding:0 8px;">
                    <a href="https://www.brahmakumaris.com" style="font-size:12px;color:#FDE68A;text-decoration:none;">brahmakumaris.com</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <!-- Fine print -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin-top:16px;">
          <tr>
            <td align="center">
              <p style="margin:0;font-size:11px;color:#C0B49E;">You received this email because you submitted an inquiry on brahmakumaris.com/centers</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

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
      // Get access token
      const accessToken = await new Promise<string>((resolve, reject) => {
        oauth2Client.getAccessToken((err: Error | null, token: string | null | undefined) => {
          if (err) {
            console.error('OAuth token error:', err.message);
            reject(err);
          }
          if (!token) {
            reject(new Error('Access token is null'));
            return;
          }
          resolve(token);
        });
      });
      
      // Create transporter with connection pooling for faster multi-send
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        pool: true,
        maxConnections: 2,
        auth: {
          type: 'OAuth2',
          user: emailFrom,
          clientId,
          clientSecret,
          refreshToken,
          accessToken
        }
      });
      
      // Pre-generate both HTML templates before sending
      const centerHtml = getCenterEmailTemplate(body);
      const ackHtml = getAcknowledgmentTemplate(body);
      const emailSubject = `[${contactType}] ${name} <${email}> - ${centerName}`;
      
      // Send BOTH emails in parallel — saves ~1-2 seconds vs sequential
      const [centerResult, ackResult] = await Promise.allSettled([
        transporter.sendMail({
          from: `"${name} via Contact Form" <${emailFrom}>`,
          to: 'contact@brahmakumaris.com',
          replyTo: email,
          subject: emailSubject,
          html: centerHtml,
        }),
        transporter.sendMail({
          from: `"Brahma Kumaris" <${emailFrom}>`,
          to: email,
          replyTo: 'contact@brahmakumaris.com',
          subject: `Om Shanti ${name} — Thank you for contacting ${centerName}`,
          html: ackHtml,
        }),
      ]);

      // Close the pooled connection
      transporter.close();

      // Check results — primary email to contact@ must succeed
      if (centerResult.status === 'rejected') {
        console.error('Center email failed:', centerResult.reason?.message);
        throw centerResult.reason;
      }
      if (ackResult.status === 'rejected') {
        console.warn('Acknowledgment email failed (non-critical):', ackResult.reason?.message);
      }
      
      console.log(`Emails sent for ${centerName} (${email})`);
      return NextResponse.json({ success: true });
    } catch (authError: any) {
      console.error('Email send error:', authError?.message);
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