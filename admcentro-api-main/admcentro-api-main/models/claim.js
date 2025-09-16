'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
	class Claim extends Model {
		static associate(models) {
			//  Relation
			Claim.belongsTo(models.Property)
		}
	}
	Claim.init(
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
						msg: 'Debe seleccionar una propiedad',
					},
					notEmpty: {
						msg: 'Debe seleccionar una propiedad',
					},
				},
			},
			state: {
				allowNull: false,
				type: DataTypes.STRING(10),
				defaultValue: 'Abierto',
				validate: {
					isIn: [['Abierto', 'Cerrado']],
				},
			},
			details: {
				type: DataTypes.TEXT('long'),
				allowNull: true,
				get: function () {
					if (!this.getDataValue('details')) return []
					return JSON.parse(this.getDataValue('details'))
				},
				set: function (value) {
					return this.setDataValue('details', JSON.stringify(value))
				},
			},
			description: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					notNull: {
						msg: 'La descripción no puede ser nulo.',
					},
					notEmpty: {
						msg: 'La descripción no puede ser nulo.',
					},
				},
			},
		},
		{
			sequelize,
			paranoid: true,
			modelName: 'Claim',
			tableName: 'claims',
		}
	)
	return Claim
}
