import React from 'react'
import CloseIcon from './icons/CloseIcon'

const CloseOnClick = ({ action }: { action: any }) => {
  return (
    <button
      onClick={action}
      type='button'
      className='absolute bg-white hover:opacity-75 dark:bg-slate-700 right-4 top-6 w-10 h-10 rounded-full shadow-lg flex items-center justify-center border border-gray-200 dark:border-slate-800'>
      <CloseIcon />
    </button>
  )
}

export default CloseOnClick