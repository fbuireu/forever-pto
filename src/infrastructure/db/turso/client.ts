import { createClient, type Client, type InValue } from '@libsql/client';

export interface QueryResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TursoConfig {
  url: string;
  authToken: string;
}

export class TursoClient {
  private client: Client | null = null;
  private readonly config: TursoConfig;

  constructor(config: TursoConfig) {
    this.config = config;
  }

  private getClient(): Client {
    if (!this.client) {
      this.client = createClient({
        url: this.config.url,
        authToken: this.config.authToken,
      });
    }
    return this.client;
  }

  async execute<T = unknown>(sql: string, args?: InValue[]): Promise<QueryResult<T>> {
    try {
      const client = this.getClient();
      const result = await client.execute({ sql, args });

      return {
        success: true,
        data: result.rows as T,
      };
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  async batch<T = unknown>(statements: Array<{ sql: string; args?: InValue[] }>): Promise<QueryResult<T[]>> {
    try {
      const client = this.getClient();
      const results = await client.batch(statements);

      return {
        success: true,
        data: results.map((r) => r.rows) as T[],
      };
    } catch (error) {
      return this.handleError<T[]>(error);
    }
  }

  async transaction<T = unknown>(callback: (tx: Client) => Promise<T>): Promise<QueryResult<T>> {
    try {
      const client = this.getClient();
      const result = await callback(client);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  private handleError<T>(error: unknown): QueryResult<T> {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: 'An unexpected database error occurred. Please try again.',
    };
  }

  async close(): Promise<void> {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
  }

  isConnected(): boolean {
    return this.client !== null;
  }
}

let tursoClientInstance: TursoClient | null = null;

export const getTursoClient = (): TursoClient => {
  if (!tursoClientInstance) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
      throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be defined');
    }

    tursoClientInstance = new TursoClient({ url, authToken });
  }
  return tursoClientInstance;
};
