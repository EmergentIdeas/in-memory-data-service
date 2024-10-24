
function filterGenerator(query) {
	return function(item) {
		if(!query) {
			return true
		}
		if(!item) {
			return false
		}
		if(typeof query == 'string') {
			return item._id == query || item.id == query
		}
		return item._id == query._id || item.id == query.id
	}
}

export default filterGenerator