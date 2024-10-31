
import DataService from '@dankolz/abstract-data-service/abstract-data-service.js'
import generateId from '@webhandle/id-generator'
import defaultFilterGenerator from './id-filter-generator.mjs'


export default class InMemoryDataService extends DataService {
	/**
	 * 
	 * @param {object} options
	   * @param {string} [options.serviceName] Sets the name of this service for logging, and possibly other purposes
	   * @param {boolean} [options.useIndependentIds] If true, records will get unique ID strings which are not tied to the underylying datastore
	   * @param {object} options.collections an object holding the arrays this service will use, keyed by object storename
	   * @param {string} [options.collections.default] the default object store name. Technically optional, but the basic functions which
	 * don't require the caller to specify the object store won't work if not set. For this DataService type these should be arrays.
	 * @param {EventEmitter} [options.notification] An EventEmitter that will be notified on create, update, and delete. The notification is:
	 * emit('object-change', { the object }, changeType: create, update, delete)
	 * @param {string} [options.eventName] The event name which will be used for the emitter. By default this is 'object-change'.
	 * @param {function} [options.filterGenerator] A function which is passed a query object and returns a function which can be use for
	 * array.filter. Check out the npm package sift as an easy way to do this. If this is null, queries that are not
	 * id queries will fail.
	 * 
	 */
	constructor(options) {
		super(options)
		
		if(!this.collections) {
			this.collections = {
				default: []
			}
		}
		if(!this.collections.default) {
			this.collections.default = []
		}
		
		if(!this.filterGenerator) {
			this.filterGenerator = defaultFilterGenerator
		}
	}
	
	generateId() {
		return generateId()
	}

	/**
	 * Creates an object to query the db by an object's ID
	 * @param {*} id 
	 * @returns 
	 */
	createIdQuery(id) {
		// We do NOT want to transform this into a more complex object because there's
		// no piece of code which knows how to interpret it.
		return id
	}

	async _doInternalFetch(collection, query) {
		return new Promise(async (resolve, reject) => {
			if(Array.isArray(query)) {
				let result = []
				try {
					for(let subquery of query) {
						let subresult = await this._doInternalFetch(collection, subquery)
						result.push(...subresult)
					}
				}
				catch(e) {
					return reject(e)
				}
				return resolve(result)
			}
			
			if(!query || Object.keys(query).length == 0) {
				return resolve([...collection])
			}
			
			let filter = this.filterGenerator(query)
			let result = collection.filter(filter)
			resolve(result)
		})
	}

	async _doInternalSave(collection, focus) {
		let p = new Promise(async (resolve, reject) => {
			let type = 'update'
			if(!focus._id) {
				focus._id = this.generateId()
				type = 'create'
			}
			else {
				await this._doInternalRemove(collection, focus._id)
			}
			collection.push(focus)
			return resolve([focus, type, null])
		})
		return p
	}

	async _doInternalRemove(collection, query) {
		return new Promise(async (resolve, reject) => {
			let matchedRecords = await this._doInternalFetch(collection, query)
			for(let found of matchedRecords) {
				for(let i = 0; i < collection.length; i++) {
					if(collection[i]._id == found._id || collection[i].id == found.id) {
						collection.splice(i, 1)
						break;
					}
				}

			}

			resolve(query)
		})
	}
}
