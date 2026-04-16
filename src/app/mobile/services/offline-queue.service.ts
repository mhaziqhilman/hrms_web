import { Injectable, inject, effect } from '@angular/core';
import { NativeService } from './native.service';

const QUEUE_KEY = 'offline_queue_v1';

export interface QueuedRequest {
  id: string;
  url: string;
  method: 'POST' | 'PATCH' | 'PUT';
  body: unknown;
  createdAt: number;
  attempts: number;
}

@Injectable({ providedIn: 'root' })
export class OfflineQueueService {
  private native = inject(NativeService);

  constructor() {
    effect(() => {
      if (this.native.online()) void this.flush();
    });
  }

  async enqueue(req: Omit<QueuedRequest, 'id' | 'createdAt' | 'attempts'>): Promise<void> {
    const queue = await this.read();
    queue.push({
      ...req,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      attempts: 0,
    });
    await this.write(queue);
  }

  async flush(): Promise<void> {
    const queue = await this.read();
    if (queue.length === 0) return;
    // NOTE: actual retry logic is wired in Phase 3 (attendance offline retry)
    // For now we just expose the queue so feature code can drive retries.
  }

  async peek(): Promise<QueuedRequest[]> {
    return this.read();
  }

  async remove(id: string): Promise<void> {
    const queue = (await this.read()).filter((r) => r.id !== id);
    await this.write(queue);
  }

  async clear(): Promise<void> {
    await this.native.removePref(QUEUE_KEY);
  }

  private async read(): Promise<QueuedRequest[]> {
    const raw = await this.native.getPref(QUEUE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as QueuedRequest[];
    } catch {
      return [];
    }
  }

  private async write(queue: QueuedRequest[]): Promise<void> {
    await this.native.setPref(QUEUE_KEY, JSON.stringify(queue));
  }
}
