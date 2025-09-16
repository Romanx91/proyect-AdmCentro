const { PaymentOwner, Eventuality, Owner, Property, Contract, PaymentType, DebtOwner, sequelize } = require('../../models')

const { all, paginate, findOne, update } = require('../Generic/FactoryGeneric')
const { catchAsync } = require('../../helpers/catchAsync')
const { monthsInSpanish } = require('../../helpers/variablesAndConstantes')
const { Sequelize } = require('sequelize')

exports.GetAll = all(PaymentOwner, {
  include: [
    {
      model: Owner,
    },
    {
      model: PaymentType,
    },
  ],
})
exports.Paginate = paginate(PaymentOwner, {
  include: [
    {
      model: Contract,
      include: {
        model: Property,
      },
    },
    {
      model: PaymentType,
    },
  ],
})

exports.Post = catchAsync(async (req, res, next) => {
  const transact = await sequelize.transaction()
  try {
    const payment = await PaymentOwner.create(req.body, { transaction: transact })

    if (req.body.expenseDetails.length > 0) {
      for (let j = 0;j < req.body.expenseDetails.length;j++) {
        if (req.body.expenseDetails[j].debt) {
          await DebtOwner.update(
            {
              paid: true,
              paidDate: new Date(),
            },
            {
              where: { id: req.body.expenseDetails[j].id },
              transaction: transact,
            }
          )
        }
      }
    }

    if (req.body.eventualityDetails.length > 0) {
      for (let j = 0;j < req.body.eventualityDetails.length;j++) {
        await Eventuality.update(
          {
            ownerPaid: true,
          },
          {
            where: {
              id: req.body.eventualityDetails[j].id,
            },
            transaction: transact,
          }
        )
      }
    }

    await transact.commit()
    return res.json({
      code: 200,
      status: 'success',
      ok: true,
      message: 'El registro fue guardado con exito',
    })
  } catch (error) {
    await transact.rollback()
    throw error
  }
})

exports.GetById = findOne(PaymentOwner, {
  include: [
    {
      model: Contract,
      include: {
        model: Property,
      },
    },
    {
      model: PaymentType,
    },
  ],
})

exports.Put = update(PaymentOwner, ['PaymentTypeId', 'OwnerId', 'total', 'month', 'year', 'eventualityDetails', 'ExpenseDetails', 'obs'])
exports.Destroy = catchAsync(async (req, res, next) => {
  const payment = await PaymentOwner.findByPk(req.params.id)
  const transact = await sequelize.transaction()
  try {
    if (payment.expenseDetails.length > 0) {
      for (let j = 0;j < payment.expenseDetails.length;j++) {
        if (payment.expenseDetails[j].debt) {
          await DebtOwner.update(
            {
              paid: false,
              paidDate: null,
            },
            {
              where: { id: payment.expenseDetails[j].id },
              transaction: transact,
            }
          )
        } else {
          const mon = monthsInSpanish.findIndex((a) => a == payment.month) + 1
          if (mon == new Date().getMonth() + 1 && payment.year == new Date().getFullYear()) {
          } else {
            await DebtOwner.create(
              {
                ContractId: payment.expenseDetails[j].ContractId,
                amount: payment.expenseDetails[j].amount,
                description: payment.expenseDetails[j].description,
                month: monthsInSpanish.findIndex((a) => a == payment.month) + 1,
                year: payment.year,
              },
              { transaction: transact }
            )
          }
        }
      }
    }

    if (payment.eventualityDetails.length > 0) {
      for (let j = 0;j < payment.eventualityDetails.length;j++) {
        await Eventuality.update(
          {
            ownerPaid: false,
          },
          {
            where: {
              id: payment.eventualityDetails[j].id,
            },
            transaction: transact,
          }
        )
      }
    }
    await PaymentOwner.destroy({ where: { id: req.params.id }, force: true, transaction: transact })
    await transact.commit()
    return res.json({
      code: 200,
      status: 'success',
      ok: true,
      message: 'El registro fue eliminado con exito',
      //   data: payment,
    })
  } catch (error) {
    await transact.rollback()
    throw error
  }
})

exports.statistics = catchAsync(async (req, res, next) => {
  const { month, year } = req.query
  const _where = {}
  if (month && month != 'undefined') _where.month = month
  if (year && year != 'undefined') _where.year = year
  const all = await PaymentOwner.findAll({
    where: _where,
    // attributes: ['month', 'year', 'total', 'paidTotal', 'PaymentTypeId'],
    include: [
      {
        model: PaymentType,
        attributes: ['name'], // Empty attributes to exclude unnecessary columns from the result
      },
      {
        model: Owner,
        attributes: ['id', 'fullName', 'email', 'cuit'],
        // include: [
        //   {
        //     model: Property,
        //     attributes: ['id', 'street', 'number', 'floor', 'dept', 'folderNumber'],
        //   },

        // ]
      },
    ],
  })
  const getTotalByPaymentType = await PaymentOwner.findAll({
    attributes: [
      [Sequelize.literal('PaymentType.name'), 'PaymentTypeName'],
      [Sequelize.fn('SUM', Sequelize.col('total')), 'total'],
    ],
    include: [
      {
        model: PaymentType,
        attributes: [], // Empty attributes to exclude unnecessary columns from the result
      },
    ],
    where: _where,
    group: ['PaymentType.id', 'PaymentType.name'],
    raw: true, // To get plain JSON objects instead of Sequelize instances
  })

  const getTotalByMonth = await PaymentOwner.findAll({
    attributes: [
      [Sequelize.literal('PaymentOwner.month'), 'month'],
      [Sequelize.fn('SUM', Sequelize.col('total')), 'total'],
    ],
    where: _where,
    group: ['PaymentOwner.month'],
    raw: true, // To get plain JSON objects instead of Sequelize instances
  })

  return res.json({
    ok: true,
    code: 200,
    status: 'success',
    getTotalByPaymentType,
    getTotalByMonth,
    all
  })
})
