const { Visit, Property } = require('../../models')
const { all, paginate, create, findOne, update, destroy } = require('../Generic/FactoryGeneric')

exports.GetAll = all(Visit, { include: { model: Property } })
exports.Paginate = paginate(Visit)
exports.Create = create(Visit, ['PropertyId', 'date', 'fullName', 'phone', 'description', 'participants'])
exports.GetById = findOne(Visit)
exports.Put = update(Visit, ['PropertyId', 'date', 'fullName', 'phone', 'description', 'participants'])
exports.Destroy = destroy(Visit)
