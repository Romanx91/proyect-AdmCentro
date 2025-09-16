'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
	class Owner extends Model {
		static associate(models) {
			Owner.hasMany(models.Property, { foreignKey: { allowNull: false, }, onUpdate: 'CASCADE', onDelete: 'RESTRICT', })
			Owner.hasMany(models.PaymentOwner, { foreignKey: { allowNull: false, }, onUpdate: 'CASCADE', onDelete: 'CASCADE', })
		}
	}
	Owner.init(
		{
			id: {
				primaryKey: true,
				allowNull: false,
				type: DataTypes.BIGINT,
				autoIncrement: true,
			},
			fullName: {
				type: DataTypes.STRING(150),
				allowNull: false,
				validate: {
					notNull: {
						msg: 'El nombre completo es obligatorio',
					},
					notEmpty: {
						msg: 'El nombre completo es obligatorio',
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
				type: DataTypes.STRING(20),
				unique: {
					msg: 'Ya existe un cliente con ese telefóno.',
				},
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
			fixedPhone: {
				type: DataTypes.STRING(20),
				allowNull: true,
			},
			email: {
				type: DataTypes.STRING,
				unique: {
					msg: 'Ya existe un cliente con ese email.',
				},
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
			commision: {
				type: DataTypes.FLOAT,
				allowNull: false,
				validate: {
					notNull: {
						msg: 'La comisión es obligatoria',
					},
					notEmpty: {
						msg: 'La comisión es obligatoria',
					},
				},
			},
			cuit: {
				type: DataTypes.STRING,
				unique: {
					msg: 'Ya existe un cliente con ese C.U.I.T/C.U.I.L.',
				},
				allowNull: false,
				validate: {
					notNull: {
						msg: 'El C.U.I.T/C.U.I.L es obligatorio',
					},
					notEmpty: {
						msg: 'El C.U.I.T/C.U.I.L es obligatorio',
					},
				},
			},
			province: DataTypes.STRING(70),
			city: DataTypes.STRING(70),
			codePostal: DataTypes.STRING(10),
			obs: DataTypes.STRING,
		},
		{
			sequelize,
			modelName: 'Owner',
			tableName: 'owners',
			paranoid: true,
		}
	)
	return Owner
}
