"use strict"
const { Model } = require("sequelize")
module.exports = (sequelize, DataTypes) => {
  class Visit extends Model {
    static associate(models) {
      //  Relation
      Visit.belongsTo(models.Property)
    }
  }
  Visit.init(
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.BIGINT,
        autoIncrement: true,
      },
      PropertyId: {
        allowNull: false,
        type: DataTypes.BIGINT,
        validate: {
          notNull: {
            msg: "Debe seleccionar una propiedad",
          },
          notEmpty: {
            msg: "Debe seleccionar una propiedad",
          },
        },
      },
      date: {
        allowNull: false,
        type: DataTypes.DATE,
        validate: {
          notNull: {
            msg: "Ingresa la fecha de la visita",
          },
          notEmpty: {
            msg: "Ingresa la fecha de la visita",
          },
        },
      },
      // fullName: {
      //   allowNull: true,
      //   type: DataTypes.STRING(150),
      // validate: {
      //   notNull: {
      //     msg: "Ingresa el nombre del visitante",
      //   },
      //   notEmpty: {
      //     msg: "Ingresa el nombre del visitante",
      //   },
      // },
      // },
      // phone: {
      //   allowNull: false,
      //   type: DataTypes.STRING(20),
      // validate: {
      //   notNull: {
      //     msg: "Ingresa el teléfono",
      //   },
      //   notEmpty: {
      //     msg: "Ingresa el teléfono",
      //   },
      // },
      // },
      description: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      participants: {
        allowNull: false,
        type: DataTypes.JSON,
        validate: {
          notNull: {
            msg: 'Hay que ingresar por lo menos un visitor'
          },
          notEmpty: {
            msg: 'Hay que ingresar por lo menos un visitor'
          }

        },
        get: function () {
          if (!this.getDataValue("participants")) return null
          return JSON.parse(this.getDataValue("participants"))
        },
        set: function (value) {
          return this.setDataValue(
            "participants",
            JSON.stringify(value || "")
          )
        },
      },
    },


    {
      indexes: [
        {
          unique: true,
          fields: ["PropertyId", "date"],
          name: "visitUnique",
        },
      ],
      // paranoid: true,
      sequelize,
      tableName: 'visits',
      modelName: "Visit",
    }
  )
  return Visit
}
