import { defineFunction, secret } from '@aws-amplify/backend';

export const stripeCheckoutFunction = defineFunction({
  name: 'stripeCheckoutFunction',
  entry: './handler.ts',
  environment: {
    STRIPE_SECRET_KEY: secret('STRIPE_SECRET_KEY'),
  },
  timeoutSeconds: 30,
});
