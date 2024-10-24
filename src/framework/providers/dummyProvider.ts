import { assistant } from "../function";
import { ContentWithTools, GenerateParams, Provider, RoleMessage } from "../interfaces";

// Example provider implementation
class DummyProvider implements Provider {


    constructor(console, fetch) {


    }

    async text(messages: RoleMessage[],
        params: GenerateParams): Promise<ContentWithTools> {
        return {   
            content: `Text generated for: ${prompt}`,
            tools: []
        }
    }

    async image(prompt: string): Promise<string> {
        return `Image generated for: ${prompt}`;
    }

    async tts(input: string): Promise<string> {
        return `Image generated for: ${prompt}`;
    }
}