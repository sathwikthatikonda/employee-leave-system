import hmac
import hashlib
import base64

import boto3
from botocore.exceptions import ClientError

REGION_NAME = "ap-southeast-2"
USER_POOL_ID = "ap-southeast-2_BowIQ4Xb9"
CLIENT_ID = "182uf74po0mj65nf34cve61i07"
CLIENT_SECRET = "nvkr5pv4qfg9ve5n5uf871nlven5hfpera0lk7tlev8beqi1df8"

cognito_client = boto3.client('cognito-idp', region_name=REGION_NAME)


def _compute_secret_hash(username):
    """Computes the SECRET_HASH required when the App Client has a secret configured."""
    message = username + CLIENT_ID
    dig = hmac.new(
        CLIENT_SECRET.encode('utf-8'),
        msg=message.encode('utf-8'),
        digestmod=hashlib.sha256
    ).digest()
    return base64.b64encode(dig).decode()


def register_employee(email, password, name):
    """Registers a new employee into the Cognito User Pool"""
    try:
        kwargs = {
            'ClientId': CLIENT_ID,
            'Username': email,  # Since we selected Email as sign-in identifier
            'Password': password,
            'UserAttributes': [
                {'Name': 'email', 'Value': email},
                {'Name': 'name', 'Value': name}
            ]
        }
        if CLIENT_SECRET:
            kwargs['SecretHash'] = _compute_secret_hash(email)

        response = cognito_client.sign_up(**kwargs)
        return {"status": "Success", "message": "User registered. Check email for confirmation code."}
    except ClientError as e:
        return {"status": "Error", "message": e.response['Error']['Message']}


def confirm_registration(email, confirmation_code):
    """Confirms a user's registration with the code sent to their email"""
    try:
        kwargs = {
            'ClientId': CLIENT_ID,
            'Username': email,
            'ConfirmationCode': confirmation_code,
        }
        if CLIENT_SECRET:
            kwargs['SecretHash'] = _compute_secret_hash(email)

        cognito_client.confirm_sign_up(**kwargs)
        return {"status": "Success", "message": "Email confirmed. You can now log in."}
    except ClientError as e:
        return {"status": "Error", "message": e.response['Error']['Message']}


def login_employee(email, password):
    """Authenticates the employee and returns JWT tokens"""
    try:
        kwargs = {
            'ClientId': CLIENT_ID,
            'AuthFlow': 'USER_PASSWORD_AUTH',
            'AuthParameters': {
                'USERNAME': email,
                'PASSWORD': password
            }
        }
        if CLIENT_SECRET:
            kwargs['AuthParameters']['SECRET_HASH'] = _compute_secret_hash(email)

        response = cognito_client.initiate_auth(**kwargs)
        # The AuthenticationResult contains IdToken, AccessToken, and RefreshToken
        return {
            "status": "Success",
            "tokens": response['AuthenticationResult']
        }
    except ClientError as e:
        return {"status": "Error", "message": e.response['Error']['Message']}
