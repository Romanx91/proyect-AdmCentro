'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
	class Property extends Model {
		static associate(models) {
			Property.belongsTo(models.Zone)
			Property.belongsTo(models.PropertyType)
			Property.belongsTo(models.Owner,)

			//  Relation
			Property.hasMany(models.Contract, { foreignKey: { allowNull: false, }, onUpdate: 'CASCADE', onDelete: 'RESTRICT', })
			Property.hasMany(models.Visit, { foreignKey: { allowNull: false, }, onUpdate: 'CASCADE', onDelete: 'RESTRICT', })
			Property.hasMany(models.Claim, { foreignKey: { allowNull: false, }, onUpdate: 'CASCADE', onDelete: 'RESTRICT', })
		}
	}
	Property.init(
		{
			id: {
				primaryKey: true,
				allowNull: false,
				type: DataTypes.BIGINT,
				autoIncrement: true,
			},
			ZoneId: {
				allowNull: false,
				type: DataTypes.BIGINT,
				validate: {
					notNull: {
						msg: 'La zona es obligatoria',
					},
					notEmpty: {
						msg: 'La zona es obligatoria',
					},
				},
			},
			PropertyTypeId: {
				allowNull: false,
				type: DataTypes.BIGINT,
				validate: {
					notNull: {
						msg: 'El tipo de propiedad es obligatorio',
					},
					notEmpty: {
						msg: 'El tipo de propiedad es obligatorio',
					},
				},
			},
			OwnerId: {
				allowNull: false,
				type: DataTypes.BIGINT,
				validate: {
					notNull: {
						msg: 'El dueño es obligatorio',
					},
					notEmpty: {
						msg: 'El dueño es obligatorio',
					},
				},
			},
			street: {
				allowNull: false,
				type: DataTypes.STRING(100),
				validate: {
					notNull: {
						msg: 'La calle es obligatoria',
					},
					notEmpty: {
						msg: 'La calle es obligatoria',
					},
					len: {
						args: [1, 100],
						msg: 'La calle debe tener entre 1 y 100 caracteres',

					}
				},
			},
			number: {
				allowNull: false,
				type: DataTypes.STRING(5),
				validate: {
					notNull: {
						msg: 'El número de la calle es obligatorio',
					},
					notEmpty: {
						msg: 'El número de la calle es obligatorio',
					},
					len: {
						args: [1, 5],
						msg: 'El número de la calle debe tener entre 1 y 5 caracteres',
					}
				},
			},
			floor: {
				allowNull: true,
				type: DataTypes.STRING(2),
			},
			dept: {
				allowNull: true,
				type: DataTypes.STRING(2),
			},
			isFor: {
				allowNull: false,
				type: DataTypes.STRING(8),
				defaultValue: 'Alquiler',
				validate: {
					isIn: {
						args: [['Venta', 'Alquiler']],
						msg: 'El valor ingresado no está permitido.',
					},
					len: {
						args: [1, 8],
						msg: 'El para debe tener entre 1 y 8 caracteres.',
					}
				},
			},
			nroPartWater: DataTypes.STRING(50),
			nroPartMuni: DataTypes.STRING(50),
			nroPartAPI: DataTypes.STRING(50),
			nroPartGas: DataTypes.STRING(50),
			state: {
				allowNull: false,
				type: DataTypes.STRING(7),
				defaultValue: 'Libre',
				validate: {
					isIn: {
						args: [['Libre', 'Ocupado']],
						msg: 'El estado ingresado no está permitido.',
					},
					len: {
						args: [1, 7],
						msg: 'El estado debe tener entre 1 y 7 caracteres.',
					}
				},
			},
			description: DataTypes.TEXT('long'),
			folderNumber: {
				allowNull: true,
				type: DataTypes.STRING(10),
				unique: {
					msg: 'El número de carpeta debe ser único.',
				},
				len: {
					args: [1, 10],
					msg: 'El número de carpeta debe tener entre 1 y 10 caracteres.'
				}
			},
		},
		{
			indexes: [
				{
					unique: true,
					fields: ['street', 'number', 'floor', 'dept'],
					name: 'uniqueKeyProperty',
				},
			],
			sequelize,
			modelName: 'Property',
			paranoid: true,
			tableName: 'properties',
		}
	)
	return Property
}
