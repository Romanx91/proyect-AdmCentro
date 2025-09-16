'use strict'
const { Model } = require('sequelize')
module.exports = (sequelize, DataTypes) => {
	class Budget extends Model {
		static associate(models) {
			//  Relation
			Budget.belongsTo(models.Property)
		}
	}
	Budget.init(
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
			type: {
				allowNull: false,
				type: DataTypes.STRING(25),
				validate: {
					notNull: {
						msg: 'El tipo no puede ser nulo.',
					},
					notEmpty: {
						msg: 'El tipo no puede ser nulo.',
					},
					isIn: {
						args: [['Factura', 'Recibo', 'Presupuesto', 'Expensas extraordinarias']],
						msg: 'El tipo no es valido.',
					},
					len: {
						args: [3, 25],
						msg: 'El tipo debe tener entre 3 y 25 caracteres.',
					}
				},

			},
			description: {
				type: DataTypes.STRING(255),
				allowNull: false,
				validate: {
					notNull: {
						msg: 'La descripcion no puede ser nula.',
					},
					notEmpty: {
						msg: 'La descripcion no puede ser nula.',
					},
					len: {
						args: [3, 255],
						msg: 'La descripcion debe tener entre 3 y 255 caracteres.',
					}
				}
			},
			approved: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
			state: {
				type: DataTypes.STRING(11),
				defaultValue: 'En curso',
				validate: {
					isIn: {
						args: [['En curso', 'Visto', 'Aprobado', 'Rechazado']],
						msg: 'El estado no es valido.',
					}
				}
			},
			charged: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
			belongsTo: {
				type: DataTypes.STRING(11),
				allowNull: false,
				validate: {
					isIn: {
						args: [['Inquilino', 'Propietario']],
						msg: 'El tipo no es valido.',
					}
				}
			},
			// loaded: {
			// 	type: DataTypes.BOOLEAN,
			// 	defaultValue: false,
			// },

			category: {
				type: DataTypes.STRING(15),
				allowNull: false,
				validate: {
					notNull: {
						msg: 'La categoria no puede ser nula.',
					},
					notEmpty: {
						msg: 'La categoria no puede ser nula.',
					},
					isIn: {
						args: [['Plomeria', 'Gasista', 'Electricista', 'Pintura', 'Albañileria', 'Materiales']],
						msg: 'La categoria no es valida.',
					},
				},
			},
			photo: DataTypes.STRING,
		},
		{
			sequelize,
			modelName: 'Budget',
			tableName: 'budgets',
		}
	)
	return Budget
}
