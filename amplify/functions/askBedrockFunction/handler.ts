import type { Schema } from '../../data/resource';

export const handler: Schema["askBedrock"]["functionHandler"] = async (event) => {
  const { ingredients } = event.arguments;

  if (!ingredients || ingredients.length === 0) {
    return { body: 'Please provide ingredients' };
  }

  const response = await fetch(
    'https://bedrock-runtime.us-west-2.amazonaws.com/model/anthropic.claude-3-sonnet-20240229-v1:0/invoke',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AWS_BEARER_TOKEN_BEDROCK}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Generate a recipe using these ingredients: ${ingredients.join(', ')}`,
          },
        ],
      }),
    }
  );

  const result = await response.json();
  return { body: result.content[0].text };
};
