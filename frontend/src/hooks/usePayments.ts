import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '@/api/payments';

interface PaymentHistoryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  projectId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function usePaymentHistory(params?: PaymentHistoryParams) {
  return useQuery({
    queryKey: ['payments', 'history', params],
    queryFn: () => paymentsApi.listPaymentHistory(params),
  });
}

export function usePaymentForecast() {
  return useQuery({
    queryKey: ['payments', 'forecast'],
    queryFn: () => paymentsApi.getForecast(),
  });
}
