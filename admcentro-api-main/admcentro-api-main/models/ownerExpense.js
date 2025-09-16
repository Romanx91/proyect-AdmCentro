'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
	class OwnerExpense extends Model {
		static associate(models) {
			OwnerExpense.belongsTo(models.Contract)
		}
	}
	OwnerExpense.init(
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
			},
			date: {
				allowNull: false,
				type: DataTypes.DATEONLY,
				validate: {
					notNull: {
						msg: 'La fecha fin es obligatoria',
					},
					notEmpty: {
						msg: 'La fecha fin es obligatoria',
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
			modelName: 'OwnerExpense',
			tableName: 'ownerexpenses',
			// paranoid: true,
		}
	)
	return OwnerExpense
}
