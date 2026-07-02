import type { Instrumentation } from 'next';

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const { getBetterStackInstance } = await import('@infrastructure/clients/logging/better-stack/client');

  getBetterStackInstance().logError('Unhandled request error', error, {
    path: request.path,
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    renderSource: context.renderSource,
    revalidateReason: context.revalidateReason,
  });
};
