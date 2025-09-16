const { catchAsync } = require('../../helpers/catchAsync')
const { cloudinary } = require('../../helpers/cloudinary')
const { Budget, Property } = require('../../models')
const { all, paginate, create, findOne, update, destroy } = require('../Generic/FactoryGeneric')

const allowedFields = ['PropertyId', 'type', 'description', 'category', 'photo', 'approved', 'state', 'charged', 'belongsTo']

exports.uploadPhoto = catchAsync(async (req, res, next) => {
    if (!req.body.photo || req.body.photo === null || req.body?.photo.length < 300) return next()
    const imagePath = req.body.photo
    const options = { use_filename: true, unique_filename: false, overwrite: true, format: 'png', }
    try {
        const result = await cloudinary.uploader.upload(imagePath, {
            public_id: `budget_${req.body.PropertyId}_${Date.now()}`,
            folder: process.env.FOLDER_BUDGETS,
            ...options
        })
        req.body.photo = result.secure_url
        next()

    } catch (error) {
        return res.json(
            {
                ok: false,
                code: 500,
                status: "error",
                message: "Error al subir la imagen",
                error
            }
        )
    }
})

exports.GetAll = all(Budget, { include: [{ model: Property, attributes: ['id', 'street', 'number', 'dept', 'floor'] }] })
exports.Paginate = paginate(Budget)
exports.Create = create(Budget, allowedFields)
exports.GetById = findOne(Budget)
exports.Put = update(Budget, allowedFields)



exports.Destroy = catchAsync(async (req, res, next) => {

    if (!req.params.id) return next(new AppError('El id es obligatorio para eliminar un presupuesto', 404))
    const budget = await Budget.findByPk(req.params.id)
    if (!budget) return next(new AppError('No se encontro el presupuesto', 404))

    if (budget.photo?.length) {
        try {
            await cloudinary.uploader.destroy(budget.photo.split('/').slice(7).join('/').split('.')[0])
        } catch (error) {
            return res.json(
                {
                    ok: false,
                    code: 500,
                    status: "error",
                    message: "Error al borrar la imagen",
                    error
                }
            )
        }
    }
    await budget.destroy()
    return res.json(
        {
            ok: true,
            status: 'success',
            code: 200,
            message: 'Presupuesto eliminado correctamente',
        })
})
