const { DebtOwner, Contract, sequelize, Property, PriceHistorial, PaymentOwner, Owner, OwnerExpense, JobLog, } = require("../../models");

const { all, findOne, update, destroy, create } = require("../Generic/FactoryGeneric");
const { catchAsync } = require("../../helpers/catchAsync");
const { monthsInSpanish } = require("../../helpers/variablesAndConstantes");
const { Op } = require("sequelize");

exports.GetAll = all(DebtOwner, { include: [{ model: Contract }] });
exports.Post = create(DebtOwner, ['month', 'year', 'ContractId', 'amount', 'description'])
exports.GetById = findOne(DebtOwner, { include: [{ model: Contract }] })
exports.Put = update(DebtOwner, ['month', 'year', 'ContractId', 'amount', 'description'])
exports.Destroy = destroy(DebtOwner)

exports.jobDebtsOwner = catchAsync(async (req, res, next) => {
	const month = new Date().getMonth()
	const year = new Date().getFullYear()
	const mothYearText = monthsInSpanish[month - 1] + '/' + year
	const d = new Date()
	d.setDate(d.getDate() + 3)
	const owners = await Owner.findAll(
		{
			// where: { id: 15 },
			include: [{ model: Property }]
		}
	);

	const transact = await sequelize.transaction();
	try {

		for (let i = 0; i < owners.length; i++) {
			if (owners[i].Properties.length > 0) {
				// get owner properties ids
				let propertyIds = owners[i].Properties.map((doc) => doc.id);

				// get contracts with owner properties ids
				const docs2 = await Contract.findAll(
					{
						where: {
							PropertyId: { [Op.in]: propertyIds },
							state: "En curso",
							startDate: { [Op.lt]: new Date(year, month - 1, new Date(year, month, 0).getDate()), },
							endDate: { [Op.gt]: d },
						},
						include: [
							{ model: OwnerExpense },
							{ model: Property, include: [{ model: Owner, attributes: ['id', 'commision'] }] },
							{ model: PriceHistorial }
						]
					}
				);
				for (let k = 0; k < docs2.length; k++) {
					let prevExps = []
					let pmtContr = await PaymentOwner.findAll({ where: { month: monthsInSpanish[month - 1], year, OwnerId: owners[i].id } })
					pmtContr.forEach((p) => prevExps.push(...p.expenseDetails))

					const exist = await DebtOwner.findOne({ where: { year, month, ContractId: docs2[k].id } })

					if (!exist) {
						let textRent = 'ALQUILER ' + docs2[k].Property.street + ' ' + docs2[k].Property.number + ' ' + docs2[k].Property.floor + ' ' + docs2[k].Property.dept + ' ' + mothYearText
						if (prevExps.filter(pe => pe.ContractId === docs2[k].id && pe.description === textRent).length <= 0) {
							await DebtOwner.create({
								description: textRent,
								amount: docs2[k].PriceHistorials.sort((a, b) => a.id - b.id)[docs2[k].PriceHistorials.length - 1].amount,
								year,
								month,
								rent: true,
								ContractId: docs2[k].id,
							}, { transaction: transact })
						}
						let textFees = 'HONORARIOS ' + docs2[k].Property.street + ' ' + docs2[k].Property.number + ' ' + docs2[k].Property.floor + ' ' + docs2[k].Property.dept + ' ' + mothYearText
						if (prevExps.filter(pe => pe.ContractId === docs2[k].id && pe.description === textFees).length <= 0) {
							await DebtOwner.create(
								{
									description: textFees,
									amount: docs2[k].PriceHistorials.sort(
										(a, b) => a.id - b.id
									)[docs2[k].PriceHistorials.length - 1].amount * (-1) * (docs2[k].Property.Owner.commision / 100),
									year,
									month,
									ContractId: docs2[k].id,
								},
								{ transaction: transact, }
							);
						}

						for (let l = 0; l < docs2[k].OwnerExpenses.length; l++) {
							if (prevExps.filter(pe => pe.ContractId === docs2[k].OwnerExpenses[l].ContractId && pe.description === docs2[k].OwnerExpenses[l].description + ' ' + mothYearText).length <= 0) {
								if (
									(docs2[k].OwnerExpenses[l].description !== 'AGUAS' && docs2[k].OwnerExpenses[l].description !== 'API') ||
									(docs2[k].OwnerExpenses[l].description === 'AGUAS' && (month % 2) === 0) ||
									(docs2[k].OwnerExpenses[l].description === 'API' && (month % 2) !== 0)
								) {
									await DebtOwner.create({
										description: docs2[k].OwnerExpenses[l].description + ' ' + mothYearText,
										amount: docs2[k].OwnerExpenses[l].amount,
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
			}
		}
		await JobLog.create({ type: "debts", state: "success", message: "DEBTS OWNER JOB DONE SUCCESSFULLY.", }, { transaction: transact, });
		await transact.commit();

	} catch (error) {
		await JobLog.create({ type: "debts", state: "fail", message: error.message || "Something went wrong.", });
		await transact.rollback();
	}
});
