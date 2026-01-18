import { getBetterStackInstance } from '@infrastructure/clients/logging/better-stack/client';
import { createClient, type Client, type InArgs, type InValue } from '@tursodatabase/serverless/compat';

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
  private readonly config: TursoConfig;
  private logger = getBetterStackInstance();

  constructor(config: TursoConfig) {
    this.config = config;
  }

  private createClient(): Client {
    return createClient({
      url: this.config.url,
      authToken: this.config.authToken,
    });
  }

  async execute<T = unknown>(sql: string, args?: InArgs): Promise<QueryResult<T>> {
    try {
      const client = this.createClient();

      const isInsertPayments = sql.includes('INSERT') && sql.includes('payments');
      if (isInsertPayments) {
        const argsObj = args as Record<string, unknown> | undefined;
        this.logger.info('Turso execute INSERT payments', {
          sqlPreview: sql.slice(0, 150),
          argsType: Array.isArray(args) ? 'array' : typeof args,
          id: argsObj?.[':id'],
          idType: typeof argsObj?.[':id'],
          email: argsObj?.[':email'],
          argsKeys: argsObj ? Object.keys(argsObj).slice(0, 10) : null,
        });
      }

      const result = await client.execute({ sql, args });

      if (isInsertPayments) {
        this.logger.info('Turso INSERT payments success', {
          rowsAffected: result.rowsAffected,
        });
      }

      return {
        success: true,
        data: result.rows as T,
      };
    } catch (error) {
      this.logger.logError('Turso execute query failed', error, {
        sql: sql.slice(0, 200),
        hasArgs: !!args,
        argsType: Array.isArray(args) ? 'array' : typeof args,
        argsPreview: Array.isArray(args) ? args.slice(0, 3) : args,
      });
      return this.handleError<T>(error);
    }
  }

  async batch<T = unknown>(statements: Array<{ sql: string; args?: InValue[] }>): Promise<QueryResult<T[]>> {
    try {
      const client = this.createClient();
      const results = await client.batch(statements);

      return {
        success: true,
        data: results.map((r) => r.rows) as T[],
      };
    } catch (error) {
      this.logger.logError('Turso batch query failed', error, {
        statementCount: statements.length,
        firstSql: statements[0]?.sql.slice(0, 100),
      });
      return this.handleError<T[]>(error);
    }
  }

  async transaction<T = unknown>(callback: (tx: Client) => Promise<T>): Promise<QueryResult<T>> {
    try {
      const client = this.createClient();
      const result = await callback(client);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.logError('Turso transaction failed', error, {
        callbackName: callback.name || 'anonymous',
      });
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
}

let tursoClientInstance: TursoClient | null = null;

export const getTursoClientInstance = (): TursoClient => {
  if (tursoClientInstance) {
    return tursoClientInstance;
  }

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be defined');
  }

  tursoClientInstance = new TursoClient({ url, authToken });
  return tursoClientInstance;
};
