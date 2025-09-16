import { useQuery } from '@tanstack/react-query';
import http from '../api/axios';
import { IpaymentTypeResponse } from '../interfaces/IpaymentType';

const GetAllPaymentTypes = async () => await http.get<IpaymentTypeResponse>('/paymenttypes?sort=name').then((res) => res.data)

export const usePaymentTypes = () => {
  const paymentTypeQuery = useQuery({
    queryKey: ['paymenttypes'],
    queryFn: GetAllPaymentTypes,
  });

  return paymentTypeQuery;
};
