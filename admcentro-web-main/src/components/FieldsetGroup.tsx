import React from 'react'

const FieldsetGroup = ({ children, className }: any) => {
  return (
    <div className={`fieldset-groug-2 overflow-hidden flex flex-col sm:flex-row gap-2 sm:gap-8 items-start justify-between ${className} `}>
      {children}
    </div>
  )
}

export default FieldsetGroup