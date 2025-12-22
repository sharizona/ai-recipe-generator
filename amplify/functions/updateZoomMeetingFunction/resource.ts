import { defineFunction, secret } from '@aws-amplify/backend';

export const updateZoomMeetingFunction = defineFunction({
  name: 'updateZoomMeetingFunction',
  entry: './handler.ts',
  environment: {
    ZOOM_ACCOUNT_ID: secret('ZOOM_ACCOUNT_ID'),
    ZOOM_CLIENT_ID: secret('ZOOM_CLIENT_ID'),
    ZOOM_CLIENT_SECRET: secret('ZOOM_CLIENT_SECRET'),
  },
  timeoutSeconds: 30,
});
