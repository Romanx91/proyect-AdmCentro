import { useQuery } from '@tanstack/react-query';
import http from '../api/axios';
import { IpropertyResponse } from '../interfaces/Iproperties';

const GetAllProperty = async (filter?: string) => {
  let path = filter?.length! > 0 ? `/properties?${filter}` : '/properties';
  const { data } = await http.get<IpropertyResponse>(path);
  return data;
};

export const useProperties = (filter?: string) => {
  const propertyQuery = useQuery({
    queryKey: ['properties', { filter }],
    queryFn: () => GetAllProperty(filter),
  });

  return propertyQuery;
};
