import {
    RoleMessage,
    GenerateParams,
    GenerateImageParams,
    Provider,
    ContentWithTools,
    Fetcher,
  } from '../interfaces';
  
  // Default parameter constants for OpenAI GPT and Image generation
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
    model: 'dall-e', // Use OpenAI's DALL-E model for image generation
    n: 1,
    size: '512x512',
  };
  
  export class OpenAIProvider implements Provider {
    private token: string;
  
    // Constructor accepts the OpenAI API token
    constructor(private console: Console, private fetch: Fetcher, token: string) {
      this.token = token;
    }
  
    // Function to call OpenAI API for text generation
    async text(
      messages: RoleMessage[],
      params: GenerateParams = DEFAULT_GENERATE_PARAMS
    ): Promise<ContentWithTools> {
      // Filter out invalid message types
      messages = messages.filter((obj) => typeof obj !== 'string');
  
      const body = JSON.stringify({
        model: params.model,
        messages,
        max_tokens: params.max_tokens,
        temperature: params.temperature,
        top_p: params.top_k,
        //grammar: params.grammar
        //tools: params.tools,
      });

      this.console.log(body);
  
      const response = await this.fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`, // Pass the API token here
        },
        body,
      });
  
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
  
      const data = await response.json();
      const message = data.choices[0]?.message;
      const content = message?.content;
      const tools = message?.tool_calls || []; // Handle tool calls if present
  
      this.console.log(tools);

      return { content, tools };
    }
  
    // Function to call OpenAI API for image generation (DALL-E)
    async image(
      prompt: string,
      params: GenerateImageParams = DEFAULT_GENERATE_IMAGE_PARAMS
    ): Promise<string> {
      const body = JSON.stringify({
        prompt,
        n: params.n,
        size: params.size,
      });
  
      const response = await this.fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`, // Pass the API token here
        },
        body,
      });
  
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
  
      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;
  
      if (!imageUrl) {
        throw new Error('No image URL returned in response.');
      }
  
      return imageUrl;
    }
  
    // This method simulates TTS (Text-to-Speech), not currently supported by OpenAI API
    async tts(input: string): Promise<string> {
      const body = JSON.stringify({
        model: 'tts-1',
        input,
      });
  
      try {
        const response = await this.fetch('http://localhost:8080/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body,
        });
  
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
  
        const blob = await response.blob();
  
        if (!blob) {
          throw new Error('No TTS blob returned in response.');
        }
  
        return URL.createObjectURL(blob); // Assuming you want to return a URL for the blob
      } catch (error) {
        console.error('Failed to generate TTS:', error);
        throw error;
      }
    }
  }
  
  // ProviderFactory class that returns a Provider with a token
export class OpenAiProviderFactory {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  /**
   * This method returns the LocalhostProvider constructor
   * pre-configured with the OpenAI token.
   */
  getProvider(): new (console: Console, fetch: Fetcher) => OpenAIProvider {
    const token = this.token;

    // Return a LocalhostProvider constructor with token injected
    return class extends OpenAIProvider {
      constructor(console: Console, fetch: Fetcher) {
        super(console, fetch, token);
      }
    };
  }
}
