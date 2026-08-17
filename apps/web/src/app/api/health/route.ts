import { noStore } from '@infrastructure/api/response';

export async function GET() {
  return noStore({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
