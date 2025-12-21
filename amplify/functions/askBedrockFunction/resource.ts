import { defineFunction, secret } from '@aws-amplify/backend';

export const askBedrockFunction = defineFunction({
  name: 'askBedrockFunction',
  entry: './handler.ts',
  environment: {
    AWS_BEARER_TOKEN_BEDROCK: secret('AWS_BEARER_TOKEN_BEDROCK'),
  },
});
