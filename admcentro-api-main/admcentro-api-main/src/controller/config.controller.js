const { Config } = require('../../models')
const { all, paginate, create, findOne, update, destroy } = require('../Generic/FactoryGeneric')

exports.GetAll = all(Config)
exports.Paginate = paginate(Config)
exports.Create = create(Config, ['key', 'value'])
exports.GetById = findOne(Config)
exports.Put = update(Config, ['value'])
exports.Destroy = destroy(Config)
