import { useQuery } from '@tanstack/react-query'
import http from '../api/axios'
import { IVisitsResponse } from '../interfaces/IvisitsResponse'

const GetAllZones = async () => await http.get<IVisitsResponse>('/visits?sort=date:desc').then((res) => res.data)


export const useVisits = () => {
	const visitsQuery = useQuery({
		queryKey: ['visits'],
		queryFn: GetAllZones,
	})

	return visitsQuery
}
