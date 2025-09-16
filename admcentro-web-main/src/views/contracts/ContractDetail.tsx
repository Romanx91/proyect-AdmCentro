import React from 'react'
import { useParams } from 'react-router-dom'
import { useContractDetail } from '../../hooks/useContractDetail'

const ContractDetail = () => {
	const params = useParams()
	const { data, isLoading, error, isError } = useContractDetail(Number(params.id))

	return <div className='text-white'>{JSON.stringify(data?.data, null, 4)}</div>
}

export default ContractDetail
