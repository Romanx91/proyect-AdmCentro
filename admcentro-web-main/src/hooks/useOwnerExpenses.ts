import { useQuery } from '@tanstack/react-query'
import http from '../api/axios'
import { IClientExpensesResponse } from '../interfaces/clientExpenses'

const GetAllOwnerExpenses = async () => await http.get<IClientExpensesResponse>('/owner-expenses?sort=ContractId').then((res) => res.data)

export const useOwnerExpenses = () => {
	const ownerExpense = useQuery({
		queryKey: ['owner-expenses'],
		queryFn: GetAllOwnerExpenses,
	})

	return ownerExpense
}
