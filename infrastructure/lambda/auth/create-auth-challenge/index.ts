import { CreateAuthChallengeTriggerEvent } from 'aws-lambda';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { CloudWatchClient, PutMetricDataCommand, StandardUnit } from '@aws-sdk/client-cloudwatch';
import * as fs from 'fs';
import * as path from 'path';

const sesClient = new SESClient({ region: process.env.AWS_REGION });
const cloudWatchClient = new CloudWatchClient({ region: process.env.AWS_REGION });

async function putMetric(metricName: string, value: number, unit: StandardUnit = StandardUnit.Count) {
  try {
    const command = new PutMetricDataCommand({
      Namespace: 'RenoMate/Auth',
      MetricData: [
        {
          MetricName: metricName,
          Value: value,
          Unit: unit,
          Dimensions: [
            {
              Name: 'Environment',
              Value: process.env.ENVIRONMENT || 'development'
            }
          ]
        }
      ]
    });
    await cloudWatchClient.send(command);
  } catch (error) {
    console.error('Error putting metric:', error);
  }
}

async function sendMagicLinkEmail(email: string, magicLink: string) {
  const templatePath = path.join(__dirname, '../email-templates/magic-link.html');
  let emailTemplate = fs.readFileSync(templatePath, 'utf8');

  // Replace placeholders in the template
  emailTemplate = emailTemplate.replace('{{LOGO_URL}}', process.env.LOGO_URL || '');
  emailTemplate = emailTemplate.replace('{{MAGIC_LINK}}', magicLink);

  const startTime = Date.now();

  try {
    const command = new SendEmailCommand({
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: emailTemplate,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: 'Your RenoMate Magic Link',
        },
      },
      Source: process.env.SENDER_EMAIL,
    });

    await sesClient.send(command);
    await putMetric('MagicLinkEmailSent', 1);
    await putMetric('MagicLinkEmailLatency', Date.now() - startTime, StandardUnit.Milliseconds);
  } catch (error) {
    console.error('Error sending email:', error);
    await putMetric('MagicLinkError', 1);
    throw error;
  }
}

export const handler = async (event: CreateAuthChallengeTriggerEvent) => {
  try {
    if (event.request.challengeName === 'CUSTOM_CHALLENGE') {
      // Generate a random 6-digit code
      const secretLoginCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Create magic link
      const magicLink = `${process.env.APP_URL}/auth/verify?code=${secretLoginCode}&email=${encodeURIComponent(event.request.userAttributes.email)}`;
      
      // Send the magic link via email
      await sendMagicLinkEmail(event.request.userAttributes.email, magicLink);

      // Return the secret code as the challenge metadata
      return {
        publicChallengeParameters: {
          email: event.request.userAttributes.email
        },
        privateChallengeParameters: {
          secretLoginCode
        },
        challengeMetadata: 'MAGIC_LINK'
      };
    }
  } catch (error) {
    console.error('Error in create auth challenge:', error);
    await putMetric('MagicLinkError', 1);
    throw error;
  }
}; 