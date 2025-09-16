import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL
const http = axios.create({
	baseURL,
	headers: {
		'Content-type': 'application/json',
		Authorization: 'Bearer ' + localStorage.getItem(import.meta.env.VITE_HASH_USER_LOCAL_HOST) || '',
	},
})

export default http
