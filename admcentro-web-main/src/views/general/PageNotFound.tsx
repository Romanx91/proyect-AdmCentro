import { Link } from 'react-router-dom'
import Box from '../../components/Box'

const PageNotFound = () => {
	return (
		<Box className='w-10/12 !m-auto !bg-transparent !border-none shadow-none mt-12 flex items-center justify-center'>
			<div className=' text-center pt-8'>
				<h1 className='text-5xl sm:text-9xl font-bold text-purple-400'>404</h1>
				<h1 className='text2xl sm:text-6xl font-medium py-8'>¡Ups! Página no encontrada</h1>
				<p className='text-lg sm:text-2xl pb-8 px-4 sm:px-12 font-medium'>
					¡Ups! La página que buscas no existe. Es posible que se haya movido o eliminado.{' '}
				</p>
				<Link
					to='/'
					className='bg-gradient-to-r from-purple-400 to-blue-500 hover:from-pink-500 hover:to-orange-500 text-white font-semibold px-6 py-3 rounded-md mr-6'
				>
					Ir al Inicio
				</Link>
			</div >
		</Box>
	)
}

export default PageNotFound
