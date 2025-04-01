import { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand, ConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const cognito = new CognitoIdentityProviderClient({});
const rdsData = new RDSDataClient({});
const secretsManager = new SecretsManagerClient({});

export const signUp = async (event: any) => {
  try {
    const { email, password } = JSON.parse(event.body || '{}');

    // Sign up with Cognito
    const signUpResponse = await cognito.send(
      new SignUpCommand({
        ClientId: process.env.COGNITO_CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [
          {
            Name: 'email',
            Value: email,
          },
        ],
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'User signed up successfully',
        userSub: signUpResponse.UserSub,
        userConfirmed: signUpResponse.UserConfirmed,
      }),
    };
  } catch (error: any) {
    console.error('Error signing up:', error);
    return {
      statusCode: error.name === 'UsernameExistsException' ? 409 : 500,
      body: JSON.stringify({
        error: error.message || 'Failed to sign up user',
      }),
    };
  }
};

export const confirmSignUp = async (event: any) => {
  try {
    const { email, code } = JSON.parse(event.body || '{}');

    // Confirm sign up with Cognito
    await cognito.send(
      new ConfirmSignUpCommand({
        ClientId: process.env.COGNITO_CLIENT_ID,
        Username: email,
        ConfirmationCode: code,
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'User confirmed successfully',
      }),
    };
  } catch (error: any) {
    console.error('Error confirming sign up:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Failed to confirm user',
      }),
    };
  }
};

export const signIn = async (event: any) => {
  try {
    const { email, password } = JSON.parse(event.body || '{}');

    // Sign in with Cognito
    const authResponse = await cognito.send(
      new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: process.env.COGNITO_CLIENT_ID,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      })
    );

    // Get database credentials
    const secretResponse = await secretsManager.send(
      new GetSecretValueCommand({
        SecretId: process.env.DB_SECRET_NAME,
      })
    );

    const secret = JSON.parse(secretResponse.SecretString || '{}');
    const { dbname } = secret;

    // Check if user exists in our database
    const userResponse = await rdsData.send(
      new ExecuteStatementCommand({
        secretArn: process.env.DB_SECRET_NAME,
        database: dbname,
        sql: `
          SELECT user_id, is_pro, stripe_customer_id, stripe_subscription_id
          FROM users
          WHERE user_id = :userId
        `,
        parameters: [
          {
            name: 'userId',
            value: { stringValue: authResponse.AuthenticationResult?.AccessToken?.payload.sub },
          },
        ],
      })
    );

    let user = null;
    if (userResponse.records && userResponse.records.length > 0) {
      user = {
        userId: userResponse.records[0][0].stringValue,
        isPro: userResponse.records[0][1].booleanValue,
        stripeCustomerId: userResponse.records[0][2].stringValue,
        stripeSubscriptionId: userResponse.records[0][3].stringValue,
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'User signed in successfully',
        tokens: {
          accessToken: authResponse.AuthenticationResult?.AccessToken,
          idToken: authResponse.AuthenticationResult?.IdToken,
          refreshToken: authResponse.AuthenticationResult?.RefreshToken,
        },
        user,
      }),
    };
  } catch (error: any) {
    console.error('Error signing in:', error);
    return {
      statusCode: error.name === 'NotAuthorizedException' ? 401 : 500,
      body: JSON.stringify({
        error: error.message || 'Failed to sign in user',
      }),
    };
  }
};

export const handler = async (event: any) => {
  const { action } = event.pathParameters || {};

  switch (action) {
    case 'signup':
      return signUp(event);
    case 'confirm':
      return confirmSignUp(event);
    case 'signin':
      return signIn(event);
    default:
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Action not found',
        }),
      };
  }
}; 