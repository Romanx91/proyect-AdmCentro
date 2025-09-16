const router = require('express').Router()
const ctrl = require('../controller/debtOwner.controller')
const validador = require('../../helpers/validador')
const jc = require('../controller/jobs.controller')

router.use(validador.protect)
router.get('/', ctrl.GetAll)
//Get by id
router.get('/:id', ctrl.GetById)

//Create
router.post('/', ctrl.Post)
router.post('/job/monthly', jc.jobDebtsOwner)

//Update
router.put('/:id', ctrl.Put)

//Delete
router.delete('/:id', ctrl.Destroy)
module.exports = router
