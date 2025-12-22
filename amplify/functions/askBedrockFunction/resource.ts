import { defineFunction } from '@aws-amplify/backend';

export const askBedrockFunction = defineFunction({
  name: 'askBedrockFunction',
  entry: './handler.ts',
  timeoutSeconds: 30,
});
