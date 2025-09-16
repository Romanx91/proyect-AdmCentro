const { Owner, Property, PropertyType } = require('../../models')

const { all, paginate, create, findOne, update, destroy } = require('../Generic/FactoryGeneric')

exports.GetAll = all(Owner, { include: [{ model: Property, include: { model: PropertyType } }] })
exports.Paginate = paginate(Owner)
exports.Create = create(Owner, ['fullName', 'address', 'phone', 'email', 'cuit', 'nroFax', 'province', 'city', 'obs', 'fixedPhone', 'codePostal', 'commision',])
exports.GetById = findOne(Owner)
exports.Put = update(Owner, ['fullName', 'address', 'phone', 'email', 'cuit', 'nroFax', 'province', 'city', 'obs', 'fixedPhone', 'codePostal', 'commision',])
exports.Destroy = destroy(Owner)
