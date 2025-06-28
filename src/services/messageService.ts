import { messageQueue } from '../infrastructure/simpleQueue';

// Send delivery notification
export const sendDeliveryNotification = async (
  orderId: number, 
  customerId: string, 
  boxCode: string, 
  pickupPin: string
): Promise<void> => {
  messageQueue.enqueue('notification', {
    orderId,
    customerId, 
    boxCode,
    pickupPin
  });
};

// Schedule cleanup
export const scheduleCleanup = async (): Promise<void> => {
  messageQueue.enqueue('cleanup', {});
};

// Get queue stats
export const getQueueStats = () => {
  return messageQueue.getStats();
};

 