import React, { useState, useRef } from "react";
import { DataTable, DataTableExpandedRows } from "primereact/datatable";
import { Column } from "primereact/column";
import axios from "axios";
import Box from "../../components/Box";
import Loading from "../../components/Loading";
import CustomInput from "../../components/CustomInput";
import RequestError from "../../components/RequestError";
import { FilterMatchMode } from "primereact/api";
import { useContracts } from "../../hooks/useContracts";
import { Contract, IHistorialPrice } from "../../interfaces/Icontracts";
import {
  diferenceBetweentwoDatesInYears,
  formatDateDDMMYYYY,
} from "../../helpers/date";
import HeaderData from "../../components/HeaderData";
import RefreshData from "../../components/RefreshData";
import { RowsToShow } from "../../helpers/variableAndConstantes";
import { EmptyData } from "../../components/EmptyData";
import EditIcon from "../../components/icons/EditIcon";
import DeleteIcon from "../../components/icons/DeleteIcon";
import useShowAndHideModal from "../../hooks/useShowAndHideModal";
import http from "../../api/axios";
import DeleteModal from "../../components/DeleteModal";
import { useForm } from "../../hooks/useForm";
import CreateModal from "../../components/CreateModal";
import CloseOnClick from "../../components/CloseOnClick";
import FormActionBtns from "../../components/FormActionBtns";
import { validateForm } from "../../helpers/form";

const DebtsClients = () => {
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    "Client.fullName": { value: null, matchMode: FilterMatchMode.CONTAINS },
    "PropertyType.description": {
      value: null,
      matchMode: FilterMatchMode.CONTAINS,
    },
  });
  const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows>();
  const { data, isError, isLoading, error, isFetching, refetch } =
    useContracts("/debts/client/all");

  const [show, setShow] = useState(false);
  const { showAndHideModal } = useShowAndHideModal();
  const currentDebt = useRef<any | null>();
  const [savingOrUpdating, setSavingOrUpdating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [errors, setErrors] = useState<any>();
  const { values, amount, id, reset, handleInputChange, updateAll } = useForm({
    id: 0,
    amount: 0,
    ContractId: 0,
  });

  const onGlobalFilterChange = (val: any) => {
    const value = val;
    let _filters = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };
  const ConfirmDestroy = (data: any) => {
    setShow(!show);
    currentDebt.current = data;
  };
  const edit = (data: any) => {
    updateAll({
      amount: data.amount,
      id: data.id,
      ContractId: data.ContractId,
    });
    setShowCreateModal(true);
    currentDebt.current = data;
  };
  const closeCreateModal = () => {
    reset();
    setShowCreateModal(false);
    setErrors({});
    currentDebt.current = null;
  };

  const handleUpdateDebts = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { error, ok } = validateForm({ ...values });
    setErrors(error);
    if (!ok) return false;
    try {
      const res = await http.put("/debt-clients/" + id, { amount });
      if (res.data.ok) {
        data?.data
          ?.filter((item: any) => item.id === values.ContractId)[0]
          .DebtClients.map((db) => {
            if (db.id === id && db.ContractId === values.ContractId) {
              db.amount = amount;
            }
            return db;
          });
        closeCreateModal();
        showAndHideModal("Actualizado", res.data.message);
      } else {
        showAndHideModal(
          "Error",
          res.data.message || "Algo malo ocurrío.",
          "red"
        );
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        showAndHideModal(
          "Error",
          error.response?.data?.message || "Algo malo ocurrió.",
          "red"
        );
      } else {
        showAndHideModal("Error", "Error desconocido", "red");
      }
    } finally {
      setSavingOrUpdating(false);
    }
  };

  const destroy = async (id: number) => {
    try {
      setSavingOrUpdating(true);
      const res = await http.delete("/debt-clients/" + id);
      if (res.data.ok) {
        refetch();
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
  const actionBodyTemplate2 = (rowData: any) => {
    return (
      <div className="flex gap-x-3 items-center justify-center">
        <EditIcon action={() => edit(rowData)} />
        <DeleteIcon action={() => ConfirmDestroy(rowData)} />
      </div>
    );
  };
  const allowExpansion = (rowData: Contract) =>
    rowData?.DebtClients?.length > 0 ||
    rowData?.Eventualities?.length > 0 ||
    false;

  const rowExpansionTemplate = (data: Contract) => {
    return (
      <div className="p-3 space-y-6">
        {/* Histórico de deudas */}
        {data.DebtClients && data.DebtClients.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold">Histórico de deudas</h2>
            <DataTable
              size="small"
              dataKey="id"
              className="!overflow-hidden !border-none"
              responsiveLayout="scroll"
              value={data.DebtClients}
            >
              <Column
                field="amount"
                body={(row) => <span> ${row.amount} </span>}
                header="Monto"
                sortable
              />
              <Column
                header="Periodo"
                field="month"
                body={(row) => (
                  <span>
                    {row.month}/{row.year}
                  </span>
                )}
                sortable
              />
              <Column
                field="createdAt"
                header="Fecha creación"
                body={(row) => (
                  <span>{formatDateDDMMYYYY(row.createdAt.slice(0, 10))}</span>
                )}
                sortable
              />
              <Column field="description" header="Descripción" />
              <Column
                field="paid"
                header="Pago"
                body={(row) => (
                  <span
                    className={`p-1 rounded-full px-2 ${
                      row.paid ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {row.paid ? "Pagado" : "Sin pagar"}{" "}
                    {row.paid && formatDateDDMMYYYY(row.paidDate.slice(0, 10))}
                  </span>
                )}
              />
              <Column
                body={actionBodyTemplate2}
                exportable={false}
                style={{ width: 90 }}
              />
            </DataTable>
          </div>
        )}

        {/* Eventualidades */}
        {data.Eventualities && data.Eventualities.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-blue-400">
              Eventualidades
            </h2>
            <DataTable
              size="small"
              dataKey="id"
              className="!overflow-hidden !border-none"
              responsiveLayout="scroll"
              value={data.Eventualities}
            >
              <Column field="description" header="Descripción" />
              <Column
                field="clientAmount"
                header="Monto Cliente"
                body={(e) => `$${e.clientAmount}`}
              />
              <Column
                field="ownerAmount"
                header="Monto Dueño"
                body={(e) => `$${e.ownerAmount}`}
              />
              <Column
                field="expiredDate"
                header="Vencimiento"
                body={(e) => formatDateDDMMYYYY(e.expiredDate)}
              />
              <Column
                field="clientPaid"
                header="Cliente Pagó"
                body={(e) => (
                  <span
                    className={`p-1 rounded-full ${
                      e.clientPaid ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {e.clientPaid ? "Sí" : "No"}
                  </span>
                )}
              />
              <Column
                field="ownerPaid"
                header="Dueño Pagó"
                body={(e) => (
                  <span
                    className={`p-1 rounded-full ${
                      e.ownerPaid ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {e.ownerPaid ? "Sí" : "No"}
                  </span>
                )}
              />
            </DataTable>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) return <Loading />;
  if (isError) return <RequestError error={error} />;

  return (
    <div className="container m-auto  flex sm:mx-0  flex-col justify-center sm:justify-center">
      <HeaderData
        showBtn={false}
        action={() => {}}
        text="Deudas x inquilinos"
      />

      {data.data.length > 0 ? (
        <>
          <CustomInput
            onChange={(val) => onGlobalFilterChange(val)}
            className=" w-auto mx-2 sm:mx-0 sm:w-96"
            initialValue={globalFilterValue}
            placeholder="Buscar contrato"
            type="search"
          />
          <Box className="!p-0 !overflow-hidden !border-none sm:mx-0    mb-4 ">
            <DataTable
              expandedRows={expandedRows}
              rowExpansionTemplate={rowExpansionTemplate}
              onRowToggle={(e: any) => setExpandedRows(e.data)}
              size="small"
              emptyMessage="Aún no hay contrato"
              className="!overflow-hidden   !border-none"
              value={data?.data}
              filters={filters}
              globalFilterFields={["Property.street", "Client.fullName"]}
              // paginator
              // rows={RowsToShow}
              // paginatorTemplate='FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink'
              // currentPageReportTemplate='{first} al {last} de {totalRecords}'
              // paginatorLeft={<RefreshData action={refetch} />}
              dataKey="id"
              responsiveLayout="scroll"
            >
              <Column
                expander={allowExpansion}
                headerClassName="!border-none dark:!bg-gray-800 dark:!text-slate-400"
                className={`dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 `}
                style={{ width: "0.5rem" }}
              />
              <Column
                field="Property.street"
                body={(data) => (
                  <span
                    className={`${
                      data.DebtClients.filter((d: any) => !d.paid).length > 0
                        ? "text-red-400"
                        : ""
                    }`}
                  >
                    {data.Property.street} {data.Property.number}{" "}
                    {data.Property.floor} {data.Property.dept}
                  </span>
                )}
                header="Propiedad"
                headerClassName="!border-none dark:!bg-gray-800 dark:!text-slate-400"
                className="dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 "
                sortable
              />
              <Column
                field="Property.folderNumber"
                header="Carpeta"
                headerClassName="!border-none dark:!bg-gray-800 dark:!text-slate-400"
                className="dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 "
                sortable
              />
              <Column
                field="Client.fullName"
                body={(data) => (
                  <span
                    className={`${
                      data.DebtClients.filter((d: any) => !d.paid).length > 0
                        ? "text-red-400"
                        : ""
                    }`}
                  >
                    {data.Client ? (
                      <>
                        {data.Client?.fullName}{" "}
                        <span className="text-sm"> ({data.Client?.cuit}) </span>
                      </>
                    ) : (
                      <span className="text-red-400 font-light text-sm italic">
                        Inquilino no encontrado
                      </span>
                    )}
                  </span>
                )}
                header="Inquilino"
                headerClassName="!border-none dark:!bg-gray-800 dark:!text-slate-400"
                className="dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 "
                sortable
              />
              <Column
                field="startDate"
                header="Fecha inicio"
                body={(data) => (
                  <span>{formatDateDDMMYYYY(data.startDate)}</span>
                )}
                headerClassName="!border-none dark:!bg-gray-800 dark:!text-slate-400"
                className="dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 "
                sortable
              />
              <Column
                field="endDate"
                header="Fecha fin"
                body={(data) => <span>{formatDateDDMMYYYY(data.endDate)}</span>}
                headerClassName="!border-none dark:!bg-gray-800 dark:!text-slate-400"
                className="dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 "
                sortable
              />
              <Column
                field="state"
                header="Estado"
                sortable
                body={(data) => (
                  <span className={`font-bold `}> {data.state}</span>
                )}
                headerClassName="!border-none dark:!bg-gray-800 dark:!text-slate-400"
                className="dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 "
              />
              <Column
                field="state"
                header="Año"
                body={(data: Contract) => (
                  <span
                    className={`${
                      diferenceBetweentwoDatesInYears(
                        data.startDate,
                        new Date().toISOString().slice(0, 10)
                      ) === 3 && "text-yellow-500 font-bold"
                    }`}
                  >
                    {diferenceBetweentwoDatesInYears(
                      data.startDate,
                      new Date().toISOString().slice(0, 10)
                    )}
                  </span>
                )}
                headerClassName="!border-none dark:!bg-gray-800 dark:!text-slate-400"
                className="dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 "
              />
              <Column
                field=""
                header="Monto Actual"
                body={(data) => (
                  <span className={`font-bold`}>
                    $
                    {
                      data.PriceHistorials.sort(
                        (a: IHistorialPrice, b: IHistorialPrice) => a.id - b.id
                      )[data.PriceHistorials.length - 1]?.amount
                    }
                  </span>
                )}
                headerClassName="!border-none dark:!bg-gray-800 dark:!text-slate-400"
                className="dark:bg-slate-700 dark:text-slate-400 dark:!border-slate-600 "
              />
            </DataTable>
          </Box>
        </>
      ) : (
        <EmptyData text="Aún no hay deuda" />
      )}

      {isFetching && <Loading h={40} w={40} />}
      <DeleteModal
        show={show}
        setShow={setShow}
        savingOrUpdating={savingOrUpdating}
        destroy={() => destroy(currentDebt.current?.id!)}
        text={`La deuda del periodo ${currentDebt.current?.month}/${currentDebt.current?.year} de  monto   $ ${currentDebt.current?.amount}`}
      />
      <CreateModal
        show={showCreateModal}
        closeModal={closeCreateModal}
        overlayClick={false}
        className="max-w-[1000px] sm:w-[600px]"
        titleText={`Editar deuda inquilino`}
      >
        <CloseOnClick action={closeCreateModal} />
        <form onSubmit={handleUpdateDebts}>
          <CustomInput
            placeholder="1234.90"
            type="number"
            initialValue={amount}
            onChange={(value) => handleInputChange(value, "amount")}
            label="Monto"
            required
            hasError={errors?.amount}
            errorText="El monto es requerido"
          />

          <FormActionBtns
            savingOrUpdating={savingOrUpdating}
            onClose={closeCreateModal}
          />
        </form>
      </CreateModal>
    </div>
  );
};

export default DebtsClients;
