const {PropertyType} = require('../../models');

const { all, paginate, create, findOne, update, destroy } = require('../Generic/FactoryGeneric');

exports.GetAll = all(PropertyType);
exports.Paginate = paginate(PropertyType);
exports.Create = create(PropertyType, ['description']);
exports.GetById = findOne(PropertyType);
exports.Put = update(PropertyType, ['description']);
exports.Destroy = destroy(PropertyType);