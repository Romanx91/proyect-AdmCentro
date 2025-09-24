import React, { useRef, useState } from "react";
import { DataTable, DataTableFilterMeta } from "primereact/datatable";
import { Column, ColumnFilterElementTemplateOptions } from "primereact/column";
import Box from "../../components/Box";
import DeleteModal from "../../components/DeleteModal";
import Loading from "../../components/Loading";
import http from "../../api/axios";
import CreateModal from "../../components/CreateModal";
import CustomInput from "../../components/CustomInput";
import { useForm } from "../../hooks/useForm";
import FormError from "../../components/FormError";
import RequestError from "../../components/RequestError";
import { monthsInSpanish } from "../../helpers/variableAndConstantes";
import FieldsetGroup from "../../components/FieldsetGroup";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { usePaymentTypes } from "../../hooks/usePaymentTypes";
import { Checkbox, CheckboxChangeEvent } from "primereact/checkbox";
import {
  IClientExpensesResponseSimple,
  IClientExpItem,
} from "../../interfaces/clientExpenses";
import {
  IEventualitiesResponse,
  IEventuality,
} from "../../interfaces/Ieventualities";
import CloseOnClick from "../../components/CloseOnClick";
import { Idebt, IdebtsResponse } from "../../interfaces/IDebtsResponse";
import { IClienyPayment } from "../../interfaces/IclientPayments";
import {
  diffenceBetweenDates,
  formatDateDDMMYYYY,
  padTo2Digits,
  padToNDigit,
} from "../../helpers/date";
import { BsPrinter } from "react-icons/bs";
import { TfiBackLeft } from "react-icons/tfi";
import { useOwners } from "../../hooks/useOwners";
import { useOwnerPayments } from "../../hooks/userOwnerPayment";
import logoApp from "../../assets/images/logo.png";
// @ts-expect-error
import html2pdf from "html2pdf.js";
import useShowAndHideModal from "../../hooks/useShowAndHideModal";
import { validateForm } from "../../helpers/form";
import RefreshData from "../../components/RefreshData";
import HeaderData from "../../components/HeaderData";
import { FilterMatchMode } from "primereact/api";
import { EmptyData } from "../../components/EmptyData";
import FormActionBtns from "../../components/FormActionBtns";
import CustomTextArea from "../../components/CustomTextArea";
import { IHistorialPrice } from "../../interfaces/Icontracts";
import { roundUp } from "../../helpers/numbers";
import { useContracts } from "../../hooks/useContracts";
import { Link } from "react-router-dom";
import ReceiptHeader from "./ReceiptHeader";
const OwnerPayment = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [show, setShow] = useState(false);
  const {
    OwnerId,
    PaymentTypeId,
    month,
    year,
    updateAll,
    total,
    values,
    handleInputChange,
    obs,
    reset,
  } = useForm({
    OwnerId: null,
    PaymentTypeId: null,
    month: monthsInSpanish[new Date().getMonth()],
    year: new Date().getFullYear(),
    total: 0,
    obs: "",
  });
  const [errors, setErrors] = useState<any>();
  const [editMode, setEditMode] = useState(false);
  const [selectedEventualities, setSelectedEventualities] = useState<
    IEventuality[]
  >([]);
  const [selectedExpensesClient, setSelectedExpensesClient] = useState<
    IClientExpItem[]
  >([]);
  const [selectedDebts, setSelectedDebts] = useState<Idebt[]>([]);
  const { showAndHideModal } = useShowAndHideModal();

  const [savingOrUpdating, setSavingOrUpdating] = useState(false);
  const eventTotal = useRef(0);
  const expsTotal = useRef(0);
  const debtsTotal = useRef(0);
  const currentPayment = useRef<IClienyPayment | null>();
  const [expenseDetails, setExpenseDetails] = useState<IClientExpItem[]>([]);
  const [eventualityDetails, setEventualityDetails] = useState<
    IEventuality[][]
  >([]);
  const [debts, setDebts] = useState<Idebt[]>([]);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [downloadPdf, setDownloadPdf] = useState(false);
  const [upToDate, setUpToDate] = useState(false);
  const [lastPayment, setLastPayment] = useState<any[]>([]);

  const [contractRows, setContractRows] = useState<any[]>([]);
  // const [globalFilterValue, setGlobalFilterValue] = useState('')

  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    month: { value: null, matchMode: FilterMatchMode.CONTAINS },
    year: { value: null, matchMode: FilterMatchMode.CONTAINS },
    "Owner.fullName": { value: null, matchMode: FilterMatchMode.CONTAINS },
    createdAt: { value: null, matchMode: FilterMatchMode.EQUALS },
    "PaymentType.name": { value: null, matchMode: FilterMatchMode.EQUALS },
  });
  const ownerPaymentQuery = useOwnerPayments();
  const { data, isError, isLoading, error, isFetching } = useOwners();
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const contractQuery = useContracts("?state=Finalizado:ne");
  const paymentTypeQuery = usePaymentTypes();

  const ConfirmDestroy = (data: IClienyPayment) => {
    setShow(!show);
    currentPayment.current = data;
  };

  const resetFilters = () => {
    setFilters({
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      month: { value: null, matchMode: FilterMatchMode.CONTAINS },
      year: { value: null, matchMode: FilterMatchMode.CONTAINS },
      "Owner.fullName": { value: null, matchMode: FilterMatchMode.CONTAINS },
      createdAt: { value: null, matchMode: FilterMatchMode.EQUALS },
      "PaymentType.name": { value: null, matchMode: FilterMatchMode.EQUALS },
    });
  };

  const monthFilterTemplate = (option: ColumnFilterElementTemplateOptions) => {
    return (
      <Box className="!m-0 !p-0">
        <Dropdown
          value={option.value}
          onChange={(e: DropdownChangeEvent) =>
            option.filterApplyCallback(e.value)
          }
          options={monthsInSpanish}
          showClear
          placeholder="elije mes"
          className="h-[42px]   items-center w-full !border-gray-200 shadow "
        />
      </Box>
    );
  };

  const dateFilterTemplate = (option: ColumnFilterElementTemplateOptions) => {
    return (
      <Box className="!m-0 !p-0">
        <CustomInput
          initialValue={option.value ?? ""}
          onChange={(e: string) => option.filterApplyCallback(e)}
          type="date"
          placeholder="elije fecha"
          fieldsetClassName="!mt-0"
        />
      </Box>
    );
  };
  const paymentTypeFilterTemplate = (
    option: ColumnFilterElementTemplateOptions
  ) => {
    return (
      <Box className="!m-0 !p-0">
        <Dropdown
          value={option.value ?? ""}
          onChange={(e: DropdownChangeEvent) =>
            option.filterApplyCallback(e.value)
          }
          options={paymentTypeQuery?.data?.data}
          optionLabel="name"
          showClear
          optionValue="name"
          placeholder="elije format de pago"
          className="h-[42px]   items-center w-full !border-gray-200 shadow "
        />
      </Box>
    );
  };
  const ownersFilterTemplate = (option: ColumnFilterElementTemplateOptions) => {
    return (
      <Box className="!m-0 !p-0">
        <Dropdown
          value={option.value ?? ""}
          onChange={(e: DropdownChangeEvent) =>
            option.filterApplyCallback(e.value)
          }
          options={data?.data}
          optionLabel="fullName"
          showClear
          filterBy="fullName"
          optionValue="fullName"
          placeholder="elije propietario"
          filter
          filterPlaceholder="Busca propietario"
          className="h-[42px]   items-center w-64 !border-gray-200 shadow "
        />
      </Box>
    );
  };

  const destroy = async (id: number) => {
    try {
      setSavingOrUpdating(true);
      const res = await http.delete("/payment-owners/" + id);
      if (res.data.ok) {
        ownerPaymentQuery.data?.data &&
          (ownerPaymentQuery.data.data! = ownerPaymentQuery.data?.data.filter(
            (z) => z.id !== id
          ));
        setShow(false);
        showAndHideModal("Borrado", res.data.message);
      } else {
        showAndHideModal(
          "Error",
          res.data.message || "Algo malo ocurrío.",
          "red"
        );
      }
    } catch (error: any) {
      if (error.response)
        showAndHideModal(
          "Error",
          error.response.data?.message || "Algo malo ocurrío.",
          "red"
        );
    } finally {
      setSavingOrUpdating(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    values.total = roundUp(
      eventTotal.current + expsTotal.current + debtsTotal.current
    );
    const { error, ok } = validateForm({ ...values }, ["obs"]);
    setErrors(error);
    if (!ok) return false;
    // return
    // values.OwnerId = values.OwnerId!.id
    try {
      setSavingOrUpdating(true);
      const res = await http.post("/payment-owners", {
        ...values,
        // @ts-expect-error
        OwnerId: values.OwnerId!.id,
        expenseDetails: [...selectedExpensesClient, ...selectedDebts],
        eventualityDetails: selectedEventualities,
        totalContract: contractRows.length,
      });
      if (res.data.ok) {
        ownerPaymentQuery.refetch();
        reset();
        // setShowCreateModal(false)
        closeCreateModal();
        showAndHideModal("Guardado", res.data.message);
      } else {
        showAndHideModal(
          "Error",
          res.data.message || "Algo malo ocurrío.",
          "red"
        );
      }
    } catch (error: any) {
      if (error.response)
        showAndHideModal(
          "Error",
          error.response.data?.message || "Algo malo ocurrío.",
          "red"
        );
    } finally {
      setSavingOrUpdating(false);
    }
  };

  const closeCreateModal = () => {
    reset();
    setSelectedEventualities([]);
    setSelectedExpensesClient([]);
    setSelectedDebts([]);

    setEventualityDetails([]);
    setExpenseDetails([]);
    setDebts([]);

    setContractRows([]);

    eventTotal.current = 0;
    expsTotal.current = 0;
    debtsTotal.current = 0;

    setShowCreateModal(false);
    setErrors({});
  };

  const actionBodyTemplate = (rowData: any) => {
    return (
      <div className="flex gap-x-3 items-center justify-center">
        <BsPrinter
          title="Imprimir comprobante"
          size={22}
          onClick={() => printPdf(rowData)}
        />
        {/* <EditIcon action={() => edit(rowData)} /> */}
        <TfiBackLeft
          title="Revertir cobro"
          size={23}
          onClick={() => ConfirmDestroy(rowData)}
        />
      </div>
    );
  };

  const onExpensesClienteChange = (e: CheckboxChangeEvent) => {
    let _selectedExps = [...selectedExpensesClient];
    if (e.checked) {
      _selectedExps.push(e.value);
    } else _selectedExps = _selectedExps.filter((evt) => evt.id !== e.value.id);
    expsTotal.current = roundUp(
      _selectedExps.reduce((acc: any, cur: any) => acc + cur.amount, 0)
    );
    setSelectedExpensesClient(_selectedExps);
  };

  const onEventualityChange = (e: CheckboxChangeEvent) => {
    let _selectedEvents = [...selectedEventualities];
    if (e.checked) _selectedEvents.push(e.value);
    else
      _selectedEvents = _selectedEvents.filter((evt) => evt.id !== e.value.id);
    eventTotal.current = roundUp(
      _selectedEvents.reduce((acc: any, cur: any) => acc + cur.ownerAmount, 0)
    );
    setSelectedEventualities(_selectedEvents);
  };
  const onDebtsChanges = (e: CheckboxChangeEvent) => {
    let _selectedExps = [...selectedDebts];
    if (e.checked) _selectedExps.push(e.value);
    else _selectedExps = _selectedExps.filter((evt) => evt.id !== e.value.id);
    debtsTotal.current = roundUp(
      _selectedExps.reduce((acc: any, cur: any) => acc + cur.amount, 0)
    );
    setSelectedDebts(_selectedExps);
  };

  const handleChangeOwner = async (e: DropdownChangeEvent) => {
    setUpToDate(false);
    setLoadingExpenses(true);
    reset();
    setSelectedEventualities([]);
    setSelectedExpensesClient([]);
    setSelectedDebts([]);
    setLastPayment([]);
    setEventualityDetails([]);
    setExpenseDetails([]);
    setDebts([]);

    setContractRows([]);

    eventTotal.current = 0;
    expsTotal.current = 0;
    debtsTotal.current = 0;
    // get alll contract owner first
    updateAll({
      ...values,
      OwnerId: e.value,
    });

    // get previews payment for the current month and year
    try {
      const res = await http.get(
        `/payment-owners?OwnerId=${e.value.id}&month=${month}&year=${year}&include=true`
      );
      if (res.data.results > 0) {
        res.data.data.map((p: any) =>
          setLastPayment((prev: any) => [
            ...prev,
            ...p.expenseDetails.concat(p.eventualityDetails),
          ])
        );
        setUpToDate(true);
      }
    } catch (error) {
      showAndHideModal(
        "Error",
        "Error al intentar validar si el contrato ya tiene cobro para el mes y ano actual",
        "red"
      );
    }

    try {
      const ownerContracts = await http.get(
        `contracts/owner/${e.value.id}/all`
      );
      ownerContracts.data.data.map(async (contract: any) => {
        const docsExpss = http.get<IClientExpensesResponseSimple>(
          `/owner-expenses?amount=0:ne&ContractId=${contract.id}&include=true`
        );
        const docsEventss = http.get<IEventualitiesResponse>(
          `/eventualities?ownerPaid=0&PropertyId=${contract.PropertyId}&ownerAmount=0:ne&include=true`
        );
        const docsEventsCont = http.get<IEventualitiesResponse>(
          `/eventualities?ownerPaid=0&ContractId=${contract.id}&ownerAmount=0:ne&include=true`
        );
        const docsDebtss = http.get<IdebtsResponse>(
          `/debt-owners?paid=0&ContractId=${contract.id}`
        );
        const paidCurrentMonth = http.get(
          `/payment-clients?ContractId=${
            contract.id
          }&month=${month}&year=${year}&paidCurrentMonth=${1}&include=true`
        );
        const hasDebts = http.get(
          `/debt-clients?ContractId=${contract.id}&paid=${0}&include=true`
        );

        const [
          docsExps,
          docsEvents,
          docsDebts,
          padiCurMonth,
          hasDebtsResponse,
          eventContracts,
        ] = await Promise.all([
          docsExpss,
          docsEventss,
          docsDebtss,
          paidCurrentMonth,
          hasDebts,
          docsEventsCont,
        ]);

        const isExpired =
          diffenceBetweenDates(
            new Date().toISOString().slice(0, 10),
            contract.endDate
          ) <= 0;
        let expensess =
          contract.state === "Finalizado" || isExpired
            ? []
            : [
                {
                  amount: roundUp(
                    contract.PriceHistorials.sort(
                      (a: IHistorialPrice, b: IHistorialPrice) => a.id - b.id
                    )[contract.PriceHistorials?.length - 1]?.amount
                  ),
                  description:
                    "ALQUILER " +
                    contract?.Property?.street +
                    " " +
                    contract?.Property?.number +
                    " " +
                    contract?.Property?.floor +
                    " " +
                    contract?.Property?.dept +
                    " " +
                    month +
                    "/" +
                    year,
                  id: Number(
                    Math.floor(Math.random() * 100000).toFixed(0) +
                      contract.id.toFixed(0) +
                      new Date().getTime().toFixed(0)
                  ),
                  ContractId: contract.id,
                  paidCurrentMonth: true,
                  rent: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                {
                  amount: -roundUp(
                    (contract.PriceHistorials.sort(
                      (a: IHistorialPrice, b: IHistorialPrice) => a.id - b.id
                    )[contract.PriceHistorials?.length - 1]?.amount *
                      e.value.commision) /
                      100
                  ),
                  description:
                    "HONORARIOS " +
                    contract?.Property?.street +
                    " " +
                    contract?.Property?.number +
                    " " +
                    contract?.Property?.floor +
                    " " +
                    contract?.Property?.dept +
                    " " +
                    month +
                    "/" +
                    year,
                  id: Number(
                    Math.floor(Math.random() * 10000).toFixed(0) +
                      contract.id.toFixed(0) +
                      new Date().getTime().toFixed(0)
                  ),
                  ContractId: contract.id,
                  // rentId :contract.id,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                // ...docsExps.data.data.map((d) => ({ ...d, description: d.description + ' ' + month + '/' + year })),
                ...docsExps.data.data
                  .filter((d) => {
                    if (d.description !== "AGUAS" && d.description !== "API") {
                      return { ...d };
                    } else {
                      if (
                        d.description === "AGUAS" &&
                        (new Date().getMonth() + 1) % 2 === 0
                      ) {
                        return { ...d };
                      }
                      if (
                        d.description === "API" &&
                        (new Date().getMonth() + 1) % 2 !== 0
                      ) {
                        return { ...d };
                      }
                    }
                  })
                  .map((d) => ({
                    ...d,
                    description: d.description + " " + month + "/" + year,
                  })),
              ];

        setContractRows((prev) => [
          ...prev,
          {
            expenseDetails: expensess,
            eventualityDetails: [
              ...eventContracts.data.data,
              ...docsEvents.data.data,
            ].map((d) => ({
              ...d,
              ContractId: contract.id,
              description:
                d.description +
                " | " +
                contract?.Property?.street +
                " " +
                contract?.Property?.number +
                " " +
                contract?.Property?.floor +
                "-" +
                contract?.Property?.dept,
            })),
            // order them by date
            debts: docsDebts.data.data
              .sort((a: Idebt, b: Idebt) => a.year - b.year)
              .sort((a: Idebt, b: Idebt) => a.month - b.month),
            contract: contract,
            paidCurrentMonth: padiCurMonth.data.results > 0 ? true : false,
            hasDebts: hasDebtsResponse.data.results > 0 ? true : false,
            isExpired: isExpired,
          },
        ]);
      });
    } catch (error) {
    } finally {
      setLoadingExpenses(false);
    }
  };
  const printPdf = async (data: IClienyPayment) => {
    currentPayment.current = data;
    let pd: any = {};
    data.eventualityDetails.map((d) => {
      if (pd.hasOwnProperty(d.ContractId)) {
        pd[d.ContractId] = [...pd[d.ContractId], d];
      } else {
        pd[d.ContractId] = [d];
      }
    });
    data.expenseDetails.map((d) => {
      if (pd.hasOwnProperty(d.ContractId)) {
        pd[d.ContractId] = [...pd[d.ContractId], d];
      } else {
        pd[d.ContractId] = [d];
      }
    });

    currentPayment.current!.printData = Object.values(pd);
    currentPayment.current!.printData.map((item: any) => {
      item[0].contract = contractQuery?.data?.data.find(
        (c) => c.id === item[0].ContractId
      );
      return item;
    });
    setDownloadPdf(true);
  };
  const closePrintPdfModal = () => {
    setDownloadPdf(false);
    currentPayment.current = null;
  };
  const handleDownloadPdf = async () => {
    setLoadingPdf(true);

    var element = document.getElementById("pdf-download");

    var opt = {
      margin: [0.1, 0.1],
      filename: `${currentPayment.current?.Owner!.fullName || "Propietario"}_${
        currentPayment.current?.month
      }_${currentPayment.current?.year}_${formatDateDDMMYYYY(
        new Date().toISOString()
      )}.pdf`,
      image: { type: "png", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "landscape" },
    };
    try {
      await html2pdf().from(element).set(opt).save();
      closePrintPdfModal();
    } catch (error) {
      console.log("error");
    } finally {
      setLoadingPdf(false);
    }
  };

  const openCreateOrEditModel = () => {
    setEditMode(false);
    currentPayment.current = null;
    setShowCreateModal(true);
  };
  const periodTemplate = (data: any) => {
    const monthSet = new Set();
    const yearSet = new Set();
    const prevDebts = data.expenseDetails
      .filter((item: any) => item.hasOwnProperty("debt"))
      .map((item: any) => ({ month: item.month, year: item.year }));
    // validate if the payment was for the actual month
    const curMonthPaid = data.expenseDetails.filter((item: any) =>
      item.hasOwnProperty("paidCurrentMonth")
    );
    if (prevDebts.length > 0) {
      prevDebts.forEach((item: any) => {
        monthSet.add(item.month);
        yearSet.add(item.year);
      });
    }
    if (
      curMonthPaid.length > 0 ||
      (prevDebts.length === 0 && curMonthPaid.length === 0)
    ) {
      monthSet.add(
        monthsInSpanish.findIndex((item) => item === data.month) + 1
      );
      yearSet.add(data.year);
    }

    return (
      <span>
        {Array.from(monthSet)
          .map((item: any) => monthsInSpanish[item - 1])
          .join("-")}
        /{Array.from(yearSet).join("-")}
      </span>
    );
  };

  if (ownerPaymentQuery.isLoading) return <Loading />;
  if (ownerPaymentQuery.isError)
    return <RequestError error={ownerPaymentQuery.error} />;

  return (
    <div className="container m-auto  flexsm:mx-0  flex-col justify-center sm:justify-center">
      <HeaderData action={openCreateOrEditModel} text="Pago a propietario" />
      {ownerPaymentQuery?.data?.data.length > 0 ? (
        <>
          <button
            className="btn dark:bg-transparent dark:text-slate-400 dark:border hover:!text-slate-500 active:text-slate-500 border-slate-700 "
            onClick={resetFilters}
          >
            Borrar filtros
          </button>
          {/* <CustomInput
						onChange={(val) => onGlobalFilterChange(val)}
						className=' w-auto mx-2 sm:mx-0 sm:w-96'
						initialValue={globalFilterValue}
						placeholder='Buscar cobro'
						type='search'
					/> */}
          <Box className="!p-0 !overflow-hidden !border-none sm:mx-0   mb-4 ">
            <DataTable
              size="small"
              emptyMessage="No hay cobro para eso filtro"
              className="!overflow-hidden   !border-none"
              value={ownerPaymentQuery?.data?.data}
              dataKey="id"
              responsiveLayout="scroll"
              filterDisplay="menu"
              filters={filters}
              globalFilterFields={[
                "month",
                "year",
                "Owner.fullName",
                "createdAt",
                "PaymentType.name",
              ]}
              // paginator
              // rows={10}
              // paginatorTemplate='FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink'
              // currentPageReportTemplate='{first} al {last} de {totalRecords}'
              // paginatorLeft={<RefreshData action={ownerPaymentQuery.refetch} />}
            >
              <Column
                field="Owner.fullName"
                body={(data) => (
                  <span>
                    {data.Owner?.fullName ?? "sin nombre"}{" "}
                    {data.Owner?.cuit ?? "00-000000-0"}
                  </span>
                )}
                header="Propietario"
                headerClassName="!border-none dark:!bg-gray-800 dark:!text-slate-400"
                className="dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 "
                sortable
                filter
                // showFilterMenu={false}
                // showClearButton={false}
                filterMenuClassName="!bg-gray-100 dark:!bg-slate-700 dark:!text-slate-400 dark:!border-slate-600"
                showClearButton={false}
                showFilterMatchModes={false}
                showApplyButton={false}
                filterElement={ownersFilterTemplate}
              />
              <Column
                field="month"
                // body={(data) => (<span>{data.month}/{data.year}</span>)}
                body={periodTemplate}
                header="Periodo"
                headerClassName="!border-none dark:!bg-gray-800 dark:!text-slate-400"
                className="dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 "
                sortable
                filter
                filterMenuClassName="!bg-gray-100 dark:!bg-slate-700 dark:!text-slate-400 dark:!border-slate-600"
                showClearButton={false}
                showFilterMatchModes={false}
                showApplyButton={false}
                filterElement={monthFilterTemplate}
              />
              <Column
                field="createdAt"
                body={(data) => (
                  <span>{formatDateDDMMYYYY(data.createdAt)}</span>
                )}
                header="Fecha de Cobro"
                headerClassName="!border-none dark:!bg-gray-800 dark:!text-slate-400"
                className="dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 "
                sortable
                filter
                filterMenuClassName="!bg-gray-100 dark:!bg-slate-700 dark:!text-slate-400 dark:!border-slate-600"
                showClearButton={false}
                showFilterMatchModes={false}
                showApplyButton={false}
                filterElement={dateFilterTemplate}
              />
              <Column
                field="total"
                body={(data) => <span>${roundUp(data.total)}</span>}
                header="Total Cobrado"
                headerClassName="!border-none dark:!bg-gray-800 dark:!text-slate-400"
                className="dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 "
                sortable
              />
              <Column
                field="PaymentType.name"
                // body={(data) => <span>${data.total}</span>}
                header="Formato de pago"
                headerClassName="!border-none dark:!bg-gray-800 dark:!text-slate-400"
                className="dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 "
                sortable
                filter
                filterMenuClassName="!bg-gray-100 dark:!bg-slate-700 dark:!text-slate-400 dark:!border-slate-600"
                showClearButton={false}
                showFilterMatchModes={false}
                showApplyButton={false}
                filterElement={paymentTypeFilterTemplate}
              />
              <Column
                body={actionBodyTemplate}
                headerClassName="!border-none dark:!bg-gray-800"
                className="dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 "
                exportable={false}
                style={{ width: 90 }}
              />
            </DataTable>
          </Box>
        </>
      ) : (
        <EmptyData text="Aún no hay pago" />
      )}
      {ownerPaymentQuery.isFetching && <Loading h={40} w={40} />}
      <DeleteModal
        savingOrUpdating={savingOrUpdating}
        show={show}
        setShow={setShow}
        customTitle="Revertir Cobro"
        customMessage={`¿Estás seguro que querés revertir el cobro de ${
          currentPayment.current?.Owner?.fullName || "Propietario desconocido"
        } ${currentPayment.current?.month}/${currentPayment.current?.year}?`}
        destroy={() => destroy(currentPayment.current?.id!)}
      />

      <CreateModal
        show={showCreateModal}
        closeModal={closeCreateModal}
        overlayClick={false}
        className="shadow-none border-0  overflow-hidden"
        titleText={"Pagos"}
        custom
      >
        <CloseOnClick action={closeCreateModal} />
        <div className="flex w-full flex-col md:flex-row gap-x-4 mt-3 ">
          <form
            onSubmit={handleSave}
            // bg-gray-100 p-2 rounded-md shadow-xl
            className="w-full  sm:flex-grow-[50%] sm:min-w-[600px] border border-gray-100 dark:border-slate-600 p-2"
          >
            <FieldsetGroup>
              <fieldset>
                <label htmlFor="OwnerId">Propietario</label>
                <Dropdown
                  value={OwnerId}
                  onChange={handleChangeOwner}
                  options={data?.data}
                  optionLabel="fullName"
                  filterBy="fullName,cuit"
                  filterPlaceholder="Busca propietario por nombre o cuit"
                  optionValue=""
                  placeholder="elije un propietario"
                  filter
                  valueTemplate={(data, props) =>
                    !data ? (
                      props.placeholder
                    ) : (
                      <span>
                        {data.fullName} | {data.cuit}
                      </span>
                    )
                  }
                  itemTemplate={(data) => (
                    <span>
                      {data.fullName} | {data.cuit}
                    </span>
                  )}
                  className="h-[42px] items-center !border-gray-200 shadow "
                />
                {errors?.OwnerId && (
                  <FormError text="El propietario es obligatoria." />
                )}
              </fieldset>
            </FieldsetGroup>
            {upToDate && OwnerId && (
              <div className="text-green-500 dark:text-green-400 text-center my-2">
                {/* @ts-ignore */}
                Ya cobraste {lastPayment.length} concepto(s) para el/los mes(es)
                de{" "}
                {Array.from(
                  new Set(
                    lastPayment.map((it) =>
                      typeof it.month === "number"
                        ? monthsInSpanish[it.month - 1]
                        : it.month
                        ? it.month
                        : month
                    )
                  )
                ).join(",")}
              </div>
            )}
            {!loadingExpenses ? (
              <div className="flex flex-col gap-y-4 mt-4">
                {contractRows.map((contract, l) => (
                  <div
                    key={l}
                    className="bg-gray-50 shadow-sm border border-gray-300 dark:border-slate-700 dark:bg-slate-900 p-2"
                  >
                    <h2
                      className={`font-semibold text-lg mb-3 ${
                        contract.isExpired
                          ? "text-red-400"
                          : contract.contract.state == "Finalizado"
                          ? "text-yellow-500"
                          : "text-green-400"
                      } `}
                    >
                      {contract.contract.Property.street}{" "}
                      {contract.contract.Property.number}{" "}
                      {contract.contract.Property.floor}-
                      {contract.contract.Property.dept} |{" "}
                      {contract.contract.Client?.fullName ??
                        "Cliente eliminado"}
                      {` | ${contract.contract.state} | ${
                        contract.isExpired ? "Vencido" : "Vigente"
                      } | ${formatDateDDMMYYYY(
                        contract.contract.startDate
                      )} - ${formatDateDDMMYYYY(
                        contract.contract.endDate
                      )} | Ajuste : ${contract.contract.adjustmentMonth} meses`}
                    </h2>

                    {upToDate &&
                      OwnerId &&
                      lastPayment.filter(
                        (lp) => lp.ContractId === contract.contract.id
                      ).length > 0 && (
                        <div className="text-green-500 dark:text-green-400 text-center my-2">
                          {/* @ts-ignore */}
                          Ya cobraste{" "}
                          {
                            lastPayment.filter(
                              (lp) => lp.ContractId === contract.contract.id
                            ).length
                          }{" "}
                          concepto(s) para el/los mes(es) de{" "}
                          {Array.from(
                            new Set(
                              lastPayment
                                .filter(
                                  (lp) => lp.ContractId === contract.contract.id
                                )
                                .map((it) =>
                                  typeof it.month === "number"
                                    ? monthsInSpanish[it.month - 1]
                                    : it.month
                                    ? it.month
                                    : month
                                )
                            )
                          ).join(",")}
                        </div>
                      )}

                    {!contract.isExpired &&
                      contract.contract.state !== "Finalizado" && (
                        <div
                          className={`paid-current-month border border-dashed p-2  ${
                            contract.paidCurrentMonth
                              ? "text-green-500 border-green-400 dark:text-green-400"
                              : "text-red-500 border-red-400 dark:text-red-400"
                          } text-center my-2`}
                        >
                          {contract.paidCurrentMonth
                            ? "El inquilino ya pagó el mes actual."
                            : "El inquilino  no pagó el mes actual todavía."}
                        </div>
                      )}

                    {contract.hasDebts && (
                      <div
                        className={`has-debts border border-dashed p-2  border-red-400 dark:text-red-400 text-center my-2`}
                      >
                        <span className="text-red-500">
                          El inquilino tiene deudas impagas.
                        </span>
                        <Link
                          target="_blank"
                          to="/contract-debts-clients"
                          className="text-slate-700 ml-2 underline dark:text-slate-400"
                        >
                          Ver deudas
                        </Link>
                      </div>
                    )}

                    {contract.expenseDetails?.length > 0 && (
                      <div className="">
                        <h1 className="title-form mb-2">
                          Alquiler y Gastos propietarios
                        </h1>
                        <div className="eventualities-section flex flex-col gap-y-2 gap-x-3">
                          {contract.expenseDetails.map(
                            (evt: any, index: any) => (
                              <div
                                key={
                                  evt.id.toString() +
                                  evt.createdAt +
                                  index +
                                  evt.amount +
                                  evt.description +
                                  evt.ContractId
                                }
                                className="align-items-center flex items-center flex-wrap   border border-gray-300 dark:border-slate-700 p-2"
                              >
                                <Checkbox
                                  inputId={
                                    evt.id.toString() +
                                    evt.createdAt +
                                    index +
                                    evt.amount +
                                    evt.description +
                                    evt.ContractId
                                  }
                                  name="expenseClients"
                                  disabled={
                                    lastPayment.filter(
                                      (item: any) =>
                                        item.description === evt.description &&
                                        item.ContractId === evt.ContractId
                                    ).length > 0
                                  }
                                  value={evt}
                                  onChange={onExpensesClienteChange}
                                  checked={selectedExpensesClient.some(
                                    (item: any) =>
                                      item.id === evt.id &&
                                      item.ContractId === evt.ContractId
                                  )}
                                />
                                <label
                                  htmlFor={
                                    evt.id.toString() +
                                    evt.createdAt +
                                    index +
                                    evt.amount +
                                    evt.description +
                                    evt.ContractId
                                  }
                                  className={` ml-2  ${
                                    lastPayment.filter(
                                      (item: any) =>
                                        item.description === evt.description &&
                                        item.ContractId === evt.ContractId
                                    ).length > 0
                                      ? " cursor-not-allowed opacity-60 line-through"
                                      : "cursor-pointer"
                                  } `}
                                >
                                  ${roundUp(evt.amount)} - {evt.description}
                                </label>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {contract.eventualityDetails?.length > 0 && (
                      <div className="my-4">
                        <h1 className="title-form mb-2">Eventualidades</h1>
                        <div className="eventualities-section  flex flex-col gap-y-2  gap-x-3">
                          {contract.eventualityDetails.map(
                            (evt: any, index: any) => (
                              <div
                                key={
                                  evt.updatedAt +
                                  evt.description +
                                  index +
                                  evt.ownerAmount +
                                  evt.description +
                                  evt.ContractId
                                }
                                className="align-items-center flex cursor-pointe items-center flex-wrap   border border-gray-300 dark:border-slate-700 p-2"
                              >
                                <Checkbox
                                  inputId={
                                    evt.updatedAt +
                                    evt.description +
                                    index +
                                    evt.ownerAmount +
                                    evt.description +
                                    evt.ContractId
                                  }
                                  value={evt}
                                  name="eventuality"
                                  onChange={onEventualityChange}
                                  checked={selectedEventualities.some(
                                    (item: any) =>
                                      item.id === evt.id &&
                                      item.ContractId === evt.ContractId
                                  )}
                                />
                                <label
                                  htmlFor={
                                    evt.updatedAt +
                                    evt.description +
                                    index +
                                    evt.ownerAmount +
                                    evt.description +
                                    evt.ContractId
                                  }
                                  className="ml-2 cursor-pointer"
                                >
                                  ${roundUp(evt.ownerAmount)} -{" "}
                                  {evt.description}
                                </label>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {contract.debts?.length > 0 && (
                      <div className="my-4">
                        <h1 className="title-form mb-2">Deudas anteriores</h1>
                        <div className="eventualities-section flex flex-col gap-y-2 gap-x-3">
                          {contract.debts.map((evt: any, index: any) => (
                            <div
                              key={
                                evt.updatedAt +
                                evt.id +
                                index +
                                evt.amount +
                                evt.description +
                                evt.ContractId
                              }
                              className={`align-items-center cursor-pointe flex items-center  flex-wrap border border-gray-300 dark:border-slate-700 p-1 ${
                                diffenceBetweenDates(
                                  evt.year +
                                    "-" +
                                    padTo2Digits(evt.month) +
                                    "-10",
                                  new Date().toString()
                                ) > 70
                                  ? " !border-red-500 dark:!border-red-400"
                                  : ""
                              }`}
                            >
                              <Checkbox
                                inputId={
                                  evt.updatedAt +
                                  evt.id +
                                  index +
                                  evt.amount +
                                  evt.description +
                                  evt.ContractId
                                }
                                value={evt}
                                name="debtsProperties"
                                onChange={onDebtsChanges}
                                checked={selectedDebts.some(
                                  (item: any) =>
                                    item.id === evt.id &&
                                    item.ContractId === evt.ContractId
                                )}
                              />
                              <label
                                htmlFor={
                                  evt.updatedAt +
                                  evt.id +
                                  index +
                                  evt.amount +
                                  evt.description +
                                  evt.ContractId
                                }
                                className="ml-2 cursor-pointer"
                              >
                                <span className="">
                                  ${roundUp(evt.amount)} {evt.description}
                                </span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Loading />
            )}
            <FieldsetGroup>
              <FieldsetGroup className="w-full sm:w-[50%]">
                <CustomInput
                  initialValue={month || ""}
                  placeholder=""
                  label="Mes"
                  onChange={() => {}}
                  required
                  disabled
                  hasError={errors?.month}
                  errorText="El mes de pago es obligatorio."
                />
                <CustomInput
                  initialValue={year || ""}
                  placeholder=""
                  label="Año"
                  onChange={() => {}}
                  required
                  disabled
                  hasError={errors?.year}
                  errorText="El año de pago es obligatorio."
                />
              </FieldsetGroup>
              <FieldsetGroup className="w-full sm:w-[50%]">
                <fieldset className="">
                  <label htmlFor="PaymentTypeId">Forma de pago </label>
                  <Dropdown
                    value={PaymentTypeId}
                    onChange={(e) =>
                      handleInputChange(e.value, "PaymentTypeId")
                    }
                    options={paymentTypeQuery.data?.data}
                    optionLabel="name"
                    filterPlaceholder="Busca forma de pago"
                    optionValue="id"
                    placeholder="elije  forma de pago"
                    filter
                    className="h-[42px] items-center !border-gray-200 shadow"
                  />
                  {errors?.PaymentTypeId && (
                    <FormError text="El formato de pago es obligatorio." />
                  )}
                </fieldset>
              </FieldsetGroup>
            </FieldsetGroup>
            <FieldsetGroup>
              <FieldsetGroup className="w-full sm:w-[50%]">
                <fieldset className="">
                  <label htmlFor="">Total event.</label>
                  <input
                    placeholder="1234"
                    type="number"
                    disabled={true}
                    value={eventTotal.current}
                    onChange={() => {}}
                  />
                </fieldset>
                <fieldset className="">
                  <label htmlFor="">Total impuestos</label>
                  <input
                    placeholder="1234"
                    type="number"
                    disabled={true}
                    value={expsTotal.current + debtsTotal.current}
                    onChange={() => {}}
                  />
                </fieldset>
              </FieldsetGroup>
              <FieldsetGroup className="w-full sm:w-[50%]">
                <fieldset className="">
                  <label htmlFor="total">Total a cobrar</label>
                  <input
                    placeholder="1234"
                    disabled={true}
                    min={1}
                    name="total"
                    type="number"
                    required
                    value={
                      eventTotal.current +
                      expsTotal.current +
                      debtsTotal.current
                    }
                    onChange={() => {}}
                  />
                </fieldset>
              </FieldsetGroup>
            </FieldsetGroup>
            <CustomTextArea
              initialValue={obs || ""}
              placeholder="Pago  transferencia bancaria"
              onChange={(v) => {
                handleInputChange(v, "obs");
              }}
              label="Observaciones"
              optional
            />
            <FormActionBtns
              savingOrUpdating={savingOrUpdating}
              onClose={closeCreateModal}
            />
          </form>
          {OwnerId && (
            <Box className="shadow-none rounded-none  mx-0  border-none  p-2">
              <h3 className="font-bold mb-2 text-lg ">
                Lista de conceptos a pagar
              </h3>
              <div className="flex justify-between flex-col min-h-[300px] h-[95%]">
                <div className="payment-pdf  pt-4 flex-1 gap-y-1 flex flex-col px-1">
                  {selectedExpensesClient.map((evt, index) => (
                    <div
                      key={index}
                      className="align-items-center uppercase text-sm border-b dark:border-slate-700 flex gap-x-3 items-center  justify-between    border-gray-300"
                    >
                      <span className="">{evt.description}</span>
                      <span>${roundUp(evt.amount)}</span>
                    </div>
                  ))}
                  {selectedEventualities.map((evt, index) => (
                    <div
                      key={index}
                      className="align-items-center uppercase text-sm border-b dark:border-slate-700   flex gap-x-3 items-center  justify-between    border-gray-300"
                    >
                      <span className="">{evt.description}</span>
                      <span>${roundUp(evt.ownerAmount)}</span>
                    </div>
                  ))}
                  {selectedDebts.map((evt, index) => (
                    <div
                      key={index}
                      className="align-items-center uppercase text-sm border-b  dark:border-slate-700  flex gap-x-3 items-center  justify-between    border-gray-300"
                    >
                      <span className="">{evt.description}</span>
                      <span>${roundUp(evt.amount)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-auto">
                  <div className="align-items-center font-bold uppercase text-sm mt-3 flex gap-x-3 items-center  justify-between    border-gray-300">
                    <span className="">Total a pagar </span>
                    <span>
                      $
                      {roundUp(
                        eventTotal.current +
                          expsTotal.current +
                          debtsTotal.current
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </Box>
          )}
        </div>
      </CreateModal>

      <CreateModal
        show={downloadPdf}
        closeModal={closePrintPdfModal}
        overlayClick={false}
        overflowY="hidden"
        headerClass="sticky top-0 bg-white border-b shadow p-4"
        className="shadow-none border-0 dark:bg-white dark:text-slate-700 w-fit max-w-5xl !p-0"
        titleText={`Recibo de ${currentPayment.current?.month} - ${currentPayment.current?.year}`}
      >
        <CloseOnClick action={closePrintPdfModal} />

        <div className="!shadow-none rounded-lg  border-gray-200  overflow-y-auto max-h-[450px] mt-3">
          <div id="pdf-download" className="flex gap-x-2 ">
            {[1, 2].map((pdf, index) => (
              <div
                key={index}
                className="flex  justify-between flex-col border border-gray-200  p-1  min-h-[750px] w-[500px]"
              >
                <ReceiptHeader date={currentPayment.current?.createdAt} />
                <div className="client-data border text-xs border-gray-200   my-2 p-2 flex ">
                  <div className="flex flex-col gap-y-2 flex-1">
                    <span>
                      <span className="font-semibold">Propietario: </span>
                      <span>
                        {currentPayment.current?.Owner!?.fullName ??
                          "Propietario"}
                      </span>
                    </span>
                    <span>
                      <span className="font-semibold">Domicilio: </span>
                      <span>{currentPayment.current?.Owner!.address}</span>
                    </span>
                  </div>
                  <div className="w-30  flex gap-x-4">
                    <div className="">
                      <div className="">
                        <span className="flex gap-x-2">
                          <span>Recibo</span>
                          <span className="">
                            #{padToNDigit(currentPayment.current?.id || 0, 4)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="payment-pdf mb-2   flex-1 gap-y-2 flex flex-col ">
                  {currentPayment.current?.printData?.map(
                    (con: any, index: any) => (
                      <div key={index} className=" border border-gray-200  p-2">
                        {con.map((evt: any, k: any) => (
                          <div
                            key={k}
                            className="align-items-center uppercase text-xs  flex gap-x-3 items-center  justify-between border-gray-300"
                          >
                            <span className="">{evt.description}</span>
                            <span>
                              $
                              {evt.amount
                                ? roundUp(evt.amount)
                                : roundUp(evt.ownerAmount)}
                            </span>
                          </div>
                        ))}
                        {con[0].contract && (
                          <span className="vencimiento-contrato text-xs text-yellow-500">
                            Vigencia contrato :{" "}
                            {formatDateDDMMYYYY(con[0].contract?.startDate)} |{" "}
                            {formatDateDDMMYYYY(con[0].contract?.endDate)}{" "}
                            {" - "}
                            Nro carpeta :{" "}
                            {con[0].contract?.Property?.folderNumber}
                            {/* {
														con[0].contract?.Property.street + ' ' + con[0].contract?.Property.number + ' ' + con[0].contract?.Property?.floor + ' ' + con[0].contract?.Property?.dept
													} se vence el {formatDateDDMMYYYY(con[0].contract.endDate)} */}
                          </span>
                        )}
                      </div>
                    )
                  )}
                  {currentPayment.current?.obs && (
                    <div className="text-xs border p-1 pb-2 mt-1      border-gray-300">
                      <span className="font-medium">Observaciones : </span>
                      <span>{currentPayment.current?.obs}</span>
                    </div>
                  )}
                </div>
                <div className="mt-auto p-2 font-normal border border-gray-200  ">
                  <div className="align-items-center  text-xs  flex gap-x-3 items-center  justify-between border-gray-300">
                    <span className="">Total a pagar </span>
                    <span className="">
                      $ {roundUp(currentPayment.current?.total!)}
                    </span>
                  </div>
                  <div className="align-items-center   text-xs  flex gap-x-3 items-center  justify-between border-gray-300">
                    <span className="">Format de pago </span>
                    <span className="">
                      {currentPayment.current?.PaymentType.name}
                    </span>
                  </div>
                  <div className="sign-aclaration my-1 text-xs font-normal">
                    <div className="sign my-2">
                      <span>Firma : </span>
                    </div>
                    <div className="">
                      <span>Aclaración : </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-x-2 sticky bottom-0 bg-white px-4">
            <button
              className="btn sec  !my-4"
              disabled={loadingPdf}
              onClick={closePrintPdfModal}
            >
              Cancelar
            </button>
            <button
              className="btn gradient  !my-4"
              disabled={loadingPdf}
              onClick={handleDownloadPdf}
            >
              {loadingPdf ? "Descargando ... " : "Descargar"}
            </button>
          </div>
        </div>
      </CreateModal>
    </div>
  );
};

export default OwnerPayment;
