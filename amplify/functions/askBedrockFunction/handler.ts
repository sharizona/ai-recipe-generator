import type { Schema } from '../../data/resource';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

export const handler: Schema["askBedrock"]["functionHandler"] = async (event) => {
  const { ingredients } = event.arguments;

  if (!ingredients || ingredients.length === 0) {
    return { body: 'Please provide ingredients' };
  }

  const client = new BedrockRuntimeClient({ region: 'us-west-2' });

  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Generate a recipe using these ingredients: ${ingredients.join(', ')}`,
      },
    ],
  };

  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload),
  });

  const response = await client.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.body));

  return { body: result.content[0].text };
};
