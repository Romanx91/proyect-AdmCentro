'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
	class Config extends Model {
		static associate(models) { }
	}
	Config.init(
		{
			id: {
				primaryKey: true,
				allowNull: false,
				type: DataTypes.BIGINT,
				autoIncrement: true,
			},
			key: {
				type: DataTypes.STRING(50),
				allowNull: false,
				set(value) {
					this.setDataValue('key', value.trim().replace(/ /g, '_').toLowerCase())
				},
				unique: {
					msg: 'Ya existe un registro con esa clave.',
				},
				validate: {
					notNull: {
						msg: 'El nombre no puede ser nulo.',
					},
					notEmpty: {
						msg: 'El nombre no puede ser vacio.',
					},
				},
			},
			value: {
				type: DataTypes.STRING,
				allowNull: false,
				set(value) {
					this.setDataValue('value', value.trim())
				},
				validate: {
					notNull: {
						msg: 'El valor no puede ser nulo.',
					},
					notEmpty: {
						msg: 'El valor no puede ser vacio.',
					},
				},
			},
		},
		{
			sequelize,
			modelName: 'Config',
			tableName: 'configs',
			// paranoid: true,
		}
	)
	return Config
}
