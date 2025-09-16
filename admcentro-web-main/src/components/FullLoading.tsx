import Loading from './Loading'

const FullLoading = () => {
    return (
        <div className='flex gap-y-3 flex-col items-center justify-center min-h-screen bg-[rgb(227 227 227)] dark:bg-gray-900 '>
            <div className="">
                <Loading />
                <h3 className='text-slate-400 mt-4'>Bienvenido de vuelta 😊 </h3>
            </div>
        </div>
    )
}

export default FullLoading