import { jsonrepair } from "jsonrepair";
import { assistant } from "./function";
import { Provider, RoleMessage, GenerateParams, GenerateImageParams, Tool } from "./interfaces";

// Session class to manage RoleMessage[] and append new messages to the chain
export class Session {
  private provider: Provider;
  private roleMessages: RoleMessage[] = [];

  constructor(provider: Provider) {
    this.provider = provider;
  }

  // Recursively execute functions, resolving nested function calls
  private async resolveFunction<T>(fn: (session?: Session) => Promise<T>): Promise<T> {
    let result = await fn(this);

    // Continue resolving if the result is a function
    while (typeof result === "function") {
      result = await (result as unknown as ((session?: Session) => Promise<T>))(this);
    }

    return result;
  }



  private async callWithMetadata(func, properties, argsObject: any) {

    // Reorder the arguments based on the expected parameter names from the tool's JSON
    const argsArray = Object.keys(properties).map(paramName => argsObject[paramName]);

    // Call the function with the reordered arguments
    return await func(argsArray);
  }

  /**
   * Session executor that processes functions, tool invocations, and prompt messages.
   * 
   * @template T The type of the result returned by each function.
   * @param fns A list of RoleMessages or functions to execute within the session.
   * @returns A promise that resolves to an array of results.
   */
  public getExecutor() {
    return async <Fns extends (RoleMessage | RoleMessage[] | ((session?: Session) => Promise<any>))[]>(
      ...fns: Fns
    ): Promise<{
      [K in keyof Fns]: Fns[K] extends (session?: Session) => Promise<infer R>
      ? R
      : Fns[K] extends RoleMessage[]
      ? RoleMessage[]
      : Fns[K] extends RoleMessage
      ? RoleMessage
      : never;
    }> => {
      const results: any[] = [];

      for (const fn of fns) {
        if (typeof fn === "function") {
          // If the item is a function, resolve it and push the result
          const resolvedFn = await this.resolveFunction(fn);
          results.push(resolvedFn);
        } else {
          // If the item is a RoleMessage or RoleMessage[], append it to the session
          const arr = Array.isArray(fn) ? fn : [fn];
          this.addPrompt(...arr);
          results.push(arr);
        }
      }

      return results as any;
    };
  }

  private parseToolCallString(input) {
    // Trim the input to remove leading and trailing whitespace
    const trimmedInput: string = input.trim();



    const functionCode = /<tool_call>|\n/g; // Function call:

    const functions = trimmedInput.split(functionCode);

    // Check if the trimmed input starts with the expected <tool_call> tag
    for (let i = 0; i < functions.length; i++) {
      // Extract the content inside the <tool_call> tags, accounting for optional whitespace
      const toolCallContent = functions[i].trim()//) //.replace(/\\n/g, '\\\\n')//.replace(/\\"/g, '\\\\"');
      // console.log(toolCallContent);
      if (toolCallContent) {
        try {
          // Parse the JSON array
          const parsedToolCall = JSON.parse(jsonrepair(toolCallContent));
          return parsedToolCall; // Return the parsed JSON
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      }
    }
    return null; // Return null if the input doesn't match or parsing fails
  }

  private quotifyJSONString(unquotedJson: string): string {
    const attributePattern = /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g;

    // Replace unquoted attribute names with quoted ones
    return unquotedJson.replace(attributePattern, '$1"$2"$3');
  }


  private processToolCalls(content: string, tools, funcs) {
    /*   if (!tools?.length) {
         tools = this.parseToolCallString(content);
       }
       let ret = [];
   
       for (let i = 0; i < tools?.length; i++) {
   
         // Check if the function exists and call it
   
         // this.console.log("function " + i)
   
         if (message?.tool_calls?.[i]?.function?.name) {
   
           try {
   
             const funcName = message.tool_calls[i].function.name;
   
             const toolFn = params.tools.find(t => t.function.name === funcName);
   
             //console.log(message?.tool_calls[0].function);
   
             let args;
   
             try {
   
               if (typeof message.tool_calls[i].function.arguments === "string") {
   
                 args = JSON.parse(jsonrepair(message.tool_calls[i].function.arguments));
   
               } else {
   
                 args = message.tool_calls[i].function.arguments
   
               }
   
             } catch {
   
               args = JSON.parse(quotifyJSONString(message.tool_calls[i].function.arguments));
   
             }
   
             finally {
   
               this.console.log(args);
   
             }
   
             if (toolFn) {
   
               // Call the function using the tool definition and the arguments
   
               ///console.log(toolFn, args);
   //     // Extract the function and expected parameter names from the tool
       const func = this.getProviderForTool(tool);
       const expectedParams = tool.function.parameters.properties;
   
               let res = await callWithMetadata(toolFn as Tool, args);
   
               if (!Array.isArray((res))) {
   
                 res = [res];
   
               }
   
               ret.push(...[tool({ name: funcName, args: JSON.stringify(args) }), ...res]);
   
             }
   
           } catch (e) {
   
             console.log(e);
   
           }
   
         }
   
       }
   
       if (ret.length > 0) {
   
         console.log(ret);
   
         return ret;
   
       }
   */
    return [assistant("Dummy"), assistant("World")]
  }

  /**
   * Append new messages to the session and generate a response using the provider's text method.
   * Uses the session executor to handle recursive function invocations.
   * 
   * @param messages An array of RoleMessages to add to the session's prompt chain.
   * @param params Optional parameters to pass to the provider's text generation method.
   * @returns A promise that resolves to the generated response or an array of resolved results.
   */
  async text(messages: RoleMessage[], params?: GenerateParams) {
    // Append the new messages to the session's prompt chain
    this.roleMessages.push(...messages);

    // Call the provider to generate a response based on the current session
    let { content, tools } = await this.provider.text(this.roleMessages, params);

    const funcs = params.tools;

    // Execute the response and any tools or prompts within the session context
    return [...this.processToolCalls(content, tools, funcs), assistant(content)];
  }

  // Append the new message to the RoleMessage[] and generate a response
  async image(prompt: string, params?: GenerateImageParams): Promise<string> {
    // Append the new messages to the session's prompt chain
    // this.roleMessages.push(...messages);

    // Call the provider to generate a response
    let response = await this.provider.image(prompt, params);

    // Append the assistant's response to the session as an assistant message
    //this.roleMessages.push(response);

    return response;
  }

  // Append the new message to the RoleMessage[] and generate a response
  async tts(input: string): Promise<string> {
    // Append the new messages to the session's prompt chain
    // this.roleMessages.push(...messages);

    // Call the provider to generate a response
    let response = await this.provider.tts(input);

    // Append the assistant's response to the session as an assistant message
    //this.roleMessages.push(response);

    return response;
  }


  clear(): void {
    this.roleMessages = [

    ]
  }

  // Get the current conversation chain (useful for debugging or tracking)
  addPrompt(...messages: RoleMessage[]): void {
    this.roleMessages.push(...messages);
  }

  // Get the current conversation chain (useful for debugging or tracking)
  getPromptChain(): RoleMessage[] {
    return this.roleMessages;
  }
}
