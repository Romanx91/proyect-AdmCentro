import React, { useRef, useState } from 'react'
import { DataTable, DataTableFilterMeta } from 'primereact/datatable'
import { Column, ColumnFilterElementTemplateOptions } from 'primereact/column'
import Box from '../../components/Box'
import DeleteModal from '../../components/DeleteModal'
import Loading from '../../components/Loading'
import http from '../../api/axios'
import CreateModal from '../../components/CreateModal'
import CustomInput from '../../components/CustomInput'
import { useForm } from '../../hooks/useForm'
import FormError from '../../components/FormError'
import RequestError from '../../components/RequestError'
import { monthsInSpanish } from '../../helpers/variableAndConstantes'
import FieldsetGroup from '../../components/FieldsetGroup'
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown'
import { useContracts } from '../../hooks/useContracts'
import { usePaymentTypes } from '../../hooks/usePaymentTypes'
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox'
import { IClientExpensesResponseSimple, IClientExpItem } from '../../interfaces/clientExpenses'
import { IEventualitiesResponse, IEventuality } from '../../interfaces/Ieventualities'
import CloseOnClick from '../../components/CloseOnClick'
import { useClientPayments } from '../../hooks/useClientPayments'
import { Idebt, IdebtsResponse } from '../../interfaces/IDebtsResponse'
import { IClienyPayment } from '../../interfaces/IclientPayments'
import { IConfigResponse } from '../../interfaces/Iconfig'
import {
  dateOneIsBiggerThanDateTwo,
  diffenceBetweenDates,
  formatDate,
  formatDateDDMMYYYY,
  padTo2Digits,
  padToNDigit
} from '../../helpers/date'
import { BsPrinter } from 'react-icons/bs'
import { TfiBackLeft } from 'react-icons/tfi'
import { FiAlertTriangle } from 'react-icons/fi'
import logoApp from '../../assets/images/logo.png'
// @ts-expect-error
import html2pdf from 'html2pdf.js'
import useShowAndHideModal from '../../hooks/useShowAndHideModal'
import { validateForm } from '../../helpers/form'
import HeaderData from '../../components/HeaderData'
import RefreshData from '../../components/RefreshData'
import { EmptyData } from '../../components/EmptyData'
import { FilterMatchMode, FilterOperator } from 'primereact/api'
import FormActionBtns from '../../components/FormActionBtns'
import { UUID } from '../../helpers/general'
import CustomTextArea from '../../components/CustomTextArea'
import { IHistorialPrice } from '../../interfaces/Icontracts'
import { formatPrice, roundUp } from '../../helpers/numbers'
import { RiErrorWarningFill } from 'react-icons/ri'
import DropDownIcon from '../../components/DropDownIcon'
import ReceiptHeader from './ReceiptHeader'

const initStateUseForm = {
  extraExpenses: 0,
  ContractId: null,
  PaymentTypeId: null,
  month: monthsInSpanish[new Date().getMonth()],
  year: new Date().getFullYear(),
  total: 0,
  recharge: 0,
  qteDays: 0,
  dailyPunitive: 0,
  PropertyId: null,
  paidTotal: 0,
  obs: '',
  paidTotalText: ''
}
const ClientPayments = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [show, setShow] = useState(false)
  const {
    ContractId,
    PaymentTypeId,
    recharge,
    month,
    year,
    paidTotal,
    updateAll,
    total,
    values,
    qteDays,
    handleInputChange,
    reset,
    dailyPunitive,
    obs,
    paidTotalText
  } = useForm(initStateUseForm)
  const { showAndHideModal } = useShowAndHideModal()
  const [savingOrUpdating, setSavingOrUpdating] = useState(false)
  const [errors, setErrors] = useState<any>()
  const [editMode, setEditMode] = useState(false)
  const [isExpired, setIsExpired] = useState(false)
  const [selectedEventualities, setSelectedEventualities] = useState<IEventuality[]>([])
  const [selectedExpensesClient, setSelectedExpensesClient] = useState<IClientExpItem[]>([])
  const [selectedDebts, setSelectedDebts] = useState<Idebt[]>([])
  const [upToDate, setUpToDate] = useState(false)
  const [twoYearsWithoutPrice, setTwoYearsWithoutPrice] = useState(false)
  const [threeYearsWithoutPrice, setThreeYearsWithoutPrice] = useState(false)
  const [gestionExpensePorc, setGestionExpensePorc] = useState(0)
  const [bankExpenses, setBankExpenses] = useState(0)
  const bankExpensesValue = useRef(0)
  const [GG, setGG] = useState<any>({})
  const eventTotal = useRef(0)
  const expsTotal = useRef(0)
  const debtsTotal = useRef(0)
  const currentPayment = useRef<IClienyPayment | null>()
  const [downloadPdf, setDownloadPdf] = useState(false)
  const [expenseDetails, setExpenseDetails] = useState<IClientExpItem[]>([])
  const [eventualityDetails, setEventualityDetails] = useState<IEventuality[]>([])
  const [debts, setDebts] = useState<Idebt[]>([])
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    month: { value: null, matchMode: FilterMatchMode.EQUALS },
    year: { value: null, matchMode: FilterMatchMode.EQUALS },
    'Contract.Client.fullName': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    createdAt: { value: null, matchMode: FilterMatchMode.EQUALS },
    'PaymentType.name': { value: null, matchMode: FilterMatchMode.EQUALS }
  })

  const [loadingExpenses, setLoadingExpenses] = useState(false)
  const [lastPayment, setLastPayment] = useState<any[]>([])
  const paymentTypeQuery = usePaymentTypes()
  const { data, isError, isLoading, error, isFetching, refetch } = useClientPayments()
  const contractQuery = useContracts('?state=Finalizado:ne')

  const printPdf = async (data: IClienyPayment) => {
    currentPayment.current = data
    setDownloadPdf(true)
  }

  const resetFilters = () => {
    setFilters({
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      month: { value: null, matchMode: FilterMatchMode.EQUALS },
      year: { value: null, matchMode: FilterMatchMode.EQUALS },
      'Contract.Client.fullName': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
      createdAt: { value: null, matchMode: FilterMatchMode.EQUALS },
      'PaymentType.name': { value: null, matchMode: FilterMatchMode.EQUALS }
    })
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
      filename: `${currentPayment.current?.Contract.Client?.fullName}_${currentPayment.current?.month}_${
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

  const ConfirmDestroy = (data: IClienyPayment) => {
    setShow(!show)
    currentPayment.current = data
  }

  const destroy = async (id: number) => {
    try {
      setSavingOrUpdating(true)
      const res = await http.delete('/payment-clients/' + id)
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
    values.total = GG.checked
      ? Number(
          Number(GG.amount) +
            bankExpenses +
            eventTotal.current +
            expsTotal.current +
            debtsTotal.current +
            (selectedExpensesClient.filter((se) => se.paidCurrentMonth).length > 0 ? recharge : 0)
        )
      : eventTotal.current +
        bankExpenses +
        expsTotal.current +
        debtsTotal.current +
        (selectedExpensesClient.filter((se) => se.paidCurrentMonth).length > 0 ? recharge : 0)
    values.total = roundUp(values.total)
    if (selectedExpensesClient.filter((se) => se.paidCurrentMonth).length > 0) {
      values.recharge = roundUp(values.qteDays * values.dailyPunitive)
    } else {
      values.recharge = 0
    }

    const { error, ok } = validateForm({ ...values }, [
      'paidTotal',
      'paidTotalText',
      'extraExpenses',
      'qteDays',
      'recharge',
      'dailyPunitive',
      'obs',
      'PropertyId'
    ])
    setErrors(error)
    if (!ok) return false

    try {
      setSavingOrUpdating(true)
      let cleanExps = GG.checked ? [...selectedExpensesClient, ...selectedDebts, GG] : [...selectedExpensesClient, ...selectedDebts]
      if (bankExpenses > 0) {
        cleanExps.push({
          id: new Date().getTime(),
          description: 'Gastos Bancarios',
          amount: bankExpenses,
          isBankExpense: true,
          createdAt: new Date().toISOString()
        })
      }
      const res = await http.post('/payment-clients', {
        ...values,
        // @ts-expect-error
        ContractId: values.ContractId!.id,
        expenseDetails: cleanExps,
        eventualityDetails: selectedEventualities
      })
      if (res.data.ok) {
        refetch()
        reset()
        closeCreateModal()
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

  const closeCreateModal = () => {
    updateAll({ ...initStateUseForm, ContractId: null })
    setUpToDate(false)
    setTwoYearsWithoutPrice(false)
    setThreeYearsWithoutPrice(false)
    setSelectedEventualities([])
    setSelectedExpensesClient([])
    setEventualityDetails([])
    setExpenseDetails([])
    setDebts([])
    setSelectedDebts([])
    eventTotal.current = 0
    expsTotal.current = 0
    debtsTotal.current = 0
    setShowCreateModal(false)
    setErrors({})
  }

  const actionBodyTemplate = (rowData: IClienyPayment) => {
    return (
      <div className='flex gap-x-3 items-center justify-center'>
        <BsPrinter title='Imprimir comprobante' size={22} onClick={() => printPdf(rowData)} />
        <TfiBackLeft title='Revertir cobro' size={23} onClick={() => ConfirmDestroy(rowData)} />
      </div>
    )
  }

  const onExpensesClienteChange = (e: CheckboxChangeEvent) => {
    let _selectedExps = [...selectedExpensesClient]
    if (e.value.paidCurrentMonth) {
      handleInputChange(roundUp(Number(values.dailyPunitive) * Number(values.qteDays)), 'recharge')
    }
    if (e.checked) _selectedExps.push(e.value)
    else _selectedExps = _selectedExps.filter((evt) => evt.id !== e.value.id)
    expsTotal.current = roundUp(_selectedExps.reduce((acc: any, cur: any) => acc + cur.amount, 0))
    setSelectedExpensesClient(_selectedExps)
  }

  const onDebtsChanges = (e: CheckboxChangeEvent) => {
    let _selectedExps = [...selectedDebts]
    if (e.checked) {
      _selectedExps.push(e.value)
      if (e.value.rent) {
        if (confirm('Deseas cobrar los punitorias ?') === true) {
          let p = debts.find((d) => d.debtParentId === e.value.id)!
          _selectedExps.push(p)
        }
      }
    } else {
      _selectedExps = _selectedExps.filter((evt) => evt.id !== e.value.id)
      if (e.value.rent) {
        _selectedExps = _selectedExps.filter((evt) => evt?.debtParentId !== e.value.id)
      }
    }
    debtsTotal.current = roundUp(_selectedExps.reduce((acc: any, cur: any) => acc + cur.amount, 0))
    setSelectedDebts(_selectedExps)
  }

  const onEventualityChange = (e: CheckboxChangeEvent) => {
    let _selectedEvents = [...selectedEventualities]
    if (e.checked) _selectedEvents.push(e.value)
    else _selectedEvents = _selectedEvents.filter((evt) => evt.id !== e.value.id)
    eventTotal.current = roundUp(_selectedEvents.reduce((acc: any, cur: any) => acc + cur.clientAmount, 0))
    setSelectedEventualities(_selectedEvents)
  }

  const handleChangeContract = async (e: DropdownChangeEvent) => {
    // TODO save currentprice in a variable to use it in the future
    // reset()
    // updateAll(initStateUseForm)
    // handleInputChange('', 'paidTotal')
    // values.paidTotal = 0
    // values.PaymentTypeId = null
    // handleInputChange(0, 'PaymentTypeId')
    setLoadingExpenses(true)
    setUpToDate(false)
    setTwoYearsWithoutPrice(false)
    setThreeYearsWithoutPrice(false)
    setSelectedEventualities([])
    setSelectedExpensesClient([])
    setEventualityDetails([])
    setExpenseDetails([])
    setDebts([])
    setGestionExpensePorc(2)
    setSelectedDebts([])
    setLastPayment([])
    eventTotal.current = 0
    expsTotal.current = 0
    debtsTotal.current = 0
    setBankExpenses(0)
    setIsExpired(false)
    // return
    if (e.value == undefined) {
      updateAll({ ...values, ContractId: null, paidTotal: 0, PaymentTypeId: null })
      setLoadingExpenses(false)
      return
    }

    setGestionExpensePorc(e.value.admFeesPorc)

    // validate if the contract has a  price for his current year
    values.ContractId = e.value
    let daysFrom = diffenceBetweenDates(e.value.startDate, new Date().toISOString().slice(0, 10))
    if (daysFrom >= 365 && daysFrom < 730) {
      if (e.value.PriceHistorials.length < 2) {
        setTwoYearsWithoutPrice(true)
        // return
      }
    } else if (daysFrom >= 730) {
      if (e.value.PriceHistorials.length < 3) {
        setThreeYearsWithoutPrice(true)
        // return
      }
    }

    try {
      const res = await http.get(`/payment-clients?ContractId=${e.value.id}&month=${month}&year=${year}&include=true`)
      if (res.data.results > 0) {
        res.data.data.map((p: any) => setLastPayment((prev: any) => [...prev, ...p.expenseDetails]))
        setUpToDate(true)
        updateAll({
          ...values,
          ContractId: e.value,
          PropertyId: e.value.PropertyId,
          total: 0,
          recharge: 0,
          qteDays: 0,
          PaymentTypeId: null,
          paidTotal: 0
        })
        // return
      }
    } catch (error) {
      showAndHideModal('Error', 'Error al intentar validar si el contrato ya tiene cobro para el mes y ano actual', 'red')
    }

    try {
      setLoadingExpenses(true)
      const docsExpss = http.get<IClientExpensesResponseSimple>(`/client-expenses?amount=0:ne&ContractId=${e.value.id}&include=true`)
      const docsEventss = http.get<IEventualitiesResponse>(
        `/eventualities?clientPaid=0&PropertyId=${e.value.PropertyId}&clientAmount=0:ne&include=true`
      )
      const docsEventsContracts = http.get<IEventualitiesResponse>(`/eventualities?clientPaid=0&ContractId=${e.value.id}&include=true`)
      const dps = http.get<IConfigResponse>(`/config?key=punitorio_diario,gastos_bancarios:or`)
      const docsDebtss = http.get<IdebtsResponse>(`/debt-clients?paid=0&ContractId=${e.value.id}`)
      const [docsExps, docsEvents, dp, docsDebts, eventsContracts] = await Promise.all([
        docsExpss,
        docsEventss,
        dps,
        docsDebtss,
        docsEventsContracts
      ])

      let dailyPunitive: number = Number(dp.data.data.find((d) => d.key === 'punitorio_diario')?.value)

      // starDate to apply new value of the bank expenses 30/08/2021
      // diffenceBetweenDates(new Date(2023, 7, 31).toISOString().slice(0, 10), e.value.startDate) > 0 && e.value.PriceHistorials.sort((a: IHistorialPrice, b: IHistorialPrice) => a.id - b.id)[e.value.PriceHistorials.length - 1]?.amount >= 85000

      // new conditios --> base on the new atributte of the contract paymentType
      if (e.value.paymentType === 'Porcentual') {
        // bacnkExpenses should the 1% of the current price of the contract
        bankExpensesValue.current = roundUp(
          e.value.PriceHistorials.sort((a: IHistorialPrice, b: IHistorialPrice) => a.id - b.id)[e.value.PriceHistorials.length - 1]
            ?.amount / 100
        )
      } else {
        bankExpensesValue.current = Number(dp.data.data.find((d) => d.key === 'gastos_bancarios')?.value)
      }

      setEventualityDetails([...docsEvents.data.data, ...eventsContracts.data.data])
      // validate if the contract is expired before get the expenses
      if (diffenceBetweenDates(new Date().toISOString().slice(0, 10), e.value.endDate) > 0) {
        // expenses section
        setExpenseDetails([
          {
            ContractId: e.value.id,
            date: new Date().toISOString().slice(0, 10),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
            description:
              'ALQUILER ' +
              e.value.Property.street +
              ' ' +
              e.value?.Property?.number +
              ' ' +
              e.value?.Property?.floor +
              ' ' +
              e.value?.Property?.dept +
              ' ' +
              month +
              '/' +
              year,
            amount: e.value.PriceHistorials.sort((a: IHistorialPrice, b: IHistorialPrice) => a.id - b.id)[
              e.value.PriceHistorials.length - 1
            ]?.amount,
            createdAt: new Date().getTime().toString(),
            paidCurrentMonth: true,
            id: UUID()
          },
          // {
          // 	ContractId: e.value.id,
          // 	date: new Date().toISOString().slice(0, 10),
          // 	updatedAt: new Date().toISOString(),
          // 	deletedAt: null,
          // 	description: 'GASTOS BANCARIOS' + ' ' + month + '/' + year,
          // 	amount: bankExpenses,
          // 	createdAt: (new Date().getTime().toString()),
          // 	id: UUID()
          // },
          ...docsExps.data.data
            .filter((d) => {
              if (d.description !== 'AGUAS' && d.description !== 'API') {
                return d
              } else {
                if (d.description === 'AGUAS' && (new Date().getMonth() + 1) % 2 === 0) {
                  return d
                }
                if (d.description === 'API' && (new Date().getMonth() + 1) % 2 !== 0) {
                  return d
                }
              }
            })
            .map((d) => {
              return { ...d, description: d.description + ' ' + month + '/' + year }
            })
        ])
        setGG({
          ContractId: e.value.id,
          date: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
          description: 'GASTOS DE GESTION ' + month + '/' + year,
          amount: roundUp(
            (e.value.admFeesPorc / 100) *
              e.value.PriceHistorials.sort((a: IHistorialPrice, b: IHistorialPrice) => a.id - b.id)[e.value.PriceHistorials.length - 1]
                ?.amount
          ),
          createdAt: new Date().getTime().toString(),
          id: UUID(),
          checked: false
        })
      } else {
        setIsExpired(true)
      }

      setDebts(docsDebts.data.data)

      docsDebts.data.data.map((d) => {
        if (d.rent) {
          let qtyDay = diffenceBetweenDates(d.year + '-' + padTo2Digits(d.month) + '-05', new Date().toString())
          setDebts((debts) => [
            ...debts,
            {
              ...d,
              description: 'PUNITORIOS ' + d.description,
              // tomar el monto de la deuda en lugar del monto actual d.amount
              // amount: roundUp((qtyDay * e.value.PriceHistorials[e.value.PriceHistorials.length - 1]?.amount * (dailyPunitive / 100))), // TODO :: tener en cuenta el cambio de ano
              amount: roundUp(qtyDay * d.amount * (dailyPunitive / 100)),
              createdAt: new Date().getTime().toString(),
              rent: false,
              debtParentId: d.id!,
              debt: false,
              id: UUID(),
              recharge: true
            }
          ])
        }
      })
      let day = new Date().getDate()
      if (day > 5) {
        let qte = day - 5
        updateAll({
          ...values,
          PropertyId: e.value.PropertyId,
          recharge: roundUp(
            qte *
              e.value.PriceHistorials.sort((a: IHistorialPrice, b: IHistorialPrice) => a.id - b.id)[e.value.PriceHistorials.length - 1]
                ?.amount *
              (dailyPunitive / 100)
          ),
          qteDays: qte,
          ContractId: e.value,
          PaymentTypeId: null,
          paidTotal: 0,
          dailyPunitive:
            e.value.PriceHistorials.sort((a: IHistorialPrice, b: IHistorialPrice) => a.id - b.id)[e.value.PriceHistorials.length - 1]
              ?.amount *
            (dailyPunitive / 100),
          total: roundUp(
            qte *
              e.value.PriceHistorials.sort((a: IHistorialPrice, b: IHistorialPrice) => a.id - b.id)[e.value.PriceHistorials.length - 1]
                ?.amount *
              (dailyPunitive / 100)
          )
        })
      } else {
        updateAll({
          ...values,
          ContractId: e.value,
          PropertyId: e.value.PropertyId,
          PaymentTypeId: null,
          paidTotal: 0
        })
      }
    } catch (error) {
    } finally {
      setLoadingExpenses(false)
    }
  }

  const openCreateOrEditModel = () => {
    setEditMode(false)
    currentPayment.current = null
    setShowCreateModal(true)
  }

  const monthFilterTemplate = (option: ColumnFilterElementTemplateOptions) => {
    return (
      <Box className='!m-0 !p-0'>
        <Dropdown
          value={option.value}
          onChange={(e: DropdownChangeEvent) => option.filterApplyCallback(e.value)}
          options={monthsInSpanish}
          showClear
          placeholder='elije mes'
          className='h-[42px]   items-center w-full !border-gray-200 shadow '
        />
      </Box>
    )
  }

  const dateFilterTemplate = (option: ColumnFilterElementTemplateOptions) => {
    return (
      <Box className='!m-0 !p-0'>
        <CustomInput
          initialValue={option.value ?? ''}
          onChange={(e: string) => option.filterApplyCallback(e)}
          type='date'
          placeholder='elije fecha'
          fieldsetClassName='!mt-0'
        />
      </Box>
    )
  }
  const paymentTypeFilterTemplate = (option: ColumnFilterElementTemplateOptions) => {
    return (
      <Box className='!m-0 !p-0'>
        <Dropdown
          value={option.value ?? ''}
          onChange={(e: DropdownChangeEvent) => option.filterApplyCallback(e.value)}
          options={paymentTypeQuery?.data?.data}
          optionLabel='name'
          showClear
          optionValue='name'
          placeholder='elije format de pago'
          className='h-[42px]   items-center w-full !border-gray-200 shadow '
        />
      </Box>
    )
  }
  const clientsFilterTemplate = (option: ColumnFilterElementTemplateOptions) => {
    return (
      <Box className='!m-0 !p-0'>
        <Dropdown
          value={option.value ?? ''}
          onChange={(e: DropdownChangeEvent) => option.filterApplyCallback(e.value)}
          options={contractQuery.data?.data}
          optionLabel='Client.fullName'
          showClear
          filterBy='Client.fullName'
          optionValue='Client.fullName'
          placeholder='elije contrato'
          filter
          filterPlaceholder='Busca contrato'
          className='h-[42px]   items-center w-60 !border-gray-200 shadow '
        />
      </Box>
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

  if (isLoading) return <Loading />
  if (isError) return <RequestError error={error} />

  return (
    <div className='container m-auto  flexsm:mx-0  flex-col justify-center sm:justify-center'>
      <HeaderData action={openCreateOrEditModel} text='Cobro a Inquilino' />

      {data?.data.length > 0 ? (
        <>
          <button
            className='btn dark:bg-transparent dark:text-slate-400 dark:border hover:!text-slate-500 active:text-slate-500 border-slate-700 '
            onClick={resetFilters}
          >
            Borrar filtros
          </button>
          <Box className='!p-0 !overflow-hidden !border-none sm:mx-0    mb-4 '>
            <DataTable
              size='small'
              emptyMessage='No hay cobro para ese filtro'
              className='!overflow-hidden   !border-none'
              value={data?.data}
              dataKey='id'
              filters={filters}
              filterDisplay='menu'
              globalFilterFields={[
                'month',
                'year',
                'Contract.Property.street',
                'Contract.Client.fullName',
                'ContractId',
                'PaymentType.name'
              ]}
              responsiveLayout='scroll'
              // paginator
              // rows={10}
              // paginatorTemplate='FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink'
              // currentPageReportTemplate='{first} al {last} de {totalRecords}'
              // paginatorLeft={<RefreshData action={refetch} />}
            >
              <Column
                field='Contract.Client.fullName'
                body={(data) => <span>{data.Contract?.Client?.fullName}</span>}
                header='Inquilino'
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
                sortable
                filter
                filterMenuClassName='!bg-gray-100 dark:!bg-slate-700 dark:!text-slate-400 dark:!border-slate-600'
                showClearButton={false}
                showFilterMatchModes={false}
                showApplyButton={false}
                filterElement={clientsFilterTemplate}
              />
              <Column
                field='Contract.Property.street'
                body={(data) => (
                  <span>
                    {data.Contract?.Property.street} {data.Contract?.Property.number} {data.Contract?.Property.floor}{' '}
                    {data.Contract?.Property.dept}
                  </span>
                )}
                header='Propiedad'
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
                sortable
              />
              <Column
                field='month'
                body={periodTemplate}
                header='Periodo'
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
                sortable
                filter
                filterMenuClassName='!bg-gray-100 dark:!bg-slate-700 dark:!text-slate-400 dark:!border-slate-600'
                showClearButton={false}
                showFilterMatchModes={false}
                showApplyButton={false}
                filterElement={monthFilterTemplate}
              />
              <Column
                field='createdAt'
                body={(data) => <span>{formatDateDDMMYYYY(data.createdAt)}</span>}
                header='Fecha de Cobro'
                headerClassName='!border-none dark:!bg-gray-800 dark:!text-slate-400'
                className='dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 '
                sortable
                filter
                filterMenuClassName='!bg-gray-100 dark:!bg-slate-700 dark:!text-slate-400 dark:!border-slate-600'
                showClearButton={false}
                showFilterMatchModes={false}
                showApplyButton={false}
                filterElement={dateFilterTemplate}
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
                filter
                filterMenuClassName='!bg-gray-100 dark:!bg-slate-700 dark:!text-slate-400 dark:!border-slate-600'
                showClearButton={false}
                showFilterMatchModes={false}
                showApplyButton={false}
                filterElement={paymentTypeFilterTemplate}
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
        <EmptyData text='Aún no hay Cobro' />
      )}

      {isFetching && <Loading h={40} w={40} />}

      <DeleteModal
        show={show}
        savingOrUpdating={savingOrUpdating}
        setShow={setShow}
        customTitle='Revertir Cobro'
        customMessage={`¿Estás seguro que querés revertir el cobro de ${currentPayment.current?.Contract.Client?.fullName} ${currentPayment.current?.month}/${currentPayment.current?.year}?`}
        destroy={() => destroy(currentPayment.current?.id!)}
      />
      <CreateModal
        show={downloadPdf}
        closeModal={closePrintPdfModal}
        overlayClick={false}
        overflowY='hidden'
        headerClass='sticky top-0 bg-white border-b shadow p-4'
        className='shadow-none border-0 dark:bg-white dark:text-slate-700 w-fit max-w-5xl !p-0'
        titleText={`Recibo  ${currentPayment.current?.month}/${currentPayment.current?.year}`}
      >
        <CloseOnClick action={closePrintPdfModal} />
        <div className='!shadow-none rounded-lg  !border-none overflow-y-auto max-h-[450px] dark:bg-white dark:text-slate-700  border-gray-200  mt-3'>
          <div id='pdf-download' className='flex gap-x-2 '>
            {[1, 2].map((pdf, index) => (
              <div key={index} className='flex justify-between flex-col border border-gray-200 p-1 text-xs  min-h-[750px] ] !w-[550px]'>
                <ReceiptHeader date={currentPayment.current?.createdAt} />
                <div className='client-data border border-gray-200  my-2 p-2 flex '>
                  <div className='flex flex-col gap-y-2 flex-1'>
                    <span>
                      <span className='font-semibold'>Inquilino: </span>
                      <span>{currentPayment.current?.Contract.Client?.fullName}</span>
                    </span>
                    <span>
                      <span className='font-semibold'>Domicilio: </span>
                      <span>{currentPayment.current?.Contract.Client?.address}</span>
                    </span>
                  </div>
                  <div className='w-30  flex gap-x-4'>
                    <div className=''>
                      <div>C {currentPayment.current?.Contract.Property.folderNumber} </div>

                      <div className=''>
                        <span className='flex gap-x-2'>
                          <span>Recibo</span>
                          <span className=''>{padToNDigit(currentPayment.current?.id || 0, 4)}</span>
                        </span>
                        <span className=''>Ajuste c/{currentPayment.current?.Contract.adjustmentMonth!} meses</span>
                      </div>
                    </div>
                    <div className='flex flex-col  items-center'>
                      <span className='font-semibold'>Vencimiento</span>
                      <span className='font-semibold'>del contrato</span>
                      <span className='!text-xs '>
                        {formatDateDDMMYYYY(currentPayment.current?.Contract.startDate!)} {' / '}
                        {formatDateDDMMYYYY(currentPayment.current?.Contract.endDate!)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className='payment-pdf px-2 mb-3 flex-1 gap-y-1 flex flex-col font-normal '>
                  {currentPayment.current?.expenseDetails.map((evt, index) => (
                    <div
                      key={index}
                      className='align-items-center uppercase  text-xs  flex gap-x-3 items-center  justify-between  border-gray-300'
                    >
                      <span className=''>{evt.description}</span>
                      <span>${evt.amount}</span>
                    </div>
                  ))}
                  {currentPayment.current?.recharge! > 0 && (
                    <div className='align-items-center uppercase text-xs  flex gap-x-3 items-center  justify-between border-gray-300'>
                      <span className=''>
                        PUNITORIOS {currentPayment.current?.month} {currentPayment.current?.year.toString()}
                      </span>
                      <span>${currentPayment.current?.recharge}</span>
                    </div>
                  )}
                  {currentPayment.current?.eventualityDetails.map((evt, index) => (
                    <div
                      key={index}
                      className='align-items-center uppercase text-xs  flex gap-x-3 items-center  justify-between border-gray-300'
                    >
                      <span className=''>{evt.description}</span>
                      <span>${evt.clientAmount}</span>
                    </div>
                  ))}

                  {currentPayment.current?.obs && (
                    <div className='text-xs border p-1 pb-2 mt-1 border-gray-300'>
                      <span className=''>Observaciones : </span>
                      <span>{currentPayment.current?.obs}</span>
                    </div>
                  )}
                </div>
                <div className='mt-auto p-2 font-normal border border-gray-200'>
                  <div className='align-items-center   text-xs  flex gap-x-3 items-center  justify-between  border-gray-300'>
                    <span className=''>Total </span>
                    <span className=''>${roundUp(currentPayment.current?.total!)}</span>
                  </div>
                  {
                    // @ts-expect-error
                    currentPayment.current?.paidTotal > 0 && (
                      <>
                        <div className='align-items-center   text-xs  flex gap-x-3 items-center  justify-between border-gray-300'>
                          <span className=''>Total cobrado </span>
                          <span className=''>${roundUp(currentPayment.current?.paidTotal!)}</span>
                        </div>
                        <div className='align-items-center   text-xs  flex gap-x-3 items-center  justify-between  border-gray-300'>
                          <span className=''>Diferencia </span>
                          <span className=''>${roundUp(currentPayment.current?.total!) - roundUp(currentPayment.current?.paidTotal!)}</span>
                        </div>
                      </>
                    )
                  }

                  <div className='align-items-center   text-xs  flex gap-x-3 items-center  justify-between  border-gray-300'>
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
            ))}
          </div>
          <div className='flex gap-x-2 sticky bottom-0 bg-white px-4'>
            <button className='btn sec  !my-4' disabled={loadingPdf} onClick={closePrintPdfModal}>
              {' '}
              Cancelar{' '}
            </button>
            <button className='btn gradient !text-sm !my-4' disabled={loadingPdf} onClick={handleDownloadPdf}>
              {' '}
              {loadingPdf ? 'DESCARGANDO... ' : 'DESCARGAR'}{' '}
            </button>
          </div>
        </div>
      </CreateModal>

      <CreateModal
        show={showCreateModal}
        closeModal={closeCreateModal}
        overlayClick={false}
        titleText={'Cobros'}
        className=' max-w-7xl mx-auto'
        custom
      >
        <CloseOnClick action={closeCreateModal} />
        <div className='flex w-full flex-col md:flex-row gap-x-4 mt-3 '>
          <form
            onSubmit={handleSave}
            className='w-full  sm:flex-grow-[50%] sm:min-w-[600px] border border-gray-100 dark:border-slate-600 p-2'
          >
            <FieldsetGroup>
              <fieldset>
                <label htmlFor='ContractId'>Contrato </label>
                <Dropdown
                  value={ContractId}
                  onChange={handleChangeContract}
                  options={contractQuery.data?.data}
                  optionLabel='street'
                  showClear
                  dropdownIcon={() => <DropDownIcon />}
                  valueTemplate={(data, props) =>
                    !data ? (
                      props.placeholder
                    ) : (
                      <span>
                        {' '}
                        {data.Client.fullName} | {data.Property.street} {data.Property.number} {data.Property.floor}-{data.Property.dept}{' '}
                      </span>
                    )
                  }
                  itemTemplate={(data) => (
                    <div className='flex flex-col gap-1'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <div className=' flex items-center justify-center px-1 rounded-full shadow bg-gradient'>
                            <span className='text-xs p-1'>{data.id}</span>
                          </div>
                          <span>{data.Client.fullName}</span>
                          <span>|</span>
                          <span>
                            {data.Property.street} {data.Property.number} {data.Property.floor}-{data.Property.dept}{' '}
                          </span>
                        </div>
                        <span>
                          $
                          {formatPrice(
                            data.PriceHistorials.sort((a: IHistorialPrice, b: IHistorialPrice) => a.id - b.id)[
                              data.PriceHistorials.length - 1
                            ]?.amount
                          )}
                        </span>
                      </div>

                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <span>{data.startDate}</span>
                          <span>|</span>
                          <span>{data.endDate}</span>
                        </div>
                        <span>{data.state}</span>
                      </div>
                    </div>
                  )}
                  filterBy='Client.fullName,Property.street,Property.number,Property.floor,Property.dept'
                  // optionValue='id'
                  placeholder='elije contrato'
                  filter
                  filterPlaceholder='Busca contrato'
                  className='h-[42px] !w-full  items-center !border-gray-200 shadow '
                />
                {/* @ts-expect-error */}
                {ContractId?.id > 0 && (
                  <div className='flex items-center gap-4'>
                    <span className='text-blue-600 dark:text-blue-400 text-sm '>
                      {/* @ts-expect-error */}
                      Propietario : {ContractId?.Property?.Owner?.fullName}
                    </span>
                    <span className='text-blue-600 dark:text-blue-400 text-sm '>
                      {/* @ts-expect-error */}
                      Vigencia : {formatDateDDMMYYYY(ContractId?.startDate)} | {formatDateDDMMYYYY(ContractId?.endDate)}
                    </span>
                    {/* @ts-expect-error */}
                    <span className='text-blue-600 dark:text-blue-400 text-sm '>Estado : {ContractId?.state}</span>
                    {/* @ts-expect-error */}
                    <span className='text-blue-600 dark:text-blue-400 text-sm '>Ajuste : {ContractId?.adjustmentMonth} meses</span>
                  </div>
                )}
                {errors?.ContractId && <FormError text='El contrato es obligatorio.' />}
              </fieldset>
              <div className='flex w-full sm:w-20 flex-col mt-4'>
                <label htmlFor='gestionExpensePorc'>%Gestion </label>
                <input
                  value={gestionExpensePorc}
                  placeholder='0.00'
                  type='number'
                  className={`dark:!bg-gray-900 dark:text-slate-400 w-full  border !border-gray-300 dark:!border-slate-700 !shadow `}
                  min={1}
                  max={10}
                  onChange={(e) => {
                    setGestionExpensePorc(Number(e.target.value))
                    setGG((prev: any) => ({
                      ...prev,
                      amount: (
                        (Number(e.target.value) / 100) *
                        // @ts-expect-error
                        ContractId?.PriceHistorials.sort((a: IHistorialPrice, b: IHistorialPrice) => a.id - b.id)[
                          (ContractId as any)?.PriceHistorials.length - 1
                        ]?.amount
                      ).toFixed(2)
                    }))
                  }}
                />
              </div>
            </FieldsetGroup>

            {upToDate && ContractId && (
              <div className='text-green-500 dark:text-green-400 text-center my-2'>
                {/* @ts-ignore */}
                Ya cobraste {lastPayment.length} concepto(s) para el/los mes(es) de{' '}
                {Array.from(
                  new Set(
                    lastPayment.map((it) =>
                      typeof it.month === 'number' ? monthsInSpanish[it.month - 1] : it.month?.length ? it.month : month
                    )
                  )
                ).join(',')}
              </div>
            )}

            {twoYearsWithoutPrice && (
              <Box className='dark:!text-red-500 dark:!bg-red-100 rounded-none text-center !p-2 !bg-red-200 mx-0 border-0 my-2 flex items-center gap-4 '>
                <FiAlertTriangle size={25} />
                El contrato no tiene precio cargado para el 2 año !
              </Box>
            )}
            {threeYearsWithoutPrice && (
              <Box className='dark:!text-red-500 dark:!bg-red-100 text-center rounded-none !p-2 !bg-red-200 mx-0 border-0 my-2 flex items-center gap-4 '>
                <FiAlertTriangle size={25} />
                El contrato no tiene precio cargado para el 3 año !
              </Box>
            )}
            {ContractId !== null && isExpired && (
              <Box className='dark:!text-red-500 dark:!bg-red-100 text-center rounded-none !p-2 !bg-red-200 mx-0 border-0 my-2 flex items-center gap-4 '>
                <FiAlertTriangle size={25} />
                {/* @ts-ignore */}
                Este contrato esta vencido . Vencio el {formatDateDDMMYYYY(ContractId.endDate)} !
              </Box>
            )}

            {!loadingExpenses ? (
              <div className='mt-4'>
                {/* @ts-ignore */}
                {/* && ContractId !== null && dateOneIsBiggerThanDateTwo(ContractId.endDate!, new Date().toLocaleString().slice(0, 10)) */}

                {expenseDetails.length > 0 && (
                  <div className=' border border-gray-300 dark:border-slate-700 dark:bg-slate-900 p-2'>
                    <h1 className='title-form mb-2'>Gastos inquilino</h1>
                    <div className='eventualities-section flex flex-col   gap-y-2 gap-x-3'>
                      {expenseDetails.map((evt, index) => (
                        <div
                          key={evt.id.toString() + evt.createdAt + index + evt.amount + evt.description}
                          title={
                            lastPayment.filter((item: any) => item.description === evt.description && item.ContractId === evt.ContractId)
                              .length > 0
                              ? 'Ya cobraste este concepto en el mes actual'
                              : ''
                          }
                          className='align-items-center flex items-center flex-wrap   border border-gray-300 dark:border-slate-500 p-2'
                        >
                          <Checkbox
                            inputId={evt.id.toString() + evt.createdAt + index + evt.amount + evt.description}
                            name='expenseClients'
                            value={evt}
                            disabled={
                              lastPayment.filter((item: any) => item.description === evt.description && item.ContractId === evt.ContractId)
                                .length > 0
                            }
                            onChange={onExpensesClienteChange}
                            checked={selectedExpensesClient.some((item: any) => item.id === evt.id)}
                          />
                          <label
                            htmlFor={evt.id.toString() + evt.createdAt + index + evt.amount + evt.description}
                            className={` ml-2  ${
                              lastPayment.filter((item: any) => item.description === evt.description && item.ContractId === evt.ContractId)
                                .length > 0
                                ? ' cursor-not-allowed opacity-60 line-through'
                                : 'cursor-pointer'
                            } `}
                          >
                            ${evt.amount} | {evt.description}
                          </label>
                        </div>
                      ))}
                      <div
                        key={GG.id.toString() + GG.createdAt + GG.amount + GG.description}
                        className='align-items-center flex items-center flex-wrap   border border-gray-300 dark:border-slate-500 p-2'
                      >
                        <Checkbox
                          inputId={GG.id.toString() + GG.createdAt + GG.amount + GG.description}
                          name='expense-gestion'
                          value={GG}
                          disabled={
                            lastPayment.filter((item: any) => item.description === GG.description && item.ContractId === GG.ContractId)
                              .length > 0
                          }
                          title={upToDate ? 'Ya cobraste este  mes de ' + month + ' ' + year : ''}
                          onChange={() => {
                            setGG((prev: any) => ({ ...prev, checked: !GG.checked }))
                          }}
                          checked={GG.checked}
                        />
                        <label
                          htmlFor={GG.id.toString() + GG.createdAt + GG.amount + GG.description}
                          className={` ml-2  ${
                            lastPayment.filter((item: any) => item.description === GG.description && item.ContractId === GG.ContractId)
                              .length > 0
                              ? ' cursor-not-allowed opacity-60 line-through'
                              : 'cursor-pointer'
                          } `}
                        >
                          ${GG.amount} | {GG.description}
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {eventualityDetails.length > 0 && (
                  <div className='my-4  border border-gray-300 dark:border-slate-700 dark:bg-slate-900 p-2'>
                    <h1 className='title-form mb-2'>Eventualidades</h1>
                    <div className='eventualities-section flex flex-col gap-y-2 gap-x-3'>
                      {eventualityDetails.map((evt, index) => (
                        <div
                          key={evt.updatedAt + evt.description + index + evt.id + evt.clientAmount}
                          className='align-items-center flex items-center  flex-wrap   border border-gray-300 dark:border-slate-500 p-2'
                        >
                          <Checkbox
                            inputId={evt.updatedAt + evt.description + index + evt.id + evt.clientAmount}
                            value={evt}
                            name='eventuality'
                            onChange={onEventualityChange}
                            checked={selectedEventualities.some((item: any) => item.id === evt.id)}
                          />
                          <label
                            htmlFor={evt.updatedAt + evt.description + index + evt.id + evt.clientAmount}
                            className='ml-2 flex items-center gap-x-2'
                          >
                            {
                              // @ts-ignore
                              evt.ContractId === ContractId?.id && (
                                <div
                                  title='Eventualidad pertenece al contrato'
                                  className='w-4 h-4 text-xs bg-sky-400 text-white flex items-center justify-center rounded-full shadow-sm'
                                >
                                  C
                                </div>
                              )
                            }

                            <span>
                              ${evt.clientAmount} | {evt.description}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {debts.length > 0 && (
                  <div className='my-4  border border-gray-300 dark:border-slate-700 dark:bg-slate-900 p-2'>
                    <h1 className='title-form mb-2'>Deudas anteriores</h1>
                    <div className='eventualities-section flex flex-col gap-y-2 gap-x-3'>
                      {debts
                        .sort((a, b) =>
                          a.year.toString().concat(a.month.toString()).localeCompare(b.year.toString().concat(b.month.toString()))
                        )
                        .map((evt, index) => (
                          <div
                            key={evt.updatedAt + evt.id + evt.description + evt.amount + index}
                            className={`align-items-center flex items-center  flex-wrap border border-gray-300 dark:border-slate-500 p-1 ${
                              diffenceBetweenDates(evt.year + '-' + padTo2Digits(evt.month) + '-10', new Date().toString()) > 70
                                ? ' !border-red-500'
                                : ''
                            }`}
                          >
                            <Checkbox
                              inputId={evt.updatedAt + evt.id + evt.description + evt.amount + index}
                              value={evt}
                              name='debtsClients'
                              disabled={evt.debtParentId !== undefined}
                              onChange={onDebtsChanges}
                              checked={selectedDebts.some((item: any) => item.id === evt.id)}
                            />
                            <label htmlFor={evt.updatedAt + evt.id + evt.description + evt.amount + index} className='ml-2 '>
                              <span className=''>
                                $ {evt.amount} | {evt.description}
                              </span>
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Loading />
            )}
            <FieldsetGroup>
              <FieldsetGroup className='w-full sm:w-[50%] '>
                <CustomInput
                  initialValue={month || ''}
                  disabled={true}
                  placeholder=''
                  onChange={(v) => {}}
                  label='Mes'
                  required
                  hasError={errors?.month}
                  errorText='El mes de pago es obligatorio.'
                />
                {/* <Dropdown
										value={month || ''}
										placeholder='Elija un mes'
										filterPlaceholder='Busca mes'
										options={monthsInSpanish}
										onChange={(event: DropdownChangeEvent) => handleInputChange(event.value, 'month')}
										filter
										className='h-[42px] items-center !border-gray-200 shadow'
									/> */}

                <CustomInput
                  initialValue={year || ''}
                  disabled={true}
                  placeholder=''
                  onChange={(v) => {}}
                  label='Año'
                  required
                  hasError={errors?.year}
                  errorText='El año de pago es obligatorio.'
                />
              </FieldsetGroup>
              <FieldsetGroup className='w-full sm:w-[50%] '>
                <fieldset className=''>
                  <label htmlFor='PaymentTypeId'>Forma de pago </label>
                  <Dropdown
                    value={PaymentTypeId}
                    onChange={(e) => {
                      handleInputChange(e.value, 'PaymentTypeId')
                      if (e.value === paymentTypeQuery.data?.data.find((item) => item.name === 'Transferencia Bancaria')?.id) {
                        setBankExpenses(bankExpensesValue.current)
                      } else {
                        setBankExpenses(0)
                      }
                    }}
                    options={paymentTypeQuery.data?.data}
                    dropdownIcon={() => <DropDownIcon />}
                    optionLabel='name'
                    filterPlaceholder='Busca  forma de pago'
                    optionValue='id'
                    placeholder='elije forma de pago'
                    filter
                    className='h-[42px] items-center !border-gray-200 shadow'
                  />
                  {errors?.PaymentTypeId && <FormError text='El formato de pago es obligatorio.' />}
                </fieldset>
              </FieldsetGroup>
            </FieldsetGroup>
            <FieldsetGroup>
              <FieldsetGroup className='w-full sm:w-[70%]'>
                <fieldset className=''>
                  <label htmlFor=''>Total Event. </label>
                  <input placeholder='1234.90' type='number' disabled={true} value={eventTotal.current} onChange={(value) => {}} />
                </fieldset>
                <fieldset className=''>
                  <label htmlFor=''>Total imp. y deudas </label>
                  <input
                    placeholder='1234.90'
                    type='number'
                    disabled={true}
                    value={expsTotal.current + debtsTotal.current}
                    onChange={(value) => {}}
                  />
                </fieldset>
              </FieldsetGroup>
              {selectedExpensesClient.filter((se) => se.paidCurrentMonth).length > 0 && (
                <FieldsetGroup className='w-full sm:w-[50%]'>
                  <fieldset className=''>
                    <label title='Cantidad de dias atrasados' htmlFor='total'>
                      C.D.A
                    </label>
                    <input
                      placeholder='1234.90'
                      name='qteDays'
                      className={`dark:!bg-gray-900 w-full sm:w-24 dark:text-slate-400 border !border-gray-300 dark:!border-slate-700 !shadow`}
                      min={0}
                      type='number'
                      value={qteDays ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        updateAll({
                          ...values,
                          qteDays: Number(e.target.value),
                          recharge: roundUp(Number(e.target.value) * dailyPunitive)
                          // total: GG.checked ? eventTotal.current + expsTotal.current + debtsTotal.current + Number((Number(e.target.value) * dailyPunitive).toFixed(2)) + GG.amount : eventTotal.current + expsTotal.current + debtsTotal.current + Number((Number(e.target.value) * dailyPunitive).toFixed(2))
                        })
                      }}
                    />
                  </fieldset>
                  <fieldset className=''>
                    <label htmlFor='recharge'>Tot. recargo</label>
                    <input
                      placeholder='1234'
                      disabled={true}
                      name='total'
                      type='number'
                      value={roundUp(qteDays * dailyPunitive)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e.target.value, 'recharge')}
                    />
                  </fieldset>
                </FieldsetGroup>
              )}
            </FieldsetGroup>
            <FieldsetGroup className=''>
              <fieldset className=''>
                <label htmlFor='total'>Total a cobrar</label>
                <input
                  placeholder='1234'
                  disabled={true}
                  name='total'
                  type='number'
                  value={
                    GG.checked
                      ? eventTotal.current +
                        expsTotal.current +
                        debtsTotal.current +
                        (selectedExpensesClient.filter((se) => se.paidCurrentMonth).length > 0 ? recharge : 0) +
                        roundUp(Number(GG.amount))
                      : roundUp(
                          eventTotal.current +
                            expsTotal.current +
                            debtsTotal.current +
                            (selectedExpensesClient.filter((se) => se.paidCurrentMonth).length > 0 ? recharge : 0)
                        )
                  }
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e.target.value, 'total')}
                />
              </fieldset>
              <fieldset className=''>
                <label htmlFor='total'>Total cobrado</label>
                <input
                  placeholder='1234'
                  // disabled={true}
                  className={`dark:!bg-gray-900 dark:text-slate-400 border  focus:!border-blue-500 dark:focus:!border-blue-500  !border-gray-300 dark:!border-slate-700 !shadow placeholder:text-slate-300 dark:placeholder:text-slate-700`}
                  name='total'
                  type='number'
                  value={paidTotal}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e.target.value, 'paidTotal')}
                />
              </fieldset>

              {/* <input
								value={paidTotal}
								type='number'
								placeholder={'0.00'}
								onChange={(v) => { handleInputChange(roundUp(Number(v)), 'paidTotal') }}
								label='Total cobrado'
							/> */}
            </FieldsetGroup>
            {paidTotal > 0 && (
              <div className=''>
                <CustomTextArea
                  initialValue={paidTotalText || ''}
                  placeholder='Detalle sobre el pago parcial'
                  className='mb-0'
                  required
                  onChange={(v) => {
                    handleInputChange(v, 'paidTotalText')
                  }}
                  label='Observaciones pago parcial'
                />
                <div className='text-green-500 dark:text-green-300 p-1'>
                  Se agregará una eventualidad con un monto de : {'$'}
                  {GG.checked
                    ? (
                        eventTotal.current +
                        expsTotal.current +
                        debtsTotal.current +
                        (selectedExpensesClient.filter((se) => se.paidCurrentMonth).length > 0 ? recharge : 0) +
                        Number(GG.amount) -
                        paidTotal
                      ).toFixed(2)
                    : roundUp(
                        eventTotal.current +
                          expsTotal.current +
                          debtsTotal.current +
                          (selectedExpensesClient.filter((se) => se.paidCurrentMonth).length > 0 ? recharge : 0) -
                          paidTotal
                      )}
                </div>
              </div>
            )}

            <CustomTextArea
              initialValue={obs || ''}
              placeholder='Pago  transferencia bancaria'
              onChange={(v) => {
                handleInputChange(v, 'obs')
              }}
              label='Observaciones'
              optional
            />

            <FormActionBtns savingOrUpdating={savingOrUpdating} onClose={closeCreateModal} />
          </form>
          {ContractId && (
            <Box className='shadow-none rounded-none border-none mx-0   p-2'>
              <h3 className='font-bold mb-2 text-lg '>Lista de conceptos a cobrar</h3>
              <div className='flex justify-between flex-col min-h-[300px] h-[95%]'>
                <div className='payment-pdf  pt-4 flex-1 gap-y-1 flex flex-col px-1 '>
                  {selectedExpensesClient.map((evt, index) => (
                    <div
                      key={index}
                      className='align-items-center uppercase text-sm border-b dark:border-slate-700 flex gap-x-3 items-center  justify-between    border-gray-300'
                    >
                      <span className=''>{evt.description}</span>
                      <span>${evt.amount}</span>
                    </div>
                  ))}
                  {GG.checked && (
                    <div
                      key={GG.id}
                      className='align-items-center uppercase text-sm border-b dark:border-slate-700 flex gap-x-3 items-center  justify-between    border-gray-300'
                    >
                      <span className=''>{GG.description}</span>
                      <span>${GG.amount}</span>
                    </div>
                  )}

                  {selectedEventualities.map((evt, index) => (
                    <div
                      key={index}
                      className='align-items-center uppercase text-sm border-b dark:border-slate-700 flex gap-x-3 items-center  justify-between    border-gray-300'
                    >
                      <span className=''>{evt.description}</span>
                      <span>${evt.clientAmount}</span>
                    </div>
                  ))}
                  {selectedExpensesClient.filter((se) => se.paidCurrentMonth).length > 0 && (
                    <div className='align-items-center uppercase text-sm border-b dark:border-slate-700 flex gap-x-3 items-center  justify-between    border-gray-300'>
                      <span className=''>
                        PUNITORIOS {month} {year.toString()}
                      </span>
                      <span>${recharge}</span>
                    </div>
                  )}
                  {selectedDebts.map((evt, index) => (
                    <div
                      key={index}
                      className='align-items-center uppercase text-sm border-b dark:border-slate-700 flex gap-x-3 items-center  justify-between    border-gray-300'
                    >
                      <span className=''>{evt.description}</span>
                      <span>${evt.amount}</span>
                    </div>
                  ))}
                  {bankExpenses > 0 && (
                    <div className='align-items-center uppercase text-sm border-b dark:border-slate-700 flex gap-x-3 items-center  justify-between    border-gray-300'>
                      <span className=''>GASTOS BANCARIOS</span>
                      <span>${bankExpenses}</span>
                    </div>
                  )}
                </div>
                <div className='mt-auto'>
                  <div className='align-items-center uppercase text-sm  flex gap-x-3 items-center  justify-between  mt-3  border-gray-300'>
                    <span className=''>Total a cobrar </span>
                    {paidTotal > 0 ? (
                      <span className=''>${paidTotal}</span>
                    ) : GG.checked ? (
                      <span>
                        ${' '}
                        {roundUp(
                          Number(GG.amount) +
                            bankExpenses +
                            eventTotal.current +
                            expsTotal.current +
                            debtsTotal.current +
                            (selectedExpensesClient.filter((se) => se.paidCurrentMonth).length > 0 ? recharge : 0)
                        )}
                      </span>
                    ) : (
                      <span>
                        ${' '}
                        {roundUp(
                          eventTotal.current +
                            bankExpenses +
                            expsTotal.current +
                            debtsTotal.current +
                            (selectedExpensesClient.filter((se) => se.paidCurrentMonth).length > 0 ? recharge : 0)
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Box>
          )}
        </div>
      </CreateModal>
    </div>
  )
}

export default ClientPayments
