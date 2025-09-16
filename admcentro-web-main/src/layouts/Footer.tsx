import { Image } from 'primereact/image'
import { BsFillMoonFill, BsSun } from 'react-icons/bs'

const Footer = ({ logoApp, darkTheme, handleToggleTheme }: { logoApp: string, darkTheme: boolean, handleToggleTheme: () => void }) => {
    return (
        <footer className='mt-auto bg-gray-100  bg-gradient-to-r from-slate-900 to-brand dark:from1-slate-600 dark:to1-slate-700  dark:bg-[#061122]  p-2 '>
            <div className='container m-auto'>
                <section className='py-6'>
                    <div className='px-4 mx-auto sm:px-6 lg:px-8 max-w-7xl'>
                        <div className=''>
                            <div className='flex flex-col gap-6 sm:gap-0 sm:flex-row  items-center justify-center sm:justify-between '>
                                <Image className='w-24' src={logoApp} alt='LOGO ADMINISTRACION CENTRO' />
                                {/* <span className='dark:text-white text-slate-800 font-bold text-2xl sm:3xl'>TEST MODE!</span> */}
                                <button
                                    className='btn-toggle-theme1 btn gradient !p-0 !rounded-full !w-[35px] !h-[35px] !mr-4'
                                    onClick={handleToggleTheme}
                                    title='Claro/Oscuro'
                                >
                                    {darkTheme ? (<BsFillMoonFill color='white' size={25} />) : (<BsSun size={25} color='white' />)}
                                </button>
                                <p className='mt-5 text-base sm:text-lg text-white  sm:mt-0'>© Copyright 2021 Centro Administracion</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </footer>
    )
}

export default Footer