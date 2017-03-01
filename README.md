# pouchdb-vue

Live and reactive PouchDB bindings for Vuejs with **Mango Queries** 👌👌👌

## Example

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
            return {age: this.age}
          }
          // You can also specify the database (local or remote) dynamically, as well as limit, skip and sort order:
          peopleInOtherDatabase: function() {
            database: this.selectedDatabase, // You can pass either a database name, or a pouchdb instance.
            selector: {type: "person"},
            sort: {name: 1},
            limit: this.resultsPerPage,
            skip: this.resultsPerPage * (this.currentPage - 1)
          }
        }
      })
    </script>

## Installation

Install via npm:

    npm install --save pouchdb-vue

The only requirement is that PouchDB is available on the global object with the `pouchdb-live-find` plugin installed:

    PouchDB = require('pouchdb-browser');
    PouchDB.plugin(require('pouchdb-find'));
    PouchDB.plugin(require('pouchdb-live-find'));
    
Then, plug `pouchdb-vue` into Vue:

    PouchDBVue = require(`pouchdb-vue`)
    Vue.use(PouchDBVue)

## Configuration

Instead of passing a database name with every reactive property, you can also set a global "default" database:

    PouchDBVue.defaults.database = new PouchDB('default-db', {options...})
    // or
    PouchDBVue.defaults.database = 'mydb'
