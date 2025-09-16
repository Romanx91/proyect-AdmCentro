import { Outlet } from 'react-router-dom'
import { AuthContext } from './context/authContext'
import { useContext, useState } from 'react'
import CheckIcon from './components/icons/CheckIcon'
import CloseIcon from './components/icons/CloseIcon'
import logoApp from './assets/images/logo.png'
import Footer from './layouts/Footer'
import Navbar from './layouts/Navbar'


export const ShowModal = ({ title, message, color = 'green' }: { title: string; message: string; color?: string }) => {
	let gradient = 'bg-gradient-error'
	switch (color) {
		case 'red':
			gradient = 'bg-gradient-error'
			break
		case 'green':
			gradient = 'bg-gradient-success'
			break
		case 'blue':
			gradient = 'bg-gradient-info'
			break

		default:
			gradient = 'bg-gradient-info'
			break
	}
	return (
		<div
			style={{ zIndex: 1010 }}
			className={`alert-app ${gradient} sign-success  fixed w-full sm:w-[400px] bottom-0 right-0 sm:bottom-10  sm:right-6 flex items-center gap-x-4 dark:text-white from-white   shadow-xl p-4 rounded-none sm:rounded-lg transition-all duration-300 ease-in-out `}
		>
			<CheckIcon color={color} />
			<div className='sign-description'>
				{/* <h4 className='text-lg text-slate-600 font-bold  '>{title}</h4> */}
				<span className='text-sm text-gray-500 relative '>{message}</span>
			</div>
			<button
				className='absolute top-1 right-1'
				onClick={() => {
					document.querySelector('.alert-app')?.classList.add('hidden')
				}}
			>
				<CloseIcon color='#4a5f7a' size={25} />
			</button>
		</div>
	)
}

const App = () => {
	const { authState, toggleTheme } = useContext(AuthContext)
	const [darkTheme, setDarkTheme] = useState(localStorage.theme === 'dark')

	const handleToggleTheme = () => {
		if (localStorage.theme === 'dark') {
			localStorage.theme = 'light'
			document.documentElement.classList.remove('dark')
			toggleTheme('light')
			setDarkTheme(false)
		} else {
			localStorage.theme = 'dark'
			toggleTheme('dark')
			setDarkTheme(true)
			document.documentElement.classList.add('dark')
		}
	}

	return (
		<div className='App min-h-screen flex flex-col  dark:bg-gray-900 '>

			<Navbar logoApp={logoApp} darkTheme={darkTheme} handleToggleTheme={handleToggleTheme} />

			<main className='my-6  sm:grid  items-center justify-center mx-3'>
				<Outlet />
			</main>

			<Footer logoApp={logoApp} darkTheme={darkTheme} handleToggleTheme={handleToggleTheme} />

			{authState.alert?.show && (
				<ShowModal title={authState.alert?.title!} message={authState.alert?.message!} color={authState.alert?.color} />
			)}
		</div>
	)
}

export default App
