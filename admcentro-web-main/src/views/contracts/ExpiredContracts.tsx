import { useState } from "react";
import { Dropdown } from "primereact/dropdown";
import Box from "../../components/Box";
import Loading from "../../components/Loading";
import RequestError from "../../components/RequestError";
import { useContracts } from "../../hooks/useContracts";
import {
  diferenceBetweentwoDatesInYears,
  diffenceBetweenDates,
  formatDateDDMMYYYY,
} from "../../helpers/date";
// @ts-expect-error
import html2pdf from "html2pdf.js";
import BoxContainerPage from "../../components/BoxContainerPage";
import { Contract, IHistorialPrice } from "../../interfaces/Icontracts";
import { DobleChevronAngle } from "../../components/icons/DobleChevronAngle";

/* ==================== HELPERS ==================== */

// Convierte "YYYY-MM-DD" a fecha LOCAL 00:00:00
function fromISOToLocalMidnight(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function toLocalMidnight(d: Date) {
  const nd = new Date(d);
  nd.setHours(0, 0, 0, 0);
  return nd;
}

// 🔥 NUEVA LÓGICA: rango por meses desde el 1° del mes actual
function getMonthBasedRange(months: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1); // 1/mes_actual

  // Mes final: mes_actual + months
  const totalMonths = now.getMonth() + months;
  const finalYear = now.getFullYear() + Math.floor(totalMonths / 12);
  const finalMonth = totalMonths % 12;

  // Último día del mes final
  const end = new Date(finalYear, finalMonth + 1, 0); // "0" → último día del mes anterior

  return {
    start: toLocalMidnight(start),
    end: toLocalMidnight(end),
  };
}

function isWithinMonthRange(target: Date, months: number): boolean {
  const { start, end } = getMonthBasedRange(months);
  const t = toLocalMidnight(target);
  return t >= start && t <= end;
}

// 🔥 FIN NUEVA LÓGICA

function getAdjustmentDates(contract: Contract) {
  const { adjustmentMonth } = contract;
  let start: Date;

  // Si hay historial de precios, usamos la última fecha como base
  if (contract.PriceHistorials && contract.PriceHistorials.length > 0) {
    const lastAdjustment = contract.PriceHistorials.reduce((latest, current) =>
      new Date(current.createdAt) > new Date(latest.createdAt)
        ? current
        : latest
    );
    start = toLocalMidnight(new Date(lastAdjustment.createdAt));
    console.log(
      `✅ Último ajuste: ${
        start.toISOString().split("T")[0]
      } (día: ${start.getDate()})`
    );
  } else {
    // Si no hay historial, usamos startDate
    start = toLocalMidnight(new Date(contract.startDate));
    console.log(
      `✅ Sin historial, usando startDate: ${start.toISOString().split("T")[0]}`
    );
  }

  const endLocal = toLocalMidnight(new Date(contract.endDate));

  const adjustmentDates: string[] = [];
  function toISODate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  // Calcular el próximo ajuste a partir del último ajuste
  while (start <= endLocal) {
    const dayOfMonth = start.getDate();
    const lastDayOfMonth = new Date(
      start.getFullYear(),
      start.getMonth() + 1,
      0
    ).getDate();
    const midMonth = Math.ceil(lastDayOfMonth / 2); // Mitad del mes

    console.log(
      `   ➡️ Día actual: ${dayOfMonth}, último día del mes: ${lastDayOfMonth}, mitad: ${midMonth}`
    );

    let nextAdjustment = new Date(start);
    if (dayOfMonth >= midMonth) {
      // Segunda mitad del mes → próximo ajuste es 1° del mes siguiente
      nextAdjustment.setMonth(nextAdjustment.getMonth() + 1);
      nextAdjustment.setDate(1);
      console.log(
        `   ✅ Segunda mitad → próximo ajuste: ${
          nextAdjustment.toISOString().split("T")[0]
        }`
      );
    } else {
      // Primera mitad del mes → próximo ajuste es 1° del mismo mes
      nextAdjustment.setDate(1);
      console.log(
        `   ✅ Primera mitad → próximo ajuste: ${
          nextAdjustment.toISOString().split("T")[0]
        }`
      );
    }

    // Asegurarse de que el ajuste no sea antes del último ajuste

    // Agregar el ajuste
    adjustmentDates.push(toISODate(nextAdjustment));
    console.log(`   📥 Añadido: ${toISODate(nextAdjustment)}`);

    // Avanzar al próximo período
    start = nextAdjustment;
    start.setMonth(start.getMonth() + adjustmentMonth);
    console.log(
      `   ➡️ Siguiente iteración: ${start.toISOString().split("T")[0]}\n`
    );
  }

  // FIN (agrego la fecha de fin exacta si no quedó incluida)
  const endExactISO = toISODate(endLocal);
  if (adjustmentDates[adjustmentDates.length - 1] !== endExactISO) {
    adjustmentDates.push(endExactISO);
    console.log(`   📥 Añadido FIN: ${endExactISO}`);
  }

  // Próxima >= hoy
  const today = toLocalMidnight(new Date());
  let nextAdjustmentDate: string | null = null;
  for (const iso of adjustmentDates) {
    const d = fromISOToLocalMidnight(iso);
    if (d.getTime() >= today.getTime()) {
      nextAdjustmentDate = iso;
      console.log(`   🎯 Próximo ajuste ≥ hoy: ${iso}`);
      break;
    }
  }

  console.log(`\n📊 Resultado final:`, {
    adjustmentDates,
    nextAdjustmentDate,
  });

  return { adjustmentDates, nextAdjustmentDate };
}

interface IContractWithAdj extends Contract {
  adj: {
    adjustmentDates: string[];
    nextAdjustmentDate: string | null;
  };
}

/* ==================== COMPONENT ==================== */

const baseClass =
  " p-2 px-0 text-center border-r border-slate-400 dark:border-slate-700";

const ExpiredContracts = () => {
  const [days, setDays] = useState(60);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const { data, isError, error, isLoading, refetch, isFetching } = useContracts(
    `/expired-contracts/${days}`
  );

  const downloadPdf = async () => {
    setLoadingPdf(true);
    const element = document.getElementById("pdf-download");

    const opt = {
      margin: [0.1, 0.1],
      filename: `CONTRATOS_A_VENCER_EN_${days}_DIAS_${formatDateDDMMYYYY(
        new Date().toISOString()
      )}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "landscape" },
    };
    try {
      await html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.log("error");
    } finally {
      setLoadingPdf(false);
    }
  };

  // 🔥 Convertir días a meses
  const daysToMonths = (days: number): number => {
    if (days === 30) return 1;
    if (days === 60) return 2;
    if (days === 90) return 3;
    if (days === 120) return 4;
    return 2; // fallback
  };

  const months = daysToMonths(days);

  /* === FILTRADO y ORDEN  === */
  const contractsToUpdateOrEnding = data?.data.filter((c: Contract) => {
    const adj = getAdjustmentDates(c);
    const endInRange = isWithinMonthRange(
      fromISOToLocalMidnight(c.endDate),
      months
    );
    const adjInRange = adj.adjustmentDates.some((d) =>
      isWithinMonthRange(fromISOToLocalMidnight(d), months)
    );
    // Solo incluir isFin si el vencimiento está en rango (evita contratos lejanos)
    const isFinAndInRange =
      !!adj.nextAdjustmentDate &&
      adj.nextAdjustmentDate === adj.adjustmentDates.at(-1) &&
      endInRange;

    return endInRange || adjInRange || isFinAndInRange;
  });

  // Agrego adj y ordeno por próxima fecha de ajuste (nulos al final)
  const contractsWithAdjustmentsDate: IContractWithAdj[] | undefined =
    contractsToUpdateOrEnding
      ?.map((contract: Contract) => ({
        ...contract,
        adj: getAdjustmentDates(contract),
      }))
      ?.sort((a, b) => {
        const aNext = a.adj.nextAdjustmentDate
          ? new Date(a.adj.nextAdjustmentDate).getTime()
          : Number.MAX_SAFE_INTEGER;
        const bNext = b.adj.nextAdjustmentDate
          ? new Date(b.adj.nextAdjustmentDate).getTime()
          : Number.MAX_SAFE_INTEGER;
        return aNext - bNext;
      });

  const getDiffBetweenDate = (date: string) =>
    diffenceBetweenDates(date, new Date().toISOString().slice(0, 10));

  if (isLoading) return <Loading />;
  if (isError) return <RequestError error={error} />;

  return (
    <BoxContainerPage className=" contenedor !max-w-[100%] !z-5">
      {/* Controles */}
      <Box className="expired-contracts !p-0 w-auto !m-0 !border-0 !shadow-none !bg-transparent flex items-end gap-x-4">
        <fieldset className="w-full sm:w-40 mb-0 ">
          <label htmlFor="days">Cantidad de días</label>
          <Dropdown
            value={days}
            onChange={(e: any) => setDays(e.value)}
            dropdownIcon={() => (
              <span className="dark:text-slate-400">
                <DobleChevronAngle />
              </span>
            )}
            options={[30, 60, 90, 120]}
            placeholder="Cantidad días"
            className="h-[42px]  items-center !bg-transparent !border-gray-400 dark:!border-gray-700  dark:!text-slate-400 "
          />
        </fieldset>
        <button
          className="btn !bg-transparent border border-brand2 dark:border-brand hover:!bg-gray-100 dark:text-slate-400 dark:hover:!bg-slate-700 dark:hover:!text-slate-300"
          onClick={() => refetch()}
        >
          Buscar
        </button>
      </Box>

      {/* Tabla */}
      <div className="  dark:text-slate-500  " id="pdf-download">
        <h2 className="my-4 text-2xl font-semibold leading-tight">
          <span>
            Próximos contratos a ajustar o vencer
            <br />{" "}
            <span className="text-sm"> en los próximos {days} días </span>
          </span>
        </h2>

        <div
          className=" !p-0 !m-0  !border-none !shadow-none sm:mx-0 mb-4
    w-auto
    overflow-x-auto
    overflow-y-auto
    touch-pan-x
    touch-pan-y

    [-webkit-overflow-scrolling:touch]
    !bg-transparent
    rounded-lg "
        >
          <div className="!p-0 !m-0 inline-block  w-max min-w-[950px] text-xs text-left whitespace-nowrap">
            <div className="!p-0 w-full   text-xs text-left whitespace-nowrap">
              <div className=" rounded-t-lg  ">
                <div className="flex px-1 gap-1 font-semibold border-b border-slate-300 dark:border-slate-700 text-center">
                  <div className={`w-[70px]  ${baseClass}`}>
                    <span className="p-3 pl-0">Fec. Inicio</span>
                  </div>
                  <div className={`w-[70px]  ${baseClass}`}>
                    <span className="p-3 pl-0">Fec. Vto</span>
                  </div>
                  <div className={`w-[105px]   ${baseClass}`}>
                    <span className="p-3 pl-0 ">Fec. Prox. ajuste</span>
                  </div>
                  <div className={`w-[70px] ${baseClass}`}>
                    <span className="p-3 pl-0 ">Ult. Ajuste</span>
                  </div>
                  <div className={`w-[60px]   ${baseClass}`}>
                    <span className="p-3 pl-0 ">Ajuste</span>
                  </div>
                  <div className={`w-[120px]    ${baseClass}`}>
                    <span className="p-3 pl-0">Propiedad</span>
                  </div>
                  <div className={`w-[40px]   ${baseClass}`}>
                    <span className="p-3 pl-0 ">Año</span>
                  </div>
                  <div className={`w-[120px]   ${baseClass}`}>
                    <span className="p-3 pl-0">Propietario</span>
                  </div>

                  <div className={`w-[120px]   ${baseClass}`}>
                    <span className="p-3 pl-0">Inquilino</span>
                  </div>
                  <div className={`w-[50px]  ${baseClass}`}>
                    <span className="p-3 pl-0">CPTA</span>
                  </div>
                  <div className={`w-[80px]  ${baseClass}`}>
                    <span className="p-3 pl-0">Monto Neto</span>
                  </div>
                  <div className="w-[80px] p-2 text-center">
                    <span className="p-3 pl-0">Monto Alq.</span>
                  </div>
                </div>
              </div>
              <div className="">
                {contractsWithAdjustmentsDate?.map((c: IContractWithAdj) => {
                  const ap: IHistorialPrice = c.PriceHistorials.sort(
                    (a: IHistorialPrice, b: IHistorialPrice) => a.id - b.id
                  )[c.PriceHistorials.length - 1];

                  const labelProxAjuste =
                    c.adj.nextAdjustmentDate === c.adj.adjustmentDates.at(-1)
                      ? "FIN"
                      : c.adj.nextAdjustmentDate
                      ? formatDateDDMMYYYY(c.adj.nextAdjustmentDate)
                      : "-";

                  return (
                    <div
                      key={c.id}
                      className="flex px-1 gap-1 border-b border-slate-400 dark:border-slate-700 text-center whitespace-nowrap"
                    >
                      <p className=" whitespace-nowrap w-[70px] text-center border-r border-slate-400 dark:border-slate-700 truncate p-2 px-0  flex items-center justify-center text-balance ">
                        {formatDateDDMMYYYY(c.startDate)}
                      </p>
                      <p className="w-[70px] text-center border-r border-slate-400 dark:border-slate-700 flex items-center justify-center text-balance p-2 px-0 ">
                        {formatDateDDMMYYYY(c.endDate)}
                      </p>

                      {/* botón con tooltip/hover */}
                      <button
                        type="button"
                        title={JSON.stringify(c.adj.adjustmentDates)}
                        className="w-[105px]  text-center border-r border-slate-400 dark:border-slate-700  p-2 px-0  relative group"
                      >
                        {labelProxAjuste}
                        <div className="absolute top-[100%] left-0 divide-y-[1px] rounded-md shadow-xl  group-focus:flex hidden flex-col  bg-white dark:bg-slate-700 dark:divide-slate-800  z-10">
                          {c.adj.adjustmentDates.map((d) => (
                            <span
                              key={d}
                              className={`text-slate-700 dark:text-slate-400 ${
                                d === c.adj.nextAdjustmentDate
                                  ? " !text-brand dark:!text-brand "
                                  : ""
                              } px-3 py-1.5 `}
                            >
                              {formatDateDDMMYYYY(d)}
                            </span>
                          ))}
                        </div>
                      </button>

                      <p className="w-[70px]  text-center border-r border-slate-400 dark:border-slate-700 flex items-center justify-center text-balance p-2 px-0 ">
                        {formatDateDDMMYYYY(ap.createdAt)}
                      </p>

                      <p className="w-[60px] text-center border-r border-slate-400 dark:border-slate-700 flex items-center justify-center text-balance p-2 px-0 ">
                        {c.adjustmentMonth}/meses
                      </p>

                      <p className="w-[120px] text-center border-r border-slate-400 dark:border-slate-700 flex items-center justify-center text-balance p-2 px-0 ">
                        {c.Property.street} {c.Property.number}{" "}
                        {c.Property.dept} - {c.Property.floor}
                      </p>

                      <p className="w-[40px] text-center border-r border-slate-400 dark:border-slate-700 flex items-center justify-center text-balance p-2 px-0 ">
                        <span
                          className={`${
                            diferenceBetweentwoDatesInYears(
                              c.startDate,
                              new Date().toISOString().slice(0, 10)
                            ) === 3 && "text-yellow-500 font-bold"
                          }`}
                        >
                          {diferenceBetweentwoDatesInYears(
                            c.startDate,
                            new Date().toISOString().slice(0, 10)
                          )}
                        </span>
                      </p>

                      <p className="w-[120px] text-center border-r border-slate-400 dark:border-slate-700 flex items-center justify-center text-balance p-2 px-0 ">
                        {c.Property.Owner?.fullName}
                      </p>
                      <p className="w-[120px] text-center border-r border-slate-400 dark:border-slate-700 flex items-center justify-center text-balance p-2 px-0 ">
                        {c.Client.fullName}
                      </p>

                      <p className="w-[50px]    border-r border-slate-400 dark:border-slate-700 flex items-center justify-center text-balance p-2 px-0">
                        {c.Property.folderNumber}
                      </p>
                      <p className="w-[80px]  text-center border-r border-slate-400 dark:border-slate-700 flex items-center justify-center text-balance p-2 px-0 ">
                        ${ap.amount}
                      </p>
                      <p className="w-[80px] flex items-center justify-center text-balance p-2 px-0">
                        $
                        {ap.amount -
                          ap.amount * (c.Property?.Owner?.commision! / 100)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        {isFetching && <Loading h={60} w={60} />}
        <button
          className="btn gradient  !my-4 !w-auto"
          disabled={loadingPdf || data?.data.length == 0}
          onClick={downloadPdf}
        >
          {loadingPdf
            ? "Descargando ... "
            : `Descargar Planilla (${contractsToUpdateOrEnding?.length || 0})`}
        </button>
      </div>
    </BoxContainerPage>
  );
};

export default ExpiredContracts;
