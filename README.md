# vue-pouch

Live and reactive PouchDB bindings for Vuejs with **[Mango Queries](http://docs.couchdb.org/en/2.0.0/api/database/find.html)** 👌👌👌

![If you have Pouch and Vue, you have Pouch and Vue](https://github.com/QurateInc/vue-pouch/blob/master/vue-pouch.png)

Refer to https://github.com/nolanlawson/pouchdb-find for documentation on the query structure and a guide on how to create indexes.

## Example

```vue
<template>
  Show people that are <input v-model="age"> years old.
  <div v-for="person in people">
    {{ person.name }}
  </div>
</template>

<script>
  new Vue({
    data: function() {
      return {
        resultsPerPage: 25,
        currentPage: 1
      }
    },
    // Use the pouch property to configure the component to (reactively) read data from pouchdb.
    pouch: {
      // The function returns a Mango-like selector that is run against a pre-configured default database.
      // The result of the query is assigned to the `people` property.
      people: function() {
        if (!this.age) return;
        return {age: this.age, type: "person"}
      },
      // You can also specify the database dynamically (local or remote), as well as limits, skip and sort order:
      peopleInOtherDatabase: function() {
        return {
          database: this.selectedDatabase, // you can pass a database string or a pouchdb instance
          selector: {type: "person"},
          sort: [{name: "asc"}],
          limit: this.resultsPerPage,
          skip: this.resultsPerPage * (this.currentPage - 1)
        }
      }
    }
  })
</script>
```

## Installation

Install via npm:

    npm install --save vue-pouch

The only requirement is that `pouchdb-live-find` is installed:

    let PouchDB = require('pouchdb-browser');
    PouchDB.plugin(require('pouchdb-find'));
    PouchDB.plugin(require('pouchdb-live-find'));
    
Then, plug `vue-pouch` into Vue:

    Vue.use(require('vue-pouch'), {
      pouch: PouchDB,    // optional if `PouchDB` is available on the global object
      defaultDB: someDB  // optional, database name (string) or a PouchDB instance
    })

## Todo

* [ ] Forward errors (no connection, unauthorized, etc) to vue component
* [ ] Set up and tear down database syncing in pouch config options
* [ ] Reactive properties that indicate a *loading*, *ready* and *error* state
