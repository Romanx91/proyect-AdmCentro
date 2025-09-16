const {PaymentType} = require('../../models');

const { all, paginate, create, findOne, update, destroy } = require('../Generic/FactoryGeneric');

exports.GetAll = all(PaymentType);
exports.Paginate = paginate(PaymentType);
exports.Create = create(PaymentType, ['name']);
exports.GetById = findOne(PaymentType);
exports.Put = update(PaymentType, ['name']);
exports.Destroy = destroy(PaymentType);