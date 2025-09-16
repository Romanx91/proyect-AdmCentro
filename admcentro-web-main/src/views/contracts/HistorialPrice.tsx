import React, { useRef, useState } from 'react'
import { DataTable, DataTableExpandedRows } from 'primereact/datatable'
import { Column } from 'primereact/column'
import Box from '../../components/Box'
import DeleteModal from '../../components/DeleteModal'
import Loading from '../../components/Loading'
import http from '../../api/axios'
import CreateModal from '../../components/CreateModal'
import { MdOutlineAttachMoney } from 'react-icons/md'
import CustomInput from '../../components/CustomInput'
import { useForm } from '../../hooks/useForm'
import FormError from '../../components/FormError'
import RequestError from '../../components/RequestError'
import { RowsToShow } from '../../helpers/variableAndConstantes'
import FieldsetGroup from '../../components/FieldsetGroup'
import { Dropdown } from 'primereact/dropdown'
import { FilterMatchMode } from 'primereact/api'
import { useContracts } from '../../hooks/useContracts'
import { Contract, IHistorialPrice } from '../../interfaces/Icontracts'
import EditIcon from '../../components/icons/EditIcon'
import { diferenceBetweentwoDatesInYears, formatDate, formatDateDDMMYYYY } from '../../helpers/date'
import useShowAndHideModal from '../../hooks/useShowAndHideModal'
import { validateForm } from '../../helpers/form'
import HeaderData from '../../components/HeaderData'
import RefreshData from '../../components/RefreshData'
import FormActionBtns from '../../components/FormActionBtns'
import DeleteIcon from '../../components/icons/DeleteIcon'
import BoxContainerPage from '../../components/BoxContainerPage'

const HistorialPrices = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [show, setShow] = useState(false)
  const {
    amount,
    percent,
    curAmount,
    year,
    ContractId,
    values: values,
    handleInputChange: handleInputChange,
    updateAll,
    reset
  } = useForm({
    ContractId: 0,
    amount: 0,
    curAmount: 0,
    year: 0,
    percent: 0
  })
  const { showAndHideModal } = useShowAndHideModal()

  const [savingOrUpdating, setSavingOrUpdating] = useState(false)
  const [globalFilterValue, setGlobalFilterValue] = useState('')
  const [errors, setErrors] = useState<any>()
  const [editMode, setEditMode] = useState(false)
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    'Client.fullName': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'PropertyType.description': { value: null, matchMode: FilterMatchMode.CONTAINS }
  })
  const currentContract = useRef<Contract | null>()
  const currentPrice = useRef<IHistorialPrice | null>()
  const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows>()

  const { data, isError, isLoading, error, isFetching, refetch } = useContracts('?state=Finalizado:ne')

  const edit = (data: IHistorialPrice) => {
    updateAll({ ...data, curAmount: data.amount })
    setShowCreateModal(true)
    setEditMode(true)
    currentPrice.current = data
  }
  const ConfirmDestroy = (data: IHistorialPrice) => {
    setShow(!show)
    currentPrice.current = data
  }

  const destroy = async (id: number) => {
    try {
      setSavingOrUpdating(true)
      const res = await http.delete('/price-historial/' + id)
      if (res.data.ok) {
        refetch()
        setShow(false)
        showAndHideModal('Borrado', res.data.message)
      } else {
        showAndHideModal('Error', res.data.message || 'Algo malo ocurrío.', 'red')
      }
    } catch (error: any) {
      if (error.response) showAndHideModal('Error', error.response.data?.message || 'Algo malo ocurrío.', 'red')
    } finally {
      setSavingOrUpdating(false)
    }
  }
  const openModalAddPrice = (data: Contract) => {
    reset()
    setEditMode(false)
    currentPrice.current = null
    currentContract.current = data
    let curYeah =
      data.PriceHistorials.sort((a: IHistorialPrice, b: IHistorialPrice) => a.id - b.id)[data.PriceHistorials.length! - 1]?.year || 1
    let prevAmount =
      data.PriceHistorials.sort((a: IHistorialPrice, b: IHistorialPrice) => a.id - b.id)[data.PriceHistorials.length! - 1]?.amount || 1
    updateAll({ ...values, year: curYeah, curAmount: prevAmount, amount: prevAmount, ContractId: data.id })
    setShowCreateModal(true)
  }
  const closeCreateModal = () => {
    reset()
    setShowCreateModal(false)
    setErrors({})
  }
  const onGlobalFilterChange = (val: any) => {
    const value = val
    let _filters = { ...filters }
    _filters['global'].value = value
    setFilters(_filters)
    setGlobalFilterValue(value)
  }

  const actionBodyTemplate = (rowData: Contract) => {
    return (
      <div className='flex gap-x-3 items-center justify-start'>
        <div onClick={() => openModalAddPrice(rowData)} className='btn-add-price ' title='Ajustar precio siguiente año'>
          <MdOutlineAttachMoney title='Ajustar precio' size={25} />
        </div>
      </div>
    )
  }

  const handleAddPrice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const { error, ok } = validateForm({ ...values })
    setErrors(error)
    if (!ok) return false
    if (editMode) {
      try {
        setSavingOrUpdating(true)
        const res = await http.put(`/price-historial/${currentPrice.current?.id}`, { ...values })
        if (res.data.ok) {
          refetch()
          reset()
          setShowCreateModal(false)
          showAndHideModal('Editado', res.data.message)
        } else {
          showAndHideModal('Error', res.data.message || 'Algo malo ocurrío.', 'red')
        }
      } catch (error: any) {
        if (error.response) showAndHideModal('Error', error.response.data?.message || 'Algo malo ocurrío.', 'red')
      } finally {
        setSavingOrUpdating(false)
      }
    } else {
      try {
        setSavingOrUpdating(true)
        const res = await http.post('/price-historial', { ...values })
        if (res.data.ok) {
          refetch()
          reset()
          setShowCreateModal(false)
          showAndHideModal('Guardado', res.data.message)
        } else {
          showAndHideModal('Error', res.data.message || 'Algo malo ocurrío.', 'red')
        }
      } catch (error: any) {
        if (error.response) showAndHideModal('Error', error.response.data?.message || 'Algo malo ocurrío.', 'red')
      } finally {
        setSavingOrUpdating(false)
      }
    }
  }

  const allowExpansion = (rowData: Contract) => rowData?.PriceHistorials.length > 0 || false

  const rowExpansionTemplate = (data: Contract) => {
    return (
      <div className='p-3'>
        <h2 className='text-lg font-semibold'>Histórico de precio</h2>
        <DataTable
          size='small'
          dataKey='id'
          className='!overflow-hidden   !border-none'
          responsiveLayout='scroll'
          value={data.PriceHistorials}
        >
          <Column
            field='amount'
            body={(data) => <span> $ {data.amount} </span>}
            header='Monto'
            headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
            className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
            sortable
          ></Column>
          <Column
            header='Año'
            field='year'
            headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
            className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
            sortable
          ></Column>
          <Column
            header='Porcentaje'
            field='percent'
            headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
            className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
          ></Column>
          <Column
            headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
            className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
            field='createdAt'
            body={(data) => <span> {formatDate(data.createdAt)} </span>}
            header='Fecha'
          ></Column>
          <Column
            body={actionBodyTemplate2}
            headerClassName='!border-none dark:!bg-gray-800'
            className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
            exportable={false}
            style={{ width: 90 }}
          />
        </DataTable>
      </div>
    )
  }

  const actionBodyTemplate2 = (rowData: IHistorialPrice) => {
    return (
      <div className='flex gap-x-3 items-center justify-center'>
        <EditIcon action={() => edit(rowData)} />
        {/* <DeleteIcon action={() => ConfirmDestroy(rowData)} /> */}
      </div>
    )
  }
  if (isLoading) return <Loading />
  if (isError) return <RequestError error={error} />

  return (
    <BoxContainerPage>
      <HeaderData showBtn={false} action={() => {}} text='Histórico de precio de los Contratos' />
      <CustomInput
        onChange={(val) => onGlobalFilterChange(val)}
        className=' w-auto mx-2 sm:mx-0 sm:w-96'
        initialValue={globalFilterValue}
        placeholder='Buscar contrato'
        type='search'
      />

      <Box className='!p-0 !overflow-hidden !border-none sm:mx-0   mb-4 '>
        <DataTable
          expandedRows={expandedRows}
          onRowToggle={(e: any) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
          size='small'
          emptyMessage='Aún no hay contrato'
          className='!overflow-hidden   !border-none'
          value={data?.data}
          filters={filters}
          globalFilterFields={['Property.street', 'Client.fullName']}
          // paginator
          // rows={RowsToShow}
          // paginatorTemplate='FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink'
          // currentPageReportTemplate='{first} al {last} de {totalRecords}'
          // paginatorLeft={<RefreshData action={refetch} />}
          dataKey='id'
          responsiveLayout='scroll'
        >
          <Column
            expander={allowExpansion}
            headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
            className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
            style={{ width: '0.5rem' }}
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
            body={(data) => (
              <span className={`font-bold ${data.state === 'En curso' ? 'text-green-500' : 'text-red-500'}`}>{data.state} </span>
            )}
            headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
            className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
          />
          <Column
            field=''
            header='Año'
            body={(data: Contract) => (
              <span
                className={`${
                  diferenceBetweentwoDatesInYears(data.startDate, new Date().toISOString().slice(0, 10)) === 3 &&
                  'text-yellow-500 font-bold'
                }`}
              >
                {diferenceBetweentwoDatesInYears(data.startDate, new Date().toISOString().slice(0, 10))}
              </span>
            )}
            headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
            className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
          />
          <Column
            field=''
            header='Monto Actual'
            body={(data) => (
              <span>
                ${' '}
                {
                  data.PriceHistorials.sort((a: IHistorialPrice, b: IHistorialPrice) => a.id - b.id)[data.PriceHistorials.length - 1]
                    ?.amount
                }
              </span>
            )}
            headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
            className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
          />

          <Column
            body={actionBodyTemplate}
            headerClassName='!border-none dark:!bg-gray-800'
            className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
            exportable={false}
            style={{ width: 50 }}
          />
        </DataTable>
      </Box>

      {isFetching && <Loading h={40} w={40} />}

      <DeleteModal
        show={show}
        setShow={setShow}
        savingOrUpdating={savingOrUpdating}
        destroy={() => destroy(currentPrice.current?.id!)}
        text={` El precio del ${currentPrice.current?.year} año con el monto de  $ ${currentPrice.current?.amount}`}
      />
      {/* modal histprial-price */}
      <CreateModal
        show={showCreateModal}
        closeModal={closeCreateModal}
        overlayClick={false}
        titleText='Ajustar precio'
        className='shadow-none border-0 max-w-[500px]'
      >
        <form onSubmit={handleAddPrice}>
          <FieldsetGroup>
            <CustomInput
              disabled={true}
              initialValue={
                editMode
                  ? currentPrice.current?.ContractId
                  : currentContract.current?.Client.fullName +
                    ' - ' +
                    currentContract.current?.Client.cuit +
                    '  | ' +
                    currentContract.current?.Property.street +
                    ' ' +
                    currentContract.current?.Property.number +
                    ' '
              }
              label='Contrato'
              onChange={(val) => {}}
              placeholder=''
            />
          </FieldsetGroup>
          <FieldsetGroup>
            <CustomInput
              placeholder='40'
              type='number'
              min={0}
              initialValue={percent}
              label='% de aumento'
              onChange={(value) => {
                // handleInputChange(value, 'percent')
                // updateAll({ ...values, percent: Number(value) })
                if (currentContract.current?.PriceHistorials) {
                  let prevValue =
                    currentContract.current?.PriceHistorials[currentContract.current?.PriceHistorials.length! - 1]?.amount || 1
                  let v = prevValue * (Number(value) / 100)
                  updateAll({ ...values, amount: Number(v.toFixed(2)) + prevValue, percent: Number(value) })
                  // handleInputChange(v + prevValue, 'amount')
                } else {
                  handleInputChange(value, 'percent')
                }
              }}
              hasError={errors?.percent}
              errorText='El porcentaje  es obligatorio.[1,100]'
            />
            <fieldset className=''>
              <label htmlFor='year'>Año</label>
              <Dropdown
                value={year}
                // disabled={!editMode}
                onChange={(e) => handleInputChange(e.value, 'year')}
                options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                placeholder='Elije el año'
                name='year'
                className='h-[42px] items-center !border-gray-200 dark:!border-gray-700 shadow dark:bg-slate-900 dark:!text-slate-400 '
              />
              {errors?.year && <FormError text='El año  es obligatorio.' />}
            </fieldset>
          </FieldsetGroup>

          <FieldsetGroup className='items-center justify-center'>
            <fieldset>
              <label htmlFor='curAmount'>Monto Actual</label>
              <input placeholder='123.99' disabled={true} type='number' value={curAmount} onChange={(e: any) => {}} />
              {errors?.curAmount && <FormError text='El monto del contrato es obligatorio.' />}
            </fieldset>{' '}
            <fieldset>
              <label htmlFor='amount'>Monto futuro </label>
              <input
                placeholder='123.99'
                disabled={!editMode}
                type='number'
                value={amount}
                onChange={(e: any) => handleInputChange(e.target.value, 'amount')}
              />
              {errors?.amount && <FormError text='El monto del contrato es obligatorio.' />}
            </fieldset>
          </FieldsetGroup>
          <FormActionBtns savingOrUpdating={savingOrUpdating} onClose={closeCreateModal} />
        </form>
      </CreateModal>
    </BoxContainerPage>
  )
}

export default HistorialPrices
