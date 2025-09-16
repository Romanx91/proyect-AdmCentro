import { useQuery } from '@tanstack/react-query';
import http from '../api/axios';
import { IAssuranceResponse } from '../interfaces/IAssurance';

const GetGuarantors = async () => await http.get<IAssuranceResponse>('/assurances').then((res) => res.data)



export const useGuarantors = () => {
  const guarantorQuery = useQuery({
    queryKey: ['guarantors'],
    queryFn: GetGuarantors,
  });

  return guarantorQuery;
};
