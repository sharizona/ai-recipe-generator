import { defineFunction } from '@aws-amplify/backend';
import { Duration } from 'aws-cdk-lib';

export const askBedrockFunction = defineFunction({
  name: 'askBedrockFunction',
  entry: './handler.ts',
  timeoutSeconds: 30,
});
