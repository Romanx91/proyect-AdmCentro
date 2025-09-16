import React, { useRef, useState } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column, ColumnFilterElementTemplateOptions } from 'primereact/column'
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
import { useContracts } from '../../hooks/useContracts'
import FieldsetGroup from '../../components/FieldsetGroup'
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown'
import { FilterMatchMode, FilterOperator } from 'primereact/api'
import { useEventualities } from '../../hooks/useEventualities'
import { IEventuality } from '../../interfaces/Ieventualities'
import CustomTextArea from '../../components/CustomTextArea'
import { addDate, diffenceBetweenDates, formatDateDDMMYYYY } from '../../helpers/date'
import useShowAndHideModal from '../../hooks/useShowAndHideModal'
import { validateForm } from '../../helpers/form'
import HeaderData from '../../components/HeaderData'
import RefreshData from '../../components/RefreshData'
import { EmptyData } from '../../components/EmptyData'
import CloseOnClick from '../../components/CloseOnClick'
import FormActionBtns from '../../components/FormActionBtns'
import { useProperties } from '../../hooks/useProperties'
import BoxContainerPage from '../../components/BoxContainerPage'
import { formatPrice } from '../../helpers/numbers'
import { IHistorialPrice } from '../../interfaces/Icontracts'

const Eventualities = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [show, setShow] = useState(false)
  const { description, clientAmount, expiredDate, ownerAmount, PropertyId, ContractId, values, handleInputChange, reset, updateAll } =
    useForm({
      PropertyId: null as number | null,
      ContractId: null as number | null,
      clientAmount: 0,
      ownerAmount: 0,
      description: '',
      expiredDate: addDate(new Date().toISOString(), 1, 'days').toISOString().slice(0, 10)
    })
  const [savingOrUpdating, setSavingOrUpdating] = useState(false)
  const [errors, setErrors] = useState<any>()
  const [editMode, setEditMode] = useState(false)
  const [globalFilterValue, setGlobalFilterValue] = useState('')
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    description: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    // 'Property.id': { value: null, matchMode: FilterMatchMode.EQUALS },
    // 'Property.number': { value: null, matchMode: FilterMatchMode.CONTAINS },
    PropertyId: { value: null, matchMode: FilterMatchMode.EQUALS }
    // 'Property.street': { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    // description: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    // PropertyId: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
  })
  const currentEventuality = useRef<IEventuality | null>()
  const { showAndHideModal } = useShowAndHideModal()
  const { data, isError, isLoading, error, isFetching, refetch } = useEventualities()
  const contractQuery = useContracts('?state=Finalizado:ne')
  const propertyQuery = useProperties()

  const edit = (data: IEventuality) => {
    updateAll({ ...data })
    setShowCreateModal(true)
    setEditMode(true)
    currentEventuality.current = data
  }

  const ConfirmDestroy = (data: IEventuality) => {
    setShow(!show)
    currentEventuality.current = data
  }

  const onGlobalFilterChange = (val: any) => {
    setGlobalFilterValue('')
    const value = val
    let _filters = { ...filters }
    _filters['global'].value = value
    setFilters(_filters)
    setGlobalFilterValue(value)
  }

  const destroy = async (id: number) => {
    try {
      setSavingOrUpdating(true)
      const res = await http.delete('/eventualities/' + id)
      if (res.data.ok) {
        data?.data && (data.data! = data?.data.filter((z) => z.id !== id))
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

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const { error, ok } = validateForm({ ...values }, [
      'clientPaid',
      'ownerPaid',
      'isReverted',
      'paymentId',
      'ContractId',
      'PropertyId',
      'Contract',
      'Property'
    ])
    setErrors(error)
    if (!ok) return false
    if (!values.ContractId && !values.PropertyId) return setErrors({ ContractId: true, PropertyId: true })
    if (editMode) {
      try {
        setSavingOrUpdating(true)
        const res = await http.put(`/eventualities/${currentEventuality.current?.id}`, { ...values })
        if (res.data.ok) {
          // refetch()
          data?.data &&
            (data.data = data?.data.map((z) => {
              if (z.id === currentEventuality.current?.id) {
                // update contract and property
                z = {
                  ...values,
                  // @ts-expect-error
                  Property: propertyQuery.data?.data.find((x) => x.id === values.PropertyId),
                  // @ts-expect-error
                  Contract: contractQuery.data?.data.find((x) => x.id === values.ContractId)
                }
                // eslint-disable-line no-use-before-define
              }
              return z
            }))
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
        const res = await http.post('/eventualities', { ...values })
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

  const closeCreateModal = () => {
    reset()
    setShowCreateModal(false)
    setErrors({})
  }

  const actionBodyTemplate = (rowData: any) => {
    return (
      <div className='flex gap-x-3 items-center justify-center'>
        <EditIcon action={() => edit(rowData)} />
        <DeleteIcon action={() => ConfirmDestroy(rowData)} />
      </div>
    )
  }
  const openCreateOrEditModel = () => {
    setEditMode(false)
    currentEventuality.current = null
    setShowCreateModal(true)
  }
  const propertiesFilterTemplate = (option: ColumnFilterElementTemplateOptions) => {
    return (
      <Box className='!m-0 !p-0'>
        <Dropdown
          value={option.value}
          // name='PropertyId'
          onChange={(e: DropdownChangeEvent) => option.filterApplyCallback(e.value)}
          options={propertyQuery.data?.data}
          optionLabel='id'
          showClear
          filterPlaceholder='Busca propiedad'
          optionValue='id'
          filterBy='street,number,dept,floor'
          placeholder='Elije una propiedad'
          filter
          valueTemplate={(data, props) =>
            !data ? (
              props.placeholder
            ) : (
              <span>
                {data.street} {data.number} {data.floor}-{data.dept}
              </span>
            )
          }
          itemTemplate={(data) => (
            <span>
              {' '}
              {data.street} {data.number} {data.floor}-{data.dept}{' '}
            </span>
          )}
          className='h-[42px] items-center w-full sm:w-80 !border-gray-200 shadow'
        />
      </Box>
    )
  }
  if (isLoading) return <Loading />
  if (isError) return <RequestError error={error} />

  return (
    <BoxContainerPage>
      <HeaderData action={openCreateOrEditModel} text='Eventualidades' />
      {data.data.length > 0 ? (
        <>
          <Box className='filter-box border-none shadow-none !bg-transparent p-0  sm:!m-0 flex flex-col sm:flex-row items-center gap-6 justify-start'>
            <CustomInput
              onChange={(val) => onGlobalFilterChange(val)}
              className='mx-2 w-full !m-0 sm:mx-0 sm:w-96'
              initialValue={globalFilterValue}
              name='search'
              placeholder='Buscar eventualidad por descripcion'
              fieldsetClassName='w-full sm:w-fit'
              type='search'
            />
          </Box>
          <Box className='!p-0 !overflow-hidden !border-none sm:mx-0  mb-4 '>
            <DataTable
              size='small'
              emptyMessage='No hay eventualidad para ese filtro'
              className='!overflow-hidden   !border-none'
              value={data?.data}
              filters={filters}
              globalFilterFields={['Property.street', 'description', 'PropertyId']}
              // paginator
              // rows={10}
              // paginatorTemplate='FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink'
              // currentPageReportTemplate='{first} al {last} de {totalRecords}'
              // paginatorLeft={<RefreshData action={refetch} />}
              dataKey='id'
              responsiveLayout='scroll'
            >
              <Column
                field='PropertyId'
                body={(data) => (
                  <span>
                    {data.Property ? (
                      <span>
                        {data.Property?.street} {data.Property?.number} {data.Property?.floor} {data.Property?.dept}
                      </span>
                    ) : (
                      <div className='flex items-center gap-1' title={`Pertenece a un contrato de ${data.Contract?.Client.fullName}`}>
                        <div className='w-4 h-4 text-xs bg-sky-400 text-white flex items-center justify-center rounded-full shadow-sm'>
                          C
                        </div>
                        <span>
                          {data.Contract?.Property?.street} {data.Contract?.Property?.number} {data.Contract?.Property?.floor}{' '}
                          {data.Contract?.Property?.dept}
                        </span>
                      </div>
                    )}
                  </span>
                )}
                header='Propiedad'
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
                sortable
                filter
                filterMenuClassName='!bg-gray-100 dark:!bg-slate-700 dark:!text-slate-400 dark:!border-slate-600'
                showClearButton={false}
                showFilterMatchModes={false}
                showApplyButton={false}
                filterElement={propertiesFilterTemplate}
              />
              <Column
                field='clientAmount'
                body={(data) => <span>$ {data.clientAmount}</span>}
                sortable
                header='Monto inquilino'
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
              />
              <Column
                field='ownerAmount'
                body={(data) => <span>$ {data.ownerAmount}</span>}
                sortable
                header='Monto Propietario'
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
              />
              <Column
                field='description'
                body={(data) => (
                  <span title={data.description} className=''>
                    {data.description.slice(0, 30)} {data.description.length > 30 ? '...' : ''}
                  </span>
                )}
                header='Descripción'
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
              />

              <Column
                field='clientPaid'
                body={(data) => (
                  <span className={` ${data.clientPaid || data.clientAmount === 0 ? 'text-green-500' : 'text-red-400'} `}>
                    {data.clientAmount === 0 ? '--' : data.clientPaid ? 'Si' : 'No'}
                  </span>
                )}
                header='Inquilino Pago'
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
              />
              <Column
                field='ownerPaid'
                body={(data) => (
                  <span className={` ${data.ownerPaid || data.ownerAmount === 0 ? 'text-green-500' : 'text-red-400'} `}>
                    {data.ownerAmount === 0 ? '--' : data.ownerPaid ? 'Si' : 'No'}
                  </span>
                )}
                header='Propietario Pago'
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
              />
              <Column
                field='expiredDate'
                sortable
                body={(data) => (
                  <span
                    className={` ${
                      diffenceBetweenDates(data.expiredDate, new Date().toISOString().slice(0, 10)) < 0 ? 'text-green-500' : 'text-red-500'
                    } `}
                  >
                    {formatDateDDMMYYYY(data.expiredDate)}
                  </span>
                )}
                header='Fecha Vencimiento'
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
              />

              <Column
                body={actionBodyTemplate}
                headerClassName='!border-none dark:!bg-gray-800'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
                exportable={false}
                style={{ width: 90 }}
              />
            </DataTable>
          </Box>
        </>
      ) : (
        <EmptyData text='Aún no hay eventualidad' />
      )}

      {isFetching && <Loading h={40} w={40} />}

      <DeleteModal
        savingOrUpdating={savingOrUpdating}
        show={show}
        setShow={setShow}
        destroy={() => destroy(currentEventuality.current?.id!)}
        text={`${currentEventuality.current?.description}`}
      />

      <CreateModal
        show={showCreateModal}
        closeModal={closeCreateModal}
        overlayClick={false}
        titleText='Agregar  eventualidad'
        className='shadow-none border-0 max-w-[650px]'
      >
        <CloseOnClick action={closeCreateModal} />
        <form onSubmit={handleSave}>
          {!PropertyId && (
            <FieldsetGroup>
              <fieldset className=''>
                <label htmlFor='ContractId'>Contrato </label>
                <Dropdown
                  value={ContractId}
                  onChange={(e) => handleInputChange(e.value ?? null, 'ContractId')}
                  options={contractQuery.data?.data}
                  optionLabel='street'
                  showClear
                  valueTemplate={(data, props) =>
                    !data ? (
                      props.placeholder
                    ) : (
                      <span>
                        {' '}
                        {data.Property.Owner.fullName} | {data.Property.street} {data.Property.number} {data.Property.floor}-
                        {data.Property.dept}{' '}
                      </span>
                    )
                  }
                  itemTemplate={(data) => (
                    <div className='flex flex-col gap-1 text-sm'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <div className=' flex items-center justify-center px-1 rounded-full shadow bg-gradient'>
                            <span className='text-xs p-1'>{data.id}</span>
                          </div>
                          <span>{data.Client.fullName}</span>
                          <span>|</span>
                          <span className='text-sm'>
                            {data.Property.street} {data.Property.number} {data.Property.floor}-{data.Property.dept}{' '}
                          </span>
                        </div>
                      </div>

                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2 text-sm'>
                          <span>{data.startDate}</span>
                          <span>|</span>
                          <span>{data.endDate}</span>
                        </div>
                        <span>{data.state}</span>
                      </div>
                    </div>
                  )}
                  filterBy='Client.fullName,Property.street,Property.number,Property.floor,Property.dept'
                  optionValue='id'
                  placeholder='elije contrato'
                  filter
                  filterPlaceholder='Busca contrato'
                  className='h-[42px] items-center !border-gray-200 shadow '
                />
                {errors?.ContractId && <FormError text='El contrato es obligatorio.' />}
              </fieldset>
            </FieldsetGroup>
          )}

          {!ContractId && (
            <FieldsetGroup>
              <fieldset className=''>
                <label htmlFor='PropertyId'>Propiedad</label>
                <Dropdown
                  value={PropertyId}
                  onChange={(e) => {
                    handleInputChange(e.value ?? null, 'PropertyId')
                  }}
                  options={propertyQuery.data?.data}
                  optionLabel='street'
                  showClear
                  filterPlaceholder='Busca propiedad'
                  optionValue='id'
                  filterBy='street,number,dept,floor'
                  placeholder='Elije una propiedad'
                  filter
                  valueTemplate={(data, props) =>
                    !data ? (
                      props.placeholder
                    ) : (
                      <span>
                        {data.street} {data.number} {data.floor}-{data.dept}
                      </span>
                    )
                  }
                  itemTemplate={(data) => (
                    <span>
                      {' '}
                      {data.street} {data.number} {data.floor}-{data.dept}{' '}
                    </span>
                  )}
                  className='h-[42px] items-center !border-gray-200 shadow'
                />
                {PropertyId && PropertyId > 0 ? (
                  <span className='text-blue-600 dark:text-blue-400 text-sm '>
                    Propietario : {propertyQuery.data?.data.find((p) => p.id === PropertyId)?.Owner?.fullName}
                  </span>
                ) : (
                  ''
                )}
                {errors?.PropertyId && <FormError text='La propiedad es obligatoria.' />}
              </fieldset>
            </FieldsetGroup>
          )}

          <FieldsetGroup>
            <CustomInput
              placeholder='0.00'
              type='number'
              initialValue={clientAmount || ''}
              onChange={(value) => handleInputChange(value, 'clientAmount')}
              label='Monto Inquilino'
              disabled={clientAmount === 0 && editMode}
              required
              hasError={errors?.clientAmount}
              errorText='El monto del cliente es obligatorio.'
            />
            <CustomInput
              placeholder='0.00'
              type='number'
              initialValue={ownerAmount || ''}
              onChange={(value) => handleInputChange(value, 'ownerAmount')}
              label='Monto propietario'
              disabled={ownerAmount === 0 && editMode}
              required
              hasError={errors?.ownerAmount}
              errorText='El monto del propietario es obligatorio.'
            />
          </FieldsetGroup>
          <CustomInput
            placeholder=''
            initialValue={expiredDate || ''}
            type='date'
            onChange={(value) => handleInputChange(value, 'expiredDate')}
            label='Fecha Vencimiento'
            required
            hasError={errors?.expiredDate}
            errorText='La fecha de vencimiento es obligatorio.'
          />
          <CustomTextArea
            placeholder='Escribe una breve descripción ...'
            initialValue={description || ''}
            onChange={(value) => handleInputChange(value, 'description')}
            maxLength={255}
            label='Descripción'
            required
            hasError={errors?.description}
            errorText='La descripción es obligatoria.'
          />
          <FormActionBtns savingOrUpdating={savingOrUpdating} onClose={closeCreateModal} />
        </form>
      </CreateModal>
    </BoxContainerPage>
  )
}

export default Eventualities
