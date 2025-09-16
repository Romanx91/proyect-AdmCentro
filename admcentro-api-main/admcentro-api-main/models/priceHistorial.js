'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class PriceHistorial extends Model {
    static associate(models) {
      //  Relation
      PriceHistorial.belongsTo(models.Contract)
    }
  }
  PriceHistorial.init(
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.BIGINT,
        autoIncrement: true
      },
      ContractId: {
        allowNull: false,
        type: DataTypes.BIGINT,
        validate: {
          notNull: {
            msg: 'El contrato es obligatorio'
          },
          notEmpty: {
            msg: 'El contrato es obligatorio'
          }
        }
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'El monto es obligatorio'
          },
          notEmpty: {
            msg: 'El monto es obligatorio'
          }
        }
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'El año es obligatorio'
          },
          notEmpty: {
            msg: 'El año es obligatorio'
          }
        }
      },
      percent: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'El porcentaje de aumento es obligatorio'
          },
          notEmpty: {
            msg: 'El porcentaje de aumento  es obligatorio'
          }
        }
      }
    },
    {
      indexes: [
        {
          unique: true,
          fields: ['ContractId', 'year'],
          name: 'avoidMorethanOnePriceForOneContractAtTheSameYear'
        }
      ],
      sequelize,
      modelName: 'PriceHistorial',
      tableName: 'pricehistorials'
      // paranoid: true,
    }
  )
  return PriceHistorial
}
