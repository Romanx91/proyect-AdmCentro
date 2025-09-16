import React from 'react'

const BoxContainerPage = ({ children, className = '' }: { children: any, className?: string }) => {
    return (
        <div className={`container !m-auto  flex sm:mx-0 md:max-w-[95%]  flex-col justify-center sm:justify-center  ${className} `}>
            {children}
        </div>
    )
}

export default BoxContainerPage