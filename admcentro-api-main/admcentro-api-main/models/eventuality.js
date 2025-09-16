'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Eventuality extends Model {
    static associate(models) {
      //  Relation
      Eventuality.belongsTo(models.Contract)
      Eventuality.belongsTo(models.Property)
    }
  }
  Eventuality.init(
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.BIGINT,
        autoIncrement: true
      },
      PropertyId: {
        allowNull: true,
        type: DataTypes.BIGINT,
        validate: {
          notEmpty: {
            msg: 'La propiedad es obligatoria.'
          },
          customValidator(value) {
            if ((!value && !this.ContractId) || (value && this.ContractId)) {
              throw new Error('Una eventualidad debe estar asociada a una propiedad o a un contrato.')
            }
          }
        }
      },
      ContractId: {
        allowNull: true,
        type: DataTypes.BIGINT,
        validate: {
          notEmpty: {
            msg: 'El contrato es obligatorio.'
          },
          customValidator(value) {
            if ((!value && !this.PropertyId) || (value && this.PropertyId)) {
              throw new Error('Una eventualidad debe estar asociada a una propiedad o a un contrato.')
            }
          }
        }
      },
      paymentId: DataTypes.BIGINT,
      clientAmount: {
        allowNull: false,
        type: DataTypes.FLOAT,
        validate: {
          notNull: {
            msg: 'El monto del cliente es obligatorio.'
          },
          notEmpty: {
            msg: 'El monto del cliente es obligatorio.'
          }
        }
      },
      ownerAmount: {
        allowNull: false,
        type: DataTypes.FLOAT,
        validate: {
          notNull: {
            msg: 'El monto del dueño es obligatorio.'
          },
          notEmpty: {
            msg: 'El monto del dueño es obligatorio.'
          }
        }
      },
      clientPaid: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      isReverted: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      ownerPaid: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      description: {
        allowNull: false,
        type: DataTypes.STRING,
        validate: {
          notNull: {
            msg: 'La descripción es obligatoria.'
          },
          notEmpty: {
            msg: 'La descripción es obligatoria.'
          }
        }
      },
      expiredDate: {
        allowNull: false,
        type: DataTypes.DATEONLY,
        validate: {
          notNull: {
            msg: 'La fecha de vencimiento es obligatoria.'
          },
          notEmpty: {
            msg: 'La fecha de vencimiento es obligatoria.'
          }
        }
      }
    },
    {
      sequelize,
      modelName: 'Eventuality',
      tableName: 'eventualities'
    }
  )
  return Eventuality
}
