import { useQuery } from '@tanstack/react-query';
import http from '../api/axios';
import { IConfigResponse } from '../interfaces/Iconfig';

const GetAllConfig = async () => await http.get<IConfigResponse>('/config?sort=key').then((res) => res.data)

export const useConfig = () => {
  const configQuery = useQuery({
    queryKey: ['configs'],
    queryFn: GetAllConfig,
  });

  return configQuery;
};
