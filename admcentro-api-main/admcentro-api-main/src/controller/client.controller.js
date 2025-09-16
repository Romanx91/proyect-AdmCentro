const { Client } = require('../../models')

const { all, paginate, create, findOne, update, destroy } = require('../Generic/FactoryGeneric')

exports.GetAll = all(Client)
exports.Paginate = paginate(Client)
exports.Create = create(Client, [
	'fullName',
	'address',
	'phone',
	'email',
	'cuit',
	'nroFax',
	'province',
	'city',
	'obs',
	'fixedPhone',
	'codePostal',
])
exports.GetById = findOne(Client)
exports.Put = update(Client, [
	'fullName',
	'address',
	'phone',
	'email',
	'cuit',
	'nroFax',
	'province',
	'city',
	'obs',
	'codePostal',
	'fixedPhone',
])
exports.Destroy = destroy(Client)
