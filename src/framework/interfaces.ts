// Describes the message structure with a role and content
export interface RoleMessage {
    role: string;
    content?: string;
    tool_calls?: any;
    tool_call?: any;
    tool_call_id?: any;
}

// Tool and parameter interfaces for tool integrations
export interface Tool {
    function: {
        parameters: any;
        name: any;
    };
}

export interface GenerateParams {
    max_tokens: number;
    model: string;
    grammar?: string;
    tools: Tool[];
    top_k: number;
    temperature: number;
    tool_choice: string;
}

export interface GenerateImageParams {
    model: string;
    steps?: number;
    n: number;
    size: string;
}

// Console contract for IoC, allowing direct method calls (e.g., this.console.log)
export interface Console {
    log(message: string): void;
    error(message: string): void;
}

// Define an interface for the providers
export interface Provider {
    // Function to generate text response
    text(messages: RoleMessage[],
        params: GenerateParams): Promise<ContentWithTools>;

    // Function to generate an image based on a prompt
    image(prompt: string, params: GenerateImageParams): Promise<string>;

    // Function to generate an image based on a prompt
    tts(input: string): Promise<string>;
}

export type ProviderConstructor = new (console: Console, fetch: Fetcher, ...args: any) => Provider;

// Fetch contract for IoC, allowing direct use (e.g., this.fetch())
export type Fetcher = (url: string, options: RequestInit) => Promise<Response>;

export type ToolsMessage = any;

export interface ContentWithTools {
    content: string,
    tools: ToolsMessage
};
