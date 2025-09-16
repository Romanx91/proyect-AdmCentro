'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PropertyType extends Model {
    static associate(models) {
      PropertyType.hasMany(models.Property, { foreignKey: { allowNull: false, }, onUpdate: 'CASCADE', onDelete: 'RESTRICT', });
    }
  }
  PropertyType.init({
    id: {
      primaryKey: true,
      allowNull: false,
      type: DataTypes.BIGINT,
      autoIncrement: true,
    },
    description: {
      type: DataTypes.STRING,
      unique: {
        msg: 'Ya existe una descripción con esas caracteristica.',
      },
      allowNull: false,
      validate: {
        notNull: {
          msg: 'La descripcion no puede ser nula.',
        },
        notEmpty: {
          msg: 'La descripcion no puede ser vacia.'
        },
        len: {
          args: [1, 255],
          msg: 'La descripcion debe tener entre 1 y 255 caracteres.'
        }
      }
    }
  }, {
    sequelize,
    modelName: 'PropertyType',
    tableName: 'propertytypes',
  });
  return PropertyType;
};