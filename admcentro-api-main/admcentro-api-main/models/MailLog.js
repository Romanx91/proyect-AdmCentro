'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
	class MailLog extends Model {
		static associate(models) {
			MailLog.belongsTo(models.Client)
			MailLog.belongsTo(models.Assurance)
		}
	}
	MailLog.init(
		{
			id: {
				primaryKey: true,
				allowNull: false,
				type: DataTypes.BIGINT,
				autoIncrement: true,
			},
			motive: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					notNull: {
						msg: 'El motivo es obligatorio.',
					},
					notEmpty: {
						msg: 'El motivo es obligatorio.',
					},
					len: {
						args: [1, 255],
						msg: 'El motivo debe tener entre 1 y 255 caracteres.',
					},
				},
			},
			status: DataTypes.BOOLEAN,
			ClientId: {
				type: DataTypes.BIGINT,
				allowNull: false,
			},
			AssuranceId: DataTypes.BIGINT,
		},
		{
			sequelize,
			modelName: 'MailLog',
			tableName: 'maillogs',
			// paranoid: true,
		}
	)
	return MailLog
}
