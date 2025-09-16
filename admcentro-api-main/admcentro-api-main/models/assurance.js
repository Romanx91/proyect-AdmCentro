'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
	class Assurance extends Model {
		static associate(models) {
			//  Relation
			Assurance.belongsTo(models.Contract)
		}
	}
	Assurance.init(
		{
			id: {
				primaryKey: true,
				allowNull: false,
				type: DataTypes.BIGINT,
				autoIncrement: true,
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
			fullName: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					notNull: {
						msg: 'El nombre completo no puede ser nulo.',
					},
					notEmpty: {
						msg: 'El nombre completo no puede ser vacio.',
					},
				},
			},
			address: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					notNull: {
						msg: 'La dirección es obligatoria',
					},
					notEmpty: {
						msg: 'La dirección es obligatoria',
					},
				},
			},
			phone: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					notNull: {
						msg: 'El telefóno es obligatorio',
					},
					notEmpty: {
						msg: 'El telefóno es obligatorio',
					},
				},
			},
			email: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					notNull: {
						msg: 'El email es obligatorio',
					},
					notEmpty: {
						msg: 'El email es obligatorio',
					},
				},
			},
			cuit: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					notNull: {
						msg: 'El C.U.I.T/C.U.I.L es obligatoria',
					},
					notEmpty: {
						msg: 'El C.U.I.T/C.U.I.L es obligatoria',
					},
				},
			},
			obs: DataTypes.STRING,
		},
		{
			sequelize,
			modelName: 'Assurance',
			tableName: 'assurances',
			// paranoid: true,
		}
	)
	return Assurance
}
