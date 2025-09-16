'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
	class Zone extends Model {
		static associate(models) {
			Zone.hasMany(models.Property,
				{
					foreignKeyConstraint: true,
					onUpdate: 'CASCADE',
					onDelete: 'RESTRICT',
				})
		}
	}
	Zone.init(
		{
			id: {
				primaryKey: true,
				allowNull: false,
				type: DataTypes.BIGINT,
				autoIncrement: true,
			},
			name: {
				type: DataTypes.STRING(50),
				allowNull: false,
				unique: {
					name: true,
					msg: 'Ya existe otra zona con ese nombre.',
				},
				validate: {
					notNull: {
						msg: 'El nombre no puede ser nulo.',
					},
					notEmpty: {
						msg: 'El nombre no puede ser vacio.',
					},
					len: {
						args: [1, 50],
						msg: 'El nombre debe tener entre 1 y 50 caracteres.',

					}
				},
			},
		},
		{
			sequelize,
			tableName: 'zones',
			modelName: 'Zone',
			// paranoid: true,
		}
	)
	return Zone
}
