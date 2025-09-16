import { useQuery } from '@tanstack/react-query'
import http from '../api/axios'
import { IBudgetResponse } from '../interfaces/Ibudget'

const GetAllBudgets = async () => await http.get<IBudgetResponse>('/budgets').then((res) => res.data)


export const useBudgets = () => {
	const budgetQuery = useQuery({
		queryKey: ['bdgets'],
		queryFn: GetAllBudgets,
	})

	return budgetQuery
}
