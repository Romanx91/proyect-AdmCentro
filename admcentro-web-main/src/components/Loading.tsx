import { useContext } from "react"
import { AuthContext } from "../context/authContext"

const Loading = ({ w = 80, h = 80 }: { w?: number, h?: number }) => {
  const { authState } = useContext(AuthContext)
  return (
    <div data-bg="#fff" className={`app-loading ${authState?.theme}`} style={{ height: h, width: w, }}></div>
  )
}

export default Loading;
