import mocha from 'mocha'
import {expect, assert} from 'chai'
const tu = (one, two) => one * two
import EventEmitter from 'events'

function show(dat) {
	console.log(JSON.stringify(dat, null, '\t'))

}

import InMemoryDataService from '../lib/in-memory-data-service.mjs'
import SiftedService from '../lib/in-memory-data-service-sift.mjs'


describe("basic data operations", async function () {

	it("independent ids", function () {
		let serv = new InMemoryDataService()
		assert.equal(serv.useIndependentIds, true)
		
		let id = serv.generateId()
		assert.isNotNull(id)

		serv = new InMemoryDataService({
			useIndependentIds: false
		})
		assert.equal(serv.useIndependentIds, false)

	})

	it("ops", async function () {
		let p = new Promise(async (resolve, reject) => {
			try {
				let events = new EventEmitter()
				let serv = new InMemoryDataService({
					notification: events
				})
				
				events.on('object-change', (one, two) => {
					console.log(`object change: ${JSON.stringify(one)} ${two}`)
				})

				let dat = {
					msg: 'hello'
				}
				let [r] = await serv.save(Object.assign({}, dat))
				assert.isNotNull(r._id)
				// Make sure we have an independent id
				assert.isNotNull(r.id)
				let id = r._id
				let id2 = r.id

				let result = await serv.fetch()
				assert.equal(result.length, 1)

				result = await serv.fetchOne(id)
				assert.equal(result.msg, 'hello')

				result = await serv.fetchOne(id.toString())
				assert.equal(result.msg, 'hello')
				
				result.msg = 'hi'
				await serv.save(result)
				
				result = await serv.fetchOne(id.toString())
				assert.equal(result.msg, 'hi')

				result = await serv.fetchOne({id: id2})
				assert.equal(result.msg, 'hi')

				result = await serv.fetchOne(id2)
				assert.equal(result.msg, 'hi')

				result = await serv.remove(id.toString())

				result = await serv.fetchOne(id.toString())
				assert.isNull(result)
				
				
				let promises = serv.saveMany([
					{msg: 'hello'}
					, {msg: 'world'}
				])
				await Promise.all(promises)

				result = await serv.fetch()
				assert.equal(result.length, 2)
				
				let ids = result.map(item => item.id)
				let ids2 = result.map(item => item._id.toString())
				
				result = await serv.fetch({})
				assert.equal(result.length, 2)
				
				result = await serv.fetchOne(ids)
				assert.isNotNull(result)

				result = await serv.fetchOne(ids2)
				assert.isNotNull(result)
				
				result = await serv.fetch(serv.createIdQuery(ids))
				assert.equal(result.length, 2)

				result = await serv.fetch(serv.createIdQuery(ids2))
				assert.equal(result.length, 2)
				
				result = await serv.fetch({name: 'Kolz'})
				assert.equal(result.length, 0)


				// with independent ids turned off
				serv.useIndependentIds = false
				let native
				[r, native] = await serv.save({msg: 'world'})
				assert.isNotNull(r._id)
				// Make sure we don't have an independent id
				assert.isUndefined(r.id)
				

			}
			catch(e) {
				console.log(e)
				return reject('error')
			}
			resolve()
		})
		return p
	})
	it("ops with sift", async function () {
		let p = new Promise(async (resolve, reject) => {
			try {
				let events = new EventEmitter()
				let serv = new InMemoryDataService({
					notification: events
				})
				
				events.on('object-change', (one, two) => {
					console.log(`object change: ${JSON.stringify(one)} ${two}`)
				})

				let dat = {
					msg: 'hello'
				}
				
				
				
				
				
				serv = new SiftedService({
					notification: events
				})


				let [r] = await serv.save(Object.assign({}, dat))
				assert.isNotNull(r._id)
				// Make sure we have an independent id
				assert.isNotNull(r.id)
				let id = r._id
				let id2 = r.id

				let result = await serv.fetch()
				assert.equal(result.length, 1)

				result = await serv.fetchOne(id)
				assert.equal(result.msg, 'hello')

				result = await serv.fetchOne(id.toString())
				assert.equal(result.msg, 'hello')
				
				
				result = await serv.fetchOne({msg: 'hello'})
				assert.equal(result.msg, 'hello')
				
				result = await serv.fetchOne({msg: 'hello!'})
				assert.isNull(result)
				
				result = await serv.fetchOne({msg: /hel/})
				assert.equal(result.msg, 'hello')
				
				

			}
			catch(e) {
				console.log(e)
				return reject('error')
			}
			resolve()
		})
		return p
	})
	it("ops with custom", async function () {
		let p = new Promise(async (resolve, reject) => {
			try {
				let events = new EventEmitter()
				let serv = new InMemoryDataService({
					notification: events
					, filterGenerator: function(query) {
						query = query.id || query
						return function(item) {
							if(item.msg && item.msg.indexOf(query) > -1) {
								return true
							}
							return false
						}
					}
				})
				
				let dat = {
					msg: 'hello'
				}
				
				let [r] = await serv.save(Object.assign({}, dat))
				assert.isNotNull(r._id)
				// Make sure we have an independent id
				assert.isNotNull(r.id)
				let id = r._id
				let id2 = r.id

				let result = await serv.fetch()
				assert.equal(result.length, 1)

				result = await serv.fetch(id)
				assert.equal(result.length, 0)

				result = (await serv.fetch('hel'))[0]
				assert.equal(result.msg, 'hello')

				result = await serv.fetchOne('hel')
				assert.equal(result.msg, 'hello')
			}
			catch(e) {
				console.log(e)
				return reject('error')
			}
			resolve()
		})
		return p
	})
	it("ops with custom and starting data", async function () {
		let p = new Promise(async (resolve, reject) => {
			try {
				let dat = {
					id: '12'
					, msg: 'hello'
				}
				let id = '12'
				let events = new EventEmitter()
				let serv = new InMemoryDataService({
					notification: events
					, filterGenerator: function(query) {
						query = query.id || query
						return function(item) {
							if(item.msg && item.msg.indexOf(query) > -1) {
								return true
							}
							return false
						}
					}
					, collections: {
						default: [dat]
					}
				})
				

				let result = await serv.fetch()
				assert.equal(result.length, 1)

				result = await serv.fetch(id)
				assert.equal(result.length, 0)

				result = (await serv.fetch('hel'))[0]
				assert.equal(result.msg, 'hello')

				result = await serv.fetchOne('hel')
				assert.equal(result.msg, 'hello')
			}
			catch(e) {
				console.log(e)
				return reject('error')
			}
			resolve()
		})
		return p
	})
})