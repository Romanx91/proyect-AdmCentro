import { useQuery } from '@tanstack/react-query'
import http from '../api/axios'
import { IContractDetailsResponse } from '../interfaces/IcontractDetails'

const GetAllContractDetails = async (id: number) => {
	const { data } = await http.get<IContractDetailsResponse>('/contracts/' + id)
	return data
}

export const useContractDetail = (id: number) => {
	const contractDetailQuery = useQuery({
		queryKey: ['contracts', id],
		queryFn: () => GetAllContractDetails(id),
	})

	return contractDetailQuery
}
