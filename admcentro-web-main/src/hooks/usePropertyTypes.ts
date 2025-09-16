import { useQuery } from '@tanstack/react-query';
import http from '../api/axios';
import { IpropertyResponse } from '../interfaces/IPropertyType';

const GetAllPropertyTypes = async () => await http.get<IpropertyResponse>('/propertytypes?sort=description').then((res) => res.data)

export const usePropertyTypes = () => {
  const propertyTypeQuery = useQuery({
    queryKey: ['property-types'],
    queryFn: GetAllPropertyTypes,
  });

  return propertyTypeQuery;
};
