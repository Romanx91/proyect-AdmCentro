import { useQuery } from '@tanstack/react-query'
import http from '../api/axios'
import { IClienyPaymentsResponse } from '../interfaces/IclientPayments'

const GetAllPaymentOwners = async () => {
	const { data } = await http.get<IClienyPaymentsResponse>('/payment-owners?sort=id:desc')
	return data
}

export const useOwnerPayments = () => {
	const ownerPaymentQuery = useQuery({
		queryKey: ['payment-owners'],
		queryFn: GetAllPaymentOwners,
	})

	return ownerPaymentQuery
}
