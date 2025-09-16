import React from 'react'
import { BsFillPatchCheckFill, BsCheckCircle, BsFillCheckCircleFill } from 'react-icons/bs'

const CheckIcon = ({ color = 'green', size = 25 }: { size?: number, color?: string }) => {
  return (
    <BsFillCheckCircleFill color={color} size={size} />
  )
}

export default CheckIcon