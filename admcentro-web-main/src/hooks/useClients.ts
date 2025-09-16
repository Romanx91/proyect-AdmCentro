import { useQuery } from '@tanstack/react-query';
import http from '../api/axios';
import { IownersResponse } from '../interfaces/Iowners';

const getAllClients = async () => await http.get<IownersResponse>('/clients').then((res) => res.data)


export const useClients = () => {
  const clientQuery = useQuery({
    queryKey: ['clients'],
    queryFn: getAllClients,
    refetchOnWindowFocus: false,
  });

  return clientQuery;
};
