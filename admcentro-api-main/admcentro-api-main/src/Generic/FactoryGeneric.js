const { catchAsync } = require('../../helpers/catchAsync')
const { Op } = require('sequelize')

const filterFields = (obj, allowedFields) => {
	const newObj = {}
	Object.keys(obj).forEach((el) => {
		if (allowedFields.includes(el)) newObj[el] = obj[el]
	})
	return newObj
}

exports.all = (Model, opts = null) =>
	catchAsync(async (req, res) => {
		var order = null
		if (opts && req.query.include === undefined ? true : false) {
			var { include } = opts
		}
		if (opts && opts.order !== undefined) {
			order = opts.order
		}
		const queryFiltered = {
			...req.query,
		}
		const excludeFields = ['page', 'sort', 'limit', 'fields', 'include']
		excludeFields.forEach((el) => delete queryFiltered[el])
		let options = {
			...queryFiltered,
		}

		Object.keys(queryFiltered).map((k) => {
			if (queryFiltered[k].toString().split(':').length > 1) {
				let val = queryFiltered[k].toString().split(':')
				switch (val[1]) {
					case 'like':
						options[`${k}`] = {
							[Op.substring]: val[0],
						}
						break
					case 'eq':
						options[`${k}`] = {
							[eq.eq]: val[0],
						}
						break
					case 'ne':
						options[`${k}`] = {
							[Op.ne]: val[0],
						}
						break
					case 'gt':
						options[`${k}`] = {
							[Op.gt]: Number(val[0]),
						}
						break
					case 'gte':
						options[`${k}`] = {
							[Op.gte]: Number(val[0]),
						}
						break
					case 'lt':
						options[`${k}`] = {
							[Op.lt]: Number(val[0]),
						}
						break
					case 'lte':
						options[`${k}`] = {
							[Op.lte]: Number(val[0]),
						}
						break
					case 'between':
						options[`${k}`] = {
							[Op.between]: val[0].split(',').map((i) => Number(i)),
						}
						break
					case 'or':
						options[`${k}`] = {
							[Op.or]: val[0].split(',').map((i) => (typeof i === 'number' ? Number(i) : i)),
						}
						break
					case 'and':
						options[`${k}`] = {
							[Op.and]: val[0].split(',').map((i) => (typeof i === 'number' ? Number(i) : i)),
						}
						break
					case 'notBetween':
						options[`${k}`] = {
							[Op.notBetween]: val[0].split(',').map((i) => Number(i)),
						}
						break
					case 'in':
						options[`${k}`] = {
							[Op.in]: val[0].split(',').map((i) => (typeof i === 'number' ? Number(i) : i)),
						}
						break
					case 'notIn':
						options[`${k}`] = {
							[Op.notIn]: val[0].split(',').map((i) => (typeof i === 'number' ? Number(i) : i)),
						}
						break
					default:
						break
				}
			}
		})

		const docs = await Model.findAll({
			where: options,
			include,
			attributes: req.query.fields
				? req.query.fields
					.toString()
					.split(',')
					.map((el) => (el.includes(':') ? el.split(':') : el))
				: '',
			order: order != null ? order :
				req.query.sort !== undefined
					? req.query.sort
						.toString()
						.split(',')
						.map((el) => el.split(':'))
					: [['id', 'desc']],
		})
		return res.json({
			results: docs.length,
			code: 200,
			status: 'success',
			ok: true,
			data: docs,
		})
	})

exports.paginate = (Model) =>
	catchAsync(async (req, res, next) => {
		if (!req.query.limit || !req.query.page)
			return next(new Error('El parametro limit y/o page es obligatorio para usar este metodo!'))

		const queryFiltered = {
			...req.query,
		}

		const excludeFields = ['page', 'sort', 'limit', 'fields']
		excludeFields.forEach((el) => delete queryFiltered[el])
		const page = parseInt(req.query.page) * 1 || 1
		const limit = parseInt(req.query.limit) * 1 || 50
		const offset = (page - 1) * limit
		const docs = await Model.findAll({
			where: queryFiltered,
			limit,
			offset,
			attributes: req.query.fields
				? req.query.fields
					.toString()
					.split(',')
					.map((el) => (el.includes(':') ? el.split(':') : el))
				: '',
			order:
				req.query.sort !== undefined
					? req.query.sort
						.toString()
						.split(',')
						.map((el) => el.split(':'))
					: [['id', 'desc']],
		})

		return res.json({
			results: docs.length,
			code: 200,
			status: 'success',
			ok: true,
			page,
			offset,
			data: docs,
		})
	})

exports.findOne = (Model, opts = null) =>
	catchAsync(async (req, res, next) => {
		if (opts) {
			var { include } = opts
		}
		const doc = await Model.findOne({
			where: {
				id: req.params.id,
			},
			include,
			attributes: req.query.fields
				? req.query.fields
					.toString()
					.split(',')
					.map((el) => (el.includes(':') ? el.split(':') : el))
				: '',
		})
		if (!doc) return next(new Error(`No hay registro para el ${req.params.id}`))
		return res.json({
			code: 200,
			status: 'success',
			ok: true,
			data: doc,
		})
	})

exports.create = (Model, allowedFileds) =>
	catchAsync(async (req, res) => {
		const insertedFileds = filterFields(req.body, allowedFileds)
		const doc = await Model.create(insertedFileds)
		return res.json({
			code: 200,
			status: 'success',
			ok: true,
			message: 'El registro fue guardado con exito',
			data: doc,
		})
	})

exports.bulk = (Model) =>
	catchAsync(async (req, res) => {
		const doc = await Model.bulkCreate(req.body)
		return res.json({
			code: 200,
			status: 'success',
			ok: true,
			message: 'Los registros fueron guardados con exito',
			data: doc,
		})
	})

exports.update = (Model, allowedFileds) =>
	catchAsync(async (req, res, next) => {
		const insertedFileds = filterFields(req.body, allowedFileds)
		const doc = await Model.update(insertedFileds, {
			where: {
				id: req.params.id,
			},
		})
		if (doc[0] <= 0)
			return next(new Error('No hay registro(s) con id : ' + req.params.id + ' o no se actualizó ningún registro.'))
		return res.json({
			status: 'success',
			code: 200,
			ok: true,
			message: 'El registro fue actualizado con exito',
		})
	})

exports.down = (Model) =>
	catchAsync(async (req, res, next) => {
		const doc = await Model.update(
			{
				state: 2,
			},
			{
				where: {
					id: req.params.id,
				},
			}
		)
		if (doc[0] <= 0) return next(new Error('No hay registro con id : ' + req.params.id))
		return res.json({
			code: 200,
			status: 'success',
			ok: true,
			message: 'El registro fue actualizado con exito',
			data: null,
		})
	})

exports.up = (Model) =>
	catchAsync(async (req, res, next) => {
		const doc = await Model.update(
			{
				state: 1,
			},
			{
				where: {
					id: req.params.id,
				},
			}
		)
		if (doc[0] <= 0) return next(new Error('No hay registro con id : ' + req.params.id))
		return res.json({
			status: 'success',
			code: 200,
			ok: true,
			message: 'El registro fue actualizado con exito',
		})
	})

exports.destroy = (Model) =>
	catchAsync(async (req, res, next) => {
		const doc = await Model.destroy({
			where: {
				id: req.params.id,
			},
		})
		if (doc <= 0) return next(new Error('No hay registro con id : ' + req.params.id))
		return res.status(200).json({
			code: 200,
			status: 'success',
			ok: true,
			message: 'El registro fue borrado con exito',
			data: null,
		})
	})
