'use strict'
const { Model } = require('sequelize')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
module.exports = (sequelize, DataTypes) => {
	class Auth extends Model {
		static associate(models) { }
	}
	Auth.init(
		{
			id: {
				primaryKey: true,
				allowNull: false,
				type: DataTypes.BIGINT,
				autoIncrement: true,
			},
			uuid: {
				type: DataTypes.UUID,
				defaultValue: DataTypes.UUIDV4,
			},
			email: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: {
					// name: 'email',
					msg: 'Ya existe un usuario con ese email.',
				},
				validate: {
					notNull: {
						msg: 'El email no puede ser nulo.',
					},
					notEmpty: {
						msg: 'El email no puede ser vacio.',
					},
					isEmail: {
						msg: 'El email no es válido.',
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
			photo: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			password: {
				type: DataTypes.STRING,
				allowNull: false,
				validate: {
					notNull: {
						msg: 'La contraseña no puede estar nula.',
					},
					notEmpty: {
						msg: 'La contraseña no puede estar vacia.',
					},
				},
			},
			passwordChangedAt: DataTypes.DATE,
			passwordResetToken: DataTypes.STRING,
			passwordResetExpires: DataTypes.DATE,
		},
		{
			sequelize,
			tableName: 'auths',
			modelName: 'Auth',
			// paranoid: true,
		}
	)
	Auth.prototype.changePasswordAfter = function (jwtIat) {
		if (this.passwordChangedAt) {
			const changePassword = parseInt(this.passwordChangedAt.getTime() / 1000, 10)
			return jwtIat < changePassword
		}
		return false
	}
	Auth.beforeCreate(async (auth, options) => {
		auth.password = await bcrypt.hash(auth.password, 12)
	})

	Auth.prototype.checkPassword = async function (userPassword, hash) {
		return await bcrypt.compare(userPassword, hash)
	}
	Auth.prototype.hashPassword = async function (password) {
		return await bcrypt.hash(password, 12);
	};

	Auth.prototype.createPasswordResetToken = function () {
		//create token
		const resetToken = crypto.randomBytes(32).toString('hex')
		//encrypt the token and save to the database
		this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')

		//store the time plus 10 mns to the satabase
		this.passwordResetExpires = Date.now() + 10 * 60 * 1000
		//return the token without encrypt
		return resetToken
	}

	return Auth
}
