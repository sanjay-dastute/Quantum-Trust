import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('quantum_encryption_requests_total')
    public readonly encryptionRequestsCounter: Counter<string>,
    @InjectMetric('quantum_key_rotations_total')
    public readonly keyRotationsCounter: Counter<string>,
    @InjectMetric('quantum_breach_events_total')
    public readonly breachEventsCounter: Counter<string>,
    @InjectMetric('quantum_api_latency_histogram')
    public readonly apiLatencyHistogram: Histogram<string>,
  ) {}

  incrementEncryptionRequest() {
    this.encryptionRequestsCounter.inc();
  }

  incrementKeyRotation() {
    this.keyRotationsCounter.inc();
  }

  incrementBreachEvent() {
    this.breachEventsCounter.inc();
  }

  recordApiLatency(method: string, route: string, status: number, timeMs: number) {
    this.apiLatencyHistogram.observe(
      { method, route, status: status.toString() },
      timeMs
    );
  }
}
