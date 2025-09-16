'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
	class ClientExpense extends Model {
		static associate(models) {
			ClientExpense.belongsTo(models.Contract)
		}
	}
	ClientExpense.init(
		{
			id: {
				primaryKey: true,
				allowNull: false,
				type: DataTypes.BIGINT,
				autoIncrement: true,
			},
			description: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					notNull: {
						msg: 'La descripción no puede ser nulo.',
					},
					notEmpty: {
						msg: 'La descripción no puede ser vacio.',
					},
				},
			},
			amount: {
				type: DataTypes.FLOAT,
				allowNull: false,
				validate: {
					notNull: {
						msg: 'El monto es obligatorio',
					},
					notEmpty: {
						msg: 'El monto es obligatorio.',
					},
				},
			},
			date: {
				allowNull: false,
				type: DataTypes.DATEONLY,
				validate: {
					notNull: {
						msg: 'La fecha  es obligatoria',
					},
					notEmpty: {
						msg: 'La fecha  es obligatoria',
					},
				},
			},
			ContractId: {
				allowNull: false,
				type: DataTypes.BIGINT,
				validate: {
					notNull: {
						msg: 'El contrato es obligatorio',
					},
					notEmpty: {
						msg: 'El contrato es obligatorio',
					},
				},
			},
		},
		{
			sequelize,
			modelName: 'ClientExpense',
			tableName: 'clientexpenses',
			// paranoid: true,
		}
	)
	return ClientExpense
}
