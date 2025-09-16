const dotenv = require('dotenv')
const express = require('express')
const helmet = require('helmet')
const morgan = require('morgan')
const cors = require('cors')
const schedule = require('node-schedule')
// const rateLimit = require("express-rate-limit");
const bodyParser = require('body-parser')
// const axios = require("axios");

dotenv.config()

const { globalError } = require('./Generic/errorGeneric')
const routeconfig = require('./routeconfig/config')
const jobs = require('./controller/jobs.controller')
// const { catchAsync } = require("../helpers/catchAsync");
// const {
//   Zone,
//   Auth,
//   Contract,
//   Client,
//   Assurance,
//   ClientExpense,
//   OwnerExpense,
//   Property,
//   PriceHistorial,
//   Config,
//   PaymentType,
//   PropertyType,
//   Owner,
//   Claim,
//   Visit,
//   DebtOwner,
//   DebtClient,
//   sequelize,
//   Eventuality, } = require('../models');
const { sequelize } = require('../models')

const app = express()

app.use(morgan('dev'))

const Port = 4000
app.set('port', process.env.PORT || Port)
app.use(express.static(__dirname + '/uploads'))
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', parameterLimit: 100000, extended: true }))
var corsOptions = { origin: '*', optionsSuccessStatus: 200 }
app.use(cors(corsOptions))
app.use(helmet())
app.use(express.json())

//Routes
app.use(routeconfig)

// const baseURL = 'http://vps-3272208-x.dattaweb.com:4000/api/v1'

// app.get("/api/v1/migration-from-prod", catchAsync(async (req, res, next) => {
//   const http = axios.create({
//     baseURL,
//     headers: {
//       'Content-type': 'application/json',
//       Authorization: 'Bearer ' + process.env.TOKEN_PROD_MIGRATION,
//     },
//   })
//   const auths = await http.get('/auth')
//   const zones = await http.get('/zones')
//   const paymentTypes = await http.get('/paymenttypes')
//   const propertytypes = await http.get('/propertytypes')
//   const config = await http.get('/config')
//   const owners = await http.get('/owners')
//   const clients = await http.get('/clients')
//   const properties = await http.get('/properties')
//   const contracts = await http.get('/contracts')
//   const visits = await http.get('/visits')
//   const claims = await http.get('/claims')
//   auths.data.data.map(async (auth) => { await Auth.create(auth,) })
//   zones.data.data.map(async (zone) => { await Zone.create(zone,) })
//   paymentTypes.data.data.map(async (paymentType) => { await PaymentType.create(paymentType,) })
//   propertytypes.data.data.map(async (propertytype) => { await PropertyType.create(propertytype,) })
//   config.data.data.map(async (config) => { await Config.create(config,) })
//   owners.data.data.map(async (owner) => { await Owner.create(owner,) })
//   clients.data.data.map(async (client) => { await Client.create(client,) })
//   properties.data.data.map(async (property) => { await Property.create(property,) })
//   visits.data.data.map(async (visit) => { await Visit.create(visit,) })
//   claims.data.data.map(async (claim) => { await Claim.create(claim,) })
//   contracts.data.data.map(async (contract) => {

//     const newContract = await Contract.create(contract)
//     contract.Assurances.map(async (assurance) => { await Assurance.create({ ...assurance }) })
//     contract.PriceHistorials.map(async (priceHistorial) => { await PriceHistorial.create({ ...priceHistorial }) })

//     // const assurances = await http.get(`/assurances?contractId=${contract.id}`)
//     // assurances.data.data.map(async (assurance) => { await Assurance.create({ ...assurance, contractId: newContract.id, }) })
//     // const priceHistorials = await http.get(`/pricehistorials?contractId=${contract.id}`)
//     // const debtOwners = await http.get(`/debtowners?contractId=${contract.id}`)
//     // debtOwners.data.data.map(async (debtOwner) => { await DebtOwner.create({ ...debtOwner, contractId: newContract.id, }) })
//     // const debtClients = await http.get(`/debtclients?contractId=${contract.id}`)
//     // debtClients.data.data.map(async (debtClient) => { await DebtClient.create({ ...debtClient, contractId: newContract.id, }) })
//     const clientExpenses = await http.get(`/client-expenses?ContractId=${contract.id}`)
//     clientExpenses.data.data.map(async (clientExpense) => { await ClientExpense.create({ ...clientExpense }) })
//     const ownerExpenses = await http.get(`/owner-expenses?contractId=${contract.id}`)
//     ownerExpenses.data.data.map(async (ownerExpense) => { await OwnerExpense.create({ ...ownerExpense }) })

//     const eventualities = await http.get(`/eventualities?ContractId=${contract.id}`)
//     eventualities.data.data.map(async (eventuality) => { await Eventuality.create({ ...eventuality, PropertyId: contract.PropertyId, isReverted: false }) })

//   })

//   return res.json({
//     zones: zones.data.results,
//     paymentTypes: paymentTypes.data.results,
//     propertytypes: propertytypes.data.results,
//     config: config.data.results,
//     owners: owners.data.results,
//     clients: clients.data.results,
//     properties: properties.data.results,
//     contracts: contracts.data.results,
//     cont: contracts.data.data,
//     visits: visits.data.data,
//     claims: claims.data.data
//   });
//   // const result = await sequelize.transaction(async (t) => { });

// }));

app.all('*', (req, res, next) => res.json(next(new Error(`can´t find the url ${req.originalUrl} for this server...`))))

//Global error
app.use(globalError)

// * * * * * -- para ejecutar a cada minuto
// 0 0 1 * * --  se ejecutara todo el primer dia de cada mes a las 12:00 am

schedule.scheduleJob('0 0 1 * *', function () {
  jobs.jobDebtsClients()
  jobs.jobDebtsOwner()
})

schedule.scheduleJob('0 0 2 * *', function () {
  jobs.noticeExpiringContracts()
  jobs.noticeDebts()
})

// if (process.env.NODE_ENV !== 'production') {
//   schedule.scheduleJob('* * * * *', function () {
//     jobs.jobDebtsClients()
//     jobs.jobDebtsOwner()
//   })
// }

//Starting
app.listen(app.get('port'), () => {
  console.log('APP RUNNING ON PORT : ', app.get('port'), '  MODE : ', process.env.NODE_ENV)
  // if (process.env.NODE_ENV !== 'production') {
  // sequelize
  //   .sync({ alter: true, })
  //   .then(() => { console.log('DB IS CONNECTED.') })
  //   .catch((err) => { console.log(err) })
  // }
})

//   TODO:  add restrictions
