import nodemailer from 'nodemailer';

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  // Try API method first if BREVO_API_KEY is available
  if (process.env.BREVO_API_KEY) {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: {
            email: "nakumar987@gmail.com",
            name: "StapuBox"
          },
          to: [
            {
              email: params.to,
              name: "StapuBox Team"
            }
          ],
          subject: params.subject,
          htmlContent: params.htmlContent,
          textContent: params.textContent || params.htmlContent.replace(/<[^>]*>/g, '')
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Email delivered successfully via Brevo API");
        console.log("Message ID:", result.messageId);
        return true;
      } else {
        const errorData = await response.json();
        
        // Check for specific activation error
        if (errorData.code === 'permission_denied' && errorData.message.includes('not yet activated')) {
          console.log("\n🔧 BREVO SMTP ACTIVATION REQUIRED");
          console.log("Your Brevo account needs SMTP activation to send emails.");
          console.log("Contact: contact@brevo.com");
          console.log("Request: SMTP activation for email sending");
          console.log("\n📧 EMAIL READY FOR DELIVERY:");
          console.log(`To: ${params.to}`);
          console.log(`Subject: ${params.subject}`);
          console.log("Content:");
          console.log(params.htmlContent.replace(/<[^>]*>/g, '').trim());
          console.log("====================================\n");
          return false;
        } else {
          console.log("Brevo API error:", errorData);
        }
      }
    } catch (error) {
      console.log("API request failed:", error);
    }
  }

  // Fallback to SMTP method
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: '90df2e001@smtp-brevo.com',
        pass: 'mkcnFGgO7rU04WyM'
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Send email using authenticated sender
    const info = await transporter.sendMail({
      from: `"StapuBox" <90df2e001@smtp-brevo.com>`,
      to: params.to,
      subject: params.subject,
      text: params.textContent || params.htmlContent.replace(/<[^>]*>/g, ''),
      html: params.htmlContent
    });

    console.log("Email sent successfully:", info.messageId);
    return true;
  } catch (error: any) {
    console.error("Email sending error:", error);
    
    // Check if it's SMTP activation issue
    if (error.response && error.response.includes('not yet activated')) {
      console.log("📧 EMAIL NOTIFICATION (SMTP Account Needs Activation):");
      console.log("To:", params.to);
      console.log("Subject:", params.subject);
      console.log("Content:", params.htmlContent.replace(/<[^>]*>/g, ''));
      console.log("---");
      console.log("ℹ️  Contact contact@sendinblue.com to activate your SMTP account for live email delivery");
    } else {
      // Log to console as fallback for other errors
      console.log("📧 EMAIL NOTIFICATION (SMTP Error):");
      console.log("To:", params.to);
      console.log("Subject:", params.subject);
      console.log("Content:", params.htmlContent.replace(/<[^>]*>/g, ''));
      console.log("---");
    }
    return false;
  }
}

export function createCareerApplicationEmail(application: any): EmailParams {
  const htmlContent = `
    <h2>New Career Application Received</h2>
    <p>A new career application has been submitted through the StapuBox website.</p>
    
    <h3>Applicant Details:</h3>
    <ul>
      <li><strong>Name:</strong> ${application.name}</li>
      <li><strong>Email:</strong> ${application.email}</li>
      <li><strong>Phone:</strong> ${application.phone}</li>
      <li><strong>Contribution Area:</strong> ${application.contributionArea}</li>
      ${application.resumeUrl ? `<li><strong>Resume URL:</strong> <a href="${application.resumeUrl}">${application.resumeUrl}</a></li>` : ''}
    </ul>
    
    <p><strong>Submitted on:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
    
    <hr>
    <p><em>This email was automatically generated from the StapuBox career application form.</em></p>
  `;

  return {
    to: "info@stapubox.com",
    from: "noreply@replit.dev",
    subject: `New Career Application: ${application.name} - ${application.contributionArea}`,
    htmlContent
  };
}

export function createInvestorInquiryEmail(inquiry: any): EmailParams {
  const htmlContent = `
    <h2>New Investor Inquiry Received</h2>
    <p>A new investor inquiry has been submitted through the StapuBox website.</p>
    
    <h3>Investor Details:</h3>
    <ul>
      <li><strong>Name:</strong> ${inquiry.name}</li>
      <li><strong>Business Email:</strong> ${inquiry.businessEmail}</li>
      <li><strong>Phone:</strong> ${inquiry.phone}</li>
    </ul>
    
    <p><strong>Submitted on:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
    
    <hr>
    <p><em>This email was automatically generated from the StapuBox investor inquiry form.</em></p>
  `;

  return {
    to: "info@stapubox.com",
    from: "noreply@replit.dev",
    subject: `New Investor Inquiry: ${inquiry.name}`,
    htmlContent
  };
}