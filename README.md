Pssst... I'm not working with Vue anymore. This plugin is old and bad. Here is a better alternative: https://github.com/MDSLKTR/pouch-vue. However, if for whatever reason you find yourself looking at this, please re-evaluate your life choices and look at [Svelte](https://svelte.dev).

# vue-pouch

Reactive Vue bindings for PouchDB using [pouchdb-live-find](https://github.com/colinskow/pouchdb-live-find).


## Examples

### Todo App with real-time 4-way data syncing: DOM <-> Vue <-> IndexedDB <-> CouchDB

Try this example here: https://buhrmi.github.io/vue-pouch/

```vue
<template>
  <div class="todos">
    <input v-model="message" placeholder="New Todo">
    <button @click="$pouch.post('todos', {message: message});message=''">Save Todo</button>
    <div v-for="todo in todos">
      <input v-model="todo.message" @change="$pouch.put('todos', todo)">
      <button @click="$pouch.remove('todos', todo)">Remove</button>
    </div>
  </div>
</template>

<script>
  export default {
    // VuePouch adds a `pouch` config option to all components.
    pouch: {
      // The simplest usage. queries all documents from the "todos" pouch database and assigns them to the "todos" vue property.
      todos: {/*empty selector*/}
    },
    created: function() {
      // Send all documents to the remote database, and stream changes in real-time
      this.$pouch.sync('todos', 'http://localhost:5984/todos');
    }
  }
</script>
```


### Reactive & Live Selectors (Mango Queries)

```vue
<template>
  Show people that are <input v-model="age"> years old.
  <div v-for="person in people">
    {{ person.name }}
  </div>
</template>

<script>
  export default {
    data () {
      return {
        resultsPerPage: 25,
        currentPage: 1
      }
    },
    // Use the pouch property to configure the component to (reactively) read data from pouchdb.
    pouch: {
      // The function returns a Mango-like selector that is run against the `people` database.
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

### Single documents

If you only want to sync a single document that matches a selector, use `first: true`:

```vue
module.exports = {
  // ...
  pouch: {  
    projectDetails: function() {
      return {
        database: 'mydatabase',
        selector: {_id: this.selectedProjectId},
        first: true
      }
    }
  }
  // ...
}
```


## Installation

Install via npm:

    npm install --save vue-pouch

The only requirement is that `pouchdb-live-find` is installed:

    import PouchDB from 'pouchdb-browser'
    PouchDB.plugin(require('pouchdb-find'));
    PouchDB.plugin(require('pouchdb-live-find'));
    
If you want to use remote databases (CouchDB, Cloudant, etc.), you should also install the authentication plugin:

    PouchDB.plugin(require('pouchdb-authentication'));
    
Then, plug VuePouch into Vue:

    Vue.use(require('vue-pouch'), {
      pouch: PouchDB,    // optional if `PouchDB` is available on the global object
      defaultDB:         // the database to use if none is specified in the pouch setting of the vue component
    })

## API

### $pouch

`$pouch` is made available on all vue instances and has some helper functions. Note that this API is not stable and will probably change.

#### Methods

* `$pouch.sync(localDatabase, remoteDatabase)`: Basically the same as PouchDB.sync(local, remote, {live: true, retry: true}). Also, if the browser has an active session cookie, it will fetch session data (username, etc) from the remote server. **BONUS:** If your remote database runs CouchDB 2.0 or higher, you can also specify a Mango Selector that is used to filter documents coming from the remote server.

For example

    $pouch.sync('complaints', 'https:/42.233.1.44/complaints', {
      filter:'_selector',
      selector: {
        type: 'complaint',
        assignee: this.session.name
      }
    })

* `$pouch.push(localDatabase, remoteDatabase)`: Like localdb.replicate.to(remotedb, {live: true, retry: true}). Also, if the browser has an active session cookie, it will fetch session data (username, etc) from the remote server.
* `$pouch.put/post/remove/get(database, ...)`: Same as db.put(...)
* `$pouch.createUser(name, password)`: Create a user in the remote database and also start a new session.
* `$pouch.useAuth(name, password)`: Set credentials to use to start a session with the remote server.
* `$pouch.resetAuth()`: Forgets the credentials, session data and session cookie.

#### Reactive Properties

* `$pouch.loading`: Contains an object with synced database names as the keys. The value of each key is `true` while the initial loading happens. This API is a little bit unreliable at the moment.
* `$pouch.hasAuth`: `true`, if VuePouch has credentials
* `$pouch.authError`: Contains the authentication error, if one occured (eg. when calling useAuth, createUser, etc).
* `$pouch.session`: Contains information about the current session with the remote database (eg. user name, roles, etc.)
* `$pouch.errors`: A json object containing errors that occured on databases. The object key is the name of the database, the value is the error.

#### Non-Reactive Properties

* `vm.$databases`: the pouchdb instances. shared across all components.

