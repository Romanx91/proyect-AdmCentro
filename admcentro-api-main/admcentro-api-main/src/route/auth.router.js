const router = require('express').Router()
const ctrl = require('../controller/auth.controller')
const validador = require('../../helpers/validador')

router.post('/', ctrl.SignUp)
router.post('/signin', ctrl.SignIn)
router.post('/check-token', ctrl.checkToken)
router.post('/forgot-password', ctrl.forgotPassword)
router.patch('/reset-password/:token', ctrl.resetPassword)

router.use(validador.protect)

router.get('/', ctrl.GetAll)
//Get by id
router.get('/:id', ctrl.GetById)

//Create
// router.post('/', ctrl.SignUp);

router.delete('/:id', ctrl.updatePassword)

module.exports = router
