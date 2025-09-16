import { useQuery } from '@tanstack/react-query'
import http from '../api/axios'
import { IClaimsResponse } from '../interfaces/Iclaims'

const GetAllClaims = async () => await http.get<IClaimsResponse>('/claims').then((res) => res.data)


export const useClaims = () => {
	const claimQuery = useQuery({
		queryKey: ['claims'],
		queryFn: GetAllClaims,
	})

	return claimQuery
}
