const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const USERS_TABLE = process.env.USERS_TABLE || 'Employees';

exports.handler = async (event, context) => {
  console.log('Cognito Event:', JSON.stringify(event));

  // Verify that the trigger is post confirmation
  if (event.triggerSource === 'PostConfirmation_ConfirmSignUp') {
    const { sub, email, name } = event.request.userAttributes;
    
    // Determine default role based on email suffix or attributes if present
    let role = 'Employee';
    if (email.startsWith('hr@') || email.includes('+hr')) {
      role = 'HR';
    } else if (email.startsWith('manager@') || email.includes('+manager')) {
      role = 'Manager';
    }

    const newEmployee = {
      employeeId: sub, // Matches Cognito User ID
      name: name || email.split('@')[0],
      email: email,
      role: role,
      department: role === 'HR' ? 'People Operations' : 'Engineering',
      title: role === 'Employee' ? 'Software Engineer' : role === 'Manager' ? 'Engineering Manager' : 'HR Specialist',
      createdAt: new Date().toISOString(),
      // Seed default leave allowances based on global quotas
      balances: {
        Annual: { limit: 20, used: 0 },
        Sick: { limit: 10, used: 0 },
        Casual: { limit: 8, used: 0 },
        Unpaid: { limit: 30, used: 0 }
      }
    };

    try {
      await docClient.send(new PutCommand({
        TableName: USERS_TABLE,
        Item: newEmployee
      }));
      console.log(`Successfully initialized profile in DynamoDB for user: ${email}`);
    } catch (err) {
      console.error('Error inserting user to DynamoDB table:', err);
      // Fail the signup if profile creation fails
      throw err;
    }
  }

  // Return event back to Cognito to complete signup flow
  return event;
};
