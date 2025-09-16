import { useQuery } from '@tanstack/react-query'
import http from '../api/axios'
import { IClientExpensesResponse } from '../interfaces/clientExpenses'

const GetAllClientExpenses = async () => await http.get<IClientExpensesResponse>('/client-expenses?sort=ContractId').then((res) => res.data)


export const useClientExpenses = () => {
	const clientExpense = useQuery({
		queryKey: ['client-expenses'],
		queryFn: GetAllClientExpenses,
	})

	return clientExpense
}
