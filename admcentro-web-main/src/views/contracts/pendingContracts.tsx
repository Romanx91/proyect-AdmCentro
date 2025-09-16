import React, { useRef, useState } from 'react'
import { DataTable, DataTableExpandedRows } from 'primereact/datatable'
import { Column } from 'primereact/column'
import Box from '../../components/Box'
import EditIcon from '../../components/icons/EditIcon'
import DeleteIcon from '../../components/icons/DeleteIcon'
import DeleteModal from '../../components/DeleteModal'
import Loading from '../../components/Loading'
import http from '../../api/axios'
import CreateModal from '../../components/CreateModal'
import CustomInput from '../../components/CustomInput'
import { useForm } from '../../hooks/useForm'
import FormError from '../../components/FormError'
import RequestError from '../../components/RequestError'
import FieldsetGroup from '../../components/FieldsetGroup'
import { Dropdown } from 'primereact/dropdown'
import { FilterMatchMode } from 'primereact/api'
import { useProperties } from '../../hooks/useProperties'
import CustomTextArea from '../../components/CustomTextArea'
import { useContracts } from '../../hooks/useContracts'
import { useClients } from '../../hooks/useClients'
import AddGuarantee from '../../components/icons/AddGuarantee'
import SeeIcon from '../../components/icons/SeeIcon'
import { Contract, IHistorialPrice } from '../../interfaces/Icontracts'
import { useNavigate } from 'react-router-dom'
import { TbReportMoney } from 'react-icons/tb'
import CloseOnClick from '../../components/CloseOnClick'
import useShowAndHideModal from '../../hooks/useShowAndHideModal'
import HeaderData from '../../components/HeaderData'
import RefreshData from '../../components/RefreshData'
import { EmptyData } from '../../components/EmptyData'
import FormActionBtns from '../../components/FormActionBtns'
import { validateForm } from '../../helpers/form'
import { diferenceBetweentwoDatesInYears, diffenceBetweenDates, formatDateDDMMYYYY, padToNDigit } from '../../helpers/date'
import BoxContainerPage from '../../components/BoxContainerPage'
import DropDownIcon from '../../components/DropDownIcon'
import { formatPrice, roundUp } from '../../helpers/numbers'
import { BsPrinter } from 'react-icons/bs'
import { IClienyPayment } from '../../interfaces/IclientPayments'
import { monthsInSpanish } from '../../helpers/variableAndConstantes'
import { RiErrorWarningFill } from 'react-icons/ri'
import logoApp from '../../assets/images/logo.png'
// @ts-expect-error
import html2pdf from 'html2pdf.js'

export interface Iassurance {
  fullName: string
  email: string
  phone: string
  cuit: string
  address: string
  obs: string
  ContractId: number | null
  id: number
}
const PendingContracts = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddGuaranteeModal, setShowAddGuaranteeModal] = useState(false)
  const [showAddEventualityModal, setShowAddEventualityModal] = useState(false)
  const [show, setShow] = useState(false)
  const [assurances, setAssurances] = useState<Iassurance[]>([])
  const [assuranceItem, setAssuranceItem] = useState<Iassurance>({
    fullName: '',
    email: '',
    address: '',
    obs: '',
    phone: '',
    cuit: '',
    ContractId: 0,
    id: 0
  })
  const [editing, setEditing] = useState(false)
  const [addGaranteeBox, setAddGaranteeBox] = useState(false)
  const { showAndHideModal } = useShowAndHideModal()
  const [savingOrUpdating, setSavingOrUpdating] = useState(false)
  const [showFinishContractModal, setShowFinishContractModal] = useState(false)
  const { values, handleInputChange, reset, updateAll } = useForm({
    ClientId: 0,
    PropertyId: 0,
    startDate: '',
    endDate: '',
    description: '',
    deposit: 0,
    booking: 0,
    amount: 0,
    admFeesPorc: 2,
    currency: 'ARS',
    paymentType: 'Fijo',
    adjustmentMonth: 12
  })
  const {
    ClientId,
    admFeesPorc,
    currency,
    PropertyId,
    startDate,
    endDate,
    adjustmentMonth,
    paymentType,
    description,
    deposit,
    booking,
    amount
  } = values
  const {
    values: Gvalues,
    handleInputChange: GhandleInputChange,
    reset: Greset,
    updateAll: GupdateAll
  } = useForm({
    fullName: '',
    email: '',
    phone: '',
    cuit: '',
    address: '',
    obs: '',
    ContractId: 0,
    id: 0
  })
  const { values: FCvalues, motive, handleInputChange: FChandleInputChange, reset: FCreset } = useForm({ motive: '' })

  const { fullName, email, phone, cuit, address, obs } = Gvalues

  const {
    clientAmount,
    ownerAmount,
    description: descEvent,
    expiredDate,
    values: Evalues,
    handleInputChange: EhandleInputChange,
    reset: Ereset
  } = useForm({
    ContractId: 0,
    clientAmount: 0.0,
    ownerAmount: 0.0,
    expiredDate: new Date().toISOString().slice(0, 10),
    description: ''
  })
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows>()
  const [globalFilterValue, setGlobalFilterValue] = useState('')
  const [errors, setErrors] = useState<any>()
  const [editMode, setEditMode] = useState(false)
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    'Client.fullName': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'PropertyType.description': { value: null, matchMode: FilterMatchMode.CONTAINS }
  })
  const navigate = useNavigate()
  const currentContract = useRef<Contract | null>()
  const currentPayment = useRef<IClienyPayment | null>()
  const [downloadPdf, setDownloadPdf] = useState(false)
  const { data, isError, isLoading, error, isFetching, refetch } = useContracts('/historial/payment?state=Pendiente')
  const clientQuery = useClients()
  const propertyQuery = useProperties('state=Libre')

  const edit = (data: Contract) => {
    updateAll({ ...data })
    setAssurances(data.Assurances)
    setShowCreateModal(true)
    setEditMode(true)
    currentContract.current = data
  }

  const showAddGuarantee = (data: Contract) => {
    setShowAddGuaranteeModal(true)
    currentContract.current = data
    GhandleInputChange(data.id, 'ContractId')
  }

  const onGlobalFilterChange = (val: any) => {
    const value = val
    let _filters = { ...filters }
    _filters['global'].value = value
    setFilters(_filters)
    setGlobalFilterValue(value)
  }

  const openFinishContractModal = (data: Contract) => {
    currentContract.current = data
    setShowFinishContractModal(true)
  }

  const closeFinishContractModal = () => {
    currentContract.current = null
    setShowFinishContractModal(false)
    FCreset()
  }

  const actionBodyTemplate = (rowData: Contract) => {
    return (
      <div className='flex gap-x-3 items-center justify-start'>
        {/* <SeeIcon action={() => navigate(`/contracts/${rowData.id}/${rowData.uuid}`)} /> */}
        {/* <button className='text-red-400 border border-red-500 px-2 rounded-full py-1'
					onClick={() => openFinishContractModal(rowData)}>  Finalizar </button> */}
      </div>
    )
  }

  const printPdf = async (data: IClienyPayment) => {
    currentPayment.current = data
    setDownloadPdf(true)
  }
  const closePrintPdfModal = () => {
    setDownloadPdf(false)
    currentPayment.current = null
  }

  const handleDownloadPdf = async () => {
    setLoadingPdf(true)
    var element = document.getElementById('pdf-download')
    var opt = {
      margin: [0.1, 0.1],
      filename: `${formatDateDDMMYYYY(currentPayment.current?.createdAt as string)}_${currentPayment.current?.month}_${
        currentPayment.current?.year
      }_${formatDateDDMMYYYY(new Date().toISOString())}.pdf`,
      image: { type: 'png', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
    }
    try {
      await html2pdf().from(element).set(opt).save()
    } catch (error) {
      console.log('error')
    } finally {
      setLoadingPdf(false)
      closePrintPdfModal()
    }
  }
  const openCreateOrEditModel = () => {
    propertyQuery.refetch()
    setEditMode(false)
    currentContract.current = null
    setShowCreateModal(true)
  }
  const actionBodyTemplatePayment = (rowData: IClienyPayment) => {
    return (
      <div className='flex gap-x-3 items-center justify-center'>
        <BsPrinter title='Imprimir comprobante' size={22} onClick={() => printPdf(rowData)} />
      </div>
    )
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
  const rowExpansionTemplate = (data: any) => {
    return (
      <div className='p-3'>
        <Box className='!p-0 !overflow-hidden !border-none sm:mx-0    mb-4 '>
          <DataTable
            size='small'
            emptyMessage='No hay cobro para ese filtro'
            className='!overflow-hidden   !border-none'
            value={data?.PaymentClients}
            dataKey='id'
            filters={filters}
            filterDisplay='menu'
            globalFilterFields={['month', 'year', 'Contract.Property.street', 'Contract.Client.fullName', 'ContractId', 'PaymentType.name']}
            responsiveLayout='scroll'
            // paginator
            // rows={10}
            // paginatorTemplate='FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink'
            // currentPageReportTemplate='{first} al {last} de {totalRecords}'
            // paginatorLeft={<RefreshData action={refetch} />}
          >
            <Column
              field='month'
              body={periodTemplate}
              header='Periodo'
              headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
              className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
              sortable
            />
            <Column
              field='createdAt'
              body={(data) => <span>{formatDateDDMMYYYY(data.createdAt)}</span>}
              header='Fecha de Cobro'
              headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
              className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
              sortable
            />
            <Column
              field='total'
              body={(data) => (
                <span>
                  {data.paidTotal > 0 ? (
                    <span className='flex items-center'>
                      {' '}
                      ${roundUp(data.paidTotal)}{' '}
                      <RiErrorWarningFill
                        title={`Pago parcial. Total :: ${data.total}`}
                        size={15}
                        className='dark:text-yellow-300  text-yellow-400 ml-1'
                      />{' '}
                    </span>
                  ) : (
                    '$' + roundUp(data.total)
                  )}
                </span>
              )}
              header='Total Cobrado'
              headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
              className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
              sortable
            />
            <Column
              field='PaymentType.name'
              header='Format de pago'
              headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
              className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
              sortable
            />
            <Column
              body={actionBodyTemplatePayment}
              headerClassName='!border-none dark:!bg-gray-800'
              className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
              exportable={false}
              style={{ width: 90 }}
            />
          </DataTable>
        </Box>
      </div>
    )
  }
  const allowExpansion = (rowData: any) => rowData.PaymentClients?.length > 0
  if (isLoading) return <Loading />
  if (isError) return <RequestError error={error} />

  return (
    <BoxContainerPage>
      <HeaderData action={openCreateOrEditModel} text='Contratos pendientes' />
      {data?.data?.length > 0 ? (
        <>
          <CustomInput
            onChange={(val) => onGlobalFilterChange(val)}
            className=' w-auto mx-2 sm:mx-0 sm:w-96'
            initialValue={globalFilterValue}
            placeholder='Buscar contrato'
            type='search'
          />
          <Box className='!p-0 !overflow-hidden !border-none sm:mx-0   mb-4 '>
            <DataTable
              size='small'
              emptyMessage='Aún no hay contrato pendiente'
              className='!overflow-hidden   !border-none '
              rowClassName={() => 'group-hover:!bg-gray-100 group  dark:group-hover:!bg-gray-800'}
              value={data?.data}
              filters={filters}
              globalFilterFields={['Property.street', 'Client.fullName']}
              // paginator
              // rows='10'
              // paginatorTemplate='FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink'
              // currentPageReportTemplate='{first} al {last} de {totalRecords}'
              // paginatorLeft={<RefreshData action={refetch} />}
              dataKey='id'
              responsiveLayout='scroll'
              expandedRows={expandedRows}
              onRowToggle={(e: any) => setExpandedRows(e.data)}
              rowExpansionTemplate={rowExpansionTemplate}
            >
              <Column
                expander={allowExpansion}
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
                style={{ width: '0.5rem' }}
              />
              <Column
                field='id'
                header='CÓDIGO'
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
                sortable
              />
              <Column
                field='Property.street'
                body={(data) => (
                  <span>
                    {data.Property.street} {data.Property.number} {data.Property.floor} {data.Property.dept}
                  </span>
                )}
                header='Propiedad'
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
                sortable
              />
              <Column
                field='Property.folderNumber'
                header='Carpeta'
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
                sortable
              />
              <Column
                field='Client.fullName'
                body={(data) => (
                  <span>
                    {data.Client.fullName} <span className='text-sm'> ({data.Client.cuit}) </span>
                  </span>
                )}
                header='Inquilino'
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
                sortable
              />
              <Column
                field='startDate'
                header='Fecha inicio'
                body={(data) => <span>{formatDateDDMMYYYY(data.startDate)}</span>}
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
                sortable
              />
              <Column
                field='endDate'
                header='Fecha fin'
                body={(data) => <span>{formatDateDDMMYYYY(data.endDate)}</span>}
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
                sortable
              />
              <Column
                field='state'
                header='Estado'
                sortable
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:!border-slate-600 text-red-400'
              />

              <Column
                field='adjustmentMonth'
                header='Ajuste'
                // body={(data) => <span>{formatDateDDMMYYYY(data.endDate)}</span>}
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
                sortable
              />

              <Column
                header='Monto'
                body={(data: Contract) => {
                  return (
                    <div>
                      {data.currency}{' '}
                      {formatPrice(
                        data.PriceHistorials.sort((a: IHistorialPrice, b: IHistorialPrice) => a.id - b.id)[data.PriceHistorials?.length - 1]
                          ?.amount
                      )}
                    </div>
                  )
                }}
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
              />

              {/* <Column
									body={actionBodyTemplate}
									headerClassName='!border-none dark:!bg-gray-800'
									className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
									exportable={false}
									style={{ width: 90 }}
								/> */}
            </DataTable>
          </Box>
        </>
      ) : (
        <EmptyData text='Aún no hay contrato' />
      )}

      {isFetching && <Loading h={40} w={40} />}

      <CreateModal
        show={downloadPdf}
        closeModal={closePrintPdfModal}
        overlayClick={false}
        className='shadow-none border-0   w-fit max-w-5xl !p-3'
        titleText={`Recibo  ${currentPayment.current?.month}/${currentPayment.current?.year}`}
      >
        <CloseOnClick action={closePrintPdfModal} />

        <Box className='!shadow-none rounded-lg !p-2 !border-none  border-gray-200 dark:!from-gray-700 dark:!to-gray-800 dark:!bg-gradient-to-tr mt-3'>
          <div id='pdf-download' className='flex gap-x-2 '>
            {[1, 2].map((pdf, index) => {
              const Contract = data.data.find((item) => item.id === currentPayment.current?.ContractId)

              return (
                <div
                  key={index}
                  className='flex justify-between flex-col border border-gray-200 dark:border-slate-600 p-1 text-xs  min-h-[750px] ] !w-[550px]'
                >
                  <div className='header-pdf flex items-center justify-between border border-gray-200 dark:border-slate-600  p-2'>
                    <div className='left w-[50%] flex items-center flex-col gap-y-2'>
                      <div className='logo-app flex items-center'>
                        <img width={60} className='min-w-[60px] object-cover' src={logoApp} alt='LOGO CENTRO' />
                      </div>
                      <div className='flex flex-col items-center'>
                        <span className='text-lg font-semibold uppercase'>Centro</span>
                        <span className='text-md font-semibold '>Administracion de </span>
                        <span className='text-xs  '>Consorcios y Propiedades</span>
                      </div>
                    </div>
                    <div className='right w-[50%] '>
                      <div className='flex flex-col items-center text-xs'>
                        <span>Alquileres - Ventas - Tasaciones</span>
                        <span>San Martin 1514 Tel: 4483280</span>
                        <span>2000 - Rosario - Santa Fe </span>
                        <span>inmobiliaria.centro.1980@gmail.com</span>
                        <span>www.centro.com.ar</span>
                        <div className=''>
                          <span className='flex gap-x-2'>
                            <span>Rosario</span>
                            <span>{formatDateDDMMYYYY(currentPayment.current?.createdAt as string)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='client-data border border-gray-200 dark:border-slate-600  my-2 p-2 flex '>
                    <div className='flex flex-col gap-y-2 flex-1'>
                      <span>
                        <span className='font-semibold'>Inquilino: </span>
                        <span>{Contract?.Client.fullName}</span>
                      </span>
                      <span>
                        <span className='font-semibold'>Domicilio: </span>
                        <span>{Contract?.Client.address}</span>
                      </span>
                    </div>
                    <div className='w-30  flex gap-x-4'>
                      <div className=''>
                        <div>C {Contract?.Property.folderNumber} </div>

                        <div className=''>
                          <span className='flex gap-x-2'>
                            <span>Recibo</span>
                            <span className=''>{padToNDigit(currentPayment.current?.id || 0, 4)}</span>
                          </span>
                        </div>
                      </div>
                      <div className='flex flex-col  items-center'>
                        <span className='font-semibold'>Vencimiento</span>
                        <span className='font-semibold'>del contrato</span>
                        <span className='!text-xs '>
                          {formatDateDDMMYYYY(Contract?.startDate!)} {' / '}
                          {formatDateDDMMYYYY(Contract?.endDate!)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className='payment-pdf px-2 mb-3 flex-1 gap-y-1 flex flex-col font-normal '>
                    {currentPayment.current?.expenseDetails.map((evt, index) => (
                      <div
                        key={index}
                        className='align-items-center uppercase  text-xs  flex gap-x-3 items-center  justify-between dark:border-slate-600     border-gray-300'
                      >
                        <span className=''>{evt.description}</span>
                        <span>${evt.amount}</span>
                      </div>
                    ))}
                    {currentPayment.current?.recharge! > 0 && (
                      <div className='align-items-center uppercase text-xs  flex gap-x-3 items-center  justify-between dark:border-slate-600    border-gray-300'>
                        <span className=''>
                          PUNITORIOS {currentPayment.current?.month} {currentPayment.current?.year.toString()}
                        </span>
                        <span>${currentPayment.current?.recharge}</span>
                      </div>
                    )}
                    {currentPayment.current?.eventualityDetails.map((evt, index) => (
                      <div
                        key={index}
                        className='align-items-center uppercase text-xs  flex gap-x-3 items-center  justify-between dark:border-slate-600     border-gray-300'
                      >
                        <span className=''>{evt.description}</span>
                        <span>${evt.clientAmount}</span>
                      </div>
                    ))}

                    {currentPayment.current?.obs && (
                      <div className='text-xs border p-1 pb-2 mt-1 dark:border-slate-600     border-gray-300'>
                        <span className=''>Observaciones : </span>
                        <span>{currentPayment.current?.obs}</span>
                      </div>
                    )}
                  </div>
                  <div className='mt-auto p-2 font-normal border border-gray-200 dark:border-slate-600 '>
                    <div className='align-items-center   text-xs  flex gap-x-3 items-center  justify-between dark:border-slate-600     border-gray-300'>
                      <span className=''>Total </span>
                      <span className=''>${roundUp(currentPayment.current?.total!)}</span>
                    </div>
                    {
                      // @ts-expect-error
                      currentPayment.current?.paidTotal > 0 && (
                        <>
                          <div className='align-items-center   text-xs  flex gap-x-3 items-center  justify-between dark:border-slate-600     border-gray-300'>
                            <span className=''>Total cobrado </span>
                            <span className=''>${roundUp(currentPayment.current?.paidTotal!)}</span>
                          </div>
                          <div className='align-items-center   text-xs  flex gap-x-3 items-center  justify-between dark:border-slate-600     border-gray-300'>
                            <span className=''>Diferencia </span>
                            <span className=''>
                              ${roundUp(currentPayment.current?.total!) - roundUp(currentPayment.current?.paidTotal!)}
                            </span>
                          </div>
                        </>
                      )
                    }

                    <div className='align-items-center   text-xs  flex gap-x-3 items-center  justify-between dark:border-slate-600     border-gray-300'>
                      <span className=''>Format de pago </span>
                      <span className=''>{currentPayment.current?.PaymentType.name}</span>
                    </div>
                    <div className='sign-aclaration my-1'>
                      <div className='sign my-2'>
                        <span>Firma : </span>
                      </div>
                      <div className=''>
                        <span>Aclaración : </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className='flex gap-x-2'>
            <button className='btn sec  !my-4' disabled={loadingPdf} onClick={closePrintPdfModal}>
              {' '}
              Cancelar{' '}
            </button>
            <button className='btn gradient !text-sm !my-4' disabled={loadingPdf} onClick={handleDownloadPdf}>
              {' '}
              {loadingPdf ? 'DESCARGANDO... ' : 'DESCARGAR'}{' '}
            </button>
          </div>
        </Box>
      </CreateModal>
    </BoxContainerPage>
  )
}

export default PendingContracts
