'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
	class JobLog extends Model {
		static associate(models) { }
	}
	JobLog.init(
		{
			id: {
				primaryKey: true,
				allowNull: false,
				type: DataTypes.BIGINT,
				autoIncrement: true,
			},
			type: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					isIn: ['debts'],
				},
			},
			state: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					isIn: ['success', 'fail'],
				},
			},
			message: DataTypes.STRING,
		},
		{
			sequelize,
			modelName: 'JobLog',
			tableName: 'joblogs',
			// paranoid: true,
		}
	)
	return JobLog
}
