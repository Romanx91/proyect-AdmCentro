const { Eventuality, Property, Contract, Client } = require('../../models')
const { all, paginate, create, findOne, update, destroy } = require('../Generic/FactoryGeneric')

exports.GetAll = all(Eventuality, {
  include: [
    {
      model: Property,
      attributes: ['street', 'number', 'floor', 'dept', 'id']
    },
    {
      model: Contract,
      include: [
        {
          model: Property,
          attributes: ['street', 'number', 'floor', 'dept', 'id']
        },
        {
          model: Client,
          attributes: ['id', 'fullName', 'cuit']
        }
      ],
      attributes: ['id', 'startDate', 'endDate', 'state', 'PropertyId', 'ClientId']
    }
  ]
})
exports.Paginate = paginate(Eventuality)
exports.Create = create(Eventuality, ['PropertyId', 'ContractId', 'amount', 'description', 'expiredDate', 'clientAmount', 'ownerAmount'])
exports.GetById = findOne(Eventuality)
exports.Put = update(Eventuality, ['PropertyId', 'ContractId', 'amount', 'description', 'expiredDate', 'clientAmount', 'ownerAmount'])
exports.Destroy = destroy(Eventuality)
