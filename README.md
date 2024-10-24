# in-memory-data-service

A concrete implimentation of the abstract data service interface over an array 
of objects.

A couple reasons to use it / a couple reasons I wrote it.

1. Emits events for add, change, and delete events. Handy for caching or kicking off
long running processes.
2. Has hooks for processing records loaded which allows additional data to be
added, data to be removed, encryption/decryption, or recreating the objects as 
a certain class before returning them.
3. A little help in querying by id.
4. A nice starting point to create complex services objects.
6. By default adds a unique id so that it's more consistent and the objects more
referenceable in data stores which don't have mongo's strong unique keys.



## Install

```
npm i @dankolz/in-memory-data-service
```

## Usage

An in memory store like this will have both light and heavy-weight use cases. By default,
the code is going to use the lightest weight, which really only supports searching on id.

```js
import InMemoryDataService from '@dankolz/in-memory-data-service'

let serv = new InMemoryDataService()

let dat = {
	msg: 'hello'
}
let [r] = await serv.save(dat)
let result = await serv.fetchOne(r.id)
// r === result

```

A version which uses [sift](https://www.npmjs.com/package/sift) is also available. It lets you query
with what is essentially MongoDB's query format. Sift is a few hundred kilobytes in size, essentially
nothing on the server, but maybe a little too heavy in the browser.

```js
import InMemoryDataService from '@dankolz/in-memory-data-service/lib/in-memory-data-service-sift.mjs'
```

Additionally, you can easily pass in code to filter based on the query.

```js
import InMemoryDataService from '@dankolz/in-memory-data-service'

let serv = new InMemoryDataService({
	filterGenerator: function(query) {
		query = query.id || query
		return function(item) {
			if(item.msg && item.msg.indexOf(query) > -1) {
				return true
			}
			return false
		}
	}
})
let results = await serv.fetch('hel')
let result = await serv.fetchOne('hel')
```

(Note: `fetchOne` may turn a simple string query into a structured query to find an id)

It's also possible to have an in-memory service over an existing array.

```js
let dat = {
	id: '12'
	, msg: 'hello'
}
let data = [dat]
let serv = new InMemoryDataService({
	collections: {
		default: data
	}
})
```



### Data persistence usage

The `save` call returns a promise which resolves to an array of objects. The first is the
saved object (including any id attributes added). The second is the native result that
mongodb returns. Save works for both insertion and document update, deciding which to
use on the basis of the existance of the _id attribute.


```
let [r] = await dataService.save({msg: 'hello world'})
```

Loading a record by id is straightfoward. The method accepts a BSON ObjectId, a string
which it will try to turn into an ObjectId, the unique identifier string it creates and
assigns to the id attribute, or a normal mongo query. If an object is passed as a query
it won't even attempt to do any of the id processing stuff.


```
let result = await dataService.fetchOne(r.id)
result = await dataService.fetchOne(r._id)
```

Getting multiple results is almost exactly like mongo. Pass an object as a query, get an
array of matches back, or an empty array of there are no matches.


```
result = await dataService.fetch({name: 'Kolz'})
```

Loading multiple objects by id with the sort of help given with the fetchOne function is
like:


```
result = await dataService.fetch(dataService.createIdQuery(['abc', '123']))
```

Saving multiple objects has the save behavior as calling `save` in a loop. It returns an
array of promises, each of the type returned by `save`.

```
let promises = dataService.saveMany([
	{msg: 'hello'}
	, {msg: 'world'}
])
await Promise.all(promises)
```



### Events usuage

Add a listenter to the emitter:

```
events.on('object-change', (one, two) => {
	console.log(`object change: ${JSON.stringify(one)} ${two}`)
})
```
