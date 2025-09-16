import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/authContext';

const PrivateRoute = ({ children }: any) => {
  const { authState } = useContext(AuthContext);

  return !!authState.token ? children : <Navigate to='/sign-in' />;
};
export default PrivateRoute;
