import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';

type ApiEnvelope<T> = { data?: T } & Record<string, unknown>;

export const apiResponseInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    map((event) => {
      if (!(event instanceof HttpResponse)) {
        return event;
      }

      const body = event.body;
      if (!body || Array.isArray(body) || typeof body !== 'object') {
        return event;
      }

      if ('data' in (body as Record<string, unknown>)) {
        return event.clone({ body: (body as ApiEnvelope<unknown>).data ?? null });
      }

      return event;
    })
  );
