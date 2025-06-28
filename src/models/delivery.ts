export interface Delivery {
    id: number;
    reservationId: number | null;
    orderId: number;
    deliveredAt: Date;
    pickedUpAt: Date | null;
}
