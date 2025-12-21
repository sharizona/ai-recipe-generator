export async function generateRecipe(ingredients: string) {
  const response = await fetch("/api/askBedrock", {
    method: 'POST',
    headers: {
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