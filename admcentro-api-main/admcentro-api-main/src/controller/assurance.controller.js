const {Assurance} = require('../../models');

const { all, paginate, create, findOne, update, destroy } = require('../Generic/FactoryGeneric');

exports.GetAll = all(Assurance);
exports.Paginate = paginate(Assurance);
exports.Create = create(Assurance, ['ContractId','fullName','address','phone','email','cuit','obs']);
exports.GetById = findOne(Assurance);
exports.Put = update(Assurance, ['ContractId','fullName','address','phone','email','cuit','obs']);
exports.Destroy = destroy(Assurance);