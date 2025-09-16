import { useQuery } from '@tanstack/react-query'
import http from '../api/axios'
import { IClienyPaymentsResponse } from '../interfaces/IclientPayments'

const GetAllClientPayments = async () => {
	const { data } = await http.get<IClienyPaymentsResponse>('/payment-clients?sort=id:desc')
	return data
}

export const useClientPayments = () => {
	const clienyPaymentQuery = useQuery({
		queryKey: ['payment-clients'],
		queryFn: GetAllClientPayments,
	})

	return clienyPaymentQuery
}
