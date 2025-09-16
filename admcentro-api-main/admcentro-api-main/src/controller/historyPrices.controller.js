const { PriceHistorial } = require('../../models')

const { all, paginate, create, findOne, update, destroy } = require('../Generic/FactoryGeneric')

exports.GetAll = all(PriceHistorial, {
	// include: [{ model: Contract }],
})
exports.Paginate = paginate(PriceHistorial, {
	// include: [{ model: Contract }],
})
exports.Create = create(PriceHistorial, ['ContractId', 'amount', 'year', 'percent'])
exports.GetById = findOne(PriceHistorial, {
	// include: [{ model: Contract }],
})
exports.Put = update(PriceHistorial, ['ContractId', 'amount', 'year', 'percent'])
exports.Destroy = destroy(PriceHistorial)
