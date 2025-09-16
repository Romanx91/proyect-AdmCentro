import { useQuery } from '@tanstack/react-query';
import http from '../api/axios';
import { IzonesResponse } from '../interfaces/Izones';

const GetAllZones = async () => await http.get<IzonesResponse>('/zones?sort=name').then((res) => res.data)

export const useZones = () => {
  const zonesQuery = useQuery({
    queryKey: ['zones'],
    queryFn: GetAllZones,
  });

  return zonesQuery;
};
