import { useQuery } from '@tanstack/react-query'
import http from '../api/axios'
import { IBudgetResponse } from '../interfaces/Ibudget'

const GetAllMailsNotice = async () => await http.get<any>('/notices/mails-jobs').then((res) => res.data)


export const useMailNotice = () => {
	const mailNotice = useQuery({
		queryKey: ['mails-notice'],
		queryFn: GetAllMailsNotice,
	})

	return mailNotice
}
