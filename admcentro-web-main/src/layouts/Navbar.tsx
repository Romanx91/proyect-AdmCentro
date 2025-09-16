import { useContext } from 'react'
import LoggedUser from '../components/LoggedUser'
import { Link, NavLink } from 'react-router-dom'
import { DobleChevronAngle } from '../components/icons/DobleChevronAngle'
import { menuItems } from '../helpers/general'
import { AuthContext } from '../context/authContext'
import { Image } from 'primereact/image'

const Navbar = ({ logoApp, darkTheme, handleToggleTheme }: { logoApp: string, darkTheme: boolean, handleToggleTheme: () => void }) => {
    const { authState, signOut, toggleTheme, message } = useContext(AuthContext)

    return (
        <header className='header bg-white sticky z-20 top-0 dark:bg-gray-900 shadow border-b border-gray-200 dark:border-slate-700'>
            <nav className='flex justify-between px-4 items-center h-full'>
                <Link to='/' className='logo-app'>
                    {/* <span className='title-form text-2xl sm:3xl'>TEST MODE!</span> */}
                    <Image width='100' className='min-w-[100px] object-cover' src={logoApp} alt='LOGO ADMINISTRACION CENTRO' />
                </Link>
                <ul className='hidden lg:flex items-center gap-x-2 text-white '>
                    {menuItems.map((item, index) =>
                        item.to !== null ? (
                            <NavLink
                                to={item.to}
                                key={index}
                                className={({ isActive, isPending }) =>
                                    `relative items-center  justify-center flex  h-[70px] text-brand2 dark:text-slate-400  dark:hover:text-brand hover:text-brand group p-1 ${isActive ? 'underline !text-brand rounded-md   ' : isPending ? 'pending' : ''
                                    }`
                                }
                            >
                                {item.title}
                            </NavLink>
                        ) : (
                            <li
                                key={index}
                                className={`relative dark:text-slate-400  items-center  justify-center flex  h-[70px]  dark:hover:text-brand  text-brand2 hover:text-brand group p-1`}
                            >
                                {item.title}
                                <DobleChevronAngle />

                                <ul
                                    style={{ zIndex: 900000 }}
                                    className='absolute top-[70px]  p-3 w-[250px] hidden transition-colors duration-1000 group-hover:flex bg-white border dark:bg-slate-800 dark:border-slate-700  border-gray-100  flex-col gap-y-2 rounded-b-md shadow '
                                >
                                    {item.subLink.map((sub, index) => (
                                        <NavLink
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
                            </li>)
                    )}
                </ul>

                <LoggedUser
                    darkTheme={darkTheme}
                    handleToggleTheme={handleToggleTheme}
                    signOut={signOut}
                    authState={authState}
                />
            </nav>
        </header>
    )
}

export default Navbar