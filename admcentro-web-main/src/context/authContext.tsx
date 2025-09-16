import React from 'react'
import { createContext, useEffect, useReducer } from 'react'
import Loading from '../components/Loading'
import { authReducer } from '../reducer/authReducer'
import jwt_decode from 'jwt-decode'
import http from '../api/axios'
import FullLoading from '../components/FullLoading'

export interface Iuser {
  fullName: string
  email: string
  id: number
  photo: string
}
export interface Ialert {
  title: string
  message: string
  show: boolean
  color?: string
}
export interface AuthState {
  checking: Boolean
  token: string | null
  user: Iuser | null
  alert: Ialert | null
  theme: string,
  message: string | null,
}

export const initialState = {
  checking: true,
  token: '',
  user: null,
  alert: null,
  theme: localStorage.theme || 'light',
  message: null,

}
export interface AuthContextProps {
  authState: AuthState
  signIn: (data: any) => void
  signOut: () => void
  hideAlert: () => void
  showAlert: (data: Ialert) => void
  toggleTheme: (t: string) => void
  message: string | null
}

export const AuthContext = createContext({} as AuthContextProps)

export const AuthProvider = ({ children }: any) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    const token = localStorage.getItem(import.meta.env.VITE_HASH_USER_LOCAL_HOST) || null
    if (token) {
      http.post('/auth/check-token', { token }).then((res) => {
        if (res.data.ok) {
          signIn({ token: res.data.token })
        } else {
          dispatch({ type: 'setMessage', payload: 'algo salió mal ! por favor inicia sesión de nuevo' })
          signOut()
        }
      }).catch((err) => {
        dispatch({ type: 'setMessage', payload: err.response.data.message })
        signOut()
      })
    } else {
      dispatch({ type: 'signOut' })
    }
    return () => { }
  }, [])

  const signIn = (data: any) => {
    localStorage.setItem(import.meta.env.VITE_HASH_USER_LOCAL_HOST, data.token)
    http.defaults.headers.Authorization = `Bearer ${data.token}`
    try {
      var decoded = jwt_decode(data.token)
      dispatch({
        type: 'signIn',
        payload: {
          token: data.token,
          user: decoded,
        },
      })
      dispatch({ type: 'removeMessage' })
    } catch (error) { }
  }

  const signOut = () => {
    http.defaults.headers.Authorization = ''
    dispatch({ type: 'signOut' })
    localStorage.removeItem(import.meta.env.VITE_HASH_USER_LOCAL_HOST)
  }
  const showAlert = (data: Ialert) => dispatch({ type: 'showAlert', payload: data })
  const hideAlert = () => dispatch({ type: 'hideAlert' })
  const toggleTheme = (t: string) => dispatch({ type: 'toggleTheme', payload: t })

  if (state.checking) return <FullLoading />



  return (
    <AuthContext.Provider
      value={{
        authState: state,
        signIn,
        signOut,
        showAlert,
        hideAlert,
        toggleTheme,
        message: state.message,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
