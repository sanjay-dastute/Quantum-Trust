import { Global, Module } from '@nestjs/common';
import { makeCounterProvider, makeHistogramProvider } from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';

@Global()
@Module({
  providers: [
    MetricsService,
    makeCounterProvider({
      name: 'quantum_encryption_requests_total',
      help: 'Total number of encryption or decryption jobs executed',
    }),
    makeCounterProvider({
      name: 'quantum_key_rotations_total',
      help: 'Total number of cryptographic key rotations performed',
    }),
    makeCounterProvider({
      name: 'quantum_breach_events_total',
      help: 'Total number of critical breach self-destruct events detected',
    }),
    makeHistogramProvider({
      name: 'quantum_api_latency_histogram',
      help: 'API latency distribution in milliseconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [50, 100, 250, 500, 1000, 2500, 5000],
    }),
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
