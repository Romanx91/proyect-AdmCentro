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
import axios from "axios"
import { useNavigate, useParams } from "react-router-dom"

const ResetPassword = () => {

    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<any>()
    const [resetPasswordError, setResetPasswordError] = useState<string | null>(null)
    const { signIn, message } = useContext(AuthContext)
    const { values, handleInputChange, reset } = useForm({ passwordConfirm: "", password: "", })
    const params = useParams<{ token: string }>()
    const navigate = useNavigate()

    const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const { error, ok } = validateForm({ ...values })
        setErrors(error)
        if (!ok || values.password !== values.passwordConfirm) return false
        setLoading(true)
        try {
            const r = await http.patch(`/auth/reset-password/${params.token}`, values)
            if (r.data.ok) {
                reset()
                setLoading(false)
                navigate('/sign-in')
            } else {
                setResetPasswordError(r.data.message)
            }
        } catch (error: any) {
            if (error.response) {
                setResetPasswordError(error.response.data.message)
                setTimeout(() => {
                    setResetPasswordError(null)
                }, 8000)
            }
        } finally {
            setLoading(false)
        }

    }

    return (
        <div className="flex h-screen w-screen dark:bg-gray-900 items-center justify-center">
            <Box className=" w-full max-w-[420px] mx-3 sm:mx-0 sm:w-96 ">
                <form
                    onSubmit={handleResetPassword}
                    className="flex items-center justify-between flex-col "
                >

                    <h3 className="title-form self-start mb-4 !text-xl sm:!text-3xl"> Cambiar contraseña </h3>

                    {resetPasswordError && <FormError className="border border-dashed border-red-400 p-1.5 text-center text-sm mt-3" text={resetPasswordError} />}
                    <CustomInput
                        type="password"
                        placeholder=".lk8Tx9W/"
                        onChange={(val) => handleInputChange(val, "password")}
                        required
                        label="Contraseña"
                        hasError={errors?.password}
                        errorText="Contraseña obligatoria ."
                    />
                    <CustomInput
                        type="password"
                        placeholder=".lk8Tx9W/"
                        onChange={(val) => handleInputChange(val, "passwordConfirm")}
                        hasError={errors?.passwordConfirm || values.passwordConfirm !== values.password}
                        required
                        label="Confirmar contraseña"
                        errorText="Las contraseñas no coinciden."
                    />
                    <fieldset>
                        <button disabled={loading} className="btn gradient" type="submit">
                            {loading ? (
                                <div className="flex items-center gap-4">
                                    <span>Espere</span>
                                    <InlineDots />
                                </div>
                            ) : (
                                <span>Enviar</span>
                            )}
                        </button>
                    </fieldset>
                </form>
            </Box>

        </div>
    )
}

export default ResetPassword
