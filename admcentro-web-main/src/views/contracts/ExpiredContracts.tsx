import { useState } from 'react'
import { Dropdown } from 'primereact/dropdown'
import Box from '../../components/Box'
import Loading from '../../components/Loading'
import RequestError from '../../components/RequestError'
import { useContracts } from '../../hooks/useContracts'
import { diferenceBetweentwoDatesInYears, diffenceBetweenDates, formatDateDDMMYYYY } from '../../helpers/date'
// @ts-expect-error
import html2pdf from 'html2pdf.js'
import BoxContainerPage from '../../components/BoxContainerPage'
import { Contract, IHistorialPrice } from '../../interfaces/Icontracts'
import { DobleChevronAngle } from '../../components/icons/DobleChevronAngle'

function isWithinXDays(dateString: Date, days: number) {
  const currentDate = new Date()
  const targetDate = new Date(dateString)
  const differenceInTime = targetDate.getTime() - currentDate.getTime()
  const differenceInDays = differenceInTime / (1000 * 3600 * 24)
  return differenceInDays <= days && differenceInDays >= 0
}

function needsPriceUpdate(contract: any, days: number) {
  const { startDate, endDate, adjustmentMonth } = contract
  const currentDate = new Date()
  const startDateObj = new Date(startDate)
  const endDateObj = new Date(endDate)

  const differenceInDays = Math.ceil((endDateObj.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))

  // Calculate next adjustment dates
  const nextAdjustmentDates = []
  let nextAdjustmentDate = new Date(startDateObj)
  while (nextAdjustmentDate <= endDateObj) {
    nextAdjustmentDates.push(new Date(nextAdjustmentDate))
    nextAdjustmentDate.setMonth(nextAdjustmentDate.getMonth() + adjustmentMonth)
  }

  // Check if any next adjustment date is within the specified number of days or in the past
  return nextAdjustmentDates.some((date) => isWithinXDays(date, days)) || (differenceInDays <= days && differenceInDays >= 0)
}

function getAdjustmentDates(contract: Contract) {
  const { startDate, endDate, adjustmentMonth } = contract

  // Convertir las fechas de cadena a objetos Date
  let start = new Date(startDate)
  const end = new Date(endDate)
  const today = new Date()

  // Lista para almacenar las fechas de ajuste en formato yyyy-mm-dd
  const adjustmentDates = []

  // Función para formatear la fecha en yyyy-mm-dd
  function formatDate(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Calcular las fechas de ajuste
  while (start <= end) {
    // Agregar la fecha de ajuste (un día antes)
    const adjustmentDate = new Date(start)
    adjustmentDate.setDate(adjustmentDate.getDate())
    adjustmentDates.push(formatDate(adjustmentDate))

    // Avanzar la fecha de ajuste en adjustmentMonth meses
    start.setMonth(start.getMonth() + adjustmentMonth)
  }

  // Agregar la fecha de fin como una posible fecha de ajuste (un día antes)
  const finalAdjustmentDate = new Date(end)
  finalAdjustmentDate.setDate(finalAdjustmentDate.getDate())
  const formattedFinalAdjustmentDate = formatDate(finalAdjustmentDate)
  if (!adjustmentDates.includes(formattedFinalAdjustmentDate)) {
    adjustmentDates.push(formattedFinalAdjustmentDate)
  }

  // Encontrar la próxima fecha de ajuste que sea mayor que hoy
  let nextAdjustmentDate = null
  for (let date of adjustmentDates) {
    if (new Date(date) > today) {
      nextAdjustmentDate = date
      break
    }
  }

  // Devolver la lista de fechas de ajuste y la próxima fecha de ajuste
  return {
    adjustmentDates,
    nextAdjustmentDate
  }
}

interface IContractWithAdj extends Contract {
  adj: {
    adjustmentDates: string[]
    nextAdjustmentDate: string | null
  }
}

const baseClass = ' p-2 px-0 text-center border-r border-slate-400 dark:border-slate-700'
const ExpiredContracts = () => {
  const [days, setDays] = useState(60)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const { data, isError, error, isLoading, refetch, isFetching } = useContracts(`/expired-contracts/${days}`)
  const downloadPdf = async () => {
    setLoadingPdf(true)
    var element = document.getElementById('pdf-download')

    var opt = {
      margin: [0.1, 0.1],
      filename: `CONTRATOS_A_VENCER_EN_${days}_DIAS_${formatDateDDMMYYYY(new Date().toISOString())}.pdf`,
      // image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
    }
    try {
      await html2pdf().from(element).set(opt).save()
    } catch (error) {
      console.log('error')
    } finally {
      setLoadingPdf(false)
    }
  }
  // const contractsWithAdjustmentsDate: IContractWithAdj[] | undefined = data?.data.map((contract) => ({
  //   ...contract,
  //   adj: getAdjustmentDates(contract)
  // }))
  // // order by adj.nextAdjustmentDate
  // contractsWithAdjustmentsDate?.sort((a, b) => {
  //   if (a.adj.nextAdjustmentDate && b.adj.nextAdjustmentDate) {
  //     return new Date(a.adj.nextAdjustmentDate).getTime() - new Date(b.adj.nextAdjustmentDate).getTime()
  //   }
  //   return 0
  // })
  const contractsToUpdateOrEnding = data?.data.filter((contract) => needsPriceUpdate(contract, days))
  // add adjustment to those contractos
  const contractsWithAdjustmentsDate: IContractWithAdj[] | undefined = contractsToUpdateOrEnding
    ?.map((contract) => ({
      ...contract,
      adj: getAdjustmentDates(contract)
    }))
    ?.sort((a, b) => {
      if (a.adj.nextAdjustmentDate && b.adj.nextAdjustmentDate) {
        return new Date(a.adj.nextAdjustmentDate).getTime() - new Date(b.adj.nextAdjustmentDate).getTime()
      }
      return 0
    })

  const getDiffBetweenDate = (date: string) => diffenceBetweenDates(date, new Date().toISOString().slice(0, 10))
  if (isLoading) return <Loading />
  if (isError) return <RequestError error={error} />

  return (
    <BoxContainerPage className=''>
      <Box className='expired-contracts !p-0 !m-0 !border-0 !shadow-none !bg-transparent flex items-end gap-x-4'>
        <fieldset className='w-full sm:w-40 mb-0 '>
          <label htmlFor='days'>Cantidad de días</label>
          <Dropdown
            value={days}
            onChange={(e: any) => setDays(e.value)}
            dropdownIcon={() => (
              <span className='dark:text-slate-400'>
                <DobleChevronAngle />
              </span>
            )}
            options={[30, 60, 90, 120]}
            placeholder='Cantidad días'
            className='h-[42px]  items-center !bg-transparent !border-gray-400 dark:!border-gray-700  dark:!text-slate-400 '
          />
        </fieldset>
        <button
          className='btn !bg-transparent border border-brand2 dark:border-brand hover:!bg-gray-100 dark:text-slate-400 dark:hover:!bg-slate-700 dark:hover:!text-slate-300'
          onClick={() => refetch()}
        >
          Buscar
        </button>
      </Box>

      <div className=' mx-auto  dark:text-slate-500  ' id='pdf-download'>
        <h2 className='my-4 text-2xl font-semibold leading-tight'>
          <span>
            Próximos contratos a ajustar o vencer
            <br /> <span className='text-sm'> en los próximos {days} días </span>
          </span>
        </h2>
        <div className='!p-0 !m-0 '>
          <div className=''>
            <div className='w-full   text-xs text-left whitespace-nowrap'>
              <div className=' rounded-t-lg  '>
                <div className='flex px-1 gap-1 font-semibold border-b border-slate-300 dark:border-slate-700 text-center'>
                  <div className={`w-[70px]  ${baseClass}`}>
                    <span className='p-3 pl-0'>Fec. Inicio</span>
                  </div>
                  <div className={`w-[70px]  ${baseClass}`}>
                    <span className='p-3 pl-0'>Fec. Vto</span>
                  </div>
                  <div className={`w-[105px]   ${baseClass}`}>
                    <span className='p-3 pl-0 '>Fec. Prox. ajuste</span>
                  </div>
                  <div className={`w-[70px] ${baseClass}`}>
                    <span className='p-3 pl-0 '>Ult. Ajuste</span>
                  </div>
                  <div className={`w-[60px]   ${baseClass}`}>
                    <span className='p-3 pl-0 '>Ajuste</span>
                  </div>
                  <div className={`w-[120px]    ${baseClass}`}>
                    <span className='p-3 pl-0'>Propiedad</span>
                  </div>
                  <div className={`w-[40px]   ${baseClass}`}>
                    <span className='p-3 pl-0 '>Año</span>
                  </div>
                  <div className={`w-[120px]   ${baseClass}`}>
                    <span className='p-3 pl-0'>Propietario</span>
                  </div>

                  <div className={`w-[120px]   ${baseClass}`}>
                    <span className='p-3 pl-0'>Inquilino</span>
                  </div>
                  <div className={`w-[50px]  ${baseClass}`}>
                    <span className='p-3 pl-0'>CPTA</span>
                  </div>
                  <div className={`w-[80px]  ${baseClass}`}>
                    <span className='p-3 pl-0'>Monto Neto</span>
                  </div>
                  <div className='w-[80px] p-2 text-center'>
                    <span className='p-3 pl-0'>Monto Alq.</span>
                  </div>
                </div>
              </div>
              <div className=''>
                {/* .sort((a, b) => getExpiredDate(a.startDate).getTime() - getExpiredDate(b.startDate).getTime()) */}
                {contractsWithAdjustmentsDate?.map((c: IContractWithAdj) => {
                  const ap: IHistorialPrice = c.PriceHistorials.sort((a: IHistorialPrice, b: IHistorialPrice) => a.id - b.id)[
                    c.PriceHistorials.length - 1
                  ]
                  return (
                    <div key={c.id} className='flex px-1 gap-1 border-b border-slate-400 dark:border-slate-700 text-center'>
                      <p className='w-[70px] text-center border-r border-slate-400 dark:border-slate-700 truncate p-2 px-0  flex items-center justify-center text-balance '>
                        {formatDateDDMMYYYY(c.startDate)}
                      </p>
                      <p className='w-[70px] text-center border-r border-slate-400 dark:border-slate-700 flex items-center justify-center text-balance p-2 px-0 '>
                        {formatDateDDMMYYYY(c.endDate)}
                      </p>
                      <button
                        type='button'
                        title={JSON.stringify(c.adj.adjustmentDates)}
                        className='w-[105px]  text-center border-r border-slate-400 dark:border-slate-700  p-2 px-0  relative group'
                      >
                        {c.adj.nextAdjustmentDate === c.adj.adjustmentDates.at(-1) ? 'FIN' : formatDateDDMMYYYY(c.adj.nextAdjustmentDate!)}
                        <div className='absolute top-[100%] left-0 divide-y-[1px] rounded-md shadow-xl  group-focus:flex hidden flex-col  bg-white dark:bg-slate-700 dark:divide-slate-800  z-50'>
                          {c.adj.adjustmentDates.map((d) => (
                            <span
                              key={d}
                              className={`text-slate-700 dark:text-slate-400 ${
                                d === c.adj.nextAdjustmentDate! ? ' !text-brand dark:!text-brand ' : ''
                              } px-3 py-1.5 `}
                            >
                              {formatDateDDMMYYYY(d)}
                            </span>
                          ))}
                        </div>
                      </button>
                      <p className='w-[70px]  text-center border-r border-slate-400 dark:border-slate-700 flex items-center justify-center text-balance p-2 px-0 '>
                        {formatDateDDMMYYYY(ap.createdAt)}
                      </p>

                      <p className='w-[60px] text-center border-r border-slate-400 dark:border-slate-700 flex items-center justify-center text-balance p-2 px-0 '>
                        {c.adjustmentMonth}/meses
                      </p>

                      <p className='w-[120px] text-center border-r border-slate-400 dark:border-slate-700 flex items-center justify-center text-balance p-2 px-0 '>
                        {c.Property.street} {c.Property.number} {c.Property.dept} - {c.Property.floor}
                      </p>
                      <p className='w-[40px] text-center border-r border-slate-400 dark:border-slate-700 flex items-center justify-center text-balance p-2 px-0 '>
                        <span
                          className={`${
                            diferenceBetweentwoDatesInYears(c.startDate, new Date().toISOString().slice(0, 10)) === 3 &&
                            'text-yellow-500 font-bold'
                          }`}
                        >
                          {diferenceBetweentwoDatesInYears(c.startDate, new Date().toISOString().slice(0, 10))}
                        </span>
                      </p>
                      <p className='w-[120px] text-center border-r border-slate-400 dark:border-slate-700 flex items-center justify-center text-balance p-2 px-0 '>
                        {c.Property.Owner?.fullName}
                      </p>
                      <p className='w-[120px] text-center border-r border-slate-400 dark:border-slate-700 flex items-center justify-center text-balance p-2 px-0 '>
                        {' '}
                        {c.Client.fullName}
                      </p>

                      <p className='w-[50px]    border-r border-slate-400 dark:border-slate-700 flex items-center justify-center text-balance p-2 px-0'>
                        {c.Property.folderNumber}
                      </p>
                      <p className='w-[80px]  text-center border-r border-slate-400 dark:border-slate-700 flex items-center justify-center text-balance p-2 px-0 '>
                        ${ap.amount}
                      </p>
                      <p className='w-[80px] flex items-center justify-center text-balance p-2 px-0'>
                        ${ap.amount - ap.amount * (c.Property?.Owner?.commision! / 100)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      {isFetching && <Loading h={60} w={60} />}
      <button className='btn gradient  !my-4 !w-fit' disabled={loadingPdf || data?.data.length == 0} onClick={downloadPdf}>
        {loadingPdf ? 'Descargando ... ' : `Descargar Planilla (${contractsToUpdateOrEnding?.length})`}
      </button>
    </BoxContainerPage>
  )
}

export default ExpiredContracts
