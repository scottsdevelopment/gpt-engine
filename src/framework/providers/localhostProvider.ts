import { RoleMessage, GenerateParams, GenerateImageParams, Provider, ContentWithTools } from '../interfaces';

// Default parameter constants
const DEFAULT_GENERATE_PARAMS: GenerateParams = {
  max_tokens: 2000,
  model: 'gpt-4',
  grammar: '',
  tools: [],
  top_k: 1,
  temperature: 1,
  tool_choice: 'required',
};

const DEFAULT_GENERATE_IMAGE_PARAMS: GenerateImageParams = {
  model: 'stablediffusion',
  steps: 10,
  n: 1,
  size: '512x512',
};

export class LocalhostProvider implements Provider {
  // IoC for Console and Fetcher
  constructor(private console, private fetch) {}

  // Function to call the external API for text generation
  async text(
    messages: RoleMessage[],
    params: GenerateParams = DEFAULT_GENERATE_PARAMS
  ): Promise<ContentWithTools> {
    // Filter out invalid message types
    messages = messages.filter((obj) => typeof obj !== 'string');

    const body = JSON.stringify({
      ...params,
      messages,
    });

    this.console.log(body);

    const response = await this.fetch('http://localhost:8080/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const message = data.choices[0]?.message;
    const content = message?.content;
    const tools = message?.tool_calls;

    return { content, tools };
  }

  
  async tts(input: string): Promise<string> {
    const body = JSON.stringify({
      model: 'tts-1',
      input
    });

    try {
      const response = await fetch('http://localhost:8080/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const blob = (await response.blob()) as any;
      //const ttsUrl = data.data[0]?.url;

      if (!blob) {
        throw new Error('No TTS URL returned in response.');
      }
      return blob;
    } catch (error) {
      console.error('Failed to generate TTS:', error);
      throw error;
    }
  }

  // Function to call the external API for generating images
  async image(
    prompt: string,
    params: GenerateImageParams = DEFAULT_GENERATE_IMAGE_PARAMS
  ): Promise<string> {
    const body = JSON.stringify({
      prompt,
      ...params,
    });

  //  console.log(prompt, params)

    const response = await this.fetch('http://localhost:8080/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }
    // this.console.log(await response.text())
    const data = (await response.json()) as any;
   // this.console.log(data)
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL returned in response.');
    }

    return imageUrl;
  }
}
