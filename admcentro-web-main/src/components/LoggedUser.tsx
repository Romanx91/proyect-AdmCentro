import React, { useRef, useState } from 'react'
import { AiOutlineLogout } from 'react-icons/ai'
import { NavLink } from 'react-router-dom'
import { AuthState } from '../context/authContext'
import DefaultAvatar from './DefaultAvatar'
import { menuItems } from '../helpers/general'
import { DobleChevronAngle } from './icons/DobleChevronAngle'
import { Image } from 'primereact/image'
import { useClickOutside } from 'primereact/hooks'

type Props = {
	authState: AuthState
	signOut: () => void
	handleToggleTheme: () => void
	darkTheme: boolean
}

const LoggedUser = ({ authState, signOut }: Props) => {
	const { user } = authState
	const [showMobileMenu, setShowMobileMenu] = useState(false)
	const overlayRef = useRef(null)

	useClickOutside(overlayRef, () => setShowMobileMenu(false))


	return (
		<>
			<div className='flex items-center justify-center text-left'>
				<div
					onClick={() => {
						// document.querySelector('.dropdown-user-logged-box')!.classList.toggle('hidden')
						setShowMobileMenu(!showMobileMenu)
					}}
				>
					<button
						type='button'
						className='flex justify-center bg-slate-200 dark:bg-slate-800 items-center w-full gap-[1px]  border-gray-200 dark:border-slate-700  px-2  py-1 text-sm font-medium text-slate-700 dark:text-slate-400 rounded-full transition-all  focus:outline-none'
						id='menu-button'
						aria-expanded='true'
						aria-haspopup='true'
					>
						{user?.photo ? (
							<Image
								src={user.photo}
								className='!w-8 !h-8 rounded-full overflow-hidden object-cover'
								alt={user?.fullName}
							/>
						) : <DefaultAvatar />}
						<span className='ml-1 username-logged'>{user?.fullName?.split(' ')[0]}</span>
						{/* <DownAngle /> */}
						<DobleChevronAngle />
					</button>
				</div>
				{
					showMobileMenu && (
						<div
							style={{ zIndex: 900000 }}
							className='dropdown-user-logged-box overflow-auto    transition-fade  shadow p-1 origin-top-right absolute right-0 mt-2 !w-full sm:!w-56   top-[60px]   bg-white dark:bg-slate-800'
							role='menu'
							aria-orientation='vertical'
							aria-labelledby='menu-button'
							tabIndex={-1}
							ref={overlayRef}
						>
							<div
								className='py-1 flex flex-col '
								role='none'
							>

								<ul className='flex lg:hidden items-start flex-col gap-y-2 !overflow-auto text-white'>
									{menuItems.map((item, index) =>
										item.to !== null ? (
											<NavLink
												to={item.to}
												onClick={() => setShowMobileMenu(false)}
												key={index}
												className={({ isActive, isPending }) =>
													`relative items-center  justify-center flex text-brand2 dark:text-slate-400  dark:hover:text-brand hover:text-brand group p-1 ${isActive ? 'underline !text-brand rounded-md   ' : isPending ? 'pending' : ''
													}`
												}
											>
												{item.title}
											</NavLink>
										) : (
											<li
												key={index}
												className={`relative dark:text-slate-400  group  flex flex-col   dark:hover:text-brand  text-brand2 hover:text-brand group p-1`}
											>
												<span className='flex items-center'>
													<span>{item.title}</span>
													{/* <DownAngle /> */}
													<DobleChevronAngle />
												</span>
												<ul
													style={{ zIndex: 900000 }}
													className='ml-2 group-hover:flex flex-col gap-y-2 mt-2 hidden'
												// className=' top-[60px] !left-0 p-3 w-fit hidden transition-colors duration-1000 group-hover:flex bg-white border dark:bg-slate-800 dark:border-slate-700  border-gray-100  flex-col gap-y-2 rounded-b-md shadow '
												>
													{item.subLink.map((sub, index) => (
														<NavLink
															onClick={() => setShowMobileMenu(false)}
															key={index}
															to={sub.to}
															className={({ isActive, isPending }) =>
																`text-brand2 dark:text-slate-400 hover:!text-brand ${isActive ? 'underline !text-brand ' : isPending ? 'pending' : ''
																}`
															}
														>
															{sub.title}
														</NavLink>
													))}
												</ul>
											</li>
										)
									)}
								</ul>

								{/* <div className='border-b border-gray-200 dark:border-slate-700 rounded-full my-1 w-full'></div> */}
								<button
									onClick={signOut}
									type='button'
									className='text-red-700 rounded-none flex items-center gap-1 w-full text-left px-2 py-2 text-sm hover:text-pink-600 dark:text-red-500'
									role='menuitem'
									tabIndex={-1}
									id='menu-item-3'
								>
									<AiOutlineLogout />
									<span>Cerrar sesión</span>
								</button>
							</div>
						</div>

					)
				}

			</div>
		</>
	)
}

export default LoggedUser
