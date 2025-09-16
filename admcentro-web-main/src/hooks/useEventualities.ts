import { useQuery } from '@tanstack/react-query';
import http from '../api/axios';
import { IEventualitiesResponse } from '../interfaces/Ieventualities';

const GetAllEventualities = async () => await http.get<IEventualitiesResponse>('/eventualities').then((res) => res.data)



export const useEventualities = () => {
  const eventQuery = useQuery({
    queryKey: ['eventualities'],
    queryFn: GetAllEventualities,
  });

  return eventQuery;
};
