var router = require('express').Router()
const ctrlJobs = require("./../controller/jobs.controller");

router.use('/api/v1/paymenttypes', require('../route/paymenttype.router'))
router.use('/api/v1/zones', require('../route/zone.router'))
router.use('/api/v1/auth', require('../route/auth.router'))
router.use('/api/v1/propertytypes', require('../route/propertyType.router'))
router.use('/api/v1/owners', require('../route/owner.router'))
router.use('/api/v1/clients', require('../route/client.router'))
router.use('/api/v1/properties', require('../route/property.router'))
router.use('/api/v1/contracts', require('../route/contract.router'))
router.use('/api/v1/eventualities', require('../route/eventuality.router'))
router.use('/api/v1/price-historial', require('../route/historyPrice.router'))
router.use('/api/v1/assurances', require('../route/assurance.router'))
router.use('/api/v1/visits', require('../route/visit.router'))
router.use('/api/v1/claims', require('../route/claim.router'))
router.use('/api/v1/budgets', require('../route/budget.router'))
router.use('/api/v1/client-expenses', require('../route/clientExpense.router'))
router.use('/api/v1/owner-expenses', require('../route/ownerExpense.router'))
router.use('/api/v1/config', require('../route/config.router'))
router.use('/api/v1/payment-clients', require('../route/paymentClient.router'))
router.use('/api/v1/payment-owners', require('../route/paymentOwner.router'))
router.use('/api/v1/debt-clients', require('../route/debtClient.router'))
router.use('/api/v1/debt-owners', require('../route/debtOwner.router'))


router.post('/api/v1/jobs-debts-clients', ctrlJobs.jobDebtsClients)
router.post('/api/v1/jobs-debts-owners', ctrlJobs.jobDebtsOwner)
router.use('/api/v1/notices', require('../route/notice.router'))

module.exports = router
