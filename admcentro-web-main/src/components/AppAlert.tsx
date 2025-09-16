import React, { useEffect, useRef } from 'react'
import { Toast } from 'primereact/toast';
import CheckIcon from './icons/CheckIcon';


const AppAlert = ({ message, type = 'green', }: { message: string, type?: string }) => {

  const toast = useRef<Toast>(null);
  useEffect(() => {
    toast.current?.show({
      // severity: 'info',
      sticky: true,
      style: { width: 270, },
      closable: false,
      contentStyle: { backgroundColor: 'white', margin: 0, padding: 0, borderRadius: '0.25rem', overflow: 'hidden' },
      className: '',
      content: (
        <div className={`!mx-0 w-full !h-full border-0 gap-x-2 py-4  bg-white !border-l-[5px] !border-${type}-500 flex px-3  items-center`}>
          <div className="alert-icon">
            <CheckIcon color={type} />
          </div>
          <div className="alert-message- flex flex-col">
            <span className='text-sm relative  text-gray-400'>{message}</span>
          </div>
        </div>
      )
    });

    return () => {

    }
  }, [])

  return (
    <Toast ref={toast} position="bottom-right" />
  )
}

export default AppAlert