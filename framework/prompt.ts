import { convertJsonSchemaToGbnf } from "./convert";
import { JSONSchema4 } from 'json-schema';
import { generateAllTools } from "./tools";
import { RoleMessage } from "../framework/interfaces";
import { Session } from "../framework/session";
import { system } from "../framework/function";

// Define the options interface
export interface PromptOptions<TResponse> {
  prompt: RoleMessage[];
  model: string;
  schema?: object; // The schema can be any JSON schema object
  temperature?: number;
  topK?: number;
  maxTokens?: number,
  toolChoice?: "auto" | "required" | "none",
  tools?: any[],
  assertCallback?: (response: TResponse) => void; // The assertion callback specific to the response type
  maxRetry?: number; // Optional number of retries (default is 3)
  compileSchema?: boolean; // Optional flag to compile the schema into a simplified form (default is false)
}

export function groupRoleMessages(messages: RoleMessage[]): RoleMessage[] {
  if (messages.length === 0) return [];

  const groupedMessages: RoleMessage[] = [];
  let currentGroup: RoleMessage = messages[0]; // Start with the first message

  for (let i = 1; i < messages.length; i++) {
    const currentMessage = messages[i];

    // Check if the role matches the current group
    if (currentMessage.role === currentGroup.role) {
      // If it matches, concatenate the content
      currentGroup.content += `${currentMessage.content}`;
    } else {
      // Push the current group to the result and start a new group
      groupedMessages.push(currentGroup);
      currentGroup = { ...currentMessage }; // Start a new group with the current message
    }
  }

  // Push the final group
  groupedMessages.push(currentGroup);

  return groupedMessages;
}

// Helper function that returns a function to generate variations
export function prompt<TResponse>(options: Partial<PromptOptions<TResponse>> = {}) {
  const {
    prompt = [], // Default prompt is an empty array
    schema,
    assertCallback,
    model = 'gpt-4', // Default model is 'gpt-4'
    topK = 1, // Default topK is 1
    tools = [], // Default tools is an empty array
    maxTokens = 4096, // Default maxTokens is 5000
    temperature = 1, // Default temperature is 1
    toolChoice = 'auto', // Default tool choice is "auto"
    maxRetry = 3, // Default retry count is 3
    compileSchema = false // Default is to not compile the schema
  } = options; // This ensures that even if options is undefined, defaults are applied

  // Function to compile JSON schema to the simplified interface definition
  // Recursive function to compile JSON schema to the simplified interface definition
  const compileSchemaToDefinition = (schema: JSONSchema4 | JSONSchema4[]): string => {
    const simplifiedSchema: Record<string, string> = {};

    // Check if the schema is an array (for handling items)
    if (Array.isArray(schema)) {
      return schema.map((s) => compileSchemaToDefinition(s)).join(',');
    }

    // Handle properties in the object schema
    if (schema.properties) {
      for (const [key, value] of Object.entries(schema.properties)) {
        if (value.type === "array" && value.items) {
          // Recursively handle nested arrays and items
          const itemsType = Array.isArray(value.items)
            ? compileSchemaToDefinition(value.items)
            : (value.items as JSONSchema4).type;
          simplifiedSchema[key] = `${itemsType}[]`;
        } else {
          simplifiedSchema[key] = value.type as string;
        }
      }
    }

    return JSON.stringify(simplifiedSchema);
  };

  // Conditionally compile the schema based on the flag
  const schemaString = compileSchema && schema ? compileSchemaToDefinition(schema) : JSON.stringify(schema);

  if (compileSchema && schema) {
    prompt.push(system(`Output the next response to match the following json object that follows this schema:
${compileSchemaToDefinition(schema)}`));
  }

  // console.log(schemaString);

  return function (...context: RoleMessage[]) {
    // @ts-ignore
    return async function (session: Session = []): Promise<TResponse> {
      let attempts = 0;
      let variations: TResponse | undefined = undefined;

      // Try generating variations with retries
      do {
        try {
          let response = await session.text(([...context]), { max_tokens: maxTokens, top_k: topK, temperature, model, tool_choice: toolChoice, tools: tools.map(t => generateAllTools(t)).flat(), grammar: compileSchema ? undefined: schema ? convertJsonSchemaToGbnf(schema) : undefined });
          const last = response[response.length-1];
          try {
            variations = JSON.parse(last.content) as TResponse;
          }
          catch {
            variations = last?.content as TResponse;
          }

          // Pass the response to the assert callback for validation
          if (assertCallback) {
            assertCallback(variations as TResponse);
          }

          break; // Exit loop if successful and assertions pass
        } catch (t) {
          console.log(`Attempt ${attempts + 1} failed:`, t);
          attempts++;
        }
      } while (attempts < maxRetry);

      if (undefined === variations) {
      //  throw new Error("Variations undefined")
      }

      return variations;
    };
  }
}

