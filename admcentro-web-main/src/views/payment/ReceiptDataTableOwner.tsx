import React from 'react'
import ReceiptHeader from './ReceiptHeader'
import { formatPrice, roundUp } from '../../helpers/numbers'
import { formatDateDDMMYYYY } from '../../helpers/date'
import { IClienyPayment } from '../../interfaces/IclientPayments'
import InlineDots from '../../components/loadings/Inlinedots'
import { monthsInSpanish } from '../../helpers/variableAndConstantes'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  loadingPdf: boolean
  handleDownloadPdf: () => void
  closePrintPdfModal: () => void
  data: IClienyPayment[]
  isOwner?: boolean
}

const periodTemplate = (data: any) => {
  const monthSet = new Set()
  const yearSet = new Set()
  // validate if the payment has some debt
  const prevDebts = data.expenseDetails
    .filter((item: any) => item.hasOwnProperty('debt'))
    .map((item: any) => ({ month: item.month, year: item.year }))
  // validate if the payment was for the actual month
  const curMonthPaid = data.expenseDetails.filter((item: any) => item.hasOwnProperty('paidCurrentMonth'))
  if (prevDebts.length > 0) {
    prevDebts.forEach((item: any) => {
      monthSet.add(item.month)
      yearSet.add(item.year)
    })
  }
  if (curMonthPaid.length > 0 || (prevDebts.length === 0 && curMonthPaid.length === 0)) {
    monthSet.add(monthsInSpanish.findIndex((item) => item === data.month) + 1)
    yearSet.add(data.year)
  }
  // if (prevDebts.length === 0 && curMonthPaid.length === 0) {
  // 	monthSet.add(monthsInSpanish.findIndex(item => item === data.month) + 1)
  // 	yearSet.add(data.year)
  // }
  return (
    <span>
      {Array.from(monthSet)
        .map((item: any) => monthsInSpanish[item - 1])
        .join('-')}
      /{Array.from(yearSet).join('-')}
    </span>
  )
}

const ReceiptDataTableOwner = ({ loadingPdf, data, isOwner = false, closePrintPdfModal, handleDownloadPdf }: Props) => {
  const getTotal = data.map((p) => p.total).reduce((a, b) => a + b, 0)
  const getTotalCash = data
    .filter((p) => p.PaymentType.name === 'Efectivo')
    .map((p) => (p.paidTotal > 0 ? p.paidTotal : p.total))
    .reduce((a, b) => a + b, 0)
  const getTotalBank = data
    .filter((p) => p.PaymentType.name !== 'Efectivo')
    .map((p) => (p.paidTotal > 0 ? p.paidTotal : p.total))
    .reduce((a, b) => a + b, 0)
  const w = 'w-full'

  return (
    <div className='shadow-none border-0  border-gray-200 max-h-[450px]  overflow-y-auto text-slate-900 '>
      <div id='planillaPagos' className={`flex gap-x-2 `}>
        <div className='flex  flex-col border border-gray-200  p-1 text-xs  w-full'>
          {/* HEADER */}
          <ReceiptHeader date={new Date()} />
          <div className='mt-2 flex-1 flex flex-col justify-between'>
            <div className='not-paid-contracts flex flex-col  gap-y-1d divide-y-[0.1px] divide-slate-300 '>
              <div className='not-paid-contract-item-body flex  gap-x-1 p-2'>
                {/* <div className={' font-medium  flex items-center justify-center text-center   ' + w}>
                {isOwner ? 'PROPIETARIO' : 'INQUILINO'}
              </div> */}
                <div className={' font-medium  flex items-center justify-center text-center  ' + w}>PROPIETARIO</div>
                <div className={' font-medium  flex items-center justify-center text-center ' + w}>PERIODO</div>
                <div className={' font-medium  flex items-center justify-center text-center  ' + w}>FECHA</div>
                <div className={' font-medium  flex items-center justify-center text-center  ' + w}>MONTO</div>
                <div className={' font-medium  flex items-center justify-center text-center  ' + w}>FORMAT DE PAGO</div>
              </div>
              {data.map((p, index: number) => {
                return (
                  <div className=' text-slate-900 p-2' key={index}>
                    <div className=' flex  gap-x-1 '>
                      <div className={'flex items-center justify-center text-center ' + w}>{p.Owner?.fullName}</div>
                      <div className={'flex items-center justify-center text-center ' + w}>{periodTemplate(p)}</div>
                      <div className={'flex items-center justify-center text-center ' + w}>{formatDateDDMMYYYY(p.createdAt)}</div>
                      <div className={'flex items-center text-center justify-center ' + w}>
                        <span>{p.paidTotal > 0 ? '$' + formatPrice(roundUp(p.paidTotal)) : '$' + formatPrice(roundUp(p.total))}</span>
                      </div>
                      <div className={'flex items-center justify-center text-center ' + w}>{p.PaymentType.name}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className='flex flex-col gap-2 border-t pt-4'>
              <div className=' w-full items-center flex justify-between px-4'>
                <span>Total Efectivo</span>
                <span>{'$' + formatPrice(getTotalCash)}</span>
              </div>
              <div className=' w-full items-center flex justify-between px-4'>
                <span>Total Transferencia</span>
                <span>{'$' + formatPrice(getTotalBank)}</span>
              </div>
              <div className=' w-full items-center flex justify-between px-4 pb-4'>
                <span>Total </span>
                <span>{'$' + formatPrice(getTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <section className='btns-form-actions action flex items-center gap-x-3  sticky bottom-0 bg-white  border p-4 z-40 mt-4'>
        <button className='btn sec !py-1' onClick={() => closePrintPdfModal()} disabled={loadingPdf} type='button'>
          Cancelar
        </button>
        <button className='btn gradient  !py-1' disabled={loadingPdf} onClick={() => handleDownloadPdf()}>
          {loadingPdf ? (
            <span className='flex items-center gap-x-2'>
              <span>Descargando</span>
              <InlineDots />
            </span>
          ) : (
            'Descargar'
          )}
        </button>
      </section>
    </div>
  )
}

export default ReceiptDataTableOwner
