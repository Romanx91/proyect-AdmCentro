const router = require('express').Router()
const ctrl = require('../controller/jobs.controller')

//Create
router.post('/expiring-contracts', ctrl.noticeExpiringContracts)
router.post('/debts', ctrl.noticeDebts)

router.get('/mails-jobs', ctrl.GetAll)


module.exports = router
