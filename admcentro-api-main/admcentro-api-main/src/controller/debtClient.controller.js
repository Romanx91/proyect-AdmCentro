const { DebtClient, Contract, Property, ClientExpense, sequelize, PriceHistorial, JobLog, PaymentClient, } = require('../../models')

const { all, findOne, update, destroy, create } = require('../Generic/FactoryGeneric')
const { catchAsync } = require('../../helpers/catchAsync')
const { Op } = require('sequelize')
const { monthsInSpanish } = require('../../helpers/variablesAndConstantes')

exports.GetAll = all(DebtClient)
exports.Post = create(DebtClient, ['month', 'year', 'ContractId', 'amount', 'description'])
exports.GetById = findOne(DebtClient, { include: [{ model: Contract },] })
exports.Put = update(DebtClient, ['month', 'year', 'ContractId', 'amount', 'description'])
exports.Destroy = destroy(DebtClient)

exports.jobDebtsClients = catchAsync(async (req, res, next) => {

	const month = new Date().getMonth()
	const year = new Date().getFullYear()
	const mothYearText = monthsInSpanish[month - 1] + '/' + year
	const d = new Date()
	d.setDate(d.getDate() + 3)

	const docs2 = await Contract.findAll({
		where: {
			// id: {			// 	[Op.in]: req.query.ids.split(','),			// },
			state: 'En curso',
			startDate: { [Op.lt]: new Date(year, month - 1, new Date(year, month, 0).getDate()) },
			endDate: { [Op.gt]: d },
		},
		include: [
			{ model: ClientExpense },
			{ model: Property },
			{ model: PriceHistorial },
		],
	})

	// return res.json({ ok: true, results: docs2.length, data: docs2, })
	const transact = await sequelize.transaction()

	try {

		for (let k = 0; k < docs2.length; k++) {
			let prevExps = []
			let pmtContr = await PaymentClient.findAll({ where: { month: monthsInSpanish[month - 1], year, ContractId: docs2[k].id } })
			pmtContr.forEach((p) => prevExps.push(...p.expenseDetails))

			const exist = await DebtClient.findOne({ where: { year, month, ContractId: docs2[k].id } })

			if (!exist) {
				let textRent = 'ALQUILER ' + docs2[k].Property.street + ' ' + docs2[k].Property.number + ' ' + docs2[k].Property.floor + ' ' + docs2[k].Property.dept + ' ' + mothYearText
				if (prevExps.filter(pe => pe.ContractId === docs2[k].id && pe.description === textRent).length <= 0) {
					await DebtClient.create({
						description: textRent,
						amount: docs2[k].PriceHistorials.sort((a, b) => a.id - b.id)[docs2[k].PriceHistorials.length - 1].amount,
						year,
						month,
						rent: true,
						ContractId: docs2[k].id,
					}, { transaction: transact })
				}

				if (prevExps.filter(pe => pe.ContractId === docs2[k].id && pe.description === `GASTOS DE GESTION ${mothYearText}`).length <= 0) {
					await DebtClient.create({
						description: `GASTOS DE GESTION ${mothYearText}`,
						amount: docs2[k].PriceHistorials.sort((a, b) => a.id - b.id)[docs2[k].PriceHistorials.length - 1].amount * (3 / 100),
						year,
						month,
						ContractId: docs2[k].id,
					}, { transaction: transact })
				}

				for (let l = 0; l < docs2[k].ClientExpenses.length; l++) {
					if (prevExps.filter(pe => pe.ContractId === docs2[k].ClientExpenses[l].ContractId && pe.description === docs2[k].ClientExpenses[l].description + ' ' + mothYearText).length <= 0) {
						if (
							(docs2[k].ClientExpenses[l].description !== 'AGUAS' && docs2[k].ClientExpenses[l].description !== 'API') ||
							(docs2[k].ClientExpenses[l].description === 'AGUAS' && (month % 2) === 0) ||
							(docs2[k].ClientExpenses[l].description === 'API' && (month % 2) !== 0)
						) {
							await DebtClient.create({
								description: docs2[k].ClientExpenses[l].description + ' ' + mothYearText,
								amount: docs2[k].ClientExpenses[l].amount,
								year,
								month,
								ContractId: docs2[k].id,
							},
								{ transaction: transact }
							)
						}
					}

				}
			}
		}

		await JobLog.create({ type: 'debts', state: 'success', message: 'DEBTS CLIENT JOB DONE SUCCESSFULLY.' })
		await transact.commit()

	} catch (error) {
		await JobLog.create({
			type: 'debts',
			state: 'fail',
			message: error?.message || 'Something went wrong.',
		})
		await transact.rollback()
	}
})