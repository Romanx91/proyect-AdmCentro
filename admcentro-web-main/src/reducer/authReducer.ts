import { AuthState, Ialert } from '../context/authContext';

type types =
  | { type: 'signIn'; payload: any }
  | { type: 'finishChecking' }
  | { type: 'hideAlert' }
  | { type: 'setfavouriteIcon'; payload: {} }
  | { type: 'showAlert'; payload: Ialert }
  | { type: 'signOut' }
  | { type: 'toggleTheme'; payload: string }
  | { type: 'setMessage'; payload: string }
  | { type: 'removeMessage'; }

export const authReducer = (state: AuthState, action: types): AuthState => {
  switch (action.type) {
    case 'signIn':
      return {
        ...state,
        token: action?.payload?.token,
        user: action.payload?.user,
        checking: false,
      };
    case 'signOut':
      return {
        ...state,
        token: null,
        user: null,
        checking: false,
      };
    case 'finishChecking':
      return {
        ...state,
        checking: false,
      };
    case 'showAlert':
      return {
        ...state,
        alert: action.payload,
      };
    case 'hideAlert':
      return {
        ...state,
        alert: null,
      };
    case 'setMessage':
      return {
        ...state,
        message: action.payload,
      };
    case 'removeMessage':
      return {
        ...state,
        message: null,
      };
    case 'toggleTheme':
      return {
        ...state,
        theme: action.payload,
      };
    default:
      return state;
  }
};
