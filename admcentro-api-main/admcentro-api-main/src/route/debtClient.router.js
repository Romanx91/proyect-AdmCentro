const router = require('express').Router()
const ctrl = require('../controller/debtClient.controller')
const jc = require('../controller/jobs.controller')
const validador = require('../../helpers/validador')


router.use(validador.protect)
router.get('/', ctrl.GetAll)
//Get by id
router.get('/:id', ctrl.GetById)

//Create
router.post('/', ctrl.Post)
router.post('/job/monthly', jc.jobDebtsClients)


//Update
router.put('/:id', ctrl.Put)

//Delete
router.delete('/:id', ctrl.Destroy)
module.exports = router
