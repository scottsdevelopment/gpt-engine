# GptEngine Framework

GptEngine is a **modular and extensible AI framework** built to manage context, models, and tools, facilitating seamless interactions with GPT-based systems and other AI models. Its design emphasizes **session management, tool orchestration, and scalable context-driven workflows**, while ensuring easy integration with external APIs and services.

## Key Features

- **Context-Aware Sessions:**  
  Manage user-controlled sessions with persistent context, enabling **short-term and long-term memory** across interactions.

- **Tool Integration and Orchestration:**  
  Dynamically invoke **tool controllers** and APIs based on user input, with a structured approach to handling model-based decisions.  

- **Modular Architecture:**  
  Easily extend the framework by adding **new providers, tools, or services**, or integrating custom models through the `Provider` interface.

- **Session Control via IoC (Inversion of Control):**  
  Use IoC to manage **dependencies and providers**, ensuring scalable and maintainable development for AI-based applications.

- **TypeORM Integration:**  
  Build **entity-based summaries** directly from database objects, with TypeORM providing built-in **persistence** for session states and contextual data.

- **Structured Prompt Management:**  
  Generate dynamic, **type-safe prompts** using structured classes and schema-driven execution, supporting retries and error handling.

- **Error Management and Reliability:**  
  The framework includes **retry logic, caching mechanisms, and graceful fallback strategies** to ensure reliable interactions, even under complex scenarios.

## Architecture Overview

GptEngine provides a **flexible architecture** designed around sessions, providers, and tools:

- **Providers:** Each provider implements **`text()`** and **`image()`** methods to interact with models, ensuring modularity. 
- **Sessions:** Manage sequences of interactions, appending responses dynamically to maintain conversational context.
- **Controllers and Tools:** Orchestrate logic and external service calls, utilizing events to manage GPT tooling.
## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/gpt-engine.git
   cd gpt-engine
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Example Usage

```typescript
const gpt = new GptEngine();
gpt.registerProvider(new LocalhostProvider()); // Register a provider

// Create a session and use the engine to generate a text response.
const session = gpt.createSession();
const response = session.text('Generate a summary of recent events.');

console.log(response); // Outputs the GPT-generated text
```

### Adding a Custom Provider

Create a new provider by implementing the `Provider` interface:

```typescript
class CustomProvider implements Provider {
  constructor(private console: Console, private fetcher: Fetch) {}

  text(input: string) {
    this.console.log('Generating text...');
    return `Echo: ${input}`;
  }

  image(prompt: string) {
    this.console.log('Generating image...');
    return `<image: ${prompt}>`;
  }
}
```

### Register the Custom Provider

```typescript
gpt.registerProvider(new CustomProvider(console, fetch));
```

## Core Concepts

1. **Providers:**  
   Providers expose **`text()` and `image()`** methods, managing the interaction with models or APIs. They can be used to integrate with **local or cloud-hosted models**.

2. **Sessions:**  
   Sessions allow for **context-driven conversations** by chaining prompts and responses, and provide built-in mechanisms to manage memory across multiple interactions.

3. **Inversion of Control (IoC):**  
   IoC ensures **dependencies are decoupled**, providing a clean and flexible codebase. Providers, loggers, and fetchers can be injected, making the system scalable.

4. **Error Handling:**  
   The framework gracefully handles **failures** by retrying requests and providing **fallback strategies** to avoid disruption.

5. **TypeORM Support:**  
   Context data, such as conversation summaries, can be persisted with **TypeORM**, enabling deep integration with databases.

## Extending GptEngine

You can extend the framework by:

- **Adding new providers:** Integrate **custom models or external APIs** by implementing the `Provider` interface.
- **Creating controllers:** Develop **custom tools** to handle specific workflows.
- **Enhancing prompts:** Use structured prompt templates to **generate more meaningful responses** based on your use case.

## Conclusion

GptEngine provides a **scalable and modular solution** for managing AI-powered interactions with GPT models. It is ideal for developers who need **context-rich applications** with dynamic prompting and seamless API integrations. Whether you’re building a chatbot, streaming bot, or a more complex workflow, GptEngine offers the **flexibility** and **reliability** needed for your AI-driven projects.
