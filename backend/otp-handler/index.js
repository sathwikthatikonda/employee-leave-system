const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const crypto = require('crypto');

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const sesClient = new SESClient({});

const OTP_TABLE = process.env.OTP_TABLE || 'Otps';
const USERS_TABLE = process.env.USERS_TABLE || 'Employees';
const SES_SENDER = process.env.SES_SENDER || 'noreply@yourdomain.com';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-chronos-key-12345';

// Helper to sign JWT using built-in crypto module (HS256)
function signJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  
  const base64UrlEncode = (obj) => {
    const str = JSON.stringify(obj);
    return Buffer.from(str).toString('base64url');
  };
  
  const tokenInput = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(tokenInput)
    .digest('base64url');
    
  return `${tokenInput}.${signature}`;
}

exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event));

  const httpMethod = event.httpMethod || (event.requestContext && event.requestContext.http ? event.requestContext.http.method : '');
  const path = event.path || (event.requestContext && event.requestContext.http ? event.requestContext.http.path : '');

  const responseHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
  };

  let response = {
    statusCode: 200,
    headers: responseHeaders,
    body: ''
  };

  try {
    if (httpMethod === 'OPTIONS') {
      return response;
    }

    // Route: POST /send-otp
    if (path === '/send-otp' && httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { email, name, role } = body;

      if (!email) {
        response.statusCode = 400;
        response.body = JSON.stringify({ message: 'Email address is required.' });
        return response;
      }

      // Generate secure 6-digit OTP
      const otp = Math.floor(100000 + crypto.randomInt(0, 900000)).toString();
      const ttl = Math.floor(Date.now() / 1000) + 300; // 5 mins expiration

      // Save to OTP table
      await docClient.send(new PutCommand({
        TableName: OTP_TABLE,
        Item: {
          email,
          otp,
          name: name || '',
          role: role || 'Employee',
          ttl
        }
      }));

      console.log(`Generated OTP for ${email}: ${otp}`);

      let emailSent = false;
      let emailError = '';

      try {
        const mailParams = {
          Source: SES_SENDER,
          Destination: {
            ToAddresses: [email]
          },
          Message: {
            Subject: {
              Data: 'Employee Leave Management Portal - Your Secure OTP Verification Code'
            },
            Body: {
              Html: {
                Data: `
                  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; background-color: #0A0A0C; border: 1.5px solid #00F0FF; border-radius: 12px; color: #E4E4E7; box-shadow: 0 10px 30px rgba(0, 240, 255, 0.1);">
                    <div style="text-align: center; margin-bottom: 20px;">
                      <h1 style="color: #00F0FF; margin: 0; font-size: 1.6rem; letter-spacing: 2px;">EMPLOYEE LEAVE MANAGEMENT SECURITY</h1>
                      <p style="color: #71717A; margin: 5px 0 0 0; font-size: 0.85rem;">Employee Leave Management System</p>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #27272A; margin: 20px 0;" />
                    <p style="font-size: 0.95rem; line-height: 1.5;">Hello <strong>${name || email.split('@')[0]}</strong>,</p>
                    <p style="font-size: 0.95rem; line-height: 1.5;">You requested a secure login code to access the Employee Leave Management Portal as an <strong>${role || 'Employee'}</strong>.</p>
                    <div style="font-size: 2.2rem; font-weight: bold; text-align: center; letter-spacing: 6px; margin: 30px 0; padding: 20px; background-color: rgba(255, 255, 255, 0.02); border-radius: 8px; border: 1.5px dashed #00F0FF; color: #00F0FF;">
                      ${otp}
                    </div>
                    <p style="color: #71717A; font-size: 0.8rem; text-align: center; margin-top: 30px;">
                      This code is valid for 5 minutes. If you did not request this code, please ignore this email.
                    </p>
                  </div>
                `
              },
              Text: {
                Data: `Hello ${name || email.split('@')[0]},\n\nYour secure Employee Leave Management Portal OTP verification code is: ${otp}\n\nThis code will expire in 5 minutes.`
              }
            }
          }
        };

        await sesClient.send(new SendEmailCommand(mailParams));
        emailSent = true;
      } catch (err) {
        console.error('SES send email failed:', err);
        emailError = err.message;
      }

      // Return response with devModeOtp for testing convenience
      response.statusCode = 200;
      response.body = JSON.stringify({
        message: emailSent ? 'OTP sent successfully! Please check your inbox.' : `Failed to send email: ${emailError}`,
        emailSent,
        devModeOtp: otp
      });
      return response;
    }

    // Route: POST /verify-otp
    if (path === '/verify-otp' && httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const email = body.email;
      const otp = body.otp || body.otpEntered;
      const name = body.name;
      const role = body.role;

      if (!email || !otp) {
        response.statusCode = 400;
        response.body = JSON.stringify({ message: 'Email and verification code are required.' });
        return response;
      }

      // Retrieve OTP record
      const otpRecord = await docClient.send(new GetCommand({
        TableName: OTP_TABLE,
        Key: { email }
      }));

      const now = Math.floor(Date.now() / 1000);
      if (!otpRecord.Item || otpRecord.Item.otp !== otp || otpRecord.Item.ttl < now) {
        response.statusCode = 400;
        response.body = JSON.stringify({ message: 'Invalid or expired verification code.' });
        return response;
      }

      // Valid OTP. Delete from OtpTable to prevent replay attacks
      await docClient.send(new DeleteCommand({
        TableName: OTP_TABLE,
        Key: { email }
      }));

      // Look up existing employee profile in EmployeesTable
      const scanResult = await docClient.send(new ScanCommand({
        TableName: USERS_TABLE,
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: { ':email': email }
      }));

      let employee = scanResult.Items && scanResult.Items[0];

      // Auto-provision profile if user doesn't exist
      if (!employee) {
        const employeeId = `emp-${Date.now()}`;
        const finalName = name || otpRecord.Item.name || email.split('@')[0];
        const finalRole = role || otpRecord.Item.role || 'Employee';
        
        employee = {
          employeeId,
          name: finalName,
          email,
          role: finalRole,
          department: finalRole === 'HR' ? 'People Operations' : finalRole === 'Manager' ? 'Management' : 'Engineering',
          title: finalRole === 'Employee' ? 'Software Engineer' : finalRole === 'Manager' ? 'Team Lead' : 'HR Administrator',
          createdAt: new Date().toISOString(),
          balances: {
            Annual: { limit: 20, used: 0 },
            Sick: { limit: 10, used: 0 },
            Casual: { limit: 8, used: 0 },
            Unpaid: { limit: 30, used: 0 }
          }
        };

        await docClient.send(new PutCommand({
          TableName: USERS_TABLE,
          Item: employee
        }));
        console.log(`Auto-provisioned new profile for ${email}`);
      }

      // Generate standard JWT signed with JWT_SECRET
      const tokenPayload = {
        sub: employee.employeeId,
        name: employee.name,
        email: employee.email,
        "cognito:groups": [employee.role],
        email_verified: true,
        auth_time: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour token
        iat: Math.floor(Date.now() / 1000)
      };

      const token = signJwt(tokenPayload, JWT_SECRET);

      response.statusCode = 200;
      response.body = JSON.stringify({
        success: true,
        token,
        user: {
          id: employee.employeeId,
          name: employee.name,
          email: employee.email,
          role: employee.role,
          department: employee.department,
          title: employee.title
        }
      });
      return response;
    }

    // Endpoint not found
    response.statusCode = 404;
    response.body = JSON.stringify({ message: 'Endpoint not found.' });
    return response;

  } catch (error) {
    console.error('OTP handler error:', error);
    response.statusCode = 500;
    response.body = JSON.stringify({ message: 'Internal Server Error', error: error.message });
    return response;
  }
};
