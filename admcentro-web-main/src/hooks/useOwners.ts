import { useQuery } from '@tanstack/react-query';
import http from '../api/axios';
import { IownersResponse } from '../interfaces/Iowners';

const GetallOwners = async () => await http.get<IownersResponse>('/owners').then((res) => res.data);

export const useOwners = () => {
  const ownerQuery = useQuery({
    queryKey: ['owners'],
    queryFn: GetallOwners,
    refetchOnWindowFocus: false,
  });

  return ownerQuery;
};
