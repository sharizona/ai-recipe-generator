import { defineFunction, secret } from '@aws-amplify/backend';

export const zoomBookingFunction = defineFunction({
  name: 'zoomBookingFunction',
  entry: './handler.ts',
  environment: {
    ZOOM_ACCOUNT_ID: secret('ZOOM_ACCOUNT_ID'),
    ZOOM_CLIENT_ID: secret('ZOOM_CLIENT_ID'),
    ZOOM_CLIENT_SECRET: secret('ZOOM_CLIENT_SECRET'),
    SES_REGION: secret('SES_REGION'),
    FROM_EMAIL: secret('FROM_EMAIL'),
  },
  timeoutSeconds: 30,
});
