import { useQuery } from '@tanstack/react-query'
import http from '../api/axios'
import { IcontractsResponse } from '../interfaces/Icontracts'

const GetAllContract = async (filter: string) => await http.get<IcontractsResponse>(`/contracts${filter.length > 0 ? filter : ''}`).then((res) => res.data)


export const useContracts = (filter: string = '') => {
	const cocontractQuery = useQuery({
		queryKey: ['contracts', { filter }],
		queryFn: () => GetAllContract(filter),
	})

	return cocontractQuery
}
