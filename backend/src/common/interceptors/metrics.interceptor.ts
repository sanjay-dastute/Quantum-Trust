import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../../metrics/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const route = req.route ? req.route.path : req.url;

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          const time = Date.now() - start;
          this.metricsService.recordApiLatency(method, route, res.statusCode, time);
        },
        error: (err) => {
          const time = Date.now() - start;
          const status = err.status || 500;
          this.metricsService.recordApiLatency(method, route, status, time);
        },
      }),
    );
  }
}
