import { useContext } from "react"
import { useState } from "react"
import http from "./../../api/axios"
import { useForm } from "../../hooks/useForm"
import { AuthContext } from "../../context/authContext"
import Box from "../../components/Box"
import CustomInput from "../../components/CustomInput"
import FormError from "../../components/FormError"
import InlineDots from "../../components/loadings/Inlinedots"
import { validateForm } from "../../helpers/form"
import CreateModal from "../../components/CreateModal"
import FormActionBtns from "../../components/FormActionBtns"
import { validateMail } from "../../helpers/general"
import axios from "axios"

const SignIn = () => {

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<any>()
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [sendMailError, setsendMailError] = useState('')
  const { signIn, message } = useContext(AuthContext)
  const { values, handleInputChange, reset } = useForm({ email: "", password: "", })
  const [emailForgotPassword, setEmailForgotPassword] = useState('')
  const [successSendMail, setSuccessSendMail] = useState('')


  const handleSubmitLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const { error, ok } = validateForm({ ...values })
    setErrors(error)
    if (!ok) return false
    setLoading(true)
    try {
      const r = await http.post("/auth/signin", values)
      if (r.data.ok) {
        signIn(r.data)
        reset()
        setLoading(false)
      } else {
        setLoginError(r.data.message)
      }
    } catch (error: any) {
      if (error.response) {
        setLoginError(error.response.data.message)
        setTimeout(() => {
          setLoginError(null)
        }, 8000)
      }
    } finally {
      setLoading(false)
    }

  }

  const openForgotPasswordModal = () => {
    setIsOpen(true)
  }
  const closeForgetPasswordModal = () => {
    setIsOpen(false)
  }

  const handleSubmitPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!emailForgotPassword) return setErrors({ emailForgotPassword: true })
    if (!validateMail(emailForgotPassword)) return setErrors({ emailForgotPassword: true })
    setLoadingPassword(true)
    setsendMailError('')
    setSuccessSendMail('')
    try {
      const res = await http.post('/auth/forgot-password', { email: emailForgotPassword })
      if (res.data.ok) {
        setEmailForgotPassword('')
        setSuccessSendMail(res.data.message)
        setTimeout(() => {
          setSuccessSendMail('')
          closeForgetPasswordModal()
        }, 3000)
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setsendMailError(error.response.data.message || 'Error el mandar el mail')
      }
    } finally {
      setLoadingPassword(false)
    }


  }

  return (
    <div className="flex h-screen w-screen dark:bg-gray-900 items-center justify-center">
      <Box className=" w-full max-w-[420px] mx-3 sm:mx-0 sm:w-96 ">
        <form
          onSubmit={handleSubmitLogin}
          className="flex items-center justify-between flex-col "
        >

          <h3 className="title-form self-start mb-4 !text-xl sm:!text-3xl">Inicia sesión</h3>
          {
            message && (
              <div className="bg-red-100 border my-2 border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">{message}</strong>
              </div>
            )
          }
          {loginError && <FormError text={loginError} />}
          <CustomInput
            type="email"
            placeholder="example@gmail.com"
            onChange={(val) => handleInputChange(val, "email")}
            hasError={errors?.email}
            required
            label="Email"
            errorText="Email obligatorio y válido."
          />

          <CustomInput
            type="password"
            placeholder=".lk8Tx9W/"
            onChange={(val) => handleInputChange(val, "password")}
            required
            label="Contraseña"
            hasError={errors?.password}
            errorText="Contraseña obligatoria ."
          />


          <fieldset>
            <button disabled={loading} className="btn gradient" type="submit">
              {loading ? (
                <div className="flex items-center gap-4">
                  <span>Espere</span>
                  <InlineDots />
                </div>
              ) : (
                <span>Inicia sesión</span>
              )}
            </button>
          </fieldset>
        </form>
        <div className="register-section text-sx mt-4 text-center">
          <span className="text-sm">
            <button
              type="button"
              onClick={() => { openForgotPasswordModal() }}
              className="text-pink-700 dark:text-slate-500 ml-1 hover:underline dark:hover:text-brand2  p-1"
            >
              ¿Olvidaste tu contraseña ?
            </button>
          </span>
        </div>
      </Box>

      <CreateModal
        show={isOpen}
        closeModal={closeForgetPasswordModal}
        overlayClick={false}
        className='max-w-[400px] sm:w-[370px] w-[fit]'
        titleText={`Recuperar contraseña`}
      >
        <form
          onSubmit={handleSubmitPassword}
        >
          {sendMailError && (<FormError className="border border-dashed border-red-400 p-1.5 text-center text-sm mt-3" text={sendMailError} />)}
          {successSendMail && (<div className="border border-dashed border-green-400 p-1.5 text-center text-sm mt-3">
            <div>{successSendMail}</div>
            <span className="text-xs">Se ha enviado un correo con las instrucciones para cambiar la contraseña</span>
          </div>)}
          < CustomInput
            placeholder='example@gmail.test'
            initialValue={emailForgotPassword}
            disabled={loadingPassword}
            onChange={(value) => setEmailForgotPassword(value)}
            maxLength={100}
            type="email"
            label='Email'
            required
            hasError={errors?.emailForgotPassword}
            errorText='El mail es obligatorio y debe ser valido.'
          />
          <FormActionBtns savingOrUpdating={loadingPassword} onClose={closeForgetPasswordModal} btnSendText="Enviar" />
        </form>
      </CreateModal>
    </div>
  )
}

export default SignIn
