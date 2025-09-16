const { OwnerExpense, Contract, Property } = require('../../models')
const { all, paginate, create, findOne, update, destroy } = require('../Generic/FactoryGeneric')

exports.GetAll = all(OwnerExpense, {
	include: [
		{
			model: Contract,
			attributes: ['id', 'PropertyId'],
			include: { model: Property, attributes: ['floor', 'dept', 'street', 'number'] },
		},
	],
})
exports.Paginate = paginate(OwnerExpense)
exports.Create = create(OwnerExpense, ['date', 'amount', 'description', 'ContractId'])
exports.GetById = findOne(OwnerExpense)
exports.Put = update(OwnerExpense, ['date', 'amount', 'description', 'ContractId'])
exports.Destroy = destroy(OwnerExpense)
