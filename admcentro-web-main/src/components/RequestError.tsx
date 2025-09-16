import axios from 'axios'

const RequestError = ({ error }: { error: any }) => {
  return (
    <div className="request-error text-center text-red-400 font-semibold mx-3">{axios.isAxiosError(error) && error.response?.data.message || 'Algo malo paso !'}</div>
  )
}

export default RequestError