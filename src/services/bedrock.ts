export async function generateRecipe(ingredients: string) {
  const response = await fetch('https://bedrock-runtime.us-west-2.amazonaws.com/model/anthropic.claude-3-sonnet-20240229-v1:0/invoke', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_AWS_BEARER_TOKEN_BEDROCK}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Generate a recipe using: ${ingredients}`,
        },
      ],
    }),
  });

  const result = await response.json();
  return result.content[0].text;
}