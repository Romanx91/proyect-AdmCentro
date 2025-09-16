import React from 'react'
import { AiOutlineUsergroupAdd, } from 'react-icons/ai'

const AddGuarantee = ({ action, color, size = 25, q }: { size?: number, color?: string, action?: any, q: number }) => {
  return (
    <span className='relative '>
      <AiOutlineUsergroupAdd title='Agregar Garante' className='cursor-pointer' color={color} size={size} onClick={action} />
      <span className='absolute -top-2 -right-2 z-10 w-4 h-4 rounded-full flex items-center justify-center text-center shadow  dark:bg-slate-800'>
        <span className=' text-xs'>{q}</span>
      </span>
    </span>
  )
}

export default AddGuarantee