import logoApp from '../../assets/images/logo.png'
import { formatDateDDMMYYYY } from '../../helpers/date'
interface Props extends React.HTMLAttributes<HTMLDivElement> {
  loadingPdf?: boolean
  date?: string | Date
}
const ReceiptHeader = ({ loadingPdf = undefined, date }: Props) => {
  return (
    <div className={`header-pdf  flex items-center justify-between  border border-gray-200   p-2 `}>
      <div className='left w-[50%] flex items-center flex-col gap-y-2'>
        <div className='logo-app flex items-center'>
          <img width={60} className='min-w-[60px] object-cover' src={logoApp} alt='LOGO CENTRO' />
        </div>
        <div className='flex flex-col items-center '>
          <span className='text-lg font-semibold uppercase '>Centro</span>
          <span className='text-md font-semibold '>Administración de </span>
          <span className='text-xs  '>Consorcios y Propiedades</span>
        </div>
      </div>
      <div className='right w-[50%] '>
        <div className='flex flex-col items-center text-xs'>
          <span>Alquileres - Ventas - Tasaciones</span>
          <span>San Martin 1514 Tel: 4483280</span>
          <span>2000 - Rosario - Santa Fe </span>
          <span>inmobiliaria.centro.1980@gmail.com</span>
          <a href='https://admcentro.com.ar' target='_blank'>
            https://admcentro.com.ar
          </a>
          <div className=''>
            <span className='flex gap-x-2'>
              <span>Rosario</span>
              <span>{formatDateDDMMYYYY(date?.toString()!)}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReceiptHeader
