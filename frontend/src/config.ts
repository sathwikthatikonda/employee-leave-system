// Centralized configuration for API Gateway connections
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://r1dznwxd2b.execute-api.us-east-1.amazonaws.com';

// Cognito Config
export const COGNITO_REGION = import.meta.env.VITE_COGNITO_REGION || 'ap-southeast-2';
export const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '4f0ms7a1r03cjp9m17f5qk7qes';
