const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const crypto = require('crypto');
const sesClient = new SESClient({});

const SES_SENDER = process.env.SES_SENDER || 'noreply@yourdomain.com';

exports.handler = async (event) => {
    let otpCode;

    if (!event.request.session || event.request.session.length === 0) {
        // This is a new auth session, generate a new OTP code
        otpCode = Math.floor(100000 + crypto.randomInt(0, 900000)).toString();

        // Send the email
        const mailParams = {
            Source: SES_SENDER,
            Destination: {
                ToAddresses: [event.request.userAttributes.email]
            },
            Message: {
                Subject: { Data: 'Your Employee Leave Management Login Code' },
                Body: {
                    Text: { Data: `Your secure login code is: ${otpCode}\n\nIt is valid for 5 minutes.` },
                    Html: { Data: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; background-color: #0A0A0C; border: 1.5px solid #00F0FF; border-radius: 12px; color: #E4E4E7;">
                      <h2 style="color: #00F0FF; text-align: center;">Your Login Code</h2>
                      <div style="font-size: 2.2rem; font-weight: bold; text-align: center; letter-spacing: 6px; margin: 30px 0; padding: 20px; border-radius: 8px; border: 1.5px dashed #00F0FF; color: #00F0FF;">
                        ${otpCode}
                      </div>
                      <p style="text-align: center;">It is valid for 5 minutes.</p>
                    </div>` }
                }
            }
        };

        try {
            await sesClient.send(new SendEmailCommand(mailParams));
            console.log(`Email sent to ${event.request.userAttributes.email}`);
        } catch (err) {
            console.error('SES send email failed:', err);
            throw new Error('Failed to send OTP via Email');
        }
    } else {
        // There's an existing session. We've already sent an OTP, use the same one
        const previousChallenge = event.request.session.slice(-1)[0];
        otpCode = previousChallenge.challengeMetadata.match(/CODE-(\d*)/)[1];
    }

    // Add the OTP to private challenge parameters (not visible to frontend)
    event.response.privateChallengeParameters = {};
    event.response.privateChallengeParameters.answer = otpCode;
    // Add the OTP to the challenge metadata so it can be extracted if they retry
    event.response.challengeMetadata = `CODE-${otpCode}`;

    return event;
};
