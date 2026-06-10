const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const USERS_TABLE = process.env.USERS_TABLE || 'Employees';

exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event));

  const httpMethod = event.httpMethod || (event.requestContext && event.requestContext.http ? event.requestContext.http.method : '');
  const path = event.path || (event.requestContext && event.requestContext.http ? event.requestContext.http.path : '');

  let response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: ''
  };

  try {
    if (httpMethod === 'OPTIONS') {
      return response;
    }

    // Route: GET /users/{id}
    if (path.startsWith('/users/') && !path.endsWith('/balances') && httpMethod === 'GET') {
      const employeeId = path.split('/')[2];
      
      const result = await docClient.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { employeeId }
      }));

      if (!result.Item) {
        response.statusCode = 404;
        response.body = JSON.stringify({ message: 'User profile not found.' });
        return response;
      }

      response.body = JSON.stringify(result.Item);
      return response;
    }

    // Route: GET /users (List all employees)
    if (path === '/users' && httpMethod === 'GET') {
      const result = await docClient.send(new ScanCommand({
        TableName: USERS_TABLE
      }));
      response.body = JSON.stringify(result.Items || []);
      return response;
    }

    // Route: PUT /users/{id}/balances (Modify specific employee balances)
    if (path.startsWith('/users/') && path.endsWith('/balances') && httpMethod === 'PUT') {
      const employeeId = path.split('/')[2];
      const body = JSON.parse(event.body || '{}');
      const { type, limit, used } = body;

      if (!type || limit === undefined || used === undefined) {
        response.statusCode = 400;
        response.body = JSON.stringify({ message: 'Missing type, limit, or used days values.' });
        return response;
      }

      // Update specific attribute path inside nested structure, e.g. balances.Annual
      const balancePath = `balances.${type}`;
      
      await docClient.send(new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { employeeId },
        UpdateExpression: 'set #bal.#type = :b',
        ExpressionAttributeNames: {
          '#bal': 'balances',
          '#type': type
        },
        ExpressionAttributeValues: {
          ':b': { limit: Number(limit), used: Number(used) }
        }
      }));

      response.body = JSON.stringify({ message: `Balances updated successfully for ${type} leave.` });
      return response;
    }

    // Unknown endpoint
    response.statusCode = 404;
    response.body = JSON.stringify({ message: 'Endpoint not found.' });
    return response;

  } catch (error) {
    console.error('User handler error:', error);
    response.statusCode = 500;
    response.body = JSON.stringify({ message: 'Internal Server Error', error: error.message });
    return response;
  }
};
