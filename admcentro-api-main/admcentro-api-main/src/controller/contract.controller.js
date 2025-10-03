const {
  Contract,
  Client,
  Assurance,
  ClientExpense,
  OwnerExpense,
  Property,
  sequelize,
  PriceHistorial,
  Owner,
  DebtOwner,
  DebtClient,
  Eventuality,
  PaymentClient,
  PaymentType,
} = require("../../models");
const { Op } = require("sequelize");
const { all, paginate, findOne, update } = require("../Generic/FactoryGeneric");
const AppError = require("../../helpers/AppError");
const { catchAsync } = require("../../helpers/catchAsync");

exports.GetAll = all(Contract, {
  include: [
    { model: Client },
    { model: Property, include: { model: Owner } },
    { model: PriceHistorial },
    { model: Assurance },
  ],
});
exports.Paginate = paginate(Contract, {
  include: [{ model: Client }, { model: Property }],
});

exports.GetOwnerContracts = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const properties = await Property.findAll({
    where: {
      OwnerId: id,
      // state: "Ocupado",
    },
    attributes: ["id"],
  });
  const ids = properties.map((p) => p.id);
  const contracts = await Contract.findAll({
    where: {
      PropertyId: { [Op.in]: ids },
      // state: "En curso",
      startDate: { [Op.lte]: new Date() },
      // endDate: { [Op.gt]: new Date() },
    },
    include: [
      { model: PriceHistorial },
      { model: Client },
      { model: Property },
    ],
  });
  return res.json({
    code: 200,
    status: "success",
    ok: true,
    results: contracts.length,
    message: "Lista de contratos",
    data: contracts,
  });
});

exports.Post = catchAsync(async (req, res, next) => {
  const { PropertyId, amount, assurances } = req.body;

  const p = await Property.findOne({
    where: { id: PropertyId, state: "Libre" },
  });

  if (!p)
    return next(
      new AppError("Existe un contrato vigente para esta propiedad", 400)
    );

  const result = await sequelize.transaction(async (t) => {
    const cont = await Contract.create(req.body, { transaction: t });

    const updPro = await Property.update(
      { state: "Ocupado" },
      { where: { id: PropertyId }, transaction: t }
    );

    if (updPro[0] <= 0) {
      await t.rollback();
      return next(
        new AppError("No se pudo actualizar el estado de la propiedad", 400)
      );
    }

    if (assurances !== undefined && assurances.length > 0) {
      for (let j = 0; j < assurances.length; j++) {
        assurances[j].ContractId = cont.id;
        await Assurance.create(assurances[j], { transaction: t });
      }
    }

    await PriceHistorial.create(
      {
        ContractId: cont.id,
        amount: amount,
        year: 1,
        percent: 0,
      },
      { transaction: t }
    );

    return res.json({
      code: 200,
      status: "success",
      ok: true,
      message: "El registro fue guardado con exito",
      data: cont,
    });
  });
});

exports.GetById = findOne(Contract, {
  include: [
    {
      model: Client,
    },
    {
      model: Property,
    },
    {
      model: Assurance,
    },
    {
      model: PriceHistorial,
    },
    {
      model: ClientExpense,
    },
    {
      model: OwnerExpense,
    },
  ],
});
exports.Put = update(Contract, [
  "PropertyId",
  "ClientId",
  "startDate",
  "endDate",
  "amount",
  "deposit",
  "booking",
  "state",
  "description",
  "admFeesPorc",
  "currency",
  "paymentType",
  "adjustmentMonth",
]);
exports.Destroy = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const contract = await Contract.findOne({ where: { id } });
  if (!contract) return next(new AppError("No se encontró el contrato", 400));

  const debts = await DebtClient.findAll({
    where: { ContractId: id, paid: false },
  });
  if (debts.length > 0)
    return next(
      new AppError(
        "El inquilino tiene deudas pendientes,no se puede eliminar el contrato.",
        400
      )
    );

  // const payments = await DebtOwner.findAll({ where: { ContractId: id, paid: false } },)
  // if (payments.length > 0) return next(new AppError("El propietario tiene pagos pendientes,no se puede eliminar el contrato.", 400))

  const events = await Eventuality.findAll({
    where: {
      PropertyId: contract.PropertyId,
      clientAmount: { [Op.ne]: 0 },
      clientPaid: false,
    },
  });

  if (events.length > 0)
    return next(
      new AppError(
        "El inquilino tiene eventualidades sin pagar/cobrar,no se puede eliminar el contrato.",
        400
      )
    );

  // const eventsOwners = await Eventuality.findAll(
  //   {
  //     where: {
  //       PropertyId: contract.PropertyId,
  //       ownerAmount: { [Op.ne]: 0 },
  //       ownerPaid: false,
  //     },
  //   },
  // )

  // if (eventsOwners.length > 0) return next(new AppError("El propietario tiene eventualidades sin pagar/cobrar,no se puede eliminar el contrato.", 400))

  const result = await sequelize.transaction(async (t) => {
    await Property.update(
      { state: "Libre" },
      {
        where: { id: contract.PropertyId },
        transaction: t,
      }
    );

    await Contract.update(
      { state: "Finalizado" },
      { where: { id }, transaction: t }
    );
    await Contract.destroy({ where: { id }, transaction: t });
    return res.json({
      ok: true,
      status: "success",
      message: "El registro fue eliminado con exito",
    });
  });
});

exports.finish = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const contract = await Contract.findOne({ where: { id } });
  if (!contract) return next(new AppError("No se encontró el contrato", 400));

  const clientDebts = await DebtClient.findAll({
    where: { ContractId: id, paid: false },
  });
  const ownerDebts = await DebtOwner.findAll({
    where: { ContractId: id, paid: false },
  });
  const unpaidClientEvents = await Eventuality.findAll({
    where: {
      PropertyId: contract.PropertyId,
      clientAmount: { [Op.ne]: 0 },
      clientPaid: false,
    },
  });

  const unpaidOwnerEvents = await Eventuality.findAll({
    where: {
      PropertyId: contract.PropertyId,
      ownerAmount: { [Op.ne]: 0 },
      ownerPaid: false,
    },
  });

  // if (clientDebts.length > 0) return next(new AppError('El inquilino tiene deudas pendientes,no se puede finalizar el contrato.', 400))
  // if (ownerDebts.length > 0) return next(new AppError('El propietario tiene pagos pendientes,no se puede finalizar el contrato.', 400))
  // if (unpaidClientEvents.length > 0)
  //   return next(new AppError('El inquilino tiene eventualidades sin pagar/cobrar,no se puede finalizar el contrato.', 400))

  // if (unpaidOwnerEvents.length > 0)
  //   return next(new AppError('El propietario tiene eventualidades sin pagar/cobrar,no se puede finalizar el contrato.', 400))
  // check if  the contract has a debts or unpaid events
  let newState = "Finalizado";

  if (
    clientDebts.length > 0 ||
    ownerDebts.length > 0 ||
    unpaidClientEvents.length > 0 ||
    unpaidOwnerEvents.length > 0
  ) {
    newState = "Pendiente";
  }

  const result = await sequelize.transaction(async (t) => {
    await Property.update(
      { state: "Libre" },
      {
        where: { id: contract.PropertyId },
        transaction: t,
      }
    );

    await Contract.update(
      { state: newState, motive: req.body.motive },
      { where: { id }, transaction: t }
    );
    return res.json({
      ok: true,
      status: "success",
      state: newState,
      message:
        newState === "Finalizado"
          ? "El contrato se finalizó con éxito"
          : "El contrato se finalizó con éxito, pero tiene deudas pendientes. Visita la pestaña Contratos pendientes para poder finalizarlo y realizar los pagos y/o cobros correspondientes",
    });
  });
});

exports.ExpiredContracts = catchAsync(async (req, res, next) => {
  const days = req.params.days * 1;

  const docs = await Contract.findAll({
    where: {
      // [Op.or]: [
      //   sequelize.where(
      //     sequelize.fn(
      //       "datediff",
      //       sequelize.fn("NOW"),
      //       sequelize.col("startDate")
      //     ),
      //     {
      //       [Op.between]: [365.25 - days, 365.25],
      //     }
      //   ),
      //   sequelize.where(
      //     sequelize.fn(
      //       "datediff",
      //       sequelize.fn("NOW"),
      //       sequelize.col("startDate")
      //     ),
      //     {
      //       [Op.between]: [730.5 - days, 730.5],
      //     }
      //   ),
      //   sequelize.where(
      //     sequelize.fn(
      //       "datediff",
      //       sequelize.fn("NOW"),
      //       sequelize.col("startDate")
      //     ),
      //     {
      //       [Op.between]: [1095.75 - days, 1095.75],
      //     }
      //   ),
      // ],
      startDate: {
        [Op.lte]: new Date(),
      },
      endDate: {
        [Op.gt]: new Date(),
      },
      state: "En curso",
    },
    include: [
      { model: Client },
      { model: Property, include: { model: Owner } },
      { model: PriceHistorial },
    ],
  });

  return res.json({
    results: docs.length,
    ok: true,
    status: "success",
    data: docs,
  });
});

exports.HistorialPayments = all(Contract, {
  include: [
    // { model: PaymentOwner },
    { model: Client },
    { model: PriceHistorial },
    {
      model: PaymentClient,
      order: [["id", "DESC"]],
      include: { model: PaymentType },
    },
    { model: Property, include: { model: Owner } },
  ],
  order: [
    ["id", "DESC"],
    [PaymentClient, "createdAt", "DESC"],
  ],
});

exports.HistorialPrice = all(Contract, {
  include: [
    { model: PriceHistorial },
    { model: Property, include: { model: Owner } },
  ],
});

// para obtener las deudas pagas o impagos de los clientes
exports.DebtsClients = catchAsync(async (req, res, next) => {
  const docs = await Contract.findAll({
    include: [
      { model: Client },
      { model: Property, include: { model: Owner } },
      { model: PriceHistorial },
      { model: DebtClient },
      { model: Eventuality },
    ],
  });

  return res.json({
    results: docs.length,
    ok: true,
    status: "success",
    data: docs,
  });
});

//  para obtener las deudas pagas o impagos de los propietarios
exports.DebtsOwners = catchAsync(async (req, res, next) => {
  const docs = await Contract.findAll({
    include: [
      { model: Client },
      { model: Property, include: { model: Owner } },
      { model: PriceHistorial },
      { model: DebtOwner },
      { model: Eventuality },
    ],
  });

  return res.json({
    results: docs.length,
    ok: true,
    status: "success",
    data: docs,
  });
});
