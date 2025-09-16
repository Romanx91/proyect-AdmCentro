const { PaymentClient, Eventuality, DebtClient, Client, Property, PaymentType, Contract, sequelize } = require('../../models')

const { all, paginate, findOne, update } = require('../Generic/FactoryGeneric')
const { catchAsync } = require('../../helpers/catchAsync')
const { monthsInSpanish } = require('../../helpers/variablesAndConstantes')
const { Sequelize } = require('sequelize')

exports.GetAll = all(PaymentClient, {
  include: [
    {
      model: Contract,
      include: [
        {
          model: Property
        },
        {
          model: Client
        }
      ]
    },
    {
      model: PaymentType
    }
  ]
})
exports.Paginate = paginate(PaymentClient, {
  include: [
    {
      model: Contract
    },
    {
      model: PaymentType
    }
  ]
})

// const periodTemplate = (data) => {
//   const monthSet = new Set()
//   const yearSet = new Set()
//   // validate if the payment has some debt
//   const prevDebts = data.expenseDetails
//     .filter((item) => item.hasOwnProperty('debt'))
//     .map((item) => ({ month: item.month, year: item.year }))
//   // validate if the payment was for the actual month
//   const curMonthPaid = data.expenseDetails.filter((item) => item.hasOwnProperty('paidCurrentMonth'))
//   if (prevDebts.length > 0) {
//     prevDebts.forEach((item) => {
//       monthSet.add(item.month)
//       yearSet.add(item.year)
//     })
//   }
//   if (curMonthPaid.length > 0 || (prevDebts.length === 0 && curMonthPaid.length === 0)) {
//     monthSet.add(monthsInSpanish.findIndex((item) => item === data.month) + 1)
//     yearSet.add(data.year)
//   }
//   return (
//     Array.from(monthSet)
//       .map((item) => monthsInSpanish[item - 1])
//       .join('-') +
//     '/' +
//     Array.from(yearSet).join('-')
//   )
// }

exports.Post = catchAsync(async (req, res, next) => {
  const transact = await sequelize.transaction()
  try {
    let paidCurMonth = false
    if (req.body.expenseDetails.length > 0) {
      for (let j = 0; j < req.body.expenseDetails.length; j++) {
        if (req.body.expenseDetails[j]?.debt) {
          await DebtClient.update(
            {
              paid: true,
              paidDate: new Date()
            },
            {
              where: {
                id: req.body.expenseDetails[j].id
              },
              transaction: transact
            }
          )
        }

        if (req.body.expenseDetails[j].hasOwnProperty('paidCurrentMonth')) {
          paidCurMonth = true
        }
      }
    }
    req.body.paidCurrentMonth = paidCurMonth

    const payment = await PaymentClient.create(req.body, { transaction: transact })

    if (req.body.paidTotal && req.body.paidTotal > 0 && req.body.paidTotal !== req.body.total) {
      // add a eventualities with the difference
      // let text = req.body.paidTotal > req.body.total ? 'A cuenta ' : 'Saldo '
      // const monthAndYearText = periodTemplate(req.body)
      await Eventuality.create(
        {
          description: req.body.paidTotalText,
          // req.body.month + '/' + req.body.year,
          ownerAmount: 0,
          clientAmount: req.body.total - req.body.paidTotal,
          amount: req.body.total - req.body.paidTotal,
          clientPaid: false,
          isReverted: true,
          ownerPaid: true,
          expiredDate: new Date().getTime() + 30 * 24 * 60 * 60 * 1000, //actual date plus 1 month
          // ContractId: req.body.ContractId,
          paymentId: payment.id,
          // PropertyId: req.body.PropertyId,
          ContractId: req.body.ContractId
        },
        {
          transaction: transact
        }
      )
    }
    console.log('leggo')

    if (req.body.eventualityDetails.length > 0) {
      for (let j = 0; j < req.body.eventualityDetails.length; j++) {
        await Eventuality.update(
          { clientPaid: true },
          {
            where: { id: req.body.eventualityDetails[j].id },
            transaction: transact
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
      data: payment
    })
  } catch (error) {
    await transact.rollback()
    // return next()
    throw error
  }
})

exports.GetById = findOne(PaymentClient, {
  include: [
    {
      model: Contract
    },
    {
      model: PaymentType
    }
  ]
})

exports.Put = update(PaymentClient, ['PaymentTypeId', 'recharge', 'total', 'month', 'year', 'eventualityDetails', 'ExpenseDetails', 'obs'])
exports.allDebt = (req, res, next) => {}

exports.Destroy = catchAsync(async (req, res, next) => {
  const payment = await PaymentClient.findByPk(req.params.id)
  if (!payment) return next(new AppError('No existe el pago', 404))

  const transact = await sequelize.transaction()
  try {
    if (payment.expenseDetails.length > 0) {
      for (let j = 0; j < payment.expenseDetails.length; j++) {
        if (payment.expenseDetails[j].debt && !payment.expenseDetails[j].recharge) {
          await DebtClient.update(
            {
              paid: false,
              paidDate: null
            },
            {
              where: {
                id: payment.expenseDetails[j].id
              },
              transaction: transact
            }
          )
        } else {
          const mon = monthsInSpanish.findIndex((a) => a == payment.month) + 1
          if (mon == new Date().getMonth() + 1 && payment.year == new Date().getFullYear()) {
          } else {
            if (!payment.expenseDetails[j].recharge) {
              await DebtClient.create(
                {
                  ContractId: payment.expenseDetails[j].ContractId,
                  amount: payment.expenseDetails[j].amount,
                  description: payment.expenseDetails[j].description,
                  month: monthsInSpanish.findIndex((a) => a == payment.month) + 1,
                  year: payment.year
                },
                { transaction: transact }
              )
            }
          }
        }
      }
    }

    await Eventuality.destroy({
      where: { paymentId: payment.id, isReverted: true },
      transaction: transact
    })

    if (payment.eventualityDetails.length > 0) {
      for (let j = 0; j < payment.eventualityDetails.length; j++) {
        await Eventuality.update(
          { clientPaid: false },
          {
            where: { id: payment.eventualityDetails[j].id },
            transaction: transact
          }
        )
      }
    }

    await PaymentClient.destroy({ where: { id: req.params.id }, force: true }, { transaction: transact })
    await transact.commit()
    return res.json({
      code: 200,
      status: 'success',
      ok: true,
      message: 'El registro fue eliminado con exito'
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

  const all = await PaymentClient.findAll({
    where: _where,
    // attributes: ['month', 'year', 'total', 'paidTotal', 'PaymentTypeId'],
    include: [
      {
        model: PaymentType,
        attributes: ['name'] // Empty attributes to exclude unnecessary columns from the result
      },
      {
        model: Contract,
        attributes: ['id'],
        include: [
          {
            model: Property,
            attributes: ['id', 'street', 'number', 'floor', 'dept', 'folderNumber']
          }
        ]
      }
    ]
  })

  const getTotalByPaymentType = await PaymentClient.findAll({
    attributes: [
      [Sequelize.literal('PaymentType.name'), 'PaymentTypeName'],
      [
        Sequelize.fn('SUM', Sequelize.fn('COALESCE', Sequelize.fn('NULLIF', Sequelize.col('paidTotal'), 0), Sequelize.col('total'))),
        'total'
      ]
    ],
    include: [
      {
        model: PaymentType,
        attributes: [] // Empty attributes to exclude unnecessary columns from the result
      }
    ],
    where: _where,
    group: ['PaymentType.id', 'PaymentType.name'],
    raw: true // To get plain JSON objects instead of Sequelize instances
  })

  const getTotalByMonth = await PaymentClient.findAll({
    attributes: [
      [Sequelize.literal('PaymentClient.month'), 'month'],
      [
        Sequelize.fn('SUM', Sequelize.fn('COALESCE', Sequelize.fn('NULLIF', Sequelize.col('paidTotal'), 0), Sequelize.col('total'))),
        'total'
      ]
    ],
    where: _where,
    group: ['PaymentClient.month'],
    raw: true // To get plain JSON objects instead of Sequelize instances
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
