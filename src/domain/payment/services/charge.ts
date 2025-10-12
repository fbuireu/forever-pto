export interface ChargeService {
  retrieveCharge(chargeId: string): Promise<{
    success: boolean;
    data?: {
      id: string;
      receiptUrl: string | null;
      paymentMethodType: string | null;
      country: string | null;
      customerName: string | null;
      postalCode: string | null;
      city: string | null;
      state: string | null;
      paymentBrand: string | null;
      paymentLast4: string | null;
      feeAmount: number | null;
      netAmount: number | null;
    };
    error?: string;
  }>;
}
