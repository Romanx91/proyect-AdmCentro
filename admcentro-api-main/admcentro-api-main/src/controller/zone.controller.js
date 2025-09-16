const { Zone } = require('../../models')
const { all, paginate, create, findOne, update, destroy } = require('../Generic/FactoryGeneric')

exports.GetAll = all(Zone)
exports.Paginate = paginate(Zone)
exports.Create = create(Zone, ['name'])
exports.GetById = findOne(Zone)
exports.Put = update(Zone, ['name'])
exports.Destroy = destroy(Zone)

