"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Contract extends Model {
    static associate(models) {
      Contract.belongsTo(models.Property);
      Contract.belongsTo(models.Client);

      //  Relation
      //
      Contract.hasMany(models.PriceHistorial, {
        foreignKey: { allowNull: false },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
      Contract.hasMany(models.Assurance, {
        foreignKey: { allowNull: false },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
      Contract.hasMany(models.ClientExpense, {
        foreignKey: { allowNull: false },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
      Contract.hasMany(models.OwnerExpense, {
        foreignKey: { allowNull: false },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
      Contract.hasMany(models.PaymentClient, {
        foreignKey: { allowNull: false },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
      Contract.hasMany(models.DebtClient, {
        foreignKey: { allowNull: false },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
      Contract.hasMany(models.DebtOwner, {
        foreignKey: { allowNull: false },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
      Contract.hasMany(models.Eventuality, {
        foreignKey: { allowNull: true },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
    }
  }
  Contract.init(
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
            msg: "El propietario es obligatorio",
          },
          notEmpty: {
            msg: "El propietario es obligatorio",
          },
        },
      },
      ClientId: {
        allowNull: false,
        type: DataTypes.BIGINT,
        validate: {
          notNull: {
            msg: "El cliente es obligatorio",
          },
          notEmpty: {
            msg: "El cliente es obligatorio",
          },
        },
      },
      startDate: {
        allowNull: false,
        type: DataTypes.DATEONLY,
        validate: {
          notNull: {
            msg: "La fecha del comienzo es obligatoria",
          },
          notEmpty: {
            msg: "La fecha del comienzo es obligatoria",
          },
        },
      },
      endDate: {
        allowNull: false,
        type: DataTypes.DATEONLY,
        validate: {
          notNull: {
            msg: "La fecha fin es obligatoria",
          },
          notEmpty: {
            msg: "La fecha fin es obligatoria",
          },
          isGreaterThanStartDate(value) {
            if (value <= this.startDate) {
              throw new Error(
                "La fecha fin del contrato debe ser mayor a la fecha de inicio."
              );
            }
          },
        },
      },
      admFeesPorc: {
        allowNull: false,
        type: DataTypes.FLOAT,
        defaultValue: 2,
      },
      currency: {
        allowNull: false,
        type: DataTypes.STRING(3),
        defaultValue: "ARS",
        validate: {
          isIn: {
            args: [["ARS", "USD"]],
            msg: "La moneda ingresada no está permitida.",
          },
        },
      },
      state: {
        type: DataTypes.STRING(10),
        defaultValue: "En curso",
        validate: {
          isIn: {
            args: [["En curso", "Finalizado", "Pendiente"]],
            msg: "El estado ingresado no está permitido.",
          },
        },
      },
      paymentType: {
        type: DataTypes.STRING(10),
        defaultValue: "Fijo",
        validate: {
          isIn: {
            args: [["Fijo", "Porcentual"]],
            msg: "El valor del ajuste ingresado no está permitido.",
          },
        },
      },
      adjustmentMonth: {
        type: DataTypes.INTEGER,
        defaultValue: 12,
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
          notNull: {
            msg: "El valor del contrato es obligatorio",
          },
          notEmpty: {
            msg: "El valor del contrato es obligatorio",
          },
        },
      },
      booking: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      deposit: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      description: DataTypes.STRING,
      motive: DataTypes.STRING,
      // stamped: {
      // 	allowNull: true,
      // 	type: DataTypes.FLOAT,
      // },
      // fees: {
      // 	allowNull: true,
      // 	type: DataTypes.FLOAT,
      // },
      // warrantyInquiry: {
      // 	allowNull: true,
      // 	type: DataTypes.FLOAT,
      // },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["PropertyId", "ClientId", "startDate", "endDate", "state"],
        },
      ],
      sequelize,
      modelName: "Contract",
      tableName: "contracts",
      paranoid: true,
    }
  );
  return Contract;
};
