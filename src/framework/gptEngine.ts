import { Fetcher, Provider, ProviderConstructor } from "./interfaces";
import { Session } from "./session";

export class GptEngine {
  private providers: Provider[];
  private sessions: Map<string, Session>;

  constructor({ console, fetch, providers, sessions }: { console: Console, fetch: Fetcher, providers: ProviderConstructor[]; sessions?: Map<string, Session> }) {
    this.providers = providers.map(provider => new provider(console, fetch));
    this.sessions = sessions || new Map();
  }

  // Method to create a new session and return a function with session bound
  createSession() {
    const session = new Session(this.getProvider());
    const sessionId = Date.now().toString(); // Generate a unique session ID
    this.sessions.set(sessionId, session);

    return session.getExecutor();
  }

  // Method to get the default provider or throw an error if none are registered
  private getProvider(): Provider {
    if (this.providers.length === 0) {
      throw new Error("No providers registered.");
    }
    return this.providers[0]; // Returns the first registered provider
  }
}
