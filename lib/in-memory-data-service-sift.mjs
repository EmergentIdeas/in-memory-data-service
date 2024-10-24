import sift from 'sift'
import InMemoryDataService from './in-memory-data-service.mjs'

export default class SiftMemoryService extends InMemoryDataService {
	constructor(options) {
		super(options)

		if (!options.filterGenerator) {
			this.filterGenerator = sift
		}
	}

	/**
	 * Creates an object to query the db by an object's ID
	 * @param {*} id 
	 * @returns 
	 */
	createIdQuery(id) {
		if (Array.isArray(id)) {
			return id.map(this.createIdQuery)
		}
		if (typeof id === 'string') {
			return {
				$or: [{
					_id: id
				}
				, {
					id: id
				}]
			}
		}
		return id
	}

}