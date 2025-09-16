import React from 'react';
import { FaRegUser } from 'react-icons/fa';

const DefaultAvatar = () => {
  return (
    <div className='relative w-8 h-8 bg-gradient-to-tr from-[#f16fa1]  to-[#8b55f5] overflow-hidden flex items-center shadow-lg justify-center bg-gradient text-white border border-gray-300 bg-gray-100 rounded-full'>
      <FaRegUser
        color='white'
        className='bg-gradient rounded-full text-white'
        size={23}
      />
    </div>
  );
};

export default DefaultAvatar;
