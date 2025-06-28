import { cleanupExpiredReservations } from '../services/deliveryService';

interface QueueJob {
  id: string;
  type: 'notification' | 'cleanup';
  data: any;
  createdAt: Date;
}

class SimpleMessageQueue {
  private jobs: QueueJob[] = [];
  private processing = false;
  private timer?: NodeJS.Timeout;

  // Add job to queue
  enqueue(type: 'notification' | 'cleanup', data: any): string {
    const job: QueueJob = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      createdAt: new Date()
    };
    
    this.jobs.push(job);
    console.log(`[Queue] Added ${type} job: ${job.id}`);
    return job.id;
  }

  // Start background processing
  start(): void {
    if (this.timer) return;
    
    console.log('[Queue] Starting background processing');
    this.timer = setInterval(() => {
      this.processJobs();
    }, 2000); // Process every 2 seconds
  }

  // Stop processing
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
      console.log('[Queue] Stopped processing');
    }
  }

  // Get queue stats
  getStats() {
    return {
      pending: this.jobs.length,
      processing: this.processing
    };
  }

  // Process jobs in background
  private async processJobs(): Promise<void> {
    if (this.processing || this.jobs.length === 0) return;
    
    this.processing = true;
    
    try {
      const job = this.jobs.shift();
      if (!job) return;

      console.log(`[Queue] Processing ${job.type} job: ${job.id}`);
      
      if (job.type === 'notification') {
        await this.sendFakeSMS(job.data);
      } else if (job.type === 'cleanup') {
        await this.cleanupExpiredReservations();
      }
      
      console.log(`[Queue] Completed job: ${job.id}`);
    } catch (error) {
      console.error('[Queue] Job failed:', error);
    } finally {
      this.processing = false;
    }
  }

  // Fake SMS sending
  private async sendFakeSMS(data: any): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    const message = `Your package (Order #${data.orderId}) has been delivered to ${data.boxCode}. Use PIN ${data.pickupPin} to collect it.`;
    
    console.log(`[SMS] Sending to customer ${data.customerId}:`);
    console.log(`[SMS] ${message}`);
  }

  //  Cleanup expired reservations
  private async cleanupExpiredReservations(): Promise<void> {
    console.log('[Cleanup] Checking for expired reservations...');
    
    try {
      const cleanedCount = await cleanupExpiredReservations();
      console.log(`[Cleanup] Cleaned up ${cleanedCount} expired reservations`);
    } catch (error) {
      console.error('[Cleanup] Error during cleanup:', error);
      throw error;
    }
  }
}

export const messageQueue = new SimpleMessageQueue(); 