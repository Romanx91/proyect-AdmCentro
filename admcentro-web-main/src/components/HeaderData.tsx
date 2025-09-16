import React from 'react'
import { MdAdd } from 'react-icons/md'

const HeaderData = ({ text, action, showBtn = true }: { action?: any, text: string, showBtn?: boolean }) => {
    return (
        <div className='flex gap-x-4 mb-6 mx-2 sm:mx-0  items-center justify-between sm:justify-start'>
            <h3 className='font-bold  text-slate-700 dark:text-slate-500 text-3xl sm:text-4xl'>{text}</h3>
            {
                showBtn && (
                    <button
                        onClick={() => { action() }}
                        className='btn !w-10 !h-10 !p-0 gradient !rounded-full'
                    >
                        <MdAdd size={50} />
                    </button>
                )
            }

        </div>
    )
}

export default HeaderData