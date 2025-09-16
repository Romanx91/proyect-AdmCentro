const {
  DebtClient,
  Contract,
  ClientExpense,
  Client,
  PaymentClient,
  DebtOwner,
  sequelize,
  Property,
  PriceHistorial,
  PaymentOwner,
  Owner,
  OwnerExpense,
  JobLog,
  Assurance,
  MailLog
} = require('../../models')

const { catchAsync } = require('../../helpers/catchAsync')
const { Op } = require('sequelize')
const { monthsInSpanish } = require('../../helpers/variablesAndConstantes')
const Email = require('../../helpers/email')
const { all } = require('../Generic/FactoryGeneric')

const MAIL_MOTIVE = {
  EXPIRED_CONTRACT: 'VENCIMIENTO DE CONTRATO',
  DEBT: 'DEUDA'
}

exports.GetAll = all(MailLog, {
  include: [{ model: Assurance }, { model: Client }]
})

exports.jobDebtsClients = catchAsync(async (req, res, next) => {
  const month = req?.query?.month ? req.query.month : new Date().getMonth()
  const year = req?.query?.year ? req.query.year : new Date().getFullYear()
  const mothYearText = monthsInSpanish[month == 0 ? 11 : month - 1] + '/' + (month == 0 ? year - 1 : year)
  const d = new Date(year, month - 1, new Date(year, month, 0).getDate())
  d.setDate(d.getDate() - 1)

  const docs2 = await Contract.findAll({
    where: {
      // id: {			// 	[Op.in]: req.query.ids.split(','),			// },
      // id: 44,
      state: 'En curso',
      startDate: { [Op.lt]: new Date(year, month - 1, new Date(year, month, 0).getDate()) }, // 2023-08-31 para mes : 8
      endDate: { [Op.gte]: d }
    },
    // attributes: ['id'],
    include: [{ model: ClientExpense }, { model: Property }, { model: PriceHistorial }]
  })
  // if (1 === 1) return res.json({ ok: true, results: docs2.length, docs2 })

  const transact = await sequelize.transaction()

  let count = 0
  try {
    for (let k = 0; k < docs2.length; k++) {
      let prevExps = []

      //   get payment for the previous month
      let pmtContr = await PaymentClient.findAll({
        where: {
          month: monthsInSpanish[month == 0 ? 11 : month - 1],
          year: month == 0 ? year - 1 : year,
          ContractId: docs2[k].id
        }
      })
      pmtContr.forEach((p) => prevExps.push(...p.expenseDetails))

      const exist = await DebtClient.findOne({
        where: {
          year: month == 0 ? year - 1 : year,
          month: month == 0 ? 12 : month,
          ContractId: docs2[k].id
        }
      })

      //   if (1 === 1) return res.json({ ok: true, results: docs2.length })

      if (!exist) {
        count++
        let textRent =
          'ALQUILER ' +
          docs2[k].Property.street +
          ' ' +
          docs2[k].Property.number +
          ' ' +
          docs2[k].Property.floor +
          ' ' +
          docs2[k].Property.dept +
          ' ' +
          mothYearText
        if (prevExps.filter((pe) => pe.ContractId === docs2[k].id && pe.description === textRent).length <= 0) {
          await DebtClient.create(
            {
              description: textRent,
              amount: docs2[k].PriceHistorials.sort((a, b) => a.id - b.id)[docs2[k].PriceHistorials.length - 1].amount,
              year: month == 0 ? year - 1 : year,
              month: month == 0 ? 12 : month,
              rent: true,
              ContractId: docs2[k].id
            },
            { transaction: transact }
          )
        }

        if (prevExps.filter((pe) => pe.ContractId === docs2[k].id && pe.description === `GASTOS DE GESTION ${mothYearText}`).length <= 0) {
          await DebtClient.create(
            {
              description: `GASTOS DE GESTION ${mothYearText}`,
              amount: docs2[k].PriceHistorials.sort((a, b) => a.id - b.id)[docs2[k].PriceHistorials.length - 1].amount * (3 / 100),
              year: month == 0 ? year - 1 : year,
              month: month == 0 ? 12 : month,
              ContractId: docs2[k].id
            },
            { transaction: transact }
          )
        }

        for (let l = 0; l < docs2[k].ClientExpenses.length; l++) {
          if (
            prevExps.filter(
              (pe) =>
                pe.ContractId === docs2[k].ClientExpenses[l].ContractId &&
                pe.description === docs2[k].ClientExpenses[l].description + ' ' + mothYearText
            ).length <= 0
          ) {
            if (
              (docs2[k].ClientExpenses[l].description !== 'AGUAS' && docs2[k].ClientExpenses[l].description !== 'API') ||
              (docs2[k].ClientExpenses[l].description === 'AGUAS' && (month == 0 ? 12 : month) % 2 === 0) ||
              (docs2[k].ClientExpenses[l].description === 'API' && (month == 0 ? 12 : month) % 2 !== 0)
            ) {
              await DebtClient.create(
                {
                  description: docs2[k].ClientExpenses[l].description + ' ' + mothYearText,
                  amount: docs2[k].ClientExpenses[l].amount,
                  year: month == 0 ? year - 1 : year,
                  month: month == 0 ? 12 : month,
                  ContractId: docs2[k].id
                },
                { transaction: transact }
              )
            }
          }
        }
      }
    }

    await JobLog.create({ type: 'debts', state: 'success', message: `DEBTS CLIENT JOB DONE SUCCESSFULLY(${count}).` })
    await transact.commit()
    console.log(`DEBTS CLIENT JOB DONE SUCCESSFULLY ON :::(${count}) ` + new Date().toLocaleString())

    // return res.json({ ok: true, message: 'DEBTS CLIENT JOB DONE SUCCESSFULLY.' })
  } catch (error) {
    await JobLog.create({
      type: 'debts',
      state: 'fail',
      message: error?.message || 'Something went wrong.'
    })
    await transact.rollback()
  }
})

exports.jobDebtsOwner = catchAsync(async (req, res, next) => {
  const month = req?.query?.month ? req?.query.month : new Date().getMonth()
  const year = req?.query?.year ? req.query.year : new Date().getFullYear()
  const mothYearText = monthsInSpanish[month == 0 ? 11 : month - 1] + '/' + (month == 0 ? year - 1 : year)
  const d = new Date(year, month - 1, new Date(year, month, 0).getDate())
  d.setDate(d.getDate() - 1)
  //   if (1 === 1) return res.json({ ok: true, results: 1 })
  const owners = await Owner.findAll({
    // where: { id: 15 },
    include: [{ model: Property }]
  })

  const transact = await sequelize.transaction()
  let count = 0
  try {
    for (let i = 0; i < owners.length; i++) {
      if (owners[i].Properties.length > 0) {
        // get owner properties ids
        let propertyIds = owners[i].Properties.map((doc) => doc.id)

        // get contracts with owner properties ids
        const docs2 = await Contract.findAll({
          where: {
            PropertyId: { [Op.in]: propertyIds },
            state: 'En curso',
            startDate: { [Op.lt]: new Date(year, month - 1, new Date(year, month, 0).getDate()) },
            endDate: { [Op.gte]: d }
          },
          include: [
            { model: OwnerExpense },
            { model: Property, include: [{ model: Owner, attributes: ['id', 'commision'] }] },
            { model: PriceHistorial }
          ]
        })
        for (let k = 0; k < docs2.length; k++) {
          let prevExps = []
          let pmtContr = await PaymentOwner.findAll({
            where: {
              month: monthsInSpanish[month == 0 ? 11 : month - 1],
              year: month == 0 ? year - 1 : year,
              OwnerId: owners[i].id
            }
          })
          pmtContr.forEach((p) => prevExps.push(...p.expenseDetails))

          const exist = await DebtOwner.findOne({
            where: {
              year: month == 0 ? year - 1 : year,
              month: month == 0 ? 12 : month,
              ContractId: docs2[k].id
            }
          })

          if (!exist) {
            count++
            let textRent =
              'ALQUILER ' +
              docs2[k].Property.street +
              ' ' +
              docs2[k].Property.number +
              ' ' +
              docs2[k].Property.floor +
              ' ' +
              docs2[k].Property.dept +
              ' ' +
              mothYearText
            if (prevExps.filter((pe) => pe.ContractId === docs2[k].id && pe.description === textRent).length <= 0) {
              await DebtOwner.create(
                {
                  description: textRent,
                  amount: docs2[k].PriceHistorials.sort((a, b) => a.id - b.id)[docs2[k].PriceHistorials.length - 1].amount,
                  year: month == 0 ? year - 1 : year,
                  month: month == 0 ? 12 : month,
                  rent: true,
                  ContractId: docs2[k].id
                },
                { transaction: transact }
              )
            }
            let textFees =
              'HONORARIOS ' +
              docs2[k].Property.street +
              ' ' +
              docs2[k].Property.number +
              ' ' +
              docs2[k].Property.floor +
              ' ' +
              docs2[k].Property.dept +
              ' ' +
              mothYearText
            if (prevExps.filter((pe) => pe.ContractId === docs2[k].id && pe.description === textFees).length <= 0) {
              await DebtOwner.create(
                {
                  description: textFees,
                  amount:
                    docs2[k].PriceHistorials.sort((a, b) => a.id - b.id)[docs2[k].PriceHistorials.length - 1].amount *
                    -1 *
                    (docs2[k].Property.Owner.commision / 100),
                  year: month == 0 ? year - 1 : year,
                  month: month == 0 ? 12 : month,
                  ContractId: docs2[k].id
                },
                { transaction: transact }
              )
            }

            for (let l = 0; l < docs2[k].OwnerExpenses.length; l++) {
              if (
                prevExps.filter(
                  (pe) =>
                    pe.ContractId === docs2[k].OwnerExpenses[l].ContractId &&
                    pe.description === docs2[k].OwnerExpenses[l].description + ' ' + mothYearText
                ).length <= 0
              ) {
                if (
                  (docs2[k].OwnerExpenses[l].description !== 'AGUAS' && docs2[k].OwnerExpenses[l].description !== 'API') ||
                  (docs2[k].OwnerExpenses[l].description === 'AGUAS' && (month == 0 ? 12 : month) % 2 === 0) ||
                  (docs2[k].OwnerExpenses[l].description === 'API' && (month == 0 ? 12 : month) % 2 !== 0)
                ) {
                  await DebtOwner.create(
                    {
                      description: docs2[k].OwnerExpenses[l].description + ' ' + mothYearText,
                      amount: docs2[k].OwnerExpenses[l].amount,
                      year: month == 0 ? year - 1 : year,
                      month: month == 0 ? 12 : month,
                      ContractId: docs2[k].id
                    },
                    { transaction: transact }
                  )
                }
              }
            }
          }
        }
      }
    }
    await JobLog.create(
      { type: 'debts', state: 'success', message: `DEBTS OWNER JOB DONE SUCCESSFULLY(${count}).` },
      { transaction: transact }
    )
    await transact.commit()
    console.log(`DEBTS OWNER JOB DONE SUCCESSFULLY(${count}) ON ::: ` + new Date().toLocaleString())

    // return res.json({ ok: true, message: 'DEBTS OWNER JOB DONE SUCCESSFULLY.' })
  } catch (error) {
    await JobLog.create({ type: 'debts', state: 'fail', message: error.message || 'Something went wrong.' })
    await transact.rollback()
  }
})

exports.noticeExpiringContracts = catchAsync(async (req, res, next) => {
  const contracts = await Contract.findAll({
    where: {
      endDate: {
        [Op.between]: [new Date(), new Date(new Date().setDate(new Date().getDate() + 60))]
      },
      state: 'En curso'
    },
    include: 'Client',
    attributes: ['id', 'startDate', 'endDate', 'state']
  })

  if (!contracts || contracts.length <= 0) return res.json({ ok: true, message: 'No hay contratos por vencerse en los proximos 60 dias' })
  // if (1 === 1) return res.json({ ok: true, results: contracts.length, data: contracts })
  contracts.forEach(async (contract) => {
    await new Email({
      email: [contract.Client.email, process.env.ADM_EMAIL],
      fullName: contract.Client.fullName,
      endDate: contract.endDate
    }).sendExpireContract()
    // store in mail-log
    await MailLog.create({
      motive: MAIL_MOTIVE.EXPIRED_CONTRACT,
      status: true,
      ClientId: contract.Client.id
    })
  })

  // return res.json({ ok: true, results: contracts.length, data: contracts, })
})
exports.noticeDebts = catchAsync(async (req, res, next) => {
  const contracts = await Contract.findAll({
    where: { state: 'En curso' },
    include: [
      { model: DebtClient, where: { paid: false }, attributes: ['id', 'amount', 'description', 'month', 'year'] },
      { model: Client, attributes: ['id', 'email', 'fullName'] },
      { model: Property, attributes: ['id', 'street', 'number', 'floor', 'dept'] }
    ],
    attributes: ['id', 'startDate', 'endDate', 'state']
  })

  // if(1 === 1) return res.json({ ok: true, results: contracts.length, data: contracts, })

  // 44 avec debts
  // slice(2, 4).
  if (!contracts || contracts.length <= 0) return res.json({ ok: true, message: 'No hay contratos con deudas' })
  contracts.slice(0, 3).forEach(async (con) => {
    const monthsDebts = con.DebtClients.map((d) => d.month)
    // convert to a set to remove duplicates
    const monthsDebtsSet = new Set(monthsDebts)
    // convert back to array
    const monthsDebtsUnique = [...monthsDebtsSet]
    // const assurances = await Assurance.findAll({ where: { ContractId: con.id } })

    if (monthsDebtsUnique.length === 1) {
      // send mail for one month
      try {
        await new Email({
          email: [con.Client.email, process.env.ADM_EMAIL],
          fullName: con.Client.fullName,
          month: monthsDebtsUnique.map((m) => monthsInSpanish[m - 1]).join(', '),
          property: con.Property.street + ' ' + con.Property.number + ' ' + con.Property.floor + '-' + con.Property.dept
        }).sendNoticeDebtForOneMonth()

        // store in mail-log
        await MailLog.create({
          motive: MAIL_MOTIVE.DEBT + ' DE 1 MES',
          status: true,
          ClientId: con.Client.id
        })
      } catch (error) {
        console.log('ERROR AL MANDAR LOS MAILS DE DEUDAS', error)
      }
    } else if (monthsDebtsUnique.length === 2) {
      // send mail for two months
      try {
        await new Email({
          email: [con.Client.email, process.env.ADM_EMAIL],
          fullName: con.Client.fullName,
          month: monthsDebtsUnique.map((m) => monthsInSpanish[m - 1]).join(', '),
          property: con.Property.street + ' ' + con.Property.number + ' ' + con.Property.floor + '-' + con.Property.dept
        }).sendNoticeDebtForTwoMonth()

        await MailLog.create({
          motive: MAIL_MOTIVE.DEBT + ' DE 2 MESES',
          status: true,
          ClientId: con.Client.id
        })
      } catch (error) {
        console.log('ERROR AL MANDAR LOS MAILS DE DEUDAS', error)
      }
    } else if (monthsDebtsUnique.length === 3) {
      // send mail for three months
      try {
        await new Email({
          email: [con.Client.email, process.env.ADM_EMAIL],
          fullName: con.Client.fullName,
          month: monthsDebtsUnique.map((m) => monthsInSpanish[m - 1]).join(', '),
          property: con.Property.street + ' ' + con.Property.number + ' ' + con.Property.floor + ' ' + con.Property.dept
        }).sendNoticeDebtForThreeMonth()

        await MailLog.create({
          motive: MAIL_MOTIVE.DEBT + ' DE 3 MESES',
          status: true,
          ClientId: con.Client.id
        })
      } catch (error) {
        console.log('ERROR AL MANDAR LOS MAILS DE DEUDAS', error)
      }

      // get assurance for each contract
      const assurances = await Assurance.findAll({ where: { ContractId: con.id } })
      // validate if the contract has assurance
      try {
        if (assurances.length > 0) {
          assurances.forEach(async (as) => {
            await new Email({
              email: [as.email, process.env.ADM_EMAIL],
              fullName: con.Client.fullName,
              month: monthsDebtsUnique.map((m) => monthsInSpanish[m - 1]).join(', '),
              property: con.Property.street + ' ' + con.Property.number + ' ' + con.Property.floor + ' ' + con.Property.dept,
              assuranceName: as.fullName
            }).sendNoticeDebtForAssurance()

            await MailLog.create({
              motive: MAIL_MOTIVE.DEBT + ' DE 3 MESES',
              status: true,
              ClientId: con.Client.id,
              AssuranceId: as.id
            })
          })
        }
      } catch (error) {
        console.log('ERROR AL MANDAR LOS MAILS DE DEUDAS', error)
      }
    } else if (monthsDebtsUnique.length > 3) {
      // send mail for more than three months
      try {
        await new Email({
          email: [con.Client.email, process.env.ADM_EMAIL],
          fullName: con.Client.fullName,
          month:
            monthsDebtsUnique.map((m) => monthsInSpanish[m - 1]).join(', ') +
            ' ' +
            [...new Set(con.DebtClients.map((d) => d.year))].join('/ '),
          property: con.Property.street + ' ' + con.Property.number + ' ' + con.Property.floor + ' ' + con.Property.dept,
          total: con.DebtClients.reduce((a, b) => a + b.amount, 0)
        }).sendNoticeDebtForFourMonth()

        await MailLog.create({
          motive: MAIL_MOTIVE.DEBT + ' DE 4 MESES',
          status: true,
          ClientId: con.Client.id
        })
      } catch (error) {
        console.log('ERROR AL MANDAR LOS MAILS DE DEUDAS', error)
      }

      // get assurance for each contract
      const assurances = await Assurance.findAll({ where: { ContractId: con.id } })
      // validate if the contract has assurance
      try {
        if (assurances.length > 0) {
          assurances.forEach(async (as) => {
            await new Email({
              email: [as.email, process.env.ADM_EMAIL],
              fullName: as.fullName,
              month:
                monthsDebtsUnique.map((m) => monthsInSpanish[m - 1]).join(', ') +
                ' ' +
                [...new Set(con.DebtClients.map((d) => d.year))].join('/ '),
              property: con.Property.street + ' ' + con.Property.number + ' ' + con.Property.floor + ' ' + con.Property.dept,
              assuranceName: as.fullName,
              total: con.DebtClients.reduce((a, b) => a + b.amount, 0)
            }).sendNoticeDebtForFourMonth()

            await MailLog.create({
              motive: MAIL_MOTIVE.DEBT + ' DE 4 MESES',
              status: true,
              ClientId: con.Client.id,
              AssuranceId: as.id
            })
          })
        }
      } catch (error) {
        console.log('ERROR AL MANDAR LOS MAILS DE DEUDAS', error)
      }
    }
  })

  // return res.json({ ok: true, results: contracts.length })
  // return res.json({ ok: true, results: contracts.length, data: contracts, })
})
