const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const LEAVES_TABLE = process.env.LEAVES_TABLE || 'LeaveRequests';

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
    // Handle CORS preflight options request
    if (httpMethod === 'OPTIONS') {
      response.statusCode = 200;
      return response;
    }

    // Route: POST /leaves (Submit a leave request)
    if (path === '/leaves' && httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { employeeId, employeeName, employeeEmail, department, type, startDate, endDate, days, reason } = body;
      
      if (!employeeId || !type || !startDate || !endDate || !days) {
        response.statusCode = 400;
        response.body = JSON.stringify({ message: 'Missing required parameters.' });
        return response;
      }

      const requestId = `req-${Date.now()}`;
      const newRequest = {
        requestId,
        employeeId,
        employeeName,
        employeeEmail,
        department,
        type,
        startDate,
        endDate,
        days: Number(days),
        reason: reason || '',
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      await docClient.send(new PutCommand({
        TableName: LEAVES_TABLE,
        Item: newRequest
      }));

      response.statusCode = 201;
      response.body = JSON.stringify({ message: 'Request submitted successfully.', requestId });
      return response;
    }

    // Route: GET /leaves (Fetch leave requests)
    if (path === '/leaves' && httpMethod === 'GET') {
      const queryParams = event.queryStringParameters || {};
      const employeeId = queryParams.employeeId;
      const status = queryParams.status;

      let items = [];
      if (employeeId) {
        // Query by employeeId (requires a Global Secondary Index on employeeId)
        const result = await docClient.send(new QueryCommand({
          TableName: LEAVES_TABLE,
          IndexName: 'EmployeeIndex',
          KeyConditionExpression: 'employeeId = :empId',
          ExpressionAttributeValues: {
            ':empId': employeeId
          }
        }));
        items = result.Items || [];
      } else {
        // Scan all requests (e.g. for Manager or HR audits)
        const result = await docClient.send(new ScanCommand({
          TableName: LEAVES_TABLE
        }));
        items = result.Items || [];
      }

      // Filter by status if specified in query params
      if (status) {
        items = items.filter(item => item.status === status);
      }

      response.body = JSON.stringify(items);
      return response;
    }

    // Route: PUT /leaves/{id}/status (Approve or Reject request)
    if (path.startsWith('/leaves/') && path.endsWith('/status') && httpMethod === 'PUT') {
      const segments = path.split('/');
      const requestId = segments[2]; // /leaves/{id}/status
      const body = JSON.parse(event.body || '{}');
      const { status, managerComment } = body;

      if (!status || !['Approved', 'Rejected'].includes(status)) {
        response.statusCode = 400;
        response.body = JSON.stringify({ message: 'Invalid or missing status.' });
        return response;
      }

      await docClient.send(new UpdateCommand({
        TableName: LEAVES_TABLE,
        Key: { requestId },
        UpdateExpression: 'set #status = :s, managerComment = :c, resolvedAt = :r',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':s': status,
          ':c': managerComment || '',
          ':r': new Date().toISOString()
        }
      }));

      response.body = JSON.stringify({ message: `Request successfully ${status.toLowerCase()}ed.` });
      return response;
    }

    // Unknown route
    response.statusCode = 404;
    response.body = JSON.stringify({ message: 'Endpoint not found.' });
    return response;

  } catch (error) {
    console.error('Database handler error:', error);
    response.statusCode = 500;
    response.body = JSON.stringify({ message: 'Internal Server Error', error: error.message });
    return response;
  }
};
