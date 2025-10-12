export interface ChargeService {
  retrieveCharge(chargeId: string): Promise<{
    success: boolean;
    data?: {
      id: string;
      receiptUrl: string | null;
      paymentMethodType: string | null;
    };
    error?: string;
  }>;
}
